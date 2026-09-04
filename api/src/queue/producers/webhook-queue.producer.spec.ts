import {
  WebhookQueueProducer,
  WEBHOOK_DEFAULT_JOB_OPTS,
} from './webhook-queue.producer';
import { WEBHOOK_JOB_NAMES } from '../interfaces/webhook-jobs';

describe('WebhookQueueProducer Suite', () => {
  let producer: WebhookQueueProducer;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockImplementation(async (name, data, opts) => ({
        id: opts?.jobId || 'mock-job-id-123',
        name,
        data,
        opts,
      })),
    };
    producer = new WebhookQueueProducer(mockQueue);
  });

  it('should indicate queue is available when injected', () => {
    expect(producer.isQueueAvailable()).toBe(true);
  });

  it('should indicate queue is unavailable when not injected', () => {
    const disconnectedProducer = new WebhookQueueProducer(undefined);
    expect(disconnectedProducer.isQueueAvailable()).toBe(false);
  });

  describe('enqueueBillingWebhook', () => {
    it('should enqueue billing webhook job with BaseJobPayload and deterministic options', async () => {
      const result = await producer.enqueueBillingWebhook({
        providerEventId: 'evt_rzp_123456',
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        tenantId: 'tenant-cust-1',
        userId: 'system',
        planId: 'growth',
        billingCycle: 'monthly',
        seats: 3,
        orderId: 'order_123',
        paymentId: 'pay_456',
        amount: 294400,
        currency: 'INR',
        correlationId: 'corr-wh-1',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
        expect.objectContaining({
          providerEventId: 'evt_rzp_123456',
          provider: 'RAZORPAY',
          eventType: 'payment.captured',
          status: 'SUCCESS',
          tenantId: 'tenant-cust-1',
          userId: 'system',
          correlationId: 'corr-wh-1',
          timestamp: expect.any(String),
          jobId: 'billing-webhook:evt_rzp_123456',
          amount: 294400,
          currency: 'INR',
        }),
        expect.objectContaining({
          attempts: WEBHOOK_DEFAULT_JOB_OPTS.attempts,
          backoff: WEBHOOK_DEFAULT_JOB_OPTS.backoff,
          removeOnComplete: true,
          removeOnFail: 100,
          jobId: 'billing-webhook:evt_rzp_123456',
        }),
      );
    });

    it('should ensure no sensitive secrets or credentials exist in enqueued job payload', async () => {
      await producer.enqueueBillingWebhook({
        providerEventId: 'evt_sec_check',
        provider: 'RAZORPAY',
        eventType: 'order.paid',
        status: 'SUCCESS',
        tenantId: 'tenant-sec',
        amount: 50000,
        currency: 'INR',
      });

      const enqueuedData = mockQueue.add.mock.calls[0][1];
      expect(enqueuedData).not.toHaveProperty('secret');
      expect(enqueuedData).not.toHaveProperty('webhookSecret');
      expect(enqueuedData).not.toHaveProperty('signature');
      expect(enqueuedData).not.toHaveProperty('keySecret');
      expect(enqueuedData).not.toHaveProperty('apiKey');
    });

    it('should fallback to correlationId for deterministic jobId when providerEventId is empty', async () => {
      const result = await producer.enqueueBillingWebhook({
        providerEventId: '',
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        tenantId: 'tenant-fallback',
        amount: 1000,
        currency: 'INR',
        correlationId: 'corr-fallback-999',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        WEBHOOK_JOB_NAMES.BILLING_WEBHOOK,
        expect.objectContaining({
          jobId: 'billing-webhook:corr-fallback-999',
        }),
        expect.objectContaining({
          jobId: 'billing-webhook:corr-fallback-999',
        }),
      );
    });

    it('should return { enqueued: false } if queue is disconnected', async () => {
      const disconnectedProducer = new WebhookQueueProducer(undefined);
      const result = await disconnectedProducer.enqueueBillingWebhook({
        providerEventId: 'evt_no_queue',
        provider: 'RAZORPAY',
        eventType: 'payment.captured',
        status: 'SUCCESS',
        amount: 1000,
        currency: 'INR',
      });

      expect(result.enqueued).toBe(false);
    });
  });
});
