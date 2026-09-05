import { Test, TestingModule } from '@nestjs/testing';
import { EmailQueueProcessor } from './email-queue.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { EMAIL_JOB_NAMES } from '../interfaces/email-jobs';
import { Job } from 'bullmq';

describe('EmailQueueProcessor Suite', () => {
  let processor: EmailQueueProcessor;
  let mockPrisma: any;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'mock-msg-uuid-999',
      }),
    };

    mockPrisma = {
      withTenantContext: jest.fn().mockImplementation((context, callback) => {
        return callback({
          invoice: {
            findFirst: jest.fn(),
            update: jest.fn(),
          },
          payment: {
            findFirst: jest.fn(),
          },
          timelineEvent: {
            create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
          },
        });
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueProcessor,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    processor = module.get<EmailQueueProcessor>(EmailQueueProcessor);
    // Replace private transporter for controlled tests
    (processor as any).transporter = mockTransporter;
  });

  describe('Security Alert Job Handler', () => {
    it('should process security alert job successfully', async () => {
      const mockJob = {
        name: EMAIL_JOB_NAMES.SECURITY_ALERT,
        id: 'job-sec-1',
        data: {
          tenantId: 'tenant-sec',
          userId: 'usr-1',
          correlationId: 'corr-1',
          timestamp: new Date().toISOString(),
          to: 'security@example.com',
          deviceType: 'Desktop',
          browser: 'Firefox',
          operatingSystem: 'macOS',
          ipAddress: '10.0.0.1',
        },
      } as Job;

      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'smtp-user';

      const result = await processor.process(mockJob);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'security@example.com',
          subject: 'New sign-in detected on your ClixProCRM account',
          html: expect.stringContaining('macOS'),
        }),
      );
    });

    it('should skip delivery when recipient email is invalid', async () => {
      const mockJob = {
        name: EMAIL_JOB_NAMES.SECURITY_ALERT,
        id: 'job-sec-2',
        data: {
          tenantId: 'tenant-sec',
          correlationId: 'corr-2',
          timestamp: new Date().toISOString(),
          to: 'invalid-email',
          deviceType: 'Desktop',
          browser: 'Chrome',
          operatingSystem: 'Windows',
        },
      } as Job;

      const result = await processor.process(mockJob);
      expect(result.skipped).toBe(true);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('Invoice Notification Job Handler', () => {
    it('should process invoice notification within tenant context and record timeline event', async () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-2026-001',
        amount: 5000,
        totalAmount: 5000,
        status: 'DRAFT',
        dueDate: new Date(),
        currency: 'INR',
        tenant: { name: 'Acme Corp' },
        customer: { name: 'Jane Doe', email: 'jane@client.com' },
      };

      mockPrisma.withTenantContext.mockImplementation(async (ctx: any, cb: any) => {
        expect(ctx.tenantId).toBe('tenant-inv-1');
        return cb({
          invoice: {
            findFirst: jest.fn().mockResolvedValue(mockInvoice),
            update: jest.fn().mockResolvedValue({ ...mockInvoice, status: 'SENT' }),
          },
          timelineEvent: {
            create: jest.fn().mockResolvedValue({ id: 'tl-1' }),
          },
        });
      });

      const mockJob = {
        name: EMAIL_JOB_NAMES.INVOICE_NOTIFICATION,
        id: 'job-inv-1',
        data: {
          tenantId: 'tenant-inv-1',
          userId: 'usr-inv-1',
          correlationId: 'corr-inv-1',
          timestamp: new Date().toISOString(),
          invoiceId: 'inv-123',
          options: {
            message: 'Please pay within 15 days.',
          },
        },
      } as Job;

      const result = await processor.process(mockJob);
      expect(result.success).toBe(true);
      expect(result.message).toContain('jane@client.com');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@client.com',
          html: expect.stringContaining('INV-2026-001'),
        }),
      );
    });

    it('should handle non-existent invoice gracefully', async () => {
      mockPrisma.withTenantContext.mockImplementation(async (ctx: any, cb: any) => {
        return cb({
          invoice: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        });
      });

      const mockJob = {
        name: EMAIL_JOB_NAMES.INVOICE_NOTIFICATION,
        id: 'job-inv-2',
        data: {
          tenantId: 'tenant-inv-1',
          userId: 'usr-inv-1',
          correlationId: 'corr-inv-2',
          timestamp: new Date().toISOString(),
          invoiceId: 'non-existent',
        },
      } as Job;

      const result = await processor.process(mockJob);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invoice not found');
    });
  });

  describe('Payment Receipt Job Handler', () => {
    it('should process payment receipt and record timeline event with tenant isolation', async () => {
      const mockPayment = {
        id: 'pay-789',
        paymentNumber: 'PAY-00789',
        amount: 2500,
        currency: 'USD',
        invoice: {
          id: 'inv-100',
          invoiceNumber: 'INV-100',
          tenant: { name: 'SaaS Inc' },
          customer: { email: 'payer@company.com' },
        },
      };

      mockPrisma.withTenantContext.mockImplementation(async (ctx: any, cb: any) => {
        expect(ctx.tenantId).toBe('tenant-pay-1');
        return cb({
          payment: {
            findFirst: jest.fn().mockResolvedValue(mockPayment),
          },
          timelineEvent: {
            create: jest.fn().mockResolvedValue({ id: 'tl-pay-1' }),
          },
        });
      });

      const mockJob = {
        name: EMAIL_JOB_NAMES.PAYMENT_RECEIPT,
        id: 'job-pay-1',
        data: {
          tenantId: 'tenant-pay-1',
          userId: 'usr-pay-1',
          correlationId: 'corr-pay-1',
          timestamp: new Date().toISOString(),
          paymentId: 'pay-789',
        },
      } as Job;

      const result = await processor.process(mockJob);
      expect(result.success).toBe(true);
      expect(result.message).toContain('payer@company.com');
    });
  });

  describe('Support Ticket Job Handler', () => {
    it('should process support ticket email with sanitized payload', async () => {
      const mockJob = {
        name: EMAIL_JOB_NAMES.SUPPORT_TICKET,
        id: 'job-supp-1',
        data: {
          tenantId: 'tenant-supp-1',
          userId: 'usr-supp-1',
          correlationId: 'corr-supp-1',
          timestamp: new Date().toISOString(),
          ticketId: 'CP-SUP-2026-999999',
          subject: '<script>alert("xss")</script>Login Failure',
          category: 'Authentication',
          priority: 'Critical',
          description: 'Cannot login with MFA token',
          diagnostics: {
            browser: 'Edge',
            email: 'admin@customer.com',
          },
          attachmentsCount: 1,
        },
      } as Job;

      process.env.SUPPORT_EMAIL = 'support-desk@clixprocrm.com';

      const result = await processor.process(mockJob);
      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'support-desk@clixprocrm.com',
          html: expect.stringContaining('&lt;script&gt;alert'),
        }),
      );
    });
  });

  describe('Sync Inbox Job Handler', () => {
    it('should delegate sync-inbox job to InboundEmailService', async () => {
      const mockInboundService = {
        processSyncInboxJob: jest.fn().mockResolvedValue({
          success: true,
          messagesProcessed: 3,
          messagesSkipped: 0,
        }),
      };

      const processorWithInbound = new EmailQueueProcessor(
        mockPrisma as any,
        mockInboundService as any,
      );

      const mockJob = {
        name: EMAIL_JOB_NAMES.SYNC_INBOX,
        id: 'sync-inbox:tenant-test:acc-test',
        data: {
          tenantId: 'tenant-test',
          accountId: 'acc-test',
          folder: 'INBOX',
          correlationId: 'corr-sync-1',
          timestamp: new Date().toISOString(),
        },
      } as Job;

      const result = await processorWithInbound.process(mockJob);
      expect(result.success).toBe(true);
      expect(result.messagesProcessed).toBe(3);
      expect(mockInboundService.processSyncInboxJob).toHaveBeenCalledWith(mockJob.data);
    });
  });

  describe('Error Handling and Retries', () => {
    it('should rethrow errors during processing to trigger BullMQ retries', async () => {
      mockPrisma.withTenantContext.mockRejectedValue(
        new Error('Database connection reset during query'),
      );

      const mockJob = {
        name: EMAIL_JOB_NAMES.INVOICE_NOTIFICATION,
        id: 'job-err-1',
        data: {
          tenantId: 'tenant-err',
          userId: 'usr-err',
          correlationId: 'corr-err',
          timestamp: new Date().toISOString(),
          invoiceId: 'inv-err',
        },
      } as Job;

      await expect(processor.process(mockJob)).rejects.toThrow(
        'Database connection reset during query',
      );
    });
  });
});
