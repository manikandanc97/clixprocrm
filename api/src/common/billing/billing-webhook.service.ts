import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPlanDefinition,
  normalizePlanId,
} from '../plans/plan-definitions.constant';
import { BillingWebhookJobPayload } from '../../queue/interfaces/webhook-jobs';

export interface WebhookProcessResult {
  processed: boolean;
  reason?: string;
  eventId: string;
  tenantId?: string;
}

@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processes a verified billing webhook event.
   *
   * Enforces:
   * 1. Strict persistent idempotency via PlatformWebhookEvent table
   * 2. Multi-tenant database context isolation (via withTenantContext / $transaction)
   * 3. Tenant validation & platform workspace protection
   * 4. Subscription upsert, invoice generation, payment creation, and tenant sync
   * 5. Audit log generation
   */
  async processBillingWebhookEvent(
    payload: BillingWebhookJobPayload,
  ): Promise<WebhookProcessResult> {
    const {
      providerEventId,
      provider,
      eventType,
      status,
      planId,
      billingCycle,
      seats,
      amount,
      currency,
      orderId,
      paymentId,
      eventTimestamp,
    } = payload;

    let tenantId = payload.tenantId;

    this.logger.log(
      `[BILLING WEBHOOK SERVICE] Processing event ${eventType} (${providerEventId}) | Status: ${status} | Provider: ${provider} | Tenant: ${tenantId || 'unresolved'}`,
    );

    // 1. Enforce strict Database Idempotency Check
    const existingEvent = await this.prisma.platformWebhookEvent.findUnique({
      where: { eventId: providerEventId },
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      this.logger.log(
        `[BILLING WEBHOOK IDEMPOTENT] Event '${providerEventId}' already processed previously. Skipping.`,
      );
      return {
        processed: false,
        reason: 'ALREADY_PROCESSED',
        eventId: providerEventId,
        tenantId,
      };
    }

    // Attempt tenant resolution via order or subscription if not resolved
    if ((!tenantId || tenantId === 'system') && (orderId || paymentId)) {
      const matchingSub = await this.prisma.platformSubscription.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ providerOrderId: orderId }] : []),
            ...(paymentId ? [{ providerSubscriptionId: paymentId }] : []),
          ],
        },
        select: { tenantId: true, planId: true, billingCycle: true, seats: true },
      });

      if (matchingSub) {
        tenantId = matchingSub.tenantId;
        this.logger.log(
          `[BILLING WEBHOOK TENANT RESOLVED] Resolved tenant '${tenantId}' via matching provider order/subscription.`,
        );
      }
    }

    const executeInContext = async (cb: (tx: any) => Promise<any>) => {
      if (
        typeof this.prisma.withTenantContext === 'function' &&
        tenantId &&
        tenantId !== 'system'
      ) {
        return this.prisma.withTenantContext(
          { tenantId, userId: payload.userId },
          cb,
        );
      }
      return this.prisma.$transaction(cb);
    };

    // 2. Process Business State Mutations in an Atomic Transaction
    await executeInContext(async (tx) => {
      // Record event in PlatformWebhookEvent table
      await tx.platformWebhookEvent.upsert({
        where: { eventId: providerEventId },
        update: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
        create: {
          provider,
          eventId: providerEventId,
          eventType,
          payload: {
            providerEventId,
            eventType,
            status,
            amount,
            currency,
            orderId,
            paymentId,
          },
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });

      // If target tenant is identified and payment is successful
      if (
        tenantId &&
        tenantId !== 'system' &&
        (status === 'SUCCESS' ||
          eventType === 'payment.captured' ||
          eventType === 'order.paid')
      ) {
        const tenant = await tx.tenant.findUnique({
          where: { id: tenantId },
        });

        // Skip if platform internal tenant
        if (
          tenant &&
          (tenant.isPlatformTenant === true || tenant.type === 'PLATFORM')
        ) {
          this.logger.log(
            `[BILLING WEBHOOK] Tenant ${tenantId} is platform internal workspace. Skipping customer mutations.`,
          );
          return;
        }

        if (tenant) {
          const normPlan = normalizePlanId(planId || tenant.plan || 'growth');
          const planDef = getPlanDefinition(normPlan);
          const cycle =
            (billingCycle as 'monthly' | 'annual') ||
            (tenant.billingCycle as any) ||
            'monthly';
          const seatCount = seats || 1;

          const now = eventTimestamp ? new Date(eventTimestamp) : new Date();
          const periodEnd = new Date(now);
          if (cycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          const unitPrice =
            cycle === 'annual' ? planDef.annualPriceNum : planDef.priceNum;
          const subtotal = Math.round(unitPrice * seatCount);
          const taxRate = currency === 'INR' ? 18.0 : 0;
          const taxAmount = Math.round((subtotal * taxRate) / 100);
          const totalAmount = subtotal + taxAmount;

          // Upsert PlatformSubscription
          const existingSub = await tx.platformSubscription.findFirst({
            where: { tenantId },
          });

          const subData = {
            tenantId,
            planId: normPlan,
            billingCycle: cycle,
            seats: seatCount,
            status: 'ACTIVE',
            unitPrice,
            recurringAmount: subtotal,
            currency: currency || 'INR',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            providerSubscriptionId: paymentId || orderId,
          };

          const subscription = existingSub
            ? await tx.platformSubscription.update({
                where: { id: existingSub.id },
                data: subData,
              })
            : await tx.platformSubscription.create({
                data: subData,
              });

          // Generate Platform Invoice
          const invoiceCount = await tx.platformInvoice.count();
          const invoiceNumber = `CP-INV-${now.getFullYear()}-${String(
            invoiceCount + 1,
          ).padStart(6, '0')}`;

          const platformInvoice = await tx.platformInvoice.create({
            data: {
              tenantId,
              subscriptionId: subscription?.id || null,
              invoiceNumber,
              planName: planDef.name,
              billingCycle: cycle,
              seats: seatCount,
              invoiceDate: now,
              dueDate: now,
              currency: currency || 'INR',
              subtotal,
              discountAmount: 0,
              taxRate,
              taxAmount,
              totalAmount,
              paidAmount: totalAmount,
              status: 'PAID',
              paymentStatus: 'PAID',
              paidAt: now,
              items: {
                create: [
                  {
                    description: `${planDef.name} Subscription (${seatCount} seats, ${cycle})`,
                    quantity: seatCount,
                    unitPrice,
                    taxAmount,
                    totalAmount,
                  },
                ],
              },
            },
          });

          // Record Platform Payment
          const paymentCount = await tx.platformPayment.count();
          const paymentNumber = `CP-PAY-${now.getFullYear()}-${String(
            paymentCount + 1,
          ).padStart(6, '0')}`;

          await tx.platformPayment.create({
            data: {
              platformInvoiceId: platformInvoice?.id || `inv_${now.getTime()}`,
              tenantId,
              paymentNumber,
              gatewayTransactionId: paymentId,
              gatewayProvider: provider,
              amount: totalAmount,
              currency: currency || 'INR',
              status: 'SUCCESS',
              paymentDate: now,
              providerPaymentId: paymentId,
              providerOrderId: orderId,
            },
          });

          // Synchronize Tenant
          await tx.tenant.update({
            where: { id: tenantId },
            data: {
              plan: normPlan,
              billingCycle: cycle,
              subscriptionStatus: 'ACTIVE',
              currentPeriodEnd: periodEnd,
            },
          });

          // Record Audit Log
          await tx.auditLog.create({
            data: {
              tenantId,
              action: 'WEBHOOK_SUBSCRIPTION_ACTIVATED',
              module: 'WEBHOOK',
              details: {
                provider,
                eventId: providerEventId,
                eventType,
                planId: normPlan,
                seats: seatCount,
                totalAmount,
                invoiceNumber,
              },
            },
          });
        }
      }
    });

    return {
      processed: true,
      eventId: providerEventId,
      tenantId,
    };
  }
}
