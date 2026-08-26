import {
  calculateInvoiceTotals,
  roundTo2,
} from '../utils/invoice-calculation.util';

describe('InvoiceCalculationUtil', () => {
  it('should accurately calculate standard line items without tax or discount', () => {
    const result = calculateInvoiceTotals({
      items: [
        { name: 'Consulting', quantity: 10, unitPrice: 1500, taxRate: 0 },
        { name: 'Setup', quantity: 1, unitPrice: 5000, taxRate: 0 },
      ],
    });

    expect(result.subtotal).toBe(20000);
    expect(result.taxableAmount).toBe(20000);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.igstAmount).toBe(0);
    expect(result.totalAmount).toBe(20000);
    expect(result.balanceAmount).toBe(20000);
  });

  it('should split intra-state GST into equal CGST and SGST', () => {
    const result = calculateInvoiceTotals({
      items: [
        {
          name: 'Web Application Development',
          quantity: 1,
          unitPrice: 100000,
          taxRate: 18,
        },
      ],
      isInterState: false,
    });

    expect(result.subtotal).toBe(100000);
    expect(result.taxableAmount).toBe(100000);
    expect(result.cgstAmount).toBe(9000);
    expect(result.sgstAmount).toBe(9000);
    expect(result.igstAmount).toBe(0);
    expect(result.totalAmount).toBe(118000);
  });

  it('should apply full IGST for inter-state customer transactions', () => {
    const result = calculateInvoiceTotals({
      items: [
        {
          name: 'SaaS Platform License',
          quantity: 2,
          unitPrice: 50000,
          taxRate: 18,
        },
      ],
      isInterState: true,
    });

    expect(result.subtotal).toBe(100000);
    expect(result.taxableAmount).toBe(100000);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.igstAmount).toBe(18000);
    expect(result.totalAmount).toBe(118000);
  });

  it('should correctly calculate line item percentage discounts and invoice discounts', () => {
    const result = calculateInvoiceTotals({
      items: [
        {
          name: 'Item A',
          quantity: 2,
          unitPrice: 1000,
          discountType: 'PERCENTAGE',
          discountValue: 10, // 10% off 2000 = 200 discount -> 1800 taxable
          taxRate: 18, // 18% of 1800 = 324 tax
        },
      ],
      invoiceDiscountType: 'FIXED',
      invoiceDiscountValue: 300, // 1800 - 300 = 1500 taxable
      isInterState: false,
    });

    expect(result.subtotal).toBe(2000);
    expect(result.discountAmount).toBe(500); // 200 item discount + 300 invoice discount
    expect(result.taxableAmount).toBe(1500);
    expect(result.cgstAmount).toBe(162);
    expect(result.sgstAmount).toBe(162);
    expect(result.totalAmount).toBe(1824);
  });

  it('should correctly calculate partial payments and outstanding balance', () => {
    const result = calculateInvoiceTotals({
      items: [
        {
          name: 'Software Services',
          quantity: 1,
          unitPrice: 50000,
          taxRate: 18,
        },
      ],
      paidAmount: 25000,
    });

    expect(result.totalAmount).toBe(59000);
    expect(result.paidAmount).toBe(25000);
    expect(result.balanceAmount).toBe(34000);
  });

  it('should correctly round off fractional amounts to the nearest whole integer', () => {
    const result = calculateInvoiceTotals({
      items: [
        {
          name: 'Prorated Unit',
          quantity: 3,
          unitPrice: 333.33, // Gross 999.99
          taxRate: 18, // 18% of 999.99 = 179.9982 -> 180.00
        },
      ],
    });

    expect(result.totalAmount).toBe(1180);
    expect(result.roundOff).toBe(0.01);
  });
});
