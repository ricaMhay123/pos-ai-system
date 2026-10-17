import logging
from typing import List, Dict, Any, Optional
import pg8000.native
from app.config import settings

logger = logging.getLogger("Database")

class Database:
    @staticmethod
    def get_connection():
        """
        Creates a direct native pg8000 PostgreSQL connection
        """
        return pg8000.native.Connection(
            user=settings.DATABASE_USER,
            password=settings.DATABASE_PASSWORD,
            host=settings.DATABASE_HOST,
            port=settings.DATABASE_PORT,
            database=settings.DATABASE_NAME
        )

    @classmethod
    def query(cls, sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Executes query and returns list of dictionaries mapping column name to value
        """
        conn = cls.get_connection()
        try:
            if params:
                result = conn.run(sql, **params)
            else:
                result = conn.run(sql)
            
            if not conn.columns:
                return []
            
            col_names = [col["name"] for col in conn.columns]
            rows = []
            for row in result:
                rows.append(dict(zip(col_names, row)))
            return rows
        finally:
            conn.close()

    @classmethod
    def execute(cls, sql: str, params: Optional[Dict[str, Any]] = None) -> None:
        """
        Executes DML statement (INSERT/UPDATE/DELETE)
        """
        conn = cls.get_connection()
        try:
            if params:
                conn.run(sql, **params)
            else:
                conn.run(sql)
        finally:
            conn.close()
