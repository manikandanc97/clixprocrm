import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { RoleStatsService } from '../services/role-stats.service';
import { RolesService } from '../services/roles.service';

@Controller('crm/role-management/stats')
@UseGuards(SupabaseAuthGuard, TenantGuard, PermissionsGuard)
export class RoleManagementController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly roleStatsService: RoleStatsService,
  ) {}

  @Get()
  @Permissions('Roles:View')
  async getRoleManagementStats(@Req() req: any) {
    const data = await this.roleStatsService.getRoleManagementStats(
      req.tenantId,
    );
    return { success: true, data };
  }
}
