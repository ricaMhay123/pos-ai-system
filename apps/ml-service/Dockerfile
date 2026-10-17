# ==========================================
# POS AI - Demand Forecasting Service (FastAPI)
# Python 3.11 Production Dockerfile
# ==========================================

FROM python:3.11-slim

WORKDIR /usr/src/app

# Install system dependencies (OpenMP for LightGBM, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY apps/ml-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY apps/ml-service/app ./app
COPY apps/ml-service/run_etl.py ./

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
