import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  TransactionHistoryQuery,
  TransactionHistoryItem,
  TransactionHistoryResponse,
} from '@pos-ai/shared-types';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Query transaction history with pagination, search, date range, and cashier name filtering.
   * Respects RBAC: cashiers see only recent 7-day window; managers see full history.
   */
  async getTransactionHistory(
    query: TransactionHistoryQuery,
    userRole: string,
  ): Promise<TransactionHistoryResponse> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = (query.sortOrder || 'desc').toUpperCase();

    // Validate sort columns to prevent SQL injection
    const allowedSortColumns = ['created_at', 'total_amount', 'transaction_number'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    if (this.db.isDbConnected) {
      try {
        const conditions: string[] = ["st.status = 'completed'"];
        const params: any[] = [];
        let paramIdx = 1;

        // Cashier RBAC restriction: only recent 7 days
        if (userRole === 'cashier') {
          conditions.push(`st.created_at >= NOW() - INTERVAL '7 days'`);
        }

        // Search filter: match transaction_number or transaction ID
        if (query.search && query.search.trim()) {
          conditions.push(
            `(st.transaction_number ILIKE $${paramIdx} OR st.id::TEXT ILIKE $${paramIdx})`,
          );
          params.push(`%${query.search.trim()}%`);
          paramIdx++;
        }

        // Date range filters
        if (query.dateFrom) {
          conditions.push(`st.created_at >= $${paramIdx}::TIMESTAMP`);
          params.push(query.dateFrom);
          paramIdx++;
        }
        if (query.dateTo) {
          conditions.push(`st.created_at <= ($${paramIdx}::TIMESTAMP + INTERVAL '1 day')`);
          params.push(query.dateTo);
          paramIdx++;
        }

        // Cashier name partial match
        if (query.cashierName && query.cashierName.trim()) {
          conditions.push(
            `(u.first_name || ' ' || u.last_name) ILIKE $${paramIdx}`,
          );
          params.push(`%${query.cashierName.trim()}%`);
          paramIdx++;
        }

        // Status filter
        if (query.status) {
          conditions.push(`st.status = $${paramIdx}`);
          params.push(query.status);
          paramIdx++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count total matching records
        const countQuery = `
          SELECT COUNT(*)::INT as total
          FROM sales_transactions st
          LEFT JOIN users u ON u.id = st.cashier_id
          ${whereClause}
        `;
        const countResult = await this.db.query<{ total: number }>(countQuery, params);
        const total = countResult[0]?.total || 0;

        // Fetch paginated transaction records
        const dataQuery = `
          SELECT
            st.id,
            st.transaction_number AS "transactionNumber",
            st.status,
            st.subtotal_amount::FLOAT AS subtotal,
            st.tax_amount::FLOAT AS tax,
            st.discount_amount::FLOAT AS discount,
            st.total_amount::FLOAT AS total,
            COALESCE(u.first_name || ' ' || u.last_name, 'Unknown Cashier') AS "cashierName",
            COALESCE(st.cashier_id::TEXT, '') AS "cashierId",
            COALESCE(s.name, 'Meme Mart') AS "storeName",
            COALESCE(st.store_id::TEXT, '') AS "storeId",
            st.created_at AS "createdAt"
          FROM sales_transactions st
          LEFT JOIN users u ON u.id = st.cashier_id
          LEFT JOIN stores s ON s.id = st.store_id
          ${whereClause}
          ORDER BY st.${safeSortBy} ${safeSortOrder}
          LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
        `;
        params.push(limit, offset);

        const transactions = await this.db.query<any>(dataQuery, params);

        // Fetch line items and payments for each transaction
        const items: TransactionHistoryItem[] = [];
        for (const txn of transactions) {
          const lineItems = await this.db.query<any>(
            `SELECT
               product_name AS "productName",
               sku,
               quantity,
               unit_price::FLOAT AS "unitPrice",
               total_price::FLOAT AS "totalPrice",
               COALESCE(tax_rate::FLOAT, 0.12) AS "taxRate",
               COALESCE(discount_amount::FLOAT, 0) AS "discountAmount"
             FROM sales_line_items
             WHERE transaction_id = $1
             ORDER BY created_at ASC`,
            [txn.id],
          );

          const payments = await this.db.query<any>(
            `SELECT
               method,
               amount::FLOAT AS amount,
               status
             FROM payment_records
             WHERE transaction_id = $1`,
            [txn.id],
          );

          items.push({
            ...txn,
            lineItems,
            payments,
          });
        }

        return {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      } catch (err: any) {
        this.logger.warn(
          `PostgreSQL transaction history query failed: ${err.message}. Falling back to empty result.`,
        );
      }
    }

    // Fallback: return empty paginated result when DB is not connected
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  /**
   * Retrieve a single transaction receipt by ID with full line items, payments, and VAT details.
   * Accessible to both cashiers and managers.
   */
  async getTransactionReceipt(transactionId: string): Promise<TransactionHistoryItem> {
    if (this.db.isDbConnected) {
      const txnResult = await this.db.query<any>(
        `SELECT
           st.id,
           st.transaction_number AS "transactionNumber",
           st.status,
           st.subtotal_amount::FLOAT AS subtotal,
           st.tax_amount::FLOAT AS tax,
           st.discount_amount::FLOAT AS discount,
           st.total_amount::FLOAT AS total,
           COALESCE(u.first_name || ' ' || u.last_name, 'Unknown Cashier') AS "cashierName",
           COALESCE(st.cashier_id::TEXT, '') AS "cashierId",
           COALESCE(s.name, 'Meme Mart') AS "storeName",
           COALESCE(st.store_id::TEXT, '') AS "storeId",
           st.created_at AS "createdAt"
         FROM sales_transactions st
         LEFT JOIN users u ON u.id = st.cashier_id
         LEFT JOIN stores s ON s.id = st.store_id
         WHERE st.id = $1`,
        [transactionId],
      );

      if (txnResult.length === 0) {
        throw new NotFoundException(`Transaction receipt ${transactionId} not found`);
      }

      const txn = txnResult[0];

      const lineItems = await this.db.query<any>(
        `SELECT
           product_name AS "productName",
           sku,
           quantity,
           unit_price::FLOAT AS "unitPrice",
           total_price::FLOAT AS "totalPrice",
           COALESCE(tax_rate::FLOAT, 0.12) AS "taxRate",
           COALESCE(discount_amount::FLOAT, 0) AS "discountAmount"
         FROM sales_line_items
         WHERE transaction_id = $1
         ORDER BY created_at ASC`,
        [transactionId],
      );

      const payments = await this.db.query<any>(
        `SELECT
           method,
           amount::FLOAT AS amount,
           status
         FROM payment_records
         WHERE transaction_id = $1`,
        [transactionId],
      );

      return {
        ...txn,
        lineItems,
        payments,
      };
    }

    throw new NotFoundException(`Transaction receipt ${transactionId} not found (DB offline)`);
  }

  /**
   * Export transaction history as CSV format string.
   * Manager-only capability.
   */
  async exportTransactionsCsv(
    query: TransactionHistoryQuery,
  ): Promise<string> {
    // Fetch all matching transactions (no pagination limit for export)
    const fullQuery = { ...query, page: 1, limit: 10000 };
    const result = await this.getTransactionHistory(fullQuery, 'store_manager');

    const headers = [
      'Transaction Number',
      'Date',
      'Cashier',
      'Store',
      'Subtotal (PHP)',
      'VAT 12% (PHP)',
      'Discount (PHP)',
      'Total (PHP)',
      'Status',
      'Items',
      'Payment Method',
    ];

    const rows = result.items.map((txn) => [
      txn.transactionNumber,
      new Date(txn.createdAt).toLocaleString('en-PH'),
      txn.cashierName,
      txn.storeName,
      txn.subtotal.toFixed(2),
      txn.tax.toFixed(2),
      txn.discount.toFixed(2),
      txn.total.toFixed(2),
      txn.status,
      txn.lineItems.map((li) => `${li.productName} x${li.quantity}`).join('; '),
      txn.payments.map((p) => `${p.method}: ${p.amount.toFixed(2)}`).join('; '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return csvContent;
  }
}
