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
      className="shrink-0 pt-3 space-y-2.5 select-none border-t"
      style={{ borderColor: 'var(--at-accent-light)' }}
    >
      {/* Senior Citizen / PWD Discount Selector (RA 9994 / RA 10754) */}
      <div
        className="flex items-center justify-between p-2.5 rounded-xl border"
        style={{
          backgroundColor: 'var(--at-accent-muted)',
          borderColor: 'var(--at-accent-light)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--at-primary)' }} />
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--at-neutral)' }}>
              Senior / PWD 20%
            </div>
            <div className="text-[10px] truncate" style={{ color: 'var(--at-neutral-muted)' }}>
              VAT-exempt + 20% discount
            </div>
          </div>
        </div>
        <button
          id="btn-toggle-senior-pwd"
          type="button"
          onClick={onToggleSeniorPwd}
          className="ml-2 shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border transition"
          style={
            isSeniorOrPwd
              ? {
                  /* Primary bg — MUST use dark Accent text (WCAG critical rule) */
                  backgroundColor: 'var(--at-primary)',
                  color: 'var(--at-text-on-primary)',
                  borderColor: 'var(--at-primary-muted)',
                }
              : {
                  backgroundColor: 'var(--at-accent)',
                  color: 'var(--at-neutral-muted)',
                  borderColor: 'var(--at-accent-light)',
                }
          }
        >
          {isSeniorOrPwd ? 'Applied' : 'Apply'}
        </button>
      </div>

      {/* Line Breakdown */}
      <div className="space-y-1 text-xs" style={{ color: 'var(--at-neutral-muted)' }}>
        <div className="flex justify-between gap-2">
          <span className="truncate shrink-0">
            Gross Subtotal ({itemCount ?? 0} {(itemCount ?? 0) === 1 ? 'item' : 'items'})
          </span>
          <span className="font-mono shrink-0" style={{ color: 'var(--at-neutral)' }}>
            {formatPhp(subtotal ?? 0)}
          </span>
        </div>

        {(discount ?? 0) > 0 && (
          <div className="flex justify-between gap-2" style={{ color: 'var(--at-primary)' }}>
            <span className="flex items-center gap-1 truncate shrink-0">
              <Tag className="w-3 h-3 shrink-0" />
              <span>SC/PWD Discount (20%)</span>
            </span>
            <span className="font-mono shrink-0">-{formatPhp(discount ?? 0)}</span>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <span className="truncate shrink-0">
            VAT (12%{isSeniorOrPwd ? ' Exempted' : ''})
          </span>
          <span className="font-mono shrink-0" style={{ color: 'var(--at-neutral)' }}>
            {formatPhp(tax ?? 0)}
          </span>
        </div>
      </div>

      {/* Grand Total Row */}
      <div
        className="pt-2 border-t flex items-baseline justify-between gap-3 overflow-hidden"
        style={{ borderColor: 'var(--at-accent-light)' }}
      >
        <span
          className="text-[11px] uppercase tracking-wider font-semibold shrink-0 whitespace-nowrap"
          style={{ color: 'var(--at-neutral-muted)' }}
        >
          Total Due
        </span>
        <span
          id="cart-grand-total"
          className="font-extrabold font-mono tracking-tight truncate text-right leading-tight"
          style={{
            fontSize: 'clamp(1.1rem, 2.6vw, 1.5rem)',
            color: 'var(--at-neutral)',
          }}
        >
          {formatPhp(total ?? 0)}
        </span>
      </div>

      {/* Charge / Checkout Button
          Uses Secondary (#B8543F) bg → Neutral (#F8EBD9) text (WCAG AA compliant) */}
      <button
        id="btn-proceed-checkout"
        type="button"
        disabled={disabled || itemCount === 0}
        onClick={onProceedToPayment}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg active:scale-[0.99] transition overflow-hidden disabled:opacity-40"
        style={{
          backgroundColor: 'var(--at-secondary)',
          color: 'var(--at-text-on-secondary)',
          boxShadow: '0 4px 14px -2px rgba(184,84,63,0.40)',
        }}
      >
        <CreditCard className="w-4 h-4 shrink-0" />
        <span className="truncate">Charge {formatPhp(total)}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
          style={{
            backgroundColor: 'rgba(61,37,69,0.40)',
            color: 'var(--at-neutral)',
          }}
        >
          F4
        </span>
      </button>
    </div>
  );
};
