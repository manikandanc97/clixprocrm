import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { PlatformAnalyticsService, AnalyticsQueryDto } from '../services/platform-analytics.service';

@Controller(['super-admin/analytics', 'super_admin/analytics'])
@UseGuards(SupabaseAuthGuard, SuperAdminGuard)
export class PlatformAnalyticsController {
  constructor(private readonly analyticsService: PlatformAnalyticsService) {}

  @Get()
  async getAnalytics(
    @Query('range') range?: '30d' | '3m' | '6m' | '12m' | 'custom',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const query: AnalyticsQueryDto = { range, startDate, endDate };
    const data = await this.analyticsService.getPlatformAnalytics(query);
    return {
      success: true,
      data,
    };
  }
}
