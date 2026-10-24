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
    storeName: 'Meme Mart - Flagship BGC',
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
    cashierId: '20000000-0000-0000-0000-000000000010',
    storeName: 'Meme Mart - Flagship BGC',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Thai Jasmine Rice 5kg', sku: 'RIC-JAS-5KG', quantity: 2, unitPrice: 475.00, totalPrice: 950.00, taxRate: 0, discountAmount: 0 },
      { productName: 'Bear Brand Fortified Milk 900g', sku: 'BEV-BRB-POW', quantity: 1, unitPrice: 319.00, totalPrice: 319.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'digital_wallet', amount: 1245.00, status: 'captured' }],
    createdAt: '2026-10-24T11:45:30.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000103',
    transactionNumber: 'TXN-PH-20261023-7742',
    status: 'completed',
    subtotal: 456.75,
    tax: 48.94,
    discount: 0,
    total: 456.75,
    cashierName: 'Juan Dela Cruz',
    cashierId: '20000000-0000-0000-0000-000000000011',
    storeName: 'Meme Mart - Flagship BGC',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'SPAM Luncheon Meat Classic 340g', sku: 'CAN-SPM-LUN', quantity: 1, unitPrice: 235.00, totalPrice: 235.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Safeguard Soap Ivory 135g', sku: 'PER-SFG-IVR', quantity: 2, unitPrice: 48.00, totalPrice: 96.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Oishi Prawn Crackers 90g', sku: 'SNK-OSH-PRN', quantity: 2, unitPrice: 22.00, totalPrice: 44.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'San Miguel Pale Pilsen 330ml', sku: 'BEV-SMP-330', quantity: 1, unitPrice: 58.00, totalPrice: 58.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'cash', amount: 500.00, status: 'captured' }],
    createdAt: '2026-10-23T14:10:22.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000104',
    transactionNumber: 'TXN-PH-20261023-1283',
    status: 'completed',
    subtotal: 668.50,
    tax: 0,
    discount: 119.38,
    total: 477.59,
    cashierName: 'Maria Santos',
    cashierId: '20000000-0000-0000-0000-000000000010',
    storeName: 'Meme Mart - Flagship BGC',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Dinorado Jasmine Rice 5kg', sku: 'RIC-JAS-002', quantity: 1, unitPrice: 345.00, totalPrice: 345.00, taxRate: 0, discountAmount: 0 },
      { productName: 'Piattos Cheese 85g', sku: 'SNK-PIA-CHS', quantity: 3, unitPrice: 38.50, totalPrice: 115.50, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Nescafe Classic 3-in-1 10s', sku: 'BEV-NSC-3N1', quantity: 2, unitPrice: 95.00, totalPrice: 190.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'cash', amount: 500.00, status: 'captured' }],
    createdAt: '2026-10-23T09:32:14.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000105',
    transactionNumber: 'TXN-PH-20261022-9914',
    status: 'completed',
    subtotal: 1890.00,
    tax: 202.50,
    discount: 0,
    total: 1890.00,
    cashierName: 'Juan Dela Cruz',
    cashierId: '20000000-0000-0000-0000-000000000011',
    storeName: 'Meme Mart - Flagship BGC',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Sinandomeng Special Rice 5kg', sku: 'RIC-SIN-001', quantity: 3, unitPrice: 285.00, totalPrice: 855.00, taxRate: 0, discountAmount: 0 },
      { productName: 'Century Tuna Flakes in Oil 180g', sku: 'CAN-TUN-004', quantity: 6, unitPrice: 46.50, totalPrice: 279.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Purefoods Corned Beef 210g', sku: 'CAN-CRN-005', quantity: 4, unitPrice: 97.50, totalPrice: 390.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Bear Brand Fortified Milk 900g', sku: 'BEV-BRB-POW', quantity: 1, unitPrice: 319.00, totalPrice: 319.00, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'cash', amount: 2000.00, status: 'captured' }],
    createdAt: '2026-10-22T16:55:41.000Z',
  },
  {
    id: '70000000-0000-0000-0000-000000000106',
    transactionNumber: 'TXN-PH-20261022-5567',
    status: 'completed',
    subtotal: 337.00,
    tax: 36.11,
    discount: 0,
    total: 337.00,
    cashierName: 'Juan Dela Cruz',
    cashierId: '20000000-0000-0000-0000-000000000011',
    storeName: 'Meme Mart - Flagship BGC',
    storeId: '10000000-0000-0000-0000-000000000001',
    lineItems: [
      { productName: 'Kopiko Blanca 10s', sku: 'BEV-KOP-BLC', quantity: 2, unitPrice: 85.00, totalPrice: 170.00, taxRate: 0.12, discountAmount: 0 },
      { productName: 'Colgate Triple Action 150g', sku: 'PER-CLG-150', quantity: 1, unitPrice: 134.00, totalPrice: 134.00, taxRate: 0.12, discountAmount: 0 },
      { productName: '3-in-1 Coffee Sachet', sku: 'BEV-3N1-SAC', quantity: 3, unitPrice: 9.50, totalPrice: 28.50, taxRate: 0.12, discountAmount: 0 },
    ],
    payments: [{ method: 'digital_wallet', amount: 337.00, status: 'captured' }],
    createdAt: '2026-10-22T08:12:09.000Z',
  },
];

export const TransactionHistoryPanel: React.FC<TransactionHistoryPanelProps> = ({
  userRole,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Search & filter state
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
  const ITEMS_PER_PAGE = 10;

  /**
   * Fetch transactions from API Gateway, falling back to seed data.
   */
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (cashierFilter.trim()) params.set('cashierName', cashierFilter.trim());
      params.set('page', String(currentPage));
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(
        `http://localhost:4000/api/v1/pos/transactions?${params.toString()}`,
      );

      if (res.ok) {
        const data: TransactionHistoryResponse = await res.json();
        if (data.items && data.items.length > 0) {
          setTransactions(data.items);
          setTotalRecords(data.total);
          setTotalPages(data.totalPages);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // API not available, use local seed data
    }

    // Fallback to local seed data merged with any transactions completed this session
    const sessionTxns = getTransactionStore();
    let filtered = [...sessionTxns, ...SEED_TRANSACTIONS];

    // Cashier only sees recent 7 days
    if (userRole === 'cashier') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((t) => new Date(t.createdAt) >= sevenDaysAgo);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transactionNumber.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q),
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.createdAt) >= new Date(dateFrom),
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      filtered = filtered.filter((t) => new Date(t.createdAt) <= toDate);
    }

    if (cashierFilter.trim()) {
      const cf = cashierFilter.trim().toLowerCase();
      filtered = filtered.filter((t) =>
        t.cashierName.toLowerCase().includes(cf),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'created_at') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'total_amount') {
        cmp = a.total - b.total;
      } else if (sortBy === 'transaction_number') {
        cmp = a.transactionNumber.localeCompare(b.transactionNumber);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    setTransactions(pageItems);
    setTotalRecords(total);
    setTotalPages(pages);
    setIsLoading(false);
  }, [searchQuery, dateFrom, dateTo, cashierFilter, currentPage, sortBy, sortOrder, userRole]);

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
        a.download = `meme-mart-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
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
    a.download = `meme-mart-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
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
      <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
        {/* ═══ Panel Header ═══ */}
        <header className="shrink-0 px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Transaction History
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                    {totalRecords} Records
                  </span>
                  {!isManager && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      View Only (7-Day Window)
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Meme Mart • Philippine Retail POS • 12% VAT
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isManager && (
                <button
                  id="btn-export-csv"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
              <button
                id="btn-refresh-transactions"
                onClick={fetchTransactions}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
              </button>
              <button
                id="btn-close-history"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* RBAC Notice for Cashiers */}
          {!isManager && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-300 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
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
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-search-txn"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Transaction ID..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Date From */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition [color-scheme:dark]"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition [color-scheme:dark]"
              />
            </div>

            {/* Cashier Name Filter */}
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-cashier-filter"
                type="text"
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                placeholder="Cashier Name..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </header>

        {/* ═══ Transaction Table ═══ */}
        <main className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-semibold">
                    <button
                      onClick={() => toggleSort('transaction_number')}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      Transaction #
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    <button
                      onClick={() => toggleSort('created_at')}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      Date & Time
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold">Cashier</th>
                  <th className="py-3 px-4 font-semibold text-center">Items</th>
                  <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                  <th className="py-3 px-4 font-semibold text-right">VAT 12%</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    <button
                      onClick={() => toggleSort('total_amount')}
                      className="flex items-center gap-1 hover:text-white transition ml-auto"
                    >
                      Total (₱)
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">Payment</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                        <span className="text-sm text-slate-400">Loading transaction history...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center">
                          <FileText className="w-7 h-7 text-slate-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-300">No transactions found</span>
                        <span className="text-xs text-slate-500 max-w-xs">
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
                        className="hover:bg-slate-800/30 transition group"
                      >
                        {/* Transaction Number */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-indigo-400 text-[11px]">
                            {txn.transactionNumber}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200">
                            {txnDate.toLocaleDateString('en-PH', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {txnDate.toLocaleTimeString('en-PH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Cashier */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                              {txn.cashierName.charAt(0)}
                            </div>
                            <span className="text-slate-200 font-medium truncate max-w-[120px]">
                              {txn.cashierName}
                            </span>
                          </div>
                        </td>

                        {/* Item Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[11px]">
                            {itemCount}
                          </span>
                        </td>

                        {/* Subtotal */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {formatPhp(txn.subtotal)}
                        </td>

                        {/* VAT */}
                        <td className="py-3.5 px-4 text-right font-mono text-amber-400/80">
                          {formatPhp(txn.tax)}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatPhp(txn.total)}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                              paymentMethod === 'cash'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : paymentMethod === 'digital_wallet'
                                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}
                          >
                            {paymentMethod === 'digital_wallet'
                              ? 'GCash/Maya'
                              : paymentMethod.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold transition"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleViewReceipt(txn)}
                              title="Reprint Receipt"
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition"
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
        <footer className="shrink-0 px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {transactions.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
            {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of {totalRecords} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-prev-page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-200 font-bold">
              {currentPage} / {totalPages}
            </span>
            <button
              id="btn-next-page"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
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
