import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../queue.constants';
import {
  WEBHOOK_JOB_NAMES,
  BillingWebhookJobPayload,
} from '../interfaces/webhook-jobs';

export const WEBHOOK_DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
  removeOnComplete: true,
  removeOnFail: 100,
} as const;

@Injectable()
export class WebhookQueueProducer {
  private readonly logger = new Logger(WebhookQueueProducer.name);

  constructor(
    @Optional()
    @InjectQueue(QUEUE_NAMES.WEBHOOK)
    private readonly webhookQueue?: Queue,
  ) {}

  /**
   * Helper to check if queue is available (e.g. during disconnected/testing environments).
   */
  public isQueueAvailable(): boolean {
    return Boolean(this.webhookQueue);
  }

  /**
   * Enqueues a billing webhook event into crm-webhook-queue.
   *
   * Enforces:
   * - Deterministic provider-event-based job identity: billing-webhook:{providerEventId}
   * - Typed BaseJobPayload with correlationId and verified tenantId
   * - Bounded exponential backoff retry policy
   * - No sensitive secrets in payload
   */
  async enqueueBillingWebhook(
    payload: Omit<BillingWebhookJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const tenantId = payload.tenantId || 'system';
    const userId = payload.userId || 'system';

    const safeEventId = (payload.providerEventId || correlationId).replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );
    const jobId = payload.jobId || `billing-webhook:${safeEventId}`;

    const fullPayload: BillingWebhookJobPayload = {
      ...payload,
      tenantId,
      userId,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.webhookQueue) {
      this.logger.warn(
        `[WEBHOOK QUEUE] Webhook queue not initialized; cannot enqueue billing webhook event ${payload.providerEventId}`,
      );
      return { enqueued: false };
    }

    const job = await this.webhookQueue.add(
      WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
      fullPayload,
      {
        ...WEBHOOK_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[WEBHOOK QUEUE] Enqueued billing webhook job ${job.id} for event ${payload.providerEventId} (provider: ${payload.provider}, tenant: ${tenantId}, correlationId: ${correlationId})`,
    );

    return { enqueued: true, jobId: job.id };
  }
}
