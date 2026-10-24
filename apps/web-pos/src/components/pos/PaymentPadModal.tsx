import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { formatPhp } from '../../utils/formatters';
import type { PaymentMethod } from '@pos-ai/shared-types';

interface PaymentPadModalProps {
  isOpen: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirmPayment: (paymentMethod: PaymentMethod, amountTendered: number) => void;
  isProcessing?: boolean;
}

export const PaymentPadModal: React.FC<PaymentPadModalProps> = ({
  isOpen,
  totalAmount,
  onClose,
  onConfirmPayment,
  isProcessing = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('digital_wallet');
  const [tenderedStr, setTenderedStr] = useState<string>(totalAmount.toFixed(2));

  useEffect(() => {
    if (isOpen) {
      setTenderedStr(totalAmount.toFixed(2));
      setSelectedMethod('digital_wallet');
    }
  }, [isOpen, totalAmount]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tenderedAmount = parseFloat(tenderedStr) || 0;
  const changeDue = Math.max(0, tenderedAmount - totalAmount);
  const isSufficient = selectedMethod !== 'cash' || tenderedAmount >= totalAmount;

  const handleNumpadPress = (digit: string) => {
    if (tenderedStr === '0.00' || tenderedStr === totalAmount.toFixed(2)) {
      setTenderedStr(digit);
    } else {
      if (digit === '.' && tenderedStr.includes('.')) return;
      setTenderedStr((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setTenderedStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleQuickCash = (amount: number) => {
    setTenderedStr(amount.toFixed(2));
  };

  return (
    <div
      id="payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        id="payment-modal-panel"
        className="w-full max-w-xl rounded-2xl bg-at-accent border border-at-accent-light shadow-2xl overflow-hidden flex flex-col text-at-neutral"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-at-accent-light bg-at-accent-muted/80">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-at-neutral">Philippine POS Checkout Tender</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-at-primary text-at-accent font-mono font-bold">
              PHP (₱)
            </span>
          </div>
          <button
            id="btn-close-payment-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-at-neutral/70 hover:text-white hover:bg-at-accent-light transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Total Due Banner */}
          <div className="p-4 rounded-xl bg-at-accent-muted border border-at-accent-light flex items-center justify-between">
            <span className="text-xs font-semibold text-at-neutral/70 uppercase tracking-wider">
              Total Amount Due
            </span>
            <span className="text-3xl font-extrabold text-at-primary font-mono">
              {formatPhp(totalAmount)}
            </span>
          </div>

          {/* Payment Method Selector (Philippine Standard) */}
          <div>
            <label className="block text-xs font-semibold text-at-neutral/70 mb-2">
              Select Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                id="btn-method-wallet"
                type="button"
                onClick={() => {
                  setSelectedMethod('digital_wallet');
                  setTenderedStr(totalAmount.toFixed(2));
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-medium text-xs transition ${
                  selectedMethod === 'digital_wallet'
                    ? 'bg-at-primary border-at-primary text-at-accent ring-2 ring-at-primary/30 font-bold'
                    : 'bg-at-accent-muted/80 border-at-accent-light text-at-neutral/80 hover:text-at-neutral hover:bg-at-accent-light/40'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1.5" />
                <span className="font-semibold">GCash / Maya</span>
                <span className="text-[10px] opacity-80 mt-0.5">QR Ph Dynamic</span>
              </button>

              <button
                id="btn-method-cash"
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-medium text-xs transition ${
                  selectedMethod === 'cash'
                    ? 'bg-at-primary border-at-primary text-at-accent ring-2 ring-at-primary/30 font-bold'
                    : 'bg-at-accent-muted/80 border-at-accent-light text-at-neutral/80 hover:text-at-neutral hover:bg-at-accent-light/40'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1.5" />
                <span className="font-semibold">Cash (PHP)</span>
                <span className="text-[10px] opacity-80 mt-0.5">Philippine Peso</span>
              </button>

              <button
                id="btn-method-card"
                type="button"
                onClick={() => {
                  setSelectedMethod('credit_card');
                  setTenderedStr(totalAmount.toFixed(2));
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border font-medium text-xs transition ${
                  selectedMethod === 'credit_card'
                    ? 'bg-at-primary border-at-primary text-at-accent ring-2 ring-at-primary/30 font-bold'
                    : 'bg-at-accent-muted/80 border-at-accent-light text-at-neutral/80 hover:text-at-neutral hover:bg-at-accent-light/40'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1.5" />
                <span className="font-semibold">BancNet / Card</span>
                <span className="text-[10px] opacity-80 mt-0.5">EMV Chip / Tap</span>
              </button>
            </div>
          </div>

          {/* Cash Numpad & Fast Tender Controls (Philippine Banknotes: ₱50, ₱100, ₱500, ₱1,000) */}
          {selectedMethod === 'cash' && (
            <div className="space-y-4 pt-2 border-t border-at-accent-light">
              <div>
                <label className="block text-xs font-semibold text-at-neutral/70 mb-2">
                  Philippine Currency Presets
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalAmount)}
                    className="py-2.5 px-1 rounded-lg bg-at-accent-muted hover:bg-at-accent-light border border-at-accent-light text-at-neutral text-xs font-semibold font-mono"
                  >
                    Exact
                  </button>
                  {[50, 100, 500, 1000].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleQuickCash(bill)}
                      className="py-2.5 px-1 rounded-lg bg-at-accent-muted hover:bg-at-accent-light border border-at-accent-light text-at-neutral text-xs font-semibold font-mono"
                    >
                      ₱{bill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Tendered Input & Change Output */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-at-accent-muted border border-at-accent-light">
                  <span className="text-[10px] uppercase font-bold text-at-neutral/70">
                    Amount Tendered
                  </span>
                  <div className="text-xl font-mono font-bold text-at-neutral mt-0.5">
                    {formatPhp(tenderedAmount)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-at-accent-muted border border-at-accent-light">
                  <span className="text-[10px] uppercase font-bold text-at-neutral/70">
                    Change Due
                  </span>
                  <div
                    className={`text-xl font-mono font-bold mt-0.5 ${
                      changeDue > 0 ? 'text-at-primary' : 'text-at-neutral/50'
                    }`}
                  >
                    {formatPhp(changeDue)}
                  </div>
                </div>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => (key === 'DEL' ? handleBackspace() : handleNumpadPress(key))}
                    className="py-3 rounded-xl bg-at-accent-muted/90 hover:bg-at-accent-light border border-at-accent-light text-sm font-bold font-mono text-at-neutral transition active:scale-95"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Complete Action */}
        <div className="p-5 border-t border-at-accent-light bg-at-accent-muted flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-at-neutral/70">
            <ShieldCheck className="w-4 h-4 text-at-primary" />
            <span>BIR Compliant • Cash Register Machine (CRM)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-payment"
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-at-accent-muted hover:bg-at-accent-light text-at-neutral text-xs font-semibold border border-at-accent-light transition"
            >
              Cancel (Esc)
            </button>

            <button
              id="btn-confirm-payment"
              type="button"
              disabled={!isSufficient || isProcessing}
              onClick={() => onConfirmPayment(selectedMethod, tenderedAmount)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-at-secondary hover:opacity-95 disabled:opacity-40 text-at-neutral text-xs font-bold shadow-lg shadow-at-secondary/30 transition active:scale-95"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-at-neutral/30 border-t-at-neutral rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize & Complete Sale</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
