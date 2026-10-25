# POS AI Enterprise System — Operational User Guide & Staff Training Manual

> **System Edition:** Enterprise Retail & Supermarket Edition (Philippine Localization)  
> **Currency Standard:** Philippine Peso (`PHP` / `₱`)  
> **Tax Compliance:** Bureau of Internal Revenue (BIR) 12% Value-Added Tax (VAT) & RA 9994 / RA 10754 Compliant  
> **AI Engine:** LightGBM Supermarket Demand Forecaster (v1.4.0) + Association Rule Mining Cross-Sell Engine  

---

## 📑 Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Section A: Cashier POS Operational Guide](#2-section-a-cashier-pos-operational-guide)
   - [2.1 Cashier Login & Terminal Lock](#21-cashier-login--terminal-lock)
   - [2.2 Fast Barcode Scanning & Catalog Search](#22-fast-barcode-scanning--catalog-search)
   - [2.3 Philippine 12% VAT & Senior/PWD Discount Calculations](#23-philippine-12-vat--seniorpwd-discount-calculations)
   - [2.4 Real-Time AI Cross-Sell Recommendations](#24-real-time-ai-cross-sell-recommendations)
   - [2.5 Payment Tender (Cash, GCash/Maya, BancNet Card)](#25-payment-tender-cash-gcashmaya-bancnet-card)
   - [2.6 Receipt Printing & Transaction Retrieval](#26-receipt-printing--transaction-retrieval)
   - [2.7 Cashier Hotkeys Quick Reference](#27-cashier-hotkeys-quick-reference)
3. [Section B: Store Manager Dashboard Guide](#3-section-b-store-manager-dashboard-guide)
   - [3.1 Manager Authentication & Dashboard Overview](#31-manager-authentication--dashboard-overview)
   - [3.2 Interpreting LightGBM Demand Forecasts](#32-interpreting-lightgbm-demand-forecasts)
   - [3.3 Auditing Low-Stock Alerts & ROP Breaches](#33-auditing-low-stock-alerts--rop-breaches)
   - [3.4 Approving Purchase Orders & Stock Arrivals](#34-approving-purchase-orders--stock-arrivals)
   - [3.5 Multi-Store Aggregation & Capital Allocation](#35-multi-store-aggregation--capital-allocation)
4. [Section C: Troubleshooting & Error Recovery](#4-section-c-troubleshooting--error-recovery)
5. [Appendix: BIR Audit Trail & Verification](#5-appendix-bir-audit-trail--verification)

---

## 1. System Overview & Architecture

The POS AI system delivers high-throughput retail checkout with embedded machine learning capabilities designed specifically for Philippine fast-moving consumer goods (FMCG) supermarkets and convenience chains.

```
+-----------------------------------------------------------------------------------------+
|                                  CASHIER TERMINAL                                       |
|  - Fast EAN-13 Barcode Scanning          - Philippine 12% VAT Breakdown                 |
|  - Smart Cross-Sell Widget               - QR Ph / GCash / Maya / Card Tender           |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP / WebSocket
                                             v
+-----------------------------------------------------------------------------------------+
|                             API GATEWAY & NESTJS ENGINE                                 |
|  - JWT Authentication & RBAC               - Double-Entry Inventory Ledger              |
|  - ACID Checkout Processing                - Transaction History & Receipts             |
+---------------------+--------------------------------------+----------------------------+
                      |                                      |
                      v                                      v
+------------------------------------+     +----------------------------------------------+
|     POSTGRESQL (NEON / RDS)        |     |       LIGHTGBM AI INFERENCE ENGINE           |
|  - Products & Barcodes (50+ SKUs)  |     |  - 7d / 14d / 30d Demand Forecaster          |
|  - Inventory Balances & Levels     |     |  - Dynamic Reorder Point (ROP) Calculator    |
|  - Audited Sales & Payment Records |     |  - Basket Co-Occurrence Cross-Sell Engine    |
+------------------------------------+     +----------------------------------------------+
```

---

## 2. Section A: Cashier POS Operational Guide

### 2.1 Cashier Login & Terminal Lock

1. **Station Launch:** Open the POS client in Google Chrome, Microsoft Edge, or the dedicated terminal wrapper at `http://localhost:5173` (or the production Vercel URL).
2. **Shift Login:** Enter your Employee Credentials (e.g., `cashier_01` / `Password123!`).
3. **Terminal Verification:** Confirm that the top banner indicates:
   - **Store Name:** `21/7teen Mart - POS Terminal - Store #01`
   - **Terminal Code:** `POS-BGC-01`
   - **Cashier Badge:** `Juan Dela Cruz (EMP-CSH-003)`
   - **Network Status:** `Online / Synced`
4. **Locking Register:** If stepping away from the counter, click the **Lock** icon (`btn-lock-terminal`) in the top right to prevent unauthorized register access.

---

### 2.2 Fast Barcode Scanning & Catalog Search

The checkout screen is optimized for hands-on-scanner operations:

```
+-----------------------------------------------------------------------------------+
|  [Scan Barcode / Search Product... (F2)]               [Scan Button]              |
|  [All Items (50)] [Rice & Carbs (10)] [Canned Goods (10)] [Beverages (10)] ...    |
+-----------------------------------------------------------------------------------+
```

#### Step-by-Step Scanning Procedure:
1. **Focus Barcode Bar:** Press <kbd>F2</kbd> at any time to immediately jump cursor focus into the scanner input bar.
2. **Handheld Scanner Input:** Point your handheld laser or optical scanner at the product's barcode (e.g., `480001660101` for *Sinandomeng Special Rice 5kg*).
   - The scanner sends the 12/13-digit code followed by an automatic `Enter`.
   - The item is validated in sub-millisecond time and automatically appended to the active ticket with an audible confirmation chime.
3. **Manual Barcode / SKU Entry:** If a barcode sticker is scratched, type the SKU (e.g., `CAN-CRN-005`) or barcode numbers manually and press <kbd>Enter</kbd>.
4. **Touch Catalog Browsing:** Cashiers can touch or click any product card on the left grid. Use category tabs (*Rice & Carbs*, *Canned Goods*, *Beverages*, *Snacks*, *Personal Care*) to filter items rapidly.
5. **Adjusting Quantities:** In the ticket panel on the right, use the `+` and `-` buttons on the line item to increment or decrement units. Stock availability limits are enforced in real time—the system will alert you if requested quantity exceeds shelf balance.

---

### 2.3 Philippine 12% VAT & Senior/PWD Discount Calculations

In accordance with Philippine Bureau of Internal Revenue (BIR) regulations and Republic Acts **RA 9994** (Expanded Senior Citizens Act) and **RA 10754** (Persons with Disability Act), tax calculations are executed as follows:

#### 1. Regular Commercial Transaction (12% VAT)
Listed prices in the catalog are gross retail prices inclusive of 12% VAT where applicable.

$$\text{VATable Sales} = \frac{\text{Gross Subtotal}}{1.12}$$
$$\text{VAT Amount (12\%)} = \text{Gross Subtotal} - \text{VATable Sales}$$
$$\text{Total Amount Due} = \text{Gross Subtotal}$$

*Example: 2 cans of Purefoods Corned Beef at ₱98.50 each = ₱197.00 Gross Total.*
- $\text{VATable Sales} = ₱197.00 / 1.12 = ₱175.89$
- $\text{VAT Amount (12\%)} = ₱197.00 - ₱175.89 = ₱21.11$
- $\text{Total Due} = ₱197.00$

> [!NOTE]
> **Staple Agricultural Food Exemption:** Uncooked agricultural staples such as *Sinandomeng Rice 5kg* and *Dinorado Jasmine Rice* are statutory VAT-exempt (`0.00%`). The system automatically segregates VATable items from VAT-exempt items on the receipt ticket.

#### 2. Senior Citizen / PWD Transaction (20% Discount + VAT Exemption)
When a customer presents a valid Senior Citizen OSCA ID or PWD ID:
1. Click the **Senior / PWD 20%** button in the ticket totals panel (or press the discount toggle).
2. The button badge will switch to **Applied** (gold highlight).
3. The system instantly recalculates the ticket:
   - **Step A:** Removes 12% VAT from qualified items ($\text{Base} = \text{Gross} / 1.12$).
   - **Step B:** Applies a **20% statutory discount** on the net-of-VAT amount.
   - **Step C:** Sets VAT Amount to `₱0.00` and displays **VAT-Exempt Sales**.

$$\text{Net Base} = \frac{\text{Gross Total}}{1.12}$$
$$\text{Senior/PWD Discount (20\%)} = \text{Net Base} \times 0.20$$
$$\text{Net Amount Due} = \text{Net Base} - \text{Senior/PWD Discount}$$

*Example on ₱1,000.00 VATable purchase:*
- $\text{Net Base} = ₱1,000.00 / 1.12 = ₱892.86$
- $\text{Senior Discount (20\%)} = ₱892.86 \times 0.20 = ₱178.57$
- $\text{Net Amount Due} = ₱892.86 - ₱178.57 = ₱714.29$  
*(Customer saves ₱285.71 total).*

---

### 2.4 Real-Time AI Cross-Sell Recommendations

The **SmartCrossSellWidget** is embedded directly below the active cart ticket. It uses an offline/online hybrid association rule mining engine trained on 6 months of Philippine grocery basket transactions.

```
+-----------------------------------------------------------------------------------+
|  ✨ Frequently Bought Together (AI Recommendations)                               |
|  +-----------------------------------------------------------------------------+  |
|  | [Bag] Kopiko Blanca 3-in-1 Coffee 10s              ₱85.00   [+ Add]         |  |
|  |       Reason: Frequently paired with Philippine grocery purchases.           |  |
|  +-----------------------------------------------------------------------------+  |
|  | [Pack] Lucky Me! Pancit Canton Kalamansi           ₱15.50   [+ Add]         |  |
|  |       Reason: Frequently paired with breakfast canned goods.                |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

#### How Cashiers Use AI Cross-Sell:
1. As items are scanned into the ticket (e.g., canned corned beef or loaf bread), the widget dynamically refreshes top-3 co-occurring products.
2. **Cashier Prompting:** Cashiers can politely suggest the recommended item:  
   * *"Ma'am/Sir, would you like to add Kopiko Blanca 10s for only ₱85.00 today?"*
3. **1-Click Ticket Injection:** Clicking **[+ Add]** immediately injects the suggested item into the ticket without having to search or re-scan the barcode.

---

### 2.5 Payment Tender (Cash, GCash/Maya, BancNet Card)

Press <kbd>F4</kbd> or click the large **Charge ₱X.XX** button to launch the **Payment Processing Modal**.

```
+-----------------------------------------------------------------------------------+
|                           PAYMENT PROCESSING (PHP / ₱)                            |
|                                                                                   |
|  TOTAL AMOUNT DUE:   ₱1,250.00                                                    |
|                                                                                   |
|  Select Payment Channel:                                                          |
|  [ (QR) GCash / Maya ]        [ (₱) Cash (PHP) ]        [ (Card) BancNet / Visa ] |
|                                                                                   |
|  Philippine Banknote Presets:                                                     |
|  [ Exact ]    [ ₱50 ]    [ ₱100 ]    [ ₱500 ]    [ ₱1,000 ]                       |
|                                                                                   |
|  Amount Tendered:  ₱1,500.00                                                      |
|  Change Due:       ₱250.00                                                        |
|                                                                                   |
|  [ Cancel (Esc) ]                                   [ Authorize & Complete Sale ] |
+-----------------------------------------------------------------------------------+
```

#### 1. Cash Payments:
- Click a quick banknote preset button: `[Exact]`, `[₱50]`, `[₱100]`, `[₱500]`, or `[₱1,000]`.
- For odd cash amounts, use the on-screen numeric keypad or physical keyboard numbers.
- **Change Due** is automatically calculated in large, bold green text.
- Click **Authorize & Complete Sale** (<kbd>Enter</kbd>).

#### 2. Digital Wallets (GCash / Maya / QR Ph):
- Select **GCash / Maya**.
- Present customer-facing QR Ph code or scan the customer's payment reference barcode.
- Click **Authorize & Complete Sale**.

#### 3. BancNet / Debit / Credit Cards:
- Select **BancNet / Card**.
- Insert or tap card on the physical wireless EMV terminal.
- Once authorization code prints on the terminal, click **Authorize & Complete Sale**.

---

### 2.6 Receipt Printing & Transaction Retrieval

Upon clicking **Authorize & Complete Sale**:
1. The backend API executes an atomic database transaction decrementing inventory and logging to the ledger.
2. An official BIR-style electronic receipt ticket is rendered:

```text
============================================================
              POS AI ENTERPRISE SUPERMARKET                 
             21/7teen Mart - POS Terminal - Store #01                 
      Bonifacio High Street, Taguig City, Metro Manila      
                  VAT Reg TIN: 000-123-456-001              
============================================================
RECEIPT NO: TXN-PH-20261021-1042
DATE/TIME : 2026-10-21 00:15:35
CASHIER   : Juan Dela Cruz (EMP-CSH-003)
TERMINAL  : POS-BGC-01
------------------------------------------------------------
ITEM                     QTY     PRICE        TOTAL
------------------------------------------------------------
Sinandomeng Rice 5kg       1    285.00       285.00 V
Purefoods Corned Beef 210g 2     98.50       197.00 T
Century Tuna Flakes 180g   2     46.75        93.50 T
Kopiko Blanca 3-in-1 10s   1     85.00        85.00 T
------------------------------------------------------------
GROSS SUBTOTAL:                           ₱660.50
SENIOR/PWD DISCOUNT:                       -₱0.00
VATABLE SALES (T):                        ₱335.27
VAT-EXEMPT SALES (V):                     ₱285.00
VAT AMOUNT (12%):                          ₱40.23
------------------------------------------------------------
TOTAL AMOUNT DUE:                         ₱660.50
CASH TENDERED:                          ₱1,000.00
CHANGE DUE:                               ₱339.50
============================================================
           THIS SERVES AS YOUR OFFICIAL RECEIPT             
         Thank you for shopping at POS AI Philippines!      
============================================================
```

3. **Receipt Reprinting:** If a printer jams or a customer requests a duplicate copy, navigate to `/api/v1/pos/transactions/:id` or select the transaction in the recent sales log to reprint.

---

### 2.7 Cashier Hotkeys Quick Reference

| Hotkey | Action | Description |
| :--- | :--- | :--- |
| <kbd>F2</kbd> | **Focus Barcode Scanner** | Immediately jumps cursor to barcode scan input from anywhere on screen. |
| <kbd>F4</kbd> | **Launch Payment Modal** | Opens tender window with banknote presets and digital wallet options. |
| <kbd>Enter</kbd> | **Confirm / Scan** | Processes scanned barcode or authorizes active payment modal. |
| <kbd>Esc</kbd> | **Cancel / Close** | Closes payment modal, search popover, or resets active selection. |

---

## 3. Section B: Store Manager Dashboard Guide

To access the Manager Dashboard, click the **AI Replenishment** button in the top navigation bar or navigate directly to `/dashboard.php` / manager view.

```
+-----------------------------------------------------------------------------------+
|  [<- Back to POS Register]   Manager Recommendation & Inventory UI                |
|  +---------------------+ +----------------------+ +-----------------------------+ |
|  | Low Stock Warnings  | | 30d Forecasted Sales | | Restock Capital Budget      | |
|  | 2 SKUs Below ROP    | | ₱682,540.00          | | ₱85,410.00 (PHP)            | |
|  +---------------------+ +----------------------+ +-----------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 3.1 Manager Authentication & Dashboard Overview

- **Role Requirement:** User must possess `store_manager`, `inventory_manager`, or `admin` role in their JWT token.
- **Header Controls:**
  - **[Refresh AI Pipeline]:** Queries API Gateway and executes LightGBM inference to refresh recommendations.
  - **[Filter Low Stock Items]:** Instant one-click filter isolating SKUs whose on-hand balance is below reorder point.

---

### 3.2 Interpreting LightGBM Demand Forecasts

The recommendation engine leverages a gradient-boosted decision tree model (**LightGBM-DemandForecaster-PH v1.4.0**) trained on multi-location store transactions, day-of-week seasonality (Friday–Sunday surges), and lead times.

#### Key Metric Columns Explained:
1. **Daily Sales Velocity:** The 14-day rolling average units sold per business day (e.g., `4.74 cans/day` for Corned Beef).
2. **7d / 14d / 30d Demand Horizon:** Predicted units demand over the upcoming 7, 14, and 30 calendar days.
3. **Est. Cost (PHP):** 

$$\text{Est. Cost} = \text{Recommended Reorder Quantity} \times \text{Unit Cost Price (PHP)}$$

4. **Confidence Score:** Model certainty ranging between `0.00` and `1.00`. Values $\ge 0.90$ indicate tight confidence intervals with low historical variance.

---

### 3.3 Auditing Low-Stock Alerts & ROP Breaches

The system implements the classical **Statistical Inventory Control Reorder Point (ROP)** formula:

$$\text{ROP} = (\text{Daily Avg Sales} \times \text{Lead Time Days}) + \text{Safety Stock}$$

```
Stock Level
   ^
   |  [ Stock on Shelf ]
   |          \
   |           \
ROP|------------*----------------------- [ AUTOMATIC LOW-STOCK WARNING TRIGGERED ]
   |             \           ^
   |              \          | Lead Time (Supplier delivery window)
   |               \         v
SS |~~~~~~~~~~~~~~~~*~~~~~~~~~~~~~~~~~~~ [ Safety Stock Buffer ]
 0 +-----------------------------------> Time
```

#### Reading Urgency Badges:
- 🔴 **CRITICAL:** On-hand inventory is lower than $(\text{Daily Sales} \times \text{Lead Time})$. Imminent stockout will occur within 24 to 48 hours unless expedited order is dispatched.
- 🟠 **HIGH:** On-hand inventory is below ROP ($\text{Stock} < \text{ROP}$). Supplier purchase order must be placed today.
- 🟡 **MEDIUM:** Stock is approaching ROP threshold ($\text{ROP} < \text{Stock} \le 1.3 \times \text{ROP}$).
- ⚪ **LOW:** Stock is healthy and covers the 30-day forecast horizon.

---

### 3.4 Approving Purchase Orders & Stock Arrivals

```
+-----------------------------------------------------------------------------------+
| SKU / PRODUCT          ON HAND   ROP   7d/14d/30d   REORDER   EST. COST   ACTION  |
| Purefoods Corned Beef     8      30    32/67/142     +155     ₱12,245   [Approve] |
| Sinandomeng Rice 5kg     12      20    26/58/106      +60     ₱13,800   [Approve] |
+-----------------------------------------------------------------------------------+
```

#### 1. Approving AI Recommended Reorders:
1. Review the **AI Recommendation Reasoning** column (e.g., *"Imminent Stockout Risk: Only 8 cans left on shelf. Expected 7-day demand is 32 units..."*).
2. Click **[Approve PO]**.
3. The button updates to a green checkmark **Approved**.
4. The system updates the recommendation status in PostgreSQL (`replenishment_recommendations.status = 'approved'`), assigns `reviewed_by` to your user ID, and transmits the purchase order draft to procurement.

#### 2. Receiving Stock Arrivals:
When supplier delivery trucks arrive at the store:
1. Open the **Stock Adjustment / Arrival** form in the inventory view (or call `POST /api/v1/inventory/adjust`).
2. Select movement type: `purchase_receipt`.
3. Input the quantity delivered (e.g., `+155` units).
4. Enter Supplier Delivery Receipt Number (e.g., `DR-SAN-MIG-88421`).
5. Click **Confirm Delivery**.
6. Stock on hand immediately increments, and the ledger records the movement with `balance_after`.

---

### 3.5 Multi-Store Aggregation & Capital Allocation

The **Restock Capital (PHP / ₱)** card tallies the total capital expenditure required across all approved or recommended purchase orders.

Store managers can view store-specific breakdowns across branches:
- `STR-BGC-01` (21/7teen Mart - POS Terminal - Store #01)
- `STR-MAK-01` (Makati Central Store)
- `STR-CEB-01` (Cebu IT Park Hub)

---

## 4. Section C: Troubleshooting & Error Recovery

| Symptom / Issue | Probable Cause | Corrective Action |
| :--- | :--- | :--- |
| **Barcode scanner emits beep but item is not added to cart** | Barcode input field lost focus or product not registered. | Press <kbd>F2</kbd> to refocus the barcode bar. If item is uncataloged, type SKU manually or contact Manager to add SKU via `POST /api/v1/products`. |
| **"Insufficient stock on shelf" alert during checkout** | System inventory balance is lower than customer requested quantity. | Verify shelf physical count. If stock exists physically, manager must submit a cycle count adjustment (`adjustment_found`). |
| **Customer insists on Senior Discount but VAT was not removed** | Cashier forgot to toggle Senior/PWD button. | Click **Senior / PWD 20%** button before proceeding to payment modal. Check that VAT reflects `₱0.00`. |
| **Offline Banner: "Offline Mode / Local Cache"** | Local store internet dropped or cloud database latency. | Continue checkout normally. The POS automatically utilizes local indexed memory store and queues sales for auto-sync once connectivity restores. |
| **Payment Modal cannot complete: "Insufficient Tender"** | Cash amount entered is less than Total Amount Due. | Enter customer cash tender that is equal to or greater than the total. Change Due will display. |

---

## 5. Appendix: BIR Audit Trail & Verification

In accordance with Philippine tax requirements for POS and CRM machines:
1. **Immutable Sales Log:** Every transaction generates a unique alphanumeric series: `TXN-PH-YYYYMMDD-XXXX`.
2. **Audit Trails:** All modifications to stock levels or price overrides are recorded in the `audit_logs` table with `user_id`, `ip_address`, and `created_at` timestamp.
3. **Double-Entry Stock Ledger:** Inventory movements (`sale`, `purchase_receipt`, `adjustment_loss`, `return_restock`) can be exported at end-of-day for store inventory audit:

```bash
# Query end-of-day sales summary via psql
psql -h localhost -U pos_admin -d pos_ai_db -c "
  SELECT 
    COUNT(*) as total_transactions,
    SUM(subtotal_amount) as gross_sales,
    SUM(discount_amount) as senior_discounts,
    SUM(tax_amount) as vat_collected,
    SUM(total_amount) as net_sales
  FROM sales_transactions 
  WHERE created_at::DATE = CURRENT_DATE;
"
```

---

*End of User Guide. For technical support, contact the IT Store Operations Helpdesk.*
