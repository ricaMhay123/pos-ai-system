from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.config import settings
from app.models.demand_forecast import DemandForecaster
from app.etl.pipeline import ETLReplenishmentPipeline
from app.database import Database

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.MODEL_VERSION,
    description="Microservice providing sales forecasting, demand inference, inventory turnover, and replenishment advice."
)

forecaster = DemandForecaster(model_version=settings.MODEL_VERSION)
etl_pipeline = ETLReplenishmentPipeline()

class DemandInferenceRequest(BaseModel):
    store_id: str
    product_id: str
    product_name: str
    sku: str
    current_stock: int
    lead_time_days: int
    recent_daily_sales: List[float]
    safety_stock: Optional[int] = 10
    unit_cost: Optional[float] = 65.0  # PHP

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "model_name": settings.MODEL_NAME,
        "model_version": settings.MODEL_VERSION,
        "database": settings.DATABASE_NAME
    }

@app.post("/api/v1/forecast/recommend")
def generate_recommendation(payload: DemandInferenceRequest):
    """
    Compute demand prediction and replenishment recommendation for a single product & store.
    """
    try:
        recommendation = forecaster.compute_replenishment_recommendation(
            product_id=payload.product_id,
            product_name=payload.product_name,
            sku=payload.sku,
            current_stock=payload.current_stock,
            lead_time_days=payload.lead_time_days,
            recent_daily_sales=payload.recent_daily_sales,
            safety_stock=payload.safety_stock or 10,
            unit_cost=payload.unit_cost or 65.0
        )
        return {"success": True, "data": recommendation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/forecast/run-etl")
@app.post("/api/v1/forecast/batch-run")
def trigger_batch_forecast_run(
    store_id: str = Query("10000000-0000-0000-0000-000000000001"),
    horizon_days: int = Query(14),
    days_lookback: int = Query(180)
):
    """
    Triggers end-to-end ETL & demand forecasting pipeline:
    1. Extracts daily transactions & inventory levels
    2. Computes inventory turnover & stock velocity
    3. Executes LightGBM/Ridge demand forecasting
    4. Populates forecast_runs and replenishment_recommendations in PostgreSQL
    """
    try:
        result = etl_pipeline.run_pipeline(
            store_id=store_id,
            horizon_days=horizon_days,
            days_lookback=days_lookback,
            persist=True
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETL pipeline failure: {str(e)}")

@app.get("/api/v1/forecast/turnover")
def get_inventory_turnover(
    store_id: str = Query("10000000-0000-0000-0000-000000000001"),
    days_lookback: int = Query(180)
):
    """
    Extracts sales and returns product-level inventory turnover ratios, DSI, and velocity class.
    """
    try:
        products_df = etl_pipeline.extractor.get_active_products()
        inventory_df = etl_pipeline.extractor.get_inventory_levels(store_id)
        sales_df = etl_pipeline.extractor.get_daily_sales_history(store_id, days_lookback=days_lookback)
        turnover_df = etl_pipeline.turnover_calc.calculate_metrics(
            products_df, inventory_df, sales_df, window_days=days_lookback
        )
        return {
            "success": True,
            "storeId": store_id,
            "windowDays": days_lookback,
            "totalProducts": len(turnover_df),
            "data": turnover_df.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/forecast/recommendations")
def get_active_recommendations(
    store_id: str = Query("10000000-0000-0000-0000-000000000001")
):
    """
    Retrieves active replenishment recommendations directly from PostgreSQL.
    """
    try:
        sql = f"""
            SELECT 
                r.id,
                r.store_id,
                r.product_id,
                p.sku,
                p.name as product_name,
                c.name as category_name,
                r.current_stock_on_hand,
                r.forecasted_demand_7d::FLOAT as forecasted_demand_7d,
                r.forecasted_demand_14d::FLOAT as forecasted_demand_14d,
                r.recommended_order_quantity,
                r.urgency,
                r.confidence_score::FLOAT as confidence_score,
                r.predicted_stockout_date::TEXT as predicted_stockout_date,
                r.estimated_cost::FLOAT as estimated_cost,
                r.reasoning_summary,
                r.status,
                r.created_at::TEXT as created_at
            FROM replenishment_recommendations r
            JOIN products p ON p.id = r.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE r.store_id = '{store_id}'
            ORDER BY 
                CASE r.urgency
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    ELSE 4
                END ASC,
                r.estimated_cost DESC
        """
        rows = Database.query(sql)
        return {
            "success": True,
            "storeId": store_id,
            "count": len(rows),
            "recommendations": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
