import { Test, TestingModule } from '@nestjs/testing';
import { BillingWebhookController } from '../billing-webhook.controller';
import { BillingWebhookService } from '../billing-webhook.service';
import { BillingGatewayService } from '../billing-gateway.service';
import { WebhookQueueProducer } from '../../../queue/producers/webhook-queue.producer';
import { PrismaService } from '../../../prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';

describe('Billing Webhook Architecture & Queue Migration Suite', () => {
  let controller: BillingWebhookController;
  let service: BillingWebhookService;
  let prisma: PrismaService;
  let billingGateway: BillingGatewayService;
  let webhookQueueProducer: WebhookQueueProducer;

  const mockPrisma = {
    platformWebhookEvent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    platformSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    platformInvoice: {
      count: jest.fn().mockResolvedValue(10),
      create: jest.fn(),
    },
    platformPayment: {
      count: jest.fn().mockResolvedValue(10),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    withTenantContext: jest.fn((opts, callback) => callback(mockPrisma)),
  };

  const mockBillingGateway = {
    verifyAndParseWebhook: jest.fn(),
  };

  const mockWebhookQueueProducer = {
    isQueueAvailable: jest.fn().mockReturnValue(true),
    enqueueBillingWebhook: jest.fn().mockResolvedValue({
      enqueued: true,
      jobId: 'billing-webhook:evt_new_123',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.platformSubscription.create.mockResolvedValue({ id: 'sub-created-1' });
    mockPrisma.platformSubscription.update.mockResolvedValue({ id: 'sub-updated-1' });
    mockPrisma.platformInvoice.create.mockResolvedValue({
      id: 'inv-created-1',
      invoiceNumber: 'CP-INV-2026-000001',
    });
    mockPrisma.platformPayment.create.mockResolvedValue({ id: 'pay-created-1' });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingWebhookController],
      providers: [
        BillingWebhookService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BillingGatewayService, useValue: mockBillingGateway },
        { provide: WebhookQueueProducer, useValue: mockWebhookQueueProducer },
      ],
    }).compile();

    controller = module.get<BillingWebhookController>(BillingWebhookController);
    service = module.get<BillingWebhookService>(BillingWebhookService);
    prisma = module.get<PrismaService>(PrismaService);
    billingGateway = module.get<BillingGatewayService>(BillingGatewayService);
    webhookQueueProducer = module.get<WebhookQueueProducer>(WebhookQueueProducer);
  });

  describe('BillingWebhookController (Fast HTTP ACK & Enqueueing)', () => {
    it('should reject webhook if signature verification fails with HTTP 400', async () => {
      mockBillingGateway.verifyAndParseWebhook.mockResolvedValue(null);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.handleWebhook(
        { rawBody: '{"invalid":"payload"}' },
        mockRes,
        'invalid_signature',
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Webhook signature verification failed.',
        }),
      );
      expect(mockWebhookQueueProducer.enqueueBillingWebhook).not.toHaveBeenCalled();
    });

    it('should acknowledge fast with HTTP 200 without enqueueing if event already PROCESSED', async () => {
      const mockEvent = {
        provider: 'RAZORPAY',
        eventId: 'evt_already_processed_999',
        eventType: 'payment.captured',
        tenantId: 'tenant-customer-1',
        planId: 'growth',
        billingCycle: 'monthly',
        seats: 5,
        amount: 294400,
        currency: 'INR',
        status: 'SUCCESS',
        rawPayload: {},
        eventTimestamp: new Date(),
      };

      mockBillingGateway.verifyAndParseWebhook.mockResolvedValue(mockEvent);
      mockPrisma.platformWebhookEvent.findUnique.mockResolvedValue({
        id: 'internal-id',
        eventId: 'evt_already_processed_999',
        status: 'PROCESSED',
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.handleWebhook(
        { rawBody: JSON.stringify(mockEvent) },
        mockRes,
        'valid_sig',
      );

      expect(mockWebhookQueueProducer.enqueueBillingWebhook).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Event already processed.',
          eventId: 'evt_already_processed_999',
        }),
      );
    });

    it('should verify signature synchronously, enqueue job to BullMQ, and return fast HTTP 200 ACK', async () => {
      const mockEvent = {
        provider: 'RAZORPAY',
        eventId: 'evt_new_123',
        eventType: 'payment.captured',
        tenantId: 'tenant-customer-1',
        planId: 'growth',
        billingCycle: 'monthly',
        seats: 5,
        amount: 294400,
        currency: 'INR',
        status: 'SUCCESS',
        rawPayload: {},
        eventTimestamp: new Date(),
      };

      mockBillingGateway.verifyAndParseWebhook.mockResolvedValue(mockEvent);
      mockPrisma.platformWebhookEvent.findUnique.mockResolvedValue(null);

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.handleWebhook(
        { rawBody: JSON.stringify(mockEvent) },
        mockRes,
        'valid_sig',
      );

      // Verify controller did NOT execute database transaction synchronously
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      // Verify job enqueued to BullMQ producer
      expect(mockWebhookQueueProducer.enqueueBillingWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          providerEventId: 'evt_new_123',
          provider: 'RAZORPAY',
          eventType: 'payment.captured',
          tenantId: 'tenant-customer-1',
          planId: 'growth',
          amount: 294400,
          currency: 'INR',
        }),
      );
      // Fast HTTP 200 response
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Webhook processed successfully.',
          eventId: 'evt_new_123',
        }),
      );
    });

    it('should return 503 SERVICE_UNAVAILABLE if queue enqueue fails to prevent silent message loss', async () => {
      const mockEvent = {
        provider: 'RAZORPAY',
        eventId: 'evt_queue_fail',
        eventType: 'payment.captured',
        tenantId: 'tenant-customer-1',
        status: 'SUCCESS',
        amount: 1000,
        currency: 'INR',
      };

      mockBillingGateway.verifyAndParseWebhook.mockResolvedValue(mockEvent);
      mockPrisma.platformWebhookEvent.findUnique.mockResolvedValue(null);
      mockWebhookQueueProducer.enqueueBillingWebhook.mockResolvedValueOnce({
        enqueued: false,
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.handleWebhook(
        { rawBody: JSON.stringify(mockEvent) },
        mockRes,
        'valid_sig',
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('temporarily unavailable'),
        }),
      );
    });
  });

  describe('BillingWebhookService (Authoritative Asynchronous Business Logic)', () => {
    it('should process new valid webhook and update tenant subscription inside a transaction', async () => {
      const payload = {
        tenantId: 'tenant-customer-1',
        userId: 'system',
        correlationId: 'corr-async-1',
        timestamp: new Date().toISOString(),
        providerEventId: 'evt_new_123',
        provider: 'RAZORPAY' as const,
        eventType: 'payment.captured',
        status: 'SUCCESS' as const,
        planId: 'growth',
        billingCycle: 'monthly' as const,
        seats: 5,
        amount: 294400,
        currency: 'INR',
        eventTimestamp: new Date().toISOString(),
      };

      mockPrisma.platformWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-customer-1',
        name: 'Acme Corp',
        plan: 'free',
        isPlatformTenant: false,
        type: 'CUSTOMER',
      });

      const result = await service.processBillingWebhookEvent(payload);

      expect(result.processed).toBe(true);
      expect(mockPrisma.platformWebhookEvent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eventId: 'evt_new_123' } }),
      );
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenant-customer-1' },
          data: expect.objectContaining({
            plan: 'growth',
            subscriptionStatus: 'ACTIVE',
          }),
        }),
      );
      expect(mockPrisma.platformInvoice.create).toHaveBeenCalled();
      expect(mockPrisma.platformPayment.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should enforce idempotency in service: duplicate event returns without re-executing transactions', async () => {
      const payload = {
        tenantId: 'tenant-customer-1',
        userId: 'system',
        correlationId: 'corr-dup',
        timestamp: new Date().toISOString(),
        providerEventId: 'evt_already_processed_999',
        provider: 'RAZORPAY' as const,
        eventType: 'payment.captured',
        status: 'SUCCESS' as const,
        amount: 294400,
        currency: 'INR',
      };

      mockPrisma.platformWebhookEvent.findUnique.mockResolvedValue({
        id: 'internal-id',
        eventId: 'evt_already_processed_999',
        status: 'PROCESSED',
      });

      const result = await service.processBillingWebhookEvent(payload);

      expect(result.processed).toBe(false);
      expect(result.reason).toBe('ALREADY_PROCESSED');
      expect(mockPrisma.platformInvoice.create).not.toHaveBeenCalled();
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    });

    it('should ignore webhooks targeted at internal platform tenants to preserve isolation', async () => {
      const payload = {
        tenantId: 'tenant-platform-internal',
        userId: 'system',
        correlationId: 'corr-plat',
        timestamp: new Date().toISOString(),
        providerEventId: 'evt_platform_001',
        provider: 'RAZORPAY' as const,
        eventType: 'payment.captured',
        status: 'SUCCESS' as const,
        planId: 'growth',
        amount: 1000,
        currency: 'INR',
      };

      mockPrisma.platformWebhookEvent.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-platform-internal',
        name: 'ClixPro Platform Workspace',
        isPlatformTenant: true,
        type: 'PLATFORM',
      });

      const result = await service.processBillingWebhookEvent(payload);

      expect(result.processed).toBe(true);
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
      expect(mockPrisma.platformInvoice.create).not.toHaveBeenCalled();
    });
  });
});
