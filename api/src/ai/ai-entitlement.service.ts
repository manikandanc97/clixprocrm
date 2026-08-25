import {
  Injectable,
  Logger,
  ForbiddenException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Redis } from '@upstash/redis';

export interface EntitledAiModel {
  id: string;
  modelKey: string;
  displayName: string;
  provider: string;
  description?: string | null;
  contextWindow: number;
  capabilities: string[];
  isDefault: boolean;
  status: string;
  maxTokensPerDay?: number | null;
}

export interface EffectiveAiEntitlements {
  planId: string;
  planName: string;
  aiLevel: string;
  isAiEnabled: boolean;
  isGloballyEnabled: boolean;
  dailyTokenLimit: number;
  models: EntitledAiModel[];
  defaultModelKey: string;
  defaultModelDisplayName: string;
  allowedCapabilities: string[];
}

@Injectable()
export class AiEntitlementService {
  private readonly logger = new Logger(AiEntitlementService.name);
  private redisClient: Redis | null = null;

  constructor(private readonly prisma: PrismaService) {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redisClient = new Redis({
          url: redisUrl,
          token: redisToken,
        });
      } catch (err: any) {
        this.logger.warn(`Redis init error in AiEntitlementService: ${err?.message || err}`);
      }
    }
  }

  private getCacheKey(tenantId: string): string {
    return `tenant:${tenantId}:ai:entitlements:v2`;
  }

  private getPlanCacheKey(planId: string): string {
    return `plan:${planId}:ai:entitlements:v2`;
  }

  /**
   * Checks if global platform AI services are enabled.
   */
  async isGlobalAiEnabled(): Promise<boolean> {
    try {
      const config = await (this.prisma as any).platformConfig.findUnique({
        where: { id: 'global' },
        select: { aiCopilot: true },
      });
      return config ? config.aiCopilot !== false : true;
    } catch {
      return true;
    }
  }

  /**
   * Resolves effective AI entitlements for a tenant organization based on their subscription plan.
   */
  async getEffectiveEntitlements(tenantId?: string): Promise<EffectiveAiEntitlements> {
    const isGlobalActive = await this.isGlobalAiEnabled();

    // 1. If super-admin or no tenant provided, resolve full platform-level models
    if (!tenantId) {
      const allActiveModels = await (this.prisma as any).aiModel.findMany({
        where: {
          isAvailable: true,
          status: 'ENABLED',
          isChatModel: true,
        },
        orderBy: { sortOrder: 'asc' },
      });

      const defaultModel = allActiveModels.find((m: any) => m.isDefault) || allActiveModels[0];

      return {
        planId: 'enterprise',
        planName: 'Super Admin Platform Root',
        aiLevel: 'Full AI',
        isAiEnabled: true,
        isGloballyEnabled: isGlobalActive,
        dailyTokenLimit: 10000000,
        models: allActiveModels.map((m: any) => ({
          id: m.id,
          modelKey: m.modelKey,
          displayName: m.displayName,
          provider: m.provider,
          description: m.description,
          contextWindow: m.contextWindow,
          capabilities: m.capabilities,
          isDefault: m.id === defaultModel?.id,
          status: m.status,
          maxTokensPerDay: 10000000,
        })),
        defaultModelKey: defaultModel?.modelKey || 'gemini-2.5-flash',
        defaultModelDisplayName: defaultModel?.displayName || 'Gemini 2.5 Flash',
        allowedCapabilities: ['*'],
      };
    }

    // 2. Check Redis Cache
    const cacheKey = this.getCacheKey(tenantId);
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get<EffectiveAiEntitlements>(cacheKey);
        if (cached && cached.models) {
          // Re-attach live global status
          cached.isGloballyEnabled = isGlobalActive;
          return cached;
        }
      } catch (cacheErr: any) {
        this.logger.debug(`Redis cache read bypass: ${cacheErr?.message || cacheErr}`);
      }
    }

    // 3. Resolve from Database
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true, status: true },
    });

    const planId = (tenant?.plan || 'free').toLowerCase();

    // Fetch Plan, Default Model, and AI Entitlements
    const plan = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
      include: {
        defaultModel: true,
        aiEntitlements: {
          where: { isEnabled: true },
          include: { model: true },
        },
      },
    });

    const isPlanAiEnabled = plan ? plan.aiEnabled !== false : true;
    const aiLevel = plan?.aiLevel || 'Basic AI';
    const dailyTokenLimit = plan?.dailyTokenLimit || 5000;

    // Filter only active, enabled, chat-compatible models
    const activeEntitlements = (plan?.aiEntitlements || []).filter(
      (e: any) =>
        e.model &&
        e.model.isAvailable !== false &&
        e.model.status === 'ENABLED' &&
        e.model.isChatModel !== false,
    );

    let models: EntitledAiModel[] = [];
    const capabilitiesSet = new Set<string>();

    let defaultModelRecord = plan?.defaultModel;
    if (defaultModelRecord && (defaultModelRecord.status !== 'ENABLED' || !defaultModelRecord.isAvailable)) {
      defaultModelRecord = null;
    }

    if (activeEntitlements.length > 0) {
      const modelMap = new Map<string, EntitledAiModel>();

      for (const ent of activeEntitlements) {
        const m = ent.model;
        capabilitiesSet.add(ent.capability);

        if (!modelMap.has(m.modelKey)) {
          const isThisDefault = defaultModelRecord
            ? m.id === defaultModelRecord.id
            : m.isDefault || false;

          modelMap.set(m.modelKey, {
            id: m.id,
            modelKey: m.modelKey,
            displayName: m.displayName,
            provider: m.provider,
            description: m.description,
            contextWindow: m.contextWindow,
            capabilities: m.capabilities,
            isDefault: isThisDefault,
            status: m.status,
            maxTokensPerDay: ent.maxTokensPerDay || dailyTokenLimit,
          });
        }
      }

      models = Array.from(modelMap.values());
    } else {
      // Fallback: If no entitlements configured yet for plan, find first active platform model
      const fallback = await (this.prisma as any).aiModel.findFirst({
        where: {
          isAvailable: true,
          status: 'ENABLED',
          isChatModel: true,
        },
        orderBy: { sortOrder: 'asc' },
      });

      if (fallback) {
        models = [
          {
            id: fallback.id,
            modelKey: fallback.modelKey,
            displayName: fallback.displayName,
            provider: fallback.provider,
            description: fallback.description,
            contextWindow: fallback.contextWindow,
            capabilities: fallback.capabilities,
            isDefault: true,
            status: fallback.status,
            maxTokensPerDay: dailyTokenLimit,
          },
        ];
        capabilitiesSet.add('chat');
      }
    }

    // Determine the authoritative default model
    let defaultModel = models.find((m) => m.isDefault);
    if (!defaultModel && models.length > 0) {
      defaultModel = models[0];
      defaultModel.isDefault = true;
    }

    const defaultModelKey = defaultModel?.modelKey || 'gemini-2.5-flash';
    const defaultModelDisplayName = defaultModel?.displayName || 'Gemini 2.5 Flash';

    const result: EffectiveAiEntitlements = {
      planId: plan?.id || planId,
      planName: plan?.name || 'Standard Plan',
      aiLevel,
      isAiEnabled: isPlanAiEnabled,
      isGloballyEnabled: isGlobalActive,
      dailyTokenLimit,
      models,
      defaultModelKey,
      defaultModelDisplayName,
      allowedCapabilities: Array.from(capabilitiesSet),
    };

    // 4. Cache in Redis with 10-minute TTL
    if (this.redisClient) {
      try {
        await this.redisClient.set(cacheKey, result, { ex: 600 });
      } catch (cacheErr: any) {
        this.logger.debug(`Redis cache write notice: ${cacheErr?.message || cacheErr}`);
      }
    }

    return result;
  }

  /**
   * Authoritatively validates whether a requested AI model is entitled for the tenant,
   * checking global killswitch, plan enablement, entitlement, and usage limits.
   * Throws 503, 403, or 429 machine-readable exceptions on failure.
   */
  async validateModelAccess(
    tenantId: string | undefined,
    requestedModelKey?: string,
    capability: string = 'chat',
  ): Promise<EntitledAiModel> {
    // 1. Global Platform AI Killswitch Check
    const isGlobalActive = await this.isGlobalAiEnabled();
    if (!isGlobalActive) {
      throw new ServiceUnavailableException(
        'AI_SERVICES_UNAVAILABLE: AI services are temporarily unavailable platform-wide.',
      );
    }

    const entitlements = await this.getEffectiveEntitlements(tenantId);

    // 2. Plan-Level AI Enablement Check
    if (!entitlements.isAiEnabled) {
      throw new ForbiddenException(
        `AI_NOT_ENABLED_FOR_PLAN: AI is not enabled for your workspace tier (${entitlements.planName}).`,
      );
    }

    // 3. Resolve Target Model
    const targetKey = (requestedModelKey || entitlements.defaultModelKey).trim();
    const normalizedKey = this.normalizeModelKey(targetKey);

    const entitled = entitlements.models.find(
      (m) => m.modelKey === normalizedKey || m.modelKey === targetKey,
    );

    if (!entitled) {
      throw new ForbiddenException(
        `AI_MODEL_NOT_ENTITLED: The AI model '${targetKey}' is not entitled for your subscription plan (${entitlements.planName}).`,
      );
    }

    // 4. Capability Check
    if (capability !== '*' && !entitlements.allowedCapabilities.includes('*')) {
      if (
        !entitlements.allowedCapabilities.includes(capability) &&
        !entitled.capabilities.includes(capability)
      ) {
        throw new ForbiddenException(
          `AI_CAPABILITY_NOT_ENTITLED: The AI capability '${capability}' is not permitted under your current workspace subscription plan (${entitlements.planName}).`,
        );
      }
    }

    // 5. Usage Quota Check (Rolling 24h)
    if (tenantId) {
      await this.enforceUsageLimit(tenantId, entitlements.dailyTokenLimit, entitlements.planName);
    }

    return entitled;
  }

  /**
   * Enforces server-side rolling daily token limit.
   */
  private async enforceUsageLimit(tenantId: string, dailyTokenLimit: number, planName: string) {
    if (!dailyTokenLimit || dailyTokenLimit <= 0) return;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const usageAgg = await (this.prisma as any).aiUsageLog.aggregate({
      where: {
        tenantId,
        createdAt: { gte: oneDayAgo },
        status: 'SUCCESS',
      },
      _sum: { totalTokens: true },
    });

    const tokensUsed = usageAgg._sum.totalTokens || 0;
    if (tokensUsed >= dailyTokenLimit) {
      throw new HttpException(
        `AI_USAGE_LIMIT_EXCEEDED: Daily AI token limit of ${dailyTokenLimit.toLocaleString()} tokens exceeded for workspace (${planName}). Limit resets in 24 hours.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private normalizeModelKey(key: string): string {
    const aliases: Record<string, string> = {
      'gemini-1.5-flash-latest': 'gemini-1.5-flash',
      'gemini-2.5-flash': 'gemini-2.5-flash',
      'gemini-2.5-pro': 'gemini-2.5-pro',
      'gemini-3.6-flash': 'gemini-2.5-flash',
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-5': 'gpt-5',
      'claude-3-7-sonnet': 'claude-3-7-sonnet',
      'claude-3-5-haiku': 'claude-3-5-haiku',
    };
    return aliases[key] || key;
  }

  /**
   * Records live AI usage and token consumption.
   */
  async recordUsage(dto: {
    tenantId: string;
    userId: string;
    modelKey: string;
    provider?: string;
    capability?: string;
    requestId?: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    status?: string;
    errorMessage?: string;
  }) {
    try {
      const modelRecord = await (this.prisma as any).aiModel.findUnique({
        where: { modelKey: dto.modelKey },
        select: { id: true, provider: true },
      });

      const inputTokens = dto.inputTokens || 0;
      const outputTokens = dto.outputTokens || 0;
      const totalTokens = inputTokens + outputTokens;

      await (this.prisma as any).aiUsageLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.userId,
          modelId: modelRecord?.id || null,
          modelKey: dto.modelKey,
          capability: dto.capability || 'chat',
          requestId: dto.requestId || null,
          inputTokens,
          outputTokens,
          totalTokens,
          latencyMs: dto.latencyMs || 0,
          status: dto.status || 'SUCCESS',
          errorMessage: dto.errorMessage || null,
        },
      });
    } catch (err: any) {
      this.logger.warn(`AI usage log recording notice: ${err?.message || err}`);
    }
  }

  /**
   * Invalidate cached entitlements for a single tenant.
   */
  async invalidateTenantCache(tenantId: string) {
    if (this.redisClient) {
      try {
        await this.redisClient.del(this.getCacheKey(tenantId));
      } catch (err: any) {
        this.logger.debug(`Redis cache invalidation notice: ${err?.message || err}`);
      }
    }
  }

  /**
   * Invalidate all tenant entitlement caches (e.g. after model toggle or plan changes).
   */
  async invalidateAllCache() {
    this.logger.log('Global AI entitlement cache invalidated.');
    // Upstash Redis flush pattern if keys pattern supported
    if (this.redisClient) {
      try {
        const keys = await this.redisClient.keys('tenant:*:ai:entitlements:*');
        if (keys && keys.length > 0) {
          await Promise.all(keys.map((k: string) => this.redisClient?.del(k)));
        }
      } catch (err: any) {
        this.logger.debug(`Redis global cache clear notice: ${err?.message || err}`);
      }
    }
  }
}
