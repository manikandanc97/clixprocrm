import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import {
  WEBHOOK_JOB_NAMES,
  WebhookJobPayload,
  BillingWebhookJobPayload,
} from '../interfaces/webhook-jobs';
import { BillingWebhookService } from '../../common/billing/billing-webhook.service';

@Processor(QUEUE_NAMES.WEBHOOK)
export class WebhookQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookQueueProcessor.name);

  constructor(
    @Inject(forwardRef(() => BillingWebhookService))
    private readonly billingWebhookService: BillingWebhookService,
  ) {
    super();
  }

  async process(job: Job<WebhookJobPayload, any, string>): Promise<any> {
    this.logger.log(
      `[WEBHOOK WORKER] Processing job "${job.name}" (ID: ${job.id}, ProviderEvent: ${job.data?.providerEventId}, Tenant: ${job.data?.tenantId}, Correlation: ${job.data?.correlationId})`,
    );

    try {
      switch (job.name) {
        case WEBHOOK_JOB_NAMES.BILLING_WEBHOOK:
          return await this.handleBillingWebhook(
            job.data as BillingWebhookJobPayload,
          );

        default:
          this.logger.warn(
            `[WEBHOOK WORKER] Unknown webhook job type received: "${job.name}"`,
          );
          return { skipped: true, reason: `Unknown job type: ${job.name}` };
      }
    } catch (err: any) {
      this.logger.error(
        `[WEBHOOK WORKER] Job "${job.name}" (ID: ${job.id}, EventId: ${job.data?.providerEventId}, Tenant: ${job.data?.tenantId}, Correlation: ${job.data?.correlationId}) failed: ${err?.message || err}`,
        err?.stack,
      );
      // Re-throw to allow BullMQ bounded exponential backoff retries
      throw err;
    }
  }

  /**
   * Delegates billing webhook event processing to the authoritative BillingWebhookService.
   */
  private async handleBillingWebhook(
    payload: BillingWebhookJobPayload,
  ): Promise<any> {
    const { providerEventId, tenantId, correlationId } = payload;

    if (!providerEventId) {
      throw new Error(
        'Webhook job payload missing providerEventId: cannot process event without provider ID',
      );
    }

    if (!tenantId) {
      throw new Error(
        'Tenant context missing: tenantId is required for multi-tenant webhook processing',
      );
    }

    this.logger.log(
      `[WEBHOOK WORKER] Delegating event ${providerEventId} to BillingWebhookService (Tenant: ${tenantId}, Correlation: ${correlationId})`,
    );

    const result =
      await this.billingWebhookService.processBillingWebhookEvent(payload);

    this.logger.log(
      `[WEBHOOK WORKER] Completed processing event ${providerEventId} (processed: ${result.processed}, reason: ${result.reason || 'NONE'})`,
    );

    return result;
  }
}
