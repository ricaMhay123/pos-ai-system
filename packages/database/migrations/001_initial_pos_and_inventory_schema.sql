-- =====================================================================
-- POS AI Migration 001: Core POS, Inventory Ledger & AI Recommendations
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('cashier', 'inventory_manager', 'store_manager', 'admin', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'voided', 'refunded', 'partially_refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('cash', 'credit_card', 'debit_card', 'digital_wallet', 'gift_card', 'split');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inventory_movement_type AS ENUM ('sale', 'purchase_receipt', 'return_restock', 'adjustment_loss', 'adjustment_found', 'transfer_in', 'transfer_out');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recommendation_urgency AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recommendation_status AS ENUM ('pending_review', 'approved', 'auto_ordered', 'dismissed', 'fulfilled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. COMMON TRIGGER FUNCTION: update_updated_at_column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 4. IDENTITY & ACCESS CONTROL (AUTH / RBAC)
-- =====================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'pos:checkout', 'inventory:adjust', 'ai:approve_order'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 5. PRODUCT CATALOG MANAGEMENT
-- =====================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(20) DEFAULT 'unit', -- 'unit', 'kg', 'pack', etc.
    cost_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (cost_price >= 0),
    retail_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (retail_price >= 0),
    tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0000 CHECK (tax_rate >= 0), -- e.g. 0.0825 for 8.25%
    reorder_point INT NOT NULL DEFAULT 10 CHECK (reorder_point >= 0),
    reorder_quantity INT NOT NULL DEFAULT 50 CHECK (reorder_quantity > 0),
    lead_time_days INT NOT NULL DEFAULT 3 CHECK (lead_time_days >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Support for secondary barcodes / GTIN / UPC / EAN
CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    barcode_type VARCHAR(20) DEFAULT 'EAN-13',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 6. STOCK INVENTORY & AUDITABLE TRANSACTION LEDGER
-- =====================================================================

-- Real-time current balance snapshot per store
CREATE TABLE IF NOT EXISTS inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    safety_stock INT NOT NULL DEFAULT 5 CHECK (safety_stock >= 0),
    max_stock_capacity INT,
    last_counted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_store_product UNIQUE (store_id, product_id)
);

-- Immutable inventory ledger: Every movement is recorded with reference
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type inventory_movement_type NOT NULL,
    quantity_delta INT NOT NULL, -- Negative for sales/shrinkage, positive for receipt/return
    balance_after INT NOT NULL,
    reference_id VARCHAR(100), -- References sales_transactions.id, po_id, or adjustment note
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 7. POS SALES TRANSACTIONS & CHECKOUT
-- =====================================================================

CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_number VARCHAR(60) UNIQUE NOT NULL, -- e.g. 'TXN-20261017-0001'
    status transaction_status NOT NULL DEFAULT 'completed',
    subtotal_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (subtotal_amount >= 0),
    tax_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (total_amount >= 0),
    idempotency_key VARCHAR(128) UNIQUE, -- Prevents duplicate charges during network reconnects
    offline_created_at TIMESTAMPTZ, -- In case checkout happened in offline queue
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    unit_price NUMERIC(12, 4) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    discount_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000 CHECK (discount_amount >= 0),
    total_price NUMERIC(12, 4) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
    method payment_method_type NOT NULL,
    status payment_status NOT NULL DEFAULT 'captured',
    amount NUMERIC(12, 4) NOT NULL CHECK (amount > 0),
    gateway_reference VARCHAR(120),
    last_four VARCHAR(4),
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 8. AI REPLENISHMENT & DEMAND FORECASTING ENGINE
-- =====================================================================

CREATE TABLE IF NOT EXISTS forecast_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL, -- e.g. 'Prophet-v2.1', 'LightGBM-DemandReg'
    model_version VARCHAR(50) NOT NULL,
    run_type VARCHAR(50) NOT NULL DEFAULT 'daily_scheduled', -- 'daily_scheduled', 'manual', 'event_triggered'
    forecast_horizon_days INT NOT NULL DEFAULT 14,
    items_processed INT DEFAULT 0,
    run_status VARCHAR(30) NOT NULL DEFAULT 'completed', -- 'in_progress', 'completed', 'failed'
    execution_time_ms INT,
    metrics JSONB, -- e.g. {"wape": 0.082, "rmse": 4.12, "mae": 2.8}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replenishment_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_run_id UUID REFERENCES forecast_runs(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    current_stock_on_hand INT NOT NULL,
    forecasted_demand_7d NUMERIC(10, 2) NOT NULL,
    forecasted_demand_14d NUMERIC(10, 2) NOT NULL,
    
    recommended_order_quantity INT NOT NULL CHECK (recommended_order_quantity > 0),
    urgency recommendation_urgency NOT NULL DEFAULT 'medium',
    confidence_score NUMERIC(5, 4) NOT NULL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    
    predicted_stockout_date DATE,
    estimated_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    
    reasoning_summary TEXT, -- e.g. "Spike detected due to weekend trend + supplier 4-day lead time"
    status recommendation_status NOT NULL DEFAULT 'pending_review',
    
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    decision_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    predicted_quantity NUMERIC(10, 2) NOT NULL,
    actual_quantity NUMERIC(10, 2),
    absolute_error NUMERIC(10, 2) GENERATED ALWAYS AS (ABS(predicted_quantity - COALESCE(actual_quantity, 0))) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_store_date UNIQUE (product_id, store_id, target_date)
);

-- =====================================================================
-- 9. PERFORMANCE INDEXES
-- =====================================================================

-- Product & Barcode lookups (Sub-millisecond cashier scanning)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_code ON product_barcodes(barcode);

-- Inventory lookups
CREATE INDEX IF NOT EXISTS idx_inventory_store_product ON inventory_levels(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_store_product ON inventory_transactions(store_id, product_id);

-- Sales & Reporting indexes
CREATE INDEX IF NOT EXISTS idx_sales_txn_store_date ON sales_transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_txn_number ON sales_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_sales_txn_cashier ON sales_transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_line_items_txn ON sales_line_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_line_items_product ON sales_line_items(product_id);

-- AI Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_store_status ON replenishment_recommendations(store_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_urgency ON replenishment_recommendations(urgency);
CREATE INDEX IF NOT EXISTS idx_recommendations_product ON replenishment_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_created ON forecast_runs(created_at DESC);

-- =====================================================================
-- 10. ATTACH AUTO-UPDATE TIMESTAMP TRIGGERS
-- =====================================================================

CREATE OR REPLACE TRIGGER set_timestamp_roles
BEFORE UPDATE ON roles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_stores
BEFORE UPDATE ON stores FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_users
BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_products
BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_inventory_levels
BEFORE UPDATE ON inventory_levels FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_sales_transactions
BEFORE UPDATE ON sales_transactions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

CREATE OR REPLACE TRIGGER set_timestamp_replenishment_recommendations
BEFORE UPDATE ON replenishment_recommendations FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
