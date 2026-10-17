import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from typing import Optional

# Search for .env in current directory or project root
root_env = Path(__file__).resolve().parent.parent.parent.parent / ".env"
local_env = Path(__file__).resolve().parent.parent / ".env"

if local_env.exists():
    load_dotenv(local_env)
elif root_env.exists():
    load_dotenv(root_env)

class Settings(BaseSettings):
    PROJECT_NAME: str = "POS AI Demand Forecasting Engine"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    
    # PostgreSQL Database Connection Settings
    DATABASE_HOST: str = os.getenv("DATABASE_HOST", "localhost")
    DATABASE_PORT: int = int(os.getenv("DATABASE_PORT", "5432"))
    DATABASE_USER: str = os.getenv("DATABASE_USER", "postgres")
    DATABASE_PASSWORD: str = os.getenv("DATABASE_PASSWORD", "postgres")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "pos_db")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"
    )
    
    # Model & Forecasting Configurations
    MODEL_NAME: str = "LightGBM-DemandForecaster-PH"
    MODEL_VERSION: str = "v1.4.0"
    DEFAULT_HORIZON_DAYS: int = 14
    SAFETY_STOCK_FACTOR_Z: float = 1.65  # 95% service level
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
