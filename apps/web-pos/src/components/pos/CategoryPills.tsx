import React from 'react';

export interface CategoryOption {
  id: string;
  name: string;
  count?: number;
}

interface CategoryPillsProps {
  categories: CategoryOption[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div
      id="pos-category-pills"
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none"
    >
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            id={`btn-cat-${cat.id}`}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
              isSelected
                ? 'bg-at-accent text-at-neutral border border-at-accent-light shadow-sm'
                : 'bg-at-neutral-dark/80 hover:bg-at-neutral-dark text-at-accent border border-at-neutral-muted'
            }`}
          >
            <span>{cat.name}</span>
            {typeof cat.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                  isSelected
                    ? 'bg-at-accent-light text-at-neutral'
                    : 'bg-at-neutral text-at-accent border border-at-neutral-muted'
                }`}
              >
                {cat.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
