-- =====================================================================
-- POS AI Seed 002: 50 Real Philippine FMCG Products & 6-Month Sales Data (PHP)
-- =====================================================================
-- Standard Currency: PHP (₱)
-- Standard VAT: 12% (0.1200)
-- Categories:
--   1. Rice & Carbs (ric-carbs)
--   2. Canned Goods & Meals (canned-goods)
--   3. Beverages (beverages)
--   4. Snacks & Confectionery (snacks)
--   5. Personal Care & Household (personal-care)
-- =====================================================================

DO $$
DECLARE
    v_store_id UUID := '10000000-0000-0000-0000-000000000001'; -- BGC Flagship
    v_cashier_id UUID := '20000000-0000-0000-0000-000000000001'; -- Juan Dela Cruz
    v_cat_ric UUID := '30000000-0000-0000-0000-000000000001';
    v_cat_can UUID := '30000000-0000-0000-0000-000000000002';
    v_cat_bev UUID := '30000000-0000-0000-0000-000000000003';
    v_cat_snk UUID := '30000000-0000-0000-0000-000000000004';
    v_cat_pcr UUID := '30000000-0000-0000-0000-000000000005';
BEGIN
    -- 1. Ensure Core 5 Philippine Retail Categories
    INSERT INTO categories (id, name, slug, description) VALUES
        (v_cat_ric, 'Rice & Carbs', 'rice-carbs', 'Staple rice varieties, noodles, pastas, and flour'),
        (v_cat_can, 'Canned Goods & Instant Meals', 'canned-goods', 'Canned tuna, corned beef, sardines, and luncheon meats'),
        (v_cat_bev, 'Beverages', 'beverages', 'Coffee, local beers, juices, mineral water, and powdered milk'),
        (v_cat_snk, 'Snacks & Confectionery', 'snacks', 'Chips, crackers, traditional biscuits, and sweets'),
        (v_cat_pcr, 'Personal Care & Household', 'personal-care', 'Soaps, shampoos, oral care, and laundry supplies')
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Insert 50 Real Philippine Supermarket Products (Prices ₱10.00 to ₱495.00)
    INSERT INTO products (id, category_id, sku, barcode, name, description, unit_of_measure, cost_price, retail_price, tax_rate, reorder_point, reorder_quantity, lead_time_days) VALUES
    -- Category 1: Rice & Carbs (1-10)
    ('40000000-0000-0000-0000-000000000020', v_cat_ric, 'RIC-SIN-5KG', '480001661020', 'Sinandomeng Rice 5kg', 'Local well-milled white grain staple rice', 'sack', 230.00, 285.00, 0.0000, 20, 60, 2),
    ('40000000-0000-0000-0000-000000000021', v_cat_ric, 'RIC-DIN-5KG', '480001661021', 'Dinorado Fragrant Rice 5kg', 'Aromatic pinkish long grain soft rice', 'sack', 290.00, 360.00, 0.0000, 15, 50, 3),
    ('40000000-0000-0000-0000-000000000022', v_cat_ric, 'RIC-JAS-5KG', '480001661022', 'Thai Jasmine Rice 5kg', 'Imported fragrant fluffy jasmine grain', 'sack', 380.00, 475.00, 0.0000, 12, 40, 4),
    ('40000000-0000-0000-0000-000000000023', v_cat_ric, 'RIC-BRW-2KG', '480001661023', 'Organic Brown Rice 2kg', 'Nutritious unpolished whole grain rice', 'pack', 145.00, 185.00, 0.0000, 10, 30, 3),
    ('40000000-0000-0000-0000-000000000024', v_cat_ric, 'NOD-LKM-KAL', '480001661024', 'Lucky Me! Pancit Canton Kalamansi 60g', 'Classic citrus instant stir-fried noodles', 'pack', 12.00, 15.50, 0.1200, 60, 200, 2),
    ('40000000-0000-0000-0000-000000000025', v_cat_ric, 'NOD-LKM-HOT', '480001661025', 'Lucky Me! Pancit Canton Hot Chili 60g', 'Spicy savory instant stir-fried noodles', 'pack', 12.00, 15.50, 0.1200, 60, 200, 2),
    ('40000000-0000-0000-0000-000000000026', v_cat_ric, 'NOD-LKM-BEE', '480001661026', 'Lucky Me! Instant Mami Beef 55g', 'Comforting savory beef noodle soup', 'pack', 11.50, 14.50, 0.1200, 50, 150, 2),
    ('40000000-0000-0000-0000-000000000027', v_cat_ric, 'NOD-NIS-YAK', '480001661027', 'Nissin Yakisoba Spicy Chicken 77g', 'Japanese style sweet savory stir-fry noodles', 'pack', 17.00, 22.00, 0.1200, 40, 120, 2),
    ('40000000-0000-0000-0000-000000000028', v_cat_ric, 'PAS-FIE-SPA', '480001661028', 'Fiesta Spaghetti Pasta 900g', 'Firm durum wheat family size pasta pack', 'pack', 72.00, 89.00, 0.1200, 25, 75, 2),
    ('40000000-0000-0000-0000-000000000029', v_cat_ric, 'PAS-FIE-SAU', '480001661029', 'Del Monte Sweet Style Spaghetti Sauce 1kg', 'Sweet Filipino favorite spaghetti sauce pouch', 'pouch', 75.00, 94.50, 0.1200, 25, 80, 2),

    -- Category 2: Canned Goods & Instant Meals (11-20)
    ('40000000-0000-0000-0000-000000000030', v_cat_can, 'CAN-TUN-OIL', '480001662030', 'Century Tuna Flakes in Oil 180g', 'Omega-3 rich yellowfin tuna flakes in oil', 'can', 37.50, 46.75, 0.1200, 30, 90, 2),
    ('40000000-0000-0000-0000-000000000031', v_cat_can, 'CAN-TUN-HOT', '480001662031', 'Century Tuna Hot & Spicy 180g', 'Zesty spiced tuna flakes with chili peppers', 'can', 37.50, 46.75, 0.1200, 30, 90, 2),
    ('40000000-0000-0000-0000-000000000032', v_cat_can, 'CAN-SAN-CAL', '480001662032', 'San Marino Corned Tuna 180g', 'Heart-healthy savory corned tuna flakes', 'can', 39.00, 49.00, 0.1200, 25, 80, 2),
    ('40000000-0000-0000-0000-000000000033', v_cat_can, 'CAN-PUR-CRN', '480001662033', 'Purefoods Corned Beef 210g', 'Premium 100% pure beef with savory strands', 'can', 79.00, 98.50, 0.1200, 25, 75, 2),
    ('40000000-0000-0000-0000-000000000034', v_cat_can, 'CAN-PUR-LGE', '480001662034', 'Purefoods Corned Beef 380g', 'Family size classic savory corned beef', 'can', 142.00, 178.00, 0.1200, 15, 45, 2),
    ('40000000-0000-0000-0000-000000000035', v_cat_can, 'CAN-ARG-CRN', '480001662035', 'Argentina Corned Beef 175g', 'Budget-friendly juicy seasoned corned beef', 'can', 34.00, 42.50, 0.1200, 35, 100, 2),
    ('40000000-0000-0000-0000-000000000036', v_cat_can, 'CAN-MEG-RED', '480001662036', 'Mega Sardines in Tomato Sauce 155g', 'Premium deep sea sardines in red sauce', 'can', 21.00, 27.50, 0.1200, 40, 120, 2),
    ('40000000-0000-0000-0000-000000000037', v_cat_can, 'CAN-555-SRD', '480001662037', '555 Sardines in Tomato Sauce 155g', 'Affordable hearty tomato sauce sardines', 'can', 19.50, 25.00, 0.1200, 45, 140, 2),
    ('40000000-0000-0000-0000-000000000038', v_cat_can, 'CAN-SPM-LUN', '480001662038', 'SPAM Luncheon Meat Classic 340g', 'Original Hormel pork and ham luncheon loaf', 'can', 185.00, 235.00, 0.1200, 15, 45, 3),
    ('40000000-0000-0000-0000-000000000039', v_cat_can, 'CAN-MAL-POK', '480001662039', 'Maling Pork Luncheon Meat 397g', 'Classic oriental savory pork lunch loaf', 'can', 95.00, 119.00, 0.1200, 20, 60, 3),

    -- Category 3: Beverages (21-30)
    ('40000000-0000-0000-0000-000000000040', v_cat_bev, 'BEV-KOP-BLA', '480001663040', 'Kopiko Blanca 3-in-1 Coffee 30g x 10s', 'Creamy sweet instant white coffee bag', 'bag', 68.00, 85.00, 0.1200, 30, 90, 2),
    ('40000000-0000-0000-0000-000000000041', v_cat_bev, 'BEV-NES-CLS', '480001663041', 'Nescafe Classic Instant Coffee Jar 100g', 'Pure roasted soluble coffee granules jar', 'jar', 135.00, 169.00, 0.1200, 20, 60, 3),
    ('40000000-0000-0000-0000-000000000042', v_cat_bev, 'BEV-MIL-POW', '480001663042', 'Milo Choco Malt Powder 1kg', 'Nutritious chocolate malt energy drink bag', 'bag', 225.00, 279.00, 0.1200, 18, 55, 3),
    ('40000000-0000-0000-0000-000000000043', v_cat_bev, 'BEV-BRB-POW', '480001663043', 'Bear Brand Fortified Powdered Milk 900g', 'Tibay-resistensya powdered milk drink', 'bag', 255.00, 319.00, 0.1200, 20, 60, 2),
    ('40000000-0000-0000-0000-000000000044', v_cat_bev, 'BEV-SMB-PIL', '480001663044', 'San Miguel Pale Pilsen 330ml Can', 'Heritage full-bodied pilsen lager can', 'can', 46.00, 58.00, 0.1200, 40, 120, 2),
    ('40000000-0000-0000-0000-000000000045', v_cat_bev, 'BEV-SMB-LIG', '480001663045', 'San Mig Light 330ml Can', 'Crisp low-calorie smooth golden lager', 'can', 46.00, 58.00, 0.1200, 40, 120, 2),
    ('40000000-0000-0000-0000-000000000046', v_cat_bev, 'BEV-RED-HRS', '480001663046', 'Red Horse Beer Extra Strong 500ml Can', 'High-gravity extra strong malt beer', 'can', 62.00, 78.00, 0.1200, 35, 100, 2),
    ('40000000-0000-0000-0000-000000000047', v_cat_bev, 'BEV-C2T-APL', '480001663047', 'C2 Cool & Clean Apple Green Tea 500ml', 'Refreshing real green tea brew with apple', 'bottle', 24.00, 31.00, 0.1200, 35, 100, 2),
    ('40000000-0000-0000-0000-000000000048', v_cat_bev, 'BEV-NAT-WTR', '480001663048', 'Nature Spring Purified Water 1L', 'Crisp bottled daily drinking water', 'bottle', 18.00, 24.00, 0.1200, 50, 150, 1),
    ('40000000-0000-0000-0000-000000000049', v_cat_bev, 'BEV-GAT-BLU', '480001663049', 'Gatorade Blue Bolt 500ml', 'Electrolyte sports performance drink', 'bottle', 38.00, 48.00, 0.1200, 25, 75, 2),

    -- Category 4: Snacks & Confectionery (31-40)
    ('40000000-0000-0000-0000-000000000050', v_cat_snk, 'SNK-PIA-CHE', '480001664050', 'Piattos Cheese Flavor 85g', 'Hexagon premium potato chips snack', 'pack', 30.50, 38.50, 0.1200, 35, 100, 2),
    ('40000000-0000-0000-0000-000000000051', v_cat_snk, 'SNK-PIA-SRM', '480001664051', 'Piattos Sour Cream & Onion 85g', 'Tangy savory potato chips snack', 'pack', 30.50, 38.50, 0.1200, 35, 100, 2),
    ('40000000-0000-0000-0000-000000000052', v_cat_snk, 'SNK-NOV-CHE', '480001664052', 'Nova Multigrain Chips Country Cheddar 78g', 'Fiber-rich crunchy 4-grain chips snack', 'pack', 31.00, 39.50, 0.1200, 30, 90, 2),
    ('40000000-0000-0000-0000-000000000053', v_cat_snk, 'SNK-OIS-PRW', '480001664053', 'Oishi Prawn Crackers Regular 60g', 'Classic crispy salted prawn snack', 'pack', 17.00, 22.00, 0.1200, 40, 120, 2),
    ('40000000-0000-0000-0000-000000000054', v_cat_snk, 'SNK-CHI-CRN', '480001664054', 'Chippy Barbecue Flavor 110g', 'Iconic Filipino corn chips barbecue snack', 'pack', 28.00, 35.00, 0.1200, 35, 100, 2),
    ('40000000-0000-0000-0000-000000000055', v_cat_snk, 'SNK-MRR-BIS', '480001664055', 'Rebisco Marie Biscuits 10x25g Pack', 'Traditional sweet golden round tea biscuits', 'pack', 36.00, 45.00, 0.1200, 25, 75, 2),
    ('40000000-0000-0000-0000-000000000056', v_cat_snk, 'SNK-FUD-CHO', '480001664056', 'Fudgee Barr Chocolate 10s Pack', 'Moist rich chocolate cake bar with fudge', 'pack', 64.00, 79.00, 0.1200, 25, 75, 2),
    ('40000000-0000-0000-0000-000000000057', v_cat_snk, 'SNK-CHN-NUT', '480001664057', 'King Choc-Nut 24s Box', 'Classic peanut chocolate milk candy bars', 'box', 42.00, 54.00, 0.1200, 30, 90, 2),
    ('40000000-0000-0000-0000-000000000058', v_cat_snk, 'SNK-SKY-FLK', '480001664058', 'SkyFlakes Crackers Tub 800g', 'Crisp fresh-baked salted soda crackers tub', 'tub', 175.00, 219.00, 0.1200, 15, 45, 3),
    ('40000000-0000-0000-0000-000000000059', v_cat_snk, 'SNK-MND-CHO', '480001664059', 'Goya Milk Chocolate Bar 100g', 'Smooth classic Philippine milk chocolate bar', 'bar', 45.00, 58.00, 0.1200, 25, 80, 2),

    -- Category 5: Personal Care & Household (41-50)
    ('40000000-0000-0000-0000-000000000060', v_cat_pcr, 'PCR-SFG-WHT', '480001665060', 'Safeguard Pure White Soap 130g', '99.9% germ protection floral white bar soap', 'bar', 38.00, 48.00, 0.1200, 30, 90, 3),
    ('40000000-0000-0000-0000-000000000061', v_cat_pcr, 'PCR-SFG-PNK', '480001665061', 'Safeguard Floral Pink Soap 130g', 'Antibacterial gentle pink fragrance bar soap', 'bar', 38.00, 48.00, 0.1200, 30, 90, 3),
    ('40000000-0000-0000-0000-000000000062', v_cat_pcr, 'PCR-COL-MNT', '480001665062', 'Colgate Great Regular Flavor 150g', 'Maximum cavity protection fluoride toothpaste', 'tube', 88.00, 112.00, 0.1200, 20, 60, 3),
    ('40000000-0000-0000-0000-000000000063', v_cat_pcr, 'PCR-CLS-RED', '480001665063', 'Close Up Red Hot Gel Toothpaste 145ml', 'Cinnamon blast antibacterial fresh breath gel', 'tube', 92.00, 118.00, 0.1200, 20, 60, 3),
    ('40000000-0000-0000-0000-000000000064', v_cat_pcr, 'PCR-PLM-SHM', '480001665064', 'Palmolive Naturals Shampoo Intensive 180ml', 'Coco cream moisture intensive shampoo bottle', 'bottle', 86.00, 109.00, 0.1200, 20, 60, 3),
    ('40000000-0000-0000-0000-000000000065', v_cat_pcr, 'PCR-SUN-SHM', '480001665065', 'Sunsilk Smooth & Manageable 180ml', 'Floral fragrance smooth all-day hair shampoo', 'bottle', 88.00, 112.00, 0.1200, 20, 60, 3),
    ('40000000-0000-0000-0000-000000000066', v_cat_pcr, 'PCR-SRF-POW', '480001665066', 'Surf Blossom Fresh Powder Detergent 800g', 'Multi-purpose fragrance laundry powder pouch', 'pack', 82.00, 105.00, 0.1200, 25, 80, 2),
    ('40000000-0000-0000-0000-000000000067', v_cat_pcr, 'PCR-DWN-FAB', '480001665067', 'Downy Sunrise Fresh Fabric Softener 600ml', 'All-day odor protection concentrated softener', 'pouch', 115.00, 145.00, 0.1200, 20, 60, 2),
    ('40000000-0000-0000-0000-000000000068', v_cat_pcr, 'PCR-JOY-LIQ', '480001665068', 'Joy Lemon Dishwashing Liquid 495ml', 'Anti-bac grease cutting dishwashing liquid', 'bottle', 110.00, 139.00, 0.1200, 20, 60, 2),
    ('40000000-0000-0000-0000-000000000069', v_cat_pcr, 'PCR-GRN-ALC', '480001665069', 'Green Cross 70% Isopropyl Alcohol 500ml', 'Antiseptic disinfectant rubbing alcohol bottle', 'bottle', 72.00, 89.00, 0.1200, 30, 90, 2)
    ON CONFLICT (sku) DO NOTHING;

    -- 3. Upsert inventory levels for all 50 products
    INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, quantity_reserved, safety_stock)
    SELECT
        v_store_id,
        p.id,
        (p.reorder_point + (FLOOR(RANDOM() * 30) + 5)::INT) AS quantity_on_hand,
        0 AS quantity_reserved,
        (p.reorder_point / 2) AS safety_stock
    FROM products p
    ON CONFLICT (store_id, product_id) DO NOTHING;

    RAISE NOTICE '50 Real Philippine FMCG products initialized successfully.';
END $$;

-- =====================================================================
-- 4. 180 Days of Historical POS Sales in Philippine Peso (PHP / ₱)
-- Basket Values Range: ₱250.00 to ₱1,500.00 per transaction
-- =====================================================================

DO $$
DECLARE
    v_store_id UUID := '10000000-0000-0000-0000-000000000001';
    v_cashier_id UUID := '20000000-0000-0000-0000-000000000001';
    v_day_offset INT;
    v_current_day DATE;
    v_day_of_week INT;
    v_txns_today INT;
    v_txn_idx INT;
    v_txn_id UUID;
    v_txn_number VARCHAR(60);
    v_subtotal NUMERIC(12, 4);
    v_vat NUMERIC(12, 4);
    v_discount NUMERIC(12, 4);
    v_total NUMERIC(12, 4);
    v_product RECORD;
    v_qty INT;
    v_line_total NUMERIC(12, 4);
    v_created_time TIMESTAMPTZ;
    v_is_senior BOOLEAN;
    v_pay_method payment_method_type;
BEGIN
    RAISE NOTICE 'Generating 180 days of realistic Philippine retail transactions...';

    FOR v_day_offset IN REVERSE 180..1 LOOP
        v_current_day := CURRENT_DATE - (v_day_offset * INTERVAL '1 day')::INTERVAL;
        v_day_of_week := EXTRACT(DOW FROM v_current_day); -- 0: Sunday, 5: Friday, 6: Saturday

        -- Weekend volume uplift in Philippine malls / supermarkets
        IF v_day_of_week IN (0, 5, 6) THEN
            v_txns_today := 28 + (FLOOR(RANDOM() * 14))::INT;
        ELSE
            v_txns_today := 18 + (FLOOR(RANDOM() * 8))::INT;
        END IF;

        FOR v_txn_idx IN 1..v_txns_today LOOP
            v_txn_id := gen_random_uuid();
            v_txn_number := 'TXN-PH-' || TO_CHAR(v_current_day, 'YYYYMMDD') || '-' || LPAD(v_txn_idx::TEXT, 4, '0');
            v_created_time := (v_current_day + (9 + FLOOR(RANDOM() * 11)) * INTERVAL '1 hour' + (FLOOR(RANDOM() * 59)) * INTERVAL '1 minute')::TIMESTAMPTZ;

            v_subtotal := 0.0000;
            v_vat := 0.0000;
            v_discount := 0.0000;
            
            -- ~10% probability of Senior Citizen / PWD 20% discount & VAT-Exemption
            v_is_senior := (RANDOM() < 0.10);

            INSERT INTO sales_transactions (
                id, store_id, cashier_id, transaction_number, status,
                subtotal_amount, tax_amount, discount_amount, total_amount,
                idempotency_key, created_at, updated_at
            ) VALUES (
                v_txn_id, v_store_id, v_cashier_id, v_txn_number, 'completed',
                0, 0, 0, 0,
                'idemp-' || v_txn_number, v_created_time, v_created_time
            );

            -- Select 3 to 7 products to reach realistic Philippine ticket sizes (₱250 - ₱1,500)
            FOR v_product IN (
                SELECT id, sku, name, cost_price, retail_price, tax_rate
                FROM products
                ORDER BY RANDOM()
                LIMIT (3 + FLOOR(RANDOM() * 5))::INT
            ) LOOP
                v_qty := 1 + (FLOOR(RANDOM() * 3))::INT; -- 1 to 3 pieces
                v_line_total := ROUND(v_product.retail_price * v_qty, 4);
                
                v_subtotal := v_subtotal + v_line_total;

                IF NOT v_is_senior THEN
                    v_vat := v_vat + ROUND(v_line_total * v_product.tax_rate, 4);
                END IF;

                INSERT INTO sales_line_items (
                    id, transaction_id, product_id, sku, product_name,
                    quantity, unit_cost, unit_price, tax_rate, discount_amount, total_price, created_at
                ) VALUES (
                    gen_random_uuid(), v_txn_id, v_product.id, v_product.sku, v_product.name,
                    v_qty, v_product.cost_price, v_product.retail_price, 
                    CASE WHEN v_is_senior THEN 0.0000 ELSE v_product.tax_rate END,
                    0, v_line_total, v_created_time
                );
            END LOOP;

            -- Apply 20% Senior/PWD discount if applicable
            IF v_is_senior THEN
                v_discount := ROUND(v_subtotal * 0.2000, 4);
                v_total := ROUND(v_subtotal - v_discount, 4);
            ELSE
                v_total := ROUND(v_subtotal + v_vat, 4);
            END IF;

            UPDATE sales_transactions
            SET subtotal_amount = v_subtotal,
                tax_amount = v_vat,
                discount_amount = v_discount,
                total_amount = v_total
            WHERE id = v_txn_id;

            -- In PH: 50% Cash, 30% GCash / Maya (digital wallet), 20% Credit/Debit Card
            IF RANDOM() < 0.50 THEN
                v_pay_method := 'cash'::payment_method_type;
            ELSIF RANDOM() < 0.80 THEN
                v_pay_method := 'digital_wallet'::payment_method_type;
            ELSE
                v_pay_method := 'credit_card'::payment_method_type;
            END IF;

            INSERT INTO payment_records (
                id, transaction_id, method, status, amount, last_four, created_at
            ) VALUES (
                gen_random_uuid(),
                v_txn_id,
                v_pay_method,
                'captured',
                v_total,
                LPAD((1000 + FLOOR(RANDOM() * 9000))::INT::TEXT, 4, '0'),
                v_created_time
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE '180 Days of Philippine POS sales transactions generated successfully.';
END $$;
