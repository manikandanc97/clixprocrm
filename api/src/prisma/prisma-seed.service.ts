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
    try {
      await this.seedCanonicalPlans();
      await this.seedCanonicalAiModels();
      await this.seedCanonicalEntitlements();
      await this.seedPlatformConfig();
      this.logger.log('Canonical Plans, AI Models, and Entitlements synchronized successfully.');
    } catch (err: any) {
      this.logger.warn(`Canonical seed encountered non-fatal error: ${err?.message || err}`);
    }
  }

  async seedCanonicalPlans() {
    const planCount = await (this.prisma as any).plan.count();
    if (planCount > 0) {
      return;
    }

    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: '₹0',
        priceNum: 0,
        annualPriceNum: 0,
        currency: 'INR',
        billing: 'forever',
        pricingMode: 'FIXED',
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
        maxContacts: 1000,
        storageGb: 1,
        maxApiRequests: 1000,
        trialDays: 0,
        billingCycleMonthly: true,
        billingCycleAnnual: true,
        highlight: false,
        isActive: true,
        status: 'ACTIVE',
        sortOrder: 1,
        aiEnabled: true,
        aiLevel: 'Basic AI',
        dailyTokenLimit: 5000,
      },
      {
        id: 'starter',
        name: 'Starter',
        price: '₹499',
        priceNum: 499,
        annualPriceNum: 4990,
        currency: 'INR',
        billing: 'per user/month',
        pricingMode: 'FIXED',
        description: 'Empower growing sales teams with automation and lead tracking.',
        features: [
          'Up to 10 Team Members',
          '10,000 Contacts & 5,000 Leads',
          'Custom Fields & Saved Views',
          'Standard AI (Summarization & Chat)',
          'Email Integration & Tracking',
        ],
        maxUsers: 10,
        maxLeads: 5000,
        maxContacts: 10000,
        storageGb: 10,
        maxApiRequests: 10000,
        trialDays: 14,
        billingCycleMonthly: true,
        billingCycleAnnual: true,
        highlight: false,
        isActive: true,
        status: 'ACTIVE',
        sortOrder: 2,
        aiEnabled: true,
        aiLevel: 'Standard AI',
        dailyTokenLimit: 25000,
      },
      {
        id: 'growth',
        name: 'Growth',
        price: '₹999',
        priceNum: 999,
        annualPriceNum: 9990,
        currency: 'INR',
        billing: 'per user/month',
        pricingMode: 'FIXED',
        description: 'Advanced intelligence, deep analytics, and rupee invoicing.',
        features: [
          'Up to 25 Team Members',
          '50,000 Contacts & 25,000 Leads',
          'Advanced Automation & Workflows',
          'Sales Pipeline Customization',
          'Advanced AI Copilot & Lead Scoring',
        ],
        maxUsers: 25,
        maxLeads: 25000,
        maxContacts: 50000,
        storageGb: 50,
        maxApiRequests: 50000,
        trialDays: 14,
        billingCycleMonthly: true,
        billingCycleAnnual: true,
        highlight: true,
        isActive: true,
        status: 'ACTIVE',
        sortOrder: 3,
        aiEnabled: true,
        aiLevel: 'Advanced AI',
        dailyTokenLimit: 75000,
      },
      {
        id: 'business',
        name: 'Business',
        price: '₹1,799',
        priceNum: 1799,
        annualPriceNum: 17990,
        currency: 'INR',
        billing: 'per user/month',
        pricingMode: 'FIXED',
        description: 'Premium AI reasoning models, complex deal forecasting, and custom workflow automations.',
        features: [
          'Up to 100 Team Members',
          '250,000 Contacts & 100,000 Leads',
          'Advanced RBAC & Departments',
          'Custom Modules & Workflows',
          'Dedicated Account Support',
        ],
        maxUsers: 100,
        maxLeads: 100000,
        maxContacts: 250000,
        storageGb: 150,
        maxApiRequests: 250000,
        trialDays: 14,
        billingCycleMonthly: true,
        billingCycleAnnual: true,
        highlight: false,
        isActive: true,
        status: 'ACTIVE',
        sortOrder: 4,
        aiEnabled: true,
        aiLevel: 'Premium AI',
        dailyTokenLimit: 200000,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        priceNum: 0,
        annualPriceNum: 0,
        currency: 'INR',
        billing: 'per month',
        pricingMode: 'CUSTOM',
        description: 'Custom capacity, SSO/SAML, custom security, dedicated support, and SLA.',
        features: [
          'Unlimited / Custom Seats & Records',
          'Enterprise SAML 2.0 & SSO',
          'Advanced Security & Governance',
          'Custom Integrations & Retention',
          'Dedicated Account Manager & TAM',
        ],
        maxUsers: 1000000,
        maxLeads: 1000000,
        maxContacts: 1000000,
        storageGb: 1000,
        maxApiRequests: 1000000,
        trialDays: 30,
        billingCycleMonthly: true,
        billingCycleAnnual: true,
        highlight: false,
        isActive: true,
        status: 'ACTIVE',
        sortOrder: 5,
        aiEnabled: true,
        aiLevel: 'Full AI',
        dailyTokenLimit: 1000000,
      },
    ];

    for (const plan of plans) {
      await (this.prisma as any).plan.create({
        data: plan,
      });
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

    try {
      // Fetch all existing entitlements in 1 query
      const existingList = await (this.prisma as any).planAiEntitlement.findMany();
      const existingKeys = new Set(existingList.map((e: any) => `${e.planId}_${e.modelId}_${e.capability}`));

      const toCreate: any[] = [];
      const defaultModelUpdates: { planId: string; modelId: string }[] = [];

      for (const [planId, config] of Object.entries(planEntitlements)) {
        const plan = await (this.prisma as any).plan.findUnique({
          where: { id: planId },
          select: { id: true, defaultModelId: true },
        });

        if (!plan) continue;

        // Ensure allowed model entitlements exist
        for (const modelKey of config.allowedModelKeys) {
          const model = modelMap.get(modelKey);
          if (!model) continue;

          for (const capability of config.capabilities) {
            const key = `${planId}_${model.id}_${capability}`;
            if (!existingKeys.has(key)) {
              toCreate.push({
                planId,
                modelId: model.id,
                capability,
                isEnabled: true,
                maxTokensPerDay: config.maxTokensPerDay,
              });
              existingKeys.add(key);
            }
          }
        }

        // If plan has no defaultModelId assigned yet, set the canonical initial default
        if (!plan.defaultModelId) {
          const defaultModel = modelMap.get(config.defaultModelKey) || modelMap.get('gemini-2.5-flash');
          if (defaultModel) {
            defaultModelUpdates.push({ planId, modelId: defaultModel.id });
          }
        }
      }

      if (toCreate.length > 0) {
        await (this.prisma as any).planAiEntitlement.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      }

      for (const update of defaultModelUpdates) {
        await (this.prisma as any).plan.update({
          where: { id: update.planId },
          data: { defaultModelId: update.modelId },
        });
      }
    } catch (err: any) {
      this.logger.warn(`AI Entitlements seed skipped: ${err?.message || err}`);
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

