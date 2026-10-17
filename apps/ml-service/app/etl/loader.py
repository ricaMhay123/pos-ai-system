import uuid
import json
import logging
from typing import Dict, Any, List
from app.database import Database
from app.config import settings

logger = logging.getLogger("ETL.Loader")

class RecommendationLoader:
    """
    Persists demand forecast runs and generated inventory replenishment
    recommendations directly into PostgreSQL.
    """

    @staticmethod
    def persist_forecast_run(
        store_id: str,
        items_processed: int,
        execution_time_ms: int,
        metrics: Dict[str, Any],
        run_type: str = "daily_scheduled"
    ) -> str:
        """
        Inserts a new record into forecast_runs table and returns run UUID.
        """
        run_id = str(uuid.uuid4())
        metrics_json = json.dumps(metrics)

        sql = f"""
            INSERT INTO forecast_runs (
                id, store_id, model_name, model_version, run_type,
                forecast_horizon_days, items_processed, run_status,
                execution_time_ms, metrics, created_at
            ) VALUES (
                '{run_id}', '{store_id}', '{settings.MODEL_NAME}', '{settings.MODEL_VERSION}',
                '{run_type}', {settings.DEFAULT_HORIZON_DAYS}, {items_processed},
                'completed', {execution_time_ms}, '{metrics_json}'::jsonb, NOW()
            )
        """
        Database.execute(sql)
        logger.info(f"Persisted forecast run {run_id} ({items_processed} items processed)")
        return run_id

    @staticmethod
    def persist_recommendations(
        store_id: str,
        forecast_run_id: str,
        recommendations: List[Dict[str, Any]]
    ) -> int:
        """
        Persists replenishment recommendations into replenishment_recommendations table.
        Removes older pending recommendations for the store to prevent duplicate active queues.
        """
        if not recommendations:
            return 0

        # Archive/clear existing pending_review recommendations for this store
        Database.execute(f"""
            DELETE FROM replenishment_recommendations
            WHERE store_id = '{store_id}' AND status = 'pending_review'
        """)

        inserted = 0
        for rec in recommendations:
            roq = int(rec["recommendedOrderQuantity"])
            if roq <= 0:
                continue

            rec_id = str(uuid.uuid4())
            p_id = rec["productId"]
            on_hand = rec["currentStockOnHand"]
            f7d = rec["forecastedDemand7d"]
            f14d = rec["forecastedDemand14d"]
            urgency = rec["urgency"]
            confidence = rec["confidenceScore"]
            stockout_date = rec["predictedStockoutDate"]
            est_cost = rec["estimatedCost"]
            # Escape single quotes in reasoning summary
            reason = rec["reasoningSummary"].replace("'", "''")

            sql = f"""
                INSERT INTO replenishment_recommendations (
                    id, forecast_run_id, store_id, product_id,
                    current_stock_on_hand, forecasted_demand_7d, forecasted_demand_14d,
                    recommended_order_quantity, urgency, confidence_score,
                    predicted_stockout_date, estimated_cost, reasoning_summary,
                    status, created_at, updated_at
                ) VALUES (
                    '{rec_id}', '{forecast_run_id}', '{store_id}', '{p_id}',
                    {on_hand}, {f7d}, {f14d},
                    {roq}, '{urgency}', {confidence},
                    '{stockout_date}', {est_cost}, '{reason}',
                    'pending_review', NOW(), NOW()
                )
            """
            Database.execute(sql)
            inserted += 1

        logger.info(f"Persisted {inserted} replenishment recommendations to PostgreSQL for store {store_id}")
        return inserted
