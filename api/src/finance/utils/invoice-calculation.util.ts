import { Decimal } from '@prisma/client/runtime/library';

export interface CalculatedInvoiceItem {
  id?: string;
  productId?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  discountValue?: number | null;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  sortOrder?: number;
}

export interface InvoiceCalculationInput {
  items: Array<{
    id?: string;
    productId?: string | null;
    name: string;
    description?: string | null;
    quantity: number | string | Decimal;
    unit?: string | null;
    unitPrice: number | string | Decimal;
    discountType?: 'PERCENTAGE' | 'FIXED' | string | null;
    discountValue?: number | string | Decimal | null;
    taxRate?: number | string | Decimal | null;
    sortOrder?: number;
  }>;
  invoiceDiscountType?: 'PERCENTAGE' | 'FIXED' | null;
  invoiceDiscountValue?: number | string | Decimal | null;
  isInterState?: boolean;
  paidAmount?: number | string | Decimal | null;
}

export interface InvoiceCalculationResult {
  items: CalculatedInvoiceItem[];
  subtotal: number;
  discountType: 'PERCENTAGE' | 'FIXED' | null;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  otherTaxAmount: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

/**
 * Rounds a number to exactly 2 decimal places using standard financial half-up rounding.
 */
export function roundTo2(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Safe numeric conversion helper for Decimal, string, and number inputs.
 */
export function toSafeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof val === 'object' && typeof val.toNumber === 'function') {
    return val.toNumber();
  }
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

/**
 * Enterprise Tax & Invoice Calculation Engine.
 * Calculates normalized line totals, discount amounts, GST breakdowns (CGST/SGST vs IGST),
 * round-offs, grand totals, and outstanding balance amounts.
 */
export function calculateInvoiceTotals(
  input: InvoiceCalculationInput,
): InvoiceCalculationResult {
  const calculatedItems: CalculatedInvoiceItem[] = [];
  let itemsGrossSubtotal = 0;
  let itemsDiscountTotal = 0;
  let itemsTaxableSubtotal = 0;
  let totalCalculatedTax = 0;

  const rawItems = input.items || [];

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    const qty = Math.max(0, toSafeNumber(item.quantity, 1));
    const rate = Math.max(0, toSafeNumber(item.unitPrice, 0));
    const discType = item.discountType === 'PERCENTAGE' || item.discountType === 'FIXED' ? item.discountType : null;
    const discVal = Math.max(0, toSafeNumber(item.discountValue, 0));
    const taxRate = Math.max(0, toSafeNumber(item.taxRate, 0));

    const lineGross = roundTo2(qty * rate);
    let itemDiscAmt = 0;
    if (discType === 'PERCENTAGE') {
      itemDiscAmt = roundTo2(lineGross * (Math.min(100, discVal) / 100));
    } else if (discType === 'FIXED') {
      itemDiscAmt = roundTo2(Math.min(lineGross, discVal));
    }

    const lineTaxable = roundTo2(Math.max(0, lineGross - itemDiscAmt));
    const lineTax = roundTo2(lineTaxable * (taxRate / 100));
    const lineTotal = roundTo2(lineTaxable + lineTax);

    itemsGrossSubtotal += lineGross;
    itemsDiscountTotal += itemDiscAmt;
    itemsTaxableSubtotal += lineTaxable;
    totalCalculatedTax += lineTax;

    calculatedItems.push({
      id: item.id,
      productId: item.productId || null,
      name: item.name || `Item ${i + 1}`,
      description: item.description || null,
      quantity: qty,
      unit: item.unit || 'unit',
      unitPrice: rate,
      discountType: discType,
      discountValue: discVal,
      discountAmount: itemDiscAmt,
      taxRate: taxRate,
      taxAmount: lineTax,
      lineTotal: lineTotal,
      sortOrder: item.sortOrder ?? i,
    });
  }

  // Invoice-level discount (applied on items taxable subtotal if provided)
  const invDiscType = input.invoiceDiscountType === 'PERCENTAGE' || input.invoiceDiscountType === 'FIXED' ? input.invoiceDiscountType : null;
  const invDiscVal = Math.max(0, toSafeNumber(input.invoiceDiscountValue, 0));
  let invDiscAmt = 0;
  if (invDiscType === 'PERCENTAGE') {
    invDiscAmt = roundTo2(itemsTaxableSubtotal * (Math.min(100, invDiscVal) / 100));
  } else if (invDiscType === 'FIXED') {
    invDiscAmt = roundTo2(Math.min(itemsTaxableSubtotal, invDiscVal));
  }

  const finalTaxableAmount = roundTo2(Math.max(0, itemsTaxableSubtotal - invDiscAmt));

  // Determine CGST + SGST vs IGST
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (input.isInterState) {
    igst = roundTo2(totalCalculatedTax);
    cgst = 0;
    sgst = 0;
  } else {
    // Intra-state splits tax equally between CGST and SGST
    cgst = roundTo2(totalCalculatedTax / 2);
    sgst = roundTo2(totalCalculatedTax - cgst);
    igst = 0;
  }

  const otherTax = 0;
  const rawGrandTotal = roundTo2(finalTaxableAmount + cgst + sgst + igst + otherTax);
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = roundTo2(roundedGrandTotal - rawGrandTotal);

  const paidAmount = roundTo2(Math.max(0, toSafeNumber(input.paidAmount, 0)));
  const balanceAmount = roundTo2(Math.max(0, roundedGrandTotal - paidAmount));

  return {
    items: calculatedItems,
    subtotal: roundTo2(itemsGrossSubtotal),
    discountType: invDiscType,
    discountValue: invDiscVal,
    discountAmount: roundTo2(itemsDiscountTotal + invDiscAmt),
    taxableAmount: finalTaxableAmount,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    otherTaxAmount: otherTax,
    roundOff: roundOff,
    totalAmount: roundedGrandTotal,
    paidAmount: paidAmount,
    balanceAmount: balanceAmount,
  };
}
