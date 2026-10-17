// =====================================================================
// Philippine Localization & Currency Formatters (en-PH, PHP / ₱)
// =====================================================================

export const PHP_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format numeric value as Philippine Peso (e.g., ₱1,450.00)
 */
export function formatPhp(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₱0.00';
  }
  return PHP_FORMATTER.format(amount);
}

/**
 * Standard Philippine VAT rate (12%)
 */
export const PH_STANDARD_VAT_RATE = 0.12;

/**
 * Senior Citizen & Person with Disability (PWD) statutory discount rate in the Philippines:
 * 20% discount on gross amount and exempt from 12% VAT.
 */
export const PH_SENIOR_PWD_DISCOUNT_RATE = 0.20;

export interface PhTaxCalculation {
  grossSubtotal: number;
  discountAmount: number;
  vatableSales: number;
  vatExemptSales: number;
  vatAmount: number;
  totalAmountDue: number;
}

/**
 * Compute Philippine POS sales totals with BIR-compliant Senior/PWD discount and VAT computation
 */
export function calculatePhTicketTotals(
  items: Array<{ unitPrice: number; quantity: number; isVatable?: boolean }>,
  isSeniorOrPwd: boolean = false
): PhTaxCalculation {
  const grossSubtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  if (isSeniorOrPwd) {
    // Under PH law (RA 9994 & RA 10754):
    // 1. VAT is waived (VAT-Exempt)
    // 2. 20% discount applied to the net of VAT base price
    // Note: If retail price already includes 12% VAT:
    const netOfVat = grossSubtotal / (1 + PH_STANDARD_VAT_RATE);
    const discountAmount = netOfVat * PH_SENIOR_PWD_DISCOUNT_RATE;
    const totalAmountDue = Math.max(0, netOfVat - discountAmount);

    return {
      grossSubtotal,
      discountAmount: Number(discountAmount.toFixed(2)),
      vatableSales: 0.00,
      vatExemptSales: Number(netOfVat.toFixed(2)),
      vatAmount: 0.00,
      totalAmountDue: Number(totalAmountDue.toFixed(2)),
    };
  }

  // Standard Regular Transaction:
  // In PH retail, listed shelf prices typically include 12% VAT or compute 12% on taxable sales.
  // Here we calculate 12% VAT on subtotal:
  const discountAmount = 0.00;
  const vatableSales = grossSubtotal;
  const vatAmount = Number((vatableSales * PH_STANDARD_VAT_RATE).toFixed(2));
  const totalAmountDue = Number((vatableSales + vatAmount).toFixed(2));

  return {
    grossSubtotal: Number(grossSubtotal.toFixed(2)),
    discountAmount,
    vatableSales: Number(vatableSales.toFixed(2)),
    vatExemptSales: 0.00,
    vatAmount,
    totalAmountDue,
  };
}
