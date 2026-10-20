#!/usr/bin/env python3
"""
POS AI - Phase 3.1: AI Data Pipeline Setup
Standalone Historical Sales Extraction & Aggregation Script

Connects to the PostgreSQL database, queries historical completed transactions
from the last 6 months (180 days), aggregates daily sales per product SKU,
and outputs a clean, structured JSON summary for subsequent ML ETL pipelines.

Conforms to Philippine retail standards (PHP / ₱ currency).
"""

import os
import sys
import json
import argparse
from datetime import datetime, date
from decimal import Decimal
from pathlib import Path
from typing import Dict, Any, List, Optional

# UTF-8 encoding configuration for Windows PowerShell / CMD
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Attempt dotenv loading from potential project locations
def load_environment():
    try:
        from dotenv import load_dotenv
        current_dir = Path(__file__).resolve().parent
        env_candidates = [
            current_dir / ".env",
            current_dir.parent / ".env",
            current_dir.parent.parent / ".env",
            Path.cwd() / ".env"
        ]
        for env_path in env_candidates:
            if env_path.is_file():
                load_dotenv(env_path)
                break
    except ImportError:
        pass

load_environment()


class JSONCustomEncoder(json.JSONEncoder):
    """Handles datetime, date, and Decimal objects for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def get_db_connection():
    """
    Establishes connection to PostgreSQL using pg8000.native.
    Reads connection details from environment variables.
    """
    import pg8000.native

    host = os.getenv("DATABASE_HOST", "localhost")
    port = int(os.getenv("DATABASE_PORT", "5432"))
    user = os.getenv("DATABASE_USER", "postgres")
    password = os.getenv("DATABASE_PASSWORD", "postgres")
    database = os.getenv("DATABASE_NAME", "pos_db")

    try:
        conn = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database
        )
        return conn
    except Exception as e:
        sys.stderr.write(f"\n[ERROR] Failed to connect to PostgreSQL at {host}:{port}/{database}\n")
        sys.stderr.write(f"Details: {str(e)}\n\n")
        sys.stderr.write("Ensure PostgreSQL is running and credentials in .env are correct:\n")
        sys.stderr.write(f"  DATABASE_HOST={host}\n  DATABASE_PORT={port}\n  DATABASE_USER={user}\n  DATABASE_NAME={database}\n\n")
        raise


def extract_daily_sales_data(
    days_lookback: int = 180,
    store_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Connects to database, retrieves completed sales from the last `days_lookback` days,
    aggregates daily sales per product SKU, and computes overall and SKU-level summaries.

    Returns:
        Dict[str, Any]: Clean, structured JSON-serializable dictionary.
    """
    conn = get_db_connection()

    store_filter_clause = ""
    query_params: Dict[str, Any] = {"days": days_lookback}

    if store_id:
        store_filter_clause = "AND st.store_id = :store_id"
        query_params["store_id"] = store_id

    # 1. Query aggregated daily sales per SKU
    daily_sales_sql = f"""
        SELECT 
            DATE(st.created_at) AS sale_date,
            sli.sku,
            COALESCE(p.name, sli.product_name) AS product_name,
            COALESCE(c.name, 'General') AS category_name,
            COALESCE(p.unit_of_measure, 'unit') AS unit_of_measure,
            SUM(sli.quantity)::INT AS units_sold,
            ROUND(SUM(sli.total_price)::NUMERIC, 2)::FLOAT AS gross_sales_php,
            COUNT(DISTINCT st.id)::INT AS transaction_count,
            ROUND((SUM(sli.total_price) / NULLIF(SUM(sli.quantity), 0))::NUMERIC, 2)::FLOAT AS avg_unit_price_php
        FROM sales_line_items sli
        JOIN sales_transactions st ON st.id = sli.transaction_id
        LEFT JOIN products p ON p.id = sli.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE st.status = 'completed'
          AND st.created_at >= (CURRENT_DATE - (:days || ' days')::INTERVAL)
          {store_filter_clause}
        GROUP BY 
            DATE(st.created_at), 
            sli.sku, 
            p.name, 
            sli.product_name, 
            c.name, 
            p.unit_of_measure
        ORDER BY 
            sale_date ASC, 
            sli.sku ASC;
    """

    daily_rows = conn.run(daily_sales_sql, **query_params)
    col_names = [col["name"] for col in conn.columns]

    daily_sales_records: List[Dict[str, Any]] = []
    for r in daily_rows:
        row_dict = dict(zip(col_names, r))
        # Format sale_date as string YYYY-MM-DD
        if isinstance(row_dict["sale_date"], (datetime, date)):
            row_dict["sale_date"] = row_dict["sale_date"].strftime("%Y-%m-%d")
        daily_sales_records.append(row_dict)

    # 2. Query overall period summary
    summary_sql = f"""
        SELECT 
            MIN(DATE(st.created_at)) AS earliest_sale_date,
            MAX(DATE(st.created_at)) AS latest_sale_date,
            COUNT(DISTINCT st.id)::INT AS total_completed_transactions,
            COUNT(DISTINCT DATE(st.created_at))::INT AS total_recorded_days,
            COUNT(DISTINCT sli.sku)::INT AS unique_skus_count,
            COALESCE(SUM(sli.quantity), 0)::INT AS total_units_sold,
            ROUND(COALESCE(SUM(sli.total_price), 0)::NUMERIC, 2)::FLOAT AS total_gross_revenue_php
        FROM sales_line_items sli
        JOIN sales_transactions st ON st.id = sli.transaction_id
        WHERE st.status = 'completed'
          AND st.created_at >= (CURRENT_DATE - (:days || ' days')::INTERVAL)
          {store_filter_clause};
    """

    summary_rows = conn.run(summary_sql, **query_params)
    summary_cols = [col["name"] for col in conn.columns]
    overall_raw = dict(zip(summary_cols, summary_rows[0])) if summary_rows else {}

    # 3. Query SKU-level 6-month aggregate summary
    sku_agg_sql = f"""
        SELECT 
            sli.sku,
            COALESCE(p.name, sli.product_name) AS product_name,
            COALESCE(c.name, 'General') AS category_name,
            COALESCE(p.unit_of_measure, 'unit') AS unit_of_measure,
            SUM(sli.quantity)::INT AS total_units_sold,
            ROUND(SUM(sli.total_price)::NUMERIC, 2)::FLOAT AS total_gross_revenue_php,
            COUNT(DISTINCT st.id)::INT AS total_transactions,
            COUNT(DISTINCT DATE(st.created_at))::INT AS active_selling_days,
            ROUND((SUM(sli.quantity)::NUMERIC / NULLIF(COUNT(DISTINCT DATE(st.created_at)), 0)), 2)::FLOAT AS avg_units_per_day,
            ROUND((SUM(sli.total_price)::NUMERIC / NULLIF(COUNT(DISTINCT DATE(st.created_at)), 0)), 2)::FLOAT AS avg_revenue_per_day_php
        FROM sales_line_items sli
        JOIN sales_transactions st ON st.id = sli.transaction_id
        LEFT JOIN products p ON p.id = sli.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE st.status = 'completed'
          AND st.created_at >= (CURRENT_DATE - (:days || ' days')::INTERVAL)
          {store_filter_clause}
        GROUP BY 
            sli.sku, 
            p.name, 
            sli.product_name, 
            c.name, 
            p.unit_of_measure
        ORDER BY 
            total_gross_revenue_php DESC;
    """

    sku_rows = conn.run(sku_agg_sql, **query_params)
    sku_cols = [col["name"] for col in conn.columns]
    sku_summaries = [dict(zip(sku_cols, r)) for r in sku_rows]

    # 4. Query Category-level aggregate breakdown
    cat_agg_sql = f"""
        SELECT 
            COALESCE(c.name, 'General') AS category_name,
            COUNT(DISTINCT sli.sku)::INT AS sku_count,
            SUM(sli.quantity)::INT AS total_units_sold,
            ROUND(SUM(sli.total_price)::NUMERIC, 2)::FLOAT AS total_revenue_php
        FROM sales_line_items sli
        JOIN sales_transactions st ON st.id = sli.transaction_id
        LEFT JOIN products p ON p.id = sli.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE st.status = 'completed'
          AND st.created_at >= (CURRENT_DATE - (:days || ' days')::INTERVAL)
          {store_filter_clause}
        GROUP BY c.name
        ORDER BY total_revenue_php DESC;
    """

    cat_rows = conn.run(cat_agg_sql, **query_params)
    cat_cols = [col["name"] for col in conn.columns]
    category_summaries = [dict(zip(cat_cols, r)) for r in cat_rows]

    conn.close()

    # Calculate derived rate metrics
    total_days = overall_raw.get("total_recorded_days") or 1
    total_units = overall_raw.get("total_units_sold") or 0
    total_rev = overall_raw.get("total_gross_revenue_php") or 0.0

    earliest_date = overall_raw.get("earliest_sale_date")
    if isinstance(earliest_date, (datetime, date)):
        earliest_date = earliest_date.strftime("%Y-%m-%d")

    latest_date = overall_raw.get("latest_sale_date")
    if isinstance(latest_date, (datetime, date)):
        latest_date = latest_date.strftime("%Y-%m-%d")

    result_payload = {
        "pipeline_phase": "Phase 3.1: AI Data Pipeline Setup",
        "extracted_at": datetime.now().isoformat(),
        "query_configuration": {
            "lookback_days": days_lookback,
            "earliest_date_found": earliest_date,
            "latest_date_found": latest_date,
            "store_id_filter": store_id if store_id else "all_stores",
            "currency": "PHP",
            "currency_symbol": "₱",
            "locale": "en-PH"
        },
        "overall_summary": {
            "total_completed_transactions": overall_raw.get("total_completed_transactions", 0),
            "total_recorded_days": total_days,
            "total_unique_skus": overall_raw.get("unique_skus_count", 0),
            "total_units_sold": total_units,
            "total_gross_revenue_php": total_rev,
            "average_daily_units_sold": round(total_units / total_days, 2) if total_days else 0,
            "average_daily_revenue_php": round(total_rev / total_days, 2) if total_days else 0.0,
            "average_items_per_transaction": round(total_units / overall_raw.get("total_completed_transactions", 1), 2)
                if overall_raw.get("total_completed_transactions", 0) > 0 else 0
        },
        "category_breakdown": category_summaries,
        "sku_level_summary": sku_summaries,
        "daily_sales_by_sku_count": len(daily_sales_records),
        "daily_sales_by_sku": daily_sales_records
    }

    return result_payload


def print_cli_report(data: Dict[str, Any], output_path: Optional[str] = None):
    """
    Prints a clean, formatted terminal summary of the extracted historical sales data.
    """
    cfg = data["query_configuration"]
    summary = data["overall_summary"]
    categories = data["category_breakdown"]
    skus = data["sku_level_summary"]

    print("\n" + "=" * 70)
    print(">> POS AI | Phase 3.1: Historical Sales Data Extraction Pipeline")
    print(f">> Localization: Philippine Retail Market (PHP / ₱ | en-PH)")
    print("=" * 70)
    print(f"Extraction Timestamp : {data['extracted_at']}")
    print(f"Lookback Window      : {cfg['lookback_days']} days (~6 months)")
    print(f"Date Range Found     : {cfg['earliest_date_found']} to {cfg['latest_date_found']} ({summary['total_recorded_days']} active days)")
    print(f"Target Store Scope   : {cfg['store_id_filter']}")
    print("-" * 70)
    print("OVERALL 6-MONTH METRICS:")
    print(f"  * Total Completed Transactions : {summary['total_completed_transactions']:,}")
    print(f"  * Total Unique Product SKUs   : {summary['total_unique_skus']:,}")
    print(f"  * Total Units Sold            : {summary['total_units_sold']:,} units")
    print(f"  * Total Gross Revenue         : ₱ {summary['total_gross_revenue_php']:,.2f}")
    print(f"  * Avg Daily Units Sold        : {summary['average_daily_units_sold']:,.2f} units/day")
    print(f"  * Avg Daily Revenue           : ₱ {summary['average_daily_revenue_php']:,.2f}/day")
    print(f"  * Avg Items per Transaction   : {summary['average_items_per_transaction']:.2f}")
    print("-" * 70)

    print("SALES BREAKDOWN BY CATEGORY:")
    for cat in categories:
        print(f"  * {cat['category_name']:<30} | SKUs: {cat['sku_count']:>2} | Units: {cat['total_units_sold']:>6,} | Revenue: ₱ {cat['total_revenue_php']:>11,.2f}")

    print("-" * 70)
    print("TOP 10 BEST-SELLING SKUs BY REVENUE:")
    for idx, item in enumerate(skus[:10], start=1):
        name_trunc = item["product_name"][:35]
        print(f"  {idx:>2}. [{item['sku']:<12}] {name_trunc:<35} | {item['total_units_sold']:>5,} units | ₱ {item['total_gross_revenue_php']:>10,.2f}")

    print("-" * 70)
    print(f"Daily Sales Time-Series Records Aggregated: {data['daily_sales_by_sku_count']:,} data points")

    if output_path:
        print(f"\n[SUCCESS] Clean JSON summary successfully exported to:\n  -> {output_path}")
    print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="POS AI - Phase 3.1: Historical Transaction Extraction & Daily Sales per SKU Aggregation"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=180,
        help="Number of days lookback from today (default: 180 for 6 months)"
    )
    parser.add_argument(
        "--store-id",
        type=str,
        default=None,
        help="Optional UUID filter for a specific store (default: all stores)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="File path to save the clean JSON output summary. Default: apps/ml-service/data/daily_sales_summary.json"
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Output raw clean JSON directly to stdout (useful for piping or script integrations)"
    )
    parser.add_argument(
        "--no-file",
        action="store_true",
        help="Do not write output to a JSON file on disk"
    )

    args = parser.parse_args()

    # Extract historical sales data
    result = extract_daily_sales_data(
        days_lookback=args.days,
        store_id=args.store_id
    )

    # Determine output file path if writing to disk
    output_path = None
    if not args.no_file and not args.stdout:
        if args.output:
            output_path = Path(args.output).resolve()
        else:
            default_dir = Path(__file__).resolve().parent / "data"
            default_dir.mkdir(parents=True, exist_ok=True)
            output_path = default_dir / "daily_sales_summary.json"

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, cls=JSONCustomEncoder)

    if args.stdout:
        print(json.dumps(result, indent=2, cls=JSONCustomEncoder))
    else:
        print_cli_report(result, str(output_path) if output_path else None)


if __name__ == "__main__":
    main()
