#!/usr/bin/env python3
"""
POS AI - Standalone CLI Entrypoint for Phase 3 ETL & Demand Forecasting Pipeline
Extracts 180-day transactions, computes turnover metrics, forecasts demand using LightGBM/Ridge,
and populates the PostgreSQL recommendation tables.
"""

import sys
import os
import json
from pathlib import Path

# Fix Windows console encoding for UTF-8 characters and currency symbols
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure app package is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.etl.pipeline import ETLReplenishmentPipeline
from app.config import settings

def main():
    print("=" * 65)
    print(">> POS AI Phase 3: Demand Forecasting & Replenishment ETL Engine")
    print(f"Target Database: {settings.DATABASE_NAME} ({settings.DATABASE_HOST}:{settings.DATABASE_PORT})")
    print(f"Algorithm: {settings.MODEL_NAME} ({settings.MODEL_VERSION})")
    print("=" * 65)

    pipeline = ETLReplenishmentPipeline()
    store_id = "10000000-0000-0000-0000-000000000001"  # BGC Flagship Store

    result = pipeline.run_pipeline(store_id=store_id, horizon_days=14, days_lookback=180, persist=True)

    print("\n[OK] ETL & Forecasting Execution Completed Successfully!")
    print(f"  - Forecast Run ID: {result['forecastRunId']}")
    print(f"  - Products Analyzed: {result['itemsProcessed']}")
    print(f"  - Recommendations Persisted to PostgreSQL: {result['persistedRecommendations']}")
    print(f"  - Execution Time: {result['executionTimeMs']} ms")
    
    print("\n[METRICS] Inventory Turnover & Velocity Summary:")
    print(f"  - Average Annualized Turnover: {result['turnoverSummary']['averageAnnualizedTurnover']}x")
    print(f"  - Average Days Sales of Inventory (DSI): {result['turnoverSummary']['averageDaysSalesInventory']} days")
    print(f"  - Fast Movers: {result['turnoverSummary']['fastMoverCount']}")
    print(f"  - Slow Movers: {result['turnoverSummary']['slowMoverCount']}")
    print(f"  - Dead Stock Items: {result['turnoverSummary']['deadStockCount']}")

    print("\n[ALERTS] Restock Urgency Distribution:")
    for urgency, count in result["urgencySummary"].items():
        print(f"  - {urgency.upper()}: {count} items")

    print(f"\n[FINANCIALS] Total Recommended Restock Cost: PHP {result['financialSummary']['totalRecommendedRestockValue']:,.2f}")

    print("\n[TOP 5] Replenishment Recommendations:")
    for i, rec in enumerate(result["topRecommendations"][:5], 1):
        print(f"  {i}. [{rec['urgency'].upper()}] {rec['productName']} ({rec['sku']})")
        print(f"     Stock: {rec['currentStockOnHand']} | 14-day Demand: {rec['forecastedDemand14d']} | Order: {rec['recommendedOrderQuantity']} units | Cost: PHP {rec['estimatedCost']:,.2f}")
        print(f"     Reason: {rec['reasoningSummary']}")
        print(f"     Predicted Stockout: {rec['predictedStockoutDate']} (Confidence: {rec['confidenceScore']*100:.1f}%)\n")

    print("=" * 65)

if __name__ == "__main__":
    main()
