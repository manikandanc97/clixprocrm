import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import type { FastifyRequest } from 'fastify';

interface AuthenticatedRequest extends FastifyRequest {
  tenantId: string;
}


@Controller('crm/ai-insights')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class AiInsightsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  async getAiInsights(@Req() req: AuthenticatedRequest) {
    const data = await this.analyticsService.getAiInsights(req.tenantId);
    return { success: true, data };
  }
}
