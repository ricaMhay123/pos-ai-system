# POS AI System — Technology Stack & Deployment Architecture

This document outlines the system architecture, monorepo layout, frameworks, database configurations, deployment settings, and Philippine localization rules for the **POS AI System** repository ([`ricaMhay123/pos-ai-system`](https://github.com/ricaMhay123/pos-ai-system)).

---

## 1. Workspace Architecture & Monorepo Layout

The project is structured as an enterprise **npm workspace monorepo** (`npm workspaces`) dividing user-facing applications and shared libraries:

```text
pos-ai-system/
├── apps/
│   ├── web-pos/            # Modern Frontend Web POS (React + Vite + Tailwind CSS)
│   ├── api-gateway/        # Core Backend REST API (Node.js + NestJS + TypeScript)
│   └── ml-service/         # Demand Forecasting & ETL Engine (Python + FastAPI + LightGBM)
├── packages/
│   ├── shared-types/       # Canonical TypeScript interfaces, DTOs, and API contracts
│   └── database/           # PostgreSQL migrations and 6-month historical sales seeds
├── scripts/
│   ├── setup-db.js         # Automated native PostgreSQL DB creator and migration runner
│   └── test-phase2-endpoints.js # End-to-end API verification suite
├── PROJECT_CONTEXT.md      # AI agent roadmap, active phase tracker, and operating rules
├── TECH_STACK.md           # Tech stack, frameworks, and deployment specifications
├── package.json            # Monorepo root package manifest and workspace scripts
├── .env.example            # Canonical environment variable template
└── .env                    # Active local environment settings
```

### Workspace Directory Mapping

| Directory | Package Name | Role | Technology |
| :--- | :--- | :--- | :--- |
| `apps/web-pos` | `@pos-ai/web-pos` | Cashier Checkout Interface & Backoffice UI | React 18, Vite 5, Tailwind CSS 3 |
| `apps/api-gateway` | `@pos-ai/api-gateway` | High-throughput POS Transaction Gateway | NestJS 10, TypeScript 5, Express |
| `apps/ml-service` | `apps/ml-service` | Sales ETL Pipeline & Demand Forecasting Engine | Python 3.14+, FastAPI, LightGBM |
| `packages/shared-types` | `@pos-ai/shared-types` | Shared Type Definitions & Contracts | TypeScript 5 |
| `packages/database` | `@pos-ai/database` | Database Migrations & Historical Sales Seeds | PostgreSQL 16 SQL Scripts |

---

## 2. Frameworks & Tech Stack by Application

### A. Frontend Web POS (`apps/web-pos`)
* **Core Framework**: React `18.3.1` with React DOM
* **Build Tool & Dev Server**: Vite `5.2.11` (`@vitejs/plugin-react`)
* **Language**: TypeScript `5.4.5`
* **Styling**: Tailwind CSS `3.4.3` with Autoprefixer and PostCSS
* **Icons**: Lucide React (`lucide-react`)
* **Dev Server Port**: `http://localhost:5173`
* **API Communication**: HTTP client targeting API Gateway at `http://localhost:4000/api/v1`

### B. Backend API Gateway (`apps/api-gateway`)
* **Core Framework**: NestJS `10.3.8` (`@nestjs/core`, `@nestjs/common`)
* **HTTP Platform**: Express (`@nestjs/platform-express`)
* **Language & Runtime**: Node.js `20.x`+ / TypeScript `5.4.5`
* **Authentication & RBAC**: Passport JWT (`@nestjs/jwt`, `passport`, `passport-jwt`, `bcrypt`)
* **Validation**: `class-validator` and `class-transformer`
* **API Documentation**: Swagger / OpenAPI (`@nestjs/swagger`) at `/api/docs`
* **Database Driver**: `pg` `8.11.5` (native PostgreSQL connection pool with ACID transactions)
* **Testing Framework**: Node.js native test runner (`node --test`) for unit and integration testing
* **Runtime Port**: `http://localhost:4000/api/v1`

### C. AI/ML Forecasting Service (`apps/ml-service`)
* **API Framework**: FastAPI `>=0.110.0`
* **ASGI Server**: Uvicorn `>=0.29.0`
* **Runtime**: Python `3.14`+ (compatible with `3.11`+)
* **Data Modeling & Validation**: Pydantic `v2` (`pydantic>=2.7.0`, `pydantic-settings>=2.2.1`)
* **Data Processing & Analytics**: Pandas `>=2.2.0`, NumPy `>=1.26.4`
* **Machine Learning Regressors**:
  * LightGBM (`lightgbm>=4.3.0`)
  * Scikit-Learn (`scikit-learn>=1.4.2`)
* **Database Driver**: `pg8000` `>=1.30.0` (native Python PostgreSQL driver) & `asyncpg`
* **Runtime Port**: `http://localhost:8000` (Swagger UI at `/docs`)

---

## 3. Database & ORM Configurations

* **Database Engine**: PostgreSQL 16 (Local native installation)
* **Host**: `localhost`
* **Port**: `5432`
* **User**: `postgres`
* **Password**: `postgres`
* **Database Name**: `pos_db`
* **Connection String Format**:
  ```text
  postgresql://postgres:postgres@localhost:5432/pos_db
  ```

### Data Access Architecture
1. **API Gateway (`pg` pool)**:
   * Direct parameterized queries preventing SQL injection.
   * Atomic ACID database transactions (`BEGIN ... COMMIT ... ROLLBACK`).
   * Row-level locking (`FOR UPDATE`) on `inventory_levels` during POS checkout to prevent race conditions and negative inventory.
   * Double-entry immutable audit ledger in `inventory_transactions`.
2. **ML Service (`pg8000`)**:
   * Direct extraction of historical sales time series into Pandas DataFrames.
   * Auto-calculates Inventory Turnover, Days Sales of Inventory (DSI), and velocity classifications.
   * Persists recommendations into `replenishment_recommendations` and `forecast_runs`.

---

## 4. Deployment Settings

### GitHub Repository Details
* **Repository**: [`ricaMhay123/pos-ai-system`](https://github.com/ricaMhay123/pos-ai-system)
* **Default Branch**: `main`

### Vercel Deployment Configuration

When deploying the frontend web POS to **Vercel**:

| Setting | Value |
| :--- | :--- |
| **Project Name** | `pos-ai-web` |
| **Framework Preset** | **Vite** |
| **Root Directory** | `apps/web-pos` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | `20.x` |

#### Environment Variables for Vercel:
```ini
VITE_API_BASE_URL=https://your-api-gateway-domain.com/api/v1
```

### Backend & ML Service Deployment (Native / Cloud)
* **Native Windows Execution (Current Operating Rule)**:
  * PostgreSQL runs locally as a Windows service on `localhost:5432`.
  * Services run concurrently via terminal:
    * API Gateway: `npm run dev:api`
    * Web POS: `npm run dev:web`
    * ML Service: `npm run dev:ml`
    * ML ETL Pipeline: `npm run ml:etl`
* **Cloud Hosting Options (for Phase 5)**:
  * API Gateway: Render, Railway, AWS ECS, or Fly.io
  * ML Service: Render Web Service, Railway, or AWS EC2
  * Database: Managed PostgreSQL (Supabase, Neon, AWS RDS, or Railway PostgreSQL)

---

## 5. Philippine Retail Localization Defaults

All business logic, database seeds, calculations, and UI displays strictly adhere to Philippine retail standards:

### Currency & Number Formatting
* **Currency Symbol**: `₱` (Philippine Peso / PHP)
* **Locale Format**: `en-PH`
* **JavaScript Implementation**:
  ```typescript
  export const formatPHP = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  ```

### Taxation & Discounts (BIR Standards)
1. **Standard 12% Value-Added Tax (VAT)**:
   $$\text{VATable Sales} = \frac{\text{Gross Total}}{1.12}$$
   $$\text{VAT Amount} = \text{Gross Total} - \text{VATable Sales}$$
2. **Senior Citizen & PWD Discount (RA 9994 / RA 10754)**:
   * 20% discount on VAT-exempt sales base for qualified items.
   * VAT is calculated as `₱0.00` (VAT-exempt).
   $$\text{Net Base} = \frac{\text{Gross Total}}{1.12}$$
   $$\text{Senior Discount (20\%)} = \text{Net Base} \times 0.20$$
   $$\text{Total Payable} = \text{Net Base} - \text{Senior Discount}$$

### Product Pricing References (FMCG / Supermarket)
* **Rice & Carbs**: ₱50.00 – ₱400.00 (e.g., Sinandomeng 5kg ~ ₱285.00)
* **Canned Goods**: ₱20.00 – ₱120.00 (e.g., Century Tuna ~ ₱46.75, Purefoods Corned Beef ~ ₱98.50)
* **Beverages & Coffee**: ₱9.00 – ₱120.00 (e.g., Kopiko Blanca 10s ~ ₱85.00, San Miguel Pale Pilsen ~ ₱58.00)
* **Snacks**: ₱15.00 – ₱50.00 (e.g., Piattos ~ ₱38.50, Oishi Prawn Crackers ~ ₱22.00)
* **Personal Care**: ₱35.00 – ₱180.00 (e.g., Safeguard Soap ~ ₱48.00, Colgate 150g ~ ₱134.00)

### Shopping Seasonality
* **Quincena Paydays**: Bi-monthly sales spikes on the 15th and 30th/31st.
* **Weekend Surges**: Increased volume on Saturday and Sunday supermarket runs.
