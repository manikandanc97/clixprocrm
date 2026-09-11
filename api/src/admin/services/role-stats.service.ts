import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * @file admin/services/role-stats.service.ts
 * Role management statistics aggregation.
 * Extracted from roles.service.ts — single responsibility: tenant-wide role/user/audit metrics.
 */
@Injectable()
export class RoleStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleManagementStats(tenantId: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const [
        totalUsers,
        activeUsers,
        disabledUsers,
        pendingInvites,
        totalRoles,
        systemRoles,
        customRoles,
        activeRoles,
        totalPermissions,
        totalDepartments,
        auditEvents,
      ] = await Promise.all([
        tx.tenantUser.count({ where: { tenantId } }),
        tx.tenantUser.count({ where: { tenantId, status: 'ACTIVE' } }),
        tx.tenantUser.count({ where: { tenantId, status: { not: 'ACTIVE' } } }),
        tx.invitation.count({ where: { tenantId, status: 'PENDING' } }),
        tx.role.count({ where: { tenantId } }),
        tx.role.count({ where: { tenantId, isSystem: true } }),
        tx.role.count({ where: { tenantId, isSystem: false } }),
        tx.role.count({ where: { tenantId, isActive: true } }),
        tx.rolePermission.count({ where: { role: { tenantId } } }),
        tx.department.count({ where: { tenantId } }),
        tx.auditLog.count({ where: { tenantId } }),
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          disabled: disabledUsers,
          pendingInvites,
        },
        roles: {
          total: totalRoles,
          system: systemRoles,
          custom: customRoles,
          active: activeRoles,
          permissions: totalPermissions,
        },
        departments: { total: totalDepartments },
        audit: { events: auditEvents },
      };
    });
  }
}
