import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { AiEntitlementService } from '../ai-entitlement.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AiEntitlementService Enterprise Subscription Architecture Suite', () => {
  let entitlementService: AiEntitlementService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      platformConfig: {
        findUnique: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
      },
      plan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      aiModel: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      planAiEntitlement: {
        findMany: jest.fn(),
      },
      aiUsageLog: {
        aggregate: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiEntitlementService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    entitlementService = module.get<AiEntitlementService>(AiEntitlementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Global AI Kill Switch Enforcement', () => {
    it('should throw ServiceUnavailableException when PlatformConfig aiCopilot is false', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        aiCopilot: false,
      });

      await expect(
        entitlementService.validateModelAccess('tenant-1', 'gemini-2.5-flash', 'chat'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should allow check when PlatformConfig aiCopilot is true for Super Admin', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        aiCopilot: true,
      });
      prismaMock.aiModel.findMany.mockResolvedValue([
        {
          id: 'model-gemini',
          modelKey: 'gemini-2.5-flash',
          displayName: 'Gemini 2.5 Flash',
          provider: 'google',
          status: 'ENABLED',
          isChatModel: true,
          isAvailable: true,
          isDefault: true,
          capabilities: ['chat'],
        },
      ]);

      const res = await entitlementService.validateModelAccess(
        undefined,
        'gemini-2.5-flash',
        'chat',
      );

      expect(res.modelKey).toBe('gemini-2.5-flash');
    });
  });

  describe('2. Plan-Level AI Access & Model Resolution', () => {
    it('should throw ForbiddenException if plan has aiEnabled = false', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        aiCopilot: true,
      });

      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Acme Corp',
        plan: 'plan-basic',
        status: 'ACTIVE',
      });

      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'plan-basic',
        name: 'Basic No-AI Plan',
        aiEnabled: false,
        aiLevel: 'No AI',
        dailyTokenLimit: 0,
        aiEntitlements: [],
      });

      await expect(
        entitlementService.validateModelAccess('tenant-1', 'gemini-2.5-flash', 'chat'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should resolve the plan default model when requestedModel is omitted', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        aiCopilot: true,
      });

      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-2',
        name: 'Pro Tenant',
        plan: 'pro',
        status: 'ACTIVE',
      });

      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'pro',
        name: 'Professional',
        aiEnabled: true,
        aiLevel: 'Advanced AI',
        dailyTokenLimit: 50000,
        defaultModel: {
          id: 'model-gpt4o',
          modelKey: 'gpt-4o',
          displayName: 'GPT-4o',
          provider: 'openai',
          status: 'ENABLED',
          isChatModel: true,
          isAvailable: true,
        },
        aiEntitlements: [
          {
            isEnabled: true,
            capability: '*',
            model: {
              id: 'model-gpt4o',
              modelKey: 'gpt-4o',
              displayName: 'GPT-4o',
              provider: 'openai',
              status: 'ENABLED',
              isChatModel: true,
              isAvailable: true,
            },
          },
        ],
      });

      prismaMock.aiUsageLog.aggregate.mockResolvedValue({
        _sum: { totalTokens: 1000 },
      });

      const res = await entitlementService.validateModelAccess('tenant-2', undefined, 'chat');
      expect(res.modelKey).toBe('gpt-4o');
      expect(res.displayName).toBe('GPT-4o');
    });

    it('should reject access to a model not entitled for the workspace plan', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        aiCopilot: true,
      });

      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-3',
        name: 'Starter Tenant',
        plan: 'starter',
        status: 'ACTIVE',
      });

      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'starter',
        name: 'Starter',
        aiEnabled: true,
        aiLevel: 'Standard AI',
        dailyTokenLimit: 20000,
        defaultModel: {
          id: 'model-gemini',
          modelKey: 'gemini-2.5-flash',
          displayName: 'Gemini 2.5 Flash',
          provider: 'google',
          status: 'ENABLED',
          isChatModel: true,
          isAvailable: true,
        },
        aiEntitlements: [
          {
            isEnabled: true,
            capability: '*',
            model: {
              id: 'model-gemini',
              modelKey: 'gemini-2.5-flash',
              displayName: 'Gemini 2.5 Flash',
              provider: 'google',
              status: 'ENABLED',
              isChatModel: true,
              isAvailable: true,
            },
          },
        ],
      });

      // Tenant attempts to use Claude 3.7 Sonnet which is only for Pro+ / Enterprise
      await expect(
        entitlementService.validateModelAccess('tenant-3', 'claude-3-7-sonnet', 'chat'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Token Quota Enforcement (Rolling 24h)', () => {
    it('should throw 429 HttpException when dailyTokenLimit is exceeded', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        aiCopilot: true,
      });

      prismaMock.tenant.findUnique.mockResolvedValue({
        id: 'tenant-4',
        name: 'Heavy User Tenant',
        plan: 'starter',
        status: 'ACTIVE',
      });

      prismaMock.plan.findUnique.mockResolvedValue({
        id: 'starter',
        name: 'Starter',
        aiEnabled: true,
        aiLevel: 'Standard AI',
        dailyTokenLimit: 20000,
        defaultModel: {
          id: 'model-gemini',
          modelKey: 'gemini-2.5-flash',
          displayName: 'Gemini 2.5 Flash',
          provider: 'google',
          status: 'ENABLED',
          isChatModel: true,
          isAvailable: true,
        },
        aiEntitlements: [
          {
            isEnabled: true,
            capability: '*',
            model: {
              id: 'model-gemini',
              modelKey: 'gemini-2.5-flash',
              displayName: 'Gemini 2.5 Flash',
              provider: 'google',
              status: 'ENABLED',
              isChatModel: true,
              isAvailable: true,
            },
          },
        ],
      });

      // Mock that tenant used 25,000 tokens in the last 24h
      prismaMock.aiUsageLog.aggregate.mockResolvedValue({
        _sum: { totalTokens: 25000 },
      });

      await expect(
        entitlementService.validateModelAccess('tenant-4', 'gemini-2.5-flash', 'chat'),
      ).rejects.toThrow(HttpException);
    });
  });
});

