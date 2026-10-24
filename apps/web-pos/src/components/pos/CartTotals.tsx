import React from 'react';
import { CreditCard, Tag, UserCheck } from 'lucide-react';
import { formatPhp } from '../../utils/formatters';

interface CartTotalsProps {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  isSeniorOrPwd: boolean;
  onToggleSeniorPwd: () => void;
  onProceedToPayment: () => void;
  disabled?: boolean;
}

export const CartTotals: React.FC<CartTotalsProps> = ({
  subtotal,
  tax,
  discount,
  total,
  itemCount,
  isSeniorOrPwd,
  onToggleSeniorPwd,
  onProceedToPayment,
  disabled = false,
}) => {
  return (
    <div
      id="pos-cart-totals"
      className="shrink-0 pt-3 border-t border-slate-800 space-y-2.5 select-none"
    >
      {/* Senior Citizen / PWD Discount Selector (RA 9994 / RA 10754) */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">Senior / PWD 20%</div>
            <div className="text-[10px] text-slate-400 truncate">VAT-exempt + 20% discount</div>
          </div>
        </div>
        <button
          id="btn-toggle-senior-pwd"
          type="button"
          onClick={onToggleSeniorPwd}
          className={`ml-2 shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
            isSeniorOrPwd
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {isSeniorOrPwd ? 'Applied' : 'Apply'}
        </button>
      </div>

      {/* Line Breakdown */}
      <div className="space-y-1 text-xs text-slate-400">
        <div className="flex justify-between gap-2">
          <span className="truncate shrink-0">
            Gross Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-mono text-slate-200 shrink-0">{formatPhp(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between gap-2 text-emerald-400">
            <span className="flex items-center gap-1 truncate shrink-0">
              <Tag className="w-3 h-3 shrink-0" />
              <span>SC/PWD Discount (20%)</span>
            </span>
            <span className="font-mono shrink-0">-{formatPhp(discount)}</span>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <span className="truncate shrink-0">
            VAT (12%{isSeniorOrPwd ? ' Exempted' : ''})
          </span>
          <span className="font-mono text-slate-200 shrink-0">{formatPhp(tax)}</span>
        </div>
      </div>

      {/* Grand Total Row */}
      <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between gap-3 overflow-hidden">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 shrink-0 whitespace-nowrap">
          Total Due
        </span>
        <span
          id="cart-grand-total"
          className="font-extrabold text-white font-mono tracking-tight truncate text-right leading-tight"
          style={{ fontSize: 'clamp(1.1rem, 2.6vw, 1.5rem)' }}
        >
          {formatPhp(total)}
        </span>
      </div>

      {/* Charge / Checkout Button */}
      <button
        id="btn-proceed-checkout"
        type="button"
        disabled={disabled || itemCount === 0}
        onClick={onProceedToPayment}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition overflow-hidden"
      >
        <CreditCard className="w-4 h-4 shrink-0" />
        <span className="truncate">Charge {formatPhp(total)}</span>
        <span className="text-[10px] bg-indigo-700/60 text-indigo-200 px-1.5 py-0.5 rounded font-mono shrink-0">
          F4
        </span>
      </button>
    </div>
  );
};
