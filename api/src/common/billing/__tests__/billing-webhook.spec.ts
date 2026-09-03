import { Test, TestingModule } from '@nestjs/testing';
import { BillingWebhookController } from '../billing-webhook.controller';
import { BillingGatewayService } from '../billing-gateway.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';

describe('BillingWebhookController Integration & Idempotency Tests', () => {
  let controller: BillingWebhookController;
  let prisma: PrismaService;
  let billingGateway: BillingGatewayService;

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
  };

  const mockBillingGateway = {
    verifyAndParseWebhook: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.platformSubscription.create.mockResolvedValue({ id: 'sub-created-1' });
    mockPrisma.platformSubscription.update.mockResolvedValue({ id: 'sub-updated-1' });
    mockPrisma.platformInvoice.create.mockResolvedValue({ id: 'inv-created-1', invoiceNumber: 'CP-INV-2026-000001' });
    mockPrisma.platformPayment.create.mockResolvedValue({ id: 'pay-created-1' });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingWebhookController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BillingGatewayService, useValue: mockBillingGateway },
      ],
    }).compile();

    controller = module.get<BillingWebhookController>(BillingWebhookController);
    prisma = module.get<PrismaService>(PrismaService);
    billingGateway = module.get<BillingGatewayService>(BillingGatewayService);
  });

  it('should reject webhook if signature verification fails', async () => {
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
      expect.objectContaining({ success: false, message: 'Webhook signature verification failed.' }),
    );
  });

  it('should process new valid webhook and update tenant subscription inside a transaction', async () => {
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
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-customer-1',
      name: 'Acme Corp',
      plan: 'free',
      isPlatformTenant: false,
      type: 'CUSTOMER',
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

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.platformWebhookEvent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: 'evt_new_123' } }),
    );
    expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tenant-customer-1' },
        data: expect.objectContaining({ plan: 'growth', subscriptionStatus: 'ACTIVE' }),
      }),
    );
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
  });

  it('should enforce idempotency: duplicate event returns 200 without re-executing transactions', async () => {
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
    // Already in DB as PROCESSED
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

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Event already processed.' }),
    );
  });

  it('should ignore webhooks targeted at internal platform tenants to preserve isolation', async () => {
    const mockEvent = {
      provider: 'RAZORPAY',
      eventId: 'evt_platform_001',
      eventType: 'payment.captured',
      tenantId: 'tenant-platform-internal',
      planId: 'growth',
      status: 'SUCCESS',
      rawPayload: {},
    };

    mockBillingGateway.verifyAndParseWebhook.mockResolvedValue(mockEvent);
    mockPrisma.platformWebhookEvent.findUnique.mockResolvedValue(null);
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-platform-internal',
      name: 'ClixPro Platform Workspace',
      isPlatformTenant: true,
      type: 'PLATFORM',
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

    // Platform tenant was not modified by customer webhook
    expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
  });
});
