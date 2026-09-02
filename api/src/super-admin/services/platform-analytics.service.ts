import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePlanId, CANONICAL_PLANS } from '../../common/plans/plan-definitions.constant';
import { toNumber } from '../../common/utils/crm-formatters.util';

export interface AnalyticsQueryDto {
  range?: '30d' | '3m' | '6m' | '12m' | 'custom';
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class PlatformAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformAnalytics(query: AnalyticsQueryDto = {}) {
    const range = query.range || '6m';
    const now = new Date();
    let endDate = query.endDate ? new Date(query.endDate) : now;
    if (isNaN(endDate.getTime())) endDate = now;

    let startDate: Date;
    if (range === 'custom' && query.startDate) {
      startDate = new Date(query.startDate);
      if (isNaN(startDate.getTime())) {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1);
      }
    } else if (range === '30d') {
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '3m') {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
    } else if (range === '12m') {
      startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), 1);
    } else {
      // Default 6m
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
    }

    // Previous comparison period (same duration directly preceding startDate)
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - durationMs);
    const prevEndDate = new Date(startDate.getTime());

    // Query platform data
    const [
      allTenants,
      allSubscriptions,
      totalUsers,
      totalLeads,
      totalDeals,
      totalCustomers,
      totalQuotations,
    ] = await this.prisma.withTenantContext(
      { isSuperAdmin: true },
      async (tx) => {
        return Promise.all([
          tx.tenant.findMany({
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
              status: true,
              subscriptionStatus: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: 'asc' },
          }),
          tx.platformSubscription.findMany({
            select: {
              id: true,
              tenantId: true,
              planId: true,
              billingCycle: true,
              status: true,
              unitPrice: true,
              recurringAmount: true,
              currency: true,
              createdAt: true,
              updatedAt: true,
              cancelledAt: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          tx.user.count(),
          tx.lead.count(),
          tx.deal.count(),
          tx.customer.count(),
          tx.quotation.count(),
        ]);
      },
    );

    // Map unique primary subscription per tenant
    const subByTenantMap = new Map<string, (typeof allSubscriptions)[0]>();
    for (const sub of allSubscriptions) {
      if (!subByTenantMap.has(sub.tenantId)) {
        subByTenantMap.set(sub.tenantId, sub);
      }
    }

    // ── 1. ACTIVE WORKSPACES & WORKSPACE TOTALS ──────────────────────────────
    const totalTenantsCount = allTenants.length;
    const activeTenants = allTenants.filter((t) => t.status === 'ACTIVE');
    const activeTenantsCount = activeTenants.length;

    const newInPeriod = allTenants.filter(
      (t) => t.createdAt >= startDate && t.createdAt <= endDate,
    ).length;
    const newInPrevPeriod = allTenants.filter(
      (t) => t.createdAt >= prevStartDate && t.createdAt < prevEndDate,
    ).length;

    let growthVsPrev = 0;
    if (newInPrevPeriod > 0) {
      growthVsPrev = ((newInPeriod - newInPrevPeriod) / newInPrevPeriod) * 100;
    } else if (newInPeriod > 0) {
      growthVsPrev = 100;
    }

    // ── 2. REAL MRR & PAID WORKSPACES ────────────────────────────────────────
    let currentMRR = 0;
    let prevPeriodMRR = 0;
    let paidActiveWorkspacesCount = 0;

    for (const tenant of activeTenants) {
      const sub = subByTenantMap.get(tenant.id);
      const rawPlan = sub?.planId || tenant.plan || 'free';
      const normPlan = normalizePlanId(rawPlan);
      const isPaidTier = normPlan !== 'free';

      const status = (sub?.status || tenant.subscriptionStatus || 'ACTIVE').toUpperCase();
      const isBillableStatus = status === 'ACTIVE' || status === 'TRIALING';

      if (isPaidTier && isBillableStatus) {
        paidActiveWorkspacesCount += 1;

        let recAmt = toNumber(sub?.recurringAmount);
        if (recAmt <= 0) {
          const canonicalDef = CANONICAL_PLANS[normPlan];
          recAmt = canonicalDef ? canonicalDef.priceNum : 0;
        }

        const monthlyVal = sub?.billingCycle === 'annual' ? recAmt / 12 : recAmt;
        currentMRR += monthlyVal;

        // Check if this subscription existed prior to startDate for comparison
        const subCreatedAt = sub?.createdAt || tenant.createdAt;
        if (subCreatedAt < startDate) {
          prevPeriodMRR += monthlyVal;
        }
      }
    }

    let mrrGrowthPercent = 0;
    if (prevPeriodMRR > 0) {
      mrrGrowthPercent = ((currentMRR - prevPeriodMRR) / prevPeriodMRR) * 100;
    } else if (currentMRR > 0) {
      mrrGrowthPercent = 100;
    }

    // ── 3. PAID CONVERSION RATE ──────────────────────────────────────────────
    // Free workspaces strictly excluded from paid count
    const paidConversionRate =
      activeTenantsCount > 0
        ? (paidActiveWorkspacesCount / activeTenantsCount) * 100
        : 0;

    // ── 4. CHURN RATE ────────────────────────────────────────────────────────
    // Actual cancellations during selected period
    const churnedSubsInPeriod = allSubscriptions.filter((s) => {
      const isCancelled = s.status === 'CANCELLED';
      if (!isCancelled) return false;
      const cancelDate = s.cancelledAt || s.updatedAt || s.createdAt;
      return cancelDate >= startDate && cancelDate <= endDate;
    });

    const suspendedTenantsInPeriod = allTenants.filter((t) => {
      const isSuspended = t.status === 'SUSPENDED';
      if (!isSuspended) return false;
      return t.updatedAt >= startDate && t.updatedAt <= endDate;
    });

    const churnCount = Math.max(churnedSubsInPeriod.length, suspendedTenantsInPeriod.length);
    const denominator = activeTenantsCount + churnCount;
    const churnRate = denominator > 0 ? (churnCount / denominator) * 100 : 0;

    // ── 5. AVERAGE REVENUE PER WORKSPACE (ARPU) ──────────────────────────────
    // Strictly calculated across paid workspaces only; Free workspaces excluded
    const arpu = paidActiveWorkspacesCount > 0 ? currentMRR / paidActiveWorkspacesCount : 0;

    // ── 6. WORKSPACE GROWTH (Monthly/Bucket Trends) ───────────────────────────
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    interface TrendBucket {
      month: string;
      startDate: Date;
      endDate: Date;
      newWorkspaces: number;
      activeWorkspaces: number;
    }

    const growthTrends: TrendBucket[] = [];

    if (range === '30d') {
      // 4 weekly buckets for 30d
      const bucketCount = 4;
      const bucketDuration = (30 * 24 * 60 * 60 * 1000) / bucketCount;
      for (let i = bucketCount - 1; i >= 0; i--) {
        const bStart = new Date(endDate.getTime() - (i + 1) * bucketDuration);
        const bEnd = new Date(endDate.getTime() - i * bucketDuration);
        const label = `${monthNames[bStart.getMonth()]} ${bStart.getDate()}-${bEnd.getDate()}`;
        growthTrends.push({
          month: label,
          startDate: bStart,
          endDate: bEnd,
          newWorkspaces: 0,
          activeWorkspaces: 0,
        });
      }
    } else {
      // Monthly buckets
      let monthCount = 6;
      if (range === '3m') monthCount = 3;
      else if (range === '12m') monthCount = 12;
      else if (range === 'custom') {
        const diffMonths =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth()) +
          1;
        monthCount = Math.max(1, Math.min(24, diffMonths));
      }

      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const bEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        growthTrends.push({
          month: label,
          startDate: d,
          endDate: bEnd,
          newWorkspaces: 0,
          activeWorkspaces: 0,
        });
      }
    }

    // Populate trend buckets
    growthTrends.forEach((bucket) => {
      // New signups within bucket window
      bucket.newWorkspaces = allTenants.filter(
        (t) => t.createdAt >= bucket.startDate && t.createdAt <= bucket.endDate,
      ).length;

      // Cumulative active workspaces at end of bucket
      bucket.activeWorkspaces = allTenants.filter(
        (t) => t.createdAt <= bucket.endDate && t.status === 'ACTIVE',
      ).length;
    });

    // ── 7. SUBSCRIPTION MIX (Free, Growth, Business) ─────────────────────────
    const planCounts: Record<string, number> = {
      free: 0,
      growth: 0,
      business: 0,
    };

    for (const tenant of activeTenants) {
      const sub = subByTenantMap.get(tenant.id);
      const rawPlan = sub?.planId || tenant.plan || 'free';
      const normPlan = normalizePlanId(rawPlan);
      if (planCounts[normPlan] !== undefined) {
        planCounts[normPlan] += 1;
      } else {
        planCounts.free += 1;
      }
    }

    const subscriptionMix = [
      {
        planId: 'free',
        name: 'Free',
        badge: 'STARTER',
        count: planCounts.free,
        percentage:
          activeTenantsCount > 0
            ? Number(((planCounts.free / activeTenantsCount) * 100).toFixed(1))
            : 0,
      },
      {
        planId: 'growth',
        name: 'Growth',
        badge: 'MOST POPULAR',
        count: planCounts.growth,
        percentage:
          activeTenantsCount > 0
            ? Number(((planCounts.growth / activeTenantsCount) * 100).toFixed(1))
            : 0,
      },
      {
        planId: 'business',
        name: 'Business',
        badge: 'ENTERPRISE',
        count: planCounts.business,
        percentage:
          activeTenantsCount > 0
            ? Number(((planCounts.business / activeTenantsCount) * 100).toFixed(1))
            : 0,
      },
    ];

    // ── 8. WORKSPACE HEALTH ──────────────────────────────────────────────────
    let healthActive = 0;
    let healthTrialing = 0;
    let healthPastDue = 0;
    let healthSuspended = 0;

    for (const tenant of allTenants) {
      const sub = subByTenantMap.get(tenant.id);
      const subStatus = (sub?.status || tenant.subscriptionStatus || 'ACTIVE').toUpperCase();
      const tenantStatus = tenant.status.toUpperCase();

      if (tenantStatus === 'SUSPENDED' || subStatus === 'SUSPENDED' || subStatus === 'CANCELLED') {
        healthSuspended += 1;
      } else if (subStatus === 'PAST_DUE') {
        healthPastDue += 1;
      } else if (subStatus === 'TRIALING') {
        healthTrialing += 1;
      } else {
        healthActive += 1;
      }
    }

    const totalHealthCount = totalTenantsCount || 1;
    const workspaceHealth = {
      active: {
        count: healthActive,
        percentage: Number(((healthActive / totalHealthCount) * 100).toFixed(1)),
      },
      trialing: {
        count: healthTrialing,
        percentage: Number(((healthTrialing / totalHealthCount) * 100).toFixed(1)),
      },
      pastDue: {
        count: healthPastDue,
        percentage: Number(((healthPastDue / totalHealthCount) * 100).toFixed(1)),
      },
      suspended: {
        count: healthSuspended,
        percentage: Number(((healthSuspended / totalHealthCount) * 100).toFixed(1)),
      },
      total: totalTenantsCount,
    };

    return {
      dateRange: {
        range,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      kpis: {
        mrr: {
          value: Math.round(currentMRR),
          prevValue: Math.round(prevPeriodMRR),
          changePercent: Number(mrrGrowthPercent.toFixed(1)),
          trend: currentMRR >= prevPeriodMRR ? 'up' : 'down',
          comparisonText:
            prevPeriodMRR > 0
              ? `${mrrGrowthPercent >= 0 ? '+' : ''}${mrrGrowthPercent.toFixed(1)}% vs prev period`
              : currentMRR > 0
              ? '+100% vs prev period'
              : 'vs previous period',
        },
        activeWorkspaces: {
          count: activeTenantsCount,
          totalRegistered: totalTenantsCount,
          newInPeriod,
          growthPercent: Number(growthVsPrev.toFixed(1)),
          trend: newInPeriod > 0 ? 'up' : 'neutral',
          comparisonText:
            newInPeriod > 0
              ? `+${newInPeriod} new this period`
              : `${activeTenantsCount} of ${totalTenantsCount} registered`,
        },
        paidConversion: {
          ratePercent: Number(paidConversionRate.toFixed(1)),
          paidCount: paidActiveWorkspacesCount,
          activeCount: activeTenantsCount,
          trend: paidActiveWorkspacesCount > 0 ? 'up' : 'neutral',
          comparisonText: `${paidActiveWorkspacesCount} of ${activeTenantsCount} workspaces`,
        },
        churn: {
          ratePercent: Number(churnRate.toFixed(1)),
          cancellationsCount: churnCount,
          trend: churnCount > 0 ? 'down' : 'neutral',
          comparisonText: `${churnCount} cancellation${churnCount === 1 ? '' : 's'} in period`,
        },
      },
      secondaryKpis: {
        newWorkspaces: {
          count: newInPeriod,
          prevCount: newInPrevPeriod,
          growthPercent: Number(growthVsPrev.toFixed(1)),
          trend: newInPeriod >= newInPrevPeriod ? 'up' : 'down',
          comparisonText:
            newInPrevPeriod > 0
              ? `${growthVsPrev >= 0 ? '+' : ''}${growthVsPrev.toFixed(1)}% vs prev period`
              : newInPeriod > 0
              ? '+100% new signups'
              : 'No signups in period',
        },
        paidWorkspaces: {
          count: paidActiveWorkspacesCount,
          percentageOfActive: Number(paidConversionRate.toFixed(1)),
          comparisonText: `${paidConversionRate.toFixed(1)}% of active workspaces`,
        },
        arpu: {
          value: Math.round(arpu),
          comparisonText: 'Calculated across paid workspaces only',
        },
      },
      growthTrends: growthTrends.map((t) => ({
        month: t.month,
        newWorkspaces: t.newWorkspaces,
        activeWorkspaces: t.activeWorkspaces,
      })),
      subscriptionMix,
      workspaceHealth,

      // Backward compatible fields for existing telemetry consumers
      totals: {
        totalTenants: totalTenantsCount,
        activeTenants: activeTenantsCount,
        totalUsers,
        totalLeads,
        totalDeals,
        totalCustomers,
        totalQuotations,
        estimatedMRR: Math.round(currentMRR),
        estimatedARR: Math.round(currentMRR * 12),
      },
      monthlyTrends: growthTrends.map((t) => ({
        month: t.month,
        organizations: t.newWorkspaces,
        users: 0,
      })),
      planBreakdown: subscriptionMix.map((s) => ({
        plan: s.name,
        count: s.count,
        price: CANONICAL_PLANS[s.planId]?.priceNum || 0,
        monthlyRevenue: s.count * (CANONICAL_PLANS[s.planId]?.priceNum || 0),
      })),
    };
  }
}
