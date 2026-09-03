import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SubscriptionEntitlementService } from '../../plans/subscription-entitlement.service';
import { BillingGatewayService } from '../billing-gateway.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('Razorpay Checkout Security & Tampering Resistance Suite', () => {
  let service: SubscriptionEntitlementService;
  let prismaMock: any;
  let billingGatewayMock: any;

  const mockSecret = 'rzp_test_secret_secure_key_123';

  beforeEach(async () => {
    prismaMock = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenantUser: {
        count: jest.fn().mockResolvedValue(2),
      },
      customer: {
        count: jest.fn().mockResolvedValue(100),
      },
      lead: {
        count: jest.fn().mockResolvedValue(50),
      },
      task: {
        count: jest.fn().mockResolvedValue(20),
      },
      deal: {
        count: jest.fn().mockResolvedValue(10),
      },
      attachment: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { fileSize: 0 } }),
      },
      platformSubscription: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' }),
        update: jest.fn().mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' }),
      },
      platformInvoice: {
        count: jest.fn().mockResolvedValue(5),
        create: jest.fn().mockResolvedValue({ id: 'inv-1', invoiceNumber: 'CP-INV-2026-000006', status: 'PAID' }),
      },
      platformPayment: {
        count: jest.fn().mockResolvedValue(5),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'SUCCESS' }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn(async (cb) => cb(prismaMock)),
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

  describe('TEST A: End-to-End Verified Payment Activation', () => {
    it('should activate subscription, generate paid invoice, and update tenant ONLY after valid signature', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        name: 'Alpha Corp',
        plan: 'free',
        currency: 'INR',
        isPlatformTenant: false,
        type: 'CUSTOMER',
      });

      billingGatewayMock.verifyPaymentSignature.mockResolvedValue(true);

      const result = await service.verifyAndActivatePayment(
        'tenant-123',
        {
          orderId: 'order_test_123',
          paymentId: 'pay_test_456',
          signature: 'valid_hmac_sha256_signature',
          planId: 'growth',
          billingCycle: 'monthly',
          seats: 5,
        },
        'user-admin-1',
      );

      expect(billingGatewayMock.verifyPaymentSignature).toHaveBeenCalledWith({
        orderId: 'order_test_123',
        paymentId: 'pay_test_456',
        signature: 'valid_hmac_sha256_signature',
      });

      expect(prismaMock.platformSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-123',
            planId: 'growth',
            status: 'ACTIVE',
            seats: 5,
          }),
        }),
      );

      expect(prismaMock.platformInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-123',
            status: 'PAID',
            paymentStatus: 'PAID',
          }),
        }),
      );

      expect(prismaMock.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenant-123' },
          data: expect.objectContaining({
            plan: 'growth',
            subscriptionStatus: 'ACTIVE',
          }),
        }),
      );

      expect(result.subscription).toBeDefined();
      expect(result.invoice).toBeDefined();
    });
  });

  describe('TEST B & C: Payment Failure & Signature Tampering', () => {
    it('should reject payment verification and NEVER activate plan if signature is invalid', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        name: 'Alpha Corp',
        plan: 'free',
        currency: 'INR',
      });

      billingGatewayMock.verifyPaymentSignature.mockResolvedValue(false);

      await expect(
        service.verifyAndActivatePayment(
          'tenant-123',
          {
            orderId: 'order_test_123',
            paymentId: 'pay_test_456',
            signature: 'tampered_invalid_signature',
            planId: 'growth',
          },
          'user-admin-1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.tenant.update).not.toHaveBeenCalled();
      expect(prismaMock.platformSubscription.create).not.toHaveBeenCalled();
      expect(prismaMock.platformInvoice.create).not.toHaveBeenCalled();
    });
  });

  describe('TEST D: Server-Side Price Authority (Price Tampering Resistance)', () => {
    it('should calculate authoritative server price regardless of client inputs', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        name: 'Alpha Corp',
        plan: 'free',
        currency: 'INR',
      });

      billingGatewayMock.createCheckoutOrder.mockImplementation(async (params) => {
        return {
          provider: 'RAZORPAY',
          orderId: 'order_test_server_price',
          amount: params.amountInMinorUnits,
          currency: params.currency,
          keyId: 'rzp_test_key',
        };
      });

      const { quote, order } = await service.createCheckoutOrder('tenant-123', 'growth', 5, 'monthly');

      // Growth is ₹999/mo per seat (or canonical DB price), 5 seats = ₹4995 subtotal + 18% GST (₹899) = ₹5894 -> 589400 paise
      expect(quote.planId).toBe('growth');
      expect(quote.seats).toBe(5);
      expect(order.amount).toBe(quote.totalAmountInMinorUnits);
      expect(billingGatewayMock.createCheckoutOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amountInMinorUnits: quote.totalAmountInMinorUnits,
          planId: 'growth',
          seats: 5,
        }),
      );
    });
  });

  describe('TEST F: Tenant Isolation (Cross-Tenant Tampering Resistance)', () => {
    it('should reject if payment identifier belongs to another tenant', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-attacker',
        name: 'Attacker Workspace',
        plan: 'free',
        currency: 'INR',
      });

      billingGatewayMock.verifyPaymentSignature.mockResolvedValue(true);

      // Payment already recorded for victim tenant
      prismaMock.platformPayment.findFirst.mockResolvedValue({
        id: 'pay-existing',
        tenantId: 'tenant-victim',
        providerPaymentId: 'pay_victim_123',
        status: 'SUCCESS',
      });

      await expect(
        service.verifyAndActivatePayment(
          'tenant-attacker',
          {
            orderId: 'order_victim_123',
            paymentId: 'pay_victim_123',
            signature: 'valid_sig_for_victim',
            planId: 'business',
          },
          'attacker-user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.tenant.update).not.toHaveBeenCalled();
    });
  });

  describe('TEST H: Direct Plan Change Prevention without Payment', () => {
    it('should throw BadRequestException if customer attempts to change to paid tier directly', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        name: 'Customer Org',
        plan: 'free',
        isPlatformTenant: false,
        type: 'CUSTOMER',
      });

      await expect(
        service.changePlan('tenant-123', 'growth', 'monthly', 5),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.tenant.update).not.toHaveBeenCalled();
    });
  });
});
