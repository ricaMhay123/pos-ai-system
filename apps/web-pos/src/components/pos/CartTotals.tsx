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
    <div id="pos-cart-totals" className="pt-4 border-t border-slate-800 space-y-3 select-none">
      {/* Senior Citizen / PWD Discount Selector (RA 9994 / RA 10754) */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-xs font-semibold text-slate-200">Senior / PWD 20%</div>
            <div className="text-[10px] text-slate-400">VAT-exempt + 20% discount</div>
          </div>
        </div>
        <button
          id="btn-toggle-senior-pwd"
          type="button"
          onClick={onToggleSeniorPwd}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
            isSeniorOrPwd
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {isSeniorOrPwd ? 'Applied' : 'Apply'}
        </button>
      </div>

      <div className="space-y-1.5 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Gross Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-mono text-slate-200">{formatPhp(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> Senior/PWD Discount (20%)
            </span>
            <span className="font-mono">-{formatPhp(discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>VAT (12% {isSeniorOrPwd ? 'Exempted' : 'Vatable'})</span>
          <span className="font-mono text-slate-200">{formatPhp(tax)}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Total Amount Due
          </span>
        </div>
        <div className="text-right">
          <span
            id="cart-grand-total"
            className="text-2xl font-extrabold text-white font-mono tracking-tight"
          >
            {formatPhp(total)}
          </span>
        </div>
      </div>

      <button
        id="btn-proceed-checkout"
        type="button"
        disabled={disabled || itemCount === 0}
        onClick={onProceedToPayment}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition"
      >
        <CreditCard className="w-4 h-4" />
        <span>Charge {formatPhp(total)}</span>
        <span className="text-[10px] bg-indigo-700/60 text-indigo-200 px-1.5 py-0.5 rounded font-mono ml-1">
          F4
        </span>
      </button>
    </div>
  );
};
