import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { AnalyticsService } from '../services/analytics.service';

interface AuthenticatedRequest extends FastifyRequest {
  tenantId: string;
}

@Controller('crm/analytics')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('filter') filter?: string,
  ) {
    const tenantId = req.tenantId;
    const data = await this.analyticsService.getAnalytics(tenantId, filter);
    return { success: true, data };
  }

  @Get('revenue-target')
  @Roles('ADMIN', 'MANAGER')
  async getRevenueGrowth(
    @Req() req: AuthenticatedRequest,
    @Query('filter') filter?: string,
  ) {
    const tenantId = req.tenantId;
    const data = await this.analyticsService.getRevenueGrowthData(
      tenantId,
      filter,
    );
    return { success: true, data };
  }
}
