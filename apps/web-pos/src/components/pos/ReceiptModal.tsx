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
              .store-name { font-size: 16px; font-weight: 700; letter-spacing: 1px; }
              .store-subtitle { font-size: 9px; color: #666; }
              .receipt-meta { margin-bottom: 10px; font-size: 10px; }
              .meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .receipt-divider { border-top: 1px dashed #999; margin: 8px 0; }
              .item-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
              .item-table th { font-size: 9px; text-transform: uppercase; color: #666; padding-bottom: 4px; }
              .item-table td { padding: 3px 0; font-size: 10px; }
              .item-name { font-weight: 600; }
              .item-sku { font-size: 8px; color: #888; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
              .grand-total { font-size: 13px; font-weight: 700; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin: 4px 0; }
              .vat-breakdown { font-size: 9px; color: #555; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #ccc; }
              .receipt-footer { text-align: center; font-size: 9px; color: #888; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #999; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-at-accent border border-at-accent-light rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 text-at-neutral flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-at-accent-light bg-at-accent-muted/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-at-accent border border-at-accent-light flex items-center justify-center">
              <Receipt className="w-4 h-4 text-at-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-at-neutral">Transaction Receipt</h3>
              <span className="text-[11px] font-mono text-at-neutral/70">{transaction.transactionNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-at-secondary hover:opacity-95 text-at-neutral text-xs font-semibold transition shadow-md shadow-at-secondary/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              id="btn-close-receipt-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-at-accent-light text-at-neutral/70 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <div
            ref={receiptRef}
            className="bg-at-neutral text-at-accent rounded-xl p-5 shadow-inner border border-at-neutral-muted font-mono"
          >
            {/* Store Header / 21/7teen Mart Branding */}
            <div className="receipt-header text-center pb-4 border-b border-dashed border-at-neutral-muted mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Store className="w-5 h-5 text-at-secondary" />
                <span className="store-name text-xl font-extrabold text-at-accent tracking-wide">21/7TEEN MART</span>
              </div>
              <div className="store-subtitle text-[10px] text-at-accent/80 font-medium">
                {transaction.storeName || 'POS Terminal - Store #01'}
              </div>
              <div className="store-subtitle text-[10px] text-at-accent/70 mt-0.5">
                Philippine Retail POS System • VAT Registered
              </div>
              <div className="store-subtitle text-[10px] text-at-accent/60">
                TIN: 000-000-000-00000
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="receipt-meta space-y-1 text-xs mb-4">
              <div className="meta-row flex justify-between text-at-accent/80">
                <span>Receipt No:</span>
                <span className="font-bold text-at-accent">{transaction.transactionNumber}</span>
              </div>
              <div className="meta-row flex justify-between text-at-accent/80">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="meta-row flex justify-between text-at-accent/80">
                <span>Time:</span>
                <span>{formattedTime}</span>
              </div>
              <div className="meta-row flex justify-between text-at-accent/80">
                <span>Cashier:</span>
                <span>{transaction.cashierName}</span>
              </div>
              <div className="meta-row flex justify-between text-at-accent/80">
                <span>POS Station:</span>
                <span>Station 01 (CRM-001)</span>
              </div>
            </div>

            {/* Divider */}
            <div className="receipt-divider border-t border-dashed border-at-neutral-muted my-3" />

            {/* Line Items Table */}
            <table className="item-table w-full text-xs mb-3">
              <thead>
                <tr className="text-at-accent/70 border-b border-at-neutral-muted pb-1">
                  <th className="text-left py-1 font-semibold">Item</th>
                  <th className="text-center py-1 font-semibold w-8">Qty</th>
                  <th className="text-right py-1 font-semibold w-16">Price</th>
                  <th className="text-right py-1 font-semibold w-20">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-at-neutral-muted/40">
                {transaction.lineItems.map((item, idx) => (
                  <tr key={idx} className="text-at-accent">
                    <td className="py-1.5 pr-2">
                      <div className="item-name font-medium">{item.productName}</div>
                      <div className="item-sku text-[9px] text-at-accent/70 font-mono">{item.sku}</div>
                    </td>
                    <td className="text-center py-1.5 font-mono">{item.quantity}</td>
                    <td className="text-right py-1.5 font-mono">{formatPhp(item.unitPrice)}</td>
                    <td className="text-right py-1.5 font-mono font-semibold">{formatPhp(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Divider */}
            <div className="receipt-divider border-t border-dashed border-at-neutral-muted my-3" />

            {/* Totals Section */}
            <div className="space-y-1.5 text-xs">
              <div className="totals-row flex justify-between text-at-accent/80">
                <span>Gross Subtotal:</span>
                <span className="font-mono">{formatPhp(transaction.subtotal)}</span>
              </div>

              {transaction.discount > 0 && (
                <div className="totals-row flex justify-between text-at-secondary font-semibold">
                  <span>Senior/PWD Discount (20%):</span>
                  <span className="font-mono">-{formatPhp(transaction.discount)}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="grand-total flex justify-between text-sm font-bold text-at-accent border-y-2 border-at-accent py-2 my-2">
                <span>TOTAL DUE:</span>
                <span className="font-mono">{formatPhp(transaction.total)}</span>
              </div>

              {/* Payment Tender Details */}
              {transaction.payments.map((pmt, pIdx) => (
                <div key={pIdx} className="totals-row flex justify-between text-at-accent/80">
                  <span className="capitalize">{pmt.method.replace('_', ' ')} Tendered:</span>
                  <span className="font-mono">{formatPhp(pmt.amount)}</span>
                </div>
              ))}

              {changeDue > 0 && (
                <div className="totals-row flex justify-between text-at-accent font-semibold">
                  <span>Change:</span>
                  <span className="font-mono font-bold">{formatPhp(changeDue)}</span>
                </div>
              )}
            </div>

            {/* Philippine 12% VAT Breakdown (BIR Format) */}
            <div className="vat-breakdown border-t border-dashed border-at-neutral-muted mt-4 pt-3 space-y-1 text-[10px] text-at-accent/80">
              <div className="font-bold text-at-accent mb-1 uppercase tracking-wider">BIR Tax Breakdown</div>
              <div className="flex justify-between">
                <span>VATable Sales:</span>
                <span className="font-mono">{formatPhp(vatableSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT-Exempt Sales:</span>
                <span className="font-mono">₱0.00</span>
              </div>
              <div className="flex justify-between">
                <span>VAT Zero-Rated Sales:</span>
                <span className="font-mono">₱0.00</span>
              </div>
              <div className="flex justify-between font-semibold text-at-accent">
                <span>12% Value Added Tax:</span>
                <span className="font-mono">{formatPhp(vatAmount)}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="receipt-footer border-t border-dashed border-at-neutral-muted mt-4 pt-3 text-center space-y-0.5 text-[9px] text-at-accent/70">
              <div className="font-bold text-at-accent">Thank you for shopping at 21/7teen Mart!</div>
              <div>Please keep this receipt for returns or exchanges.</div>
              <div>BIR Permit No. 0324-123-45678-000</div>
              <div>Machine SN: MM-POS-2026-001</div>
              <div className="text-[8px] text-at-accent/60 pt-1">
                POS AI • Intelligent Retail Cloud POS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
