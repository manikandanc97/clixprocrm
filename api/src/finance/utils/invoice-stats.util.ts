import { toNumber, formatCurrency } from '../../common/utils/crm-formatters.util';

export function checkIsInvoiceOverdue(
  dueDate: Date | string | null,
  balanceAmount: number,
  status: string,
): boolean {
  if (!dueDate || balanceAmount <= 0) return false;
  if (
    status === 'PAID' ||
    status === 'CANCELLED' ||
    status === 'VOID' ||
    status === 'REFUNDED'
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export interface InvoiceStatItem {
  totalAmount: any;
  paidAmount: any;
  balanceAmount?: any;
  status: string;
  dueDate: Date | null;
}

export function calculateInvoiceSummaryStats(
  allStats: InvoiceStatItem[],
  currency: string,
) {
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const inv of allStats) {
    const tot = toNumber(inv.totalAmount);
    const pd = toNumber(inv.paidAmount);
    const bal = toNumber(inv.balanceAmount) || tot - pd;

    totalInvoiced += tot;
    totalPaid += pd;

    const isOverdue =
      inv.dueDate &&
      new Date(inv.dueDate) < now &&
      bal > 0 &&
      inv.status !== 'PAID' &&
      inv.status !== 'CANCELLED' &&
      inv.status !== 'VOID';

    if (inv.status === 'PAID') {
      paidCount++;
    } else if (isOverdue) {
      overdueCount++;
      totalOverdue += bal;
    } else if (inv.status !== 'CANCELLED' && inv.status !== 'VOID') {
      pendingCount++;
      totalPending += bal;
    }
  }

  return {
    totalInvoiced,
    totalInvoicedFormatted: formatCurrency(totalInvoiced, currency),
    totalPaid,
    totalPaidFormatted: formatCurrency(totalPaid, currency),
    totalPending,
    totalPendingFormatted: formatCurrency(totalPending, currency),
    totalOverdue,
    totalOverdueFormatted: formatCurrency(totalOverdue, currency),
    paidCount,
    pendingCount,
    overdueCount,
    totalCount: allStats.length,
  };
}

export function mapInvoiceRecordToDto(inv: any, fallbackCurrency: string) {
  const tot = toNumber(inv.totalAmount || inv.amount);
  const pd = toNumber(inv.paidAmount);
  const bal = toNumber(inv.balanceAmount) || tot - pd;
  const isOverdue = checkIsInvoiceOverdue(inv.dueDate, bal, inv.status);
  const displayStatus =
    isOverdue && inv.status !== 'CANCELLED' && inv.status !== 'VOID'
      ? 'OVERDUE'
      : inv.status;
  const curr = inv.currency || fallbackCurrency;

  return {
    id: inv.id,
    tenantId: inv.tenantId,
    customerId: inv.customerId,
    companyId: inv.companyId,
    dealId: inv.dealId,
    quotationId: inv.quotationId,
    invoiceNumber: inv.invoiceNumber || inv.id.slice(0, 8),
    invoiceDate: inv.invoiceDate ? (inv.invoiceDate instanceof Date ? inv.invoiceDate.toISOString() : String(inv.invoiceDate)) : new Date().toISOString(),
    dueDate: inv.dueDate ? (inv.dueDate instanceof Date ? inv.dueDate.toISOString() : String(inv.dueDate)) : null,
    currency: curr,
    paymentTerms: inv.paymentTerms,
    status: displayStatus,
    subtotal: toNumber(inv.subtotal),
    discountAmount: toNumber(inv.discountAmount),
    taxableAmount: toNumber(inv.taxableAmount),
    cgstAmount: toNumber(inv.cgstAmount),
    sgstAmount: toNumber(inv.sgstAmount),
    igstAmount: toNumber(inv.igstAmount),
    roundOff: toNumber(inv.roundOff),
    totalAmount: tot,
    totalAmountFormatted: formatCurrency(tot, curr),
    paidAmount: pd,
    paidAmountFormatted: formatCurrency(pd, curr),
    balanceAmount: bal,
    balanceAmountFormatted: formatCurrency(bal, curr),
    customer: inv.customer,
    company: inv.company,
    deal: inv.deal,
    quotation: inv.quotation,
    items: inv.items,
    payments: inv.payments,
    notes: inv.notes,
    terms: inv.terms,
    createdAt: inv.createdAt ? (inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt)) : undefined,
    updatedAt: inv.updatedAt ? (inv.updatedAt instanceof Date ? inv.updatedAt.toISOString() : String(inv.updatedAt)) : undefined,
  };
}
