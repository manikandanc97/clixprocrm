import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingGatewayService } from './billing-gateway.service';
import { getPlanDefinition, normalizePlanId } from '../plans/plan-definitions.constant';

@Controller([
  'webhooks/razorpay',
  'webhooks/stripe',
  'crm/billing/webhook',
  'api/billing/webhook',
  'super-admin/billing/webhook',
])
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingGateway: BillingGatewayService,
  ) {}

  @Post()
  async handleWebhook(
    @Req() req: any,
    @Res() res: any,
    @Headers('x-razorpay-signature') razorpaySignature?: string,
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    const sendResponse = (statusCode: number, data: any) => {
      const responseObj = res.status ? res.status(statusCode) : res;
      if (typeof responseObj.send === 'function') {
        return responseObj.send(data);
      }
      if (typeof responseObj.json === 'function') {
        return responseObj.json(data);
      }
      return data;
    };

    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const signature = razorpaySignature || stripeSignature || '';
    const providerHint = stripeSignature ? 'STRIPE' : 'RAZORPAY';

    this.logger.log(`[WEBHOOK INGESTED] Route: ${req.url || '/api/webhooks/razorpay'} | Provider: ${providerHint} | Signature present: ${Boolean(signature)}`);

    try {
      const parsedEvent = await this.billingGateway.verifyAndParseWebhook(
        {
          rawBody,
          signature,
          secret: '',
        },
        providerHint,
      );

      if (!parsedEvent) {
        this.logger.warn('[WEBHOOK REJECTED] Signature verification failed or unparseable event payload');
        return sendResponse(HttpStatus.BAD_REQUEST, {
          success: false,
          message: 'Webhook signature verification failed.',
        });
      }

      let { eventId, provider, eventType, tenantId, planId, billingCycle, seats, amount, currency, status, rawPayload, eventTimestamp } = parsedEvent;
      this.logger.log(`[WEBHOOK PARSED] Event: ${eventType} (${eventId}) | Status: ${status} | TenantId: ${tenantId || 'unresolved'} | Plan: ${planId || 'n/a'}`);

      // 1. Enforce strict Database Idempotency Check
      const existingEvent = await this.prisma.platformWebhookEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent && existingEvent.status === 'PROCESSED') {
        this.logger.log(`[WEBHOOK IDEMPOTENT] Event '${eventId}' already processed previously. Skipping.`);
        return sendResponse(HttpStatus.OK, {
          success: true,
          message: 'Event already processed.',
          eventId,
        });
      }

      // If tenantId was not in event notes, attempt lookup via provider order or subscription
      if (!tenantId && (parsedEvent.orderId || parsedEvent.paymentId)) {
        const matchingSub = await this.prisma.platformSubscription.findFirst({
          where: {
            OR: [
              { providerOrderId: parsedEvent.orderId },
              { providerSubscriptionId: parsedEvent.paymentId },
            ],
          },
          select: { tenantId: true, planId: true, billingCycle: true, seats: true },
        });

        if (matchingSub) {
          tenantId = matchingSub.tenantId;
          planId = planId || matchingSub.planId;
          billingCycle = billingCycle || (matchingSub.billingCycle as any);
          seats = seats || matchingSub.seats;
          this.logger.log(`[WEBHOOK TENANT RESOLVED] Resolved tenant '${tenantId}' via matching provider order/subscription.`);
        }
      }

      // 2. Process Business State Mutations in an Atomic Transaction
      await this.prisma.$transaction(async (tx) => {
        // Record event in PlatformWebhookEvent table
        await tx.platformWebhookEvent.upsert({
          where: { eventId },
          update: {
            status: 'PROCESSED',
            processedAt: new Date(),
          },
          create: {
            provider,
            eventId,
            eventType,
            payload: rawPayload,
            status: 'PROCESSED',
            processedAt: new Date(),
          },
        });

        // If target tenant is identified and payment is successful
        if (tenantId && (status === 'SUCCESS' || eventType === 'payment.captured' || eventType === 'order.paid')) {
          const tenant = await tx.tenant.findUnique({
            where: { id: tenantId },
          });

          // Skip if platform internal tenant
          if (tenant && (tenant.isPlatformTenant === true || tenant.type === 'PLATFORM')) {
            return;
          }

          if (tenant) {
            const normPlan = normalizePlanId(planId || tenant.plan || 'growth');
            const planDef = getPlanDefinition(normPlan);
            const cycle = (billingCycle as 'monthly' | 'annual') || (tenant.billingCycle as any) || 'monthly';
            const seatCount = seats || 1;

            const now = eventTimestamp || new Date();
            const periodEnd = new Date(now);
            if (cycle === 'annual') {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            const unitPrice = cycle === 'annual' ? planDef.annualPriceNum : planDef.priceNum;
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
              providerSubscriptionId: parsedEvent.paymentId || parsedEvent.orderId,
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
            const invoiceNumber = `CP-INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

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
            const paymentNumber = `CP-PAY-${now.getFullYear()}-${String(paymentCount + 1).padStart(6, '0')}`;

            await tx.platformPayment.create({
              data: {
                platformInvoiceId: platformInvoice?.id || `inv_${now.getTime()}`,
                tenantId,
                paymentNumber,
                gatewayTransactionId: parsedEvent.paymentId,
                gatewayProvider: provider,
                amount: totalAmount,
                currency: currency || 'INR',
                status: 'SUCCESS',
                paymentDate: now,
                providerPaymentId: parsedEvent.paymentId,
                providerOrderId: parsedEvent.orderId,
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
                  eventId,
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

      return sendResponse(HttpStatus.OK, {
        success: true,
        message: 'Webhook processed successfully.',
        eventId,
      });
    } catch (err: any) {
      this.logger.error(`[WEBHOOK PROCESSING ERROR]: ${err.message}`, err.stack);
      return sendResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
        success: false,
        message: 'Internal error processing webhook event.',
      });
    }
  }
}
