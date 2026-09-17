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
    const currency = await this.getTenantCurrency(tenantId);
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const deals = await tx.deal.findMany({
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
      });

      const now = new Date();
      const nowTime = now.getTime();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Precompute 7 daily boundaries (dEnd: day -6 through today + 1)
      const dEndTimes: number[] = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 6; i >= 0; i--) {
        const dStart = new Date(todayStart);
        dStart.setDate(dStart.getDate() - i);
        const dEnd = new Date(dStart);
        dEnd.setDate(dEnd.getDate() + 1);
        dEndTimes[6 - i] = dEnd.getTime();
      }

      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoTime = sevenDaysAgo.getTime();

      // Single-pass accumulators
      let openDealsCount = 0;
      let wonDealsCount = 0;
      let totalValue = 0;
      let weightedPipeline = 0;

      let prevOpenDeals = 0;
      let prevTotalDeals = 0;
      let prevWonDeals = 0;

      const activeDealsOnDay = [0, 0, 0, 0, 0, 0, 0];
      const totalDealsUpToDay = [0, 0, 0, 0, 0, 0, 0];
      const wonDealsOnDay = [0, 0, 0, 0, 0, 0, 0];

      const dealCount = deals.length;
      const items = new Array(dealCount);

      for (let idx = 0; idx < dealCount; idx++) {
        const deal = deals[idx];
        const stage = deal.stage;
        const isWon = stage === 'WON';
        const isLost = stage === 'LOST';
        const isOpen = !isWon && !isLost;
        const dealValue = toNumber(deal.value);
        const probability = deal.probability || 10;

        const createdTime = deal.createdAt
          ? new Date(deal.createdAt).getTime()
          : 0;
        const updatedTime = deal.updatedAt
          ? new Date(deal.updatedAt).getTime()
          : createdTime;

        if (isOpen) {
          openDealsCount++;
          totalValue += dealValue;
          weightedPipeline += dealValue * (probability / 100);
        } else if (isWon) {
          wonDealsCount++;
        }

        // 7-day-ago baseline metrics
        if (createdTime < sevenDaysAgoTime) {
          prevTotalDeals++;
          if (isWon && updatedTime < sevenDaysAgoTime) {
            prevWonDeals++;
          }
          if (isOpen || updatedTime >= sevenDaysAgoTime) {
            prevOpenDeals++;
          }
        }

        // 7-day daily sparkline buckets
        for (let j = 0; j < 7; j++) {
          const dEndTime = dEndTimes[j];
          if (createdTime < dEndTime) {
            totalDealsUpToDay[j]++;
            if (isWon) {
              wonDealsOnDay[j]++;
            }
            if (isOpen || updatedTime >= dEndTime) {
              activeDealsOnDay[j]++;
            }
          }
        }

        // Single-pass item mapping & decryption
        const daysSinceUpdate = Math.floor(
          (nowTime - updatedTime) / (1000 * 60 * 60 * 24),
        );
        let temperature = 'Warm';
        if (daysSinceUpdate < 3) temperature = 'Hot';
        else if (daysSinceUpdate > 7) temperature = 'Cold';

        const isStuck = daysSinceUpdate > 10 && isOpen;
        const priority = 'Medium';
        const expectedCloseDate =
          deal.expectedCloseDate ||
          new Date(createdTime + 30 * 24 * 60 * 60 * 1000);

        const decryptedCompany = deal.company?.name
          ? this.enc.decrypt(deal.company.name)
          : null;
        const decryptedCustomer = deal.customer?.name
          ? this.enc.decrypt(deal.customer.name)
          : null;
        const displayCompany = decryptedCompany || decryptedCustomer || '';

        const expCloseDateObj =
          typeof expectedCloseDate === 'string'
            ? new Date(expectedCloseDate)
            : expectedCloseDate;

        items[idx] = {
          id: deal.id,
          name: deal.name,
          company: displayCompany,
          value: formatCurrency(deal.value, currency),
          valueAmount: dealValue,
          followUp: formatRelativeDate(
            deal.expectedCloseDate
              ? new Date(deal.expectedCloseDate).toISOString()
              : null,
            { fallback: 'Not scheduled' },
          ),
          followUpAt: deal.expectedCloseDate,
          stage: deal.stage,
          priority,
          probability,
          temperature,
          expectedCloseDate: formatDate(expCloseDateObj.toISOString()),
          activityCount: deal.expectedCloseDate ? 3 : 2,
          isStuck,
          aiSummary: `Deal with ${displayCompany || 'Customer'} is progressing well. ${temperature === 'Hot' ? 'High engagement detected.' : 'Follow-up recommended.'}`,
          createdAt:
            deal.createdAt instanceof Date
              ? deal.createdAt.toISOString()
              : new Date(deal.createdAt).toISOString(),
        };
      }

      const winRate = dealCount ? (wonDealsCount / dealCount) * 100 : 0;
      const previousWinRate = prevTotalDeals
        ? (prevWonDeals / prevTotalDeals) * 100
        : 0;

      const sparklineActiveDeals = activeDealsOnDay.map((val) => ({
        value: val,
      }));
      const sparklineWinRate = totalDealsUpToDay.map((tot, j) => ({
        value: tot ? Math.round((wonDealsOnDay[j] / tot) * 100) : 0,
      }));

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
            value: `${openDealsCount} Deals`,
            valueAmount: openDealsCount,
            sparklineData: sparklineActiveDeals,
            ...calculateTrend(openDealsCount, prevOpenDeals),
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
