import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { toNumber, formatCurrency } from '../../common/utils/crm-formatters.util';
import { getPlanDefinition, normalizePlanId, CANONICAL_PLANS } from '../../common/plans/plan-definitions.constant';
import { roundTo2 } from '../../finance/utils/invoice-calculation.util';

export class UpdatePlatformBillingConfigDto {
  companyLegalName?: string;
  billingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  invoicePrefix?: string;
  currency?: string;
  taxRate?: number;
  paymentTermsDays?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  upiId?: string;
  paymentGateway?: string;
  webhookSecret?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
}

export class CreatePlatformSubscriptionDto {
  tenantId: string;
  planId: string;
  billingCycle?: 'monthly' | 'annual';
  seats?: number;
  status?: string;
}

export class RecordPlatformPaymentDto {
  amount: number;
  paymentMethod?: string;
  gatewayProvider?: string;
  gatewayTransactionId?: string;
  notes?: string;
  status?: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export class ProcessPlatformRefundDto {
  amount: number;
  reason: string;
  paymentId?: string;
}

@Injectable()
export class PlatformBillingService {
  private readonly logger = new Logger(PlatformBillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async allocatePlatformInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
    const config = await tx.platformBillingConfig.findFirst();
    const prefix = config?.invoicePrefix?.trim() || 'CP-INV';
    const year = new Date().getFullYear();
    const count = await tx.platformInvoice.count();
    const seq = count + 1;
    return `${prefix}-${year}-${String(seq).padStart(6, '0')}`;
  }

  private async allocatePlatformPaymentNumber(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.platformPayment.count();
    const seq = count + 1;
    return `CP-PAY-${year}-${String(seq).padStart(6, '0')}`;
  }

  private async allocatePlatformRefundNumber(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.platformRefund.count();
    const seq = count + 1;
    return `CP-REF-${year}-${String(seq).padStart(6, '0')}`;
  }

  private async syncMissingTenantSubscriptions() {
    try {
      const tenantsWithoutSub = await this.prisma.tenant.findMany({
        where: {
          platformSubscriptions: {
            none: {},
          },
        },
        take: 100,
      });

      if (!tenantsWithoutSub || tenantsWithoutSub.length === 0) return;

      const config = await this.getBillingConfig();
      const currency = config.currency || 'INR';
      const taxRate = toNumber(config.taxRate || 18.0);

      for (const tenant of tenantsWithoutSub) {
        try {
          const normPlan = normalizePlanId(tenant.plan || 'free');
          const planDef = getPlanDefinition(normPlan);
          const billingCycle = (tenant.billingCycle as 'monthly' | 'annual') || 'monthly';
          const seats = normPlan === 'enterprise' ? 10 : normPlan === 'pro' ? 5 : normPlan === 'starter' ? 3 : 1;
          const unitPrice = billingCycle === 'annual' ? planDef.annualPriceNum : planDef.priceNum;
          const subtotal = roundTo2(unitPrice * seats);
          const taxAmount = roundTo2(subtotal * (taxRate / 100));
          const totalAmount = roundTo2(subtotal + taxAmount);

          const now = new Date();
          const periodEnd = tenant.currentPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          const sub = await this.prisma.platformSubscription.create({
            data: {
              tenantId: tenant.id,
              planId: normPlan,
              billingCycle,
              seats,
              status: tenant.subscriptionStatus || 'ACTIVE',
              unitPrice,
              recurringAmount: subtotal,
              currency,
              currentPeriodStart: tenant.createdAt || now,
              currentPeriodEnd: periodEnd,
            },
          });

          if (subtotal > 0) {
            const prefix = config.invoicePrefix || 'CP-INV';
            const year = new Date().getFullYear();
            const count = await this.prisma.platformInvoice.count();
            const invoiceNumber = `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;

            await this.prisma.platformInvoice.create({
              data: {
                tenantId: tenant.id,
                subscriptionId: sub.id,
                invoiceNumber,
                planName: planDef.name,
                billingCycle,
                seats,
                invoiceDate: now,
                dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
                currency,
                subtotal,
                discountAmount: 0,
                taxRate,
                taxAmount,
                totalAmount,
                paidAmount: totalAmount,
                status: 'PAID',
                paymentStatus: 'PAID',
                paidAt: now,
                items: {
                  create: [
                    {
                      description: `${planDef.name} Plan Subscription (${seats} seats)`,
                      quantity: seats,
                      unitPrice,
                      taxAmount,
                      totalAmount,
                    },
                  ],
                },
              },
            });
          }
        } catch (subErr) {
          this.logger.warn(`Failed to auto-sync subscription for tenant ${tenant.id}: ${subErr}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Error in syncMissingTenantSubscriptions: ${err}`);
    }
  }

  /**
   * Super Admin Platform Billing KPI Overview & Analytics.
   */
  async getOverview() {
    await this.syncMissingTenantSubscriptions();

    const [
      subscriptions,
      invoices,
      payments,
      refunds,
      allTenants,
      config,
      dbPlans,
    ] = await Promise.all([
      this.prisma.platformSubscription.findMany({
        include: { tenant: { select: { id: true, name: true, plan: true } } },
      }),
      this.prisma.platformInvoice.findMany({
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
          paymentStatus: true,
          dueDate: true,
          invoiceDate: true,
        },
      }),
      this.prisma.platformPayment.findMany({
        where: { status: 'SUCCESS' },
        select: { amount: true, paymentDate: true },
      }),
      this.prisma.platformRefund.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true },
      }),
      this.prisma.tenant.findMany({
        select: { id: true, name: true, slug: true, plan: true, status: true, subscriptionStatus: true },
      }),
      this.getBillingConfig(),
      this.prisma.plan.findMany({
        where: { status: 'ACTIVE', isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { priceNum: 'asc' }],
      }).catch(() => []),
    ]);

    const customerTenants = allTenants.filter(
      (t) => t.slug !== 'clixpro-platform' && (t as any).isPlatformTenant !== true && (t as any).type !== 'PLATFORM',
    );

    const currency = config.currency || 'INR';
    const tenantsCount = customerTenants.length;

    // 1. Calculate MRR & ARR from active paid subscriptions
    let monthlyMRR = 0;
    
    // Resolve active canonical or dynamic database plans
    const activePlanDefs = dbPlans.length > 0
      ? dbPlans.map((p) => ({ id: p.id.toLowerCase(), name: p.name }))
      : Object.values(CANONICAL_PLANS).map((p) => ({ id: p.id.toLowerCase(), name: p.name }));

    const planDistMap: Record<string, { count: number; name: string; revenue: number; percentage: number }> = {};
    for (const pDef of activePlanDefs) {
      planDistMap[pDef.id] = { count: 0, name: pDef.name, revenue: 0, percentage: 0 };
    }
    if (!planDistMap['free']) {
      planDistMap['free'] = { count: 0, name: 'Free', revenue: 0, percentage: 0 };
    }

    // Map subscriptions by tenantId
    const subByTenantMap = new Map<string, typeof subscriptions[0]>();
    for (const sub of subscriptions) {
      if (!subByTenantMap.has(sub.tenantId)) {
        subByTenantMap.set(sub.tenantId, sub);
      }
    }

    let paidSubscriptionsCount = 0;
    for (const tenant of customerTenants) {
      const sub = subByTenantMap.get(tenant.id);
      const rawPlan = sub?.planId || tenant.plan || 'free';
      const pId = normalizePlanId(rawPlan);
      const recAmt = toNumber(sub?.recurringAmount);
      const isPaidTier = pId !== 'free';
      const isSubActive = (sub?.status || tenant.subscriptionStatus || 'ACTIVE').toUpperCase() === 'ACTIVE' || (sub?.status || '').toUpperCase() === 'TRIALING';

      if (isSubActive && isPaidTier && (recAmt > 0 || CANONICAL_PLANS[pId]?.priceNum > 0)) {
        const canonicalPrice = recAmt > 0 ? recAmt : (CANONICAL_PLANS[pId]?.priceNum || 0);
        const mVal = sub?.billingCycle === 'annual' ? canonicalPrice / 12 : canonicalPrice;
        monthlyMRR += mVal;
        paidSubscriptionsCount += 1;
      }

      if (!planDistMap[pId]) {
        const pName = pId === 'enterprise' ? 'Enterprise' : pId === 'business' ? 'Business' : (CANONICAL_PLANS[pId]?.name || pId.charAt(0).toUpperCase() + pId.slice(1));
        planDistMap[pId] = { count: 0, name: pName, revenue: 0, percentage: 0 };
      }
      planDistMap[pId].count += 1;
      planDistMap[pId].revenue += isPaidTier ? (recAmt > 0 ? recAmt : (CANONICAL_PLANS[pId]?.priceNum || 0)) : 0;
    }

    const totalWorkspaceBase = tenantsCount || 1;
    for (const key of Object.keys(planDistMap)) {
      planDistMap[key].percentage = Math.round((planDistMap[key].count / totalWorkspaceBase) * 100);
    }

    const projectedARR = monthlyMRR * 12;

    // 2. Invoice revenue breakdowns & pending count
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let overdueRevenue = 0;
    let pendingInvoicesCount = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const inv of invoices) {
      const tot = toNumber(inv.totalAmount);
      const pd = toNumber(inv.paidAmount);
      const bal = Math.max(0, tot - pd);

      totalRevenue += tot;
      paidRevenue += pd;

      const isOverdue = inv.dueDate && new Date(inv.dueDate) < now && bal > 0 && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.status !== 'VOID';

      if (isOverdue) {
        overdueRevenue += bal;
        pendingInvoicesCount += 1;
      } else if (bal > 0 && inv.status !== 'CANCELLED' && inv.status !== 'VOID') {
        pendingRevenue += bal;
        pendingInvoicesCount += 1;
      }
    }

    const totalRefunds = refunds.reduce((s, r) => s + toNumber(r.amount), 0);

    // 3. Last 6 Months Revenue Trend
    const monthlyTrend: Array<{ month: string; revenue: number; projected: number; invoicesCount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const mLabel = d.toLocaleString('en-US', { month: 'short' });

      const mInvoices = invoices.filter((inv) => {
        const idate = new Date(inv.invoiceDate);
        return idate.getFullYear() === yr && idate.getMonth() === mo;
      });

      const mRev = mInvoices.reduce((s, inv) => s + toNumber(inv.paidAmount || (inv.paymentStatus === 'PAID' ? inv.totalAmount : 0)), 0);
      monthlyTrend.push({
        month: mLabel,
        revenue: roundTo2(mRev),
        projected: roundTo2(monthlyMRR),
        invoicesCount: mInvoices.length,
      });
    }

    return {
      kpis: {
        mrr: roundTo2(monthlyMRR),
        mrrFormatted: formatCurrency(roundTo2(monthlyMRR), currency),
        arr: roundTo2(projectedARR),
        arrFormatted: formatCurrency(roundTo2(projectedARR), currency),
        totalRevenue: roundTo2(totalRevenue),
        totalRevenueFormatted: formatCurrency(roundTo2(totalRevenue), currency),
        paidRevenue: roundTo2(paidRevenue),
        paidRevenueFormatted: formatCurrency(roundTo2(paidRevenue), currency),
        pendingRevenue: roundTo2(pendingRevenue + overdueRevenue),
        pendingRevenueFormatted: formatCurrency(roundTo2(pendingRevenue + overdueRevenue), currency),
        pendingInvoicesCount,
        overdueRevenue: roundTo2(overdueRevenue),
        overdueRevenueFormatted: formatCurrency(roundTo2(overdueRevenue), currency),
        totalRefunds: roundTo2(totalRefunds),
        totalRefundsFormatted: formatCurrency(roundTo2(totalRefunds), currency),
        paidSubscriptions: paidSubscriptionsCount,
        activeSubscriptions: paidSubscriptionsCount,
        totalSubscriptions: subByTenantMap.size || tenantsCount,
        totalOrganizations: tenantsCount,
      },
      planDistribution: Object.values(planDistMap),
      monthlyTrend,
      config,
    };
  }

  /**
   * List platform subscriptions.
   */
  async getSubscriptions(
    page = 1,
    limit = 20,
    options?: { search?: string; planId?: string; status?: string },
  ) {
    await this.syncMissingTenantSubscriptions();
    page = Math.max(1, page);
    limit = Math.max(1, Math.min(limit, 1000));
    const skip = (page - 1) * limit;

    const where: Prisma.PlatformSubscriptionWhereInput = {
      ...(options?.planId && { planId: options.planId }),
      ...(options?.status && options.status.toUpperCase() !== 'ALL' && { status: options.status.toUpperCase() }),
      ...(options?.search && {
        tenant: {
          name: { contains: options.search.trim(), mode: 'insensitive' },
        },
      }),
    };

    const [subscriptions, total, config] = await Promise.all([
      this.prisma.platformSubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          tenant: { select: { id: true, name: true, plan: true, currency: true, logo: true } },
          invoices: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, invoiceNumber: true, status: true, totalAmount: true },
          },
        },
      }),
      this.prisma.platformSubscription.count({ where }),
      this.getBillingConfig(),
    ]);

    const currency = config.currency || 'INR';

    return {
      subscriptions: subscriptions.map((s) => {
        const planDef = getPlanDefinition(s.planId);
        const rec = toNumber(s.recurringAmount);
        return {
          id: s.id,
          tenantId: s.tenantId,
          tenantName: s.tenant.name,
          tenantLogo: s.tenant.logo,
          planId: s.planId,
          planName: planDef.name,
          billingCycle: s.billingCycle,
          seats: s.seats,
          status: s.status,
          unitPrice: toNumber(s.unitPrice),
          recurringAmount: rec,
          recurringAmountFormatted: formatCurrency(rec, s.currency || currency),
          currency: s.currency || currency,
          currentPeriodStart: s.currentPeriodStart.toISOString(),
          currentPeriodEnd: s.currentPeriodEnd.toISOString(),
          trialStart: s.trialStart ? s.trialStart.toISOString() : null,
          trialEnd: s.trialEnd ? s.trialEnd.toISOString() : null,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd,
          latestInvoice: s.invoices[0] || null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Create or update platform subscription and generate platform invoice.
   */
  async createOrUpdateSubscription(
    userId: string,
    dto: CreatePlatformSubscriptionDto,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) throw new NotFoundException('Organization not found');

    const normPlan = normalizePlanId(dto.planId);
    const planDef = getPlanDefinition(normPlan);
    const billingCycle = dto.billingCycle || 'monthly';
    const seats = Math.max(1, dto.seats || 1);

    const unitPrice = billingCycle === 'annual' ? planDef.annualPriceNum : planDef.priceNum;
    const subtotal = roundTo2(unitPrice * seats);

    const config = await this.getBillingConfig();
    const taxRate = toNumber(config.taxRate || 18.0);
    const taxAmount = roundTo2(subtotal * (taxRate / 100));
    const totalAmount = roundTo2(subtotal + taxAmount);

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert Subscription
      const existingSub = await tx.platformSubscription.findFirst({
        where: { tenantId: dto.tenantId },
      });

      const subData = {
        tenantId: dto.tenantId,
        planId: normPlan,
        billingCycle,
        seats,
        status: dto.status || 'ACTIVE',
        unitPrice,
        recurringAmount: subtotal,
        currency: config.currency || 'INR',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      };

      const subscription = existingSub
        ? await tx.platformSubscription.update({
            where: { id: existingSub.id },
            data: subData,
          })
        : await tx.platformSubscription.create({
            data: subData,
          });

      // 2. Generate Platform Invoice if plan is paid
      let platformInvoice = null;
      if (subtotal > 0) {
        const invoiceNumber = await this.allocatePlatformInvoiceNumber(tx);
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + (config.paymentTermsDays || 15));

        platformInvoice = await tx.platformInvoice.create({
          data: {
            tenantId: dto.tenantId,
            subscriptionId: subscription.id,
            invoiceNumber,
            planName: planDef.name,
            billingCycle,
            seats,
            invoiceDate: now,
            dueDate,
            currency: config.currency || 'INR',
            subtotal,
            discountAmount: 0,
            taxRate,
            taxAmount,
            totalAmount,
            paidAmount: totalAmount,
            status: 'PAID',
            paymentStatus: 'PAID',
            paidAt: now,
            items: {
              create: [
                {
                  description: `${planDef.name} Subscription (${seats} seats, ${billingCycle})`,
                  quantity: seats,
                  unitPrice,
                  taxAmount,
                  totalAmount,
                },
              ],
            },
          },
        });
      }

      // 3. Synchronize Tenant record
      await tx.tenant.update({
        where: { id: dto.tenantId },
        data: {
          plan: normPlan,
          billingCycle,
          subscriptionStatus: dto.status || 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId,
          action: 'PLATFORM_SUBSCRIPTION_UPDATED',
          module: 'PLATFORM_BILLING',
          details: {
            planId: normPlan,
            billingCycle,
            seats,
            totalAmount,
            platformInvoiceNumber: platformInvoice?.invoiceNumber,
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
   * List platform invoices.
   */
  async getPlatformInvoices(
    page = 1,
    limit = 20,
    options?: {
      search?: string;
      status?: string;
      paymentStatus?: string;
      tenantId?: string;
    },
  ) {
    page = Math.max(1, page);
    limit = Math.max(1, Math.min(limit, 1000));
    const skip = (page - 1) * limit;

    const where: Prisma.PlatformInvoiceWhereInput = {
      ...(options?.tenantId && { tenantId: options.tenantId }),
      ...(options?.status && options.status.toUpperCase() !== 'ALL' && { status: options.status.toUpperCase() }),
      ...(options?.paymentStatus && options.paymentStatus.toUpperCase() !== 'ALL' && { paymentStatus: options.paymentStatus.toUpperCase() }),
      ...(options?.search && {
        OR: [
          { invoiceNumber: { contains: options.search.trim(), mode: 'insensitive' } },
          { tenant: { name: { contains: options.search.trim(), mode: 'insensitive' } } },
          { planName: { contains: options.search.trim(), mode: 'insensitive' } },
        ],
      }),
    };

    const [invoices, total, config] = await Promise.all([
      this.prisma.platformInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
        include: {
          tenant: { select: { id: true, name: true, logo: true, taxId: true } },
          subscription: { select: { id: true, status: true, planId: true } },
        },
      }),
      this.prisma.platformInvoice.count({ where }),
      this.getBillingConfig(),
    ]);

    const currency = config.currency || 'INR';

    return {
      invoices: invoices.map((inv) => {
        const tot = toNumber(inv.totalAmount);
        const pd = toNumber(inv.paidAmount);
        return {
          id: inv.id,
          tenantId: inv.tenantId,
          tenantName: inv.tenant.name,
          tenantLogo: inv.tenant.logo,
          tenantGstin: inv.tenant.taxId,
          subscriptionId: inv.subscriptionId,
          invoiceNumber: inv.invoiceNumber,
          planName: inv.planName,
          billingCycle: inv.billingCycle,
          seats: inv.seats,
          invoiceDate: inv.invoiceDate.toISOString(),
          dueDate: inv.dueDate.toISOString(),
          currency: inv.currency || currency,
          subtotal: toNumber(inv.subtotal),
          taxRate: toNumber(inv.taxRate),
          taxAmount: toNumber(inv.taxAmount),
          totalAmount: tot,
          totalAmountFormatted: formatCurrency(tot, inv.currency || currency),
          paidAmount: pd,
          paidAmountFormatted: formatCurrency(pd, inv.currency || currency),
          status: inv.status,
          paymentStatus: inv.paymentStatus,
          paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
          createdAt: inv.createdAt.toISOString(),
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single platform invoice details with line items and payments.
   */
  async getPlatformInvoiceById(id: string) {
    const invoice = await this.prisma.platformInvoice.findUnique({
      where: { id },
      include: {
        tenant: true,
        items: true,
        payments: true,
        refunds: true,
        subscription: true,
      },
    });

    if (!invoice) throw new NotFoundException('Platform invoice not found');

    const config = await this.getBillingConfig();
    const currency = invoice.currency || config.currency || 'INR';

    return {
      ...invoice,
      subtotal: toNumber(invoice.subtotal),
      taxRate: toNumber(invoice.taxRate),
      taxAmount: toNumber(invoice.taxAmount),
      totalAmount: toNumber(invoice.totalAmount),
      totalAmountFormatted: formatCurrency(toNumber(invoice.totalAmount), currency),
      paidAmount: toNumber(invoice.paidAmount),
      paidAmountFormatted: formatCurrency(toNumber(invoice.paidAmount), currency),
      items: invoice.items.map((it) => ({
        ...it,
        unitPrice: toNumber(it.unitPrice),
        taxAmount: toNumber(it.taxAmount),
        totalAmount: toNumber(it.totalAmount),
      })),
      payments: invoice.payments.map((p) => ({
        ...p,
        amount: toNumber(p.amount),
        amountFormatted: formatCurrency(toNumber(p.amount), p.currency || currency),
      })),
      refunds: invoice.refunds.map((r) => ({
        ...r,
        amount: toNumber(r.amount),
        amountFormatted: formatCurrency(toNumber(r.amount), r.currency || currency),
      })),
    };
  }

  /**
   * Process refund on a platform invoice.
   */
  async processPlatformRefund(
    invoiceId: string,
    userId: string,
    dto: ProcessPlatformRefundDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.platformInvoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      });

      if (!invoice) throw new NotFoundException('Platform invoice not found');

      const refundAmt = roundTo2(dto.amount);
      const paidAmt = toNumber(invoice.paidAmount);

      if (refundAmt <= 0) {
        throw new BadRequestException('Refund amount must be greater than 0.');
      }
      if (refundAmt > paidAmt) {
        throw new BadRequestException(`Refund amount (${refundAmt}) cannot exceed paid amount (${paidAmt}).`);
      }

      const refundNumber = await this.allocatePlatformRefundNumber(tx);

      const refund = await tx.platformRefund.create({
        data: {
          platformInvoiceId: invoiceId,
          platformPaymentId: dto.paymentId || invoice.payments[0]?.id || null,
          tenantId: invoice.tenantId,
          refundNumber,
          amount: refundAmt,
          currency: invoice.currency || 'INR',
          reason: dto.reason,
          status: 'COMPLETED',
          processedBy: userId,
        },
      });

      const newPaid = roundTo2(Math.max(0, paidAmt - refundAmt));
      const newStatus = newPaid === 0 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await tx.platformInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          status: newStatus === 'REFUNDED' ? 'REFUNDED' : invoice.status,
          paymentStatus: newStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId: invoice.tenantId,
          userId,
          action: 'PLATFORM_REFUND_PROCESSED',
          module: 'PLATFORM_BILLING',
          details: {
            refundNumber,
            invoiceId,
            refundAmount: refundAmt,
            reason: dto.reason,
          },
        },
      });

      return refund;
    });
  }

  /**
   * Get platform billing configuration.
   */
  async getBillingConfig() {
    let config = await this.prisma.platformBillingConfig.findFirst();
    if (!config) {
      config = await this.prisma.platformBillingConfig.create({
        data: {
          id: 'global',
          companyLegalName: 'ClixPro Technologies Pvt. Ltd.',
          billingAddress: 'Level 4, Cyber City, Phase II',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560100',
          country: 'India',
          gstin: '29AAAAA0000A1Z5',
          pan: 'AAAAA0000A',
          invoicePrefix: 'CP-INV',
          currency: 'INR',
          taxRate: 18.0,
          paymentTermsDays: 15,
        },
      });
    }
    return {
      ...config,
      taxRate: toNumber(config.taxRate),
    };
  }

  /**
   * Update platform billing configuration.
   */
  async updateBillingConfig(userId: string, dto: UpdatePlatformBillingConfigDto) {
    const config = await this.getBillingConfig();
    const updated = await this.prisma.platformBillingConfig.update({
      where: { id: config.id },
      data: {
        ...(dto.companyLegalName !== undefined && { companyLegalName: dto.companyLegalName }),
        ...(dto.billingAddress !== undefined && { billingAddress: dto.billingAddress }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.gstin !== undefined && { gstin: dto.gstin?.toUpperCase() }),
        ...(dto.pan !== undefined && { pan: dto.pan?.toUpperCase() }),
        ...(dto.invoicePrefix !== undefined && { invoicePrefix: dto.invoicePrefix?.toUpperCase() }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.taxRate !== undefined && { taxRate: dto.taxRate }),
        ...(dto.paymentTermsDays !== undefined && { paymentTermsDays: dto.paymentTermsDays }),
        ...(dto.bankName !== undefined && { bankName: dto.bankName }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.ifscCode !== undefined && { ifscCode: dto.ifscCode?.toUpperCase() }),
        ...(dto.accountHolder !== undefined && { accountHolder: dto.accountHolder }),
        ...(dto.upiId !== undefined && { upiId: dto.upiId }),
        ...(dto.paymentGateway !== undefined && { paymentGateway: dto.paymentGateway }),
        ...(dto.webhookSecret !== undefined && { webhookSecret: dto.webhookSecret }),
        ...(dto.razorpayKeyId !== undefined && { razorpayKeyId: dto.razorpayKeyId }),
        ...(dto.razorpayKeySecret !== undefined && { razorpayKeySecret: dto.razorpayKeySecret }),
        ...(dto.stripePublishableKey !== undefined && { stripePublishableKey: dto.stripePublishableKey }),
        ...(dto.stripeSecretKey !== undefined && { stripeSecretKey: dto.stripeSecretKey }),
        updatedBy: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PLATFORM_BILLING_CONFIG_UPDATED',
        module: 'PLATFORM_BILLING',
        details: JSON.parse(JSON.stringify({ ...dto })),
      },
    });

    return {
      ...updated,
      taxRate: toNumber(updated.taxRate),
    };
  }
}
