import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SubscriptionQuote } from './subscription-entitlement.interface';

export interface PaymentActivationParams {
  tenantId: string;
  orderId: string;
  paymentId: string;
  signature: string;
  quote: SubscriptionQuote;
  billingCycle: 'monthly' | 'annual';
  now: Date;
  periodEnd: Date;
  userId?: string;
}

/**
 * Executes the atomic database transaction for payment activation:
 * 1. Checks idempotent replay protection.
 * 2. Synchronizes PlatformSubscription.
 * 3. Creates PlatformInvoice.
 * 4. Records PlatformPayment.
 * 5. Updates Tenant subscription status.
 * 6. Writes AuditLog.
 */
export async function executePaymentActivationTransaction(
  tx: Prisma.TransactionClient,
  params: PaymentActivationParams,
  logger: { log: (msg: string) => void },
) {
  const {
    tenantId,
    orderId,
    paymentId,
    signature,
    quote,
    billingCycle,
    now,
    periodEnd,
    userId,
  } = params;

  // 1. Replay Protection & Tenant Isolation
  const existingPayment = await tx.platformPayment.findFirst({
    where: {
      OR: [
        { providerPaymentId: paymentId },
        { gatewayTransactionId: paymentId },
      ],
    },
  });

  if (existingPayment) {
    if (existingPayment.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Payment identifier does not belong to this tenant.',
      );
    }
    if (existingPayment.status === 'SUCCESS') {
      logger.log(
        `[PAYMENT IDEMPOTENT] Payment '${paymentId}' already recorded as SUCCESS.`,
      );
      const currentSub = await tx.platformSubscription.findFirst({
        where: { tenantId },
      });
      const currentInv = await tx.platformInvoice.findFirst({
        where: { id: existingPayment.platformInvoiceId },
      });
      return { subscription: currentSub, invoice: currentInv };
    }
  }

  // 2. Synchronize or create PlatformSubscription
  const existingSub = await tx.platformSubscription.findFirst({
    where: { tenantId },
  });

  const subData = {
    tenantId,
    planId: quote.planId,
    billingCycle,
    seats: quote.seats,
    status: 'ACTIVE' as const,
    unitPrice: quote.unitPricePerMonth,
    recurringAmount: quote.subtotal,
    currency: quote.currency,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    providerOrderId: orderId,
  };

  const subscription = existingSub
    ? await tx.platformSubscription.update({
        where: { id: existingSub.id },
        data: subData,
      })
    : await tx.platformSubscription.create({
        data: subData,
      });

  // 3. Generate Platform Invoice
  const invoiceCount = await tx.platformInvoice.count();
  const invoiceNumber = `CP-INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

  const platformInvoice = await tx.platformInvoice.create({
    data: {
      tenantId,
      subscriptionId: subscription?.id || null,
      invoiceNumber,
      planName: quote.planName,
      billingCycle,
      seats: quote.seats,
      invoiceDate: now,
      dueDate: now,
      currency: quote.currency,
      subtotal: quote.subtotal,
      discountAmount: quote.annualDiscountAmount,
      taxRate: quote.taxRatePercentage,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      paidAmount: quote.totalAmount,
      status: 'PAID',
      paymentStatus: 'PAID',
      paidAt: now,
      items: {
        create: [
          {
            description: `${quote.planName} Plan Subscription (${quote.seats} seats, ${billingCycle})`,
            quantity: quote.seats,
            unitPrice: quote.unitPricePerMonth,
            taxAmount: quote.taxAmount,
            totalAmount: quote.totalAmount,
          },
        ],
      },
    },
  });

  // 4. Record Platform Payment
  const paymentCount = await tx.platformPayment.count();
  const paymentNumber = `CP-PAY-${now.getFullYear()}-${String(paymentCount + 1).padStart(6, '0')}`;

  await tx.platformPayment.create({
    data: {
      platformInvoiceId: platformInvoice?.id || `inv_${now.getTime()}`,
      tenantId,
      paymentNumber,
      gatewayTransactionId: paymentId,
      gatewayProvider: 'RAZORPAY',
      amount: quote.totalAmount,
      currency: quote.currency,
      paymentMethod: 'CARD',
      status: 'SUCCESS',
      paymentDate: now,
      providerPaymentId: paymentId,
      providerOrderId: orderId,
      providerSignature: signature,
    },
  });

  // 5. Update Tenant Record
  await tx.tenant.update({
    where: { id: tenantId },
    data: {
      plan: quote.planId,
      billingCycle,
      subscriptionStatus: 'ACTIVE',
      currentPeriodEnd: periodEnd,
    },
  });

  // 6. Audit Log
  await tx.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'PAYMENT_VERIFIED_AND_SUBSCRIPTION_ACTIVATED',
      module: 'BILLING',
      details: {
        planId: quote.planId,
        seats: quote.seats,
        billingCycle,
        amount: quote.totalAmount,
        invoiceNumber,
        paymentNumber,
        gatewayPaymentId: paymentId,
        orderId,
      },
    },
  });

  return {
    subscription,
    invoice: platformInvoice,
  };
}
