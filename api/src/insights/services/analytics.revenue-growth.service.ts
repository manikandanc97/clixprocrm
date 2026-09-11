import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toNumber } from '../../common/utils/crm-formatters.util';

/**
 * @file insights/services/analytics.revenue-growth.service.ts
 * Revenue growth trends, period-over-period calculations, and chart series generation.
 */
@Injectable()
export class AnalyticsRevenueGrowthService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueGrowth(tenantId: string, filter?: string) {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;
    const endDate: Date = new Date(now);
    let groupBy: 'month' | 'day' = 'month';

    switch (filter) {
      case 'Week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        groupBy = 'day';
        break;
      case 'Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
        groupBy = 'day';
        break;
      case 'Quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        previousStartDate = new Date(
          now.getFullYear(),
          (currentQuarter - 1) * 3,
          1,
        );
        previousEndDate = new Date(
          now.getFullYear(),
          currentQuarter * 3,
          0,
          23,
          59,
          59,
          999,
        );
        groupBy = 'month';
        break;
      case 'Year':
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(
          now.getFullYear() - 1,
          11,
          31,
          23,
          59,
          59,
          999,
        );
        groupBy = 'month';
        break;
    }

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [
        currentWonLeads,
        previousWonLeads,
        currentTotalLeads,
        previousTotalLeads,
      ] = await Promise.all([
        tx.lead.findMany({
          where: {
            tenantId,
            stage: 'WON',
            updatedAt: { gte: startDate, lte: endDate },
          },
          select: { value: true, updatedAt: true },
        }),
        tx.lead.findMany({
          where: {
            tenantId,
            stage: 'WON',
            updatedAt: { gte: previousStartDate, lte: previousEndDate },
          },
          select: { value: true },
        }),
        tx.lead.count({
          where: { tenantId, createdAt: { gte: startDate, lte: endDate } },
        }),
        tx.lead.count({
          where: {
            tenantId,
            createdAt: { gte: previousStartDate, lte: previousEndDate },
          },
        }),
      ]);

      const currentRevenue = currentWonLeads.reduce(
        (sum, lead) => sum + toNumber(lead.value),
        0,
      );
      const previousRevenue = previousWonLeads.reduce(
        (sum, lead) => sum + toNumber(lead.value),
        0,
      );
      const currentDeals = currentWonLeads.length;
      const previousDeals = previousWonLeads.length;

      const revenueGrowth =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : currentRevenue > 0
            ? 100
            : 0;
      const dealsGrowth =
        previousDeals > 0
          ? ((currentDeals - previousDeals) / previousDeals) * 100
          : currentDeals > 0
            ? 100
            : 0;

      const averageDealSize =
        currentDeals > 0 ? currentRevenue / currentDeals : 0;
      const previousAvgDealSize =
        previousDeals > 0 ? previousRevenue / previousDeals : 0;
      const avgDealSizeGrowth =
        previousAvgDealSize > 0
          ? ((averageDealSize - previousAvgDealSize) / previousAvgDealSize) *
            100
          : averageDealSize > 0
            ? 100
            : 0;

      const conversionRate =
        currentTotalLeads > 0 ? (currentDeals / currentTotalLeads) * 100 : 0;
      const previousConversionRate =
        previousTotalLeads > 0 ? (previousDeals / previousTotalLeads) * 100 : 0;
      const conversionRateGrowth =
        previousConversionRate > 0
          ? ((conversionRate - previousConversionRate) /
              previousConversionRate) *
            100
          : conversionRate > 0
            ? 100
            : 0;

      let chartData: { name: string; value: number; deals: number }[] = [];

      if (groupBy === 'month') {
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
        chartData = months.map((month) => ({
          name: month,
          value: 0,
          deals: 0,
        }));

        currentWonLeads.forEach((lead) => {
          const monthIndex = new Date(lead.updatedAt).getMonth();
          chartData[monthIndex].value += toNumber(lead.value);
          chartData[monthIndex].deals += 1;
        });

        if (filter === 'Quarter') {
          const currentQuarter = Math.floor(startDate.getMonth() / 3);
          chartData = chartData.slice(
            currentQuarter * 3,
            currentQuarter * 3 + 3,
          );
        }
      } else {
        const days = Math.round(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const dayMap = new Map();

        for (let i = 0; i <= days; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const name = d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          dayMap.set(d.toDateString(), { name, value: 0, deals: 0 });
        }

        currentWonLeads.forEach((lead) => {
          const d = new Date(lead.updatedAt).toDateString();
          if (dayMap.has(d)) {
            const entry = dayMap.get(d);
            entry.value += toNumber(lead.value);
            entry.deals += 1;
          }
        });

        chartData = Array.from(dayMap.values());
      }

      let highestRevenue = 0;
      let bestPerformingMonth = 'N/A';
      let totalChartRevenue = 0;

      chartData.forEach((dataPoint) => {
        totalChartRevenue += dataPoint.value;
        if (dataPoint.value > highestRevenue) {
          highestRevenue = dataPoint.value;
          bestPerformingMonth = dataPoint.name;
        }
      });

      const averageMonthlyRevenue =
        chartData.length > 0 ? totalChartRevenue / chartData.length : 0;

      return {
        monthlyRevenue: chartData,
        currentRevenue,
        previousRevenue,
        growth: Math.round(revenueGrowth * 10) / 10,
        monthlyDeals: chartData.map((d) => ({ name: d.name, deals: d.deals })),
        dealsGrowth: Math.round(dealsGrowth * 10) / 10,
        currentDeals,
        previousDeals,
        averageDealSize,
        avgDealSizeGrowth: Math.round(avgDealSizeGrowth * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
        conversionRateGrowth: Math.round(conversionRateGrowth * 10) / 10,
        highestRevenue,
        averageMonthlyRevenue,
        bestPerformingMonth,
      };
    });
  }
}
