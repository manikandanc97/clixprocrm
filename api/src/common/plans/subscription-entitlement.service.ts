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
} from './plan-definitions.constant';

export interface WorkspaceUsageStats {
  users: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  contacts: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  leads: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  deals: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  automations: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  storageGb: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
  apiRequests: { current: number; limit: number; remaining: number; percentage: number; isLimitReached: boolean };
}

export interface WorkspaceSubscriptionDetails {
  tenantId: string;
  tenantName: string;
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

/**
 * Enterprise Billing Provider Interface
 * Pluggable abstraction for Razorpay, Stripe, or built-in CRM activation engine
 */
export interface IBillingProvider {
  createCustomer(tenantId: string, email: string, name: string): Promise<string>;
  calculateTax(amount: number, currency: string, country?: string): Promise<number>;
  createCheckoutSession(quote: SubscriptionQuote, tenantId: string, returnUrl: string): Promise<{ checkoutUrl?: string; orderId?: string }>;
  cancelSubscription(tenantId: string): Promise<boolean>;
}

@Injectable()
export class BuiltInBillingProvider implements IBillingProvider {
  async createCustomer(tenantId: string, email: string, name: string): Promise<string> {
    return `cust_${tenantId.slice(0, 8)}`;
  }

  async calculateTax(amount: number, currency: string): Promise<number> {
    // Standard 18% GST for INR or 0% for tax-inclusive
    return currency === 'INR' ? Math.round(amount * 0.18) : 0;
  }

  async createCheckoutSession(quote: SubscriptionQuote, tenantId: string): Promise<{ checkoutUrl?: string; orderId?: string }> {
    return { orderId: `order_${Date.now()}_${tenantId.slice(0, 6)}` };
  }

  async cancelSubscription(): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class SubscriptionEntitlementService {
  private readonly logger = new Logger(SubscriptionEntitlementService.name);
  private readonly billingProvider: IBillingProvider = new BuiltInBillingProvider();

  constructor(private readonly prisma: PrismaService) {}

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
        return {
          id: dbPlan.id,
          name: dbPlan.name,
          price: dbPlan.price || `₹${dbPlan.priceNum?.toLocaleString() || 0}`,
          priceNum: Number(dbPlan.priceNum || 0),
          annualPriceNum: Number(dbPlan.annualPriceNum || (dbPlan.priceNum ? dbPlan.priceNum * 10 : 0)),
          currency: dbPlan.currency || 'INR',
          billingInterval: 'month',
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
            maxDeals: parseLimit(dbPlan.maxDeals ?? dbPlan.maxLeads),
            maxAutomations: parseLimit(dbPlan.maxAutomations ?? 100),
            storageGb: dbPlan.storageGb || 10,
            maxApiRequests: parseLimit(dbPlan.maxApiRequests),
            dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
          },
          features: Array.isArray(dbPlan.features) ? dbPlan.features : [],
          featureDescriptions: Array.isArray(dbPlan.features) ? dbPlan.features : [],
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
        },
        orderBy: [{ sortOrder: 'asc' }, { priceNum: 'asc' }],
      });

      if (dbPlans && dbPlans.length > 0) {
        return dbPlans.map((dbPlan: any) => {
          const parseLimit = (val?: number) => (val === undefined || val >= 1000000 ? -1 : val);
          return {
            id: dbPlan.id,
            name: dbPlan.name,
            price: dbPlan.price || `₹${dbPlan.priceNum?.toLocaleString() || 0}`,
            priceNum: Number(dbPlan.priceNum || 0),
            annualPriceNum: Number(dbPlan.annualPriceNum || (dbPlan.priceNum ? dbPlan.priceNum * 10 : 0)),
            currency: dbPlan.currency || 'INR',
            billingInterval: 'month',
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
              maxDeals: parseLimit(dbPlan.maxDeals ?? dbPlan.maxLeads),
              maxAutomations: parseLimit(dbPlan.maxAutomations ?? 100),
              storageGb: dbPlan.storageGb || 10,
              maxApiRequests: parseLimit(dbPlan.maxApiRequests),
              dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
            },
            features: Array.isArray(dbPlan.features) ? dbPlan.features : [],
            featureDescriptions: Array.isArray(dbPlan.features) ? dbPlan.features : [],
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
   * Retrieves complete subscription details, plan limits, live usage, and active seats for a workspace tenant.
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
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Workspace tenant '${tenantId}' not found.`);
    }

    const [planDef, availablePlans] = await Promise.all([
      this.resolvePlanDefinition(tenant.plan),
      this.getAvailablePlans(),
    ]);

    // Query live resource counts in parallel for accurate usage reporting
    const [userCount, contactCount, leadCount, dealCount, attachmentAgg] = await Promise.all([
      this.prisma.tenantUser.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.customer.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.lead.count({
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
      if (maxLimit === -1) {
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
      deals: calculateLimit(dealCount, planDef.limits.maxDeals),
      automations: calculateLimit(0, planDef.limits.maxAutomations),
      storageGb: calculateLimit(storageGbUsed, planDef.limits.storageGb),
      apiRequests: calculateLimit(0, planDef.limits.maxApiRequests),
    };

    // Calculate trial days remaining if in trial mode
    let trialDaysRemaining: number | null = null;
    if (tenant.trialEnd) {
      const now = Date.now();
      const end = new Date(tenant.trialEnd).getTime();
      trialDaysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }

    const billingCycle = (tenant.billingCycle === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual';
    const seats = Math.max(userCount, 1);
    const unitPrice = billingCycle === 'annual' ? Math.round(planDef.annualPriceNum / 12) : planDef.priceNum;
    const totalRecurringAmount = planDef.pricingMode === 'CUSTOM' ? 0 : unitPrice * seats;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      planId: planDef.id,
      planName: planDef.name,
      status: tenant.subscriptionStatus || 'ACTIVE',
      billingCycle,
      trialStart: tenant.trialStart?.toISOString() || null,
      trialEnd: tenant.trialEnd?.toISOString() || null,
      trialDaysRemaining,
      currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() || null,
      currency: tenant.currency || 'INR',
      seats,
      activeUsers: userCount,
      monthlyPricePerUser: planDef.priceNum,
      annualPricePerUser: planDef.annualPriceNum > 0 ? Math.round(planDef.annualPriceNum / 12) : planDef.priceNum,
      totalRecurringAmount,
      plan: planDef,
      usage,
      entitledFeatures: planDef.features,
      availablePlans,
    };
  }

  /**
   * Authoritative server-side price & quote calculation for seat-based subscription purchase/upgrade.
   */
  async calculateQuote(
    tenantId: string,
    targetPlanId: string,
    requestedSeats?: number,
    billingCycle: 'monthly' | 'annual' = 'monthly',
  ): Promise<SubscriptionQuote> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, currency: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found.`);
    }

    const [currentPlanDef, targetPlanDef] = await Promise.all([
      this.resolvePlanDefinition(tenant.plan),
      this.resolvePlanDefinition(targetPlanId),
    ]);

    const activeUsersCount = await this.prisma.tenantUser.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    // Enforce minimum seats equal to currently active users in workspace
    const minSeats = Math.max(activeUsersCount, 1);
    const seats = Math.max(requestedSeats || minSeats, minSeats);

    // Validate maximum limit for plan tier
    if (targetPlanDef.limits.maxUsers !== -1 && seats > targetPlanDef.limits.maxUsers) {
      throw new BadRequestException(
        `The ${targetPlanDef.name} plan supports a maximum of ${targetPlanDef.limits.maxUsers} seats. For larger teams, please choose Business or Enterprise.`,
      );
    }

    if (targetPlanDef.pricingMode === 'CUSTOM') {
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
        recurringAmount: 0,
        intervalDescription: 'custom contract',
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
      // 10 months rate for 12 months (e.g. 2 months free equivalent)
      const baseYearly = targetPlanDef.annualPriceNum > 0 ? targetPlanDef.annualPriceNum : unitPriceMonthly * 10;
      subtotal = baseYearly * seats;
      const fullMonthlyYearly = unitPriceMonthly * 12 * seats;
      annualDiscountAmount = Math.max(0, fullMonthlyYearly - subtotal);
    } else {
      subtotal = unitPriceMonthly * seats;
    }

    const taxAmount = await this.billingProvider.calculateTax(subtotal, tenant.currency || 'INR');
    const totalAmount = subtotal + taxAmount;
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
      taxRatePercentage: tenant.currency === 'INR' ? 18 : 0,
      taxAmount,
      totalAmount,
      recurringAmount,
      intervalDescription: billingCycle === 'annual' ? 'billed annually' : 'billed monthly',
      isUpgrade,
      isDowngrade,
      effectiveImmediately: true,
    };
  }

  /**
   * Checks if tenant plan includes a specific feature flag.
   */
  async hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, subscriptionStatus: true },
    });

    if (!tenant) return false;
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
    limitKey: 'maxUsers' | 'maxContacts' | 'maxLeads' | 'maxDeals' | 'maxAutomations',
    increment = 1,
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, subscriptionStatus: true },
    });

    if (!tenant) return;
    const planDef = await this.resolvePlanDefinition(tenant.plan);
    const maxLimit = planDef.limits[limitKey];

    if (maxLimit === -1) return; // Unlimited for enterprise

    let currentCount = 0;
    if (limitKey === 'maxUsers') {
      currentCount = await this.prisma.tenantUser.count({ where: { tenantId, status: 'ACTIVE' } });
    } else if (limitKey === 'maxContacts') {
      currentCount = await this.prisma.customer.count({ where: { tenantId, deletedAt: null } });
    } else if (limitKey === 'maxLeads') {
      currentCount = await this.prisma.lead.count({ where: { tenantId, deletedAt: null } });
    } else if (limitKey === 'maxDeals') {
      currentCount = await this.prisma.deal.count({ where: { tenantId, deletedAt: null } });
    }

    if (currentCount + increment > maxLimit) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'PLAN_LIMIT_REACHED',
        limitKey,
        currentCount,
        maxLimit,
        currentPlan: planDef.name,
        message: `You have reached your ${limitKey.replace('max', '')} limit (${currentCount}/${maxLimit}) on the ${planDef.name} plan. Please upgrade your subscription to add more records.`,
      });
    }
  }

  /**
   * Changes workspace subscription plan with seat validation and billing calculation.
   */
  async changePlan(
    tenantId: string,
    targetPlanId: string,
    billingCycle: 'monthly' | 'annual' = 'monthly',
    seats?: number,
  ) {
    const planDef = await this.resolvePlanDefinition(targetPlanId);

    // Calculate quote to validate seats and authoritative amounts
    const quote = await this.calculateQuote(tenantId, planDef.id, seats, billingCycle);

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: planDef.id,
        billingCycle,
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      },
    });

    this.logger.log(
      `Workspace '${tenantId}' updated subscription to plan '${planDef.id}' (${billingCycle}) for ${quote.seats} seats. Recurring: ${quote.recurringAmount} ${quote.currency}.`,
    );

    return this.getWorkspaceSubscription(tenantId);
  }

  /**
   * Returns billing history and invoice records for the workspace.
   */
  async getWorkspaceInvoices(tenantId: string): Promise<BillingInvoiceItem[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, currency: true, createdAt: true, billingCycle: true },
    });

    if (!tenant) return [];

    // Query real platform invoices from database
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

