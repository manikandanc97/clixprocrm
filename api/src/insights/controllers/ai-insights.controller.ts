import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { AnalyticsService } from '../services/analytics.service';

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
