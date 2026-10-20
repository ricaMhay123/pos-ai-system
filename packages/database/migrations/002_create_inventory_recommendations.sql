-- =====================================================================
-- Migration 002: Create inventory_recommendations Table
-- Stores multi-horizon ML demand forecasts (7, 14, 30 days) and
-- calculated stock reorder points (Daily Avg Sales * Lead Time + Safety Stock)
-- =====================================================================

CREATE TABLE IF NOT EXISTS inventory_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_run_id UUID REFERENCES forecast_runs(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(100),
    current_stock_on_hand INT NOT NULL DEFAULT 0,
    daily_avg_sales NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lead_time_days INT NOT NULL DEFAULT 3,
    safety_stock INT NOT NULL DEFAULT 5,
    reorder_point INT NOT NULL DEFAULT 10,
    forecasted_demand_7d NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    forecasted_demand_14d NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    forecasted_demand_30d NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recommended_order_quantity INT NOT NULL DEFAULT 0,
    urgency VARCHAR(30) NOT NULL DEFAULT 'medium',
    confidence_score NUMERIC(5, 4) NOT NULL DEFAULT 0.9000,
    predicted_stockout_date DATE,
    estimated_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    reasoning_summary TEXT,
    decision_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_rec_store_status ON inventory_recommendations(store_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_rec_urgency ON inventory_recommendations(urgency);
CREATE INDEX IF NOT EXISTS idx_inv_rec_sku ON inventory_recommendations(sku);
CREATE INDEX IF NOT EXISTS idx_inv_rec_product ON inventory_recommendations(product_id);
