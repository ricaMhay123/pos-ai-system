import React, { useState, useEffect, useMemo } from 'react';
import { PosHeader } from './PosHeader';
import { BarcodeScannerBar } from './BarcodeScannerBar';
import { CategoryPills, CategoryOption } from './CategoryPills';
import { ProductCatalogGrid } from './ProductCatalogGrid';
import { CartTicket } from './CartTicket';
import { PaymentPadModal } from './PaymentPadModal';
import { TransactionHistoryPanel } from './TransactionHistoryPanel';
import { PostPaymentReceiptModal, PostPaymentReceiptData } from './PostPaymentReceiptModal';
import { PosCartLineItem } from './CartItemRow';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { calculatePhTicketTotals, formatPhp } from '../../utils/formatters';
import type { ProductWithStock, PaymentMethod, TransactionHistoryItem } from '@pos-ai/shared-types';

// ─── Module-level transaction store for real-time history sync ─────────────
// This lives outside the component so it persists across re-renders and is
// immediately visible when the Transaction History panel opens.
let _transactionStore: TransactionHistoryItem[] = [];

export function getTransactionStore(): TransactionHistoryItem[] {
  return _transactionStore;
}

export function prependTransaction(txn: TransactionHistoryItem): void {
  _transactionStore = [txn, ..._transactionStore];
}

// ─── Props ─────────────────────────────────────────────────────────────────
interface PosCheckoutShellProps {
  initialProducts: ProductWithStock[];
  storeName?: string;
  terminalCode?: string;
  cashierName?: string;
  cashierRole?: string;
  userRole?: 'cashier' | 'store_manager' | 'admin';
  onToggleAiDashboard?: () => void;
  onLockTerminal?: () => void;
  pendingRecommendationsCount?: number;
}

export const PosCheckoutShell: React.FC<PosCheckoutShellProps> = ({
  initialProducts,
  storeName = 'Meme Mart - Flagship BGC Terminal - Taguig',
  terminalCode = 'POS-BGC-01',
  cashierName = 'Juan Dela Cruz',
  cashierRole = 'Cashier (EMP-CSH-003)',
  userRole = 'cashier',
  onToggleAiDashboard,
  onLockTerminal,
  pendingRecommendationsCount = 0,
}) => {
  const [products, setProducts] = useState<ProductWithStock[]>(initialProducts);
  const [cartItems, setCartItems] = useState<PosCartLineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isSeniorOrPwd, setIsSeniorOrPwd] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  // ─── Post-payment receipt state ──────────────────────────────────────────
  const [receiptData, setReceiptData] = useState<PostPaymentReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // ─── Categories derived from product list ────────────────────────────────
  const categoryOptions: CategoryOption[] = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.categoryName || 'Other';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    const opts: CategoryOption[] = [{ id: 'all', name: 'All Items', count: products.length }];
    map.forEach((count, name) => { opts.push({ id: name, name, count }); });
    return opts;
  }, [products]);

  // ─── Filter products by category and search/barcode ─────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));
      const matchesCat = selectedCategoryId === 'all' || p.categoryName === selectedCategoryId;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // ─── Philippine ticket calculations ──────────────────────────────────────
  const calculation = useMemo(() => {
    return calculatePhTicketTotals(
      cartItems.map((i) => ({
        unitPrice: i.product.retailPrice,
        quantity: i.quantity,
        isVatable: i.product.taxRate > 0,
      })),
      isSeniorOrPwd,
    );
  }, [cartItems, isSeniorOrPwd]);

  // ─── Cart Handlers ────────────────────────────────────────────────────────
  const handleAddToCart = (product: ProductWithStock) => {
    if (product.stockOnHand <= 0) {
      showFeedback('warning', `${product.name} is out of stock!`);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockOnHand) {
          showFeedback('warning', `Maximum stock (${product.stockOnHand}) reached for ${product.name}`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stockOnHand) {
              showFeedback('warning', `Available inventory is ${item.product.stockOnHand}`);
              return item;
            }
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as PosCartLineItem[],
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setIsSeniorOrPwd(false);
    showFeedback('info', 'Ticket cleared');
  };

  // ─── Barcode Scanning Handler ─────────────────────────────────────────────
  const handleBarcodeScan = (barcode: string) => {
    const found = products.find(
      (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase(),
    );
    if (found) {
      handleAddToCart(found);
      setSearchQuery('');
      showFeedback('success', `Scanned: ${found.name} (${formatPhp(found.retailPrice)})`);
    } else {
      showFeedback('warning', `Barcode or SKU "${barcode}" not found in Philippine master catalog`);
    }
  };

  // ─── Payment Confirmation ─────────────────────────────────────────────────
  const handleConfirmPayment = (method: PaymentMethod, amountTendered: number) => {
    setIsProcessingPayment(true);

    // Snapshot cart and totals before clearing
    const snapshotCart = [...cartItems];
    const snapshotCalc = { ...calculation };
    const snapshotSenior = isSeniorOrPwd;

    setTimeout(() => {
      const now = new Date().toISOString();
      const txnNumber = `TXN-PH-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const changeDue = method === 'cash'
        ? Math.max(0, amountTendered - snapshotCalc.totalAmountDue)
        : 0;

      // ── Build the PostPaymentReceiptData ───────────────────────────────
      const lineItems = snapshotCart.map((item) => ({
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.retailPrice,
        totalPrice: +(item.product.retailPrice * item.quantity).toFixed(2),
        taxRate: item.product.taxRate,
      }));

      const newReceipt: PostPaymentReceiptData = {
        transactionNumber: txnNumber,
        createdAt: now,
        cashierName,
        storeName,
        terminalCode,
        lineItems,
        grossSubtotal: snapshotCalc.grossSubtotal,
        vatAmount: snapshotCalc.vatAmount,
        discountAmount: snapshotCalc.discountAmount,
        totalAmountDue: snapshotCalc.totalAmountDue,
        paymentMethod: method,
        amountTendered,
        changeDue,
        isSeniorOrPwd: snapshotSenior,
      };

      // ── Build TransactionHistoryItem for real-time history sync ────────
      const historyItem: TransactionHistoryItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
        transactionNumber: txnNumber,
        status: 'completed',
        subtotal: snapshotCalc.grossSubtotal,
        tax: snapshotCalc.vatAmount,
        discount: snapshotCalc.discountAmount,
        total: snapshotCalc.totalAmountDue,
        cashierName,
        cashierId: 'local-cashier',
        storeName,
        storeId: 'local-store',
        lineItems: lineItems.map((li) => ({
          productName: li.productName,
          sku: li.sku,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
          taxRate: li.taxRate,
          discountAmount: 0,
        })),
        payments: [{ method, amount: amountTendered, status: 'captured' }],
        createdAt: now,
      };

      // ── Persist to module-level store (real-time history) ─────────────
      prependTransaction(historyItem);

      // ── Also attempt to POST to API Gateway ──────────────────────────
      fetch('http://localhost:4000/api/v1/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyItem),
      }).catch(() => {/* silently ignore – API offline */});

      // ── Deduct inventory locally ───────────────────────────────────────
      setProducts((prev) =>
        prev.map((prod) => {
          const inCart = snapshotCart.find((c) => c.product.id === prod.id);
          if (inCart) {
            const newOnHand = Math.max(0, prod.stockOnHand - inCart.quantity);
            return { ...prod, stockOnHand: newOnHand, stockAvailable: newOnHand };
          }
          return prod;
        }),
      );

      // ── Clear cart and close payment modal ────────────────────────────
      setIsProcessingPayment(false);
      setIsPaymentOpen(false);
      setCartItems([]);
      setIsSeniorOrPwd(false);

      // ── Open post-payment receipt modal ───────────────────────────────
      setReceiptData(newReceipt);
      setIsReceiptOpen(true);
    }, 700);
  };

  // ─── Receipt dismiss: immediately ready for next customer ─────────────────
  const handleReceiptSkip = () => {
    setIsReceiptOpen(false);
    setReceiptData(null);
    showFeedback('success', 'Cart cleared — ready for next customer!');
  };

  const handleReceiptPrint = () => {
    // Print is triggered inside modal via window.open; we just close after a delay
    setTimeout(() => {
      setIsReceiptOpen(false);
      setReceiptData(null);
      showFeedback('success', 'Receipt sent to printer — ready for next customer!');
    }, 800);
  };

  const showFeedback = (type: 'success' | 'warning' | 'info', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // ─── Global Keyboard Shortcuts (F4 to pay) ───────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' && cartItems.length > 0 && !isPaymentOpen) {
        e.preventDefault();
        setIsPaymentOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, isPaymentOpen]);

  // ─── Transaction History view ─────────────────────────────────────────────
  if (showTransactionHistory) {
    return (
      <div
        id="pos-checkout-shell"
        className="flex flex-col h-screen overflow-hidden"
        style={{ backgroundColor: 'var(--at-neutral)', color: 'var(--at-text-on-neutral)' }}
      >
        <TransactionHistoryPanel
          userRole={userRole}
          onClose={() => setShowTransactionHistory(false)}
        />
      </div>
    );
  }

  return (
    <div
      id="pos-checkout-shell"
      className="flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--at-neutral)', color: 'var(--at-text-on-neutral)' }}
    >
      {/* 1. Top Header */}
      <PosHeader
        storeName={storeName}
        terminalCode={terminalCode}
        cashierName={cashierName}
        cashierRole={cashierRole}
        isOnline={true}
        onLockTerminal={onLockTerminal || (() => showFeedback('info', 'Register Terminal locked'))}
        onToggleAiDashboard={onToggleAiDashboard}
        onToggleTransactionHistory={() => setShowTransactionHistory(true)}
        pendingRecommendationsCount={pendingRecommendationsCount}
      />

      {/* Feedback Notification Toast — Amber Twilight */}
      {feedbackMessage && (
        <div
          id="pos-feedback-toast"
          className="absolute top-20 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-semibold backdrop-blur animate-in slide-in-from-top-2 duration-200"
          style={{
            /* success  → Accent bg, Neutral text
               warning  → Secondary bg, Neutral text (WCAG safe)
               info     → Primary bg, Accent text (CRITICAL: no white on amber!) */
            backgroundColor:
              feedbackMessage.type === 'success'
                ? 'var(--at-accent)'
                : feedbackMessage.type === 'warning'
                ? 'var(--at-secondary)'
                : 'var(--at-primary)',
            color:
              feedbackMessage.type === 'info'
                ? 'var(--at-text-on-primary)'   // dark accent on amber
                : 'var(--at-text-on-accent)',    // neutral cream on dark
            borderColor:
              feedbackMessage.type === 'success'
                ? 'var(--at-accent-light)'
                : feedbackMessage.type === 'warning'
                ? 'rgba(184,84,63,0.5)'
                : 'var(--at-primary-muted)',
          }}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--at-primary)' }} />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 2. Main Body Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Scanner + Category Filters + Catalog Grid */}
        <section
          id="pos-catalog-section"
          className="flex-1 flex flex-col p-6 overflow-hidden border-r"
          style={{ borderColor: 'var(--at-neutral-muted)' }}
        >
          <div className="mb-4">
            <BarcodeScannerBar
              value={searchQuery}
              onChange={setSearchQuery}
              onBarcodeScan={handleBarcodeScan}
              placeholder="Scan Philippine EAN-13 barcode (e.g. 480001660101) or search product..."
            />
          </div>
          <div className="mb-4">
            <CategoryPills
              categories={categoryOptions}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <ProductCatalogGrid
              products={filteredProducts}
              onAddToCart={handleAddToCart}
            />
          </div>
        </section>

        {/* Right: Cart Ticket & Totals */}
        <CartTicket
          items={cartItems}
          ticketNumber="TICK-PH-001"
          isSeniorOrPwd={isSeniorOrPwd}
          onToggleSeniorPwd={() => setIsSeniorOrPwd((prev) => !prev)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onProceedToPayment={() => setIsPaymentOpen(true)}
          allProducts={products}
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* 3. Payment Pad Modal */}
      <PaymentPadModal
        isOpen={isPaymentOpen}
        totalAmount={calculation.totalAmountDue}
        onClose={() => setIsPaymentOpen(false)}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingPayment}
      />

      {/* 4. Post-Payment Meme Mart Receipt Modal */}
      <PostPaymentReceiptModal
        isOpen={isReceiptOpen}
        receipt={receiptData}
        onPrint={handleReceiptPrint}
        onSkip={handleReceiptSkip}
      />
    </div>
  );
};
