import { WebhookQueueProcessor } from './webhook-queue.processor';
import { WEBHOOK_JOB_NAMES } from '../interfaces/webhook-jobs';

describe('WebhookQueueProcessor Suite', () => {
  let processor: WebhookQueueProcessor;
  let mockBillingWebhookService: any;

  beforeEach(() => {
    mockBillingWebhookService = {
      processBillingWebhookEvent: jest.fn().mockResolvedValue({
        processed: true,
        eventId: 'evt_rzp_test_1',
        tenantId: 'tenant-cust-1',
      }),
    };

    processor = new WebhookQueueProcessor(mockBillingWebhookService);
  });

  it('should route BILLING_WEBHOOK jobs to BillingWebhookService and return result', async () => {
    const mockJob: any = {
      id: 'job-wh-1',
      name: WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
      data: {
        providerEventId: 'evt_rzp_test_1',
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        tenantId: 'tenant-cust-1',
        userId: 'system',
        correlationId: 'corr-123',
        amount: 294400,
        currency: 'INR',
      },
    };

    const result = await processor.process(mockJob);

    expect(
      mockBillingWebhookService.processBillingWebhookEvent,
    ).toHaveBeenCalledWith(mockJob.data);
    expect(result).toEqual({
      processed: true,
      eventId: 'evt_rzp_test_1',
      tenantId: 'tenant-cust-1',
    });
  });

  it('should reject jobs with missing tenantId to maintain strict tenant isolation', async () => {
    const mockJob: any = {
      id: 'job-wh-no-tenant',
      name: WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
      data: {
        providerEventId: 'evt_rzp_test_2',
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        correlationId: 'corr-no-tenant',
      },
    };

    await expect(processor.process(mockJob)).rejects.toThrow(
      'Tenant context missing',
    );
  });

  it('should reject jobs with missing providerEventId', async () => {
    const mockJob: any = {
      id: 'job-wh-no-event',
      name: WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
      data: {
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        tenantId: 'tenant-cust-1',
      },
    };

    await expect(processor.process(mockJob)).rejects.toThrow(
      'missing providerEventId',
    );
  });

  it('should handle duplicate event gracefully when service returns ALREADY_PROCESSED', async () => {
    mockBillingWebhookService.processBillingWebhookEvent.mockResolvedValueOnce({
      processed: false,
      reason: 'ALREADY_PROCESSED',
      eventId: 'evt_dup_999',
      tenantId: 'tenant-cust-1',
    });

    const mockJob: any = {
      id: 'job-wh-dup',
      name: WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
      data: {
        providerEventId: 'evt_dup_999',
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        tenantId: 'tenant-cust-1',
        correlationId: 'corr-dup',
      },
    };

    const result = await processor.process(mockJob);

    expect(result).toEqual({
      processed: false,
      reason: 'ALREADY_PROCESSED',
      eventId: 'evt_dup_999',
      tenantId: 'tenant-cust-1',
    });
  });

  it('should re-throw errors so BullMQ triggers bounded exponential retry', async () => {
    mockBillingWebhookService.processBillingWebhookEvent.mockRejectedValueOnce(
      new Error('Deadlock detected in billing transaction'),
    );

    const mockJob: any = {
      id: 'job-wh-fail',
      name: WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
      data: {
        providerEventId: 'evt_fail_123',
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        tenantId: 'tenant-cust-1',
        correlationId: 'corr-fail',
      },
    };

    await expect(processor.process(mockJob)).rejects.toThrow(
      'Deadlock detected in billing transaction',
    );
  });

  it('should skip and warn for unknown job types', async () => {
    const mockJob: any = {
      id: 'job-unknown',
      name: 'unknown-webhook-job',
      data: {
        providerEventId: 'evt_unknown',
        tenantId: 'tenant-cust-1',
      },
    };

    const result = await processor.process(mockJob);

    expect(mockBillingWebhookService.processBillingWebhookEvent).not.toHaveBeenCalled();
    expect(result).toEqual({
      skipped: true,
      reason: 'Unknown job type: unknown-webhook-job',
    });
  });
});
