# POS AI - Enterprise Intelligent Point-of-Sale & AI Replenishment Engine

Enterprise-grade Point of Sale (POS) and Inventory Management System with an AI-driven Inventory Recommendation and Demand Forecasting Engine.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 Client Tier                                       |
|  +---------------------------------------+  +----------------------------------+  |
|  |     POS Cashier Terminal (React)      |  |   Store Manager Dashboard (React)|  |
|  +---------------------------------------+  +----------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
                                           v
+-----------------------------------------------------------------------------------+
|                           Backend API Gateway (NestJS)                            |
|  - Role-based Auth & Audit Logging (RBAC/JWT)                                     |
|  - High-concurrency Transaction Processing & Checkout Engine                     |
|  - Real-time Inventory Ledger & Multi-location Stock Movement                     |
|  - REST & Event-driven Messaging (Redis Pub/Sub & Queues)                         |
+--------------------+---------------------------------------+----------------------+
                     |                                       |
      PostgreSQL     |                                       | Internal RPC / HTTP
   (ACID Data Store) v                                       v
+--------------------------------+          +---------------------------------------+
|  PostgreSQL Database (RDS)     |          |  AI Forecasting Service (FastAPI/Py)  |
|  - Core Catalog & Master Data  |          |  - ETL / Feature Engineering          |
|  - Idempotent Transaction Logs |--------->|  - Time-series Demand Forecasting     |
|  - Inventory Ledger & Audits   | (Sync/CDC|  - Safety Stock & Reorder Engine      |
|  - AI Recommendation Outputs   |  Export) |  - Model Registry & Drift Detection   |
+--------------------------------+          +---------------------------------------+
```

---

## 📁 Monorepo Layout

```text
.
├── apps/
│   ├── api-gateway/        # Core Backend API (NestJS + TypeScript)
│   │   ├── src/
│   │   │   ├── modules/    # Auth, Catalog, Checkout, Inventory, AI recommendations
│   │   │   └── main.ts
│   │   └── package.json
│   ├── web-pos/            # Modern Frontend Web POS & Backoffice (React + Vite + Tailwind CSS)
│   │   ├── src/
│   │   └── package.json
│   └── ml-service/         # AI/ML Forecasting Engine (Python + FastAPI + Stats/ML)
│       ├── app/
│       │   ├── api/        # Prediction & replenishment endpoints
│       │   ├── models/     # Forecasting algorithms (LightGBM/Prophet/ARIMA)
│       │   └── services/   # Data pipeline & feature stores
│       └── requirements.txt
├── packages/
│   ├── database/           # Relational migrations, DDL schema, and seed datasets
│   │   ├── migrations/     # Versioned PostgreSQL migration scripts
│   │   └── seeds/          # Sample seed data
│   └── shared-types/       # Canonical TypeScript types & DTO contracts
│       ├── src/
│       └── package.json
├── docs/
│   └── api/                # OpenAPI / Swagger 3.0 API contracts
│       └── openapi.yaml
├── docker-compose.yml      # Local development container orchestration
├── package.json            # Root workspace configuration
└── README.md
```

---

## 🗄️ Database Architecture (PostgreSQL)

The database schema is partitioned into standard core domains:
1. **Access Control**: `users`, `roles`, `user_roles`, `audit_logs`
2. **Product Catalog**: `categories`, `products`, `product_variants`, `barcodes`
3. **Inventory Management**: `stores`, `inventory_levels`, `inventory_transactions` (ledger-based double entry)
4. **Sales & Checkout**: `sales_transactions`, `sales_line_items`, `payment_records`
5. **AI Replenishment Engine**: `forecast_runs`, `replenishment_recommendations`, `model_performance_metrics`

Migration files reside under [001_initial_pos_and_inventory_schema.sql](file:///c:/PROJECTS/POS%20AI/packages/database/migrations/001_initial_pos_and_inventory_schema.sql).

---

## 🇵🇭 Philippine Localization & Tax Compliance

The system is localized for the Philippine retail and supermarket industry:
- **Currency**: Philippine Peso (`PHP` / `₱`) with `en-PH` locale formatting.
- **Value-Added Tax (VAT)**: 12% standard Philippine VAT rate configured across catalog items, with staple goods (e.g. raw rice) set to VAT-exempt (0%).
- **Statutory Discounts**: Full support for Republic Act 9994 (Expanded Senior Citizens Act) & Republic Act 10754 (Persons with Disability), applying 20% discounts and VAT exemption.
- **Payment Channels**: Support for **GCash** & **Maya** via QR Ph dynamic rails, **BancNet** EMV chip/contactless cards, and cash with standard Philippine banknote denominations (₱50, ₱100, ₱500, ₱1,000).
- **Realistic FMCG Dataset**: 50 products spanning Rice & Carbs, Canned Goods, Beverages, Snacks, and Personal Care, backed by 6 months of historical transactions (₱250 to ₱1,500 average basket sizes).

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: `v20.x+` (LTS) & `npm` / `pnpm`
- **Python**: `3.11+`
- **Docker & Docker Compose**: For local PostgreSQL, Redis, and service containerization

### 1. Environment Setup
Copy the sample environment variables:
```bash
cp .env.example .env
```

### 2. Launch Supporting Infrastructure (Docker)
Start PostgreSQL and Redis:
```bash
docker compose up -d postgres redis
```

The database will be exposed on `localhost:5432` and pre-populated with schema migrations.

### 3. Install Monorepo Dependencies
From the repository root:
```bash
npm install
```

### 4. Run Services

#### Backend API Gateway (NestJS):
```bash
npm run dev --workspace=@pos-ai/api-gateway
# Service runs on http://localhost:4000 (Swagger docs at /api/docs)
```

#### Frontend POS Terminal (React + Tailwind):
```bash
npm run dev --workspace=@pos-ai/web-pos
# Web application runs on http://localhost:5173
```

#### AI/ML Forecasting Service (Python FastAPI):
```bash
cd apps/ml-service
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# ML Service runs on http://localhost:8000 (Docs at /docs)
```

---

## 📅 Delivery Roadmap

- **Phase 1: Requirements & System Design (Weeks 1-3)** ⬅️ *Current Phase*
  - Monorepo setup, schema design, API contract definition, domain models
- **Phase 2: Core Transactional MVP (Weeks 4-8)**
  - Cashier checkout flow, barcode scanning, inventory deduction ledger, RBAC
- **Phase 3: Data Pipeline & AI Integration (Weeks 9-14)**
  - Automated sales aggregation ETL, Prophet/LightGBM demand forecasting, reorder alerts
- **Phase 4: Testing & QA (Weeks 15-17)**
  - End-to-end load tests, offline transaction synchronization, automated tests
- **Phase 5: Deployment & Training (Week 18)**
  - Kubernetes / Cloud deployment, cashier & manager onboarding
