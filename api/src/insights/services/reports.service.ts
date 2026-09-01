import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  formatCurrency,
  toNumber,
  formatPercentage,
} from '../../common/utils/crm-formatters.util';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  assignedToId?: string;
  teamId?: string;
  pipeline?: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async getTenantCurrency(tenantId: string): Promise<string> {
    return getCachedTenantCurrency(this.prisma, tenantId);
  }

  async getReports(tenantId: string, filters: ReportFilters = {}) {
    // Tenant table is global (not tenant-scoped) — fetch currency outside the tenant context
    const currency = await this.getTenantCurrency(tenantId);

    const baseWhere: Prisma.LeadWhereInput = { tenantId, deletedAt: null };

    if (filters.startDate || filters.endDate) {
      baseWhere.createdAt = {};
      if (filters.startDate)
        baseWhere.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) baseWhere.createdAt.lte = new Date(filters.endDate);
    }
    if (filters.assignedToId) baseWhere.assignedToId = filters.assignedToId;

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [
        totalLeadsCount,
        wonDealsCount,
        lostDealsCount,
        allWonLeads,
        allOpenLeads,
        funnelCounts,
        leadSourcesData,
        teamPerformanceData,
        topCustomersData,
        recentActivitiesData,
        upcomingTasksData,
        upcomingMeetingsData,
        revenueTargetData,
        salesActivitiesTasks,
        salesActivitiesMeetings,
        allUsers,
      ] = await Promise.all([
        tx.lead.count({ where: baseWhere }),
        tx.lead.count({ where: { ...baseWhere, stage: 'WON' } }),
        tx.lead.count({ where: { ...baseWhere, stage: 'LOST' } }),
        tx.lead.findMany({
          where: { ...baseWhere, stage: 'WON' },
          select: {
            value: true,
            updatedAt: true,
            assignedToId: true,
            assignedTo: { select: { name: true } },
          },
        }),
        tx.lead.findMany({
          where: { ...baseWhere, stage: { notIn: ['WON', 'LOST'] } },
          select: { value: true },
        }),
        tx.lead.groupBy({
          by: ['stage'],
          where: baseWhere,
          _count: { id: true },
        }),
        tx.lead.groupBy({
          by: ['source'],
          where: baseWhere,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        tx.lead.groupBy({
          by: ['assignedToId', 'stage'],
          where: { ...baseWhere, assignedToId: { not: null } },
          _count: { id: true },
          _sum: { value: true },
        }),
        tx.customer.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { revenue: 'desc' },
          take: 5,
          select: { id: true, name: true, company: true, revenue: true },
        }),
        tx.timelineEvent.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            description: true,
            createdAt: true,
            user: { select: { name: true } },
            lead: { select: { name: true } },
          },
        }),
        tx.task.findMany({
          where: {
            tenantId,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            dueDate: { gt: new Date() },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
          select: { id: true, title: true, dueDate: true, status: true },
        }),
        tx.meeting.findMany({
          where: {
            tenantId,
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
            startTime: { gt: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 5,
          select: { id: true, title: true, startTime: true, status: true },
        }),
        tx.revenueTarget.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'desc' },
        }),
        tx.task.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { id: true },
        }),
        tx.meeting.count({ where: { tenantId } }),
        tx.user.findMany({
          where: { memberships: { some: { tenantId } } },
          select: { id: true, name: true },
        }),
      ]);

      const openDealsCount = totalLeadsCount - wonDealsCount - lostDealsCount;

      const totalRevenue = allWonLeads.reduce(
        (sum, lead) => sum + toNumber(lead.value),
        0,
      );
      const averageDealSize =
        wonDealsCount > 0 ? totalRevenue / wonDealsCount : 0;

      const forecastRevenue = allOpenLeads.reduce(
        (sum, lead) => sum + toNumber(lead.value),
        0,
      );

      const conversionRate =
        wonDealsCount + lostDealsCount > 0
          ? (wonDealsCount / (wonDealsCount + lostDealsCount)) * 100
          : 0;

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
      const revenueChart = months.map((month) => ({ name: month, total: 0 }));
      allWonLeads.forEach((lead) => {
        const date = new Date(lead.updatedAt);
        revenueChart[date.getMonth()].total += toNumber(lead.value);
      });

      const funnelMap = new Map(funnelCounts.map((f) => [f.stage, f._count.id]));
      const funnel = [
        { stage: 'NEW', count: funnelMap.get('NEW') || 0, percentage: 0 },
        {
          stage: 'CONTACTED',
          count: funnelMap.get('CONTACTED') || 0,
          percentage: 0,
        },
        {
          stage: 'PROPOSAL_SENT',
          count: funnelMap.get('PROPOSAL_SENT') || 0,
          percentage: 0,
        },
        { stage: 'WON', count: funnelMap.get('WON') || 0, percentage: 0 },
      ];

      for (let i = 0; i < funnel.length; i++) {
        if (i === 0) {
          funnel[i].percentage = funnel[i].count > 0 ? 100 : 0;
        } else {
          const previousCount = funnel[i - 1].count;
          funnel[i].percentage =
            previousCount > 0
              ? Math.round((funnel[i].count / previousCount) * 100)
              : 0;
        }
      }

      const leadSources = leadSourcesData.map((ls) => ({
        name: ls.source || 'Unknown',
        value: ls._count.id,
      }));

      const teamMap = new Map<
        string,
        {
          id: string;
          name: string;
          dealsClosed: number;
          revenueValue: number;
          totalDeals: number;
        }
      >();
      allUsers.forEach((user) => {
        teamMap.set(user.id, {
          id: user.id,
          name: user.name || 'Unknown',
          dealsClosed: 0,
          revenueValue: 0,
          totalDeals: 0,
        });
      });

      teamPerformanceData.forEach((row) => {
        const userId = row.assignedToId;
        if (!userId) return;
        if (!teamMap.has(userId)) {
          const userName =
            allUsers.find((u) => u.id === userId)?.name || 'Unknown';
          teamMap.set(userId, {
            id: userId,
            name: userName,
            dealsClosed: 0,
            revenueValue: 0,
            totalDeals: 0,
          });
        }
        const member = teamMap.get(userId)!;
        const rowCount = row._count.id;
        const rowRevenue = toNumber(row._sum.value);
        member.totalDeals += rowCount;
        if (row.stage === 'WON') {
          member.dealsClosed += rowCount;
          member.revenueValue += rowRevenue;
        }
      });

      const performance = Array.from(teamMap.values())
        .map((member) => ({
          id: member.id,
          name: member.name,
          dealsClosed: member.dealsClosed,
          revenueValue: member.revenueValue,
          revenue: formatCurrency(member.revenueValue, currency),
          conversionRate:
            member.totalDeals > 0
              ? formatPercentage(member.dealsClosed / member.totalDeals)
              : '0%',
          trend: '0%',
          trendPositive: true,
        }))
        .sort((a, b) => b.revenueValue - a.revenueValue);

      const topCustomers = topCustomersData.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        revenue: toNumber(c.revenue),
      }));

      const recentActivities = recentActivitiesData.map((a) => ({
        id: a.id,
        action: a.action,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
        userName: a.user?.name,
        leadName: a.lead?.name,
      }));

      const upcomingFollowUps = [
        ...upcomingTasksData.map((t) => ({
          id: t.id,
          title: t.title,
          type: 'TASK' as const,
          date: t.dueDate!.toISOString(),
          status: t.status,
        })),
        ...upcomingMeetingsData.map((m) => ({
          id: m.id,
          title: m.title,
          type: 'MEETING' as const,
          date: m.startTime.toISOString(),
          status: m.status,
        })),
      ]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

      const targetValue = revenueTargetData
        ? toNumber(revenueTargetData.value)
        : 0;
      const targetChange =
        targetValue > 0 ? (totalRevenue / targetValue) * 100 : 0;
      const revenueTarget = {
        revenue: totalRevenue,
        target: targetValue,
        change: formatPercentage(targetChange / 100),
        positive: targetChange >= 100,
      };

      const completedTasks =
        salesActivitiesTasks.find((t) => t.status === 'COMPLETED')?._count.id ||
        0;
      const pendingTasks =
        salesActivitiesTasks.find((t) => t.status === 'PENDING')?._count.id || 0;
      const salesActivities = [
        { name: 'Meetings', value: salesActivitiesMeetings },
        { name: 'Completed Tasks', value: completedTasks },
        { name: 'Pending Tasks', value: pendingTasks },
      ];

      const insights = [];
      if (conversionRate > 20 && wonDealsCount > 0) {
        insights.push({
          id: 'ins-1',
          type: 'leads',
          title: 'High Conversion',
          description: `Your team is converting at ${conversionRate.toFixed(1)}%, which is excellent.`,
        });
      } else if (conversionRate < 10 && wonDealsCount + lostDealsCount > 0) {
        insights.push({
          id: 'ins-1',
          type: 'leads',
          title: 'Low Conversion',
          description: `Your conversion rate is ${conversionRate.toFixed(1)}%. Consider reviewing lost deals.`,
        });
      }

      if (topCustomers.length > 0 && topCustomers[0].revenue > 0) {
        insights.push({
          id: 'ins-2',
          type: 'revenue',
          title: 'Top Performer',
          description: `${topCustomers[0].name} is your top customer generating ${formatCurrency(topCustomers[0].revenue, currency)}.`,
        });
      }

      if (performance.length > 0 && performance[0].dealsClosed > 0) {
        insights.push({
          id: 'ins-3',
          type: 'team',
          title: 'Top Sales Rep',
          description: `${performance[0].name} leads the team with ${performance[0].dealsClosed} deals.`,
        });
      }

      return {
        stats: [
          {
            title: 'Total Leads',
            value: totalLeadsCount.toString(),
            change: `${openDealsCount} open`,
            positive: true,
          },
          {
            title: 'Open Leads',
            value: openDealsCount.toString(),
            change: `${totalLeadsCount > 0 ? ((openDealsCount / totalLeadsCount) * 100).toFixed(0) : 0}% of total`,
            positive: true,
          },
          {
            title: 'Won Deals',
            value: wonDealsCount.toString(),
            change: `${wonDealsCount > 0 ? '+' : ''}${wonDealsCount} closed`,
            positive: wonDealsCount > 0,
          },
          {
            title: 'Lost Deals',
            value: lostDealsCount.toString(),
            change: `${lostDealsCount} lost`,
            positive: lostDealsCount === 0,
          },
          {
            title: 'Conversion %',
            value: `${conversionRate.toFixed(1)}%`,
            change: `${wonDealsCount} of ${totalLeadsCount}`,
            positive: conversionRate > 0,
          },
          {
            title: 'Revenue',
            value: totalRevenue,
            change: `${wonDealsCount} deals won`,
            positive: true,
          },
          {
            title: 'Avg Deal Size',
            value: averageDealSize,
            change: 'per deal',
            positive: true,
          },
          {
            title: 'Forecast Revenue',
            value: forecastRevenue,
            change: 'weighted pipeline',
            positive: true,
          },
        ],
        revenueChart,
        conversionChart: [
          { name: 'Won', value: wonDealsCount },
          { name: 'Lost', value: lostDealsCount },
        ],
        performance,
        funnel,
        activityHeatmap: [],
        insights,
        revenueTarget,
        leadSources,
        topCustomers,
        recentActivities,
        upcomingFollowUps,
        salesActivities,
      };
    });
  }
}
