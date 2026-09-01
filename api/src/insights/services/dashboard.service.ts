import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calculateTrend,
  formatCurrency,
  getMonthRanges,
  formatRelativeDate,
  toNumber,
  formatPercentage,
} from '../../common/utils/crm-formatters.util';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private async getTenantCurrency(tenantId: string): Promise<string> {
    return getCachedTenantCurrency(this.prisma, tenantId);
  }

  async getDashboardData(tenantId: string, timeframe = 'month') {
    const tStart = performance.now();
    // Tenant table is global (not tenant-scoped) — fetch currency outside the tenant context
    const currency = await this.getTenantCurrency(tenantId);
    const tCurr = performance.now();

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

    const qTimings: Record<string, number> = {};    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [
        totalDeals,
        currentPeriodDeals,
        prevPeriodDeals,
        activeDeals,
        prevActiveDeals,
        wonDealsTotal,
        lostDealsTotal,
        totalRevenueAgg,
        currentPeriodRevenueAgg,
        prevPeriodRevenueAgg,
        totalLeads,
        currentPeriodLeads,
        prevPeriodLeads,
        currentPeriodCustomers,
        prevPeriodCustomers,
        pendingTasksTotal,
        currentPeriodPendingTasks,
        prevPeriodPendingTasks,
        monthlySalesRaw,
        sparklineDealsRaw,
        sparklineRevenueRaw,
        sparklineLeadsRaw,
        recentDeals,
        recentQuotations,
        recentCompletedTasks,
        revenueTargetData,
      ] = await Promise.all([
        tx.deal.count({ where: { tenantId, deletedAt: null } }),
        tx.deal.count({ where: { tenantId, deletedAt: null, createdAt: { gte: currentStart, lt: nextStart } } }),
        tx.deal.count({ where: { tenantId, deletedAt: null, createdAt: { gte: previousStart, lt: currentStart } } }),
        tx.deal.count({ where: { tenantId, deletedAt: null, stage: { notIn: ['WON', 'LOST'] } } }),
        tx.deal.count({ where: { tenantId, deletedAt: null, stage: { notIn: ['WON', 'LOST'] }, createdAt: { lt: currentStart } } }),
        tx.deal.count({ where: { tenantId, deletedAt: null, stage: 'WON' } }),
        tx.deal.count({ where: { tenantId, deletedAt: null, stage: 'LOST' } }),
        tx.deal.aggregate({ where: { tenantId, deletedAt: null, stage: 'WON' }, _sum: { value: true } }),
        tx.deal.aggregate({ where: { tenantId, deletedAt: null, stage: 'WON', updatedAt: { gte: currentStart, lt: nextStart } }, _sum: { value: true } }),
        tx.deal.aggregate({ where: { tenantId, deletedAt: null, stage: 'WON', updatedAt: { gte: previousStart, lt: currentStart } }, _sum: { value: true } }),
        tx.lead.count({ where: { tenantId, deletedAt: null } }),
        tx.lead.count({ where: { tenantId, deletedAt: null, createdAt: { gte: currentStart, lt: nextStart } } }),
        tx.lead.count({ where: { tenantId, deletedAt: null, createdAt: { gte: previousStart, lt: currentStart } } }),
        tx.customer.count({ where: { tenantId, deletedAt: null, createdAt: { gte: currentStart, lt: nextStart } } }),
        tx.customer.count({ where: { tenantId, deletedAt: null, createdAt: { gte: previousStart, lt: currentStart } } }),
        tx.task.count({ where: { tenantId, deletedAt: null, status: { not: 'COMPLETED' } } }),
        tx.task.count({ where: { tenantId, deletedAt: null, status: { not: 'COMPLETED' }, createdAt: { gte: currentStart, lt: nextStart } } }),
        tx.task.count({ where: { tenantId, deletedAt: null, status: { not: 'COMPLETED' }, createdAt: { gte: previousStart, lt: currentStart } } }),

        // Monthly Won Deals Sales Chart
        tx.deal.findMany({
          where: { tenantId, deletedAt: null, stage: 'WON', updatedAt: { gte: startOfCurrentYear } },
          select: { value: true, updatedAt: true },
        }),

        // 7-day deals for sparkline
        tx.deal.findMany({
          where: { tenantId, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
        }),

        // 7-day won revenue for sparkline
        tx.deal.findMany({
          where: { tenantId, deletedAt: null, stage: 'WON', updatedAt: { gte: sevenDaysAgo } },
          select: { value: true, updatedAt: true },
        }),

        // 7-day leads for sparkline
        tx.lead.findMany({
          where: { tenantId, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
        }),

        // Recent Deals (take 5)
        tx.deal.findMany({
          where: { tenantId, deletedAt: null },
          select: { id: true, name: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        // Recent Quotations (take 5)
        tx.quotation.findMany({
          where: { tenantId, deletedAt: null },
          select: { id: true, client: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        // Recent Completed Tasks (take 5)
        tx.task.findMany({
          where: { tenantId, deletedAt: null, status: 'COMPLETED' },
          select: { id: true, title: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),

        // Active Revenue Target
        tx.revenueTarget.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'desc' },
          select: { value: true },
        }),
      ]);

      const totalRevenue = Number(totalRevenueAgg._sum.value || 0);
      const currentRevenue = Number(currentPeriodRevenueAgg._sum.value || 0);
      const previousRevenue = Number(prevPeriodRevenueAgg._sum.value || 0);

      const wonCount = wonDealsTotal;
      const lostCount = lostDealsTotal;
      const totalQualified = wonCount + lostCount;
      const winRate = totalQualified > 0 ? (wonCount / totalQualified) * 100 : totalDeals > 0 ? (wonCount / totalDeals) * 100 : 0;

      // Build 7-day sparklines from findMany records
      const dealsDayMap = new Map<string, number>();
      for (const d of sparklineDealsRaw) {
        const dStr = new Date(d.createdAt).toISOString().split('T')[0];
        dealsDayMap.set(dStr, (dealsDayMap.get(dStr) || 0) + 1);
      }

      const revenueDayMap = new Map<string, number>();
      for (const r of sparklineRevenueRaw) {
        const dStr = new Date(r.updatedAt).toISOString().split('T')[0];
        revenueDayMap.set(dStr, (revenueDayMap.get(dStr) || 0) + Number(r.value || 0));
      }

      const leadsDayMap = new Map<string, number>();
      for (const l of sparklineLeadsRaw) {
        const dStr = new Date(l.createdAt).toISOString().split('T')[0];
        leadsDayMap.set(dStr, (leadsDayMap.get(dStr) || 0) + 1);
      }

      const sparklineDeals: { value: number }[] = [];
      const sparklineRevenue: { value: number }[] = [];
      const sparklineLeads: { value: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];

        sparklineDeals.push({ value: dealsDayMap.get(dStr) || 0 });
        sparklineRevenue.push({ value: revenueDayMap.get(dStr) || 0 });
        sparklineLeads.push({ value: leadsDayMap.get(dStr) || 0 });
      }

      const revenueDisplayValue = totalRevenue > 0 ? totalRevenue : currentRevenue;

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
          value: Number(totalLeads || 0).toLocaleString('en-US'),
          valueAmount: Number(totalLeads || 0),
          sparklineData: sparklineLeads,
          ...calculateTrend(
            Number(currentPeriodLeads || 0),
            Number(prevPeriodLeads || 0),
          ),
        },
        {
          title: 'Active Deals',
          value: `${Number(activeDeals || 0)} Deals`,
          valueAmount: Number(activeDeals || 0),
          sparklineData: sparklineDeals,
          ...calculateTrend(
            Number(activeDeals || 0),
            Number(prevActiveDeals || 0),
          ),
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
          value: Number(totalDeals || 0).toLocaleString('en-US'),
          valueAmount: Number(totalDeals || 0),
          sparklineData: sparklineDeals,
          ...calculateTrend(
            Number(currentPeriodDeals || 0),
            Number(prevPeriodDeals || 0),
          ),
        },
        {
          title: 'New Customers',
          value: Number(currentPeriodCustomers || 0).toLocaleString('en-US'),
          valueAmount: Number(currentPeriodCustomers || 0),
          ...calculateTrend(
            Number(currentPeriodCustomers || 0),
            Number(prevPeriodCustomers || 0),
          ),
        },
        {
          title: 'Pending Tasks',
          value: Number(pendingTasksTotal || 0).toLocaleString('en-US'),
          valueAmount: Number(pendingTasksTotal || 0),
          ...calculateTrend(
            Number(currentPeriodPendingTasks || 0),
            Number(prevPeriodPendingTasks || 0),
          ),
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
      for (const d of monthlySalesRaw) {
        const mIndex = new Date(d.updatedAt).getMonth();
        if (mIndex >= 0 && mIndex < 12) {
          salesChartData[mIndex].total += Number(d.value || 0);
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
  }

  async getRevenueGrowth(tenantId: string, filter: string) {
    // Basic implementation to return revenue growth data
    // The frontend fetches this to cache it for the dashboard
    return {
      growth: 0,
      trend: 'stable',
      data: [],
    };
  }

  /**
   * Employee-scoped dashboard data.
   * Returns ONLY records that belong to / are assigned to the calling user.
   * No organisation-wide metrics are exposed.
   */
  async getEmployeeDashboardData(tenantId: string, userId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [
        myPendingTasks,
        myTodayMeetings,
        myUpcomingMeetings,
        myAssignedLeads,
        myAssignedDeals,
        myRecentActivities,
      ] = await Promise.all([
        // Tasks assigned to this user that are not completed
        tx.task.count({
          where: {
            tenantId,
            assignedToId: userId,
            deletedAt: null,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
        }),

        // Today's meetings for this user
        tx.meeting.count({
          where: {
            tenantId,
            assignedToId: userId,
            startTime: { gte: todayStart, lt: todayEnd },
          },
        }),

        // All upcoming meetings (including today)
        tx.meeting.count({
          where: {
            tenantId,
            assignedToId: userId,
            startTime: { gte: now },
          },
        }),

        // Leads assigned to this user
        tx.lead.count({
          where: {
            tenantId,
            assignedToId: userId,
            deletedAt: null,
          },
        }),

        // Deals owned by this user
        tx.deal.count({
          where: {
            tenantId,
            ownerId: userId,
            deletedAt: null,
            stage: { notIn: ['WON', 'LOST'] },
          },
        }),

        // Recent activities: completed tasks, recent leads, recent deals for this user
        Promise.all([
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
        ]),
      ]);

      const [recentTasks, recentLeads] = myRecentActivities;

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
  }
}
