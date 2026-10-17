import React from 'react';
import { Plus, AlertCircle, PackageX } from 'lucide-react';
import { formatPhp } from '../../utils/formatters';
import type { ProductWithStock } from '@pos-ai/shared-types';

interface ProductCardProps {
  product: ProductWithStock;
  onAddToCart: (product: ProductWithStock) => void;
  disabled?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  disabled = false,
}) => {
  const isOutOfStock = product.stockOnHand <= 0;
  const isLowStock = !isOutOfStock && product.stockOnHand <= product.safetyStock;

  return (
    <div
      id={`product-card-${product.sku}`}
      onClick={() => {
        if (!isOutOfStock && !disabled) {
          onAddToCart(product);
        }
      }}
      className={`group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-900/70 border transition-all duration-200 select-none ${
        isOutOfStock
          ? 'opacity-50 border-slate-800 cursor-not-allowed'
          : 'border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer active:scale-[0.98]'
      }`}
    >
      <div>
        {/* Top Badges: SKU and Stock Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-indigo-400 transition-colors">
            {product.sku}
          </span>

          {isOutOfStock ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <PackageX className="w-3 h-3" /> Out of stock
            </span>
          ) : isLowStock ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
              <AlertCircle className="w-3 h-3" /> {product.stockOnHand} left
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-emerald-400 border border-slate-700">
              {product.stockOnHand} in stock
            </span>
          )}
        </div>

        {/* Product Title & Info */}
        <h4 className="font-semibold text-sm text-slate-100 group-hover:text-white line-clamp-2 leading-snug">
          {product.name}
        </h4>
        {product.description && (
          <p className="text-xs text-slate-400 line-clamp-1 mt-1 leading-normal">
            {product.description}
          </p>
        )}
      </div>

      {/* Card Footer: Price & Add Action */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
        <div>
          <span className="text-base font-bold text-white font-mono">
            {formatPhp(product.retailPrice)}
          </span>
          <span className="text-[10px] text-slate-500 ml-1.5 font-medium">
            {product.taxRate > 0 ? '+12% VAT' : 'VAT-Exempt'}
          </span>
        </div>

        <button
          id={`btn-add-${product.sku}`}
          type="button"
          disabled={isOutOfStock || disabled}
          aria-label={`Add ${product.name} to cart`}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 ${
            isOutOfStock
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600/15 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-600/30'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
