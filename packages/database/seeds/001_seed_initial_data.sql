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

-- 4. Five Core Philippine Retail Categories
INSERT INTO categories (id, name, slug, description) VALUES
    ('30000000-0000-0000-0000-000000000001', 'Rice & Carbs', 'rice-carbs', 'Staple rice varieties, noodles, pastas, and flour'),
    ('30000000-0000-0000-0000-000000000002', 'Canned Goods & Instant Meals', 'canned-goods', 'Canned tuna, corned beef, sardines, and luncheon meats'),
    ('30000000-0000-0000-0000-000000000003', 'Beverages', 'beverages', 'Coffee, local beers, juices, mineral water, and powdered milk'),
    ('30000000-0000-0000-0000-000000000004', 'Snacks & Confectionery', 'snacks', 'Chips, crackers, traditional biscuits, and sweets'),
    ('30000000-0000-0000-0000-000000000005', 'Personal Care & Household', 'personal-care', 'Soaps, shampoos, oral care, and laundry supplies')
ON CONFLICT (slug) DO NOTHING;

-- 5. Products with Philippine Peso (PHP / ₱) Pricing & 12% Standard VAT
INSERT INTO products (id, category_id, sku, barcode, name, description, unit_of_measure, cost_price, retail_price, tax_rate, reorder_point, reorder_quantity, lead_time_days) VALUES
    -- Rice & Carbs (Uncooked rice is standard VAT-exempt 0% per BIR, noodles 12%)
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'RIC-SIN-001', '480001660101', 'Sinandomeng Special Rice 5kg', 'Locally milled premium soft white rice', 'sack', 230.00, 285.00, 0.0000, 20, 60, 2),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'RIC-JAS-002', '480001660102', 'Dinorado Jasmine Rice 5kg', 'Aromatic long-grain fragrant rice', 'sack', 280.00, 345.00, 0.0000, 15, 50, 3),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'NOD-LKM-003', '480001660103', 'Lucky Me! Pancit Canton Kalamansi 60g (Pack of 6)', 'Favorite Filipino stir-fried noodles bundle', 'pack', 62.00, 78.00, 0.1200, 40, 120, 2),
    
    -- Canned Goods
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'CAN-TUN-004', '480001660201', 'Century Tuna Flakes in Oil 180g', 'Omega-3 rich premium yellowfin tuna flakes', 'can', 37.50, 46.75, 0.1200, 30, 90, 3),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'CAN-CRN-005', '480001660202', 'Purefoods Corned Beef 210g', 'Classic seasoned 100% pure beef', 'can', 79.00, 98.50, 0.1200, 25, 75, 2),
    ('40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'CAN-SRD-006', '480001660203', 'Mega Sardines in Tomato Sauce with Chili 155g', 'Deep ocean sardines in rich tomato sauce', 'can', 21.00, 27.50, 0.1200, 50, 150, 2),

    -- Beverages
    ('40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', 'BEV-KOP-007', '480001660301', 'Kopiko Blanca 3-in-1 Coffee 30g (10-Sachet Bag)', 'Creamy sweet instant white coffee', 'bag', 68.00, 85.00, 0.1200, 30, 90, 2),
    ('40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', 'BEV-SMB-008', '480001660302', 'San Miguel Pale Pilsen 330ml Can', 'Iconic Philippine golden lager beer', 'can', 45.00, 58.00, 0.1200, 40, 120, 2),
    ('40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', 'BEV-C2T-009', '480001660303', 'C2 Cool & Clean Green Tea Apple 500ml', 'Brewed real green tea with crisp apple', 'bottle', 24.00, 31.00, 0.1200, 35, 100, 2),

    -- Snacks
    ('40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000004', 'SNK-PIA-010', '480001660401', 'Piattos Cheese Flavored Potato Crisps 85g', 'Hexagonal crunchy cheese potato snack', 'pack', 30.50, 38.50, 0.1200, 35, 100, 2),
    ('40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000004', 'SNK-OIS-011', '480001660402', 'Oishi Prawn Crackers Spicy 60g', 'Savory crisp prawn snack', 'pack', 17.00, 22.00, 0.1200, 40, 120, 2),

    -- Personal Care & Household
    ('40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000005', 'PCR-SFG-012', '480001660501', 'Safeguard Pure White Family Soap Bar 130g', 'Classic 99.9% germ protection bar soap', 'bar', 38.00, 48.00, 0.1200, 30, 90, 3),
    ('40000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000005', 'PCR-COL-013', '480001660502', 'Colgate Total Clean Mint Toothpaste 150g', 'Antibacterial complete oral care paste', 'tube', 105.00, 134.00, 0.1200, 20, 60, 3)
ON CONFLICT (sku) DO NOTHING;

-- 6. Initial Inventory Levels
INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, quantity_reserved, safety_stock) VALUES
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 12, 0, 15),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 45, 0, 20),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 85, 0, 25),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 18, 0, 25),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 8, 0, 20),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', 60, 0, 25),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', 75, 0, 30),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', 90, 0, 35),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', 55, 0, 20),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', 40, 0, 20),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', 50, 0, 25),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000012', 45, 0, 20),
    ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000013', 35, 0, 15)
ON CONFLICT (store_id, product_id) DO UPDATE SET quantity_on_hand = EXCLUDED.quantity_on_hand;

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
