import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaSeedService implements OnModuleInit {
  private readonly logger = new Logger(PrismaSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Run canonical sync in background to avoid blocking HTTP server startup
    this.runCanonicalSeed().catch((err) => {
      this.logger.error(`Error during canonical data initialization: ${err?.message || err}`);
    });
  }

  async runCanonicalSeed() {
    await this.seedCanonicalPlans();
    await this.seedCanonicalAiModels();
    await this.seedCanonicalEntitlements();
    await this.seedPlatformConfig();
    this.logger.log('Canonical Plans, AI Models, and Entitlements synchronized successfully.');
  }

  async seedCanonicalPlans() {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: '₹0',
        priceNum: 0,
        billing: 'forever',
        description: 'Essential CRM tooling for solo founders and pre-revenue startups.',
        features: [
          'Up to 3 Team Members',
          '500 Leads & Contacts',
          'Standard Deal Pipeline',
          'Basic AI Assistant (Gemini Flash)',
          'Community Support',
        ],
        maxUsers: 3,
        maxLeads: 500,
        storageGb: 1,
        highlight: false,
        isActive: true,
        aiEnabled: true,
        aiLevel: 'Basic AI',
        dailyTokenLimit: 5000,
      },
      {
        id: 'starter',
        name: 'Starter Growth',
        price: '₹1,999',
        priceNum: 1999,
        billing: 'per month',
        description: 'Empower growing sales teams with automation and lead tracking.',
        features: [
          'Up to 10 Team Members',
          '5,000 Leads & Contacts',
          'Custom Deal Stages & Kanban',
          'Standard AI (Summarization & Chat)',
          'Priority Email Support',
        ],
        maxUsers: 10,
        maxLeads: 5000,
        storageGb: 10,
        highlight: false,
        isActive: true,
        aiEnabled: true,
        aiLevel: 'Standard AI',
        dailyTokenLimit: 20000,
      },
      {
        id: 'pro',
        name: 'Professional',
        price: '₹4,999',
        priceNum: 4999,
        billing: 'per month',
        description: 'Advanced intelligence, deep analytics, and rupee invoicing.',
        features: [
          'Up to 30 Team Members',
          'Unlimited Leads & Deals',
          'Advanced AI Copilot & Lead Scoring',
          'Advanced Revenue Analytics',
          'Rupee Invoicing (₹)',
          'Custom Role Permissions',
          '24/7 Priority Support',
        ],
        maxUsers: 30,
        maxLeads: 1000000,
        storageGb: 50,
        highlight: true,
        isActive: true,
        aiEnabled: true,
        aiLevel: 'Advanced AI',
        dailyTokenLimit: 50000,
      },
      {
        id: 'pro_plus',
        name: 'Professional Plus',
        price: '₹9,999',
        priceNum: 9999,
        billing: 'per month',
        description: 'Premium AI reasoning models, complex deal forecasting, and custom workflow automations.',
        features: [
          'Up to 100 Team Members',
          'Unlimited Leads & Deals',
          'Premium AI (Claude Sonnet & Deep Reasoning)',
          'Automated Workflows & Integrations',
          'Dedicated Account Support',
        ],
        maxUsers: 100,
        maxLeads: 1000000,
        storageGb: 150,
        highlight: false,
        isActive: true,
        aiEnabled: true,
        aiLevel: 'Premium AI',
        dailyTokenLimit: 150000,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: '₹14,999',
        priceNum: 14999,
        billing: 'per month',
        description: 'Dedicated infrastructure, audit logs, and bespoke compliance for large orgs.',
        features: [
          'Unlimited Team Members',
          'Unlimited Leads & Quotations',
          'Full AI Suite & Dedicated Models',
          'Complete Platform Audit Logs',
          'Dedicated Database Isolation',
          'Custom SLA & Dedicated Manager',
        ],
        maxUsers: 1000000,
        maxLeads: 1000000,
        storageGb: 500,
        highlight: false,
        isActive: true,
        aiEnabled: true,
        aiLevel: 'Full AI',
        dailyTokenLimit: 1000000,
      },
    ];

    for (const plan of plans) {
      const existing = await (this.prisma as any).plan.findUnique({
        where: { id: plan.id },
      });

      if (!existing) {
        await (this.prisma as any).plan.create({
          data: plan,
        });
      } else {
        await (this.prisma as any).plan.update({
          where: { id: plan.id },
          data: {
            name: plan.name,
            price: plan.price,
            priceNum: plan.priceNum,
            billing: plan.billing,
            description: plan.description,
            features: plan.features,
            maxUsers: plan.maxUsers,
            maxLeads: plan.maxLeads,
            storageGb: plan.storageGb,
            highlight: plan.highlight,
            isActive: plan.isActive,
            // Preserve user-configured AI levels/limits if already set
            aiLevel: existing.aiLevel || plan.aiLevel,
            dailyTokenLimit: existing.dailyTokenLimit || plan.dailyTokenLimit,
          },
        });
      }
    }
  }

  async seedCanonicalAiModels() {
    const models = [
      // Google Models
      {
        modelKey: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        provider: 'google',
        description: 'Ultra-fast, economical intelligence for daily conversational CRM tasks.',
        contextWindow: 1048576,
        inputCostPer1k: 0.000075,
        outputCostPer1k: 0.0003,
        capabilities: ['chat', 'summarization', 'email_generation'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: true,
        isFallback: true,
        sortOrder: 1,
      },
      {
        modelKey: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        provider: 'google',
        description: 'Deep reasoning, complex document understanding, and multi-step CRM action execution.',
        contextWindow: 2097152,
        inputCostPer1k: 0.00125,
        outputCostPer1k: 0.005,
        capabilities: ['chat', 'summarization', 'lead_scoring', 'email_generation', 'document_analysis', 'rag', 'function_calling', 'advanced_reasoning'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        isFallback: false,
        sortOrder: 2,
      },
      {
        modelKey: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash (Legacy)',
        provider: 'google',
        description: 'Legacy fast model for basic query fallback.',
        contextWindow: 1048576,
        inputCostPer1k: 0.000075,
        outputCostPer1k: 0.0003,
        capabilities: ['chat', 'summarization'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        isFallback: false,
        sortOrder: 3,
      },
      // OpenAI Models
      {
        modelKey: 'gpt-4o',
        displayName: 'GPT-4o (Omni)',
        provider: 'openai',
        description: 'Flagship high-intelligence multimodal model for advanced sales intelligence and customer communications.',
        contextWindow: 128000,
        inputCostPer1k: 0.0025,
        outputCostPer1k: 0.01,
        capabilities: ['chat', 'summarization', 'lead_scoring', 'email_generation', 'function_calling'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        sortOrder: 4,
      },
      {
        modelKey: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        provider: 'openai',
        description: 'Lightweight, cost-efficient model for fast standard sales responses.',
        contextWindow: 128000,
        inputCostPer1k: 0.00015,
        outputCostPer1k: 0.0006,
        capabilities: ['chat', 'summarization', 'email_generation'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        sortOrder: 5,
      },
      {
        modelKey: 'gpt-5',
        displayName: 'GPT-5 (Next-Gen Preview)',
        provider: 'openai',
        description: 'Next-generation frontier model for deep enterprise analytics.',
        contextWindow: 200000,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.015,
        capabilities: ['chat', 'summarization', 'lead_scoring', 'advanced_reasoning'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        sortOrder: 6,
      },
      // Anthropic Models
      {
        modelKey: 'claude-3-7-sonnet',
        displayName: 'Claude 3.7 Sonnet',
        provider: 'anthropic',
        description: 'Hybrid reasoning and state-of-the-art coding and business workflow assistant.',
        contextWindow: 200000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
        capabilities: ['chat', 'summarization', 'document_analysis', 'advanced_reasoning', 'function_calling'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        sortOrder: 7,
      },
      {
        modelKey: 'claude-3-5-haiku',
        displayName: 'Claude 3.5 Haiku',
        provider: 'anthropic',
        description: 'Ultra-fast, responsive Anthropic model for instant customer query resolution.',
        contextWindow: 200000,
        inputCostPer1k: 0.0008,
        outputCostPer1k: 0.004,
        capabilities: ['chat', 'summarization'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        sortOrder: 8,
      },
      // xAI & Mistral Models
      {
        modelKey: 'grok-2',
        displayName: 'Grok 2',
        provider: 'xai',
        description: 'Frontier reasoning model with deep web and real-time comprehension.',
        contextWindow: 128000,
        inputCostPer1k: 0.002,
        outputCostPer1k: 0.01,
        capabilities: ['chat', 'summarization'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        sortOrder: 9,
      },
      {
        modelKey: 'mistral-large',
        displayName: 'Mistral Large',
        provider: 'mistral',
        description: 'Top-tier multilingual reasoning and concise CRM assistant.',
        contextWindow: 128000,
        inputCostPer1k: 0.002,
        outputCostPer1k: 0.006,
        capabilities: ['chat', 'summarization'],
        status: 'ENABLED',
        isChatModel: true,
        isAvailable: true,
        isDefault: false,
        sortOrder: 10,
      },
    ];

    for (const m of models) {
      const existing = await (this.prisma as any).aiModel.findUnique({
        where: { modelKey: m.modelKey },
      });

      if (!existing) {
        await (this.prisma as any).aiModel.create({
          data: m,
        });
      } else {
        await (this.prisma as any).aiModel.update({
          where: { modelKey: m.modelKey },
          data: {
            displayName: m.displayName,
            provider: m.provider,
            description: m.description,
            contextWindow: m.contextWindow,
            inputCostPer1k: m.inputCostPer1k,
            outputCostPer1k: m.outputCostPer1k,
            capabilities: m.capabilities,
            isChatModel: m.isChatModel,
            sortOrder: m.sortOrder,
          },
        });
      }
    }
  }

  async seedCanonicalEntitlements() {
    const modelRecords = await (this.prisma as any).aiModel.findMany();
    const modelMap = new Map<string, any>(modelRecords.map((m: any) => [m.modelKey, m]));

    // Canonical Entitlement definitions
    const planEntitlements: Record<
      string,
      {
        defaultModelKey: string;
        allowedModelKeys: string[];
        capabilities: string[];
        maxTokensPerDay: number;
      }
    > = {
      free: {
        defaultModelKey: 'gemini-2.5-flash',
        allowedModelKeys: ['gemini-2.5-flash', 'gemini-1.5-flash'],
        capabilities: ['chat'],
        maxTokensPerDay: 5000,
      },
      starter: {
        defaultModelKey: 'gemini-2.5-flash',
        allowedModelKeys: ['gemini-2.5-flash', 'gemini-1.5-flash', 'gpt-4o-mini'],
        capabilities: ['chat', 'summarization'],
        maxTokensPerDay: 25000,
      },
      growth: {
        defaultModelKey: 'gemini-2.5-flash',
        allowedModelKeys: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-haiku'],
        capabilities: ['chat', 'summarization', 'lead_scoring', 'email_generation', 'function_calling', 'advanced_reasoning'],
        maxTokensPerDay: 75000,
      },
      pro: {
        defaultModelKey: 'gemini-2.5-flash',
        allowedModelKeys: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-haiku'],
        capabilities: ['chat', 'summarization', 'lead_scoring', 'email_generation', 'function_calling', 'advanced_reasoning'],
        maxTokensPerDay: 75000,
      },
      business: {
        defaultModelKey: 'claude-3-7-sonnet',
        allowedModelKeys: ['claude-3-7-sonnet', 'claude-3-5-haiku', 'gpt-4o', 'gemini-2.5-pro', 'gemini-2.5-flash'],
        capabilities: ['chat', 'summarization', 'lead_scoring', 'email_generation', 'document_analysis', 'rag', 'function_calling', 'advanced_reasoning'],
        maxTokensPerDay: 200000,
      },
      pro_plus: {
        defaultModelKey: 'claude-3-7-sonnet',
        allowedModelKeys: ['claude-3-7-sonnet', 'claude-3-5-haiku', 'gpt-4o', 'gemini-2.5-pro', 'gemini-2.5-flash'],
        capabilities: ['chat', 'summarization', 'lead_scoring', 'email_generation', 'document_analysis', 'rag', 'function_calling', 'advanced_reasoning'],
        maxTokensPerDay: 200000,
      },
      enterprise: {
        defaultModelKey: 'gpt-4o',
        allowedModelKeys: [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-5',
          'claude-3-7-sonnet',
          'claude-3-5-haiku',
          'grok-2',
          'mistral-large',
        ],
        capabilities: ['*'],
        maxTokensPerDay: 1000000,
      },
    };

    for (const [planId, config] of Object.entries(planEntitlements)) {
      const plan = await (this.prisma as any).plan.findUnique({
        where: { id: planId },
        include: { defaultModel: true },
      });

      if (!plan) continue;

      // Ensure allowed model entitlements exist
      for (const modelKey of config.allowedModelKeys) {
        const model = modelMap.get(modelKey);
        if (!model) continue;

        for (const capability of config.capabilities) {
          const existingEnt = await (this.prisma as any).planAiEntitlement.findUnique({
            where: {
              planId_modelId_capability: {
                planId,
                modelId: model.id,
                capability,
              },
            },
          });

          if (!existingEnt) {
            await (this.prisma as any).planAiEntitlement.create({
              data: {
                planId,
                modelId: model.id,
                capability,
                isEnabled: true,
                maxTokensPerDay: config.maxTokensPerDay,
              },
            });
          }
        }
      }

      // If plan has no defaultModelId assigned yet, set the canonical initial default
      if (!plan.defaultModelId) {
        const defaultModel = modelMap.get(config.defaultModelKey) || modelMap.get('gemini-2.5-flash');
        if (defaultModel) {
          await (this.prisma as any).plan.update({
            where: { id: planId },
            data: { defaultModelId: defaultModel.id },
          });
        }
      }
    }
  }

  async seedPlatformConfig() {
    await (this.prisma as any).platformConfig.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        name: 'ClixProCRM Multi-Tenant Platform',
        defaultTenantPlan: 'free',
        maintenanceMode: false,
        allowPublicRegistrations: true,
        aiCopilot: true,
        documentRag: true,
        multiCurrency: true,
        defaultAiModelKey: 'gemini-2.5-flash',
        fallbackAiModelKey: 'gemini-2.5-flash',
      },
    });
  }
}

