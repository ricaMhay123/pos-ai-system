import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Calendar,
  User,
  Eye,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { getTransactionStore } from './PosCheckoutShell';
import { formatPhp } from '../../utils/formatters';
import type {
  TransactionHistoryItem,
  TransactionHistoryResponse,
} from '@pos-ai/shared-types';

interface TransactionHistoryPanelProps {
  userRole: 'cashier' | 'store_manager' | 'admin';
  onClose: () => void;
}

// ─── Realistic Philippine seed data for local/demo mode ───
const SEED_TRANSACTIONS: TransactionHistoryItem[] = [
  {
    id: '70000000-0000-0000-0000-000000000101',
    transactionNumber: 'TXN-PH-20261024-4821',
    status: 'completed',
    subtotal: 732.50,
    tax: 78.48,
    discount: 0,
    total: 732.50,
    cashierName: 'Juan Dela Cruz',
    cashierId: '20000000-0000-0000-0000-000000000011',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Sinandomeng Special Rice 5kg', sku: 'RIC-SIN-001', quantity: 1, unitPrice: 285.00, totalPrice: 285.00, taxRate: 0, discountAmount: 0 },
      { productName: 'Century Tuna Flakes in Oil 180g', sku: 'CAN-TUN-004', quantity: 3, unitPrice: 46.50, totalPrice: 139.50, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Purefoods Corned Beef 210g', sku: 'CAN-CRN-005', quantity: 2, unitPrice: 97.50, totalPrice: 195.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Kopiko Blanca 10s', sku: 'BEV-KOP-BLC', quantity: 1, unitPrice: 85.00, totalPrice: 85.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Colgate Triple Action 150g', sku: 'PER-CLG-150', quantity: 1, unitPrice: 134.00, totalPrice: 134.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'cash', amount: 800.00, status: 'captured' }],
    createdAt: '2026-10-24T10:23:15.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000102',
    transactionNumber: 'TXN-PH-20261024-3159',
    status: 'completed',
    subtotal: 1245.00,
    tax: 133.39,
    discount: 0,
    total: 1245.00,
    cashierName: 'Maria Santos',
    cashierId: '20000000-0000-0000-0000-000000000012',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'San Miguel Pale Pilsen 330ml 6-pack', sku: 'BEV-SMP-006', quantity: 2, unitPrice: 290.00, totalPrice: 580.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Jack n Jill Piattos Cheese 85g', sku: 'SNK-PIA-CHS', quantity: 5, unitPrice: 38.00, totalPrice: 190.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Magnolia Fresh Milk 1L', sku: 'DRY-MAG-MLK', quantity: 3, unitPrice: 110.00, totalPrice: 330.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Lucky Me! Pancit Canton Kalamansi', sku: 'NDL-PAN-KAL', quantity: 10, unitPrice: 14.50, totalPrice: 145.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'digital_wallet', amount: 1245.00, status: 'captured' }],
    createdAt: '2026-10-24T09:45:00.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000103',
    transactionNumber: 'TXN-PH-20261024-1942',
    status: 'completed',
    subtotal: 420.00,
    tax: 0.00,
    discount: 84.00,
    total: 336.00,
    cashierName: 'Juan Dela Cruz',
    cashierId: '20000000-0000-0000-0000-000000000011',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Sinandomeng Special Rice 5kg', sku: 'RIC-SIN-001', quantity: 1, unitPrice: 285.00, totalPrice: 285.00, taxRate: 0, discountAmount: 57.00 },
      { productName: 'Century Tuna Flakes in Oil 180g', sku: 'CAN-TUN-004', quantity: 2, unitPrice: 46.50, totalPrice: 93.00, taxRate: 0, discountAmount: 18.60 },
      { productName: 'Lucky Me! Pancit Canton Kalamansi', sku: 'NDL-PAN-KAL', quantity: 2, unitPrice: 14.50, totalPrice: 29.00, taxRate: 0, discountAmount: 5.80 },
    ],
    payments: [{ method: 'cash', amount: 500.00, status: 'captured' }],
    createdAt: '2026-10-24T08:12:30.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000104',
    transactionNumber: 'TXN-PH-20261023-8831',
    status: 'completed',
    subtotal: 2150.00,
    tax: 230.36,
    discount: 0,
    total: 2150.00,
    cashierName: 'Maria Santos',
    cashierId: '20000000-0000-0000-0000-000000000012',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Sinandomeng Special Rice 25kg Sack', sku: 'RIC-SIN-025', quantity: 1, unitPrice: 1350.00, totalPrice: 1350.00, taxRate: 0, discountAmount: 0 },
      { productName: 'Purefoods Tender Juicy Hotdog 1kg', sku: 'FRZ-PF-HDG', quantity: 2, unitPrice: 230.00, totalPrice: 460.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Nestle Bear Brand Powdered Milk 900g', sku: 'DRY-NES-BBR', quantity: 1, unitPrice: 340.00, totalPrice: 340.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'credit_card', amount: 2150.00, status: 'captured' }],
    createdAt: '2026-10-23T18:30:00.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000105',
    transactionNumber: 'TXN-PH-20261023-5510',
    status: 'completed',
    subtotal: 312.00,
    tax: 33.43,
    discount: 0,
    total: 312.00,
    cashierName: 'Juan Dela Cruz',
    cashierId: '20000000-0000-0000-0000-000000000011',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Kopiko Brown Coffee 10s', sku: 'BEV-KOP-BRN', quantity: 2, unitPrice: 85.00, totalPrice: 170.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'SkyFlakes Crackers 800g Tub', sku: 'SNK-SKY-TUB', quantity: 1, unitPrice: 142.00, totalPrice: 142.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'cash', amount: 500.00, status: 'captured' }],
    createdAt: '2026-10-23T14:15:45.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000106',
    transactionNumber: 'TXN-PH-20261022-2291',
    status: 'completed',
    subtotal: 580.00,
    tax: 62.14,
    discount: 0,
    total: 580.00,
    cashierName: 'Maria Santos',
    cashierId: '20000000-0000-0000-0000-000000000012',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'San Miguel Light 330ml 6-pack', sku: 'BEV-SML-006', quantity: 2, unitPrice: 290.00, totalPrice: 580.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'digital_wallet', amount: 580.00, status: 'captured' }],
    createdAt: '2026-10-22T21:05:00.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000107',
    transactionNumber: 'TXN-PH-20261021-9903',
    status: 'completed',
    subtotal: 189.00,
    tax: 20.25,
    discount: 0,
    total: 189.00,
    cashierName: 'Juan Dela Cruz',
    cashierId: '20000000-0000-0000-0000-000000000011',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Century Tuna Flakes in Oil 180g', sku: 'CAN-TUN-004', quantity: 2, unitPrice: 46.50, totalPrice: 93.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Lucky Me! Instant Mami Chicken', sku: 'NDL-MAM-CHK', quantity: 6, unitPrice: 16.00, totalPrice: 96.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'cash', amount: 200.00, status: 'captured' }],
    createdAt: '2026-10-21T11:20:00.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000108',
    transactionNumber: 'TXN-PH-20261020-6641',
    status: 'completed',
    subtotal: 960.00,
    tax: 102.86,
    discount: 0,
    total: 960.00,
    cashierName: 'Maria Santos',
    cashierId: '20000000-0000-0000-0000-000000000012',
    storeName: '21/7teen Mart - Store #01',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Safeguard Pure White Soap 130g 3-pack', sku: 'PER-SFG-3PK', quantity: 3, unitPrice: 145.00, totalPrice: 435.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Downy Sunrise Fresh Fabric Softener 900ml', sku: 'HHD-DWN-900', quantity: 2, unitPrice: 195.00, totalPrice: 390.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Ariel Sunrise Fresh Detergent 70g', sku: 'HHD-ARL-070', quantity: 10, unitPrice: 13.50, totalPrice: 135.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'digital_wallet', amount: 960.00, status: 'captured' }],
    createdAt: '2026-10-20T16:40:00.000Z',
  },
];

const ITEMS_PER_PAGE = 8;

export const TransactionHistoryPanel: React.FC<TransactionHistoryPanelProps> = ({
  userRole,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cashierFilter, setCashierFilter] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'transaction_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Receipt modal state
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistoryItem | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const isManager = userRole === 'store_manager' || userRole === 'admin';

  // Fetch transactions from API Gateway, falling back to local seed data
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (cashierFilter.trim()) params.set('cashierName', cashierFilter.trim());

      const res = await fetch(
        `http://localhost:4000/api/v1/pos/transactions?${params.toString()}`,
      );

      if (res.ok) {
        const data: TransactionHistoryResponse = await res.json();
        setTransactions(data.items);
        setTotalRecords(data.total);
        setTotalPages(data.totalPages);
        setIsLoading(false);
        return;
      }
    } catch {
      // Backend not running; fall back to client-side filtering of seed data
    }

    // Client-side fallback with real-time checkout session storage items
    const sessionTxns = getTransactionStore();
    const combinedSeed = [...sessionTxns, ...SEED_TRANSACTIONS];

    // Filter by 7 days if cashier (RBAC: cashiers can only view past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let filtered = combinedSeed.filter((t) => {
      // RBAC window constraint for cashiers
      if (!isManager && new Date(t.createdAt) < sevenDaysAgo) {
        return false;
      }

      // Search query (ID, Transaction #, Cashier)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = t.transactionNumber.toLowerCase().includes(q);
        const matchesCashier = t.cashierName.toLowerCase().includes(q);
        const matchesItems = t.lineItems.some((li) => li.productName.toLowerCase().includes(q));
        if (!matchesNumber && !matchesCashier && !matchesItems) return false;
      }

      // Date range filter
      if (dateFrom) {
        const dFrom = new Date(dateFrom);
        dFrom.setHours(0, 0, 0, 0);
        if (new Date(t.createdAt) < dFrom) return false;
      }
      if (dateTo) {
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59, 999);
        if (new Date(t.createdAt) > dTo) return false;
      }

      // Cashier filter
      if (cashierFilter.trim()) {
        if (!t.cashierName.toLowerCase().includes(cashierFilter.toLowerCase().trim())) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'total_amount') {
        comparison = a.total - b.total;
      } else if (sortBy === 'transaction_number') {
        comparison = a.transactionNumber.localeCompare(b.transactionNumber);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    setTransactions(pageItems);
    setTotalRecords(total);
    setTotalPages(pages);
    setIsLoading(false);
  }, [searchQuery, dateFrom, dateTo, cashierFilter, currentPage, sortBy, sortOrder, userRole, isManager]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo, cashierFilter, sortBy, sortOrder]);

  const handleViewReceipt = (txn: TransactionHistoryItem) => {
    setSelectedTransaction(txn);
    setIsReceiptOpen(true);
  };

  const handleExportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (cashierFilter.trim()) params.set('cashierName', cashierFilter.trim());

      const res = await fetch(
        `http://localhost:4000/api/v1/pos/transactions/export?${params.toString()}`,
      );

      if (res.ok) {
        const csvText = await res.text();
        const blob = new Blob([csvText], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `21-7teen-mart-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback: generate CSV client-side from seed data
    }

    // Client-side CSV generation fallback
    const headers = ['Transaction #', 'Date', 'Cashier', 'Items', 'Subtotal', 'VAT 12%', 'Discount', 'Total', 'Payment'];
    const rows = transactions.map((t) => [
      t.transactionNumber,
      new Date(t.createdAt).toLocaleString('en-PH'),
      t.cashierName,
      t.lineItems.map((li) => `${li.productName} x${li.quantity}`).join('; '),
      t.subtotal.toFixed(2),
      t.tax.toFixed(2),
      t.discount.toFixed(2),
      t.total.toFixed(2),
      t.payments.map((p) => `${p.method}: ${p.amount.toFixed(2)}`).join('; '),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `21-7teen-mart-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-at-neutral text-at-accent overflow-hidden font-sans">
        {/* ═══ Panel Header ═══ */}
        <header className="shrink-0 px-6 py-4 border-b border-at-accent-light bg-at-accent text-at-neutral shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-at-primary flex items-center justify-center shadow-lg text-at-accent">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-at-neutral flex items-center gap-2">
                  Transaction History
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-at-primary text-at-accent font-bold font-mono">
                    {totalRecords} Records
                  </span>
                  {!isManager && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-at-secondary text-at-neutral font-semibold">
                      View Only (7-Day Window)
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-at-neutral/70">
                  21/7teen Mart • Philippine Retail POS • 12% VAT
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isManager && (
                <button
                  id="btn-export-csv"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-at-accent-muted hover:bg-at-accent-light border border-at-accent-light text-at-neutral text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5 text-at-primary" />
                  <span>Export CSV</span>
                </button>
              )}
              <button
                id="btn-refresh-transactions"
                onClick={fetchTransactions}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-at-accent-muted hover:bg-at-accent-light border border-at-accent-light text-at-neutral text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-at-primary' : ''}`} />
                <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
              </button>
              <button
                id="btn-close-history"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-at-secondary hover:opacity-90 text-at-neutral text-xs font-bold transition shadow-sm"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* RBAC Notice for Cashiers */}
          {!isManager && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-at-accent-muted border border-at-accent-light text-at-neutral text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-at-primary" />
              <span>
                Cashier Access: View-only mode. You can view recent transactions and reprint receipts.
                Deleting, modifying, or exporting data requires Manager privileges.
              </span>
            </div>
          )}

          {/* ═══ Search & Filter Bar ═══ */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search by Transaction ID */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-at-accent/60" />
              <input
                id="input-search-txn"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Transaction ID..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-at-neutral-dark border border-at-neutral-muted text-xs text-at-accent placeholder-at-accent/50 focus:outline-none focus:border-at-primary transition"
              />
            </div>

            {/* Date From */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-at-accent/60" />
              <input
                id="input-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-at-neutral-dark border border-at-neutral-muted text-xs text-at-accent focus:outline-none focus:border-at-primary transition"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-at-accent/60" />
              <input
                id="input-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-at-neutral-dark border border-at-neutral-muted text-xs text-at-accent focus:outline-none focus:border-at-primary transition"
              />
            </div>

            {/* Cashier Name Filter */}
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-at-accent/60" />
              <input
                id="input-cashier-filter"
                type="text"
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                placeholder="Cashier Name..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-at-neutral-dark border border-at-neutral-muted text-xs text-at-accent placeholder-at-accent/50 focus:outline-none focus:border-at-primary transition"
              />
            </div>
          </div>
        </header>

        {/* ═══ Transaction Table ═══ */}
        <main className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-at-neutral-dark text-at-accent uppercase text-[10px] tracking-wider border-b border-at-neutral-muted sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-bold">
                    <button
                      onClick={() => toggleSort('transaction_number')}
                      className="flex items-center gap-1 hover:text-at-secondary transition"
                    >
                      Transaction #
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-bold">
                    <button
                      onClick={() => toggleSort('created_at')}
                      className="flex items-center gap-1 hover:text-at-secondary transition"
                    >
                      Date & Time
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-bold">Cashier</th>
                  <th className="py-3 px-4 font-bold text-center">Items</th>
                  <th className="py-3 px-4 font-bold text-right">Subtotal</th>
                  <th className="py-3 px-4 font-bold text-right">VAT 12%</th>
                  <th className="py-3 px-4 font-bold text-right">
                    <button
                      onClick={() => toggleSort('total_amount')}
                      className="flex items-center gap-1 hover:text-at-secondary transition ml-auto"
                    >
                      Total (₱)
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-bold text-center">Payment</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-at-neutral-muted/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-6 h-6 text-at-secondary animate-spin" />
                        <span className="text-sm font-semibold text-at-accent">Loading transaction history...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-at-neutral-dark border border-at-neutral-muted flex items-center justify-center">
                          <FileText className="w-7 h-7 text-at-secondary" />
                        </div>
                        <span className="text-sm font-bold text-at-accent">No transactions found</span>
                        <span className="text-xs text-at-accent/70 max-w-xs">
                          Try adjusting your search filters or date range. Completed transactions will appear here.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const txnDate = new Date(txn.createdAt);
                    const itemCount = txn.lineItems.reduce((sum, li) => sum + li.quantity, 0);
                    const paymentMethod = txn.payments[0]?.method || 'cash';

                    return (
                      <tr
                        key={txn.id}
                        className="hover:bg-at-neutral-dark/80 transition group"
                      >
                        {/* Transaction Number */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-at-accent text-[11px]">
                            {txn.transactionNumber}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4">
                          <div className="text-at-accent font-medium">
                            {txnDate.toLocaleDateString('en-PH', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-at-accent/70 font-mono">
                            {txnDate.toLocaleTimeString('en-PH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Cashier */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-at-accent text-at-neutral flex items-center justify-center text-[10px] font-bold">
                              {txn.cashierName.charAt(0)}
                            </div>
                            <span className="text-at-accent font-semibold truncate max-w-[120px]">
                              {txn.cashierName}
                            </span>
                          </div>
                        </td>

                        {/* Item Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-at-neutral-dark border border-at-neutral-muted text-at-accent font-mono font-bold text-[11px]">
                            {itemCount}
                          </span>
                        </td>

                        {/* Subtotal */}
                        <td className="py-3.5 px-4 text-right font-mono text-at-accent">
                          {formatPhp(txn.subtotal)}
                        </td>

                        {/* VAT */}
                        <td className="py-3.5 px-4 text-right font-mono text-at-accent/80 font-medium">
                          {formatPhp(txn.tax)}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-at-accent">
                          {formatPhp(txn.total)}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-at-accent text-at-neutral border border-at-accent-light">
                            {paymentMethod === 'digital_wallet'
                              ? 'GCash/Maya'
                              : paymentMethod.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-at-neutral-dark border border-at-neutral-muted text-at-accent">
                            {txn.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-view-receipt-${txn.id}`}
                              onClick={() => handleViewReceipt(txn)}
                              title="View / Print Receipt"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-at-accent hover:bg-at-accent-light text-at-neutral text-[11px] font-semibold transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleViewReceipt(txn)}
                              title="Reprint Receipt"
                              className="p-1.5 rounded-lg hover:bg-at-neutral-dark text-at-accent/70 hover:text-at-accent transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* ═══ Pagination Footer ═══ */}
        <footer className="shrink-0 px-6 py-3 border-t border-at-accent-light bg-at-accent text-at-neutral flex items-center justify-between text-xs">
          <div>
            Showing {transactions.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
            {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of {totalRecords} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-prev-page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-at-accent-muted hover:bg-at-accent-light border border-at-accent-light text-at-neutral font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-at-primary text-at-accent font-mono font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              id="btn-next-page"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-at-accent-muted hover:bg-at-accent-light border border-at-accent-light text-at-neutral font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>

      {/* Receipt Modal Overlay */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        transaction={selectedTransaction}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </>
  );
};
