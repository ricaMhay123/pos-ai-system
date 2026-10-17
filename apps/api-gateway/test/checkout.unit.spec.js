const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { CheckoutService } = require('../dist/modules/checkout/checkout.service');
const { BadRequestException, ConflictException, NotFoundException } = require('@nestjs/common');

describe('CheckoutService - Unit Tests', () => {
  let checkoutService;
  let mockDb;
  let mockProductsService;

  beforeEach(() => {
    // Mock database service (disconnected for pure calculation & memory testing)
    mockDb = {
      isDbConnected: false,
      transaction: async (cb) => cb({}),
      query: async () => [],
    };
    mockProductsService = {};
    checkoutService = new CheckoutService(mockDb, mockProductsService);
  });

  describe('Validation & Edge Cases', () => {
    it('should throw BadRequestException when cart has no items', async () => {
      await assert.rejects(
        async () => {
          await checkoutService.processCheckout({
            storeId: '10000000-0000-0000-0000-000000000001',
            items: [],
            payments: [{ method: 'cash', amount: 100 }],
          });
        },
        (err) => {
          assert(err instanceof BadRequestException);
          assert.strictEqual(err.message, 'Checkout ticket cannot be empty');
          return true;
        }
      );
    });

    it('should throw BadRequestException when no payment tender is provided', async () => {
      await assert.rejects(
        async () => {
          await checkoutService.processCheckout({
            storeId: '10000000-0000-0000-0000-000000000001',
            items: [{ productId: 'prod-001', quantity: 1, unitPrice: 150 }],
            payments: [],
          });
        },
        (err) => {
          assert(err instanceof BadRequestException);
          assert.strictEqual(err.message, 'At least one payment tender is required');
          return true;
        }
      );
    });
  });

  describe('Philippine 12% Standard VAT Calculation', () => {
    it('should calculate 12% Philippine VAT correctly on regular items', async () => {
      // 2 units Purefoods Corned Beef @ ₱98.50 = ₱197.00
      // 3 units Lucky Me Pancit Canton @ ₱78.00 = ₱234.00
      // Gross Total = ₱431.00
      // VATable Sales = 431.00 / 1.12 = 384.82
      // VAT Amount (12%) = 431.00 - 384.82 = 46.18
      const payload = {
        storeId: '10000000-0000-0000-0000-000000000001',
        items: [
          { productId: 'prod-corned-beef', quantity: 2, unitPrice: 98.50 },
          { productId: 'prod-pancit-canton', quantity: 3, unitPrice: 78.00 },
        ],
        payments: [{ method: 'cash', amount: 500.00 }],
      };

      const result = await checkoutService.processCheckout(payload);

      assert.strictEqual(result.subtotal, 431.00, 'Gross subtotal must equal sum of line items (₱431.00)');
      assert.strictEqual(result.tax, 46.18, 'Philippine 12% VAT must equal ₱46.18');
      assert.strictEqual(result.discount, 0, 'Regular sale has 0 discount');
      assert.strictEqual(result.total, 431.00, 'Total payable must equal ₱431.00');
      assert.strictEqual(result.changeDue, 69.00, 'Change due for ₱500 cash tender must equal ₱69.00');
      assert.strictEqual(result.status, 'completed');
      assert(result.transactionNumber.startsWith('TXN-PH-'));
    });

    it('should handle exact cash payment without negative or undefined change', async () => {
      const payload = {
        storeId: '10000000-0000-0000-0000-000000000001',
        items: [{ productId: 'prod-coffee', quantity: 1, unitPrice: 85.00 }],
        payments: [{ method: 'cash', amount: 85.00 }],
      };

      const result = await checkoutService.processCheckout(payload);

      assert.strictEqual(result.total, 85.00);
      assert.strictEqual(result.changeDue, 0.00, 'Exact payment results in ₱0.00 change');
    });
  });

  describe('Philippine Senior Citizen & PWD Discount (RA 9994 / RA 10754)', () => {
    it('should compute 0% VAT and 20% discount on base net of VAT for qualified customers', async () => {
      // 1 sack Sinandomeng Rice @ ₱285.00
      // Net of VAT base = 285.00 / 1.12 = 254.46
      // 20% Senior Citizen Discount = 254.46 * 0.20 = 50.89
      // VAT Amount = ₱0.00 (VAT exempt)
      // Net Payable Total = 254.46 - 50.89 = ₱203.57
      const payload = {
        storeId: '10000000-0000-0000-0000-000000000001',
        items: [{ productId: 'prod-rice-sinandomeng', quantity: 1, unitPrice: 285.00 }],
        payments: [{ method: 'cash', amount: 250.00 }],
        metadata: {
          isSeniorOrPwd: true,
          seniorPwdId: 'OSCA-MANILA-2026-10294',
        },
      };

      const result = await checkoutService.processCheckout(payload);

      assert.strictEqual(result.subtotal, 285.00, 'Gross ticket total is ₱285.00');
      assert.strictEqual(result.tax, 0.00, 'Senior Citizen sales must be VAT-exempt (₱0.00)');
      assert.strictEqual(result.discount, 50.89, '20% discount on net base must equal ₱50.89');
      assert.strictEqual(result.total, 203.57, 'Total payable must be ₱203.57');
      assert.strictEqual(result.changeDue, 46.43, 'Change due from ₱250 cash tender must be ₱46.43 (250 - 203.57)');
    });
  });

  describe('Split Payment Tender', () => {
    it('should support split tender with GCash / Maya digital wallet and cash', async () => {
      const payload = {
        storeId: '10000000-0000-0000-0000-000000000001',
        items: [
          { productId: 'prod-item-1', quantity: 2, unitPrice: 250.00 }, // ₱500.00
          { productId: 'prod-item-2', quantity: 1, unitPrice: 500.00 }, // ₱500.00
        ],
        payments: [
          { method: 'digital_wallet', amount: 600.00, gatewayReference: 'GCASH-TXN-88192' },
          { method: 'cash', amount: 450.00 },
        ],
      };

      const result = await checkoutService.processCheckout(payload);

      assert.strictEqual(result.total, 1000.00);
      assert.strictEqual(result.changeDue, 50.00, 'Change due from ₱1,050 total tender on ₱1,000 ticket must be ₱50.00');
    });
  });

  describe('Idempotency Key Deduplication', () => {
    it('should return identical cached receipt when invoked with existing idempotency key', async () => {
      const idempKey = 'IDEMP-TEST-UNIT-KEY-001';
      const payload = {
        storeId: '10000000-0000-0000-0000-000000000001',
        idempotencyKey: idempKey,
        items: [{ productId: 'prod-canned-tuna', quantity: 1, unitPrice: 46.75 }],
        payments: [{ method: 'cash', amount: 50.00 }],
      };

      const firstCall = await checkoutService.processCheckout(payload);
      const secondCall = await checkoutService.processCheckout(payload);

      assert.strictEqual(firstCall.transactionId, secondCall.transactionId, 'Transaction IDs must be identical');
      assert.strictEqual(firstCall.transactionNumber, secondCall.transactionNumber, 'Transaction numbers must be identical');
      assert.strictEqual(firstCall.total, secondCall.total);
    });
  });

  describe('Database Transaction Stock Verification (Mocked DB)', () => {
    it('should throw ConflictException when stock on hand is insufficient', async () => {
      const dbWithStockCheck = {
        isDbConnected: true,
        transaction: async (callback) => {
          const mockClient = {
            query: async (text, params) => {
              if (text.includes('INSERT INTO inventory_levels')) {
                return { rows: [] };
              }
              if (text.includes('SELECT p.id, p.sku')) {
                return {
                  rows: [
                    {
                      id: 'prod-out-of-stock',
                      sku: 'CAN-SRD-006',
                      name: 'Mega Sardines',
                      cost_price: 21.0,
                      retail_price: 27.5,
                      tax_rate: 0.12,
                      quantity_on_hand: 2, // only 2 left in store
                    },
                  ],
                };
              }
              return { rows: [] };
            },
          };
          return callback(mockClient);
        },
      };

      const service = new CheckoutService(dbWithStockCheck, {});

      await assert.rejects(
        async () => {
          await service.processCheckout({
            storeId: '10000000-0000-0000-0000-000000000001',
            items: [
              { productId: 'prod-out-of-stock', quantity: 5, unitPrice: 27.5 }, // requesting 5
            ],
            payments: [{ method: 'cash', amount: 150 }],
          });
        },
        (err) => {
          assert(err instanceof ConflictException);
          assert(err.message.includes('Insufficient stock'));
          assert(err.message.includes('Available: 2, Requested: 5'));
          return true;
        }
      );
    });
  });
});
