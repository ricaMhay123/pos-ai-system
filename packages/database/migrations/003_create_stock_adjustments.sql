-- =====================================================================
-- Migration 003: Create stock_adjustments Table
-- Tracks physical inventory count discrepancies, spoilage, damage,
-- theft/shrinkage, returns, and restock corrections.
--
-- Safety & Foreign Key Constraints:
-- Uses ON DELETE SET NULL to preserve audit trail integrity and prevent
-- breaking existing historical sales records in sales_transactions and products.
-- =====================================================================

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL, -- 'physical_count', 'damage', 'spoilage', 'theft', 'restock_correction', 'return', 'other'
    quantity_delta INT NOT NULL,           -- Negative for shrinkage/damage, positive for found/restock
    previous_stock INT NOT NULL DEFAULT 0,
    new_stock INT NOT NULL DEFAULT 0,
    cost_impact_php NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    reason TEXT,
    reference_number VARCHAR(100),
    adjusted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    adjusted_by_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimized query indexes
CREATE INDEX IF NOT EXISTS idx_stock_adj_store_id ON stock_adjustments(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adj_sku ON stock_adjustments(sku);
CREATE INDEX IF NOT EXISTS idx_stock_adj_type ON stock_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_stock_adj_created_at ON stock_adjustments(created_at DESC);
