import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiEntitlementService } from '../../ai/ai-entitlement.service';

@Injectable()
export class PlatformAiService {
  private readonly logger = new Logger(PlatformAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementService: AiEntitlementService,
  ) {}

  /**
   * Retrieves all AI models configured in the platform catalog.
   */
  async getAiModels() {
    const models = await (this.prisma as any).aiModel.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return models;
  }

  /**
   * Enables or disables a model globally on the platform.
   */
  async toggleModelAvailability(modelId: string, isAvailable: boolean, actorUserId: string) {
    const model = await (this.prisma as any).aiModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException(`AI model with ID '${modelId}' not found.`);
    }

    const status = isAvailable ? 'ENABLED' : 'DISABLED';

    const updated = await (this.prisma as any).aiModel.update({
      where: { id: modelId },
      data: { isAvailable, status },
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: isAvailable ? 'AI_MODEL_ENABLED' : 'AI_MODEL_DISABLED',
      module: 'SuperAdminAI',
      details: {
        modelId: model.id,
        modelKey: model.modelKey,
        displayName: model.displayName,
        status,
        isAvailable,
      },
    });

    return updated;
  }

  /**
   * Sets or toggles model lifecycle status ('ENABLED', 'DISABLED', 'DEPRECATED', 'UNAVAILABLE').
   */
  async updateModelStatus(modelId: string, status: string, actorUserId: string) {
    const validStatuses = ['ENABLED', 'DISABLED', 'DEPRECATED', 'UNAVAILABLE'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const model = await (this.prisma as any).aiModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException(`AI model with ID '${modelId}' not found.`);
    }

    const isAvailable = status === 'ENABLED';

    const updated = await (this.prisma as any).aiModel.update({
      where: { id: modelId },
      data: { status, isAvailable },
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'AI_MODEL_STATUS_CHANGED',
      module: 'SuperAdminAI',
      details: {
        modelId: model.id,
        modelKey: model.modelKey,
        displayName: model.displayName,
        previousStatus: model.status,
        newStatus: status,
      },
    });

    return updated;
  }

  /**
   * Sets a model as the default platform model.
   */
  async setDefaultModel(modelId: string, actorUserId: string) {
    const model = await (this.prisma as any).aiModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException(`AI model with ID '${modelId}' not found.`);
    }

    if (model.status !== 'ENABLED') {
      throw new BadRequestException(
        `Cannot set disabled or unavailable model '${model.displayName}' as default.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).aiModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      await (tx as any).aiModel.update({
        where: { id: modelId },
        data: { isDefault: true, isAvailable: true, status: 'ENABLED' },
      });

      await (tx as any).platformConfig.upsert({
        where: { id: 'global' },
        update: { defaultAiModelKey: model.modelKey },
        create: {
          id: 'global',
          defaultAiModelKey: model.modelKey,
        },
      });
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'AI_DEFAULT_MODEL_CHANGED',
      module: 'SuperAdminAI',
      details: {
        modelId: model.id,
        modelKey: model.modelKey,
        displayName: model.displayName,
      },
    });

    return { success: true, message: `Model '${model.displayName}' set as platform default.` };
  }

  /**
   * Sets a model as the fallback platform model.
   */
  async setFallbackModel(modelId: string, actorUserId: string) {
    const model = await (this.prisma as any).aiModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException(`AI model with ID '${modelId}' not found.`);
    }

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).aiModel.updateMany({
        where: { isFallback: true },
        data: { isFallback: false },
      });

      await (tx as any).aiModel.update({
        where: { id: modelId },
        data: { isFallback: true, isAvailable: true, status: 'ENABLED' },
      });

      await (tx as any).platformConfig.upsert({
        where: { id: 'global' },
        update: { fallbackAiModelKey: model.modelKey },
        create: {
          id: 'global',
          fallbackAiModelKey: model.modelKey,
        },
      });
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'AI_FALLBACK_MODEL_CHANGED',
      module: 'SuperAdminAI',
      details: {
        modelId: model.id,
        modelKey: model.modelKey,
        displayName: model.displayName,
      },
    });

    return { success: true, message: `Model '${model.displayName}' set as fallback.` };
  }

  /**
   * Retrieves clean, production-ready AI & Plans configuration for Super Admin.
   */
  async getPlanAiOverview() {
    try {
      const [plans, allModels, platformConfig] = await Promise.all([
        (this.prisma as any).plan.findMany({
          orderBy: { priceNum: 'asc' },
          include: {
            defaultModel: true,
            aiEntitlements: {
              where: { isEnabled: true },
              include: { model: true },
            },
          },
        }),
        (this.prisma as any).aiModel.findMany({
          orderBy: { sortOrder: 'asc' },
        }),
        (this.prisma as any).platformConfig.findUnique({
          where: { id: 'global' },
        }),
      ]);

      const activeChatModels = (allModels || []).filter(
        (m: any) => m.status === 'ENABLED' && m.isChatModel !== false && m.isAvailable !== false,
      );

      const planOverviews = (plans || []).map((plan: any) => {
        const allowedModels = (plan.aiEntitlements || [])
          .filter((e: any) => e.model && e.model.status === 'ENABLED' && e.model.isAvailable)
          .map((e: any) => ({
            id: e.model.id,
            modelKey: e.model.modelKey,
            displayName: e.model.displayName,
            provider: e.model.provider,
            status: e.model.status,
            maxTokensPerDay: e.maxTokensPerDay,
          }));

        let defaultModel = plan.defaultModel;
        if (defaultModel && (defaultModel.status !== 'ENABLED' || !defaultModel.isAvailable)) {
          defaultModel = allowedModels.length > 0 ? allowedModels[0] : null;
        }

        return {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          priceNum: Number(plan.priceNum || 0),
          aiLevel: plan.aiLevel || 'Standard AI',
          aiEnabled: plan.aiEnabled !== false,
          dailyTokenLimit: plan.dailyTokenLimit || 50000,
          defaultModel: defaultModel
            ? {
                id: defaultModel.id,
                modelKey: defaultModel.modelKey,
                displayName: defaultModel.displayName,
                provider: defaultModel.provider,
                status: defaultModel.status,
              }
            : null,
          allowedModels,
        };
      });

      return {
        globalAiEnabled: platformConfig ? platformConfig.aiCopilot !== false : true,
        plans: planOverviews,
        activeChatModels,
        allModels: allModels || [],
      };
    } catch (error: any) {
      this.logger.error('Failed to get plan AI overview:', error);
      throw error;
    }
  }

  /**
   * Super Admin 1-Click: Changes the default AI model for a plan.
   */
  async setPlanDefaultModel(planId: string, modelId: string, actorUserId: string) {
    const [plan, model] = await Promise.all([
      (this.prisma as any).plan.findUnique({
        where: { id: planId },
        include: { defaultModel: true },
      }),
      (this.prisma as any).aiModel.findUnique({
        where: { id: modelId },
      }),
    ]);

    if (!plan) {
      throw new NotFoundException(`Subscription plan '${planId}' not found.`);
    }

    if (!model) {
      throw new NotFoundException(`AI model '${modelId}' not found in catalog.`);
    }

    if (model.status !== 'ENABLED' || model.isAvailable === false) {
      throw new BadRequestException(
        `Cannot assign disabled model '${model.displayName}' as plan default. Please enable the model first.`,
      );
    }

    if (model.isChatModel === false) {
      throw new BadRequestException(
        `Model '${model.displayName}' is not compatible with CRM chat.`,
      );
    }

    const previousDefault = plan.defaultModel?.displayName || 'None';

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).plan.update({
        where: { id: planId },
        data: { defaultModelId: modelId },
      });

      await (tx as any).planAiEntitlement.upsert({
        where: {
          planId_modelId_capability: {
            planId,
            modelId,
            capability: '*',
          },
        },
        update: { isEnabled: true },
        create: {
          planId,
          modelId,
          capability: '*',
          isEnabled: true,
          maxTokensPerDay: plan.dailyTokenLimit || 50000,
        },
      });
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'AI_PLAN_DEFAULT_MODEL_CHANGED',
      module: 'SuperAdminAI',
      details: {
        planId: plan.id,
        planName: plan.name,
        previousDefaultModel: previousDefault,
        newDefaultModel: model.displayName,
        newModelKey: model.modelKey,
        provider: model.provider,
      },
    });

    return {
      success: true,
      message: `Default model for ${plan.name} changed to ${model.displayName}.`,
      planId: plan.id,
      defaultModel: {
        id: model.id,
        modelKey: model.modelKey,
        displayName: model.displayName,
        provider: model.provider,
      },
    };
  }

  /**
   * Updates full plan AI configuration.
   */
  async updatePlanAiConfiguration(
    planId: string,
    dto: {
      aiEnabled?: boolean;
      aiLevel?: string;
      dailyTokenLimit?: number;
      allowedModelIds?: string[];
    },
    actorUserId: string,
  ) {
    const plan = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
      include: { defaultModel: true },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan '${planId}' not found.`);
    }

    await this.prisma.$transaction(async (tx) => {
      await (tx as any).plan.update({
        where: { id: planId },
        data: {
          aiEnabled: dto.aiEnabled !== undefined ? dto.aiEnabled : plan.aiEnabled,
          aiLevel: dto.aiLevel || plan.aiLevel,
          dailyTokenLimit: dto.dailyTokenLimit !== undefined ? dto.dailyTokenLimit : plan.dailyTokenLimit,
        },
      });

      if (dto.allowedModelIds && Array.isArray(dto.allowedModelIds)) {
        await (tx as any).planAiEntitlement.updateMany({
          where: {
            planId,
            modelId: { notIn: dto.allowedModelIds },
          },
          data: { isEnabled: false },
        });

        for (const mId of dto.allowedModelIds) {
          await (tx as any).planAiEntitlement.upsert({
            where: {
              planId_modelId_capability: {
                planId,
                modelId: mId,
                capability: '*',
              },
            },
            update: {
              isEnabled: true,
              maxTokensPerDay: dto.dailyTokenLimit || plan.dailyTokenLimit,
            },
            create: {
              planId,
              modelId: mId,
              capability: '*',
              isEnabled: true,
              maxTokensPerDay: dto.dailyTokenLimit || plan.dailyTokenLimit,
            },
          });
        }
      }
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'PLAN_AI_CONFIGURATION_UPDATED',
      module: 'SuperAdminAI',
      details: {
        planId,
        planName: plan.name,
        aiEnabled: dto.aiEnabled,
        aiLevel: dto.aiLevel,
        dailyTokenLimit: dto.dailyTokenLimit,
        allowedModelIdsCount: dto.allowedModelIds?.length,
      },
    });

    return {
      success: true,
      message: `AI configuration for ${plan.name} updated successfully.`,
    };
  }

  /**
   * Toggles platform-wide global AI killswitch.
   */
  async toggleGlobalAiKillswitch(enabled: boolean, actorUserId: string) {
    await (this.prisma as any).platformConfig.upsert({
      where: { id: 'global' },
      update: { aiCopilot: enabled },
      create: {
        id: 'global',
        aiCopilot: enabled,
      },
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: enabled ? 'GLOBAL_AI_ENABLED' : 'GLOBAL_AI_DISABLED',
      module: 'SuperAdminAI',
      details: {
        globalAiEnabled: enabled,
      },
    });

    return {
      success: true,
      message: enabled ? 'Platform AI services enabled.' : 'Platform AI services globally disabled.',
      globalAiEnabled: enabled,
    };
  }

  /**
   * Legacy matrix endpoint backward compatibility.
   */
  async getPlanAiEntitlements() {
    return this.getPlanAiOverview();
  }

  /**
   * Retrieves real AI usage telemetry.
   */
  async getAiUsageTelemetry(limit = 50) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600000);

    const [
      totalRequests,
      recentLogs,
      aggregates,
      tenantBreakdownRaw,
    ] = await Promise.all([
      (this.prisma as any).aiUsageLog.count(),
      (this.prisma as any).aiUsageLog.findMany({
        take: Math.min(100, Math.max(1, limit)),
        orderBy: { createdAt: 'desc' },
        include: {
          model: {
            select: { displayName: true, modelKey: true },
          },
        },
      }),
      (this.prisma as any).aiUsageLog.aggregate({
        _sum: {
          totalTokens: true,
          inputTokens: true,
          outputTokens: true,
        },
        _avg: {
          latencyMs: true,
        },
      }),
      (this.prisma as any).aiUsageLog.groupBy({
        by: ['tenantId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        _sum: { totalTokens: true },
        orderBy: {
          _sum: {
            totalTokens: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const totalTokens = aggregates._sum.totalTokens || 0;
    const avgLatencyMs = Math.round(aggregates._avg.latencyMs || 0);

    const estimatedCostUsd = (totalTokens / 1000) * 0.0002;
    const estimatedCostInr = estimatedCostUsd * 86.5;

    return {
      summary: {
        totalRequests,
        totalTokens,
        inputTokens: aggregates._sum.inputTokens || 0,
        outputTokens: aggregates._sum.outputTokens || 0,
        avgLatencyMs,
        estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
        estimatedCostInr: Number(estimatedCostInr.toFixed(2)),
      },
      topTenantsUsage: tenantBreakdownRaw.map((t: any) => ({
        tenantId: t.tenantId,
        requestsCount: t._count.id,
        totalTokens: t._sum.totalTokens || 0,
      })),
      recentLogs: recentLogs.map((log: any) => ({
        id: log.id,
        tenantId: log.tenantId,
        userId: log.userId,
        modelKey: log.modelKey,
        modelName: log.model?.displayName || log.modelKey,
        capability: log.capability,
        totalTokens: log.totalTokens,
        latencyMs: log.latencyMs,
        status: log.status,
        createdAt: log.createdAt,
      })),
    };
  }
}
