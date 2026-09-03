import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionEntitlementService } from '../subscription-entitlement.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingGatewayService } from '../../billing/billing-gateway.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('Enterprise Billing & Entitlement Security Tests', () => {
  let service: SubscriptionEntitlementService;
  let prisma: PrismaService;
  let billingGateway: BillingGatewayService;

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    plan: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
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
    task: {
      count: jest.fn(),
    },
    deal: {
      count: jest.fn(),
    },
    attachment: {
      aggregate: jest.fn(),
    },
    platformSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    platformInvoice: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    platformPayment: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockBillingGateway = {
    createCheckoutOrder: jest.fn(),
    verifyPaymentSignature: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.plan.findFirst.mockResolvedValue(null);
    mockPrisma.plan.findMany.mockResolvedValue([]);
    mockPrisma.attachment.aggregate.mockResolvedValue({ _sum: { fileSize: 0 } });
    mockPrisma.platformInvoice.count.mockResolvedValue(0);
    mockPrisma.platformPayment.count.mockResolvedValue(0);
    mockPrisma.platformSubscription.create.mockResolvedValue({ id: 'sub-created-1' });
    mockPrisma.platformSubscription.update.mockResolvedValue({ id: 'sub-updated-1' });
    mockPrisma.platformInvoice.create.mockResolvedValue({ id: 'inv-created-1', invoiceNumber: 'CP-INV-2026-000001' });
    mockPrisma.platformPayment.create.mockResolvedValue({ id: 'pay-created-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionEntitlementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BillingGatewayService, useValue: mockBillingGateway },
      ],
    }).compile();

    service = module.get<SubscriptionEntitlementService>(SubscriptionEntitlementService);
    prisma = module.get<PrismaService>(PrismaService);
    billingGateway = module.get<BillingGatewayService>(BillingGatewayService);
  });

  describe('1. Super Admin / Platform Internal Tenant Isolation', () => {
    it('should always endow PLATFORM tenant with Business/Enterprise plan and unlimited entitlements', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'platform-tenant-id',
        name: 'ClixPro Platform Admin Workspace',
        type: 'PLATFORM',
        isPlatformTenant: true,
        plan: 'business',
        subscriptionStatus: 'ACTIVE',
        billingCycle: 'monthly',
        currency: 'INR',
      });

      mockPrisma.tenantUser.count.mockResolvedValue(5);
      mockPrisma.customer.count.mockResolvedValue(100);
      mockPrisma.lead.count.mockResolvedValue(50);
      mockPrisma.task.count.mockResolvedValue(20);
      mockPrisma.deal.count.mockResolvedValue(10);

      const sub = await service.getWorkspaceSubscription('platform-tenant-id');

      expect(sub.tenantType).toBe('PLATFORM');
      expect(sub.isPlatformTenant).toBe(true);
      expect(sub.planId).toBe('business');
      expect(sub.totalRecurringAmount).toBe(0); // Never billed as a customer
      expect(sub.usage.users.limit).toBe(-1); // Unlimited
      expect(sub.usage.contacts.limit).toBe(-1); // Unlimited
      expect(sub.usage.leads.limit).toBe(-1); // Unlimited
    });

    it('should allow Super Admin internal CRM to switch billing cycle directly without payment gateway', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'platform-tenant-id',
        name: 'ClixPro Platform Workspace',
        type: 'PLATFORM',
        isPlatformTenant: true,
        plan: 'business',
        subscriptionStatus: 'ACTIVE',
        billingCycle: 'monthly',
      });

      mockPrisma.tenant.update.mockResolvedValue({
        id: 'platform-tenant-id',
        billingCycle: 'annual',
      });

      await service.switchBillingCycle('platform-tenant-id', 'annual');

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'platform-tenant-id' },
        data: { billingCycle: 'annual' },
      });
      // Never created invoices or called payment gateway
      expect(mockPrisma.platformInvoice.create).not.toHaveBeenCalled();
      expect(mockBillingGateway.createCheckoutOrder).not.toHaveBeenCalled();
    });

    it('should NEVER return customer invoices or billing history for internal platform tenant', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'platform-tenant-id',
        name: 'ClixPro Platform Workspace',
        type: 'PLATFORM',
        isPlatformTenant: true,
      });

      const invoices = await service.getWorkspaceInvoices('platform-tenant-id');

      expect(invoices).toEqual([]);
      expect(mockPrisma.platformInvoice.findMany).not.toHaveBeenCalled();
    });
  });

  describe('2. Authoritative Server Pricing & Minor Units (Paise)', () => {
    it('should compute authoritative pricing server-side in integer paise with 18% GST', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'customer-tenant-1',
        plan: 'free',
        currency: 'INR',
        type: 'CUSTOMER',
        isPlatformTenant: false,
      });
      mockPrisma.tenantUser.count.mockResolvedValue(5);

      const quote = await service.calculateQuote('customer-tenant-1', 'starter', 5, 'monthly');

      // Starter plan: ₹499/user/mo * 5 users = ₹2495 subtotal
      expect(quote.subtotal).toBe(2495);
      // 18% GST on ₹2495 = ₹449.10 -> rounded ₹449
      expect(quote.taxAmount).toBe(449);
      // Total amount = ₹2944
      expect(quote.totalAmount).toBe(2944);
      // Minor units in paise = 294400 paise
      expect(quote.totalAmountInMinorUnits).toBe(294400);
    });

    it('should calculate annual discount savings properly (~17%)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'customer-tenant-1',
        plan: 'free',
        currency: 'INR',
        type: 'CUSTOMER',
        isPlatformTenant: false,
      });
      mockPrisma.tenantUser.count.mockResolvedValue(2);

      const quote = await service.calculateQuote('customer-tenant-1', 'starter', 2, 'annual');

      // Starter annual: ₹4990/user/yr * 2 = ₹9980
      expect(quote.subtotal).toBe(9980);
      expect(quote.annualDiscountAmount).toBeGreaterThan(0);
      expect(quote.totalAmountInMinorUnits).toBe(Math.round(quote.totalAmount * 100));
    });
  });

  describe('3. Plan Upgrade Security: Rejection of Unauthorized Client Manipulation', () => {
    it('should reject direct changePlan to paid plan without verified payment flow', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'customer-tenant-1',
        plan: 'free',
        type: 'CUSTOMER',
        isPlatformTenant: false,
      });

      await expect(
        service.changePlan('customer-tenant-1', 'business', 'monthly', 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment verification if provider signature is invalid', async () => {
      mockBillingGateway.verifyPaymentSignature.mockResolvedValue(false);

      await expect(
        service.verifyAndActivatePayment('customer-tenant-1', {
          orderId: 'order_123',
          paymentId: 'pay_123',
          signature: 'forged_signature',
          planId: 'starter',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should activate paid plan only when cryptographic signature is verified', async () => {
      mockBillingGateway.verifyPaymentSignature.mockResolvedValue(true);
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'customer-tenant-1',
        name: 'Test Tenant',
        plan: 'free',
        currency: 'INR',
        type: 'CUSTOMER',
        isPlatformTenant: false,
      });
      mockPrisma.tenantUser.count.mockResolvedValue(3);
      mockPrisma.platformSubscription.findFirst.mockResolvedValue(null);

      const result = await service.verifyAndActivatePayment('customer-tenant-1', {
        orderId: 'order_valid_123',
        paymentId: 'pay_valid_456',
        signature: 'valid_sig_hash',
        planId: 'starter',
        seats: 3,
        billingCycle: 'monthly',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'customer-tenant-1' },
          data: expect.objectContaining({ plan: 'starter', subscriptionStatus: 'ACTIVE' }),
        }),
      );
      expect(mockPrisma.platformPayment.create).toHaveBeenCalled();
      expect(mockPrisma.platformInvoice.create).toHaveBeenCalled();
    });
  });

  describe('4. Entitlement and Limit Enforcement', () => {
    it('should block feature if not present in tenant plan', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'customer-tenant-1',
        plan: 'free',
        subscriptionStatus: 'ACTIVE',
        type: 'CUSTOMER',
        isPlatformTenant: false,
      });

      // Free plan does not have 'custom_modules' (requires Business)
      const hasCustomModules = await service.hasFeature('customer-tenant-1', 'custom_modules');
      expect(hasCustomModules).toBe(false);

      await expect(
        service.assertFeature('customer-tenant-1', 'custom_modules'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should enforce resource limits when limit is reached', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'customer-tenant-1',
        plan: 'free', // Free has maxUsers: 3
        subscriptionStatus: 'ACTIVE',
        type: 'CUSTOMER',
        isPlatformTenant: false,
      });
      // Already 3 active users in workspace
      mockPrisma.tenantUser.count.mockResolvedValue(3);

      await expect(
        service.assertWithinLimit('customer-tenant-1', 'maxUsers', 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
