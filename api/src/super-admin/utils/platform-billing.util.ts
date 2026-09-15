import { Prisma } from '@prisma/client';

export async function allocatePlatformInvoiceNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const config = await tx.platformBillingConfig.findFirst();
  const prefix = config?.invoicePrefix?.trim() || 'CP-INV';
  const year = new Date().getFullYear();
  const count = await tx.platformInvoice.count();
  const seq = count + 1;
  return `${prefix}-${year}-${String(seq).padStart(6, '0')}`;
}

export async function allocatePlatformPaymentNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.platformPayment.count();
  const seq = count + 1;
  return `CP-PAY-${year}-${String(seq).padStart(6, '0')}`;
}

export async function allocatePlatformRefundNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.platformRefund.count();
  const seq = count + 1;
  return `CP-REF-${year}-${String(seq).padStart(6, '0')}`;
}
