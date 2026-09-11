import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { RoleStatsService } from '../services/role-stats.service';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';

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
