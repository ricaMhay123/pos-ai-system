import React, { useRef } from 'react';
import { X, Printer, Store, Receipt } from 'lucide-react';
import { formatPhp } from '../../utils/formatters';
import type { TransactionHistoryItem } from '@pos-ai/shared-types';

interface ReceiptModalProps {
  isOpen: boolean;
  transaction: TransactionHistoryItem | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  transaction,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const txnDate = new Date(transaction.createdAt);
  const formattedDate = txnDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = txnDate.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Philippine VAT breakdown
  const vatableSales = +(transaction.subtotal / 1.12).toFixed(2);
  const vatAmount = transaction.tax || +(transaction.subtotal - vatableSales).toFixed(2);
  const totalPaid = transaction.payments.reduce((sum, p) => sum + p.amount, 0);
  const changeDue = Math.max(0, totalPaid - transaction.total);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank', 'width=400,height=700');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt - ${transaction.transactionNumber}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'JetBrains Mono', 'Courier New', monospace;
                font-size: 11px;
                color: #1a1a1a;
                padding: 16px;
                max-width: 320px;
                margin: 0 auto;
              }
              .receipt-header { text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #999; }
              .store-name { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
              .store-subtitle { font-size: 10px; color: #666; margin-top: 2px; }
              .receipt-meta { margin: 8px 0; font-size: 10px; color: #444; }
              .receipt-meta div { margin-bottom: 2px; }
              .divider { border-top: 1px dashed #999; margin: 8px 0; }
              .line-items { width: 100%; margin: 6px 0; }
              .line-items th { text-align: left; font-size: 10px; font-weight: 600; color: #666; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
              .line-items th:last-child, .line-items td:last-child { text-align: right; }
              .line-items td { padding: 3px 0; font-size: 11px; vertical-align: top; }
              .totals-section { margin-top: 6px; }
              .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
              .totals-row.grand-total { font-size: 14px; font-weight: 700; margin-top: 4px; padding-top: 4px; border-top: 2px solid #333; }
              .vat-section { font-size: 10px; color: #555; margin: 4px 0; padding: 4px 0; border-top: 1px dashed #ccc; }
              .payment-section { margin-top: 6px; font-size: 10px; }
              .footer { text-align: center; margin-top: 16px; padding-top: 8px; border-top: 1px dashed #999; font-size: 9px; color: #888; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center">
              <Receipt className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Transaction Receipt</h3>
              <span className="text-[11px] font-mono text-slate-400">{transaction.transactionNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              id="btn-close-receipt-modal"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div ref={receiptRef}>
            {/* ===== Receipt Content (Print-friendly) ===== */}

            {/* Store Header / Meme Mart Branding */}
            <div className="receipt-header text-center pb-4 border-b border-dashed border-slate-700 mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Store className="w-5 h-5 text-indigo-400" />
                <span className="store-name text-xl font-extrabold text-white tracking-wide">MEME MART</span>
              </div>
              <div className="store-subtitle text-[10px] text-slate-400 font-medium">
                {transaction.storeName || 'Flagship BGC Terminal - Taguig'}
              </div>
              <div className="store-subtitle text-[10px] text-slate-500 mt-0.5">
                Philippine Retail POS System • VAT Registered
              </div>
              <div className="store-subtitle text-[10px] text-slate-500">
                TIN: 000-000-000-00000
              </div>
            </div>

            {/* Transaction Metadata */}
            <div className="receipt-meta space-y-1 text-[11px] text-slate-300 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction #:</span>
                <span className="font-mono font-semibold text-white">{transaction.transactionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-mono">{formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span className="font-mono">{transaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                  {transaction.status}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="divider border-t border-dashed border-slate-700 my-3" />

            {/* Itemized Products Table */}
            <table className="line-items w-full text-xs">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="text-left pb-2 font-semibold">Item</th>
                  <th className="text-center pb-2 font-semibold w-10">Qty</th>
                  <th className="text-right pb-2 font-semibold w-20">Price</th>
                  <th className="text-right pb-2 font-semibold w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transaction.lineItems.map((item, idx) => (
                  <tr key={idx} className="text-slate-200">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-white leading-tight">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.sku}</div>
                    </td>
                    <td className="py-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-2 text-right font-mono">{formatPhp(item.unitPrice)}</td>
                    <td className="py-2 text-right font-mono font-semibold">{formatPhp(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Divider */}
            <div className="divider border-t border-dashed border-slate-700 my-3" />

            {/* Philippine VAT Breakdown */}
            <div className="vat-section space-y-1.5 text-[11px] text-slate-300 py-2 border-t border-dashed border-slate-800">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Philippine VAT Breakdown (12%)
              </div>
              <div className="totals-row flex justify-between">
                <span className="text-slate-400">Gross Subtotal:</span>
                <span className="font-mono">{formatPhp(transaction.subtotal)}</span>
              </div>
              <div className="totals-row flex justify-between">
                <span className="text-slate-400">VATable Sales:</span>
                <span className="font-mono">{formatPhp(vatableSales)}</span>
              </div>
              <div className="totals-row flex justify-between">
                <span className="text-slate-400">VAT Amount (12%):</span>
                <span className="font-mono text-amber-400">{formatPhp(vatAmount)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="totals-row flex justify-between">
                  <span className="text-slate-400">Discount (SC/PWD):</span>
                  <span className="font-mono text-emerald-400">-{formatPhp(transaction.discount)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="totals-section border-t-2 border-slate-600 pt-3 mt-2">
              <div className="totals-row grand-total flex justify-between text-base font-extrabold">
                <span className="text-white">TOTAL DUE:</span>
                <span className="font-mono text-emerald-400">{formatPhp(transaction.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="payment-section mt-3 pt-3 border-t border-dashed border-slate-700 space-y-1.5 text-[11px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Payment Tender
              </div>
              {transaction.payments.map((payment, idx) => (
                <div key={idx} className="flex justify-between text-slate-300">
                  <span className="capitalize">{payment.method.replace('_', ' ')}:</span>
                  <span className="font-mono font-semibold">{formatPhp(payment.amount)}</span>
                </div>
              ))}
              {changeDue > 0 && (
                <div className="flex justify-between text-indigo-400 font-semibold mt-1">
                  <span>Change Due:</span>
                  <span className="font-mono">{formatPhp(changeDue)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer text-center mt-5 pt-3 border-t border-dashed border-slate-700">
              <div className="text-[10px] text-slate-500 font-medium">
                Thank you for shopping at Meme Mart!
              </div>
              <div className="text-[9px] text-slate-600 mt-1">
                This serves as your Official Receipt
              </div>
              <div className="text-[9px] text-slate-600">
                BIR Permit No. 0000-000-000000-00000
              </div>
              <div className="text-[9px] text-slate-600 mt-1">
                POS AI Enterprise • Philippine Retail Standard
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
