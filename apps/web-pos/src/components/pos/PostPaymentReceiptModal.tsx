import React, { useRef } from 'react';
import { Printer, SkipForward, Store, CheckCircle2 } from 'lucide-react';
import { formatPhp } from '../../utils/formatters';
import type { PaymentMethod } from '@pos-ai/shared-types';

// ─── Line item shape passed in from checkout ───────────────────────────────
export interface PostPaymentLineItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
}

// ─── Full receipt data shape ───────────────────────────────────────────────
export interface PostPaymentReceiptData {
  transactionNumber: string;
  createdAt: string;           // ISO string
  cashierName: string;
  storeName: string;
  terminalCode: string;
  lineItems: PostPaymentLineItem[];
  grossSubtotal: number;       // Pre-VAT sum of items
  vatAmount: number;           // 12% Philippine VAT
  discountAmount: number;      // Senior/PWD discount
  totalAmountDue: number;      // Grand total
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeDue: number;
  isSeniorOrPwd: boolean;
}

// ─── Props ────────────────────────────────────────────────────────────────
interface PostPaymentReceiptModalProps {
  isOpen: boolean;
  receipt: PostPaymentReceiptData | null;
  onPrint: () => void;
  onSkip: () => void;
}

// ─── Payment method label helper ─────────────────────────────────────────
function paymentMethodLabel(m: PaymentMethod): string {
  switch (m) {
    case 'cash':           return 'Cash (PHP)';
    case 'credit_card':   return 'BancNet / Card (EMV)';
    case 'digital_wallet': return 'GCash / Maya (QR Ph)';
    default:               return String(m).replace(/_/g, ' ');
  }
}

// ─── Component ────────────────────────────────────────────────────────────
export const PostPaymentReceiptModal: React.FC<PostPaymentReceiptModalProps> = ({
  isOpen,
  receipt,
  onPrint,
  onSkip,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  const txnDate = new Date(receipt.createdAt);
  const fmtDate = txnDate.toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const fmtTime = txnDate.toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  // Philippine VAT: gross prices already include 12% VAT on vatable items.
  // We display: VATable Sales (net of VAT) and VAT Amount separately.
  const vatableSalesNet = +(receipt.grossSubtotal / 1.12).toFixed(2);
  const vatAmount = +(receipt.grossSubtotal - vatableSalesNet).toFixed(2);

  const handlePrintWindow = () => {
    if (!receiptRef.current) { onPrint(); return; }
    const printContent = receiptRef.current.innerHTML;
    const pw = window.open('', '_blank', 'width=400,height=750');
    if (pw) {
      pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${receipt.transactionNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'JetBrains Mono','Courier New',monospace; font-size: 11px; color: #111; padding: 16px; max-width: 320px; margin: 0 auto; }
    .rh { text-align: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed #999; }
    .sn { font-size: 18px; font-weight: 700; letter-spacing: 2px; }
    .ss { font-size: 10px; color: #666; }
    .meta div { margin-bottom: 2px; display: flex; justify-content: space-between; font-size: 10px; }
    .dv { border-top: 1px dashed #999; margin: 7px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; font-weight: 700; color: #555; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 3px 0; font-size: 11px; vertical-align: top; }
    .tr { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
    .grand { font-size: 14px; font-weight: 700; margin-top: 4px; padding-top: 4px; border-top: 2px solid #333; }
    .footer { text-align: center; margin-top: 14px; padding-top: 8px; border-top: 1px dashed #999; font-size: 9px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${printContent}</body>
</html>`);
      pw.document.close();
      pw.focus();
      setTimeout(() => { pw.print(); pw.close(); }, 500);
    }
    onPrint();
  };

  return (
    <div
      id="post-payment-receipt-modal-backdrop"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      {/* Glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-gradient-to-b from-emerald-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

      <div
        id="post-payment-receipt-modal"
        className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* ─── Success Banner ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-950/80 border-b border-emerald-600/30">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-emerald-300">Payment Authorized!</div>
            <div className="text-[11px] font-mono text-emerald-500 truncate">{receipt.transactionNumber}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-emerald-500">Total Paid</div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono">
              {formatPhp(receipt.totalAmountDue)}
            </div>
          </div>
        </div>

        {/* ─── Scrollable Receipt Content ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div ref={receiptRef}>

            {/* Store Header */}
            <div className="rh text-center pb-3 border-b border-dashed border-slate-700 mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Store className="w-4 h-4 text-indigo-400" />
                <span className="sn text-lg font-extrabold text-white tracking-widest">
                  MEME MART
                </span>
              </div>
              <div className="ss text-[10px] text-slate-400">
                {receipt.storeName || 'Flagship BGC Terminal - Taguig'}
              </div>
              <div className="ss text-[10px] text-slate-500 mt-0.5">
                Terminal: {receipt.terminalCode} • VAT Registered
              </div>
              <div className="ss text-[10px] text-slate-600">
                TIN: 000-000-000-00000
              </div>
            </div>

            {/* Metadata */}
            <div className="meta space-y-0.5 text-[11px] mb-3">
              <div className="flex justify-between text-slate-400">
                <span>Transaction #:</span>
                <span className="font-mono font-semibold text-white">{receipt.transactionNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date:</span>
                <span className="font-mono text-slate-200">{fmtDate}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Time:</span>
                <span className="font-mono text-slate-200">{fmtTime}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cashier:</span>
                <span className="font-mono text-slate-200">{receipt.cashierName}</span>
              </div>
              {receipt.isSeniorOrPwd && (
                <div className="flex justify-between text-amber-400">
                  <span>Customer Type:</span>
                  <span className="font-semibold">Senior Citizen / PWD</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="dv border-t border-dashed border-slate-700 my-2" />

            {/* Line Items */}
            <table className="w-full text-xs mb-1">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="text-left pb-2 font-semibold">Item</th>
                  <th className="text-center pb-2 font-semibold w-10">Qty</th>
                  <th className="text-right pb-2 font-semibold w-20">Price</th>
                  <th className="text-right pb-2 font-semibold w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {receipt.lineItems.map((item, idx) => (
                  <tr key={idx} className="text-slate-200">
                    <td className="py-1.5 pr-2">
                      <div className="font-medium text-white leading-tight text-[11px]">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-1.5 text-center font-mono text-slate-300">{item.quantity}</td>
                    <td className="py-1.5 text-right font-mono text-slate-300">{formatPhp(item.unitPrice)}</td>
                    <td className="py-1.5 text-right font-mono font-semibold">{formatPhp(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Divider */}
            <div className="dv border-t border-dashed border-slate-700 my-2" />

            {/* Philippine VAT Breakdown */}
            <div className="space-y-1 text-[11px] mb-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Philippine VAT Breakdown (12%)
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gross Subtotal:</span>
                <span className="font-mono">{formatPhp(receipt.grossSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>VATable Sales (net):</span>
                <span className="font-mono">{formatPhp(vatableSalesNet)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>VAT Amount (12%):</span>
                <span className="font-mono text-amber-400">{formatPhp(vatAmount)}</span>
              </div>
              {receipt.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>SC/PWD Discount:</span>
                  <span className="font-mono">-{formatPhp(receipt.discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="grand border-t-2 border-slate-600 pt-2 mt-2 flex justify-between">
              <span className="font-extrabold text-white text-sm">TOTAL DUE:</span>
              <span className="font-mono font-extrabold text-emerald-400 text-sm">
                {formatPhp(receipt.totalAmountDue)}
              </span>
            </div>

            {/* Divider */}
            <div className="dv border-t border-dashed border-slate-700 my-2" />

            {/* Payment Tender Section */}
            <div className="space-y-1 text-[11px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Payment Tender
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{paymentMethodLabel(receipt.paymentMethod)}:</span>
                <span className="font-mono font-semibold">{formatPhp(receipt.amountTendered)}</span>
              </div>
              {receipt.changeDue > 0 && (
                <div className="flex justify-between text-indigo-300 font-semibold">
                  <span>Change Due:</span>
                  <span className="font-mono">{formatPhp(receipt.changeDue)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer text-center mt-4 pt-3 border-t border-dashed border-slate-700">
              <div className="text-[10px] text-slate-500 font-medium">
                Thank you for shopping at Meme Mart!
              </div>
              <div className="text-[9px] text-slate-600 mt-0.5">
                This serves as your Official Receipt
              </div>
              <div className="text-[9px] text-slate-600">
                BIR Permit No. 0000-000-000000-00000
              </div>
              <div className="text-[9px] text-slate-700 mt-0.5">
                POS AI Enterprise • Philippine Retail Standard
              </div>
            </div>
          </div>
        </div>

        {/* ─── Action Buttons ─────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          {/* BIR compliance note */}
          <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
            BIR Compliant · CRM
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Skip / Back */}
            <button
              id="btn-skip-receipt"
              type="button"
              onClick={onSkip}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition active:scale-95"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Back / Skip</span>
            </button>

            {/* Print */}
            <button
              id="btn-print-receipt"
              type="button"
              onClick={handlePrintWindow}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
