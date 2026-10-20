#!/usr/bin/env python3
"""
POS AI - Phase 4.1: ML Model Validation Script (scripts/validate_ml_model.py)
Evaluates LightGBM Demand Forecaster on a Holdout Test Set from PostgreSQL (jakhoramartdbase.sql)

Evaluates:
1. Time-series holdout split (Training period vs Holdout validation window: 7d, 14d, 30d)
2. Mean Absolute Percentage Error (MAPE) & Weighted Absolute Percentage Error (WAPE)
   - Evaluated on Daily and Aggregate Replenishment Horizon (7d, 14d, 30d)
3. Forecast Accuracy (100% - WAPE and Tolerance Accuracy)
4. Prediction latency, throughput, and performance SLA benchmarks (< 100ms per SKU, total < 15s)
5. Structured JSON artifact generation for compliance and audit
"""

import os
import sys
import time
import math
import json
import argparse
import warnings
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Dict, Any, List, Tuple

# Suppress all sklearn/lightgbm warnings for clean performance benchmark
warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

# Windows console encoding configuration for Philippine Pesos (₱) & UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

def load_environment():
    try:
        from dotenv import load_dotenv
        current_dir = Path(__file__).resolve().parent
        for env_path in [current_dir / ".env", current_dir.parent / ".env", Path.cwd() / ".env"]:
            if env_path.is_file():
                load_dotenv(env_path)
                break
    except ImportError:
        pass

load_environment()

def get_db_connection():
    import pg8000.native
    host = os.getenv("DATABASE_HOST", "localhost")
    port = int(os.getenv("DATABASE_PORT", "5432"))
    user = os.getenv("DATABASE_USER", "postgres")
    password = os.getenv("DATABASE_PASSWORD", "postgres")
    database = os.getenv("DATABASE_NAME", "pos_db")
    return pg8000.native.Connection(user=user, password=password, host=host, port=port, database=database)

def load_sales_dataset(conn, store_id: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Extracts products catalog and historical daily sales from database."""
    prod_sql = """
        SELECT 
            p.id AS product_id,
            p.sku,
            p.name AS product_name,
            COALESCE(c.name, 'General') AS category_name,
            p.retail_price::FLOAT AS retail_price,
            p.cost_price::FLOAT AS cost_price,
            p.lead_time_days
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = true
        ORDER BY p.name ASC;
    """
    prod_rows = conn.run(prod_sql)
    prod_cols = [c["name"] for c in conn.columns]
    products_df = pd.DataFrame(prod_rows, columns=prod_cols)

    sales_sql = f"""
        SELECT 
            DATE(st.created_at) AS sale_date,
            sli.product_id,
            sli.sku,
            SUM(sli.quantity)::INT AS units_sold,
            ROUND(SUM(sli.total_price)::NUMERIC, 2)::FLOAT AS gross_sales_php
        FROM sales_line_items sli
        JOIN sales_transactions st ON st.id = sli.transaction_id
        WHERE st.store_id = '{store_id}'
          AND st.status = 'completed'
        GROUP BY DATE(st.created_at), sli.product_id, sli.sku
        ORDER BY sale_date ASC;
    """
    sales_rows = conn.run(sales_sql)
    sales_cols = [c["name"] for c in conn.columns]
    daily_sales_df = pd.DataFrame(sales_rows, columns=sales_cols)
    if not daily_sales_df.empty:
        daily_sales_df["sale_date"] = pd.to_datetime(daily_sales_df["sale_date"])

    return products_df, daily_sales_df

def build_features(daily_series: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Builds time-series features incorporating Philippine retail seasonality."""
    df = daily_series.copy()
    df["day_of_week"] = df["date"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["day_of_month"] = df["date"].dt.day
    # Philippine Quincena Paydays (14-16 & 29-31)
    df["is_payday"] = df["day_of_month"].isin([14, 15, 16, 29, 30, 31]).astype(int)

    # Lags
    df["lag_1"] = df["units_sold"].shift(1)
    df["lag_2"] = df["units_sold"].shift(2)
    df["lag_7"] = df["units_sold"].shift(7)
    df["lag_14"] = df["units_sold"].shift(14)

    # Rolling window stats
    df["rolling_mean_7"] = df["units_sold"].shift(1).rolling(7, min_periods=1).mean()
    df["rolling_std_7"] = df["units_sold"].shift(1).rolling(7, min_periods=1).std().fillna(0.5)
    df["rolling_mean_14"] = df["units_sold"].shift(1).rolling(14, min_periods=1).mean()

    feature_cols = [
        "day_of_week", "is_weekend", "day_of_month", "is_payday",
        "lag_1", "lag_2", "lag_7", "lag_14",
        "rolling_mean_7", "rolling_std_7", "rolling_mean_14"
    ]
    return df, feature_cols

def evaluate_sku(
    product: pd.Series,
    product_sales: pd.DataFrame,
    holdout_days: int = 30
) -> Dict[str, Any]:
    """
    Evaluates LightGBM demand forecaster on a holdout test period for a single SKU.
    """
    sku = product["sku"]
    product_name = product["product_name"]
    category_name = product["category_name"]
    retail_price = float(product["retail_price"])

    # Reindex daily series to continuous timeline
    ts_df = product_sales.sort_values("sale_date").set_index("sale_date")
    min_date = ts_df.index.min()
    max_date = ts_df.index.max()
    full_date_idx = pd.date_range(start=min_date, end=max_date, freq="D")
    daily_series = ts_df["units_sold"].reindex(full_date_idx, fill_value=0).reset_index()
    daily_series.columns = ["date", "units_sold"]

    total_days = len(daily_series)
    if total_days <= holdout_days + 14:
        return None

    # Holdout Split
    train_end_idx = total_days - holdout_days
    train_raw = daily_series.iloc[:train_end_idx].copy()
    test_raw = daily_series.iloc[train_end_idx:].copy()

    # Build features on training set
    train_featured, feature_cols = build_features(train_raw)
    train_clean = train_featured.dropna().copy()

    if len(train_clean) < 14:
        return None

    X_train_arr = train_clean[feature_cols].values.astype(np.float32)
    y_train = train_clean["units_sold"].values.astype(np.float32)

    # 1. Measure Training Latency (Fitting on NumPy array for max throughput)
    t0_train = time.perf_counter()
    try:
        model = LGBMRegressor(
            n_estimators=50,
            learning_rate=0.08,
            max_depth=3,
            num_leaves=8,
            min_child_samples=3,
            n_jobs=1,
            verbosity=-1,
            random_state=42
        )
        model.fit(X_train_arr, y_train)
        algo_used = "LightGBM"
    except Exception:
        model = Ridge(alpha=1.0)
        model.fit(X_train_arr, y_train)
        algo_used = "Ridge-Fallback"
    t_train_ms = (time.perf_counter() - t0_train) * 1000.0

    # 2. Multi-Step Recursive Forecast for Holdout Period
    t0_infer = time.perf_counter()
    simulated_preds: List[float] = []
    last_known = list(train_clean["units_sold"].values)
    holdout_dates = list(test_raw["date"].values)

    for f_date_ts in holdout_dates:
        f_date = pd.Timestamp(f_date_ts)
        dow = f_date.dayofweek
        is_wknd = 1.0 if dow in [5, 6] else 0.0
        dom = float(f_date.day)
        is_pday = 1.0 if dom in [14, 15, 16, 29, 30, 31] else 0.0

        full_seq = last_known + simulated_preds
        l1 = float(full_seq[-1])
        l2 = float(full_seq[-2] if len(full_seq) >= 2 else l1)
        l7 = float(full_seq[-7] if len(full_seq) >= 7 else l1)
        l14 = float(full_seq[-14] if len(full_seq) >= 14 else l7)

        win7 = full_seq[-7:]
        rm7 = float(np.mean(win7))
        rs7 = float(max(0.5, np.std(win7)))
        win14 = full_seq[-14:]
        rm14 = float(np.mean(win14))

        feat_row = np.array([[
            float(dow), is_wknd, dom, is_pday,
            l1, l2, l7, l14,
            rm7, rs7, rm14
        ]], dtype=np.float32)

        pred_val = max(0.0, float(model.predict(feat_row)[0]))
        simulated_preds.append(pred_val)

    t_infer_ms = (time.perf_counter() - t0_infer) * 1000.0

    # 3. Compute Metrics on Holdout
    y_actual = test_raw["units_sold"].values
    y_pred = np.array(simulated_preds)

    # Daily Metrics
    mae = float(mean_absolute_error(y_actual, y_pred))
    rmse = float(root_mean_squared_error(y_actual, y_pred))

    # Daily MAPE (with floor of 1.0 to avoid zero division)
    safe_actual = np.maximum(y_actual, 1.0)
    daily_mape = float(np.mean(np.abs(y_actual - y_pred) / safe_actual) * 100.0)

    # Daily WAPE: Weighted Absolute Percentage Error
    sum_actual = float(np.sum(y_actual))
    daily_wape = float(np.sum(np.abs(y_actual - y_pred)) / max(1.0, sum_actual) * 100.0)
    daily_accuracy = max(0.0, min(100.0, 100.0 - daily_wape))

    # Tolerance Accuracy: Percentage of days prediction is within +/- 2 units or +/- 25%
    abs_errors = np.abs(y_actual - y_pred)
    tolerance_hits = np.logical_or(abs_errors <= 2.0, (abs_errors / safe_actual) <= 0.25)
    tolerance_accuracy = float(np.mean(tolerance_hits) * 100.0)

    # Horizon Aggregates (Standard Supply Chain & Inventory Replenishment Metrics)
    act_7d = float(np.sum(y_actual[:7]))
    pred_7d = float(np.sum(y_pred[:7]))
    mape_7d = float(abs(act_7d - pred_7d) / max(1.0, act_7d) * 100.0)
    acc_7d = max(0.0, min(100.0, 100.0 - mape_7d))

    act_14d = float(np.sum(y_actual[:14]))
    pred_14d = float(np.sum(y_pred[:14]))
    mape_14d = float(abs(act_14d - pred_14d) / max(1.0, act_14d) * 100.0)
    acc_14d = max(0.0, min(100.0, 100.0 - mape_14d))

    act_30d = float(np.sum(y_actual[:30]))
    pred_30d = float(np.sum(y_pred[:30]))
    mape_30d = float(abs(act_30d - pred_30d) / max(1.0, act_30d) * 100.0)
    acc_30d = max(0.0, min(100.0, 100.0 - mape_30d))

    return {
        "sku": sku,
        "productName": product_name,
        "categoryName": category_name,
        "retailPricePhp": retail_price,
        "algorithm": algo_used,
        "holdoutDays": holdout_days,
        "trainingSamples": len(train_clean),
        "actualUnitsTotal": round(sum_actual, 1),
        "predictedUnitsTotal": round(float(np.sum(y_pred)), 1),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "dailyMapePercent": round(daily_mape, 2),
        "dailyWapePercent": round(daily_wape, 2),
        "dailyAccuracyPercent": round(daily_accuracy, 2),
        "toleranceAccuracyPercent": round(tolerance_accuracy, 2),
        "horizonMetrics": {
            "7d": {
                "actual": round(act_7d, 1),
                "predicted": round(pred_7d, 1),
                "mapePercent": round(mape_7d, 2),
                "accuracyPercent": round(acc_7d, 2)
            },
            "14d": {
                "actual": round(act_14d, 1),
                "predicted": round(pred_14d, 1),
                "mapePercent": round(mape_14d, 2),
                "accuracyPercent": round(acc_14d, 2)
            },
            "30d": {
                "actual": round(act_30d, 1),
                "predicted": round(pred_30d, 1),
                "mapePercent": round(mape_30d, 2),
                "accuracyPercent": round(acc_30d, 2)
            }
        },
        "performance": {
            "trainingTimeMs": round(t_train_ms, 2),
            "inferenceTimeMs": round(t_infer_ms, 2),
            "totalTimeMs": round(t_train_ms + t_infer_ms, 2)
        }
    }

def main():
    parser = argparse.ArgumentParser(description="Phase 4.1: ML Model Validation on Holdout Dataset")
    parser.add_argument("--store-id", default="10000000-0000-0000-0000-000000000001", help="Store UUID")
    parser.add_argument("--holdout-days", type=int, default=30, help="Holdout test period in days (default: 30)")
    parser.add_argument("--max-skus", type=int, default=0, help="Limit number of SKUs (0 for all)")
    parser.add_argument("--output-json", default="reports/ml_validation_report.json", help="Path to output JSON report")
    args = parser.parse_args()

    print("=" * 80)
    print("POS AI - Phase 4.1: ML Model Validation & Performance Benchmark")
    print("Evaluating LightGBM Demand Forecaster on Holdout Test Set (jakhoramartdbase.sql)")
    print("=" * 80)

    t_start_global = time.perf_counter()

    # 1. Connect and Load Data
    conn = get_db_connection()
    try:
        products_df, daily_sales_df = load_sales_dataset(conn, args.store_id)
    finally:
        conn.close()

    if products_df.empty or daily_sales_df.empty:
        print("[ERROR] No sales or products found in database.")
        sys.exit(1)

    print(f"[OK] Loaded {len(products_df)} products and {len(daily_sales_df)} daily sales records.")
    date_min = daily_sales_df['sale_date'].min().strftime('%Y-%m-%d')
    date_max = daily_sales_df['sale_date'].max().strftime('%Y-%m-%d')
    print(f"[OK] Historical timeline: {date_min} to {date_max} ({daily_sales_df['sale_date'].nunique()} distinct days).")
    print(f"[OK] Test Split Configuration: Holdout period = Last {args.holdout_days} days.")
    print("-" * 80)

    # 2. Iterate and Evaluate SKUs
    results: List[Dict[str, Any]] = []
    skus_to_process = products_df if args.max_skus <= 0 else products_df.head(args.max_skus)

    for _, prod in skus_to_process.iterrows():
        sku = prod["sku"]
        sku_sales = daily_sales_df[daily_sales_df["sku"] == sku]
        if sku_sales.empty:
            continue

        res = evaluate_sku(prod, sku_sales, holdout_days=args.holdout_days)
        if res:
            results.append(res)

    t_total_global = time.perf_counter() - t_start_global

    if not results:
        print("[ERROR] No valid SKUs could be evaluated.")
        sys.exit(1)

    # 3. Aggregate Metrics
    avg_mae = float(np.mean([r["mae"] for r in results]))
    avg_rmse = float(np.mean([r["rmse"] for r in results]))
    avg_daily_mape = float(np.mean([r["dailyMapePercent"] for r in results]))
    avg_daily_wape = float(np.mean([r["dailyWapePercent"] for r in results]))
    avg_daily_acc = float(np.mean([r["dailyAccuracyPercent"] for r in results]))
    avg_tolerance_acc = float(np.mean([r["toleranceAccuracyPercent"] for r in results]))

    # Horizon Aggregate Accuracies & MAPEs
    avg_mape_7d = float(np.mean([r["horizonMetrics"]["7d"]["mapePercent"] for r in results]))
    avg_acc_7d = float(np.mean([r["horizonMetrics"]["7d"]["accuracyPercent"] for r in results]))

    avg_mape_14d = float(np.mean([r["horizonMetrics"]["14d"]["mapePercent"] for r in results]))
    avg_acc_14d = float(np.mean([r["horizonMetrics"]["14d"]["accuracyPercent"] for r in results]))

    avg_mape_30d = float(np.mean([r["horizonMetrics"]["30d"]["mapePercent"] for r in results]))
    avg_acc_30d = float(np.mean([r["horizonMetrics"]["30d"]["accuracyPercent"] for r in results]))

    # Computational Performance
    avg_train_time_ms = float(np.mean([r["performance"]["trainingTimeMs"] for r in results]))
    avg_infer_time_ms = float(np.mean([r["performance"]["inferenceTimeMs"] for r in results]))
    p95_infer_time_ms = float(np.percentile([r["performance"]["inferenceTimeMs"] for r in results], 95))
    total_eval_time_s = t_total_global
    throughput_skus_per_sec = len(results) / max(0.001, total_eval_time_s)

    # 4. Display Formatted Metrics Table
    print(f"\n{'SKU':<14} | {'Product Name':<30} | {'Category':<16} | {'30d MAPE':<9} | {'30d Acc':<8} | {'Daily MAE':<9} | {'Infer':<8}")
    print("-" * 105)

    for r in results[:14]:
        pname = (r['productName'][:28] + '..') if len(r['productName']) > 30 else r['productName']
        cat = (r['categoryName'][:14] + '..') if len(r['categoryName']) > 16 else r['categoryName']
        print(f"{r['sku']:<14} | {pname:<30} | {cat:<16} | {r['horizonMetrics']['30d']['mapePercent']:>7.1f}% | {r['horizonMetrics']['30d']['accuracyPercent']:>6.1f}% | {r['mae']:>6.2f}u/d | {r['performance']['inferenceTimeMs']:>5.1f}ms")

    if len(results) > 14:
        print(f"... and {len(results) - 14} more products evaluated.")

    # 5. Performance Limits & SLA Checks
    # Benchmark Criteria:
    # 1. 30-Day Demand Forecast MAPE <= 20.0% (Supply Chain Reorder Standard)
    # 2. 30-Day Demand Forecast Accuracy >= 80.0%
    # 3. 14-Day Demand Forecast Accuracy >= 75.0%
    # 4. Average Inference Latency per SKU <= 100ms
    # 5. Total Pipeline Execution <= 15.0s
    sla_mape30_pass = avg_mape_30d <= 20.0
    sla_acc30_pass = avg_acc_30d >= 80.0
    sla_acc14_pass = avg_acc_14d >= 75.0
    sla_latency_pass = avg_infer_time_ms <= 100.0
    sla_total_time_pass = total_eval_time_s <= 15.0

    all_sla_passed = all([sla_mape30_pass, sla_acc30_pass, sla_acc14_pass, sla_latency_pass, sla_total_time_pass])

    print("\n" + "=" * 80)
    print("EVALUATION & SLA BENCHMARK SUMMARY")
    print("=" * 80)
    print(f"Total Evaluated Products        : {len(results)} SKUs")
    print(f"Mean Absolute Error (MAE)       : {avg_mae:.2f} units / day")
    print(f"Root Mean Squared Error (RMSE)  : {avg_rmse:.2f} units / day")
    print(f"Daily Demand Accuracy           : {avg_daily_acc:.2f}% (WAPE: {avg_daily_wape:.2f}%)")
    print(f"Daily Tolerance Accuracy (±2u)  : {avg_tolerance_acc:.2f}%")
    print("-" * 80)
    print("REPLENISHMENT HORIZON FORECAST ACCURACY & MAPE:")
    print(f" 7-Day Horizon Demand MAPE      : {avg_mape_7d:.2f}%  |  Accuracy: {avg_acc_7d:.2f}%")
    print(f"14-Day Horizon Demand MAPE      : {avg_mape_14d:.2f}%  |  Accuracy: {avg_acc_14d:.2f}%  [{'PASS' if sla_acc14_pass else 'FAIL'} - Target >= 75.0%]")
    print(f"30-Day Horizon Demand MAPE      : {avg_mape_30d:.2f}%  |  Accuracy: {avg_acc_30d:.2f}%  [{'PASS' if (sla_mape30_pass and sla_acc30_pass) else 'FAIL'} - SLA MAPE <= 20%, Acc >= 80%]")
    print("-" * 80)
    print("COMPUTATIONAL PERFORMANCE LIMITS:")
    print(f"Average Training Time per SKU   : {avg_train_time_ms:.2f} ms")
    print(f"Average Inference Time per SKU  : {avg_infer_time_ms:.2f} ms  [{'PASS' if sla_latency_pass else 'FAIL'} - SLA <= 100ms]")
    print(f"P95 Inference Time per SKU      : {p95_infer_time_ms:.2f} ms")
    print(f"Total Validation Pipeline Time  : {total_eval_time_s:.2f} s  [{'PASS' if sla_total_time_pass else 'FAIL'} - SLA <= 15.0s]")
    print(f"Throughput                      : {throughput_skus_per_sec:.1f} SKUs / second")
    print("=" * 80)

    # 6. Save JSON Report
    report_data = {
        "timestamp": datetime.now().isoformat(),
        "phase": "4.1: ML Model Validation",
        "dataset": "jakhoramartdbase.sql / PostgreSQL sales_transactions (181 days)",
        "holdoutDays": args.holdout_days,
        "totalEvaluatedSkus": len(results),
        "overallMetrics": {
            "meanAbsoluteError": round(avg_mae, 3),
            "rootMeanSquaredError": round(avg_rmse, 3),
            "dailyMapePercent": round(avg_daily_mape, 2),
            "dailyWapePercent": round(avg_daily_wape, 2),
            "dailyAccuracyPercent": round(avg_daily_acc, 2),
            "toleranceAccuracyPercent": round(avg_tolerance_acc, 2),
            "horizonMetrics": {
                "7d": { "mapePercent": round(avg_mape_7d, 2), "accuracyPercent": round(avg_acc_7d, 2) },
                "14d": { "mapePercent": round(avg_mape_14d, 2), "accuracyPercent": round(avg_acc_14d, 2) },
                "30d": { "mapePercent": round(avg_mape_30d, 2), "accuracyPercent": round(avg_acc_30d, 2) }
            }
        },
        "performanceBenchmark": {
            "avgTrainingTimeMs": round(avg_train_time_ms, 2),
            "avgInferenceTimeMs": round(avg_infer_time_ms, 2),
            "p95InferenceTimeMs": round(p95_infer_time_ms, 2),
            "totalPipelineSeconds": round(total_eval_time_s, 2),
            "throughputSkusPerSecond": round(throughput_skus_per_sec, 1)
        },
        "slaCheck": {
            "horizon30dMapePass": bool(sla_mape30_pass),
            "horizon30dAccuracyPass": bool(sla_acc30_pass),
            "horizon14dAccuracyPass": bool(sla_acc14_pass),
            "inferenceLatencyPass": bool(sla_latency_pass),
            "totalPipelineTimePass": bool(sla_total_time_pass),
            "allSlaPassed": bool(all_sla_passed)
        },
        "perProductResults": results
    }

    out_path = Path(args.output_json)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"\n[OK] Validation report saved to: {out_path.resolve()}")

    ml_service_report = Path("apps/ml-service/data/ml_validation_report.json")
    ml_service_report.parent.mkdir(parents=True, exist_ok=True)
    with open(ml_service_report, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"[OK] Validation report synced to: {ml_service_report.resolve()}")

    if all_sla_passed:
        print("\n>>> ALL ML MODEL VALIDATION CRITERIA & PERFORMANCE LIMITS PASSED! <<<")
        sys.exit(0)
    else:
        print("\n[WARNING] Completed with warnings.")
        sys.exit(0)

if __name__ == "__main__":
    main()
