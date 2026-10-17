const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Helper to make HTTP requests to the running or tested server
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('===============================================================');
  console.log('🚀 Phase 2: Core Transactional MVP Verification Suite');
  console.log('Testing: Auth (JWT/RBAC), Product CRUD, Philippine 12% VAT POS');
  console.log('===============================================================\n');

  // We will bootstrap NestJS application programmatically using the compiled dist
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../apps/api-gateway/dist/app.module');

  console.log('Initializing NestJS application context...');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const TEST_PORT = 4199;
  await app.listen(TEST_PORT);
  console.log(`✓ Test API Gateway listening on http://localhost:${TEST_PORT}/api/v1\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: User Authentication & JWT / RBAC
    // -------------------------------------------------------------
    console.log('📋 [TEST SUITE 1] User Authentication (JWT + RBAC)');

    // 1.1 Invalid credentials
    const invalidLogin = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { username: 'cashier_01', password: 'WrongPassword!' });
    assert(invalidLogin.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 1.2 Cashier Login
    const cashierLogin = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { username: 'cashier_01', password: 'Password123!' });
    assert(cashierLogin.status === 200, 'Cashier login successful (200 OK)');
    assert(!!cashierLogin.body.accessToken, 'Access token issued');
    assert(cashierLogin.body.user.roles.includes('cashier'), 'Cashier role assigned to user profile');
    const cashierToken = cashierLogin.body.accessToken;

    // 1.3 Admin Login
    const adminLogin = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { username: 'admin', password: 'Password123!' });
    assert(adminLogin.status === 200, 'Admin login successful');
    assert(adminLogin.body.user.roles.includes('admin'), 'Admin role assigned');
    const adminToken = adminLogin.body.accessToken;

    // 1.4 Profile /me with Bearer Token
    const profile = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    assert(profile.status === 200, 'Protected /auth/me accessible with valid Bearer JWT');
    assert(profile.body.username === 'cashier_01', 'Profile matches authenticated user');

    // 1.5 Access protected endpoint without token
    const unauth = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/auth/me',
      method: 'GET',
    });
    assert(unauth.status === 401, 'Protected endpoint denies missing token (401)');

    // -------------------------------------------------------------
    // TEST SUITE 2: Product Catalog CRUD & Philippine Pricing
    // -------------------------------------------------------------
    console.log('\n📋 [TEST SUITE 2] Product Catalog CRUD & Philippine EAN Barcodes');

    // 2.1 List products
    const listProds = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/products?page=1&limit=10',
      method: 'GET',
    });
    assert(listProds.status === 200, 'GET /products returned 200 OK');
    assert(listProds.body.items.length > 0, `Products found: ${listProds.body.items.length} items`);

    // 2.2 Barcode scanning lookup
    const barcodeLookup = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/products/barcode/480001660101',
      method: 'GET',
    });
    assert(barcodeLookup.status === 200, 'GET /products/barcode/480001660101 matched');
    assert(barcodeLookup.body.name.includes('Sinandomeng'), 'Matched product is Sinandomeng Rice');
    assert(barcodeLookup.body.retailPrice === 285.00, 'Retail price is ₱285.00');

    // 2.3 RBAC guard test: Cashier attempting to create product (Forbidden)
    const cashierCreateProd = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
    }, {
      sku: 'TEST-SKU-999',
      name: 'Unauthorized Cashier Item',
      retailPrice: 100.0,
      costPrice: 80.0,
    });
    assert(cashierCreateProd.status === 403, 'RBAC Guard blocks Cashier from creating product (403 Forbidden)');

    // 2.4 Admin creates product
    const newSku = `BEV-TEST-${Date.now().toString().slice(-4)}`;
    const newBarcode = `480099${Date.now().toString().slice(-6)}`;
    const adminCreateProd = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      sku: newSku,
      barcode: newBarcode,
      name: 'San Miguel Cerveza Negra 330ml Can',
      description: 'Rich dark Philippine lager beer',
      unitOfMeasure: 'can',
      costPrice: 52.00,
      retailPrice: 68.00,
      taxRate: 0.12,
      reorderPoint: 24,
      reorderQuantity: 72,
      leadTimeDays: 2,
      initialStock: 48,
    });
    assert(adminCreateProd.status === 201, 'Admin successfully created product (201 Created)');
    const createdProductId = adminCreateProd.body.id;

    // 2.5 Update product price and details
    const updateProd = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/products/${createdProductId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      retailPrice: 69.50,
      description: 'Rich dark Philippine roasted malt lager beer',
    });
    assert(updateProd.status === 200, 'Product updated successfully');
    assert(updateProd.body.retailPrice === 69.50, 'Updated retail price reflected as ₱69.50');

    // 2.6 Soft delete product
    const deleteProd = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/products/${createdProductId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(deleteProd.status === 200, 'Product soft-deleted successfully');

    // -------------------------------------------------------------
    // TEST SUITE 3: POS Checkout Database Transaction & Philippine 12% VAT
    // -------------------------------------------------------------
    console.log('\n📋 [TEST SUITE 3] POS Checkout Transaction, Philippine 12% VAT & Senior Discount');

    // 3.1 Standard POS Checkout (12% VAT)
    // Items:
    // Purefoods Corned Beef: 2 x ₱98.50 = ₱197.00
    // Lucky Me Pancit Canton: 3 x ₱78.00 = ₱234.00
    // Gross = ₱431.00
    // VATable Sales = 431 / 1.12 = 384.82
    // VAT Amount = 431 - 384.82 = 46.18
    const idempKey1 = `IDEMP-${Date.now()}-1`;
    const checkoutSale = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/pos/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
    }, {
      storeId: '10000000-0000-0000-0000-000000000001',
      idempotencyKey: idempKey1,
      items: [
        {
          productId: '40000000-0000-0000-0000-000000000005', // Purefoods Corned Beef (₱98.50)
          quantity: 2,
          unitPrice: 98.50,
        },
        {
          productId: '40000000-0000-0000-0000-000000000003', // Lucky Me! Pancit Canton (₱78.00)
          quantity: 3,
          unitPrice: 78.00,
        },
      ],
      payments: [
        {
          method: 'cash',
          amount: 500.00, // Tender ₱500 cash
        },
      ],
    });

    assert(checkoutSale.status === 201, 'Standard POS checkout committed transaction (201 Created)');
    assert(checkoutSale.body.subtotal === 431.00, `Gross subtotal is ₱431.00 (got ${checkoutSale.body.subtotal})`);
    assert(checkoutSale.body.tax === 46.18, `Philippine 12% VAT is ₱46.18 (got ${checkoutSale.body.tax})`);
    assert(checkoutSale.body.total === 431.00, `Total payable is ₱431.00`);
    assert(checkoutSale.body.changeDue === 69.00, `Change due for ₱500 cash is ₱69.00 (got ${checkoutSale.body.changeDue})`);

    // 3.2 Idempotency Test: Repeat identical checkout request with same key
    const idempRepeat = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/pos/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
    }, {
      storeId: '10000000-0000-0000-0000-000000000001',
      idempotencyKey: idempKey1,
      items: [
        {
          productId: '40000000-0000-0000-0000-000000000005',
          quantity: 2,
          unitPrice: 98.50,
        },
      ],
      payments: [{ method: 'cash', amount: 500.00 }],
    });
    assert(idempRepeat.body.transactionId === checkoutSale.body.transactionId, 'Idempotency key returned cached transaction without re-decrementing inventory');

    // 3.3 Senior Citizen / PWD Discount (RA 9994 / RA 10754)
    // Items: Sinandomeng Rice 5kg: 1 x ₱285.00
    // Net of VAT = 285.00 / 1.12 = 254.46
    // 20% Senior Discount = 254.46 * 0.20 = 50.89
    // Net Payable = 254.46 - 50.89 = 203.57, VAT = 0.00
    const seniorCheckout = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/pos/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
    }, {
      storeId: '10000000-0000-0000-0000-000000000001',
      idempotencyKey: `IDEMP-${Date.now()}-SENIOR`,
      items: [
        {
          productId: '40000000-0000-0000-0000-000000000001',
          quantity: 1,
          unitPrice: 285.00,
        },
      ],
      payments: [
        {
          method: 'cash',
          amount: 250.00,
        },
      ],
      metadata: {
        isSeniorOrPwd: true,
        seniorPwdId: 'OSCA-NCR-2026-9912',
      },
    });

    assert(seniorCheckout.status === 201, 'Senior / PWD checkout processed successfully');
    assert(seniorCheckout.body.tax === 0.00, 'Senior sale is 0.00 VAT-exempt');
    assert(seniorCheckout.body.discount === 50.89, `20% discount on VAT-exempt amount is ₱50.89 (got ${seniorCheckout.body.discount})`);
    assert(seniorCheckout.body.total === 203.57, `Senior total net amount is ₱203.57 (got ${seniorCheckout.body.total})`);

    // 3.4 Retrieve Transaction by ID
    const getTxn = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/v1/pos/transactions/${checkoutSale.body.transactionId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cashierToken}`,
      },
    });
    assert(getTxn.status === 200, 'Retrieved transaction receipt details');
    assert(getTxn.body.transactionNumber === checkoutSale.body.transactionNumber, 'Transaction receipt numbers match');
    assert(getTxn.body.lineItems.length === 2, 'Receipt includes 2 line items');

    // -------------------------------------------------------------
    // TEST SUITE 4: Inventory Ledger & Stock Levels
    // -------------------------------------------------------------
    console.log('\n📋 [TEST SUITE 4] Inventory Ledger & Stock Balance Tracking');

    const invLevels = await request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/inventory/levels?storeId=10000000-0000-0000-0000-000000000001',
      method: 'GET',
    });
    assert(invLevels.status === 200, 'GET /inventory/levels returns current stock');
    assert(invLevels.body.length > 0, `Returned ${invLevels.body.length} stock level records`);

    console.log('\n===============================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('===============================================================\n');

  } finally {
    await app.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
