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
  const onHand = product?.stockOnHand ?? 0;
  const safety = product?.safetyStock ?? 5;
  const isOutOfStock = onHand <= 0;
  const isLowStock = !isOutOfStock && onHand <= safety;

  return (
    <div
      id={`product-card-${product?.sku ?? 'item'}`}
      onClick={() => {
        if (!isOutOfStock && !disabled && product) {
          onAddToCart(product);
        }
      }}
      className="group relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 select-none"
      style={{
        backgroundColor: 'var(--at-neutral-dark)',
        borderColor: 'var(--at-neutral-muted)',
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        opacity: isOutOfStock ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isOutOfStock && !disabled) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = 'var(--at-primary)';
          el.style.backgroundColor = 'var(--at-neutral)';
          el.style.boxShadow = '0 4px 20px -4px rgba(235,160,0,0.25)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--at-neutral-muted)';
        el.style.backgroundColor = 'var(--at-neutral-dark)';
        el.style.boxShadow = 'none';
      }}
    >
      <div>
        {/* Top Badges: SKU and Stock Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="text-[11px] font-mono font-medium transition-colors"
            style={{ color: 'var(--at-accent-light)' }}
          >
            {product?.sku ?? 'SKU-N/A'}
          </span>

          {isOutOfStock ? (
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'rgba(184,84,63,0.12)',
                color: 'var(--at-secondary)',
                borderColor: 'rgba(184,84,63,0.25)',
              }}
            >
              <PackageX className="w-3 h-3" /> Out of stock
            </span>
          ) : isLowStock ? (
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border animate-pulse"
              style={{
                /* Primary bg → CRITICAL: must use Accent (dark) text */
                backgroundColor: 'rgba(235,160,0,0.15)',
                color: 'var(--at-primary-dark)',
                borderColor: 'rgba(235,160,0,0.30)',
              }}
            >
              <AlertCircle className="w-3 h-3" /> {onHand} left
            </span>
          ) : (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'rgba(24,51,94,0.08)',
                color: 'var(--at-accent)',
                borderColor: 'var(--at-neutral-muted)',
              }}
            >
              {onHand} in stock
            </span>
          )}
        </div>

        {/* Product Title & Info */}
        <h4
          className="font-semibold text-sm line-clamp-2 leading-snug"
          style={{ color: 'var(--at-accent)' }}
        >
          {product?.name ?? 'Unnamed Product'}
        </h4>
        {product?.description && (
          <p className="text-xs line-clamp-1 mt-1 leading-normal" style={{ color: 'var(--at-accent-light)' }}>
            {product?.description}
          </p>
        )}
      </div>

      {/* Card Footer: Price & Add Action */}
      <div
        className="flex items-center justify-between mt-4 pt-3 border-t"
        style={{ borderColor: 'var(--at-neutral-muted)' }}
      >
        <div>
          <span className="text-base font-bold font-mono" style={{ color: 'var(--at-accent)' }}>
            {formatPhp(product?.retailPrice ?? 0)}
          </span>
          <span className="text-[10px] ml-1.5 font-medium" style={{ color: 'var(--at-accent-light)' }}>
            {(product?.taxRate ?? 0) > 0 ? '+12% VAT' : 'VAT-Exempt'}
          </span>
        </div>

        <button
          id={`btn-add-${product?.sku ?? 'item'}`}
          type="button"
          disabled={isOutOfStock || disabled}
          aria-label={`Add ${product?.name ?? 'item'} to cart`}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
          style={
            isOutOfStock
              ? { backgroundColor: 'var(--at-neutral-muted)', color: 'var(--at-neutral-dark)' }
              : { backgroundColor: 'rgba(235,160,0,0.15)', color: 'var(--at-primary-dark)' }
          }
          onMouseEnter={(e) => {
            if (!isOutOfStock) {
              const btn = e.currentTarget as HTMLButtonElement;
              /* Primary bg on hover → Accent dark text (WCAG critical rule) */
              btn.style.backgroundColor = 'var(--at-primary)';
              btn.style.color = 'var(--at-text-on-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOutOfStock) {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.backgroundColor = 'rgba(235,160,0,0.15)';
              btn.style.color = 'var(--at-primary-dark)';
            }
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
