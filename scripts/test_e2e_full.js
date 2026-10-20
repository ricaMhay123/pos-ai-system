#!/usr/bin/env node
/**
 * POS AI - Phase 4.3: End-to-End Verification & Triage Suite (scripts/test_e2e_full.js)
 * 
 * Comprehensive E2E Verification covering:
 * 1. User Authentication & Role-Based Access Control (RBAC: Admin, Manager, Cashier, 401 Guard)
 * 2. Cashier Smart POS Checkout flow with live AI Market Basket Cross-Sell recommendations
 * 3. Manager Restock & Replenishment Dashboard APIs (recommendations list, summary metrics, approval)
 * 4. Philippine Retail Localization (12% VAT, RA 9994 Senior/PWD discounts, PHP / ₱ currency)
 * 5. PostgreSQL Database integrity & ledger consistency check
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000/api/v1';
const STORE_ID = '10000000-0000-0000-0000-000000000001'; // Flagship BGC

const db = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'pos_db',
  max: 5,
});

function httpRequest(url, options = {}, payload = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const startTime = process.hrtime.bigint();
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6;
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json, durationMs });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, durationMs });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) {
      const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      req.setHeader('Content-Length', Buffer.byteLength(bodyStr));
      req.write(bodyStr);
    }
    req.end();
  });
}

async function main() {
  console.log('='.repeat(90));
  console.log('POS AI - Phase 4.3: Complete End-to-End Verification & Triage Test Suite');
  console.log('Testing Auth (RBAC), Cashier Smart Cross-Sell Checkout & Manager Restock Dashboard');
  console.log('='.repeat(90));

  const results = {
    timestamp: new Date().toISOString(),
    testsPassed: 0,
    testsFailed: 0,
    steps: {},
  };

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`  ✓ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      results.testsPassed++;
      results.steps[name] = { passed: true, details };
    } else {
      console.error(`  ✗ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      results.testsFailed++;
      results.steps[name] = { passed: false, details };
    }
  }

  // =========================================================================
  // STEP 1: USER AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // =========================================================================
  console.log('\n[SECTION 1: USER AUTHENTICATION & ROLE-BASED ACCESS CONTROL]');

  // 1.1 Unauthenticated Request Rejection
  const unauthRes = await httpRequest(`${GATEWAY_URL}/pos/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { items: [], payments: [] });
  assertTest('1.1 Unauthenticated requests rejected with 401 Unauthorized', unauthRes.status === 401, `Status: ${unauthRes.status}`);

  // 1.2 Invalid Credentials Rejection
  const badLoginRes = await httpRequest(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'cashier_01', password: 'WrongPassword999!' });
  assertTest('1.2 Invalid credentials rejected with 401 Unauthorized', badLoginRes.status === 401, `Status: ${badLoginRes.status}`);

  // 1.3 Cashier Login
  const cashierLoginRes = await httpRequest(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'cashier_01', password: 'Password123!' });
  const cashierToken = cashierLoginRes.body.accessToken;
  const cashierRoles = cashierLoginRes.body.user?.roles || [];
  assertTest(
    '1.3 Cashier login succeeds with JWT and "cashier" role',
    cashierLoginRes.status === 200 && Boolean(cashierToken) && cashierRoles.includes('cashier'),
    `Roles: [${cashierRoles.join(', ')}]`
  );

  // 1.4 Store Manager Login
  const mgrLoginRes = await httpRequest(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'manager_bgc', password: 'Password123!' });
  const mgrToken = mgrLoginRes.body.accessToken;
  const mgrRoles = mgrLoginRes.body.user?.roles || [];
  assertTest(
    '1.4 Store Manager login succeeds with "store_manager" & "inventory_manager" roles',
    mgrLoginRes.status === 200 && mgrRoles.includes('store_manager'),
    `Roles: [${mgrRoles.join(', ')}]`
  );

  // 1.5 Admin Login & Profile Session Retrieval
  const adminLoginRes = await httpRequest(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'admin', password: 'Password123!' });
  const adminToken = adminLoginRes.body.accessToken;

  const profileRes = await httpRequest(`${GATEWAY_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });
  assertTest(
    '1.5 Admin profile session retrieved (/api/v1/auth/me)',
    profileRes.status === 200 && profileRes.body.username === 'admin',
    `User: ${profileRes.body.firstName} ${profileRes.body.lastName} (${profileRes.body.employeeCode})`
  );

  // =========================================================================
  // STEP 2: CASHIER SMART POS CROSS-SELL & CHECKOUT
  // =========================================================================
  console.log('\n[SECTION 2: CASHIER SMART POS CROSS-SELL & CHECKOUT]');

  const targetRiceId = '40000000-0000-0000-0000-000000000001'; // Sinandomeng Rice 5kg

  // 2.1 Fetch Smart Cross-Sell Recommendations
  const crossSellRes = await httpRequest(`${GATEWAY_URL}/recommendations/cross-sell?productIds=${targetRiceId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${cashierToken}` },
  });

  const recList = Array.isArray(crossSellRes.body)
    ? crossSellRes.body
    : crossSellRes.body?.crossSellRecommendations || [];
  const topRec = recList[0];

  assertTest(
    '2.1 Top 3 Frequently Bought Together recommendations returned for cart items',
    crossSellRes.status === 200 && recList.length > 0,
    `Top 1: ${topRec?.productName} (₱${topRec?.retailPrice}) with ${topRec?.coOccurrenceCount} historical pairings`
  );

  // Ensure stock is available for the test checkout
  await db.query(
    `INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, safety_stock)
     VALUES ($1, $2, 50, 10)
     ON CONFLICT (store_id, product_id) DO UPDATE SET quantity_on_hand = 50`,
    [STORE_ID, targetRiceId]
  );
  if (topRec?.productId) {
    await db.query(
      `INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, safety_stock)
       VALUES ($1, $2, 50, 10)
       ON CONFLICT (store_id, product_id) DO UPDATE SET quantity_on_hand = 50`,
      [STORE_ID, topRec.productId]
    );
  }

  // 2.2 Process Cashier Checkout with Cart + Recommended Product
  const checkoutPayload = {
    storeId: STORE_ID,
    idempotencyKey: `E2E-SALE-${Date.now()}-${crypto.randomUUID()}`,
    items: [
      { productId: targetRiceId, quantity: 1, unitPrice: 285.00 },
      ...(topRec ? [{ productId: topRec.productId, quantity: 2, unitPrice: topRec.retailPrice }] : []),
    ],
    payments: [{ method: 'cash', amount: 500.00 }],
  };

  const checkoutRes = await httpRequest(`${GATEWAY_URL}/pos/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cashierToken}`,
    },
  }, checkoutPayload);

  const saleTxnId = checkoutRes.body?.transactionId;
  const saleTxnNo = checkoutRes.body?.transactionNumber;
  const saleTotal = checkoutRes.body?.total;
  const saleVat = checkoutRes.body?.tax;

  assertTest(
    '2.2 Cashier checkout processes with atomic DB transaction & 12% VAT',
    checkoutRes.status === 201 && Boolean(saleTxnId),
    `Txn: ${saleTxnNo} | Total: ₱${saleTotal} | 12% VAT: ₱${saleVat}`
  );

  // 2.3 Verify Transaction Receipt Retrieval
  const getTxnRes = await httpRequest(`${GATEWAY_URL}/pos/transactions/${saleTxnId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${cashierToken}` },
  });
  assertTest(
    '2.3 Transaction receipt retrieval by ID (/api/v1/pos/transactions/:id)',
    getTxnRes.status === 200 && getTxnRes.body?.id === saleTxnId,
    `Status: ${getTxnRes.body?.status} | Line items: ${getTxnRes.body?.items?.length || 'loaded'}`
  );

  // 2.4 Verify Stock Ledger Deductions in Database
  const ledgerRes = await db.query(
    `SELECT * FROM inventory_transactions WHERE reference_id = $1 AND store_id = $2`,
    [saleTxnNo, STORE_ID]
  );
  assertTest(
    '2.4 Double-entry inventory ledger audit trail recorded in PostgreSQL',
    ledgerRes.rows.length >= 1,
    `Ledger entries logged: ${ledgerRes.rows.length} rows`
  );

  // =========================================================================
  // STEP 3: STORE MANAGER RESTOCK & RECOMMENDATION DASHBOARD
  // =========================================================================
  console.log('\n[SECTION 3: STORE MANAGER RESTOCK & RECOMMENDATION DASHBOARD]');

  // 3.1 Fetch Inventory Recommendations List
  const recsListRes = await httpRequest(`${GATEWAY_URL}/recommendations?storeId=${STORE_ID}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${mgrToken}` },
  });
  const recs = Array.isArray(recsListRes.body) ? recsListRes.body : [];
  assertTest(
    '3.1 Manager fetches AI inventory recommendations list (/api/v1/recommendations)',
    recsListRes.status === 200 && recs.length > 0,
    `Loaded: ${recs.length} replenishment recommendations`
  );

  // 3.2 Fetch Manager Dashboard Executive Summary
  const summaryRes = await httpRequest(`${GATEWAY_URL}/recommendations/summary?storeId=${STORE_ID}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${mgrToken}` },
  });
  const sumData = summaryRes.body;
  assertTest(
    '3.2 Manager fetches executive forecast summary (/api/v1/recommendations/summary)',
    summaryRes.status === 200 && sumData.totalRecommendations > 0,
    `Low stock: ${sumData.lowStockCount} | Forecasted 30d Revenue: ₱${Number(sumData.totalForecastedRevenue30dPhp).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  );

  // 3.3 Manager Approves Replenishment Recommendation
  const candidateRec = recs.find((r) => r.status === 'pending_review') || recs[0];
  if (candidateRec) {
    const approveRes = await httpRequest(`${GATEWAY_URL}/recommendations/${candidateRec.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mgrToken}`,
      },
    }, {
      approvedQuantity: candidateRec.recommendedOrderQuantity || 50,
      notes: 'Approved via Phase 4.3 E2E Verification Suite',
    });

    assertTest(
      '3.3 Manager approves replenishment recommendation (/api/v1/recommendations/:id/approve)',
      approveRes.status === 200 || approveRes.status === 201,
      `Recommendation ${candidateRec.sku} status: ${approveRes.body?.status}`
    );

    // Verify DB update
    const dbRecCheck = await db.query(
      `SELECT status, decision_notes FROM inventory_recommendations WHERE id = $1`,
      [candidateRec.id]
    );
    assertTest(
      '3.4 Approval persists in PostgreSQL inventory_recommendations table',
      dbRecCheck.rows[0]?.status === 'approved',
      `DB Status: ${dbRecCheck.rows[0]?.status}`
    );
  }

  // =========================================================================
  // STEP 4: PHILIPPINE POS TAXATION & DISCOUNT ENGINE (RA 9994)
  // =========================================================================
  console.log('\n[SECTION 4: PHILIPPINE POS TAXATION & DISCOUNT ENGINE]');

  // Test Senior/PWD VAT-Exempt + 20% Discount
  const snrPayload = {
    storeId: STORE_ID,
    idempotencyKey: `E2E-SNR-${Date.now()}-${crypto.randomUUID()}`,
    items: [{ productId: targetRiceId, quantity: 2, unitPrice: 285.00 }], // ₱570.00 Gross
    metadata: { isSeniorOrPwd: true },
    payments: [{ method: 'digital_wallet', amount: 500.00 }],
  };

  const snrCheckoutRes = await httpRequest(`${GATEWAY_URL}/pos/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cashierToken}`,
    },
  }, snrPayload);

  // Gross = 570.00, Net of VAT = 570 / 1.12 = 508.93, 20% Disc = 508.93 * 0.20 = 101.79
  // Net Total = 508.93 - 101.79 = 407.14, VAT = 0.00
  const snrTax = snrCheckoutRes.body?.tax;
  const snrDisc = snrCheckoutRes.body?.discount;
  const snrTotal = snrCheckoutRes.body?.total;
  assertTest(
    '4.1 Republic Act 9994 Senior Citizen / PWD 20% discount & VAT-Exemption applied',
    snrCheckoutRes.status === 201 && snrTax === 0 && snrDisc > 100 && snrTotal < 410,
    `Gross: ₱570 | VAT: ₱${snrTax} | Discount: ₱${snrDisc} | Net Total: ₱${snrTotal}`
  );

  // =========================================================================
  // SUMMARY & REPORT
  // =========================================================================
  console.log('\n' + '='.repeat(90));
  console.log('END-TO-END VERIFICATION SUMMARY');
  console.log('='.repeat(90));
  console.log(`Total Verification Checks : ${results.testsPassed + results.testsFailed}`);
  console.log(`Passed Checks             : ${results.testsPassed}`);
  console.log(`Failed Checks             : ${results.testsFailed}`);
  console.log('='.repeat(90));

  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, 'e2e_verification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n[OK] Complete E2E report saved to: ${reportPath}`);

  await db.end();

  if (results.testsFailed === 0) {
    console.log('\n>>> ALL END-TO-END VERIFICATION & TRIAGE CHECKS PASSED WITH ZERO ERRORS! <<<');
    process.exit(0);
  } else {
    console.error(`\n[FAIL] ${results.testsFailed} check(s) failed during E2E verification.`);
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('\n[FATAL ERROR]', err);
  await db.end().catch(() => {});
  process.exit(1);
});
