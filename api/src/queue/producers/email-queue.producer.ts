import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../queue.constants';
import {
  EMAIL_JOB_NAMES,
  SecurityAlertJobPayload,
  InvoiceNotificationJobPayload,
  PaymentReceiptJobPayload,
  SupportTicketJobPayload,
} from '../interfaces/email-jobs';

export const EMAIL_DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
  removeOnComplete: true,
  removeOnFail: 100,
} as const;

@Injectable()
export class EmailQueueProducer {
  private readonly logger = new Logger(EmailQueueProducer.name);

  constructor(
    @Optional()
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private readonly emailQueue?: Queue,
  ) {}

  /**
   * Helper to check if queue is available (e.g. during testing or disconnected environments).
   */
  public isQueueAvailable(): boolean {
    return Boolean(this.emailQueue);
  }

  /**
   * Enqueues a security / new-device sign-in alert email.
   */
  async enqueueSecurityAlert(
    payload: Omit<SecurityAlertJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const tenantId = payload.tenantId || 'system';
    const userId = payload.userId || 'system';
    const jobId =
      payload.jobId ||
      `security-alert:${tenantId}:${userId}:${correlationId}`;

    const fullPayload: SecurityAlertJobPayload = {
      ...payload,
      tenantId,
      userId,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.emailQueue) {
      this.logger.warn(
        `Email queue not initialized; cannot enqueue security alert for ${payload.to}`,
      );
      return { enqueued: false };
    }

    const job = await this.emailQueue.add(
      EMAIL_JOB_NAMES.SECURITY_ALERT,
      fullPayload,
      {
        ...EMAIL_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[EMAIL QUEUE] Enqueued security alert job ${job.id} for user ${userId} (correlationId: ${correlationId})`,
    );
    return { enqueued: true, jobId: job.id };
  }

  /**
   * Enqueues an invoice notification email.
   */
  async enqueueInvoiceNotification(
    payload: Omit<InvoiceNotificationJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const recipientSuffix = payload.options?.recipientEmail
      ? payload.options.recipientEmail.replace(/[^a-zA-Z0-9_-]/g, '_')
      : 'default';
    const jobId =
      payload.jobId ||
      `invoice-email:${payload.invoiceId}:${recipientSuffix}`;

    const fullPayload: InvoiceNotificationJobPayload = {
      ...payload,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.emailQueue) {
      this.logger.warn(
        `Email queue not initialized; cannot enqueue invoice notification for invoice ${payload.invoiceId}`,
      );
      return { enqueued: false };
    }

    const job = await this.emailQueue.add(
      EMAIL_JOB_NAMES.INVOICE_NOTIFICATION,
      fullPayload,
      {
        ...EMAIL_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[EMAIL QUEUE] Enqueued invoice notification job ${job.id} for invoice ${payload.invoiceId} (tenant: ${payload.tenantId})`,
    );
    return { enqueued: true, jobId: job.id };
  }

  /**
   * Enqueues a payment receipt email.
   */
  async enqueuePaymentReceipt(
    payload: Omit<PaymentReceiptJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const jobId =
      payload.jobId || `payment-receipt:${payload.paymentId}`;

    const fullPayload: PaymentReceiptJobPayload = {
      ...payload,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.emailQueue) {
      this.logger.warn(
        `Email queue not initialized; cannot enqueue payment receipt for payment ${payload.paymentId}`,
      );
      return { enqueued: false };
    }

    const job = await this.emailQueue.add(
      EMAIL_JOB_NAMES.PAYMENT_RECEIPT,
      fullPayload,
      {
        ...EMAIL_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[EMAIL QUEUE] Enqueued payment receipt job ${job.id} for payment ${payload.paymentId} (tenant: ${payload.tenantId})`,
    );
    return { enqueued: true, jobId: job.id };
  }

  /**
   * Enqueues a support ticket email notification.
   */
  async enqueueSupportTicketEmail(
    payload: Omit<SupportTicketJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const jobId =
      payload.jobId ||
      `support-ticket-email:${payload.ticketId}:${correlationId}`;

    const fullPayload: SupportTicketJobPayload = {
      ...payload,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.emailQueue) {
      this.logger.warn(
        `Email queue not initialized; cannot enqueue support ticket email for ticket ${payload.ticketId}`,
      );
      return { enqueued: false };
    }

    const job = await this.emailQueue.add(
      EMAIL_JOB_NAMES.SUPPORT_TICKET,
      fullPayload,
      {
        ...EMAIL_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[EMAIL QUEUE] Enqueued support ticket email job ${job.id} for ticket ${payload.ticketId} (tenant: ${payload.tenantId})`,
    );
    return { enqueued: true, jobId: job.id };
  }
}
