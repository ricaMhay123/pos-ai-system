import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatPhp } from '../../utils/formatters';
import type { ProductWithStock } from '@pos-ai/shared-types';

export interface PosCartLineItem {
  product: ProductWithStock;
  quantity: number;
  discountAmount?: number;
}

interface CartItemRowProps {
  item: PosCartLineItem;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const lineSubtotal = item.product.retailPrice * item.quantity;
  const lineDiscount = item.discountAmount || 0;
  const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

  return (
    <div
      id={`cart-row-${item.product.sku}`}
      className="group relative p-3 rounded-xl border transition flex items-center justify-between gap-3 select-none"
      style={{
        backgroundColor: 'var(--at-accent-muted)',
        borderColor: 'var(--at-accent-light)',
      }}
    >
      {/* Product Title and Unit Pricing */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: 'var(--at-neutral-muted)' }}>
            {item.product.sku}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--at-primary)' }}>
            {formatPhp(item.product.retailPrice)}/ea
          </span>
        </div>
        <div className="font-medium text-xs truncate mt-0.5" style={{ color: 'var(--at-neutral)' }}>
          {item.product.name}
        </div>
        {lineDiscount > 0 && (
          <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--at-primary)' }}>
            -{formatPhp(lineDiscount)} discount applied
          </div>
        )}
      </div>

      {/* Quantity Stepper & Total */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex items-center rounded-lg p-0.5 border"
          style={{
            backgroundColor: 'var(--at-accent)',
            borderColor: 'var(--at-accent-light)',
          }}
        >
          <button
            id={`btn-qty-minus-${item.product.sku}`}
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, -1)}
            aria-label="Decrease quantity"
            className="w-6 h-6 rounded flex items-center justify-center transition"
            style={{ color: 'var(--at-neutral-muted)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--at-secondary)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--at-neutral-muted)')}
          >
            <Minus className="w-3 h-3" />
          </button>
          <span
            id={`qty-val-${item.product.sku}`}
            className="w-7 text-center font-mono font-bold text-xs"
            style={{ color: 'var(--at-neutral)' }}
          >
            {item.quantity}
          </span>
          <button
            id={`btn-qty-plus-${item.product.sku}`}
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, 1)}
            aria-label="Increase quantity"
            className="w-6 h-6 rounded flex items-center justify-center transition"
            style={{ color: 'var(--at-neutral-muted)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--at-primary)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--at-neutral-muted)')}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Line Total */}
        <div className="w-20 text-right">
          <span className="font-mono font-bold text-xs" style={{ color: 'var(--at-neutral)' }}>
            {formatPhp(lineTotal)}
          </span>
        </div>

        {/* Trash button */}
        <button
          id={`btn-remove-${item.product.sku}`}
          type="button"
          onClick={() => onRemoveItem(item.product.id)}
          aria-label="Remove item"
          className="p-1 rounded transition opacity-50 group-hover:opacity-100"
          style={{ color: 'var(--at-neutral-muted)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--at-secondary)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--at-neutral-muted)')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
