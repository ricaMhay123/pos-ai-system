-- =====================================================================
-- Migration 004: Expand Philippine FMCG Retail Product Catalog
-- Adds comprehensive Philippine retail items across 6 core categories
-- =====================================================================

-- 1. Ensure categories exist with standard Philippine FMCG classifications
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

-- 2. Upsert 20 Realistic Philippine FMCG Products
INSERT INTO products (id, category_id, sku, barcode, name, description, unit_of_measure, cost_price, retail_price, tax_rate, reorder_point, reorder_quantity, lead_time_days, is_active) VALUES
    -- RICE & STAPLES
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'RIC-SIN-001', '480000000001', 'Sinandomeng Special Rice 5kg', 'Locally milled premium Sinandomeng special white rice 5kg', 'sack', 240.00, 285.00, 0.0000, 15, 40, 2, true),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'RIC-JAS-002', '480000000002', 'Dinorado Jasmine Rice 5kg', 'Fragrant Dinorado jasmine aromatic soft rice 5kg', 'sack', 310.00, 380.00, 0.0000, 10, 30, 3, true),
    ('40000000-0000-0000-0001-000000000003', '30000000-0000-0000-0000-000000000001', 'BRD-GAR-003', '480000000003', 'Gardenia Classic White Bread 600g', 'Freshly baked soft classic white sliced bread 600g', 'loaf', 62.00, 78.00, 0.1200, 8, 20, 1, true),

    -- CANNED GOODS
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'CAN-TUN-004', '480000000004', 'Century Tuna Flakes in Oil 180g', 'Healthy tuna flakes packed in rich soybean oil 180g', 'can', 31.50, 37.50, 0.1200, 25, 60, 3, true),
    ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'CAN-CRN-005', '480000000005', 'Purefoods Corned Beef 210g', 'Premium 100% pure seasoned cattle beef strands 210g', 'can', 82.00, 98.00, 0.1200, 20, 50, 2, true),
    ('40000000-0000-0000-0001-000000000006', '30000000-0000-0000-0000-000000000002', 'CAN-CDO-006', '480000000006', 'CDO Karne Norte 150g', 'Delicious guisado-style Filipino corned beef 150g', 'can', 21.00, 26.50, 0.1200, 30, 75, 2, true),
    ('40000000-0000-0000-0001-000000000007', '30000000-0000-0000-0000-000000000002', 'CAN-MEG-007', '480000000007', 'Mega Sardines in Tomato Sauce 155g', 'Fresh ocean catch sardines in rich tomato sauce 155g', 'can', 17.50, 22.00, 0.1200, 35, 100, 2, true),

    -- INSTANT FOODS
    ('40000000-0000-0000-0001-000000000008', '30000000-0000-0000-0000-000000000006', 'INS-LKM-008', '480000000008', 'Lucky Me! Pancit Canton Extra Hot 80g', 'Spicy stir-fried instant noodles with chili seasoning 80g', 'pack', 11.00, 14.50, 0.1200, 50, 150, 2, true),
    ('40000000-0000-0000-0001-000000000009', '30000000-0000-0000-0000-000000000006', 'INS-LKM-009', '480000000009', 'Lucky Me! Instant Noodle Beef 55g', 'Comforting beef soup instant mami noodle soup 55g', 'pack', 9.00, 12.00, 0.1200, 40, 120, 2, true),
    ('40000000-0000-0000-0001-000000000010', '30000000-0000-0000-0000-000000000006', 'INS-NIS-010', '480000000010', 'Nissin Cup Noodles Seafood 40g', 'Savory seafood broth with crab sticks and vegetables 40g', 'cup', 22.00, 28.00, 0.1200, 20, 60, 2, true),

    -- BEVERAGES & COFFEE
    ('40000000-0000-0000-0001-000000000011', '30000000-0000-0000-0000-000000000003', 'BEV-NES-011', '480000000011', 'Nescafe 3-in-1 Original 28g Sachet', 'Perfect blend of robusta coffee, creamer, and sugar 28g', 'sachet', 7.00, 9.50, 0.1200, 80, 250, 2, true),
    ('40000000-0000-0000-0001-000000000012', '30000000-0000-0000-0000-000000000003', 'BEV-KOP-012', '480000000012', 'Kopiko Blanca Coffee 30g Sachet', 'Smooth and velvety instant creamy white coffee 30g', 'sachet', 7.50, 10.00, 0.1200, 75, 220, 2, true),
    ('40000000-0000-0000-0001-000000000013', '30000000-0000-0000-0000-000000000003', 'BEV-COK-013', '480000000013', 'Coca-Cola Original 1.5L', 'Refreshing classic sparkling carbonated cola 1.5L bottle', 'bottle', 58.00, 72.00, 0.1200, 15, 40, 2, true),
    ('40000000-0000-0000-0001-000000000014', '30000000-0000-0000-0000-000000000003', 'BEV-SML-014', '480000000014', 'San Mig Light Can 330ml', 'Low calorie crisp and refreshing pale lager beer 330ml', 'can', 48.00, 62.00, 0.1200, 25, 60, 2, true),
    ('40000000-0000-0000-0001-000000000015', '30000000-0000-0000-0000-000000000003', 'BEV-ABS-015', '480000000015', 'Absolute Pure Distilled Water 1L', 'Pure and safe certified distilled drinking water 1L', 'bottle', 20.00, 26.00, 0.1200, 30, 90, 2, true),

    -- SNACKS
    ('40000000-0000-0000-0001-000000000016', '30000000-0000-0000-0000-000000000004', 'SNK-OIS-016', '480000000016', 'Oishi Prawn Crackers 60g', 'Crispy classic shrimp flavored snack crackers 60g', 'pack', 14.00, 18.50, 0.1200, 40, 100, 2, true),
    ('40000000-0000-0000-0001-000000000017', '30000000-0000-0000-0000-000000000004', 'SNK-PIA-017', '480000000017', 'Piattos Cheese 85g', 'Hexagonal crunchy potato crisps in rich cheddar cheese 85g', 'pack', 28.00, 36.00, 0.1200, 30, 80, 2, true),
    ('40000000-0000-0000-0001-000000000018', '30000000-0000-0000-0000-000000000004', 'SNK-NOV-018', '480000000018', 'Nova Country Cheddar 78g', 'Healthy multigrain chips in savory country cheddar 78g', 'pack', 27.50, 35.00, 0.1200, 25, 70, 2, true),

    -- PERSONAL CARE & HOUSEHOLD
    ('40000000-0000-0000-0001-000000000019', '30000000-0000-0000-0000-000000000005', 'PC-SAF-019', '480000000019', 'Safeguard Pure White Soap 130g', 'Germicidal antibacterial family white bar soap 130g', 'bar', 42.00, 52.00, 0.1200, 20, 50, 3, true),
    ('40000000-0000-0000-0001-000000000020', '30000000-0000-0000-0000-000000000005', 'HH-SRF-020', '480000000020', 'Surf Powder Detergent Rose Fresh 1kg', 'Active clean laundry powder with fresh rose fragrance 1kg', 'pack', 115.00, 145.00, 0.1200, 12, 35, 2, true)
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
    lead_time_days = EXCLUDED.lead_time_days,
    is_active = EXCLUDED.is_active;

-- 3. Populate Primary Store Stock Levels (BGC Flagship Terminal 10000000-0000-0000-0000-000000000001)
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
