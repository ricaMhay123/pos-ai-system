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
      className="group relative p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-700 transition flex items-center justify-between gap-3 select-none"
    >
      {/* Product Title and Unit Pricing */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400">{item.product.sku}</span>
          <span className="text-[10px] text-slate-500 font-mono">
            {formatPhp(item.product.retailPrice)}/ea
          </span>
        </div>
        <div className="font-medium text-xs text-slate-100 truncate mt-0.5">
          {item.product.name}
        </div>
        {lineDiscount > 0 && (
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
            -{formatPhp(lineDiscount)} discount applied
          </div>
        )}
      </div>

      {/* Quantity Stepper & Total */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
          <button
            id={`btn-qty-minus-${item.product.sku}`}
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, -1)}
            aria-label="Decrease quantity"
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span
            id={`qty-val-${item.product.sku}`}
            className="w-7 text-center font-mono font-bold text-xs text-white"
          >
            {item.quantity}
          </span>
          <button
            id={`btn-qty-plus-${item.product.sku}`}
            type="button"
            onClick={() => onUpdateQuantity(item.product.id, 1)}
            aria-label="Increase quantity"
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Line Total */}
        <div className="w-20 text-right">
          <span className="font-mono font-bold text-xs text-white">
            {formatPhp(lineTotal)}
          </span>
        </div>

        {/* Trash button */}
        <button
          id={`btn-remove-${item.product.sku}`}
          type="button"
          onClick={() => onRemoveItem(item.product.id)}
          aria-label="Remove item"
          className="text-slate-500 hover:text-rose-400 p-1 rounded transition opacity-50 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
