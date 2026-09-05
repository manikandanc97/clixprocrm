import { EmailQueueProducer, EMAIL_DEFAULT_JOB_OPTS } from './email-queue.producer';
import { EMAIL_JOB_NAMES } from '../interfaces/email-jobs';
import { QUEUE_NAMES } from '../queue.constants';

describe('EmailQueueProducer Suite', () => {
  let producer: EmailQueueProducer;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockImplementation(async (name, data, opts) => ({
        id: opts?.jobId || 'mock-job-id-123',
        name,
        data,
        opts,
      })),
      getJob: jest.fn().mockResolvedValue(null),
    };
    producer = new EmailQueueProducer(mockQueue);
  });

  it('should indicate queue is available when injected', () => {
    expect(producer.isQueueAvailable()).toBe(true);
  });

  it('should indicate queue is unavailable when not injected', () => {
    const disconnectedProducer = new EmailQueueProducer(undefined);
    expect(disconnectedProducer.isQueueAvailable()).toBe(false);
  });

  describe('enqueueSecurityAlert', () => {
    it('should enqueue security alert with BaseJobPayload and deterministic options', async () => {
      const result = await producer.enqueueSecurityAlert({
        tenantId: 'tenant-abc',
        userId: 'usr-123',
        to: 'user@example.com',
        deviceType: 'Desktop',
        browser: 'Chrome 122',
        operatingSystem: 'Windows 11',
        ipAddress: '192.168.1.1',
        correlationId: 'corr-sec-1',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        EMAIL_JOB_NAMES.SECURITY_ALERT,
        expect.objectContaining({
          tenantId: 'tenant-abc',
          userId: 'usr-123',
          to: 'user@example.com',
          browser: 'Chrome 122',
          correlationId: 'corr-sec-1',
          timestamp: expect.any(String),
          jobId: 'security-alert:tenant-abc:usr-123:corr-sec-1',
        }),
        expect.objectContaining({
          attempts: EMAIL_DEFAULT_JOB_OPTS.attempts,
          backoff: EMAIL_DEFAULT_JOB_OPTS.backoff,
          jobId: 'security-alert:tenant-abc:usr-123:corr-sec-1',
        }),
      );
    });

    it('should handle missing optional identifiers gracefully', async () => {
      const result = await producer.enqueueSecurityAlert({
        to: 'user@example.com',
        deviceType: 'Mobile',
        browser: 'Safari',
        operatingSystem: 'iOS',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        EMAIL_JOB_NAMES.SECURITY_ALERT,
        expect.objectContaining({
          tenantId: 'system',
          userId: 'system',
          correlationId: expect.any(String),
        }),
        expect.any(Object),
      );
    });
  });

  describe('enqueueInvoiceNotification', () => {
    it('should enqueue invoice notification with deterministic jobId', async () => {
      const result = await producer.enqueueInvoiceNotification({
        tenantId: 'tenant-xyz',
        userId: 'usr-billing-1',
        invoiceId: 'inv-999',
        options: {
          recipientEmail: 'client@example.com',
          subject: 'Custom Invoice Subject',
        },
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        EMAIL_JOB_NAMES.INVOICE_NOTIFICATION,
        expect.objectContaining({
          tenantId: 'tenant-xyz',
          userId: 'usr-billing-1',
          invoiceId: 'inv-999',
          options: expect.objectContaining({
            recipientEmail: 'client@example.com',
          }),
          jobId: 'invoice-email:inv-999:client_example_com',
        }),
        expect.objectContaining({
          jobId: 'invoice-email:inv-999:client_example_com',
        }),
      );
    });
  });

  describe('enqueuePaymentReceipt', () => {
    it('should enqueue payment receipt with deterministic payment ID', async () => {
      const result = await producer.enqueuePaymentReceipt({
        tenantId: 'tenant-xyz',
        userId: 'usr-billing-1',
        paymentId: 'pay-456',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        EMAIL_JOB_NAMES.PAYMENT_RECEIPT,
        expect.objectContaining({
          tenantId: 'tenant-xyz',
          userId: 'usr-billing-1',
          paymentId: 'pay-456',
          jobId: 'payment-receipt:pay-456',
        }),
        expect.objectContaining({
          jobId: 'payment-receipt:pay-456',
        }),
      );
    });
  });

  describe('enqueueSupportTicketEmail', () => {
    it('should enqueue support ticket email without storing binary buffers', async () => {
      const result = await producer.enqueueSupportTicketEmail({
        tenantId: 'tenant-supp',
        userId: 'usr-supp-1',
        ticketId: 'CP-SUP-2026-123456',
        subject: 'Database Timeout',
        category: 'Technical',
        priority: 'High',
        description: 'Encountered 504 error during export',
        attachmentsCount: 2,
        correlationId: 'corr-supp-123',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        EMAIL_JOB_NAMES.SUPPORT_TICKET,
        expect.objectContaining({
          tenantId: 'tenant-supp',
          userId: 'usr-supp-1',
          ticketId: 'CP-SUP-2026-123456',
          subject: 'Database Timeout',
          attachmentsCount: 2,
          jobId: 'support-ticket-email:CP-SUP-2026-123456:corr-supp-123',
        }),
        expect.objectContaining({
          jobId: 'support-ticket-email:CP-SUP-2026-123456:corr-supp-123',
        }),
      );
    });
  });

  describe('enqueueSyncInbox', () => {
    it('should enqueue sync-inbox job with deterministic jobId sync-inbox:tenantId:accountId', async () => {
      mockQueue.getJob.mockResolvedValueOnce(null);
      mockQueue.add.mockResolvedValueOnce({ id: 'sync-inbox:tenant-123:acc-456' });

      const result = await producer.enqueueSyncInbox({
        tenantId: 'tenant-123',
        accountId: 'acc-456',
        folder: 'INBOX',
      });

      expect(result.enqueued).toBe(true);
      expect(result.jobId).toBe('sync-inbox:tenant-123:acc-456');
      expect(mockQueue.add).toHaveBeenCalledWith(
        EMAIL_JOB_NAMES.SYNC_INBOX,
        expect.objectContaining({
          tenantId: 'tenant-123',
          accountId: 'acc-456',
          folder: 'INBOX',
          jobId: 'sync-inbox:tenant-123:acc-456',
        }),
        expect.objectContaining({
          jobId: 'sync-inbox:tenant-123:acc-456',
        }),
      );
    });

    it('should prevent overlapping sync if job is already active or waiting', async () => {
      mockQueue.getJob.mockResolvedValueOnce({
        getState: jest.fn().mockResolvedValue('active'),
      });

      const result = await producer.enqueueSyncInbox({
        tenantId: 'tenant-123',
        accountId: 'acc-456',
      });

      expect(result.enqueued).toBe(false);
      expect(result.reason).toContain('active');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Queue Unavailable Fallback', () => {
    it('should return { enqueued: false } if queue is disconnected', async () => {
      const disconnectedProducer = new EmailQueueProducer(undefined);
      const result = await disconnectedProducer.enqueueSecurityAlert({
        to: 'user@example.com',
        deviceType: 'Desktop',
        browser: 'Firefox',
        operatingSystem: 'Linux',
      });

      expect(result.enqueued).toBe(false);
    });
  });
});
