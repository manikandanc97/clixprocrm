import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlatformPlansService } from '../services/platform-plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiEntitlementService } from '../../ai/ai-entitlement.service';
import { CANONICAL_PLANS } from '../../common/plans/plan-definitions.constant';

describe('PlatformPlansService SaaS Pricing Suite', () => {
  let service: PlatformPlansService;
  let prismaMock: any;
  let entitlementServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      plan: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: args.data.id, ...args.data })),
        update: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 'plan-1' }),
        updateMany: jest.fn(),
      },
      tenant: {
        groupBy: jest.fn(),
      },
      aiModel: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      planAiEntitlement: {
        create: jest.fn().mockResolvedValue({ id: 'ent-1' }),
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prismaMock)),
      createSealedAuditLog: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    entitlementServiceMock = {
      invalidateAllCache: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformPlansService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AiEntitlementService, useValue: entitlementServiceMock },
      ],
    }).compile();

    service = module.get<PlatformPlansService>(PlatformPlansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Auto-seeding Canonical Primary Plans', () => {
    it('should create canonical plans ONLY when database has 0 plans', async () => {
      prismaMock.plan.count.mockResolvedValue(0);
      prismaMock.aiModel.findFirst.mockResolvedValue({ id: 'model-gemini-1' });

      await service.seedCanonicalPlansIfEmpty();

      expect(prismaMock.plan.create).toHaveBeenCalledTimes(Object.values(CANONICAL_PLANS).length);
    });

    it('should NOT create or modify plans when database already has plans', async () => {
      prismaMock.plan.count.mockResolvedValue(3);

      await service.seedCanonicalPlansIfEmpty();

      expect(prismaMock.plan.create).not.toHaveBeenCalled();
      expect(prismaMock.plan.update).not.toHaveBeenCalled();
    });
  });

  describe('2. Live Metrics & MRR Calculation', () => {
    it('should calculate real MRR and distribution from active tenant database records', async () => {
      prismaMock.plan.findUnique.mockResolvedValue({ id: 'free' });
      prismaMock.plan.findMany.mockResolvedValue([
        {
          id: 'free',
          name: 'Free',
          price: '₹0',
          priceNum: 0,
          pricingMode: 'FIXED',
          status: 'ACTIVE',
          aiEntitlements: [],
        },
        {
          id: 'starter',
          name: 'Starter',
          price: '₹1,999',
          priceNum: 1999,
          pricingMode: 'FIXED',
          status: 'ACTIVE',
          aiEntitlements: [],
        },
        {
          id: 'pro',
          name: 'Professional',
          price: '₹4,999',
          priceNum: 4999,
          pricingMode: 'FIXED',
          status: 'ACTIVE',
          aiEntitlements: [],
        },
      ]);

      prismaMock.tenant.groupBy.mockResolvedValue([
        { plan: 'free', _count: { _all: 10 } },
        { plan: 'starter', _count: { _all: 5 } },
        { plan: 'pro', _count: { _all: 2 } },
      ]);

      prismaMock.aiModel.findMany.mockResolvedValue([]);

      const res = await service.getPlans();

      // MRR: (10 * 0) + (5 * 1999) + (2 * 4999) = 0 + 9995 + 9998 = 19993
      expect(res.metrics.monthlyMRR).toBe(19993);
      expect(res.metrics.projectedARR).toBe(19993 * 12);
      expect(res.metrics.totalOrganizations).toBe(17);
      expect(res.distribution.starter).toBe(5);
      expect(res.distribution.pro).toBe(2);
    });
  });

  describe('3. Single Most Popular Invariant Enforcement', () => {
    it('should reset other plans highlight status when a plan is marked as popular', async () => {
      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'starter',
        name: 'Starter',
        price: '₹1,999',
        priceNum: 1999,
        highlight: false,
        status: 'ACTIVE',
        aiEntitlements: [],
      });

      await service.updatePlan('starter', { highlight: true }, 'super-admin-user');

      expect(prismaMock.plan.updateMany).toHaveBeenCalledWith({
        where: { id: { not: 'starter' } },
        data: { highlight: false },
      });
    });
  });

  describe('4. AI Entitlement Sync and Cache Invalidation', () => {
    it('should invalidate global AI cache when plan AI settings or models change', async () => {
      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'pro',
        name: 'Professional',
        price: '₹4,999',
        priceNum: 4999,
        aiLevel: 'Advanced AI',
        status: 'ACTIVE',
        aiEntitlements: [],
      });

      prismaMock.aiModel.findUnique.mockResolvedValue({
        id: 'model-gemini-2',
        status: 'ENABLED',
      });

      await service.updatePlan(
        'pro',
        {
          defaultModelId: 'model-gemini-2',
          allowedModelIds: ['model-gemini-2'],
          aiLevel: 'Premium AI',
        },
        'super-admin-user',
      );

      expect(entitlementServiceMock.invalidateAllCache).toHaveBeenCalled();
      expect(prismaMock.createSealedAuditLog).toHaveBeenCalled();
    });
  });

  describe('5. Input Validation', () => {
    it('should reject negative prices and invalid statuses', async () => {
      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'pro',
        name: 'Professional',
      });

      await expect(
        service.updatePlan('pro', { priceNum: -500 }, 'actor-1'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updatePlan('pro', { status: 'INVALID_STATUS' as any }, 'actor-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('6. Create and Delete Plans', () => {
    it('should successfully create a new custom plan tier', async () => {
      prismaMock.plan.findUnique.mockResolvedValue(null);
      prismaMock.plan.create.mockResolvedValue({
        id: 'custom-tier',
        name: 'Custom Tier',
        price: '₹9,999',
        priceNum: 9999,
        status: 'ACTIVE',
      });
      prismaMock.aiModel.findFirst.mockResolvedValue({ id: 'model-1' });

      const result = await service.createPlan(
        {
          name: 'Custom Tier',
          priceNum: 9999,
          currency: 'INR',
        },
        'super-admin-user',
      );

      expect(result.id).toBe('custom-tier');
      expect(prismaMock.createSealedAuditLog).toHaveBeenCalled();
    });

    it('should reassign active workspaces to free tier and delete the plan', async () => {
      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'pro',
        name: 'Professional',
      });
      prismaMock.tenant.count = jest.fn().mockResolvedValue(3);
      prismaMock.tenant.updateMany = jest.fn().mockResolvedValue({ count: 3 });
      prismaMock.planAiEntitlement.deleteMany = jest.fn().mockResolvedValue({ count: 2 });
      prismaMock.plan.delete = jest.fn().mockResolvedValue({ id: 'pro' });

      const result = await service.deletePlan('pro', 'super-admin-user');

      expect(result.id).toBe('pro');
      expect(result.migratedTenantsCount).toBe(3);
      expect(prismaMock.tenant.updateMany).toHaveBeenCalledWith({
        where: {
          plan: { equals: 'pro', mode: 'insensitive' },
        },
        data: { plan: 'free' },
      });
      expect(prismaMock.plan.delete).toHaveBeenCalledWith({
        where: { id: 'pro' },
      });
      expect(prismaMock.createSealedAuditLog).toHaveBeenCalled();
    });

    it('should successfully delete an unused plan', async () => {
      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'old-custom',
        name: 'Old Custom',
      });
      prismaMock.tenant.count = jest.fn().mockResolvedValue(0);
      prismaMock.planAiEntitlement.deleteMany = jest.fn().mockResolvedValue({ count: 1 });
      prismaMock.plan.delete = jest.fn().mockResolvedValue({ id: 'old-custom' });

      const result = await service.deletePlan('old-custom', 'super-admin-user');

      expect(result.id).toBe('old-custom');
      expect(prismaMock.plan.delete).toHaveBeenCalledWith({
        where: { id: 'old-custom' },
      });
      expect(prismaMock.createSealedAuditLog).toHaveBeenCalled();
    });
  });
});

