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
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading catalog items...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
          <PackageSearch className="w-7 h-7 text-slate-600" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">No matching products found</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
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
