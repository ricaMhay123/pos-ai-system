# Project Context & AI Execution Rules

## System Overview
This project is an enterprise Point of Sale (POS) system integrated with an AI-driven Inventory Recommendation Engine tailored for the **Philippine retail market**.

---

## Technical Stack & Architecture
* **Frontend:** React / TypeScript / Tailwind CSS (POS Interface + Recommendation Dashboard)
* **Backend API:** Node.js / NestJS (or FastAPI) handling core checkout, RBAC, and inventory CRUD operations
* **ML Data Service:** Python (scikit-learn, XGBoost, or Prophet) running ETL pipelines for sales demand forecasting and stock replenishment alerts
* **Database:** PostgreSQL (with time-series logging for sales transactions)
* **Infrastructure:** Native Windows Environment, Local PostgreSQL (localhost:5432, user: postgres, db: pos_db), Node.js, Python 3.14 (NO Docker / Docker Compose)

> For detailed technical stack specifications, monorepo directory mapping, and Vercel deployment presets, see [TECH_STACK.md](file:///c:/PROJECTS/POS%20AI/TECH_STACK.md).

---

## 18-Week Roadmap & Phase Tracker

| Phase | Milestone | Focus Areas | Timeline | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **Requirements & System Design** | DB schema design, API mapping, UI wireframing, data audit, and seed generation | Weeks 1–3 | **Completed** |
| **Phase 2** | **Core Transactional MVP** | POS checkout interface, user auth (JWT/RBAC), inventory CRUD APIs | Weeks 4–8 | **Completed** |
| **Phase 3** | **Data Pipeline & AI Integration** | ETL pipelines, sales forecasting models, Recommendation Dashboard UI | Weeks 9–14 | **Completed** |
| **Phase 4** | **Testing & QA** | Load testing POS, ML model validation (MAPE/Precision), bug triage | Weeks 15–17 | **Completed** |
| **Phase 5** | **Deployment & Training** | Cloud setup, CI/CD, user onboarding and documentation | Week 18 | **Completed** |
| **Phase A** | **Auth Landing Page & Dual-Role Access** | RBAC login view, quick-fill test credentials, role-based routing (Cashier strictly to POS checkout, Manager to dashboard) | Post-Launch | **Completed** |

---

## Non-Negotiable Localization Guidelines

All code, UI layouts, database seeds, and business logic **MUST** follow Philippine standards:

1. **Currency & Formatting:**
   * Symbol: `₱` (PHP)
   * Localized String Format: `en-PH` via `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`
   * Never default to USD ($).

2. **Taxation & Discounts (Philippine POS Standard):**
   * **Standard VAT:** 12% Value-Added Tax.
   * **VAT Calculation:** 
     $$\text{VATable Sales} = \frac{\text{Gross Total}}{1.12}$$
     $$\text{VAT Amount} = \text{Gross Total} - \text{VATable Sales}$$
   * **Senior Citizen / PWD Discounts:** 20% discount on VAT-exempt sales amount for qualified items.

3. **Realistic Product Pricing Reference (FMCG / Supermarket):**
   * *Rice & Carbs:* ₱50.00 – ₱400.00 (e.g., Premium Rice 5kg ~ ₱380.00)
   * *Canned Goods:* ₱20.00 – ₱80.00 (e.g., Century Tuna ~ ₱42.00)
   * *Beverages & Coffee:* ₱9.00 – ₱120.00 (e.g., 3-in-1 Coffee Sachet ~ ₱9.50)
   * *Snacks & Household:* ₱15.00 – ₱200.00 (e.g., Detergent 1kg ~ ₱145.00)
   * *Average Receipt Value:* ₱250.00 – ₱1,500.00

---

## AI Agent Operating Instructions
When picking up tasks on this project:
1. Always check the **Current Active Phase** before writing code. Do not implement Phase 3 or Phase 4 features while working on Phase 2 unless requested.
2. Ensure any new UI components automatically format currency values using the `formatPHP` utility.
3. Update this file (`PROJECT_CONTEXT.md`) **only** when completing a phase, altering the core tech stack, or adding explicit business rules.
4. **NO Docker / Docker Compose**: Do NOT use or propose Docker/docker-compose commands. All services run natively on Windows with local PostgreSQL (`host: localhost, port: 5432, user: postgres, pass: postgres, db: pos_db`), Node.js/NestJS, React/Vite, and Python ML pipelines.