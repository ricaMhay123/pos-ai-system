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
      className="w-96 lg:w-[420px] flex flex-col shrink-0 h-full min-h-0 select-none overflow-hidden border-l"
      style={{
        backgroundColor: 'var(--at-accent)',
        borderColor: 'var(--at-accent-light)',
      }}
    >
      {/* ── Ticket Header ──────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--at-accent-light)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--at-accent-muted)', color: 'var(--at-primary)' }}
          >
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-sm font-bold flex items-center gap-2 flex-wrap"
              style={{ color: 'var(--at-neutral)' }}
            >
              Current Ticket
              <span
                className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--at-accent-muted)',
                  color: 'var(--at-neutral-muted)',
                  borderColor: 'var(--at-accent-light)',
                }}
              >
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
            className="shrink-0 ml-2 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded transition"
            style={{ color: 'var(--at-secondary)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(184,84,63,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* ── Scrollable Cart Items ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3 space-y-2.5 pr-5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div
              className="w-14 h-14 rounded-2xl border flex items-center justify-center mb-3"
              style={{
                backgroundColor: 'var(--at-accent-muted)',
                borderColor: 'var(--at-accent-light)',
              }}
            >
              <PackageOpen className="w-7 h-7" style={{ color: 'var(--at-accent-light)' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--at-neutral)' }}>
              Ticket is empty
            </h3>
            <p className="text-xs max-w-[200px] mt-1 leading-relaxed" style={{ color: 'var(--at-neutral-muted)' }}>
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

      {/* ── Smart Cross-Sell (capped height) ──────────────────────── */}
      {onAddToCart && items.length > 0 && (
        <div
          className="shrink-0 px-6 py-2 max-h-[120px] overflow-hidden border-t"
          style={{ borderColor: 'var(--at-accent-light)' }}
        >
          <SmartCrossSellWidget
            cartProductIds={items.map((i) => i.product.id)}
            allProducts={allProducts}
            onAddToCart={onAddToCart}
          />
        </div>
      )}

      {/* ── Totals + Charge button (always visible) ────────────────── */}
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
