import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import {
  calculateTrend,
  formatCurrency,
  formatRelativeDate,
  toNumber,
  formatDate,
  formatPercentage,
} from '../../common/utils/crm-formatters.util';
import { getCachedTenantCurrency } from '../../common/utils/tenant-cache.util';

@Injectable()
export class PipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enc: EncryptionService,
  ) {}

  private async getTenantCurrency(tenantId: string): Promise<string> {
    return getCachedTenantCurrency(this.prisma, tenantId);
  }

  async getPipeline(tenantId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [currency, deals] = await Promise.all([
        this.getTenantCurrency(tenantId),
        tx.deal.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: [{ stage: 'asc' }, { updatedAt: 'desc' }],
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
            probability: true,
            expectedCloseDate: true,
            createdAt: true,
            updatedAt: true,
            company: { select: { name: true } },
            customer: { select: { name: true } },
          },
        }),
      ]);


    const openDeals = deals.filter(
      (deal) => !['WON', 'LOST'].includes(deal.stage),
    );
    const wonDeals = deals.filter((deal) => deal.stage === 'WON');
    const totalValue = openDeals.reduce(
      (total: number, deal) => total + toNumber(deal.value),
      0,
    );
    const weightedPipeline = openDeals.reduce((total: number, deal) => {
      const probability = deal.probability || 10;
      return total + toNumber(deal.value) * (probability / 100);
    }, 0);
    const winRate = deals.length ? (wonDeals.length / deals.length) * 100 : 0;

    const sparklineActiveDeals = [];
    const sparklineWinRate = [];
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const dStart = new Date(todayStart);
      dStart.setDate(dStart.getDate() - i);
      const dEnd = new Date(dStart);
      dEnd.setDate(dEnd.getDate() + 1);

      const activeDealsOnDay = deals.filter(
        (l) =>
          l.createdAt < dEnd &&
          (!['WON', 'LOST'].includes(l.stage) || l.updatedAt >= dEnd),
      ).length;

      const dealsUpToDay = deals.filter((l) => l.createdAt < dEnd);
      const wonDealsOnDay = dealsUpToDay.filter((l) => l.stage === 'WON');
      const winRateOnDay = dealsUpToDay.length
        ? (wonDealsOnDay.length / dealsUpToDay.length) * 100
        : 0;

      sparklineActiveDeals.push({ value: activeDealsOnDay });
      sparklineWinRate.push({ value: Math.round(winRateOnDay) });
    }

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const previousOpenDeals = deals.filter(
      (l) =>
        l.createdAt < sevenDaysAgo &&
        (!['WON', 'LOST'].includes(l.stage) || l.updatedAt >= sevenDaysAgo),
    ).length;
    const previousClosedDeals = deals.filter(
      (l) => ['WON', 'LOST'].includes(l.stage) && l.updatedAt < sevenDaysAgo,
    );
    const previousWonDeals = previousClosedDeals.filter(
      (l) => l.stage === 'WON',
    );
    const previousDeals = deals.filter((l) => l.createdAt < sevenDaysAgo);
    const previousWinRate = previousDeals.length
      ? (previousWonDeals.length / previousDeals.length) * 100
      : 0;

    const items = deals.map((deal) => {
      const stageLabel = deal.stage;
      const probability = deal.probability || 10;

      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - new Date(deal.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      let temperature = 'Warm';
      if (daysSinceUpdate < 3) temperature = 'Hot';
      if (daysSinceUpdate > 7) temperature = 'Cold';

      const isStuck =
        daysSinceUpdate > 10 && !['WON', 'LOST'].includes(stageLabel);
      const priority = 'Medium';
      const expectedCloseDate =
        deal.expectedCloseDate ||
        new Date(deal.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      const decryptedCompany = this.enc.decrypt(deal.company?.name);
      const decryptedCustomer = this.enc.decrypt(deal.customer?.name);
      const displayCompany = decryptedCompany || decryptedCustomer || '';

      return {
        id: deal.id,
        name: deal.name,
        company: displayCompany,
        value: formatCurrency(deal.value, currency),
        valueAmount: toNumber(deal.value),
        followUp: formatRelativeDate(
          deal.expectedCloseDate?.toISOString() || null,
          { fallback: 'Not scheduled' },
        ),
        followUpAt: deal.expectedCloseDate,
        stage: deal.stage,
        priority,
        probability,
        temperature,
        expectedCloseDate: formatDate(expectedCloseDate.toISOString()),
        activityCount: [
          deal.createdAt,
          deal.updatedAt,
          deal.expectedCloseDate,
        ].filter(Boolean).length,
        isStuck,
        aiSummary: `Deal with ${displayCompany || 'Customer'} is progressing well. ${temperature === 'Hot' ? 'High engagement detected.' : 'Follow-up recommended.'}`,
        createdAt: deal.createdAt.toISOString(),
      };
    });

      return {
        stats: [
          {
            title: 'Total Value',
            value: formatCurrency(totalValue, currency),
            valueAmount: totalValue,
          },
          {
            title: 'Weighted Value',
            value: formatCurrency(weightedPipeline, currency),
            valueAmount: weightedPipeline,
          },
          {
            title: 'Active Deals',
            value: `${openDeals.length} Deals`,
            valueAmount: openDeals.length,
            sparklineData: sparklineActiveDeals,
            ...calculateTrend(openDeals.length, previousOpenDeals),
          },
          {
            title: 'Win Rate',
            value: formatPercentage(winRate),
            valueAmount: winRate,
            sparklineData: sparklineWinRate,
            ...calculateTrend(winRate, previousWinRate),
          },
        ],
        items,
      };
    });
  }
}

