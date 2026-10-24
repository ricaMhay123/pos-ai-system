import React from 'react';
import { PackageSearch, RefreshCw } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { ProductWithStock } from '@pos-ai/shared-types';

interface ProductCatalogGridProps {
  products: ProductWithStock[];
  onAddToCart: (product: ProductWithStock) => void;
  isLoading?: boolean;
}

export const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  products,
  onAddToCart,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-at-accent/70">
        <RefreshCw className="w-8 h-8 animate-spin text-at-secondary mb-3" />
        <p className="text-sm font-medium text-at-accent">Loading catalog items...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-at-accent/70">
        <div className="w-14 h-14 rounded-2xl bg-at-neutral-dark border border-at-neutral-muted flex items-center justify-center mb-3 shadow-sm">
          <PackageSearch className="w-7 h-7 text-at-secondary" />
        </div>
        <h4 className="text-sm font-semibold text-at-accent">No matching products found</h4>
        <p className="text-xs text-at-accent/70 max-w-xs mt-1">
          Try scanning another barcode or modifying your search filter keywords.
        </p>
      </div>
    );
  }

  return (
    <div
      id="pos-product-grid"
      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-1 pb-4"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};
