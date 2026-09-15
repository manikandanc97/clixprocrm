import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuditLogsService } from '../services/audit-logs.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { parsePaginationParams } from '../../common/utils/pagination.util';

@Controller('crm/audit-logs')
@UseGuards(SupabaseAuthGuard, TenantGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Permissions('Roles:Manage')
  async getAuditLogs(
    @Req() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    const { page: pageNum, limit: limitNum } = parsePaginationParams({ page, limit }, 20);
    const result = await this.auditLogsService.getAuditLogs(
      req.tenantId,
      pageNum,
      limitNum,
      search || '',
    );
    return {
      success: true,
      data: result.logs,
      meta: result.meta,
    };
  }
}
