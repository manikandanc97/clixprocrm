import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CANONICAL_PLANS,
  normalizePlanId,
  getPlanDefinition,
  PlanDefinition,
  MatrixCategory,
  MatrixFeatureItem,
} from './plan-definitions.constant';
import { BillingGatewayService } from '../billing/billing-gateway.service';
import { PaymentOrderResult } from '../billing/payment-gateway.interface';
import { toNumber } from '../utils/crm-formatters.util';

export interface WorkspaceUsageStats {
  users: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  contacts: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  leads: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  tasks: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  pipelines: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  customFields: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  deals: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  automations: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  storageGb: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  apiRequests: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
}

export interface WorkspaceSubscriptionDetails {
  tenantId: string;
  tenantName: string;
  tenantType: 'CUSTOMER' | 'PLATFORM';
  isPlatformTenant: boolean;
  planId: string;
  planName: string;
  status: string; // ACTIVE, TRIALING, PAST_DUE, CANCELED, EXPIRED, SUSPENDED
  billingCycle: 'monthly' | 'annual';
  trialStart?: string | null;
  trialEnd?: string | null;
  trialDaysRemaining?: number | null;
  currentPeriodEnd?: string | null;
  currency: string;
  seats: number;
  activeUsers: number;
  monthlyPricePerUser: number;
  annualPricePerUser: number;
  totalRecurringAmount: number;
  plan: PlanDefinition;
  usage: WorkspaceUsageStats;
  entitledFeatures: string[];
  availablePlans: PlanDefinition[];
  comparisonMatrix: MatrixCategory[];
}

export interface SubscriptionQuote {
  planId: string;
  planName: string;
  seats: number;
  billingCycle: 'monthly' | 'annual';
  currency: string;
  unitPricePerMonth: number;
  subtotal: number;
  annualDiscountPercentage: number;
  annualDiscountAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
  totalAmount: number;
  totalAmountInMinorUnits: number; // Integer minor units (e.g. paise)
  recurringAmount: number;
  intervalDescription: string;
  isUpgrade: boolean;
  isDowngrade: boolean;
  effectiveImmediately: boolean;
}

export interface BillingInvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  planName: string;
  seats: number;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  downloadUrl?: string | null;
}

@Injectable()
export class SubscriptionEntitlementService {
  private readonly logger = new Logger(SubscriptionEntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingGateway: BillingGatewayService,
  ) {}

  /**
   * Dynamically resolves a plan definition from the database with graceful in-memory fallback.
   */
  async resolvePlanDefinition(rawPlanId?: string | null): Promise<PlanDefinition> {
    const cleanId = (rawPlanId || 'free').toLowerCase().trim();
    try {
      const dbPlan = await (this.prisma as any).plan.findFirst({
        where: {
          OR: [
            { id: { equals: cleanId, mode: 'insensitive' } },
            { name: { equals: cleanId, mode: 'insensitive' } },
          ],
        },
      });

      if (dbPlan) {
        const parseLimit = (val?: number) => (val === undefined || val >= 1000000 ? -1 : val);
        const currSymbol = dbPlan.currency === 'USD' ? '$' : dbPlan.currency === 'EUR' ? '€' : dbPlan.currency === 'GBP' ? '£' : '₹';
        const priceDisplay = dbPlan.pricingMode === 'CUSTOM' ? 'Custom' : `${currSymbol}${Number(dbPlan.priceNum || 0).toLocaleString()}`;
        const rawFeatures = Array.isArray(dbPlan.features) ? dbPlan.features : [];

        return {
          id: dbPlan.id,
          name: dbPlan.name,
          price: dbPlan.price || priceDisplay,
          priceNum: Number(dbPlan.priceNum || 0),
          annualPriceNum: Number(dbPlan.annualPriceNum || (dbPlan.priceNum ? dbPlan.priceNum * 10 : 0)),
          currency: dbPlan.currency || 'INR',
          billingInterval: 'user/month',
          pricingMode: (dbPlan.pricingMode as any) || (dbPlan.priceNum === 0 && dbPlan.id !== 'free' ? 'CUSTOM' : 'FIXED'),
          target: dbPlan.description || '',
          description: dbPlan.description || '',
          recommended: Boolean(dbPlan.highlight),
          badge: dbPlan.highlight ? 'MOST POPULAR' : undefined,
          displayOrder: dbPlan.sortOrder || 0,
          isActive: dbPlan.isActive !== false && dbPlan.status !== 'INACTIVE' && dbPlan.status !== 'ARCHIVED',
          limits: {
            maxUsers: parseLimit(dbPlan.maxUsers),
            maxContacts: parseLimit(dbPlan.maxContacts),
            maxLeads: parseLimit(dbPlan.maxLeads),
            maxPipelines: parseLimit(dbPlan.maxPipelines ?? (dbPlan.id === 'free' ? 1 : -1)),
            maxTasks: parseLimit(dbPlan.maxTasks ?? (dbPlan.id === 'free' ? 500 : -1)),
            maxCustomFields: parseLimit(dbPlan.maxCustomFields ?? (dbPlan.id === 'free' ? 5 : -1)),
            maxDeals: parseLimit(dbPlan.maxDeals ?? (dbPlan.maxLeads ? dbPlan.maxLeads : -1)),
            maxAutomations: parseLimit(dbPlan.maxAutomations ?? (dbPlan.id === 'free' ? 1 : dbPlan.id === 'starter' ? 10 : dbPlan.id === 'growth' ? 50 : -1)),
            storageGb: dbPlan.storageGb || (dbPlan.id === 'free' ? 1 : dbPlan.id === 'starter' ? 10 : dbPlan.id === 'growth' ? 50 : 200),
            maxApiRequests: parseLimit(dbPlan.maxApiRequests),
            dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
          },
          features: rawFeatures,
          featureDescriptions: rawFeatures,
          aiConfig: {
            enabled: dbPlan.aiEnabled !== false,
            level: (dbPlan.aiLevel as any) || 'Standard AI',
            dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
          },
        };
      }
    } catch (err: any) {
      this.logger.debug(`Failed to fetch dynamic plan '${cleanId}' from database, using fallback: ${err.message}`);
    }

    return getPlanDefinition(cleanId);
  }

  /**
   * Retrieves all active platform plans from the database.
   */
  async getAvailablePlans(): Promise<PlanDefinition[]> {
    try {
      const dbPlans = await (this.prisma as any).plan.findMany({
        where: {
          status: 'ACTIVE',
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { priceNum: 'asc' }],
      });

      if (dbPlans && dbPlans.length > 0) {
        return dbPlans.map((dbPlan: any) => {
          const parseLimit = (val?: number) => (val === undefined || val >= 1000000 ? -1 : val);
          const currSymbol = dbPlan.currency === 'USD' ? '$' : dbPlan.currency === 'EUR' ? '€' : dbPlan.currency === 'GBP' ? '£' : '₹';
          const priceDisplay = dbPlan.pricingMode === 'CUSTOM' ? 'Custom' : `${currSymbol}${Number(dbPlan.priceNum || 0).toLocaleString()}`;
          const rawFeatures = Array.isArray(dbPlan.features) ? dbPlan.features : [];

          return {
            id: dbPlan.id,
            name: dbPlan.name,
            price: dbPlan.price || priceDisplay,
            priceNum: Number(dbPlan.priceNum || 0),
            annualPriceNum: Number(dbPlan.annualPriceNum || (dbPlan.priceNum ? dbPlan.priceNum * 10 : 0)),
            currency: dbPlan.currency || 'INR',
            billingInterval: 'user/month',
            pricingMode: (dbPlan.pricingMode as any) || (dbPlan.priceNum === 0 && dbPlan.id !== 'free' ? 'CUSTOM' : 'FIXED'),
            target: dbPlan.description || '',
            description: dbPlan.description || '',
            recommended: Boolean(dbPlan.highlight),
            badge: dbPlan.highlight ? 'MOST POPULAR' : undefined,
            displayOrder: dbPlan.sortOrder || 0,
            isActive: true,
            limits: {
              maxUsers: parseLimit(dbPlan.maxUsers),
              maxContacts: parseLimit(dbPlan.maxContacts),
              maxLeads: parseLimit(dbPlan.maxLeads),
              maxPipelines: parseLimit(dbPlan.maxPipelines ?? (dbPlan.id === 'free' ? 1 : -1)),
              maxTasks: parseLimit(dbPlan.maxTasks ?? (dbPlan.id === 'free' ? 500 : -1)),
              maxCustomFields: parseLimit(dbPlan.maxCustomFields ?? (dbPlan.id === 'free' ? 5 : -1)),
              maxDeals: parseLimit(dbPlan.maxDeals ?? (dbPlan.maxLeads ? dbPlan.maxLeads : -1)),
              maxAutomations: parseLimit(dbPlan.maxAutomations ?? (dbPlan.id === 'free' ? 1 : dbPlan.id === 'starter' ? 10 : dbPlan.id === 'growth' ? 50 : -1)),
              storageGb: dbPlan.storageGb || (dbPlan.id === 'free' ? 1 : dbPlan.id === 'starter' ? 10 : dbPlan.id === 'growth' ? 50 : 200),
              maxApiRequests: parseLimit(dbPlan.maxApiRequests),
              dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
            },
            features: rawFeatures,
            featureDescriptions: rawFeatures,
            aiConfig: {
              enabled: dbPlan.aiEnabled !== false,
              level: (dbPlan.aiLevel as any) || 'Standard AI',
              dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
            },
          };
        });
      }
    } catch (err: any) {
      this.logger.debug(`Failed to fetch available plans from DB, using fallback: ${err.message}`);
    }

    return Object.values(CANONICAL_PLANS);
  }

  /**
   * Dynamically constructs the Feature Comparison Matrix from the live canonical plans.
   */
  getDynamicComparisonMatrix(plans: PlanDefinition[]): MatrixCategory[] {
    const sortedPlans = [...plans].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const checkPlanFeature = (p: PlanDefinition, keywords: string[]): boolean => {
      const featStr = (p.features || []).join(' ').toLowerCase();
      return keywords.some((kw) => featStr.includes(kw.toLowerCase()));
    };

    return [
      {
        category: 'CRM & Capacity',
        features: [
          {
            key: 'contacts_leads',
            name: 'Contacts & Leads Capacity',
            description: 'Max records stored in workspace',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                `${p.limits.maxContacts === -1 ? 'Unlimited' : p.limits.maxContacts.toLocaleString()} / ${p.limits.maxLeads === -1 ? 'Unlimited' : p.limits.maxLeads.toLocaleString()}`,
              ]),
            ),
          },
          {
            key: 'tasks_capacity',
            name: 'Tasks Capacity',
            description: 'Active assigned tasks and checklists',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.limits.maxTasks === -1 ? 'Unlimited' : p.limits.maxTasks.toLocaleString(),
              ]),
            ),
          },
          {
            key: 'deal_pipelines',
            name: 'Deals & Pipelines',
            description: 'Opportunity tracking and stages',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.limits.maxPipelines === -1 ? 'Unlimited' : p.limits.maxPipelines === 1 ? '1 Pipeline' : `${p.limits.maxPipelines} Pipelines`,
              ]),
            ),
          },
          {
            key: 'custom_fields',
            name: 'Custom Fields',
            description: 'Tailor schemas to your business',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.limits.maxCustomFields === -1 ? 'Unlimited' : `Up to ${p.limits.maxCustomFields}`,
              ]),
            ),
          },
        ],
      },
      {
        category: 'Automation & Workflows',
        features: [
          {
            key: 'workflow_rules',
            name: 'Automation & Workflows',
            description: 'Trigger stage shifts and automated tasks',
            values: Object.fromEntries(
              sortedPlans.map((p) => {
                if (p.limits.maxAutomations === -1) return [p.id, 'Unlimited Workflows'];
                if (p.limits.maxAutomations && p.limits.maxAutomations > 1) {
                  return [p.id, `Advanced Automation (${p.limits.maxAutomations} workflows)`];
                }
                return [p.id, p.id === 'free' ? 'Limited Automation' : 'Basic Automation'];
              }),
            ),
          },
          {
            key: 'pipeline_customization',
            name: 'Sales Pipeline Customization',
            description: 'Custom stages, probabilities, and funnels',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id !== 'free' || checkPlanFeature(p, ['pipeline custom', 'custom pipeline', 'sales pipeline']),
              ]),
            ),
          },
        ],
      },
      {
        category: 'Communication & Email',
        features: [
          {
            key: 'email_integration',
            name: 'Email Integration & Tracking',
            description: 'Direct email sync, tracking and activity logging',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'free' ? 'Limited Email' : 'Full Email Sync & Tracking',
              ]),
            ),
          },
          {
            key: 'saved_views',
            name: 'Saved Views & Filters',
            description: 'Custom filters and quick list views',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id !== 'free' || checkPlanFeature(p, ['saved views', 'saved view']),
              ]),
            ),
          },
        ],
      },
      {
        category: 'Analytics & Reporting',
        features: [
          {
            key: 'reports_dashboards',
            name: 'Analytics & Reports',
            description: 'Dashboard widgets, revenue funnels and BI exports',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'free' ? 'Basic Dashboard' : 'Advanced Analytics & Reports',
              ]),
            ),
          },
          {
            key: 'activity_timeline',
            name: 'Activity Timeline',
            description: 'Full history of interactions and touches',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'free' ? 'Basic Timeline' : 'Advanced Activity Timeline',
              ]),
            ),
          },
        ],
      },
      {
        category: 'Team & Permissions',
        features: [
          {
            key: 'user_capacity',
            name: 'Team Member Seats',
            description: 'Active user accounts in workspace',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.limits.maxUsers === -1 ? 'Unlimited' : `${p.limits.maxUsers} Users`,
              ]),
            ),
          },
          {
            key: 'rbac_roles',
            name: 'Permissions & Access Control',
            description: 'Granular roles, team scopes, and department isolation',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'free'
                  ? 'Basic permissions'
                  : p.id === 'starter'
                  ? 'Team Permissions'
                  : p.id === 'growth'
                  ? 'Team Permissions & RBAC'
                  : 'Advanced RBAC & Departments',
              ]),
            ),
          },
          {
            key: 'custom_modules',
            name: 'Custom Modules',
            description: 'Build custom database entities and views',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'business' || p.id === 'enterprise' || checkPlanFeature(p, ['custom modules', 'custom module']),
              ]),
            ),
          },
        ],
      },
      {
        category: 'Governance, API & Security',
        features: [
          {
            key: 'audit_logs',
            name: 'Audit Logs',
            description: 'Tamper-evident activity and security logs',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'business' || p.id === 'enterprise' || checkPlanFeature(p, ['audit log', 'audit trail']),
              ]),
            ),
          },
          {
            key: 'rest_api',
            name: 'API Access & Webhooks',
            description: 'Programmatic REST API access and webhook events',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'business' || p.id === 'enterprise' || checkPlanFeature(p, ['api access', 'webhooks']),
              ]),
            ),
          },
          {
            key: 'cloud_storage',
            name: 'Cloud Storage',
            description: 'Secure document and attachment storage',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                `${p.limits.storageGb || 1} GB`,
              ]),
            ),
          },
          {
            key: 'support_level',
            name: 'Support Channel',
            description: 'Support channel and response priority',
            values: Object.fromEntries(
              sortedPlans.map((p) => [
                p.id,
                p.id === 'free' ? 'Community Support' : 'Priority Support',
              ]),
            ),
          },
        ],
      },
    ];
  }

  /**
   * Retrieves complete subscription details, plan limits, live usage, and active seats for a workspace tenant.
   * Internal platform tenants automatically receive full Enterprise entitlements without customer billing.
   */
  async getWorkspaceSubscription(tenantId: string): Promise<WorkspaceSubscriptionDetails> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        subscriptionStatus: true,
        billingCycle: true,
        trialStart: true,
        trialEnd: true,
        currentPeriodEnd: true,
        currency: true,
        type: true,
        isPlatformTenant: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Workspace tenant '${tenantId}' not found.`);
    }

    const isPlatformTenant = tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';

    // Super Admin / Platform internal tenant always receives top Business/Enterprise plan
    const effectivePlanId = isPlatformTenant ? 'business' : tenant.plan;

    const [planDef, availablePlans] = await Promise.all([
      this.resolvePlanDefinition(effectivePlanId),
      this.getAvailablePlans(),
    ]);

    const comparisonMatrix = this.getDynamicComparisonMatrix(availablePlans);

    // Query live resource counts in parallel for accurate usage reporting
    const [userCount, contactCount, leadCount, taskCount, dealCount, attachmentAgg] = await Promise.all([
      this.prisma.tenantUser.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.customer.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.lead.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.task.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.deal.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.attachment.aggregate({
        where: { tenantId },
        _sum: { fileSize: true },
      }),
    ]);

    const calculateLimit = (current: number, maxLimit: number) => {
      if (isPlatformTenant || maxLimit === -1 || maxLimit === null || maxLimit === undefined) {
        return {
          current,
          limit: -1,
          remaining: 999999,
          percentage: 0,
          isLimitReached: false,
        };
      }
      const remaining = Math.max(0, maxLimit - current);
      const percentage = Math.min(100, Math.round((current / maxLimit) * 100));
      return {
        current,
        limit: maxLimit,
        remaining,
        percentage,
        isLimitReached: current >= maxLimit,
      };
    };

    const totalBytes = attachmentAgg._sum.fileSize || 0;
    const storageGbUsed = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(3));

    const usage: WorkspaceUsageStats = {
      users: calculateLimit(userCount, planDef.limits.maxUsers),
      contacts: calculateLimit(contactCount, planDef.limits.maxContacts),
      leads: calculateLimit(leadCount, planDef.limits.maxLeads),
      tasks: calculateLimit(taskCount, planDef.limits.maxTasks),
      pipelines: calculateLimit(1, planDef.limits.maxPipelines),
      customFields: calculateLimit(0, planDef.limits.maxCustomFields),
      deals: calculateLimit(dealCount, planDef.limits.maxDeals ?? -1),
      automations: calculateLimit(0, planDef.limits.maxAutomations ?? -1),
      storageGb: calculateLimit(storageGbUsed, planDef.limits.storageGb ?? -1),
      apiRequests: calculateLimit(0, planDef.limits.maxApiRequests ?? -1),
    };

    let trialDaysRemaining: number | null = null;
    if (tenant.trialEnd) {
      const now = Date.now();
      const end = new Date(tenant.trialEnd).getTime();
      trialDaysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }

    const billingCycle = (tenant.billingCycle === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual';
    const seats = Math.max(userCount, 1);
    const unitPrice = billingCycle === 'annual' ? Math.round(planDef.annualPriceNum / 12) : planDef.priceNum;
    const totalRecurringAmount = isPlatformTenant || planDef.pricingMode === 'CUSTOM' ? 0 : unitPrice * seats;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantType: isPlatformTenant ? 'PLATFORM' : 'CUSTOMER',
      isPlatformTenant,
      planId: planDef.id,
      planName: planDef.name,
      status: isPlatformTenant ? 'ACTIVE' : tenant.subscriptionStatus || 'ACTIVE',
      billingCycle,
      trialStart: tenant.trialStart?.toISOString() || null,
      trialEnd: tenant.trialEnd?.toISOString() || null,
      trialDaysRemaining,
      currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() || null,
      currency: tenant.currency || 'INR',
      seats,
      activeUsers: userCount,
      monthlyPricePerUser: isPlatformTenant ? 0 : planDef.priceNum,
      annualPricePerUser: isPlatformTenant ? 0 : planDef.annualPriceNum > 0 ? Math.round(planDef.annualPriceNum / 12) : planDef.priceNum,
      totalRecurringAmount,
      plan: planDef,
      usage,
      entitledFeatures: planDef.features,
      availablePlans,
      comparisonMatrix,
    };
  }

  /**
   * Authoritative server-side price & quote calculation in integer minor units (paise/cents).
   */
  async calculateQuote(
    tenantId: string,
    targetPlanId: string,
    requestedSeats?: number,
    billingCycle: 'monthly' | 'annual' = 'monthly',
  ): Promise<SubscriptionQuote> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, currency: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found.`);
    }

    const isPlatformTenant = tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';

    const [currentPlanDef, targetPlanDef] = await Promise.all([
      this.resolvePlanDefinition(tenant.plan),
      this.resolvePlanDefinition(targetPlanId),
    ]);

    const activeUsersCount = await this.prisma.tenantUser.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const minSeats = Math.max(activeUsersCount, 1);
    const seats = Math.max(requestedSeats || minSeats, minSeats);

    if (targetPlanDef.limits.maxUsers !== -1 && seats > targetPlanDef.limits.maxUsers) {
      throw new BadRequestException(
        `The ${targetPlanDef.name} plan supports a maximum of ${targetPlanDef.limits.maxUsers} seats. For larger teams, please choose Business.`,
      );
    }

    if (isPlatformTenant || targetPlanDef.pricingMode === 'CUSTOM' || targetPlanDef.id === 'free') {
      return {
        planId: targetPlanDef.id,
        planName: targetPlanDef.name,
        seats,
        billingCycle,
        currency: tenant.currency || 'INR',
        unitPricePerMonth: 0,
        subtotal: 0,
        annualDiscountPercentage: 0,
        annualDiscountAmount: 0,
        taxRatePercentage: 0,
        taxAmount: 0,
        totalAmount: 0,
        totalAmountInMinorUnits: 0,
        recurringAmount: 0,
        intervalDescription: targetPlanDef.id === 'free' ? 'free tier' : 'internal platform plan',
        isUpgrade: true,
        isDowngrade: false,
        effectiveImmediately: true,
      };
    }

    const unitPriceMonthly = targetPlanDef.priceNum;
    let subtotal = 0;
    let annualDiscountAmount = 0;
    const annualDiscountPercentage = billingCycle === 'annual' ? 17 : 0;

    if (billingCycle === 'annual') {
      const baseYearly = targetPlanDef.annualPriceNum > 0 ? targetPlanDef.annualPriceNum : unitPriceMonthly * 10;
      subtotal = baseYearly * seats;
      const fullMonthlyYearly = unitPriceMonthly * 12 * seats;
      annualDiscountAmount = Math.max(0, fullMonthlyYearly - subtotal);
    } else {
      subtotal = unitPriceMonthly * seats;
    }

    const taxRatePercentage = tenant.currency === 'INR' ? 18 : 0;
    const taxAmount = Math.round((subtotal * taxRatePercentage) / 100);
    const totalAmount = subtotal + taxAmount;
    const totalAmountInMinorUnits = Math.round(totalAmount * 100); // e.g. ₹499 -> 49900 paise
    const recurringAmount = billingCycle === 'annual' ? totalAmount : subtotal;

    const isUpgrade = targetPlanDef.displayOrder > currentPlanDef.displayOrder;
    const isDowngrade = targetPlanDef.displayOrder < currentPlanDef.displayOrder;

    return {
      planId: targetPlanDef.id,
      planName: targetPlanDef.name,
      seats,
      billingCycle,
      currency: tenant.currency || 'INR',
      unitPricePerMonth: unitPriceMonthly,
      subtotal,
      annualDiscountPercentage,
      annualDiscountAmount,
      taxRatePercentage,
      taxAmount,
      totalAmount,
      totalAmountInMinorUnits,
      recurringAmount,
      intervalDescription: billingCycle === 'annual' ? 'billed annually' : 'billed monthly',
      isUpgrade,
      isDowngrade,
      effectiveImmediately: true,
    };
  }

  /**
   * Creates a payment provider order for customer checkout.
   */
  async createCheckoutOrder(
    tenantId: string,
    targetPlanId: string,
    seats?: number,
    billingCycle: 'monthly' | 'annual' = 'monthly',
    userId?: string,
  ): Promise<{ quote: SubscriptionQuote; order: PaymentOrderResult & { customer?: { name?: string; email?: string; contact?: string } } }> {
    this.logger.log(
      `[CHECKOUT ORDER INITIATED] Tenant: ${tenantId} | Plan: ${targetPlanId} | Requested Seats: ${seats ?? 'default'} | Cycle: ${billingCycle} | User: ${userId || 'anonymous'}`,
    );

    const quote = await this.calculateQuote(tenantId, targetPlanId, seats, billingCycle);

    this.logger.log(
      `[CHECKOUT QUOTE COMPUTED] Plan: ${quote.planName} (${quote.planId}) | Amount: ₹${quote.totalAmount} (${quote.totalAmountInMinorUnits} paise) | Seats: ${quote.seats} | Tax (18%): ₹${quote.taxAmount}`,
    );

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, currency: true },
    });

    let customerName = tenant?.name;
    let customerEmail: string | undefined;
    let customerPhone: string | undefined;

    if (userId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, phone: true },
        });
        if (user) {
          customerName = user.name || tenant?.name;
          customerEmail = user.email || undefined;
          customerPhone = user.phone || undefined;
        }
      } catch (err: any) {
        this.logger.debug(`Could not load user details for prefill: ${err.message}`);
      }
    }

    const order = await this.billingGateway.createCheckoutOrder({
      tenantId,
      planId: quote.planId,
      planName: quote.planName,
      billingCycle: quote.billingCycle,
      seats: quote.seats,
      amountInMinorUnits: quote.totalAmountInMinorUnits,
      currency: quote.currency,
      customerName,
    });

    this.logger.log(
      `[CHECKOUT ORDER RESULT] Provider: ${order.provider} | Order ID: ${order.orderId} | Amount: ${order.amount} ${order.currency}`,
    );

    return {
      quote,
      order: {
        ...order,
        customer: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
      },
    };
  }

  /**
   * Cryptographically verifies payment signature and applies subscription upgrade in an atomic transaction.
   */
  async verifyAndActivatePayment(
    tenantId: string,
    params: {
      orderId: string;
      paymentId: string;
      signature: string;
      planId: string;
      billingCycle?: 'monthly' | 'annual';
      seats?: number;
    },
    userId?: string,
  ) {
    if (!params.orderId || !params.paymentId || !params.signature || !params.planId) {
      throw new BadRequestException('orderId, paymentId, signature, and planId are strictly required.');
    }

    this.logger.log(
      `[PAYMENT VERIFY INITIATED] Tenant: ${tenantId} | Order: ${params.orderId} | Payment: ${params.paymentId} | Plan: ${params.planId}`,
    );

    // 1. Cryptographic HMAC SHA256 Signature Verification
    const isValid = await this.billingGateway.verifyPaymentSignature({
      orderId: params.orderId,
      paymentId: params.paymentId,
      signature: params.signature,
    });

    if (!isValid) {
      this.logger.warn(
        `[PAYMENT VERIFICATION FAILED] Tenant: ${tenantId} | Order: ${params.orderId} | Payment: ${params.paymentId}`,
      );
      throw new BadRequestException('Payment signature verification failed.');
    }

    this.logger.log(
      `[PAYMENT SIGNATURE VALID] Tenant: ${tenantId} | Order: ${params.orderId} | Payment: ${params.paymentId} -> Proceeding to plan activation...`,
    );

    // 2. Authoritative Price Resolution
    const billingCycle = params.billingCycle || 'monthly';
    const quote = await this.calculateQuote(tenantId, params.planId, params.seats, billingCycle);

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.prisma.$transaction(async (tx) => {
      // 3. Replay Protection & Tenant Isolation: Check if this Razorpay payment ID was already processed
      const existingPayment = await tx.platformPayment.findFirst({
        where: {
          OR: [
            { providerPaymentId: params.paymentId },
            { gatewayTransactionId: params.paymentId },
          ],
        },
      });

      if (existingPayment) {
        if (existingPayment.tenantId !== tenantId) {
          throw new ForbiddenException('Payment identifier does not belong to this tenant.');
        }
        if (existingPayment.status === 'SUCCESS') {
          this.logger.log(`[PAYMENT IDEMPOTENT] Payment '${params.paymentId}' already recorded as SUCCESS.`);
          const currentSub = await tx.platformSubscription.findFirst({ where: { tenantId } });
          const currentInv = await tx.platformInvoice.findFirst({ where: { id: existingPayment.platformInvoiceId } });
          return { subscription: currentSub, invoice: currentInv };
        }
      }

      // 4. Synchronize or create PlatformSubscription
      const existingSub = await tx.platformSubscription.findFirst({
        where: { tenantId },
      });

      const subData = {
        tenantId,
        planId: quote.planId,
        billingCycle,
        seats: quote.seats,
        status: 'ACTIVE',
        unitPrice: quote.unitPricePerMonth,
        recurringAmount: quote.subtotal,
        currency: quote.currency,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        providerOrderId: params.orderId,
      };

      const subscription = existingSub
        ? await tx.platformSubscription.update({
            where: { id: existingSub.id },
            data: subData,
          })
        : await tx.platformSubscription.create({
            data: subData,
          });

      // 5. Generate Platform Invoice
      const invoiceCount = await tx.platformInvoice.count();
      const invoiceNumber = `CP-INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

      const platformInvoice = await tx.platformInvoice.create({
        data: {
          tenantId,
          subscriptionId: subscription?.id || null,
          invoiceNumber,
          planName: quote.planName,
          billingCycle,
          seats: quote.seats,
          invoiceDate: now,
          dueDate: now,
          currency: quote.currency,
          subtotal: quote.subtotal,
          discountAmount: quote.annualDiscountAmount,
          taxRate: quote.taxRatePercentage,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          paidAmount: quote.totalAmount,
          status: 'PAID',
          paymentStatus: 'PAID',
          paidAt: now,
          items: {
            create: [
              {
                description: `${quote.planName} Plan Subscription (${quote.seats} seats, ${billingCycle})`,
                quantity: quote.seats,
                unitPrice: quote.unitPricePerMonth,
                taxAmount: quote.taxAmount,
                totalAmount: quote.totalAmount,
              },
            ],
          },
        },
      });

      // 6. Record Platform Payment
      const paymentCount = await tx.platformPayment.count();
      const paymentNumber = `CP-PAY-${now.getFullYear()}-${String(paymentCount + 1).padStart(6, '0')}`;

      await tx.platformPayment.create({
        data: {
          platformInvoiceId: platformInvoice?.id || `inv_${now.getTime()}`,
          tenantId,
          paymentNumber,
          gatewayTransactionId: params.paymentId,
          gatewayProvider: 'RAZORPAY',
          amount: quote.totalAmount,
          currency: quote.currency,
          paymentMethod: 'CARD',
          status: 'SUCCESS',
          paymentDate: now,
          providerPaymentId: params.paymentId,
          providerOrderId: params.orderId,
          providerSignature: params.signature,
        },
      });

      // 7. Update Tenant Record
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          plan: quote.planId,
          billingCycle,
          subscriptionStatus: 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
      });

      // 8. Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'PAYMENT_VERIFIED_AND_SUBSCRIPTION_ACTIVATED',
          module: 'BILLING',
          details: {
            planId: quote.planId,
            seats: quote.seats,
            billingCycle,
            amount: quote.totalAmount,
            invoiceNumber,
            paymentNumber,
            gatewayPaymentId: params.paymentId,
            orderId: params.orderId,
          },
        },
      });

      return {
        subscription,
        invoice: platformInvoice,
      };
    });
  }

  /**
   * Switches workspace billing cycle.
   * Internal platform tenants switch cycle directly without customer billing.
   */
  async switchBillingCycle(
    tenantId: string,
    billingCycle: 'monthly' | 'annual',
    userId?: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const isPlatformTenant = tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';

    if (isPlatformTenant) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { billingCycle },
      });
      return this.getWorkspaceSubscription(tenantId);
    }

    // For customer tenants on Free, update directly
    if (tenant.plan === 'free') {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { billingCycle },
      });
      return this.getWorkspaceSubscription(tenantId);
    }

    // For active paid customer tenants, compute quote
    return this.calculateQuote(tenantId, tenant.plan, undefined, billingCycle);
  }

  /**
   * Changes workspace subscription plan safely.
   * Internal platform tenants and free downgrades execute directly.
   * Customer upgrades to paid tiers must go through verified payment flow.
   */
  async changePlan(
    tenantId: string,
    targetPlanId: string,
    billingCycle: 'monthly' | 'annual' = 'monthly',
    seats?: number,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const isPlatformTenant = tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';
    const normTarget = normalizePlanId(targetPlanId);

    // Platform tenants always operate on enterprise/business
    if (isPlatformTenant) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'business',
          billingCycle,
          subscriptionStatus: 'ACTIVE',
        },
      });
      return this.getWorkspaceSubscription(tenantId);
    }

    // Free plan downgrade
    if (normTarget === 'free') {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'free',
          billingCycle,
          subscriptionStatus: 'ACTIVE',
        },
      });
      return this.getWorkspaceSubscription(tenantId);
    }

    throw new BadRequestException(
      'Upgrading to a paid subscription requires verified checkout payment. Please use createCheckoutOrder.',
    );
  }

  /**
   * Checks if tenant plan includes a specific feature flag.
   */
  async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, subscriptionStatus: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) return false;

    // Platform internal tenant has all features
    if (tenant.isPlatformTenant === true || tenant.type === 'PLATFORM') {
      return true;
    }

    if (tenant.subscriptionStatus === 'SUSPENDED' || tenant.subscriptionStatus === 'EXPIRED') {
      return false;
    }

    const planDef = await this.resolvePlanDefinition(tenant.plan);
    return planDef.features.includes(featureKey);
  }

  /**
   * Asserts that tenant plan has the required feature, or throws ForbiddenException with structured error.
   */
  async assertFeature(tenantId: string, featureKey: string, customMessage?: string): Promise<void> {
    const isEntitled = await this.hasFeature(tenantId, featureKey);
    if (!isEntitled) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true },
      });
      const planDef = await this.resolvePlanDefinition(tenant?.plan);
      const availablePlans = await this.getAvailablePlans();
      
      const recommendedPlan = availablePlans.find((p) =>
        p.features.includes(featureKey),
      );

      throw new ForbiddenException({
        statusCode: 403,
        error: 'PLAN_FEATURE_LOCKED',
        feature: featureKey,
        currentPlan: planDef.name,
        requiredPlan: recommendedPlan?.name || 'Growth',
        message:
          customMessage ||
          `The feature '${featureKey}' is not included in your current ${planDef.name} plan. Upgrade to unlock this capability.`,
      });
    }
  }

  /**
   * Asserts that workspace is within the specified limit before creating new records.
   */
  async assertWithinLimit(
    tenantId: string,
    limitKey:
      | 'maxUsers'
      | 'maxContacts'
      | 'maxLeads'
      | 'maxTasks'
      | 'maxPipelines'
      | 'maxCustomFields'
      | 'maxDeals'
      | 'maxAutomations',
    increment = 1,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, subscriptionStatus: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) return;

    // Platform tenant has no limit restrictions
    if (tenant.isPlatformTenant === true || tenant.type === 'PLATFORM') {
      return;
    }

    const planDef = await this.resolvePlanDefinition(tenant.plan);
    const maxLimit = planDef.limits[limitKey];

    if (maxLimit === -1 || maxLimit === null || maxLimit === undefined) return; // Unlimited

    let currentCount = 0;
    if (limitKey === 'maxUsers') {
      currentCount = await this.prisma.tenantUser.count({ where: { tenantId, status: 'ACTIVE' } });
    } else if (limitKey === 'maxContacts') {
      currentCount = await this.prisma.customer.count({ where: { tenantId, deletedAt: null } });
    } else if (limitKey === 'maxLeads') {
      currentCount = await this.prisma.lead.count({ where: { tenantId, deletedAt: null } });
    } else if (limitKey === 'maxTasks') {
      currentCount = await this.prisma.task.count({ where: { tenantId, deletedAt: null } });
    } else if (limitKey === 'maxDeals') {
      currentCount = await this.prisma.deal.count({ where: { tenantId, deletedAt: null } });
    }

    if (currentCount + increment > maxLimit) {
      const entityLabelMap: Record<string, string> = {
        maxUsers: 'user',
        maxContacts: 'contact',
        maxLeads: 'lead',
        maxTasks: 'task',
        maxPipelines: 'pipeline',
        maxCustomFields: 'custom field',
        maxDeals: 'deal',
        maxAutomations: 'automation',
      };
      const entityLabel = entityLabelMap[limitKey] || 'record';
      const nextPlanName = planDef.id === 'free' ? 'Growth' : 'Business';

      throw new ForbiddenException({
        statusCode: 403,
        error: 'PLAN_LIMIT_REACHED',
        limitKey,
        currentCount,
        maxLimit,
        currentPlan: planDef.name,
        requiredPlan: nextPlanName,
        message: `${planDef.name} plan ${entityLabel} limit reached. ${currentCount} / ${maxLimit} ${entityLabel}s used. Upgrade to ${nextPlanName} to add more ${entityLabel}s.`,
      });
    }
  }

  /**
   * Returns billing history and invoice records for the workspace.
   */
  async getWorkspaceInvoices(tenantId: string): Promise<BillingInvoiceItem[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, currency: true, createdAt: true, billingCycle: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) return [];

    // Platform internal tenant has no customer invoices
    if (tenant.isPlatformTenant === true || tenant.type === 'PLATFORM') {
      return [];
    }

    const dbInvoices = await this.prisma.platformInvoice.findMany({
      where: { tenantId },
      orderBy: { invoiceDate: 'desc' },
      take: 50,
    });

    if (dbInvoices && dbInvoices.length > 0) {
      return dbInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.invoiceDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        description: `${inv.planName} Plan (${inv.billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
        planName: inv.planName,
        seats: inv.seats,
        amount: Number(inv.totalAmount || 0),
        currency: inv.currency,
        status: (inv.paymentStatus === 'PAID' ? 'PAID' : inv.status === 'PAID' ? 'PAID' : 'PENDING') as any,
        downloadUrl: inv.pdfUrl,
      }));
    }

    return [];
  }

  /**
   * Records an enterprise sales inquiry from an organization admin.
   */
  async submitEnterpriseInquiry(
    tenantId: string,
    userId: string,
    details: { message?: string; teamSize?: string; phone?: string },
  ) {
    const [tenant, user] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    this.logger.log(
      `[ENTERPRISE INQUIRY] Tenant: ${tenant?.name} (${tenantId}) | User: ${user?.email} | Team Size: ${details.teamSize} | Msg: ${details.message}`,
    );

    return {
      success: true,
      message: 'Thank you! Our enterprise sales team will contact you within 24 business hours.',
    };
  }
}
