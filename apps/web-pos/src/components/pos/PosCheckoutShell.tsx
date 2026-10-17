import React, { useState, useEffect, useMemo } from 'react';
import { PosHeader } from './PosHeader';
import { BarcodeScannerBar } from './BarcodeScannerBar';
import { CategoryPills, CategoryOption } from './CategoryPills';
import { ProductCatalogGrid } from './ProductCatalogGrid';
import { CartTicket } from './CartTicket';
import { PaymentPadModal } from './PaymentPadModal';
import { PosCartLineItem } from './CartItemRow';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { calculatePhTicketTotals, formatPhp } from '../../utils/formatters';
import type { ProductWithStock, PaymentMethod } from '@pos-ai/shared-types';

interface PosCheckoutShellProps {
  initialProducts: ProductWithStock[];
  storeName?: string;
  terminalCode?: string;
  cashierName?: string;
  onToggleAiDashboard?: () => void;
  pendingRecommendationsCount?: number;
}

export const PosCheckoutShell: React.FC<PosCheckoutShellProps> = ({
  initialProducts,
  storeName = 'Flagship BGC Terminal - Taguig',
  terminalCode = 'POS-BGC-01',
  cashierName = 'Juan Dela Cruz',
  onToggleAiDashboard,
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

  // Derive categories from product list
  const categoryOptions: CategoryOption[] = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.categoryName || 'Other';
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    const opts: CategoryOption[] = [{ id: 'all', name: 'All Items', count: products.length }];
    map.forEach((count, name) => {
      opts.push({ id: name, name, count });
    });
    return opts;
  }, [products]);

  // Filter products by category and search/barcode query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));

      const matchesCat =
        selectedCategoryId === 'all' || p.categoryName === selectedCategoryId;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Philippine Ticket Calculations (Gross, 12% VAT, Senior/PWD 20% discount, Net Total)
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

  // Cart Handlers
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

  // Barcode Scanning Handler
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

  // Checkout Payment Confirmation
  const handleConfirmPayment = (method: PaymentMethod, amountTendered: number) => {
    setIsProcessingPayment(true);

    setTimeout(() => {
      const txnNumber = `TXN-PH-${Math.floor(100000 + Math.random() * 900000)}`;

      // Deduct inventory locally
      setProducts((prev) =>
        prev.map((prod) => {
          const inCart = cartItems.find((c) => c.product.id === prod.id);
          if (inCart) {
            const newOnHand = Math.max(0, prod.stockOnHand - inCart.quantity);
            return {
              ...prod,
              stockOnHand: newOnHand,
              stockAvailable: newOnHand,
            };
          }
          return prod;
        }),
      );

      setIsProcessingPayment(false);
      setIsPaymentOpen(false);
      setCartItems([]);
      setIsSeniorOrPwd(false);
      showFeedback(
        'success',
        `Sale ${txnNumber} authorized! Total ${formatPhp(calculation.totalAmountDue)} settled via ${method}.`,
      );
    }, 700);
  };

  const showFeedback = (type: 'success' | 'warning' | 'info', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Global Keyboard Shortcuts (F4 to pay)
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

  return (
    <div id="pos-checkout-shell" className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Low-level Top Header */}
      <PosHeader
        storeName={storeName}
        terminalCode={terminalCode}
        cashierName={cashierName}
        cashierRole="Cashier (EMP-CSH-003)"
        isOnline={true}
        onLockTerminal={() => showFeedback('info', 'Register Terminal locked')}
        onToggleAiDashboard={onToggleAiDashboard}
        pendingRecommendationsCount={pendingRecommendationsCount}
      />

      {/* Temporary Feedback Notification Toast */}
      {feedbackMessage && (
        <div
          id="pos-feedback-toast"
          className={`absolute top-20 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-semibold backdrop-blur animate-in slide-in-from-top-2 duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : feedbackMessage.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-300'
              : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 2. Main Body Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section: Scanner + Category Filters + Catalog Grid */}
        <section
          id="pos-catalog-section"
          className="flex-1 flex flex-col p-6 overflow-hidden border-r border-slate-800"
        >
          {/* Barcode Search Bar */}
          <div className="mb-4">
            <BarcodeScannerBar
              value={searchQuery}
              onChange={setSearchQuery}
              onBarcodeScan={handleBarcodeScan}
              placeholder="Scan Philippine EAN-13 barcode (e.g. 480001660101) or search product..."
            />
          </div>

          {/* Category Filter Pills */}
          <div className="mb-4">
            <CategoryPills
              categories={categoryOptions}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>

          {/* Product Catalog Grid */}
          <div className="flex-1 overflow-y-auto">
            <ProductCatalogGrid
              products={filteredProducts}
              onAddToCart={handleAddToCart}
            />
          </div>
        </section>

        {/* Right Section: Ticket & Totals with Senior Citizen / PWD Support */}
        <CartTicket
          items={cartItems}
          ticketNumber="TICK-PH-001"
          isSeniorOrPwd={isSeniorOrPwd}
          onToggleSeniorPwd={() => setIsSeniorOrPwd((prev) => !prev)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onProceedToPayment={() => setIsPaymentOpen(true)}
        />
      </div>

      {/* 3. Payment Pad Modal with GCash/Maya & Philippine Banknotes */}
      <PaymentPadModal
        isOpen={isPaymentOpen}
        totalAmount={calculation.totalAmountDue}
        onClose={() => setIsPaymentOpen(false)}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingPayment}
      />
    </div>
  );
};
