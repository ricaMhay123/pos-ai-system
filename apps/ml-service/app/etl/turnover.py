import math
import logging
from typing import Dict, Any, List
import pandas as pd

logger = logging.getLogger("ETL.Turnover")

class InventoryTurnoverCalculator:
    """
    Computes retail inventory turnover metrics, sell-through rates, and stock velocity.
    Adheres to Philippine retail standard definitions:
      - Inventory Turnover Ratio = Cost of Goods Sold (COGS) / Average Inventory Value
      - Days Sales of Inventory (DSI) = Window Days / Turnover Ratio
      - Stock Velocity Classification (Fast Mover, Regular, Slow Mover, Dead Stock)
    """

    @staticmethod
    def calculate_metrics(
        products_df: pd.DataFrame,
        inventory_df: pd.DataFrame,
        daily_sales_df: pd.DataFrame,
        window_days: int = 180
    ) -> pd.DataFrame:
        """
        Merges catalog, inventory, and sales to calculate turnover metrics per product.
        """
        if products_df.empty:
            return pd.DataFrame()

        # Aggregate total units sold and gross sales by product
        if not daily_sales_df.empty:
            sales_summary = daily_sales_df.groupby("product_id").agg(
                total_units_sold=("units_sold", "sum"),
                total_revenue=("gross_sales", "sum"),
                active_days=("sale_date", "nunique")
            ).reset_index()
        else:
            sales_summary = pd.DataFrame(columns=["product_id", "total_units_sold", "total_revenue", "active_days"])

        # Merge catalog with inventory levels
        merged = pd.merge(products_df, inventory_df, on="product_id", how="left")
        merged["quantity_on_hand"] = merged["quantity_on_hand"].fillna(0).astype(int)
        merged["safety_stock"] = merged["safety_stock"].fillna(10).astype(int)

        # Merge with sales summary
        merged = pd.merge(merged, sales_summary, on="product_id", how="left")
        merged["total_units_sold"] = merged["total_units_sold"].fillna(0).astype(int)
        merged["total_revenue"] = merged["total_revenue"].fillna(0.0).astype(float)
        merged["active_days"] = merged["active_days"].fillna(0).astype(int)

        results = []
        for _, row in merged.iterrows():
            units_sold = row["total_units_sold"]
            cost_price = float(row["cost_price"])
            retail_price = float(row["retail_price"])
            current_stock = int(row["quantity_on_hand"])

            # Cost of Goods Sold (COGS)
            cogs = units_sold * cost_price

            # Average stock level estimated over window (ending stock + sold/2 or current stock)
            avg_stock_units = max(1.0, current_stock + (units_sold / 2.0))
            avg_inventory_val = avg_stock_units * cost_price

            # Inventory Turnover Ratio
            turnover_ratio = round(cogs / avg_inventory_val, 3) if avg_inventory_val > 0 else 0.0

            # Annualized Turnover = (Turnover in Window / Window Days) * 365
            annualized_turnover = round((turnover_ratio / max(1, window_days)) * 365, 2)

            # Days Sales of Inventory (DSI) = Window Days / Turnover Ratio
            if turnover_ratio > 0:
                dsi = round(window_days / turnover_ratio, 1)
            else:
                dsi = 999.0  # Dead stock or 0 turnover

            # Daily Sales Velocity
            daily_velocity = round(units_sold / float(window_days), 2)

            # Sell-Through Rate (%): units sold / (units sold + ending inventory)
            total_available = units_sold + current_stock
            sell_through_rate = round((units_sold / total_available) * 100.0, 2) if total_available > 0 else 0.0

            # Velocity Classification
            if units_sold == 0 and current_stock > 0:
                velocity_class = "dead_stock"
            elif daily_velocity >= 3.0 or annualized_turnover >= 6.0:
                velocity_class = "fast_mover"
            elif daily_velocity >= 0.8 or annualized_turnover >= 2.5:
                velocity_class = "regular"
            else:
                velocity_class = "slow_mover"

            results.append({
                "product_id": row["product_id"],
                "sku": row["sku"],
                "product_name": row["product_name"],
                "category_name": row["category_name"],
                "cost_price": cost_price,
                "retail_price": retail_price,
                "current_stock": current_stock,
                "safety_stock": int(row["safety_stock"]),
                "lead_time_days": int(row["lead_time_days"]),
                "reorder_point": int(row["reorder_point"]),
                "units_sold": units_sold,
                "total_revenue": round(row["total_revenue"], 2),
                "cogs": round(cogs, 2),
                "turnover_ratio": turnover_ratio,
                "annualized_turnover": annualized_turnover,
                "dsi_days": dsi,
                "daily_velocity": daily_velocity,
                "sell_through_rate_pct": sell_through_rate,
                "velocity_class": velocity_class
            })

        return pd.DataFrame(results)
