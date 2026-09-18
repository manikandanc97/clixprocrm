import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { DashboardService } from '../services/dashboard.service';

interface AuthenticatedRequest extends FastifyRequest {
  tenantId: string;
  user: { id: string; [key: string]: any };
}

@Controller('crm/dashboard')
@UseGuards(SupabaseAuthGuard, TenantGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(
    @Req() req: AuthenticatedRequest,
    @Query('timeframe') timeframe = 'month',
  ) {
    const tenantId = req.tenantId;
    const data = await this.dashboardService.getDashboardData(
      tenantId,
      timeframe,
    );
    return { success: true, data };
  }

  @Get('revenue-growth')
  async getRevenueGrowth(
    @Req() req: AuthenticatedRequest,
    @Query('filter') filter = 'Year',
  ) {
    const tenantId = req.tenantId;
    const data = await this.dashboardService.getRevenueGrowth(tenantId, filter);
    return { success: true, data };
  }

  /**
   * Employee-scoped personal dashboard metrics.
   * Returns only records assigned to / owned by the requesting user.
   * Safe to call from any role — always scoped to req.user.id.
   */
  @Get('employee')
  async getEmployeeDashboard(@Req() req: AuthenticatedRequest) {
    const { tenantId } = req;
    const userId = req.user.id;
    const data = await this.dashboardService.getEmployeeDashboardData(
      tenantId,
      userId,
    );
    return { success: true, data };
  }
}
