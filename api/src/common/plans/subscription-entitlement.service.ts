import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingGatewayService } from '../billing/billing-gateway.service';
import { PaymentOrderResult } from '../billing/payment-gateway.interface';
import {
    CANONICAL_PLANS,
    getPlanDefinition,
    MatrixCategory,
    normalizePlanId,
    PlanDefinition,
} from './plan-definitions.constant';

import {
    BillingInvoiceItem,
    SubscriptionQuote,
    WorkspaceSubscriptionDetails,
    WorkspaceUsageStats,
} from './subscription-entitlement.interface';
import { buildDynamicComparisonMatrix } from './subscription-matrix.util';
import { executePaymentActivationTransaction } from './subscription-payment-activator.util';
import {
    assembleWorkspaceUsage,
    mapDbPlanToDefinition,
} from './subscription-plan-mapper.util';
import { computeSubscriptionQuote } from './subscription-quote-calculator.util';

export type {
    BillingInvoiceItem, SubscriptionQuote, WorkspaceSubscriptionDetails, WorkspaceUsageStats
};

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
  async resolvePlanDefinition(
    rawPlanId?: string | null,
  ): Promise<PlanDefinition> {
    const cleanId = (rawPlanId || 'free').toLowerCase().trim();
    try {
      const dbPlan = await this.prisma.plan.findFirst({
        where: {
          OR: [
            { id: { equals: cleanId, mode: 'insensitive' } },
            { name: { equals: cleanId, mode: 'insensitive' } },
          ],
        },
      });

      if (dbPlan) {
        return mapDbPlanToDefinition(dbPlan);
      }
    } catch (err: any) {
      this.logger.debug(
        `Failed to fetch dynamic plan '${cleanId}' from database, using fallback: ${err.message}`,
      );
    }

    return getPlanDefinition(cleanId);
  }

  /**
   * Retrieves all active platform plans from the database.
   */
  async getAvailablePlans(): Promise<PlanDefinition[]> {
    try {
      const dbPlans = await this.prisma.plan.findMany({
        where: {
          status: 'ACTIVE',
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { priceNum: 'asc' }],
      });

      if (dbPlans && dbPlans.length > 0) {
        return dbPlans.map((dbPlan) => mapDbPlanToDefinition(dbPlan));
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to load database plans, falling back to static constants: ${err.message}`,
      );
    }

    return Object.values(CANONICAL_PLANS).filter((p) => p.isActive);
  }

  /**
   * Dynamically constructs the Feature Comparison Matrix from the live canonical plans.
   */
  getDynamicComparisonMatrix(plans: PlanDefinition[]): MatrixCategory[] {
    return buildDynamicComparisonMatrix(plans);
  }

  /**
   * Retrieves complete subscription details, plan limits, live usage, and active seats for a workspace tenant.
   * Internal platform tenants automatically receive full Enterprise entitlements without customer billing.
   */
  async getWorkspaceSubscription(
    tenantId: string,
  ): Promise<WorkspaceSubscriptionDetails> {
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

    const isPlatformTenant =
      tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';

    // Super Admin / Platform internal tenant always receives top Business/Enterprise plan
    const effectivePlanId = isPlatformTenant ? 'business' : tenant.plan;

    const [planDef, availablePlans] = await Promise.all([
      this.resolvePlanDefinition(effectivePlanId),
      this.getAvailablePlans(),
    ]);

    const comparisonMatrix = this.getDynamicComparisonMatrix(availablePlans);

    // Query live resource counts in parallel for accurate usage reporting
    const [
      userCount,
      contactCount,
      leadCount,
      taskCount,
      dealCount,
      attachmentAgg,
    ] = await Promise.all([
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

    const totalBytes = attachmentAgg._sum.fileSize || 0;
    const storageGbUsed = Number(
      (totalBytes / (1024 * 1024 * 1024)).toFixed(3),
    );

    const usage: WorkspaceUsageStats = assembleWorkspaceUsage(
      {
        userCount,
        contactCount,
        leadCount,
        taskCount,
        dealCount,
        storageGbUsed,
      },
      planDef.limits,
      isPlatformTenant,
    );

    let trialDaysRemaining: number | null = null;
    if (tenant.trialEnd) {
      const now = Date.now();
      const end = new Date(tenant.trialEnd).getTime();
      trialDaysRemaining = Math.max(
        0,
        Math.ceil((end - now) / (1000 * 60 * 60 * 24)),
      );
    }

    const billingCycle =
      tenant.billingCycle === 'annual' ? 'annual' : 'monthly';
    const seats = Math.max(userCount, 1);
    const unitPrice =
      billingCycle === 'annual'
        ? Math.round(planDef.annualPriceNum / 12)
        : planDef.priceNum;
    const totalRecurringAmount =
      isPlatformTenant || planDef.pricingMode === 'CUSTOM'
        ? 0
        : unitPrice * seats;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantType: isPlatformTenant ? 'PLATFORM' : 'CUSTOMER',
      isPlatformTenant,
      planId: planDef.id,
      planName: planDef.name,
      status: isPlatformTenant
        ? 'ACTIVE'
        : tenant.subscriptionStatus || 'ACTIVE',
      billingCycle,
      trialStart: tenant.trialStart?.toISOString() || null,
      trialEnd: tenant.trialEnd?.toISOString() || null,
      trialDaysRemaining,
      currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() || null,
      currency: tenant.currency || 'INR',
      seats,
      activeUsers: userCount,
      monthlyPricePerUser: isPlatformTenant ? 0 : planDef.priceNum,
      annualPricePerUser: isPlatformTenant
        ? 0
        : planDef.annualPriceNum > 0
          ? Math.round(planDef.annualPriceNum / 12)
          : planDef.priceNum,
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
      select: {
        plan: true,
        currency: true,
        type: true,
        isPlatformTenant: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found.`);
    }

    const isPlatformTenant =
      tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';

    const [currentPlanDef, targetPlanDef] = await Promise.all([
      this.resolvePlanDefinition(tenant.plan),
      this.resolvePlanDefinition(targetPlanId),
    ]);

    const activeUsersCount = await this.prisma.tenantUser.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const minSeats = Math.max(activeUsersCount, 1);
    const seats = Math.max(requestedSeats || minSeats, minSeats);

    return computeSubscriptionQuote(
      tenant.currency || 'INR',
      currentPlanDef,
      targetPlanDef,
      seats,
      billingCycle,
      isPlatformTenant,
    );
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
  ): Promise<{
    quote: SubscriptionQuote;
    order: PaymentOrderResult & {
      customer?: { name?: string; email?: string; contact?: string };
    };
  }> {
    this.logger.log(
      `[CHECKOUT ORDER INITIATED] Tenant: ${tenantId} | Plan: ${targetPlanId} | Requested Seats: ${seats ?? 'default'} | Cycle: ${billingCycle} | User: ${userId || 'anonymous'}`,
    );

    const quote = await this.calculateQuote(
      tenantId,
      targetPlanId,
      seats,
      billingCycle,
    );

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
        this.logger.debug(
          `Could not load user details for prefill: ${err.message}`,
        );
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
    if (
      !params.orderId ||
      !params.paymentId ||
      !params.signature ||
      !params.planId
    ) {
      throw new BadRequestException(
        'orderId, paymentId, signature, and planId are strictly required.',
      );
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
    const quote = await this.calculateQuote(
      tenantId,
      params.planId,
      params.seats,
      billingCycle,
    );

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.prisma.$transaction(async (tx) => {
      return executePaymentActivationTransaction(
        tx,
        {
          tenantId,
          orderId: params.orderId,
          paymentId: params.paymentId,
          signature: params.signature,
          quote,
          billingCycle,
          now,
          periodEnd,
          userId,
        },
        this.logger,
      );
    });
  }

  /**
   * Switches workspace billing cycle.
   * Internal platform tenants switch cycle directly without customer billing.
   */
  async switchBillingCycle(
    tenantId: string,
    billingCycle: 'monthly' | 'annual',
    _userId?: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const isPlatformTenant =
      tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';

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
    _seats?: number,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, plan: true, type: true, isPlatformTenant: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const isPlatformTenant =
      tenant.isPlatformTenant === true || tenant.type === 'PLATFORM';
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
      select: {
        plan: true,
        subscriptionStatus: true,
        type: true,
        isPlatformTenant: true,
      },
    });

    if (!tenant) return false;

    // Platform internal tenant has all features
    if (tenant.isPlatformTenant === true || tenant.type === 'PLATFORM') {
      return true;
    }

    if (
      tenant.subscriptionStatus === 'SUSPENDED' ||
      tenant.subscriptionStatus === 'EXPIRED'
    ) {
      return false;
    }

    const planDef = await this.resolvePlanDefinition(tenant.plan);
    return planDef.features.includes(featureKey);
  }

  /**
   * Asserts that tenant plan has the required feature, or throws ForbiddenException with structured error.
   */
  async assertFeature(
    tenantId: string,
    featureKey: string,
    customMessage?: string,
  ): Promise<void> {
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
      select: {
        plan: true,
        subscriptionStatus: true,
        type: true,
        isPlatformTenant: true,
      },
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
      currentCount = await this.prisma.tenantUser.count({
        where: { tenantId, status: 'ACTIVE' },
      });
    } else if (limitKey === 'maxContacts') {
      currentCount = await this.prisma.customer.count({
        where: { tenantId, deletedAt: null },
      });
    } else if (limitKey === 'maxLeads') {
      currentCount = await this.prisma.lead.count({
        where: { tenantId, deletedAt: null },
      });
    } else if (limitKey === 'maxTasks') {
      currentCount = await this.prisma.task.count({
        where: { tenantId, deletedAt: null },
      });
    } else if (limitKey === 'maxDeals') {
      currentCount = await this.prisma.deal.count({
        where: { tenantId, deletedAt: null },
      });
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
      select: {
        plan: true,
        currency: true,
        createdAt: true,
        billingCycle: true,
        type: true,
        isPlatformTenant: true,
      },
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
        status: (inv.paymentStatus === 'PAID'
          ? 'PAID'
          : inv.status === 'PAID'
            ? 'PAID'
            : 'PENDING') as any,
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
      message:
        'Thank you! Our enterprise sales team will contact you within 24 business hours.',
    };
  }
}
