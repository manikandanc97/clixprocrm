import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiEntitlementService } from '../../ai/ai-entitlement.service';

export interface FeatureCatalogItem {
  key: string;
  name: string;
  category: string;
  description: string;
}

export const FEATURE_CATALOG: FeatureCatalogItem[] = [
  // Core CRM
  { key: 'lead_management', name: 'Lead Management', category: 'Core CRM', description: 'Capture, qualify, and track sales leads' },
  { key: 'contact_management', name: 'Contact Management', category: 'Core CRM', description: 'Centralized customer and contact profiles' },
  { key: 'deal_pipeline', name: 'Deal Pipeline', category: 'Core CRM', description: 'Visual pipeline stages and opportunity tracking' },
  { key: 'quotations', name: 'Quotations & Proposals', category: 'Core CRM', description: 'Create and send branded sales quotations' },
  { key: 'invoicing', name: 'Invoicing & Payments', category: 'Core CRM', description: 'Generate invoices and record revenue' },
  
  // Collaboration & Tasks
  { key: 'tasks', name: 'Tasks & Reminders', category: 'Collaboration', description: 'Task assignments, checklists, and calendar deadlines' },
  { key: 'meetings', name: 'Meetings & Scheduling', category: 'Collaboration', description: 'Schedule client meetings and video calls' },
  { key: 'document_management', name: 'Document Management', category: 'Collaboration', description: 'Secure attachment storage and workspace documents' },

  // Communication & Automation
  { key: 'email_integration', name: 'Email Integration', category: 'Automation & Comms', description: 'Direct email communication and logging' },
  { key: 'whatsapp_integration', name: 'WhatsApp Integration', category: 'Automation & Comms', description: 'Instant messaging and customer chat' },
  { key: 'automation', name: 'Automation Workflows', category: 'Automation & Comms', description: 'Automated stage triggers and reminder notifications' },

  // Insights & Roles
  { key: 'reports', name: 'Standard Reports', category: 'Insights & Roles', description: 'Exportable CRM activity and sales reports' },
  { key: 'advanced_analytics', name: 'Advanced Analytics', category: 'Insights & Roles', description: 'Conversion funnels, revenue trends, and performance metrics' },
  { key: 'custom_roles', name: 'Custom Roles & Permissions', category: 'Insights & Roles', description: 'Granular RBAC role definitions and data scoping' },

  // AI & Copilot
  { key: 'ai_assistant', name: 'AI Copilot & Assistant', category: 'AI & Intelligence', description: 'Smart assistant for summarization and CRM actions' },
  { key: 'document_rag', name: 'Document RAG & Embeddings', category: 'AI & Intelligence', description: 'Semantic retrieval across customer documents' },
  { key: 'lead_scoring', name: 'AI Lead Scoring', category: 'AI & Intelligence', description: 'Predictive lead scoring and opportunity prioritization' },

  // Enterprise & Security
  { key: 'api_access', name: 'REST API & Webhooks', category: 'Enterprise & Security', description: 'Programmatic API access and webhook subscriptions' },
  { key: 'audit_logs', name: 'Audit Logs & Immutability', category: 'Enterprise & Security', description: 'Cryptographic hash-chained audit trails' },
  { key: 'advanced_security', name: 'Advanced Security & SSO', category: 'Enterprise & Security', description: 'Enforced MFA, session management, and enterprise security' },
  { key: 'enterprise_support', name: 'Enterprise Priority Support', category: 'Enterprise & Security', description: 'Dedicated account manager and 24/7 SLA' },
];

export class CreatePlatformPlanDto {
  id?: string;
  name: string;
  description?: string;
  price?: string;
  priceNum?: number;
  annualPriceNum?: number;
  currency?: string;
  billing?: string;
  pricingMode?: 'FIXED' | 'CUSTOM';
  features?: string[];
  maxUsers?: number;
  maxLeads?: number;
  maxContacts?: number;
  storageGb?: number;
  maxApiRequests?: number;
  trialDays?: number;
  billingCycleMonthly?: boolean;
  billingCycleAnnual?: boolean;
  highlight?: boolean;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder?: number;
  
  // AI Entitlement Configuration
  aiEnabled?: boolean;
  aiLevel?: string;
  dailyTokenLimit?: number;
  defaultModelId?: string;
  allowedModelIds?: string[];
}

export class UpdatePlatformPlanDto {
  name?: string;
  description?: string;
  price?: string;
  priceNum?: number;
  annualPriceNum?: number;
  currency?: string;
  billing?: string;
  pricingMode?: 'FIXED' | 'CUSTOM';
  features?: string[];
  maxUsers?: number;
  maxLeads?: number;
  maxContacts?: number;
  storageGb?: number;
  maxApiRequests?: number;
  trialDays?: number;
  billingCycleMonthly?: boolean;
  billingCycleAnnual?: boolean;
  highlight?: boolean;
  isActive?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sortOrder?: number;
  
  // AI Entitlement Configuration
  aiEnabled?: boolean;
  aiLevel?: string;
  dailyTokenLimit?: number;
  defaultModelId?: string;
  allowedModelIds?: string[];
}

import { CANONICAL_PLANS } from '../../common/plans/plan-definitions.constant';

@Injectable()
export class PlatformPlansService {
  private readonly logger = new Logger(PlatformPlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementService: AiEntitlementService,
  ) {}

  /**
   * Auto-seeds the 5 canonical primary plans if the database is missing any of them.
   */
  async seedCanonicalPlansIfEmpty(): Promise<void> {
    const canonicalPlans = Object.values(CANONICAL_PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      priceNum: p.priceNum,
      annualPriceNum: p.annualPriceNum,
      currency: p.currency,
      billing: `per ${p.billingInterval}`,
      pricingMode: p.pricingMode,
      description: p.description,
      features: p.featureDescriptions,
      maxUsers: p.limits.maxUsers === -1 ? 1000000 : p.limits.maxUsers,
      maxLeads: p.limits.maxLeads === -1 ? 1000000 : p.limits.maxLeads,
      maxContacts: p.limits.maxContacts === -1 ? 1000000 : p.limits.maxContacts,
      storageGb: p.limits.storageGb === -1 ? 1000 : p.limits.storageGb,
      maxApiRequests: p.limits.maxApiRequests === -1 ? 1000000 : p.limits.maxApiRequests,
      trialDays: p.id === 'free' ? 0 : 14,
      billingCycleMonthly: true,
      billingCycleAnnual: true,
      highlight: p.recommended,
      isActive: p.isActive,
      status: 'ACTIVE',
      sortOrder: p.displayOrder,
      aiEnabled: p.aiConfig.enabled,
      aiLevel: p.aiConfig.level,
      dailyTokenLimit: p.aiConfig.dailyTokenLimit,
    }));

    // Find default chat model in catalog if exists
    const defaultChatModel = await (this.prisma as any).aiModel.findFirst({
      where: { isAvailable: true, status: 'ENABLED', isChatModel: true },
      orderBy: { sortOrder: 'asc' },
    });

    for (const plan of canonicalPlans) {
      await (this.prisma as any).plan.upsert({
        where: { id: plan.id },
        update: {
          name: plan.name,
          price: plan.price,
          priceNum: plan.priceNum,
          annualPriceNum: plan.annualPriceNum,
          currency: plan.currency,
          billing: plan.billing,
          pricingMode: plan.pricingMode,
          description: plan.description,
          features: plan.features,
          maxUsers: plan.maxUsers,
          maxLeads: plan.maxLeads,
          maxContacts: plan.maxContacts,
          storageGb: plan.storageGb,
          maxApiRequests: plan.maxApiRequests,
          highlight: plan.highlight,
          sortOrder: plan.sortOrder,
          aiLevel: plan.aiLevel,
          dailyTokenLimit: plan.dailyTokenLimit,
        },
        create: {
          ...plan,
          defaultModelId: defaultChatModel?.id || null,
        },
      });

      if (defaultChatModel) {
        await (this.prisma as any).planAiEntitlement.upsert({
          where: {
            planId_modelId_capability: {
              planId: plan.id,
              modelId: defaultChatModel.id,
              capability: '*',
            },
          },
          update: { isEnabled: true, maxTokensPerDay: plan.dailyTokenLimit },
          create: {
            planId: plan.id,
            modelId: defaultChatModel.id,
            capability: '*',
            isEnabled: true,
            maxTokensPerDay: plan.dailyTokenLimit,
          },
        });
      }
    }
  }

  /**
   * Retrieves all canonical plans with live organization counts, real MRR/ARR, and AI models.
   */
  async getPlans() {
    await this.seedCanonicalPlansIfEmpty();

    const [plans, tenantDistributionRaw, aiModels] = await Promise.all([
      (this.prisma as any).plan.findMany({
        orderBy: [{ sortOrder: 'asc' }, { priceNum: 'asc' }],
        include: {
          defaultModel: true,
          aiEntitlements: {
            include: { model: true },
          },
        },
      }),
      (this.prisma as any).tenant.groupBy({
        by: ['plan'],
        _count: { _all: true },
      }),
      (this.prisma as any).aiModel.findMany({
        where: { isAvailable: true, status: 'ENABLED', isChatModel: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const distribution: Record<string, number> = {};
    let totalOrganizations = 0;

    for (const item of tenantDistributionRaw) {
      if (item.plan) {
        const key = item.plan.toLowerCase();
        distribution[key] = item._count._all;
        totalOrganizations += item._count._all;
      }
    }

    // Compute real MRR from active tenant distribution
    let calculatedMRR = 0;
    for (const plan of plans) {
      const count = distribution[plan.id.toLowerCase()] || 0;
      if (plan.pricingMode !== 'CUSTOM' && plan.status === 'ACTIVE') {
        calculatedMRR += count * Number(plan.priceNum || 0);
      }
    }

    const calculatedARR = calculatedMRR * 12;
    const activePlansCount = plans.filter((p: any) => p.status === 'ACTIVE').length;

    const formattedPlans = plans.map((p: any) => {
      const tenantCount = distribution[p.id.toLowerCase()] || 0;
      const allowedModels = (p.aiEntitlements || [])
        .filter((e: any) => e.isEnabled && e.model)
        .map((e: any) => ({
          id: e.model.id,
          modelKey: e.model.modelKey,
          displayName: e.model.displayName,
          provider: e.model.provider,
          status: e.model.status,
        }));

      const allowedModelIds = (p.aiEntitlements || [])
        .filter((e: any) => e.isEnabled && e.model)
        .map((e: any) => e.model.id);

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: p.price,
        priceNum: Number(p.priceNum),
        annualPriceNum: Number(p.annualPriceNum || 0),
        currency: p.currency || 'INR',
        billing: p.billing || 'per month',
        pricingMode: p.pricingMode || 'FIXED',
        features: Array.isArray(p.features) ? p.features : [],
        maxUsers: p.maxUsers >= 1000000 ? -1 : p.maxUsers,
        maxLeads: p.maxLeads >= 1000000 ? -1 : p.maxLeads,
        maxContacts: p.maxContacts >= 1000000 ? -1 : p.maxContacts,
        storageGb: p.storageGb,
        maxApiRequests: p.maxApiRequests >= 1000000 ? -1 : p.maxApiRequests,
        trialDays: p.trialDays || 0,
        billingCycleMonthly: p.billingCycleMonthly !== false,
        billingCycleAnnual: p.billingCycleAnnual !== false,
        highlight: p.highlight || false,
        isActive: p.isActive !== false,
        status: p.status || (p.isActive ? 'ACTIVE' : 'INACTIVE'),
        sortOrder: p.sortOrder || 0,
        
        // AI Configuration
        aiEnabled: p.aiEnabled !== false,
        aiLevel: p.aiLevel || 'Standard AI',
        dailyTokenLimit: p.dailyTokenLimit || 50000,
        defaultModelId: p.defaultModelId || p.defaultModel?.id || null,
        defaultModel: p.defaultModel
          ? {
              id: p.defaultModel.id,
              modelKey: p.defaultModel.modelKey,
              displayName: p.defaultModel.displayName,
              provider: p.defaultModel.provider,
            }
          : null,
        allowedModelIds,
        allowedModels,
        
        tenantCount,
      };
    });

    return {
      plans: formattedPlans,
      distribution,
      featureCatalog: FEATURE_CATALOG,
      aiModels: aiModels.map((m: any) => ({
        id: m.id,
        modelKey: m.modelKey,
        displayName: m.displayName,
        provider: m.provider,
        contextWindow: m.contextWindow,
      })),
      metrics: {
        activePlans: activePlansCount,
        totalOrganizations,
        monthlyMRR: calculatedMRR,
        projectedARR: calculatedARR,
        hasBillingData: totalOrganizations > 0,
      },
    };
  }

  /**
   * Updates a canonical plan across Basic, Pricing, Limits, AI, and Features.
   */
  async updatePlan(planId: string, dto: UpdatePlatformPlanDto, actorUserId: string) {
    const existing = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
      include: {
        defaultModel: true,
        aiEntitlements: { include: { model: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Plan '${planId}' does not exist.`);
    }

    // Backend Validations
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Plan name cannot be empty.');
    }
    if (dto.priceNum !== undefined && dto.priceNum < 0) {
      throw new BadRequestException('Monthly price cannot be negative.');
    }
    if (dto.annualPriceNum !== undefined && dto.annualPriceNum < 0) {
      throw new BadRequestException('Annual price cannot be negative.');
    }
    if (dto.trialDays !== undefined && dto.trialDays < 0) {
      throw new BadRequestException('Trial days cannot be negative.');
    }
    if (dto.status && !['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(dto.status)) {
      throw new BadRequestException(`Invalid plan status: ${dto.status}`);
    }

    // Format display price string if priceNum is provided
    let priceDisplay = dto.price;
    if (dto.priceNum !== undefined && !priceDisplay) {
      const currSymbol = dto.currency === 'USD' ? '$' : dto.currency === 'EUR' ? '€' : dto.currency === 'GBP' ? '£' : '₹';
      priceDisplay = dto.pricingMode === 'CUSTOM' ? 'Custom' : `${currSymbol}${dto.priceNum.toLocaleString()}`;
    }

    // Handle single "Most Popular" plan invariant in a transaction
    await this.prisma.$transaction(async (tx) => {
      if (dto.highlight === true) {
        // Reset all other plans highlight to false
        await (tx as any).plan.updateMany({
          where: { id: { not: planId } },
          data: { highlight: false },
        });
      }

      // If default AI model changed, validate it
      if (dto.defaultModelId) {
        const model = await (tx as any).aiModel.findUnique({
          where: { id: dto.defaultModelId },
        });
        if (!model || model.status !== 'ENABLED') {
          throw new BadRequestException('Selected default AI model is invalid or disabled.');
        }
      }

      // Convert unlimited (-1) to DB representation (1000000)
      const parseLimit = (val?: number) => {
        if (val === undefined) return undefined;
        return val < 0 ? 1000000 : val;
      };

      await (tx as any).plan.update({
        where: { id: planId },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(priceDisplay && { price: priceDisplay }),
          ...(dto.priceNum !== undefined && { priceNum: dto.priceNum }),
          ...(dto.annualPriceNum !== undefined && { annualPriceNum: dto.annualPriceNum }),
          ...(dto.currency && { currency: dto.currency }),
          ...(dto.billing && { billing: dto.billing }),
          ...(dto.pricingMode && { pricingMode: dto.pricingMode }),
          ...(dto.features && { features: dto.features }),
          ...(dto.maxUsers !== undefined && { maxUsers: parseLimit(dto.maxUsers) }),
          ...(dto.maxLeads !== undefined && { maxLeads: parseLimit(dto.maxLeads) }),
          ...(dto.maxContacts !== undefined && { maxContacts: parseLimit(dto.maxContacts) }),
          ...(dto.storageGb !== undefined && { storageGb: dto.storageGb }),
          ...(dto.maxApiRequests !== undefined && { maxApiRequests: parseLimit(dto.maxApiRequests) }),
          ...(dto.trialDays !== undefined && { trialDays: dto.trialDays }),
          ...(dto.billingCycleMonthly !== undefined && { billingCycleMonthly: dto.billingCycleMonthly }),
          ...(dto.billingCycleAnnual !== undefined && { billingCycleAnnual: dto.billingCycleAnnual }),
          ...(dto.highlight !== undefined && { highlight: dto.highlight }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.status && { status: dto.status }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.aiEnabled !== undefined && { aiEnabled: dto.aiEnabled }),
          ...(dto.aiLevel && { aiLevel: dto.aiLevel }),
          ...(dto.dailyTokenLimit !== undefined && { dailyTokenLimit: dto.dailyTokenLimit }),
          ...(dto.defaultModelId !== undefined && { defaultModelId: dto.defaultModelId }),
        },
      });

      // Update AI Entitlements if allowedModelIds provided
      if (dto.allowedModelIds && Array.isArray(dto.allowedModelIds)) {
        // Ensure default model is included in allowed models
        const targetAllowed = new Set(dto.allowedModelIds);
        if (dto.defaultModelId) {
          targetAllowed.add(dto.defaultModelId);
        }

        const allowedArray = Array.from(targetAllowed);

        await (tx as any).planAiEntitlement.updateMany({
          where: {
            planId,
            modelId: { notIn: allowedArray },
          },
          data: { isEnabled: false },
        });

        for (const mId of allowedArray) {
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
              maxTokensPerDay: dto.dailyTokenLimit || existing.dailyTokenLimit || 50000,
            },
            create: {
              planId,
              modelId: mId,
              capability: '*',
              isEnabled: true,
              maxTokensPerDay: dto.dailyTokenLimit || existing.dailyTokenLimit || 50000,
            },
          });
        }
      }
    });

    // Invalidate AI cache so updated model entitlements take effect immediately
    await this.entitlementService.invalidateAllCache();

    // Fetch updated record for response and audit log
    const updated = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
      include: {
        defaultModel: true,
        aiEntitlements: { include: { model: true } },
      },
    });

    // Sealed Audit Log
    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'PLATFORM_PLAN_UPDATED',
      module: 'SuperAdminPlans',
      details: {
        planId,
        planName: updated.name,
        previous: {
          name: existing.name,
          price: existing.price,
          priceNum: existing.priceNum,
          highlight: existing.highlight,
          aiLevel: existing.aiLevel,
          defaultModel: existing.defaultModel?.displayName,
          status: existing.status,
        },
        updated: {
          name: updated.name,
          price: updated.price,
          priceNum: updated.priceNum,
          highlight: updated.highlight,
          aiLevel: updated.aiLevel,
          defaultModel: updated.defaultModel?.displayName,
          status: updated.status,
        },
      },
    });

    return updated;
  }

  /**
   * Safely archives a plan without deleting existing customer billing subscriptions.
   */
  async archivePlan(planId: string, actorUserId: string) {
    const existing = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      throw new NotFoundException(`Plan '${planId}' does not exist.`);
    }

    const updated = await (this.prisma as any).plan.update({
      where: { id: planId },
      data: {
        status: 'ARCHIVED',
        isActive: false,
      },
    });

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'PLATFORM_PLAN_ARCHIVED',
      module: 'SuperAdminPlans',
      details: {
        planId,
        planName: existing.name,
      },
    });

    return updated;
  }

  /**
   * Creates a new platform plan tier.
   */
  async createPlan(dto: CreatePlatformPlanDto, actorUserId: string) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Plan name is required.');
    }

    const planId = (
      dto.id ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    ).trim();

    if (!planId) {
      throw new BadRequestException('Valid Plan ID could not be determined.');
    }

    const existing = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
    });
    if (existing) {
      throw new BadRequestException(`A plan with ID '${planId}' already exists.`);
    }

    const currency = dto.currency || 'INR';
    const priceNum = dto.priceNum !== undefined ? dto.priceNum : 0;
    const annualPriceNum = dto.annualPriceNum !== undefined ? dto.annualPriceNum : 0;
    const pricingMode = dto.pricingMode || 'FIXED';

    let priceDisplay = dto.price;
    if (!priceDisplay) {
      const currSymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
      priceDisplay = pricingMode === 'CUSTOM' ? 'Custom' : `${currSymbol}${priceNum.toLocaleString()}`;
    }

    const parseLimit = (val?: number, defaultVal: number = 1000) => {
      if (val === undefined) return defaultVal;
      return val < 0 ? 1000000 : val;
    };

    let defaultModelId = dto.defaultModelId;
    if (!defaultModelId) {
      const defaultChatModel = await (this.prisma as any).aiModel.findFirst({
        where: { isAvailable: true, status: 'ENABLED', isChatModel: true },
        orderBy: { sortOrder: 'asc' },
      });
      defaultModelId = defaultChatModel?.id || null;
    }

    const newPlan = await this.prisma.$transaction(async (tx) => {
      if (dto.highlight === true) {
        await (tx as any).plan.updateMany({
          data: { highlight: false },
        });
      }

      const plan = await (tx as any).plan.create({
        data: {
          id: planId,
          name: dto.name.trim(),
          description: dto.description || '',
          price: priceDisplay,
          priceNum,
          annualPriceNum,
          currency,
          billing: dto.billing || 'per month',
          pricingMode,
          features: Array.isArray(dto.features) ? dto.features : [],
          maxUsers: parseLimit(dto.maxUsers, 5),
          maxLeads: parseLimit(dto.maxLeads, 1000),
          maxContacts: parseLimit(dto.maxContacts, 2000),
          storageGb: dto.storageGb || 5,
          maxApiRequests: parseLimit(dto.maxApiRequests, 20000),
          trialDays: dto.trialDays || 0,
          billingCycleMonthly: dto.billingCycleMonthly !== false,
          billingCycleAnnual: dto.billingCycleAnnual !== false,
          highlight: dto.highlight || false,
          isActive: dto.isActive !== false,
          status: dto.status || 'ACTIVE',
          sortOrder: dto.sortOrder || 0,
          aiEnabled: dto.aiEnabled !== false,
          aiLevel: dto.aiLevel || 'Standard AI',
          dailyTokenLimit: dto.dailyTokenLimit || 50000,
          defaultModelId,
        },
      });

      // AI entitlements
      const allowedModelIds = dto.allowedModelIds && dto.allowedModelIds.length > 0
        ? dto.allowedModelIds
        : defaultModelId ? [defaultModelId] : [];

      for (const mId of allowedModelIds) {
        await (tx as any).planAiEntitlement.upsert({
          where: {
            planId_modelId_capability: {
              planId: plan.id,
              modelId: mId,
              capability: '*',
            },
          },
          update: {
            isEnabled: true,
            maxTokensPerDay: dto.dailyTokenLimit || 50000,
          },
          create: {
            planId: plan.id,
            modelId: mId,
            capability: '*',
            isEnabled: true,
            maxTokensPerDay: dto.dailyTokenLimit || 50000,
          },
        });
      }

      return plan;
    });

    await this.entitlementService.invalidateAllCache();

    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'PLATFORM_PLAN_CREATED',
      module: 'SuperAdminPlans',
      details: {
        planId: newPlan.id,
        planName: newPlan.name,
      },
    });

    return newPlan;
  }

  /**
   * Deletes a plan permanently if no active workspaces are currently assigned to it.
   */
  async deletePlan(planId: string, actorUserId: string) {
    const existing = await (this.prisma as any).plan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      throw new NotFoundException(`Plan '${planId}' does not exist.`);
    }

    // Check if any tenant is using this plan
    const tenantCount = await (this.prisma as any).tenant.count({
      where: {
        plan: {
          equals: planId,
          mode: 'insensitive',
        },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      // If any active tenants were on this plan, safely reassign them to free tier
      if (tenantCount > 0 && planId.toLowerCase() !== 'free') {
        await (tx as any).tenant.updateMany({
          where: {
            plan: {
              equals: planId,
              mode: 'insensitive',
            },
          },
          data: {
            plan: 'free',
          },
        });
      }

      // Delete AI entitlements first
      await (tx as any).planAiEntitlement.deleteMany({
        where: { planId },
      });

      // Delete the plan permanently
      await (tx as any).plan.delete({
        where: { id: planId },
      });
    });

    // Invalidate AI cache
    await this.entitlementService.invalidateAllCache();

    // Sealed Audit Log
    await this.prisma.createSealedAuditLog({
      userId: actorUserId,
      action: 'PLATFORM_PLAN_DELETED',
      module: 'SuperAdminPlans',
      details: {
        planId,
        planName: existing.name,
        migratedTenantsCount: tenantCount,
      },
    });

    return {
      id: planId,
      name: existing.name,
      migratedTenantsCount: tenantCount,
    };
  }
}

