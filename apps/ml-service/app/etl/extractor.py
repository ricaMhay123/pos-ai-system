import logging
from typing import Dict, Any, List, Optional
import pandas as pd
from app.database import Database

logger = logging.getLogger("ETL.Extractor")

class SalesExtractor:
    """
    Extracts transaction history, inventory levels, and product catalog metadata
    from PostgreSQL.
    """

    @staticmethod
    def get_active_products() -> pd.DataFrame:
        """
        Extracts active products with category, cost price, and lead times.
        """
        sql = """
            SELECT 
                p.id as product_id,
                p.sku,
                p.name as product_name,
                p.category_id,
                COALESCE(c.name, 'General') as category_name,
                p.unit_of_measure,
                p.cost_price::FLOAT as cost_price,
                p.retail_price::FLOAT as retail_price,
                p.tax_rate::FLOAT as tax_rate,
                p.reorder_point,
                p.reorder_quantity,
                p.lead_time_days
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.is_active = true
            ORDER BY p.name ASC
        """
        rows = Database.query(sql)
        df = pd.DataFrame(rows)
        if df.empty:
            return pd.DataFrame(columns=[
                "product_id", "sku", "product_name", "category_id", "category_name",
                "unit_of_measure", "cost_price", "retail_price", "tax_rate",
                "reorder_point", "reorder_quantity", "lead_time_days"
            ])
        return df

    @staticmethod
    def get_inventory_levels(store_id: str) -> pd.DataFrame:
        """
        Extracts real-time inventory level snapshot for a given store.
        """
        sql = f"""
            SELECT 
                store_id,
                product_id,
                quantity_on_hand,
                quantity_reserved,
                (quantity_on_hand - quantity_reserved) as quantity_available,
                safety_stock
            FROM inventory_levels
            WHERE store_id = '{store_id}'
        """
        rows = Database.query(sql)
        df = pd.DataFrame(rows)
        if df.empty:
            return pd.DataFrame(columns=[
                "store_id", "product_id", "quantity_on_hand",
                "quantity_reserved", "quantity_available", "safety_stock"
            ])
        return df

    @staticmethod
    def get_daily_sales_history(store_id: str, days_lookback: int = 180) -> pd.DataFrame:
        """
        Extracts aggregated daily product sales for a store over the lookback window.
        """
        sql = f"""
            SELECT 
                DATE(st.created_at) as sale_date,
                sli.product_id,
                SUM(sli.quantity)::INT as units_sold,
                SUM(sli.total_price)::FLOAT as gross_sales,
                COUNT(DISTINCT st.id)::INT as transaction_count
            FROM sales_line_items sli
            JOIN sales_transactions st ON st.id = sli.transaction_id
            WHERE st.store_id = '{store_id}'
              AND st.status = 'completed'
              AND st.created_at >= (CURRENT_DATE - INTERVAL '{days_lookback} days')
            GROUP BY DATE(st.created_at), sli.product_id
            ORDER BY sale_date ASC, sli.product_id ASC
        """
        rows = Database.query(sql)
        df = pd.DataFrame(rows)
        if df.empty:
            return pd.DataFrame(columns=[
                "sale_date", "product_id", "units_sold", "gross_sales", "transaction_count"
            ])
        df["sale_date"] = pd.to_datetime(df["sale_date"])
        return df
