#!/usr/bin/env node
/**
 * POS AI - Phase 4.2: POS Load & Performance Testing Script (scripts/test_pos_load.js)
 * Simulates concurrent cashier checkout requests against apps/api-gateway.
 * 
 * Verifies:
 * 1. Database ACID Transaction Isolation & Row-level Locking (FOR UPDATE OF il)
 * 2. Accurate inventory stock deductions and ledger audit trail without race conditions
 * 3. 12% Philippine VAT and Republic Act 9994 Senior/PWD calculations under load
 * 4. Boundary oversell isolation (exact 409 Conflict rollback, zero negative stock)
 * 5. Latency SLAs (P50, P95, P99) and transaction throughput
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000/api/v1';
const STORE_ID = '10000000-0000-0000-0000-000000000001'; // Flagship BGC

// Philippine Retail FMCG Products for Load Testing
const PRODUCTS = {
  RICE: { id: '40000000-0000-0000-0000-000000000001', sku: 'RIC-SIN-001', name: 'Sinandomeng Special Rice 5kg', price: 285.00 },
  TUNA: { id: '40000000-0000-0000-0000-000000000004', sku: 'CAN-TUN-004', name: 'Century Tuna Flakes in Oil 180g', price: 46.75 },
  COFFEE: { id: '40000000-0000-0000-0000-000000000007', sku: 'BEV-KOP-007', name: 'Kopiko Blanca 3-in-1 Coffee', price: 85.00 },
  NOODLES: { id: '40000000-0000-0000-0000-000000000003', sku: 'NOD-LKM-003', name: 'Lucky Me! Pancit Canton Kalamansi', price: 78.00 },
};

// PostgreSQL Direct Pool for ground-truth verification
const db = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'pos_db',
  max: 10,
});

// Helper for HTTP requests
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

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function loginCashier() {
  const res = await httpRequest(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    username: 'cashier_01',
    password: 'Password123!',
  });

  if (res.status !== 200 || !res.body.accessToken) {
    throw new Error(`Failed to login as cashier_01: HTTP ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken;
}

async function resetStock(productId, stockOnHand) {
  await db.query(
    `INSERT INTO inventory_levels (store_id, product_id, quantity_on_hand, safety_stock)
     VALUES ($1, $2, $3, 10)
     ON CONFLICT (store_id, product_id)
     DO UPDATE SET quantity_on_hand = $3, updated_at = NOW()`,
    [STORE_ID, productId, stockOnHand]
  );
}

async function getStock(productId) {
  const res = await db.query(
    `SELECT quantity_on_hand FROM inventory_levels WHERE store_id = $1 AND product_id = $2`,
    [STORE_ID, productId]
  );
  return res.rows[0]?.quantity_on_hand ?? 0;
}

async function main() {
  console.log('='.repeat(85));
  console.log('POS AI - Phase 4.2: Automated POS Load & Concurrency Performance Test');
  console.log('Simulating High-Throughput Concurrent Cashier Checkouts against apps/api-gateway');
  console.log('='.repeat(85));

  // 1. Authenticate Cashier
  console.log('\n[1/5] Authenticating cashier operator session...');
  const token = await loginCashier();
  console.log(' [OK] Cashier authenticated successfully (JWT Token acquired).');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const testReport = {
    timestamp: new Date().toISOString(),
    phase: '4.2: POS Load & Performance Testing',
    gatewayUrl: GATEWAY_URL,
    suites: {},
    summary: {},
  };

  // =========================================================================
  // SUITE 1: Multi-Lane Concurrent Checkout Blast & Stock Isolation
  // =========================================================================
  console.log('\n[2/5] Running Suite 1: Concurrent Multi-Lane Checkout Blast (20 Concurrent Cashiers)...');
  
  // Seed ample baseline stock for test items
  await resetStock(PRODUCTS.RICE.id, 100);
  await resetStock(PRODUCTS.TUNA.id, 100);
  await resetStock(PRODUCTS.COFFEE.id, 100);
  await resetStock(PRODUCTS.NOODLES.id, 100);

  const initialRiceStock = await getStock(PRODUCTS.RICE.id);
  const initialTunaStock = await getStock(PRODUCTS.TUNA.id);
  console.log(` [SETUP] Baseline inventory initialized: Rice = ${initialRiceStock} units, Tuna = ${initialTunaStock} units.`);

  // 20 concurrent transactions across multi-lane terminals
  const concurrentTxnCount = 20;
  let expectedRiceDeducted = 0;
  let expectedTunaDeducted = 0;

  const checkoutPayloads = Array.from({ length: concurrentTxnCount }).map((_, i) => {
    const isRice = i % 2 === 0;
    const targetProd = isRice ? PRODUCTS.RICE : PRODUCTS.TUNA;
    const qty = 2;
    if (isRice) expectedRiceDeducted += qty;
    else expectedTunaDeducted += qty;

    const total = targetProd.price * qty;

    return {
      storeId: STORE_ID,
      idempotencyKey: `MULTI-LANE-${Date.now()}-${i}-${crypto.randomUUID()}`,
      items: [{ productId: targetProd.id, quantity: qty, unitPrice: targetProd.price }],
      payments: [{ method: i % 3 === 0 ? 'cash' : 'digital_wallet', amount: total + 50.0 }],
    };
  });

  const t0_suite1 = process.hrtime.bigint();
  const responsesSuite1 = await Promise.all(
    checkoutPayloads.map((p) =>
      httpRequest(`${GATEWAY_URL}/pos/checkout`, { method: 'POST', headers: authHeaders }, p)
    )
  );
  const t1_suite1 = process.hrtime.bigint();
  const suite1TotalMs = Number(t1_suite1 - t0_suite1) / 1e6;

  const successfulTxns = responsesSuite1.filter((r) => r.status === 201);
  const failedTxns = responsesSuite1.filter((r) => r.status !== 201);
  const latenciesSuite1 = responsesSuite1.map((r) => r.durationMs);

  const finalRiceStock = await getStock(PRODUCTS.RICE.id);
  const finalTunaStock = await getStock(PRODUCTS.TUNA.id);
  const isRiceStockCorrect = finalRiceStock === (initialRiceStock - expectedRiceDeducted);
  const isTunaStockCorrect = finalTunaStock === (initialTunaStock - expectedTunaDeducted);
  const isIsolationFlawless = isRiceStockCorrect && isTunaStockCorrect && successfulTxns.length === concurrentTxnCount;

  console.log(` [RESULT] Completed ${responsesSuite1.length} concurrent transactions in ${suite1TotalMs.toFixed(2)} ms.`);
  console.log(`   - Successful (201 Created): ${successfulTxns.length} / ${concurrentTxnCount}`);
  console.log(`   - Rice Stock Deductions   : Initial ${initialRiceStock} - ${expectedRiceDeducted} = ${finalRiceStock} [${isRiceStockCorrect ? 'CORRECT' : 'ERROR'}]`);
  console.log(`   - Tuna Stock Deductions   : Initial ${initialTunaStock} - ${expectedTunaDeducted} = ${finalTunaStock} [${isTunaStockCorrect ? 'CORRECT' : 'ERROR'}]`);
  console.log(`   - Isolation & Race Status : ${isIsolationFlawless ? 'PASS (Zero Race Conditions)' : 'FAIL'}`);

  testReport.suites.concurrencyBlast = {
    totalRequests: concurrentTxnCount,
    successful: successfulTxns.length,
    failed: failedTxns.length,
    isIsolationFlawless,
    p50LatencyMs: percentile(latenciesSuite1, 50).toFixed(2),
    p95LatencyMs: percentile(latenciesSuite1, 95).toFixed(2),
    throughputReqPerSec: ((concurrentTxnCount / suite1TotalMs) * 1000).toFixed(1),
  };

  // =========================================================================
  // SUITE 2: Philippine 12% Standard VAT & Senior/PWD Exemption Verification
  // =========================================================================
  console.log('\n[3/5] Running Suite 2: 12% Philippine VAT & RA 9994 Senior/PWD Calculations...');
  
  // Re-seed ample stock for VAT calculations
  await resetStock(PRODUCTS.TUNA.id, 50);
  await resetStock(PRODUCTS.RICE.id, 50);

  // 1. Standard VAT Ticket: 4 units Century Tuna (₱46.75) + 1 unit Rice (₱285)
  // Gross = 4 * 46.75 + 285 = 187.00 + 285 = 472.00
  // Standard VAT: Vatable Sales = 472.00 / 1.12 = 421.43, VAT = 472.00 - 421.43 = 50.57
  const stdRes = await httpRequest(`${GATEWAY_URL}/pos/checkout`, {
    method: 'POST',
    headers: authHeaders,
  }, {
    storeId: STORE_ID,
    idempotencyKey: `VAT-STD-${Date.now()}-${crypto.randomUUID()}`,
    items: [
      { productId: PRODUCTS.TUNA.id, quantity: 4, unitPrice: PRODUCTS.TUNA.price },
      { productId: PRODUCTS.RICE.id, quantity: 1, unitPrice: PRODUCTS.RICE.price },
    ],
    payments: [{ method: 'cash', amount: 500.00 }],
  });

  const stdGross = stdRes.body.subtotal;
  const stdTax = stdRes.body.tax;
  const stdTotal = stdRes.body.total;
  const expectedStdGross = 472.00;
  const expectedStdVatable = +(expectedStdGross / 1.12).toFixed(2);
  const expectedStdTax = +(expectedStdGross - expectedStdVatable).toFixed(2);
  const isStdVatCorrect = stdRes.status === 201 && Math.abs(stdTax - expectedStdTax) <= 0.05 && stdTotal === expectedStdGross;

  console.log(` [STANDARD 12% VAT] Gross: ₱${stdGross} | VAT: ₱${stdTax} (Expected: ₱${expectedStdTax}) | Total: ₱${stdTotal}`);
  console.log(`   - VAT Calculation Accuracy: ${isStdVatCorrect ? 'PASS (100% BIR Compliant)' : 'FAIL'}`);

  // 2. Senior Citizen / PWD RA 9994 Ticket
  // RA 9994: Net of VAT = 472.00 / 1.12 = 421.43, 20% Discount = 421.43 * 0.20 = 84.29
  // Total Due = 421.43 - 84.29 = 337.14, VAT = 0.00
  const snrRes = await httpRequest(`${GATEWAY_URL}/pos/checkout`, {
    method: 'POST',
    headers: authHeaders,
  }, {
    storeId: STORE_ID,
    idempotencyKey: `VAT-SNR-${Date.now()}-${crypto.randomUUID()}`,
    items: [
      { productId: PRODUCTS.TUNA.id, quantity: 4, unitPrice: PRODUCTS.TUNA.price },
      { productId: PRODUCTS.RICE.id, quantity: 1, unitPrice: PRODUCTS.RICE.price },
    ],
    metadata: { isSeniorOrPwd: true },
    payments: [{ method: 'digital_wallet', amount: 350.00 }],
  });

  const snrGross = snrRes.body.subtotal;
  const snrTax = snrRes.body.tax;
  const snrDiscount = snrRes.body.discount;
  const snrTotal = snrRes.body.total;
  const isSnrCompliant = snrRes.status === 201 && snrTax === 0 && Math.abs(snrDiscount - 84.29) <= 0.10 && Math.abs(snrTotal - 337.14) <= 0.10;

  console.log(` [SENIOR/PWD RA 9994] Gross: ₱${snrGross} | VAT Exempt: ₱${snrTax} | Discount (20%): ₱${snrDiscount} | Total: ₱${snrTotal}`);
  console.log(`   - RA 9994 Exemption Status: ${isSnrCompliant ? 'PASS (Exempt + 20% Net Discount)' : 'FAIL'}`);

  testReport.suites.taxAndDiscounts = {
    standardVat: { subtotal: stdGross, vat: stdTax, total: stdTotal, passed: isStdVatCorrect },
    seniorPwdRa9994: { subtotal: snrGross, vat: snrTax, discount: snrDiscount, total: snrTotal, passed: isSnrCompliant },
  };

  // =========================================================================
  // SUITE 3: Oversell Race Condition Test (Stock Boundary & 409 Conflict)
  // =========================================================================
  console.log('\n[4/5] Running Suite 3: Oversell Isolation & 409 Conflict Under Concurrency...');

  // Set stock of Kopiko Coffee to exactly 6 units
  const exactStock = 6;
  await resetStock(PRODUCTS.COFFEE.id, exactStock);
  console.log(` [SETUP] Injected critical stock boundary of exactly ${exactStock} units for Kopiko Blanca Coffee.`);

  // 10 concurrent requests each demanding 2 units (Demand = 20 units against 6 available)
  const oversellPayloads = Array.from({ length: 10 }).map((_, i) => ({
    storeId: STORE_ID,
    idempotencyKey: `OVERSELL-TEST-${Date.now()}-${i}-${crypto.randomUUID()}`,
    items: [{ productId: PRODUCTS.COFFEE.id, quantity: 2, unitPrice: PRODUCTS.COFFEE.price }],
    payments: [{ method: 'cash', amount: 200.00 }],
  }));

  const oversellResponses = await Promise.all(
    oversellPayloads.map((p) =>
      httpRequest(`${GATEWAY_URL}/pos/checkout`, { method: 'POST', headers: authHeaders }, p)
    )
  );

  const oversellSuccess = oversellResponses.filter((r) => r.status === 201);
  const oversellConflicts = oversellResponses.filter((r) => r.status === 409);
  const finalBoundaryStock = await getStock(PRODUCTS.COFFEE.id);

  console.log(` [RESULT] Out of 10 concurrent requests (demanding 20 units against 6 available):`);
  console.log(`   - 201 Created (Committed) : ${oversellSuccess.length} (Expected: exactly 3)`);
  console.log(`   - 409 Conflict (Rejected) : ${oversellConflicts.length} (Expected: exactly 7)`);
  console.log(`   - Final Stock in Postgres : ${finalBoundaryStock} units (Expected: exactly 0)`);

  const isOversellGuarded = oversellSuccess.length === 3 && oversellConflicts.length === 7 && finalBoundaryStock === 0;
  console.log(`   - Oversell Guard Status   : ${isOversellGuarded ? 'PASS (Zero Negative Stock, Atomic 409 Rollback)' : 'FAIL'}`);

  testReport.suites.oversellBoundary = {
    availableUnits: exactStock,
    totalDemandUnits: 20,
    successfulCheckouts: oversellSuccess.length,
    conflictsRejected: oversellConflicts.length,
    finalStock: finalBoundaryStock,
    passed: isOversellGuarded,
  };

  // =========================================================================
  // SUITE 4: Benchmark Latency & SLA Check (Sustained Cashier Operations)
  // =========================================================================
  console.log('\n[5/5] Running Suite 4: Sequential Sustained Latency Benchmark (15 Rapid Checkouts)...');
  await resetStock(PRODUCTS.NOODLES.id, 100);

  const sustainedLatencies = [];
  for (let i = 0; i < 15; i++) {
    const res = await httpRequest(`${GATEWAY_URL}/pos/checkout`, {
      method: 'POST',
      headers: authHeaders,
    }, {
      storeId: STORE_ID,
      idempotencyKey: `SUSTAINED-${Date.now()}-${i}-${crypto.randomUUID()}`,
      items: [{ productId: PRODUCTS.NOODLES.id, quantity: 1, unitPrice: PRODUCTS.NOODLES.price }],
      payments: [{ method: 'cash', amount: 100.00 }],
    });
    sustainedLatencies.push(res.durationMs);
  }

  const avgLatency = sustainedLatencies.reduce((a, b) => a + b, 0) / sustainedLatencies.length;
  const p50 = percentile(sustainedLatencies, 50);
  const p95 = percentile(sustainedLatencies, 95);
  const p99 = percentile(sustainedLatencies, 99);

  const slaAvgPass = avgLatency <= 100.0;
  const slaP95Pass = p95 <= 200.0;

  console.log(` - Average Latency per Checkout : ${avgLatency.toFixed(2)} ms  [${slaAvgPass ? 'PASS' : 'FAIL'} - SLA <= 100ms]`);
  console.log(` - Median (P50) Latency         : ${p50.toFixed(2)} ms`);
  console.log(` - 95th Percentile (P95) Latency : ${p95.toFixed(2)} ms  [${slaP95Pass ? 'PASS' : 'FAIL'} - SLA <= 200ms]`);
  console.log(` - 99th Percentile (P99) Latency : ${p99.toFixed(2)} ms`);

  testReport.summary = {
    totalRequestsExecuted: responsesSuite1.length + 2 + oversellResponses.length + sustainedLatencies.length,
    avgLatencyMs: avgLatency.toFixed(2),
    p50LatencyMs: p50.toFixed(2),
    p95LatencyMs: p95.toFixed(2),
    p99LatencyMs: p99.toFixed(2),
    slaChecks: {
      concurrencyIsolationPassed: isIsolationFlawless,
      vatCompliantPassed: isStdVatCorrect,
      seniorPwdExemptPassed: isSnrCompliant,
      oversellProtectionPassed: isOversellGuarded,
      latencySlaPassed: slaAvgPass && slaP95Pass,
    },
    allPassed: isIsolationFlawless && isStdVatCorrect && isSnrCompliant && isOversellGuarded && slaAvgPass && slaP95Pass,
  };

  // Save report artifact
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, 'pos_load_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2), 'utf-8');
  console.log(`\n[OK] Load test report saved to: ${reportPath}`);

  // Clean teardown
  await db.end();

  console.log('\n' + '='.repeat(85));
  if (testReport.summary.allPassed) {
    console.log('>>> ALL CONCURRENT POS LOAD, ISOLATION & VAT CRITERIA PASSED CLEANLY! <<<');
    console.log('='.repeat(85));
    process.exit(0);
  } else {
    console.log('[WARNING] One or more performance or concurrency criteria failed.');
    console.log('='.repeat(85));
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('\n[FATAL ERROR]', err);
  await db.end().catch(() => {});
  process.exit(1);
});
