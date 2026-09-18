import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { invalidateDashboardCache } from '../../insights/services/dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRevenueTargetDto } from '../dto/create-revenue-target.dto';

@Injectable()
export class RevenueService {
  constructor(private prisma: PrismaService) {}

  async getRevenueTargets(tenantId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.revenueTarget.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async createRevenueTarget(tenantId: string, data: CreateRevenueTargetDto) {
    const target = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const isActive = data.isActive !== undefined ? data.isActive : true;

      if (isActive) {
        await tx.revenueTarget.updateMany({
          where: { tenantId, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.revenueTarget.create({
        data: {
          tenantId,
          periodType: data.periodType || 'MONTHLY',
          value: data.value || 0,
          currency: data.currency || 'INR',
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isActive,
        },
      });
    });

    await invalidateDashboardCache(tenantId);
    return target;
  }

  async updateRevenueTarget(
    tenantId: string,
    id: string,
    data: Partial<CreateRevenueTargetDto>,
  ) {
    const target = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      if (data.isActive) {
        await tx.revenueTarget.updateMany({
          where: { tenantId, isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }

      return tx.revenueTarget.update({
        where: { id, tenantId },
        data: {
          ...(data.periodType && { periodType: data.periodType }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.currency && { currency: data.currency }),
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    });

    await invalidateDashboardCache(tenantId);
    return target;
  }

  async deleteRevenueTarget(tenantId: string, id: string) {
    const deleted = await this.prisma.withTenantContext({ tenantId }, async (tx) => {
      return tx.revenueTarget.delete({
        where: { id, tenantId },
      });
    });

    await invalidateDashboardCache(tenantId);
    return deleted;
  }

  async getRevenueTargetAnalytics(tenantId: string, filters: any = {}) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const targets = await tx.revenueTarget.findMany({
        where: { tenantId, isActive: true },
      });

      const activeTarget = targets.length > 0 ? targets[0] : null;

      if (!activeTarget) {
        return {
          hasTarget: false,
          currentRevenue: 0,
          targetValue: 0,
          achievementPercentage: 0,
          trend: null,
        };
      }

      const start = new Date(activeTarget.startDate);
      const end = new Date(activeTarget.endDate);
      const prevStart = new Date(start);
      const prevEnd = new Date(end);

      if (activeTarget.periodType === 'MONTHLY') {
        prevStart.setMonth(prevStart.getMonth() - 1);
        prevEnd.setMonth(prevEnd.getMonth() - 1);
      } else if (activeTarget.periodType === 'QUARTERLY') {
        prevStart.setMonth(prevStart.getMonth() - 3);
        prevEnd.setMonth(prevEnd.getMonth() - 3);
      } else if (activeTarget.periodType === 'YEARLY') {
        prevStart.setFullYear(prevStart.getFullYear() - 1);
        prevEnd.setFullYear(prevEnd.getFullYear() - 1);
      }

      const leadWhere: Prisma.LeadWhereInput = {
        tenantId,
        stage: 'WON',
        deletedAt: null,
      };

      if (
        filters.employee &&
        filters.employee !== 'all' &&
        filters.employee !== 'me'
      ) {
        leadWhere.assignedToId = filters.employee;
      }

      const [currentRevenueAgg, previousRevenueAgg] = await Promise.all([
        tx.lead.aggregate({
          _sum: { value: true },
          where: {
            ...leadWhere,
            updatedAt: { gte: start, lte: end },
          },
        }),
        tx.lead.aggregate({
          _sum: { value: true },
          where: {
            ...leadWhere,
            updatedAt: { gte: prevStart, lte: prevEnd },
          },
        }),
      ]);

      const currentRevenue = Number(currentRevenueAgg._sum.value || 0);
      const previousRevenue = Number(previousRevenueAgg._sum.value || 0);
      const targetValue = Number(activeTarget.value);

      let achievementPercentage = 0;
      if (targetValue > 0) {
        achievementPercentage = Math.round(
          (currentRevenue / targetValue) * 100,
        );
      }

      let trend = 0;
      let trendDirection = 'neutral';
      if (previousRevenue > 0) {
        trend =
          Math.round(
            ((currentRevenue - previousRevenue) / previousRevenue) * 100 * 10,
          ) / 10;
        if (trend > 0) trendDirection = 'up';
        if (trend < 0) trendDirection = 'down';
      } else if (currentRevenue > 0) {
        trend = 100;
        trendDirection = 'up';
      }

      return {
        hasTarget: true,
        target: activeTarget,
        currentRevenue,
        previousRevenue,
        targetValue,
        achievementPercentage,
        trend: {
          value: Math.abs(trend),
          direction: trendDirection,
          label: `${Math.abs(trend)}% vs last period`,
        },
      };
    });
  }
}
