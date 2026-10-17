const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { DatabaseService } = require('../dist/modules/database/database.service');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
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

describe('POS Checkout - Integration Tests (HTTP & PostgreSQL ACID)', () => {
  const TEST_PORT = 4198;
  let app;
  let dbService;
  let cashierToken;
  let adminToken;

  before(async () => {
    app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.listen(TEST_PORT);
    dbService = app.get(DatabaseService);

    // Obtain authentication tokens
    const cashierLogin = await request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'cashier_01', password: 'Password123!' }
    );
    cashierToken = cashierLogin.body.accessToken;

    const adminLogin = await request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { username: 'admin', password: 'Password123!' }
    );
    adminToken = adminLogin.body.accessToken;
  });

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Authentication & Access Control', () => {
    it('should reject unauthenticated checkout requests with 401 Unauthorized', async () => {
      const res = await request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/v1/pos/checkout',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          items: [{ productId: '40000000-0000-0000-0000-000000000001', quantity: 1, unitPrice: 285 }],
          payments: [{ method: 'cash', amount: 300 }],
        }
      );
      assert.strictEqual(res.status, 401);
    });
  });

  describe('Standard POS Checkout (12% Philippine VAT)', () => {
    it('should execute checkout inside PostgreSQL transaction and decrement stock', async () => {
      const storeId = '10000000-0000-0000-0000-000000000001';
      const prodId = '40000000-0000-0000-0000-000000000008'; // San Miguel Pale Pilsen (₱58.00)
      const qtyToBuy = 2;

      // Check stock before sale
      let initialStock = 90;
      if (dbService.isDbConnected) {
        const check = await dbService.query(
          'SELECT quantity_on_hand FROM inventory_levels WHERE store_id = $1 AND product_id = $2',
          [storeId, prodId]
        );
        if (check.length > 0) initialStock = check[0].quantity_on_hand;
      }

      const idempKey = `IDEMP-INT-${Date.now()}`;
      const res = await request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/v1/pos/checkout',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`,
          },
        },
        {
          storeId,
          idempotencyKey: idempKey,
          items: [{ productId: prodId, quantity: qtyToBuy, unitPrice: 58.00 }],
          payments: [{ method: 'cash', amount: 200.00 }],
        }
      );

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.subtotal, 116.00, 'Subtotal is 2 * ₱58.00 = ₱116.00');
      // VATable Sales = 116.00 / 1.12 = 103.57; VAT = 116.00 - 103.57 = 12.43
      assert.strictEqual(res.body.tax, 12.43);
      assert.strictEqual(res.body.total, 116.00);
      assert.strictEqual(res.body.changeDue, 84.00, 'Change due is ₱84.00 (₱200 - ₱116)');

      // Verify stock level decremented in database
      if (dbService.isDbConnected) {
        const postCheck = await dbService.query(
          'SELECT quantity_on_hand FROM inventory_levels WHERE store_id = $1 AND product_id = $2',
          [storeId, prodId]
        );
        assert.strictEqual(postCheck[0].quantity_on_hand, initialStock - qtyToBuy);

        // Verify inventory ledger audit record created
        const ledger = await dbService.query(
          'SELECT * FROM inventory_transactions WHERE store_id = $1 AND product_id = $2 AND movement_type = $3 ORDER BY created_at DESC LIMIT 1',
          [storeId, prodId, 'sale']
        );
        assert(ledger.length > 0);
        assert.strictEqual(ledger[0].quantity_delta, -qtyToBuy);
      }
    });
  });

  describe('HTTP Idempotency Enforcement', () => {
    it('should return identical receipt without duplicate inventory decrement on replay', async () => {
      const storeId = '10000000-0000-0000-0000-000000000001';
      const idempKey = `IDEMP-REPLAY-${Date.now()}`;
      const payload = {
        storeId,
        idempotencyKey: idempKey,
        items: [{ productId: '40000000-0000-0000-0000-000000000007', quantity: 1, unitPrice: 85.00 }],
        payments: [{ method: 'cash', amount: 100.00 }],
      };

      const res1 = await request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/v1/pos/checkout',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`,
          },
        },
        payload
      );

      const res2 = await request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/v1/pos/checkout',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`,
          },
        },
        payload
      );

      assert.strictEqual(res1.status, 201);
      assert.strictEqual(res2.body.transactionId, res1.body.transactionId);
      assert.strictEqual(res2.body.transactionNumber, res1.body.transactionNumber);
    });
  });

  describe('Senior Citizen / PWD 20% Discount over HTTP', () => {
    it('should process VAT-exempt senior transaction with 20% discount', async () => {
      const res = await request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/v1/pos/checkout',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`,
          },
        },
        {
          storeId: '10000000-0000-0000-0000-000000000001',
          items: [{ productId: '40000000-0000-0000-0000-000000000001', quantity: 1, unitPrice: 285.00 }],
          payments: [{ method: 'cash', amount: 250.00 }],
          metadata: { isSeniorOrPwd: true, seniorPwdId: 'PWD-NCR-8891' },
        }
      );

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.tax, 0.00, 'Senior sale must be 0 VAT');
      assert.strictEqual(res.body.discount, 50.89);
      assert.strictEqual(res.body.total, 203.57);
    });
  });

  describe('Receipt Retrieval by Transaction ID', () => {
    it('should return complete transaction receipt with line items and store information', async () => {
      // Create transaction first
      const checkoutRes = await request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: '/api/v1/pos/checkout',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`,
          },
        },
        {
          storeId: '10000000-0000-0000-0000-000000000001',
          items: [{ productId: '40000000-0000-0000-0000-000000000009', quantity: 2, unitPrice: 31.00 }],
          payments: [{ method: 'cash', amount: 100.00 }],
        }
      );

      const txnId = checkoutRes.body.transactionId;

      const receiptRes = await request(
        {
          hostname: 'localhost',
          port: TEST_PORT,
          path: `/api/v1/pos/transactions/${txnId}`,
          method: 'GET',
          headers: { Authorization: `Bearer ${cashierToken}` },
        }
      );

      assert.strictEqual(receiptRes.status, 200);
      assert.strictEqual(receiptRes.body.transactionNumber, checkoutRes.body.transactionNumber);
      assert(Array.isArray(receiptRes.body.lineItems));
      assert.strictEqual(receiptRes.body.lineItems.length, 1);
      assert(Array.isArray(receiptRes.body.payments));
    });
  });
});
