import { Injectable } from '@nestjs/common';
import {
    getOrSetCache,
    invalidateCacheKey,
    invalidateCacheKeys,
} from '../../common/utils/cache.util';
import {
    calculateTrend,
    formatCurrency,
    formatPercentage,
    formatRelativeDate,
    getMonthRanges,
    toNumber,
} from '../../common/utils/crm-formatters.util';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';
import { PrismaService } from '../../prisma/prisma.service';

export const DASHBOARD_TIMEFRAMES = ['today', 'week', 'month', 'year'] as const;

/**
 * Deterministically invalidate dashboard KPI caches (and optionally affected employee dashboard caches)
 * without scanning the entire Redis keyspace.
 */
export async function invalidateDashboardCache(
  tenantId: string,
  employeeUserIds?: string | string[],
): Promise<void> {
  const keys: string[] = DASHBOARD_TIMEFRAMES.map(
    (tf) => `dashboard:kpi:${tenantId}:${tf}`,
  );

  if (employeeUserIds) {
    const uids = Array.isArray(employeeUserIds)
      ? employeeUserIds
      : [employeeUserIds];
    for (const uid of uids) {
      if (uid) keys.push(`dashboard:emp:${tenantId}:${uid}`);
    }
  }

  await invalidateCacheKeys(keys);
}

/**
 * Invalidate a specific employee's dashboard cache.
 */
export async function invalidateEmployeeDashboardCache(
  tenantId: string,
  userId: string,
): Promise<void> {
  await invalidateCacheKey(`dashboard:emp:${tenantId}:${userId}`);
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private async getTenantCurrency(tenantId: string): Promise<string> {
    return getCachedTenantCurrency(this.prisma, tenantId);
  }

  async getDashboardData(tenantId: string, timeframe = 'month') {
    const cacheKey = `dashboard:kpi:${tenantId}:${timeframe}`;
    return getOrSetCache(cacheKey, 30, async () => {
      // Tenant table is global (not tenant-scoped) — fetch currency outside the tenant context
      const currency = await this.getTenantCurrency(tenantId);

    const now = new Date();
    let currentStart = new Date(now);
    let nextStart = new Date(now);
    let previousStart = new Date(now);

    if (timeframe === 'today') {
      currentStart.setHours(0, 0, 0, 0);
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);
      nextStart = new Date(currentStart);
      nextStart.setDate(nextStart.getDate() + 1);
    } else if (timeframe === 'week') {
      currentStart.setDate(currentStart.getDate() - currentStart.getDay());
      currentStart.setHours(0, 0, 0, 0);
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      nextStart = new Date(currentStart);
      nextStart.setDate(nextStart.getDate() + 7);
    } else if (timeframe === 'year') {
      currentStart = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      nextStart = new Date(now.getFullYear() + 1, 0, 1);
    } else {
      const ranges = getMonthRanges();
      currentStart = ranges.currentMonthStart;
      previousStart = ranges.previousMonthStart;
      nextStart = ranges.nextMonthStart;
    }

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const currentYear = new Date().getFullYear();
    const startOfCurrentYear = new Date(currentYear, 0, 1);

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [
        summaryRaw,
        monthlySalesRaw,
        sparklinesRaw,
        recentDeals,
        recentQuotations,
        recentCompletedTasks,
        revenueTargetData,
      ] = await Promise.all([
        // 1. Consolidated KPI Metrics & Counts across Deal, Lead, Customer, Task
        tx.$queryRaw<
          Array<{
            total_deals: number;
            current_period_deals: number;
            prev_period_deals: number;
            active_deals: number;
            prev_active_deals: number;
            won_deals_total: number;
            lost_deals_total: number;
            total_revenue: number;
            current_period_revenue: number;
            prev_period_revenue: number;
            total_leads: number;
            current_period_leads: number;
            prev_period_leads: number;
            current_period_customers: number;
            prev_period_customers: number;
            pending_tasks_total: number;
            current_period_pending_tasks: number;
            prev_period_pending_tasks: number;
          }>
        >`
          SELECT
            -- Deal metrics
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_deals,
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_deals,
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_deals,
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage")) AS active_deals,
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage") AND "createdAt" < ${currentStart}) AS prev_active_deals,
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS won_deals_total,
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'LOST'::"DealStage") AS lost_deals_total,
            (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage") AS total_revenue,
            (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${currentStart} AND "updatedAt" < ${nextStart}) AS current_period_revenue,
            (SELECT COALESCE(SUM("value"), 0)::float FROM "Deal" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${previousStart} AND "updatedAt" < ${currentStart}) AS prev_period_revenue,

            -- Lead metrics
            (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL) AS total_leads,
            (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_leads,
            (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_leads,

            -- Customer metrics
            (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_customers,
            (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_customers,

            -- Task metrics
            (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus") AS pending_tasks_total,
            (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus" AND "createdAt" >= ${currentStart} AND "createdAt" < ${nextStart}) AS current_period_pending_tasks,
            (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "status" != 'COMPLETED'::"TaskStatus" AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) AS prev_period_pending_tasks
        `,

        // 2. Monthly Won Deals Sales Chart (Aggregated directly in SQL)
        tx.$queryRaw<
          Array<{
            month_index: number;
            total: number;
          }>
        >`
          SELECT
            (EXTRACT(MONTH FROM "updatedAt")::int - 1) AS month_index,
            COALESCE(SUM("value"), 0)::float AS total
          FROM "Deal"
          WHERE "tenantId" = ${tenantId}
            AND "deletedAt" IS NULL
            AND "stage" = 'WON'::"DealStage"
            AND "updatedAt" >= ${startOfCurrentYear}
          GROUP BY (EXTRACT(MONTH FROM "updatedAt")::int - 1)
        `,

        // 3. 7-Day Deals, Revenue, and Leads Sparklines (Aggregated in SQL)
        tx.$queryRaw<
          Array<{
            day_date: Date;
            deal_count: number;
            revenue_sum: number;
            lead_count: number;
          }>
        >`
          SELECT
            d.day_date,
            COALESCE(deals.cnt, 0)::int AS deal_count,
            COALESCE(rev.sum_val, 0)::float AS revenue_sum,
            COALESCE(leads.cnt, 0)::int AS lead_count
          FROM (
            SELECT generate_series(${sevenDaysAgo}::date, ${todayStart}::date, '1 day'::interval)::date AS day_date
          ) d
          LEFT JOIN (
            SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt
            FROM "Deal"
            WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', "createdAt")::date
          ) deals ON deals.dd = d.day_date
          LEFT JOIN (
            SELECT DATE_TRUNC('day', "updatedAt")::date AS dd, SUM("value") AS sum_val
            FROM "Deal"
            WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "stage" = 'WON'::"DealStage" AND "updatedAt" >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', "updatedAt")::date
          ) rev ON rev.dd = d.day_date
          LEFT JOIN (
            SELECT DATE_TRUNC('day', "createdAt")::date AS dd, COUNT(*) AS cnt
            FROM "Lead"
            WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', "createdAt")::date
          ) leads ON leads.dd = d.day_date
          ORDER BY d.day_date ASC
        `,

        // 4. Recent Deals (bounded take 5)
        tx.deal.findMany({
          where: { tenantId, deletedAt: null },
          select: { id: true, name: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        // 5. Recent Quotations (bounded take 5)
        tx.quotation.findMany({
          where: { tenantId, deletedAt: null },
          select: { id: true, client: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        // 6. Recent Completed Tasks (bounded take 5)
        tx.task.findMany({
          where: { tenantId, deletedAt: null, status: 'COMPLETED' },
          select: { id: true, title: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),

        // 7. Active Revenue Target
        tx.revenueTarget.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'desc' },
          select: { value: true },
        }),
      ]);

      const kpi = summaryRaw?.[0] || {
        total_deals: 0,
        current_period_deals: 0,
        prev_period_deals: 0,
        active_deals: 0,
        prev_active_deals: 0,
        won_deals_total: 0,
        lost_deals_total: 0,
        total_revenue: 0,
        current_period_revenue: 0,
        prev_period_revenue: 0,
        total_leads: 0,
        current_period_leads: 0,
        prev_period_leads: 0,
        current_period_customers: 0,
        prev_period_customers: 0,
        pending_tasks_total: 0,
        current_period_pending_tasks: 0,
        prev_period_pending_tasks: 0,
      };

      const totalDeals = Number(kpi.total_deals || 0);
      const currentPeriodDeals = Number(kpi.current_period_deals || 0);
      const prevPeriodDeals = Number(kpi.prev_period_deals || 0);
      const activeDeals = Number(kpi.active_deals || 0);
      const prevActiveDeals = Number(kpi.prev_active_deals || 0);
      const wonDealsTotal = Number(kpi.won_deals_total || 0);
      const lostDealsTotal = Number(kpi.lost_deals_total || 0);

      const totalRevenue = Number(kpi.total_revenue || 0);
      const currentRevenue = Number(kpi.current_period_revenue || 0);
      const previousRevenue = Number(kpi.prev_period_revenue || 0);

      const totalLeads = Number(kpi.total_leads || 0);
      const currentPeriodLeads = Number(kpi.current_period_leads || 0);
      const prevPeriodLeads = Number(kpi.prev_period_leads || 0);

      const currentPeriodCustomers = Number(kpi.current_period_customers || 0);
      const prevPeriodCustomers = Number(kpi.prev_period_customers || 0);

      const pendingTasksTotal = Number(kpi.pending_tasks_total || 0);
      const currentPeriodPendingTasks = Number(
        kpi.current_period_pending_tasks || 0,
      );
      const prevPeriodPendingTasks = Number(kpi.prev_period_pending_tasks || 0);

      const wonCount = wonDealsTotal;
      const lostCount = lostDealsTotal;
      const totalQualified = wonCount + lostCount;
      const winRate =
        totalQualified > 0
          ? (wonCount / totalQualified) * 100
          : totalDeals > 0
            ? (wonCount / totalDeals) * 100
            : 0;

      // Build 7-day sparklines from aggregated rows
      const sparklineDeals: { value: number }[] = [];
      const sparklineRevenue: { value: number }[] = [];
      const sparklineLeads: { value: number }[] = [];

      if (Array.isArray(sparklinesRaw) && sparklinesRaw.length > 0) {
        for (const row of sparklinesRaw) {
          sparklineDeals.push({ value: Number(row.deal_count || 0) });
          sparklineRevenue.push({ value: Number(row.revenue_sum || 0) });
          sparklineLeads.push({ value: Number(row.lead_count || 0) });
        }
      } else {
        for (let i = 0; i < 7; i++) {
          sparklineDeals.push({ value: 0 });
          sparklineRevenue.push({ value: 0 });
          sparklineLeads.push({ value: 0 });
        }
      }

      const revenueDisplayValue =
        totalRevenue > 0 ? totalRevenue : currentRevenue;

      const dashboardStats = [
        {
          title: 'Revenue',
          value: formatCurrency(revenueDisplayValue, currency),
          valueAmount: revenueDisplayValue,
          sparklineData: sparklineRevenue,
          ...calculateTrend(currentRevenue, previousRevenue),
        },
        {
          title: 'Total Leads',
          value: totalLeads.toLocaleString('en-US'),
          valueAmount: totalLeads,
          sparklineData: sparklineLeads,
          ...calculateTrend(currentPeriodLeads, prevPeriodLeads),
        },
        {
          title: 'Active Deals',
          value: `${activeDeals} Deals`,
          valueAmount: activeDeals,
          sparklineData: sparklineDeals,
          ...calculateTrend(activeDeals, prevActiveDeals),
        },
        {
          title: 'Win Rate',
          value: formatPercentage(winRate),
          valueAmount: winRate,
          sparklineData: sparklineDeals,
          ...calculateTrend(winRate, 0),
        },
        {
          title: 'Total Deals',
          value: totalDeals.toLocaleString('en-US'),
          valueAmount: totalDeals,
          sparklineData: sparklineDeals,
          ...calculateTrend(currentPeriodDeals, prevPeriodDeals),
        },
        {
          title: 'New Customers',
          value: currentPeriodCustomers.toLocaleString('en-US'),
          valueAmount: currentPeriodCustomers,
          ...calculateTrend(currentPeriodCustomers, prevPeriodCustomers),
        },
        {
          title: 'Pending Tasks',
          value: pendingTasksTotal.toLocaleString('en-US'),
          valueAmount: pendingTasksTotal,
          ...calculateTrend(currentPeriodPendingTasks, prevPeriodPendingTasks),
        },
      ];

      const recentActivities = [
        ...recentDeals.map((d) => ({
          id: `deal-${d.id}`,
          title: `New deal: ${d.name}`,
          time: d.createdAt,
        })),
        ...recentQuotations.map((q) => ({
          id: `quote-${q.id}`,
          title: `Quotation: ${q.client}`,
          time: q.createdAt,
        })),
        ...recentCompletedTasks.map((t) => ({
          id: `task-${t.id}`,
          title: `Completed: ${t.title}`,
          time: t.updatedAt,
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5)
        .map((a) => ({
          ...a,
          time: formatRelativeDate(a.time, { fallback: 'Just now' }),
        }));

      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const salesChartData = months.map((month) => ({ name: month, total: 0 }));
      if (Array.isArray(monthlySalesRaw)) {
        for (const row of monthlySalesRaw) {
          const mIndex = Number(row.month_index);
          if (mIndex >= 0 && mIndex < 12) {
            salesChartData[mIndex].total = Number(row.total || 0);
          }
        }
      }

      const targetValue = revenueTargetData
        ? toNumber(revenueTargetData.value)
        : 0;
      const targetChange =
        targetValue > 0 ? (currentRevenue / targetValue) * 100 : 0;
      const revenueTarget = {
        revenue: currentRevenue,
        target: targetValue,
        change: formatPercentage(targetChange / 100),
        positive: targetChange >= 100,
      };

      return {
        stats: dashboardStats,
        recentActivities,
        salesChartData,
        activeUsers: 0,
        liveTraffic: 0,
        weeklyGrowth: 0,
        liveTrafficGrowth: 0,
        activeUsersGrowth: 0,
        revenueTarget,
      };
    });
    });
  }

  async getRevenueGrowth(tenantId: string, filter: string) {
    void tenantId;
    void filter;
    // Basic implementation to return revenue growth data
    // The frontend fetches this to cache it for the dashboard
    return Promise.resolve({
      growth: 0,
      trend: 'stable',
      data: [],
    });
  }

  /**
   * Employee-scoped dashboard data.
   * Returns ONLY records that belong to / are assigned to the calling user.
   * No organisation-wide metrics are exposed.
   */
  async getEmployeeDashboardData(tenantId: string, userId: string) {
    const cacheKey = `dashboard:emp:${tenantId}:${userId}`;
    return getOrSetCache(cacheKey, 30, async () => {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [countsRaw, recentTasks, recentLeads] = await Promise.all([
        // 1. Consolidated employee metric counts
        tx.$queryRaw<
          Array<{
            my_pending_tasks: number;
            my_today_meetings: number;
            my_upcoming_meetings: number;
            my_assigned_leads: number;
            my_assigned_deals: number;
          }>
        >`
          SELECT
            (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "deletedAt" IS NULL AND "status" NOT IN ('COMPLETED'::"TaskStatus", 'CANCELLED'::"TaskStatus")) AS my_pending_tasks,
            (SELECT COUNT(*)::int FROM "Meeting" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "startTime" >= ${todayStart} AND "startTime" < ${todayEnd}) AS my_today_meetings,
            (SELECT COUNT(*)::int FROM "Meeting" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "startTime" >= ${now}) AS my_upcoming_meetings,
            (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "assignedToId" = ${userId} AND "deletedAt" IS NULL) AS my_assigned_leads,
            (SELECT COUNT(*)::int FROM "Deal" WHERE "tenantId" = ${tenantId} AND "ownerId" = ${userId} AND "deletedAt" IS NULL AND "stage" NOT IN ('WON'::"DealStage", 'LOST'::"DealStage")) AS my_assigned_deals
        `,

        // 2. Recent completed tasks for user (take 5)
        tx.task.findMany({
          where: {
            tenantId,
            assignedToId: userId,
            status: 'COMPLETED',
            deletedAt: null,
          },
          select: { id: true, title: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),

        // 3. Recent assigned leads for user (take 5)
        tx.lead.findMany({
          where: {
            tenantId,
            assignedToId: userId,
            deletedAt: null,
            createdAt: { gte: sevenDaysAgo },
          },
          select: { id: true, name: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      const counts = countsRaw?.[0] || {
        my_pending_tasks: 0,
        my_today_meetings: 0,
        my_upcoming_meetings: 0,
        my_assigned_leads: 0,
        my_assigned_deals: 0,
      };

      const myPendingTasks = Number(counts.my_pending_tasks || 0);
      const myTodayMeetings = Number(counts.my_today_meetings || 0);
      const myUpcomingMeetings = Number(counts.my_upcoming_meetings || 0);
      const myAssignedLeads = Number(counts.my_assigned_leads || 0);
      const myAssignedDeals = Number(counts.my_assigned_deals || 0);

      const recentActivities = [
        ...recentTasks.map((t) => ({
          id: `task-${t.id}`,
          title: `Completed: ${t.title}`,
          time: t.updatedAt,
          type: 'task',
        })),
        ...recentLeads.map((l) => ({
          id: `lead-${l.id}`,
          title: `Lead assigned: ${l.name}`,
          time: l.createdAt,
          type: 'lead',
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5)
        .map((a) => ({
          ...a,
          time: formatRelativeDate(a.time, { fallback: 'Just now' }),
        }));

      return {
        myTasks: myPendingTasks,
        myTodayMeetings,
        myUpcomingMeetings,
        myLeads: myAssignedLeads,
        myDeals: myAssignedDeals,
        myActivities: recentTasks.length + recentLeads.length,
        recentActivities,
      };
    });
    });
  }
}
