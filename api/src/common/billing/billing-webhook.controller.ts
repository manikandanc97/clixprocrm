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
import { WebhookQueueProducer } from '../../queue/producers/webhook-queue.producer';

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
    private readonly webhookQueueProducer: WebhookQueueProducer,
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

    const rawBody =
      req.rawBody ||
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const signature = razorpaySignature || stripeSignature || '';
    const providerHint = stripeSignature ? 'STRIPE' : 'RAZORPAY';

    this.logger.log(
      `[WEBHOOK INGESTED] Route: ${req.url || '/api/webhooks/razorpay'} | Provider: ${providerHint} | Signature present: ${Boolean(signature)}`,
    );

    try {
      // 1. SYNCHRONOUS Signature Verification and Payload Normalization
      const parsedEvent = await this.billingGateway.verifyAndParseWebhook(
        {
          rawBody,
          signature,
          secret: '',
        },
        providerHint,
      );

      if (!parsedEvent) {
        this.logger.warn(
          '[WEBHOOK REJECTED] Signature verification failed or unparseable event payload',
        );
        return sendResponse(HttpStatus.BAD_REQUEST, {
          success: false,
          message: 'Webhook signature verification failed.',
        });
      }

      let {
        eventId,
        provider,
        eventType,
        tenantId,
        planId,
        billingCycle,
        seats,
        amount,
        currency,
        status,
        eventTimestamp,
      } = parsedEvent;

      this.logger.log(
        `[WEBHOOK PARSED] Event: ${eventType} (${eventId}) | Status: ${status} | TenantId: ${tenantId || 'unresolved'} | Plan: ${planId || 'n/a'}`,
      );

      // 2. Enforce strict Database Idempotency Check
      const existingEvent = await this.prisma.platformWebhookEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent && existingEvent.status === 'PROCESSED') {
        this.logger.log(
          `[WEBHOOK IDEMPOTENT] Event '${eventId}' already processed previously. Skipping.`,
        );
        return sendResponse(HttpStatus.OK, {
          success: true,
          message: 'Event already processed.',
          eventId,
        });
      }

      // 3. Resolve trusted tenant context prior to enqueueing
      if (!tenantId && (parsedEvent.orderId || parsedEvent.paymentId)) {
        const matchingSub = await this.prisma.platformSubscription.findFirst({
          where: {
            OR: [
              ...(parsedEvent.orderId
                ? [{ providerOrderId: parsedEvent.orderId }]
                : []),
              ...(parsedEvent.paymentId
                ? [{ providerSubscriptionId: parsedEvent.paymentId }]
                : []),
            ],
          },
          select: {
            tenantId: true,
            planId: true,
            billingCycle: true,
            seats: true,
          },
        });

        if (matchingSub) {
          tenantId = matchingSub.tenantId;
          planId = planId || matchingSub.planId;
          billingCycle = billingCycle || (matchingSub.billingCycle as any);
          seats = seats || matchingSub.seats;
          this.logger.log(
            `[WEBHOOK TENANT RESOLVED] Resolved tenant '${tenantId}' via matching provider order/subscription.`,
          );
        }
      }

      // 4. Asynchronous Queue Enqueue with Deterministic Job Identity
      const isoTimestamp = eventTimestamp
        ? typeof eventTimestamp === 'string'
          ? eventTimestamp
          : (eventTimestamp as Date).toISOString()
        : new Date().toISOString();

      const enqueueResult =
        await this.webhookQueueProducer.enqueueBillingWebhook({
          providerEventId: eventId,
          provider: provider as 'RAZORPAY' | 'STRIPE' | 'MANUAL',
          eventType,
          status: status as any,
          tenantId: tenantId || 'system',
          planId,
          billingCycle: billingCycle as any,
          seats,
          orderId: parsedEvent.orderId,
          paymentId: parsedEvent.paymentId,
          amount,
          currency: currency || 'INR',
          eventTimestamp: isoTimestamp,
        });

      if (!enqueueResult || !enqueueResult.enqueued) {
        this.logger.error(
          `[WEBHOOK ENQUEUE FAILED] Webhook queue failed to accept event '${eventId}'`,
        );
        return sendResponse(HttpStatus.SERVICE_UNAVAILABLE, {
          success: false,
          message:
            'Webhook processing queue temporarily unavailable. Please retry.',
          eventId,
        });
      }

      // 5. Fast HTTP 200 Acknowledgement
      return sendResponse(HttpStatus.OK, {
        success: true,
        message: 'Webhook processed successfully.',
        eventId,
      });
    } catch (err: any) {
      this.logger.error(
        `[WEBHOOK PROCESSING ERROR]: ${err.message}`,
        err.stack,
      );
      return sendResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
        success: false,
        message: 'Internal error processing webhook event.',
      });
    }
  }
}
