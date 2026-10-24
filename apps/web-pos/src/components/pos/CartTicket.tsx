import React from 'react';
import { Trash2, Receipt, PackageOpen } from 'lucide-react';
import { CartItemRow, PosCartLineItem } from './CartItemRow';
import { CartTotals } from './CartTotals';
import { SmartCrossSellWidget } from './SmartCrossSellWidget';
import { calculatePhTicketTotals } from '../../utils/formatters';
import type { ProductWithStock } from '@pos-ai/shared-types';

interface CartTicketProps {
  items: PosCartLineItem[];
  ticketNumber?: string;
  isSeniorOrPwd: boolean;
  onToggleSeniorPwd: () => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
  allProducts?: ProductWithStock[];
  onAddToCart?: (product: ProductWithStock) => void;
}

export const CartTicket: React.FC<CartTicketProps> = ({
  items,
  ticketNumber = 'TICK-PH-001',
  isSeniorOrPwd,
  onToggleSeniorPwd,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  allProducts = [],
  onAddToCart,
}) => {
  const calculation = calculatePhTicketTotals(
    items.map((i) => ({
      unitPrice: i.product.retailPrice,
      quantity: i.quantity,
      isVatable: i.product.taxRate > 0,
    })),
    isSeniorOrPwd,
  );

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside
      id="pos-cart-panel"
      className="w-96 lg:w-[420px] flex flex-col bg-slate-900 border-l border-slate-800 shrink-0 h-full min-h-0 select-none overflow-hidden"
    >
      {/* ── Ticket Header (fixed height) ──────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              Current Ticket
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                {ticketNumber}
              </span>
            </h2>
          </div>
        </div>

        {items.length > 0 && (
          <button
            id="btn-clear-cart"
            type="button"
            onClick={onClearCart}
            title="Clear all ticket items"
            className="shrink-0 ml-2 flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* ── Scrollable Cart Items (flex-1 + min-h-0 so it shrinks) ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3 space-y-2.5 pr-5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mb-3">
              <PackageOpen className="w-7 h-7 text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">Ticket is empty</h3>
            <p className="text-xs text-slate-500 max-w-[200px] mt-1 leading-relaxed">
              Scan barcode or select Philippine retail items to begin.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={item.product.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* ── Smart Cross-Sell (capped height, will not push totals away) */}
      {onAddToCart && items.length > 0 && (
        <div className="shrink-0 px-6 py-2 max-h-[120px] overflow-hidden border-t border-slate-800/60">
          <SmartCrossSellWidget
            cartProductIds={items.map((i) => i.product.id)}
            allProducts={allProducts}
            onAddToCart={onAddToCart}
          />
        </div>
      )}

      {/* ── Totals + Charge button (always visible, never scrolled away) */}
      <div className="shrink-0 px-6 pb-5 pt-1">
        <CartTotals
          subtotal={calculation.grossSubtotal}
          tax={calculation.vatAmount}
          discount={calculation.discountAmount}
          total={calculation.totalAmountDue}
          itemCount={totalCount}
          isSeniorOrPwd={isSeniorOrPwd}
          onToggleSeniorPwd={onToggleSeniorPwd}
          onProceedToPayment={onProceedToPayment}
          disabled={items.length === 0}
        />
      </div>
    </aside>
  );
};
