export interface LineItemState {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  taxRate: number;
}

export interface ItemCalculation {
  gross: number;
  discAmt: number;
  lineTaxable: number;
  taxAmt: number;
  lineTotal: number;
}

export interface InvoiceTotals {
  subtotal: number;
  totalDiscount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  roundOff: number;
  totalAmount: number;
  itemCalculations: ItemCalculation[];
}
