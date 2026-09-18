import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { ReportsService } from '../services/reports.service';

interface AuthenticatedRequest extends FastifyRequest {
  tenantId: string;
}

@Controller('crm/reports')
@UseGuards(SupabaseAuthGuard, TenantGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  async getReports(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('teamId') teamId?: string,
    @Query('pipeline') pipeline?: string,
  ) {
    const tenantId = req.tenantId;
    const data = await this.reportsService.getReports(tenantId, {
      startDate,
      endDate,
      assignedToId,
      teamId,
      pipeline,
    });
    return { success: true, data };
  }
}
