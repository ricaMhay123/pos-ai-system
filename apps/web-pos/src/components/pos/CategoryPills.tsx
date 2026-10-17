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
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>{cat.name}</span>
            {typeof cat.count === 'number' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-indigo-500/40 text-indigo-100' : 'bg-slate-800 text-slate-500'
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
