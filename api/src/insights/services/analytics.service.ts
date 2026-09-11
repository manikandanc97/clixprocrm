import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { toNumber } from '../../common/utils/crm-formatters.util';
import { AnalyticsRevenueGrowthService } from './analytics.revenue-growth.service';
import { AnalyticsInsightsService } from './analytics.insights.service';

/**
 * @file insights/services/analytics.service.ts
 * Core Analytics overview service.
 * Revenue growth is in analytics.revenue-growth.service.ts.
 * Insights are in analytics.insights.service.ts.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsRevenueGrowthService: AnalyticsRevenueGrowthService,
    private readonly analyticsInsightsService: AnalyticsInsightsService,
  ) {}

  async getAnalytics(tenantId: string, filter?: string) {
    const now = new Date();
    let currentStart = new Date(now);
    currentStart.setHours(0, 0, 0, 0);
    let previousStart = new Date(currentStart);
    let periodDays = 7;

    if (filter) {
      switch (filter) {
        case 'Today':
          periodDays = 1;
          break;
        case 'Last 7 Days':
          currentStart = new Date(now);
          currentStart.setDate(now.getDate() - 6);
          currentStart.setHours(0, 0, 0, 0);
          periodDays = 7;
          break;
        case 'This Month':
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodDays = now.getDate();
          break;
        default:
          periodDays = 7;
      }
    }

    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - periodDays);

    const leadsBaseWhere: Prisma.LeadWhereInput = { tenantId, deletedAt: null };
    const tasksBaseWhere: Prisma.TaskWhereInput = { tenantId, deletedAt: null };
    const customersBaseWhere: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };

    const currentLeadsWhere: Prisma.LeadWhereInput = {
      ...leadsBaseWhere,
      createdAt: { gte: currentStart, lte: now },
    };
    const previousLeadsWhere: Prisma.LeadWhereInput = {
      ...leadsBaseWhere,
      createdAt: { gte: previousStart, lt: currentStart },
    };
    const currentTasksWhere: Prisma.TaskWhereInput = {
      ...tasksBaseWhere,
      createdAt: { gte: currentStart, lte: now },
    };
    const previousTasksWhere: Prisma.TaskWhereInput = {
      ...tasksBaseWhere,
      createdAt: { gte: previousStart, lt: currentStart },
    };
    const currentCustomersWhere: Prisma.CustomerWhereInput = {
      ...customersBaseWhere,
      createdAt: { gte: currentStart, lte: now },
    };
    const previousCustomersWhere: Prisma.CustomerWhereInput = {
      ...customersBaseWhere,
      createdAt: { gte: previousStart, lt: currentStart },
    };

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [
        summaryRaw,
        stageCounts,
        revenueTargetRecord,
        sparklinesRaw,
        leadsGrowthRaw,
        revenueWonRaw,
      ] = await Promise.all([
        // 1. Consolidated Summary Counts
        tx.$queryRaw<
          Array<{
            leads_count: number;
            prev_leads_count: number;
            tasks_count: number;
            prev_tasks_count: number;
            customers_count: number;
            prev_customers_count: number;
          }>
        >`
          SELECT
            (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" <= ${now}) as leads_count,
            (SELECT COUNT(*)::int FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) as prev_leads_count,
            (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" <= ${now}) as tasks_count,
            (SELECT COUNT(*)::int FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) as prev_tasks_count,
            (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${currentStart} AND "createdAt" <= ${now}) as customers_count,
            (SELECT COUNT(*)::int FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${previousStart} AND "createdAt" < ${currentStart}) as prev_customers_count
        `,

        // 2. Stage breakdown
        tx.lead.groupBy({
          by: ['stage'],
          where: leadsBaseWhere,
          _count: { id: true },
        }),

        // 3. Target record
        tx.revenueTarget.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'desc' },
        }),

        // 4. 7-Day Sparkline aggregates
        tx.$queryRaw<
          Array<{
            day_date: Date;
            task_count: number;
            lead_count: number;
            customer_count: number;
          }>
        >`
          SELECT
            d.day_date,
            COALESCE(t.cnt, 0)::int as task_count,
            COALESCE(l.cnt, 0)::int as lead_count,
            COALESCE(c.cnt, 0)::int as customer_count
          FROM (
            SELECT generate_series(${sevenDaysAgo}::date, ${now}::date, '1 day'::interval)::date as day_date
          ) d
          LEFT JOIN (
            SELECT DATE_TRUNC('day', "createdAt")::date as dd, COUNT(*) as cnt
            FROM "Task" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', "createdAt")::date
          ) t ON t.dd = d.day_date
          LEFT JOIN (
            SELECT DATE_TRUNC('day', "createdAt")::date as dd, COUNT(*) as cnt
            FROM "Lead" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', "createdAt")::date
          ) l ON l.dd = d.day_date
          LEFT JOIN (
            SELECT DATE_TRUNC('day', "createdAt")::date as dd, COUNT(*) as cnt
            FROM "Customer" WHERE "tenantId" = ${tenantId} AND "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
            GROUP BY DATE_TRUNC('day', "createdAt")::date
          ) c ON c.dd = d.day_date
          ORDER BY d.day_date ASC
        `,

        // 5. Monthly Lead Creation for Current Year
        tx.$queryRaw<
          Array<{
            month_index: number;
            count: number;
          }>
        >`
          SELECT
            (EXTRACT(MONTH FROM "createdAt")::int - 1) as month_index,
            COUNT(*)::int as count
          FROM "Lead"
          WHERE "tenantId" = ${tenantId}
            AND "deletedAt" IS NULL
            AND "createdAt" >= ${startOfYear}
          GROUP BY (EXTRACT(MONTH FROM "createdAt")::int - 1)
        `,

        // 6. Monthly Won Revenue for Current Year
        tx.$queryRaw<
          Array<{
            month_index: number;
            revenue: number;
          }>
        >`
          SELECT
            (EXTRACT(MONTH FROM "updatedAt")::int - 1) as month_index,
            COALESCE(SUM("value"), 0)::float as revenue
          FROM "Lead"
          WHERE "tenantId" = ${tenantId}
            AND "deletedAt" IS NULL
            AND "stage" = 'WON'::"LeadStage"
            AND "updatedAt" >= ${startOfYear}
          GROUP BY (EXTRACT(MONTH FROM "updatedAt")::int - 1)
        `,
      ]);

      const summary = summaryRaw[0] || {
        leads_count: 0,
        prev_leads_count: 0,
        tasks_count: 0,
        prev_tasks_count: 0,
        customers_count: 0,
        prev_customers_count: 0,
      };

      const leadsCount = Number(summary.leads_count || 0);
      const previousLeadsCount = Number(summary.prev_leads_count || 0);
      const tasksCount = Number(summary.tasks_count || 0);
      const previousTasksCount = Number(summary.prev_tasks_count || 0);
      const customersCount = Number(summary.customers_count || 0);
      const previousCustomersCount = Number(summary.prev_customers_count || 0);

      const stageMap = new Map(stageCounts.map((s) => [s.stage, s._count.id]));
      const newCount = stageMap.get('NEW') ?? 0;
      const contactedCount = stageMap.get('CONTACTED') ?? 0;
      const proposalCount = stageMap.get('PROPOSAL_SENT') ?? 0;
      const wonCount = stageMap.get('WON') ?? 0;
      const lostCount = stageMap.get('LOST') ?? 0;

      function calcChange(
        current: number,
        previous: number,
      ): { change: string; positive: boolean } {
        if (previous === 0)
          return {
            change: current > 0 ? '+100%' : '0%',
            positive: current >= 0,
          };
        const pct = ((current - previous) / previous) * 100;
        const sign = pct >= 0 ? '+' : '';
        return { change: `${sign}${pct.toFixed(1)}%`, positive: pct >= 0 };
      }

      const tasksSparkline: { value: number }[] = [];
      const leadsSparkline: { value: number }[] = [];
      const customersSparkline: { value: number }[] = [];

      for (const r of sparklinesRaw) {
        tasksSparkline.push({ value: Number(r.task_count || 0) });
        leadsSparkline.push({ value: Number(r.lead_count || 0) });
        customersSparkline.push({ value: Number(r.customer_count || 0) });
      }

      const pipelineStages = [
        { stage: 'New Lead', count: newCount, value: 0 },
        { stage: 'Contacted', count: contactedCount, value: 0 },
        { stage: 'Proposal Sent', count: proposalCount, value: 0 },
        { stage: 'Won', count: wonCount, value: 0 },
      ];

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
      const leadsGrowth = months.map((month) => ({
        name: month,
        direct: 0,
        social: 0,
        referral: 0,
      }));
      for (const lg of leadsGrowthRaw) {
        if (lg.month_index >= 0 && lg.month_index < 12) {
          leadsGrowth[lg.month_index].direct = Number(lg.count || 0);
        }
      }

      const annualTarget = revenueTargetRecord
        ? toNumber(revenueTargetRecord.value)
        : 0;
      const monthlyTarget =
        annualTarget > 0 ? Math.round(annualTarget / 12) : 0;
      const revenueOverview = months.map((month) => ({
        name: month,
        target: monthlyTarget,
        revenue: 0,
      }));
      for (const rw of revenueWonRaw) {
        if (rw.month_index >= 0 && rw.month_index < 12) {
          revenueOverview[rw.month_index].revenue = Number(rw.revenue || 0);
        }
      }

      const totalQualified = wonCount + lostCount;
      const winRate =
        totalQualified > 0 ? Math.round((wonCount / totalQualified) * 100) : 0;

      return {
        topStats: [
          {
            title: 'Total Tasks',
            value: tasksCount.toString(),
            ...calcChange(tasksCount, previousTasksCount),
            sparklineData: tasksSparkline,
          },
          {
            title: 'Total Leads',
            value: leadsCount.toString(),
            ...calcChange(leadsCount, previousLeadsCount),
            sparklineData: leadsSparkline,
          },
          {
            title: 'Total Customers',
            value: customersCount.toString(),
            ...calcChange(customersCount, previousCustomersCount),
            sparklineData: customersSparkline,
          },
        ],
        revenueOverview,
        leadsGrowth,
        pipelineStages,
        topAgents: [],
        customerGrowth: [],
        recentActivity: [],
        conversionStats: {
          averageRate: winRate.toString(),
          qualified: totalQualified.toString(),
          won: wonCount.toString(),
          lost: lostCount.toString(),
        },
        campaignPerformance: [],
      };
    });
  }

  async getRevenueGrowth(tenantId: string, filter?: string) {
    return this.analyticsRevenueGrowthService.getRevenueGrowth(
      tenantId,
      filter,
    );
  }

  async getRevenueGrowthData(tenantId: string, filter = 'Year') {
    return this.analyticsRevenueGrowthService.getRevenueGrowth(
      tenantId,
      filter,
    );
  }

  async getAiInsights(tenantId: string) {
    return this.analyticsInsightsService.getAiInsights(tenantId);
  }
}
