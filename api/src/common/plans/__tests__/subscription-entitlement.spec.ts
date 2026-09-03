import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubscriptionEntitlementService } from '../subscription-entitlement.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingGatewayService } from '../../billing/billing-gateway.service';

describe('SubscriptionEntitlementService Enterprise Suite', () => {
  let service: SubscriptionEntitlementService;
  let prismaMock: any;
  let billingGatewayMock: any;

  beforeEach(async () => {
    prismaMock = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenantUser: {
        count: jest.fn(),
      },
      customer: {
        count: jest.fn(),
      },
      lead: {
        count: jest.fn(),
      },
      deal: {
        count: jest.fn(),
      },
      attachment: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { fileSize: 0 } }),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    billingGatewayMock = {
      createCheckoutOrder: jest.fn(),
      verifyPaymentSignature: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionEntitlementService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BillingGatewayService, useValue: billingGatewayMock },
      ],
    }).compile();

    service = module.get<SubscriptionEntitlementService>(SubscriptionEntitlementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Resolving Workspace Subscription & Canonical Plan', () => {
    it('should return subscription details, limits, and live usage for a Free workspace', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Alpha Corp',
        plan: 'free',
        subscriptionStatus: 'ACTIVE',
        billingCycle: 'monthly',
        trialStart: null,
        trialEnd: null,
        currentPeriodEnd: null,
        currency: 'INR',
      });

      prismaMock.tenantUser.count.mockResolvedValue(2);
      prismaMock.customer.count.mockResolvedValue(450);
      prismaMock.lead.count.mockResolvedValue(120);
      prismaMock.task = { count: jest.fn().mockResolvedValue(30) };
      prismaMock.deal.count.mockResolvedValue(30);

      const res = await service.getWorkspaceSubscription('tenant-1');

      expect(res.planId).toBe('free');
      expect(res.planName).toBe('Free');
      expect(res.plan.price).toBe('₹0');
      expect(res.usage.contacts.current).toBe(450);
      expect(res.usage.contacts.limit).toBe(1000);
      expect(res.usage.contacts.remaining).toBe(550);
      expect(res.usage.contacts.isLimitReached).toBe(false);
      expect(res.entitledFeatures).toContain('Basic CRM & pipeline management');
    });

    it('should correctly resolve Starter as Most Popular / Recommended plan', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-2',
        name: 'Starter Inc',
        plan: 'starter',
        subscriptionStatus: 'ACTIVE',
        currency: 'INR',
      });
      prismaMock.tenantUser.count.mockResolvedValue(5);
      prismaMock.customer.count.mockResolvedValue(1000);
      prismaMock.lead.count.mockResolvedValue(500);
      prismaMock.task = { count: jest.fn().mockResolvedValue(100) };
      prismaMock.deal.count.mockResolvedValue(100);

      const res = await service.getWorkspaceSubscription('tenant-2');

      expect(res.planId).toBe('starter');
      expect(res.plan.price).toBe('₹499');
      expect(res.plan.recommended).toBe(true);
      expect(res.plan.badge).toBe('MOST POPULAR');
      expect(res.entitledFeatures).toContain('Email Integration & Tracking');
    });
  });

  describe('2. Feature Gating & Entitlements', () => {
    it('should allow features entitled on the workspace plan', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        plan: 'starter',
        subscriptionStatus: 'ACTIVE',
      });

      const allowed = await service.hasFeature('tenant-1', 'Email Integration & Tracking');
      expect(allowed).toBe(true);
    });

    it('should throw ForbiddenException with PLAN_FEATURE_LOCKED if feature is not entitled', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        plan: 'free',
        subscriptionStatus: 'ACTIVE',
      });

      await expect(
        service.assertFeature('tenant-1', 'Advanced Automation & Workflows'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Authoritative Quote & Seat Calculations', () => {
    it('should calculate seat-based quote correctly for Starter plan', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        plan: 'free',
        currency: 'INR',
      });
      prismaMock.tenantUser.count.mockResolvedValue(4);

      const quote = await service.calculateQuote('tenant-1', 'starter', 5, 'monthly');

      expect(quote.planId).toBe('starter');
      expect(quote.seats).toBe(5);
      expect(quote.unitPricePerMonth).toBe(499);
      expect(quote.subtotal).toBe(2495); // 499 * 5
      expect(quote.taxAmount).toBe(449); // 18% of 2495 = 449.1 -> 449
      expect(quote.totalAmount).toBe(2944);
      expect(quote.isUpgrade).toBe(true);
    });

    it('should calculate annual discount quote for Starter plan', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        plan: 'free',
        currency: 'INR',
      });
      prismaMock.tenantUser.count.mockResolvedValue(2);

      const quote = await service.calculateQuote('tenant-1', 'starter', 2, 'annual');

      expect(quote.planId).toBe('starter');
      expect(quote.seats).toBe(2);
      expect(quote.subtotal).toBe(9980); // 4990 * 2
      expect(quote.isUpgrade).toBe(true);
    });
  });

  describe('4. Resource Limit Enforcement', () => {
    it('should pass if within limits', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        plan: 'free', // maxContacts = 1000
        subscriptionStatus: 'ACTIVE',
      });
      prismaMock.customer.count.mockResolvedValue(400);

      await expect(
        service.assertWithinLimit('tenant-1', 'maxContacts', 1),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException with PLAN_LIMIT_REACHED if limit exceeded', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        plan: 'free', // maxContacts = 1000
        subscriptionStatus: 'ACTIVE',
      });
      prismaMock.customer.count.mockResolvedValue(1000);

      await expect(
        service.assertWithinLimit('tenant-1', 'maxContacts', 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow unlimited records for Business plan', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-biz',
        plan: 'business', // maxContacts = -1 (unlimited)
        subscriptionStatus: 'ACTIVE',
      });

      await expect(
        service.assertWithinLimit('tenant-biz', 'maxContacts', 50000),
      ).resolves.not.toThrow();
    });
  });
});

