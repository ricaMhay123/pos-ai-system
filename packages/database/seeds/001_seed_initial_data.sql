-- =====================================================================
-- POS AI Initial Mock & Seed Data (Philippine Localization - PHP / ₱)
-- =====================================================================

-- 1. Insert Core Roles
INSERT INTO roles (id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', 'Enterprise Super Administrator with full system control'),
    ('00000000-0000-0000-0000-000000000002', 'store_manager', 'Store Manager handling inventory approvals and cashier audits'),
    ('00000000-0000-0000-0000-000000000003', 'inventory_manager', 'Inventory Specialist managing purchase orders and AI suggestions'),
    ('00000000-0000-0000-0000-000000000004', 'cashier', 'Point of Sale Cashier Operator')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Philippine Store Locations
INSERT INTO stores (id, code, name, address_line1, city, state, postal_code, country) VALUES
    ('10000000-0000-0000-0000-000000000001', 'STR-BGC-01', 'Flagship BGC Terminal - Taguig', '7th Avenue cor 28th St, Bonifacio High Street', 'Taguig', 'Metro Manila', '1634', 'Philippines'),
    ('10000000-0000-0000-0000-000000000002', 'STR-MAK-01', 'Makati Central Store', 'Ayala Center, Glorietta 4', 'Makati', 'Metro Manila', '1224', 'Philippines'),
    ('10000000-0000-0000-0000-000000000003', 'STR-CEB-01', 'Cebu IT Park Hub', 'Salinas Drive, Lahug', 'Cebu City', 'Cebu', '6000', 'Philippines')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Initial Users
INSERT INTO users (id, store_id, username, email, password_hash, first_name, last_name, employee_code) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin', 'admin@pos-ai.ph', '$2a$10$0p257hU8WfQyZcWf9r5g8.uS0b/m.aO/l1f2X9XW7Y8o3GvC8r5uW', 'Jose', 'Rizal', 'EMP-ADM-001'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'manager_bgc', 'manager.bgc@pos-ai.ph', '$2a$10$0p257hU8WfQyZcWf9r5g8.uS0b/m.aO/l1f2X9XW7Y8o3GvC8r5uW', 'Maria', 'Santos', 'EMP-MGR-002'),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'cashier_01', 'cashier1@pos-ai.ph', '$2a$10$0p257hU8WfQyZcWf9r5g8.uS0b/m.aO/l1f2X9XW7Y8o3GvC8r5uW', 'Juan', 'Dela Cruz', 'EMP-CSH-003'),
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'manager', 'manager@pos-ai.ph', '$2a$10$WqUe.4/9f/XmPqMv9cR2teH1H3bM6tG3gGgA5vYyZ2pD7eL8vYq8e', 'Store', 'Manager', 'EMP-MGR-01'),
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'cashier', 'cashier@pos-ai.ph', '$2a$10$eL5p.6/0g/YnQrNw0dS3ufI2I4cO7uH4hHhB6wZzW3qE8fM9wZr9f', 'POS', 'Cashier', 'EMP-CSH-01')
ON CONFLICT (username) DO NOTHING;

-- Assign Roles
INSERT INTO user_roles (user_id, role_id) VALUES
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

--- 4. Six Core Philippine Retail Categories
INSERT INTO categories (id, name, slug, description) VALUES
    ('30000000-0000-0000-0000-000000000001', 'Rice & Staples', 'rice-staples', 'Staple rice varieties, grain loaves, and everyday essentials'),
    ('30000000-0000-0000-0000-000000000002', 'Canned Goods', 'canned-goods', 'Canned tuna, corned beef, karne norte, and sardines'),
    ('30000000-0000-0000-0000-000000000003', 'Beverages & Coffee', 'beverages-coffee', 'Coffee sachets, soft drinks, beers, and bottled distilled water'),
    ('30000000-0000-0000-0000-000000000004', 'Snacks', 'snacks', 'Chips, crackers, and savory multigrain snacks'),
    ('30000000-0000-0000-0000-000000000005', 'Personal Care & Household', 'personal-care-household', 'Bath soaps, laundry detergents, and hygiene essentials'),
    ('30000000-0000-0000-0000-000000000006', 'Instant Foods', 'instant-foods', 'Instant noodles, pancit canton, and cup noodle meals')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;

-- 5. Products with Philippine Peso (PHP / ₱) Pricing & 12% Standard VAT
INSERT INTO products (id, category_id, sku, barcode, name, description, unit_of_measure, cost_price, retail_price, tax_rate, reorder_point, reorder_quantity, lead_time_days) VALUES
    -- RICE & STAPLES (Raw uncooked rice is VAT-exempt 0% per BIR; bread 12%)
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'RIC-SIN-001', '480000000001', 'Sinandomeng Special Rice 5kg', 'Locally milled premium Sinandomeng special white rice 5kg', 'sack', 240.00, 285.00, 0.0000, 15, 40, 2),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'RIC-JAS-002', '480000000002', 'Dinorado Jasmine Rice 5kg', 'Fragrant Dinorado jasmine aromatic soft rice 5kg', 'sack', 310.00, 380.00, 0.0000, 10, 30, 3),
    ('40000000-0000-0000-0001-000000000003', '30000000-0000-0000-0000-000000000001', 'BRD-GAR-003', '480000000003', 'Gardenia Classic White Bread 600g', 'Freshly baked soft classic white sliced bread 600g', 'loaf', 62.00, 78.00, 0.1200, 8, 20, 1),
    
    -- CANNED GOODS
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'CAN-TUN-004', '480000000004', 'Century Tuna Flakes in Oil 180g', 'Healthy tuna flakes packed in rich soybean oil 180g', 'can', 31.50, 37.50, 0.1200, 25, 60, 3),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'CAN-CRN-005', '480000000005', 'Purefoods Corned Beef 210g', 'Premium 100% pure seasoned cattle beef strands 210g', 'can', 82.00, 98.00, 0.1200, 20, 50, 2),
    ('40000000-0000-0000-0001-000000000006', '30000000-0000-0000-0000-000000000002', 'CAN-CDO-006', '480000000006', 'CDO Karne Norte 150g', 'Delicious guisado-style Filipino corned beef 150g', 'can', 21.00, 26.50, 0.1200, 30, 75, 2),
    ('40000000-0000-0000-0001-000000000007', '30000000-0000-0000-0000-000000000002', 'CAN-MEG-007', '480000000007', 'Mega Sardines in Tomato Sauce 155g', 'Fresh ocean catch sardines in rich tomato sauce 155g', 'can', 17.50, 22.00, 0.1200, 35, 100, 2),

    -- INSTANT FOODS
    ('40000000-0000-0000-0001-000000000008', '30000000-0000-0000-0000-000000000006', 'INS-LKM-008', '480000000008', 'Lucky Me! Pancit Canton Extra Hot 80g', 'Spicy stir-fried instant noodles with chili seasoning 80g', 'pack', 11.00, 14.50, 0.1200, 50, 150, 2),
    ('40000000-0000-0000-0001-000000000009', '30000000-0000-0000-0000-000000000006', 'INS-LKM-009', '480000000009', 'Lucky Me! Instant Noodle Beef 55g', 'Comforting beef soup instant mami noodle soup 55g', 'pack', 9.00, 12.00, 0.1200, 40, 120, 2),
    ('40000000-0000-0000-0001-000000000010', '30000000-0000-0000-0000-000000000006', 'INS-NIS-010', '480000000010', 'Nissin Cup Noodles Seafood 40g', 'Savory seafood broth with crab sticks and vegetables 40g', 'cup', 22.00, 28.00, 0.1200, 20, 60, 2),

    -- BEVERAGES & COFFEE
    ('40000000-0000-0000-0001-000000000011', '30000000-0000-0000-0000-000000000003', 'BEV-NES-011', '480000000011', 'Nescafe 3-in-1 Original 28g Sachet', 'Perfect blend of robusta coffee, creamer, and sugar 28g', 'sachet', 7.00, 9.50, 0.1200, 80, 250, 2),
    ('40000000-0000-0000-0001-000000000012', '30000000-0000-0000-0000-000000000003', 'BEV-KOP-012', '480000000012', 'Kopiko Blanca Coffee 30g Sachet', 'Smooth and velvety instant creamy white coffee 30g', 'sachet', 7.50, 10.00, 0.1200, 75, 220, 2),
    ('40000000-0000-0000-0001-000000000013', '30000000-0000-0000-0000-000000000003', 'BEV-COK-013', '480000000013', 'Coca-Cola Original 1.5L', 'Refreshing classic sparkling carbonated cola 1.5L bottle', 'bottle', 58.00, 72.00, 0.1200, 15, 40, 2),
    ('40000000-0000-0000-0001-000000000014', '30000000-0000-0000-0000-000000000003', 'BEV-SML-014', '480000000014', 'San Mig Light Can 330ml', 'Low calorie crisp and refreshing pale lager beer 330ml', 'can', 48.00, 62.00, 0.1200, 25, 60, 2),
    ('40000000-0000-0000-0001-000000000015', '30000000-0000-0000-0000-000000000003', 'BEV-ABS-015', '480000000015', 'Absolute Pure Distilled Water 1L', 'Pure and safe certified distilled drinking water 1L', 'bottle', 20.00, 26.00, 0.1200, 30, 90, 2),

    -- SNACKS
    ('40000000-0000-0000-0001-000000000016', '30000000-0000-0000-0000-000000000004', 'SNK-OIS-016', '480000000016', 'Oishi Prawn Crackers 60g', 'Crispy classic shrimp flavored snack crackers 60g', 'pack', 14.00, 18.50, 0.1200, 40, 100, 2),
    ('40000000-0000-0000-0001-000000000017', '30000000-0000-0000-0000-000000000004', 'SNK-PIA-017', '480000000017', 'Piattos Cheese 85g', 'Hexagonal crunchy potato crisps in rich cheddar cheese 85g', 'pack', 28.00, 36.00, 0.1200, 30, 80, 2),
    ('40000000-0000-0000-0001-000000000018', '30000000-0000-0000-0000-000000000004', 'SNK-NOV-018', '480000000018', 'Nova Country Cheddar 78g', 'Healthy multigrain chips in savory country cheddar 78g', 'pack', 27.50, 35.00, 0.1200, 25, 70, 2),

    -- PERSONAL CARE & HOUSEHOLD
    ('40000000-0000-0000-0001-000000000019', '30000000-0000-0000-0000-000000000005', 'PC-SAF-019', '480000000019', 'Safeguard Pure White Soap 130g', 'Germicidal antibacterial family white bar soap 130g', 'bar', 42.00, 52.00, 0.1200, 20, 50, 3),
    ('40000000-0000-0000-0001-000000000020', '30000000-0000-0000-0000-000000000005', 'HH-SRF-020', '480000000020', 'Surf Powder Detergent Rose Fresh 1kg', 'Active clean laundry powder with fresh rose fragrance 1kg', 'pack', 115.00, 145.00, 0.1200, 12, 35, 2)
ON CONFLICT (sku) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    barcode = EXCLUDED.barcode,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    unit_of_measure = EXCLUDED.unit_of_measure,
    cost_price = EXCLUDED.cost_price,
    retail_price = EXCLUDED.retail_price,
    tax_rate = EXCLUDED.tax_rate,
    reorder_point = EXCLUDED.reorder_point,
    reorder_quantity = EXCLUDED.reorder_quantity,
    lead_time_days = EXCLUDED.lead_time_days;

-- 6. Initial Inventory Levels
INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, quantity_reserved, safety_stock)
SELECT 
    '10000000-0000-0000-0000-000000000001'::uuid,
    p.id,
    v.stock_qty,
    0,
    v.safety_stock
FROM (
    VALUES
        ('RIC-SIN-001', 35, 10),
        ('RIC-JAS-002', 20, 8),
        ('BRD-GAR-003', 15, 5),
        ('CAN-TUN-004', 50, 15),
        ('CAN-CRN-005', 40, 12),
        ('CAN-CDO-006', 60, 18),
        ('CAN-MEG-007', 75, 20),
        ('INS-LKM-008', 120, 30),
        ('INS-LKM-009', 100, 25),
        ('INS-NIS-010', 45, 12),
        ('BEV-NES-011', 200, 50),
        ('BEV-KOP-012', 180, 45),
        ('BEV-COK-013', 30, 10),
        ('BEV-SML-014', 50, 15),
        ('BEV-ABS-015', 80, 20),
        ('SNK-OIS-016', 90, 25),
        ('SNK-PIA-017', 65, 18),
        ('SNK-NOV-018', 55, 15),
        ('PC-SAF-019', 40, 12),
        ('HH-SRF-020', 25, 8)
) AS v(sku, stock_qty, safety_stock)
JOIN products p ON p.sku = v.sku
ON CONFLICT (store_id, product_id) DO UPDATE SET
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    safety_stock = EXCLUDED.safety_stock;

-- 7. Initial AI Replenishment Recommendation Sample (in Philippine Pesos)
INSERT INTO forecast_runs (id, store_id, model_name, model_version, run_type, forecast_horizon_days, items_processed, metrics) VALUES
    ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'LightGBM-DemandForecaster-PH', 'v1.4.0', 'daily_scheduled', 14, 13, '{"wape": 0.062, "mae": 3.4}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO replenishment_recommendations (
    id, forecast_run_id, store_id, product_id, current_stock_on_hand,
    forecasted_demand_7d, forecasted_demand_14d, recommended_order_quantity,
    urgency, confidence_score, predicted_stockout_date, estimated_cost,
    reasoning_summary, status
) VALUES
    ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 
     8, 38.0, 75.0, 75, 'critical', 0.9780, CURRENT_DATE + INTERVAL '1 day', 5925.00,
     'Purefoods Corned Beef (8 cans left) will stock out tomorrow. Average daily velocity is 5.4 cans with +25% weekend surge.', 'pending_review'),
    ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 
     12, 26.0, 58.0, 60, 'high', 0.9410, CURRENT_DATE + INTERVAL '3 days', 13800.00,
     'Sinandomeng Rice 5kg (12 sacks) breached safety threshold (15). Lead time is 2 days from supplier. Order 60 sacks.', 'pending_review')
ON CONFLICT (id) DO NOTHING;
