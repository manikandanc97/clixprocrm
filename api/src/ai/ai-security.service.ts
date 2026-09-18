import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
    PermissionModule
} from '../common/role-permissions.constants';
import { PrismaService } from '../prisma/prisma.service';

export interface UserSecurityContext {
  userId: string;
  tenantId: string;
  roleName: string;
  isSystemAdmin: boolean;
  permissions: Array<{ module: string; hasAccess: boolean }>;
  departmentId?: string | null;
  subordinateUserIds: string[];
  teamUserIds: string[];
}

@Injectable()
export class AiSecurityService {
  private readonly logger = new Logger(AiSecurityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build complete security context for the authenticated user in the active tenant.
   * Executes inside a tenant-isolated transaction context to satisfy FORCE RLS.
   */
  async buildSecurityContext(
    userId: string,
    tenantId: string,
    userRole?: any,
    isSuperAdminUser = false,
  ): Promise<UserSecurityContext> {
    const isSuperAdmin =
      isSuperAdminUser ||
      (typeof userRole === 'object' && userRole?.name === 'SUPER_ADMIN') ||
      (typeof userRole === 'string' && userRole === 'SUPER_ADMIN');

    return this.prisma.withTenantContext(
      { tenantId: tenantId || '', isSuperAdmin, userId },
      async (tx) => {
        let tenantUser: any = null;
        if (tenantId) {
          tenantUser = await tx.tenantUser.findFirst({
            where: { tenantId, userId, status: 'ACTIVE' },
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          });
        }

        const role = userRole || tenantUser?.role;
        const rawRole =
          typeof role === 'object' ? role?.name || '' : String(role || '');
        const roleName =
          rawRole.toUpperCase() || (isSuperAdmin ? 'SUPER_ADMIN' : '');
        const normRole = roleName.replace(/[\s_]+/g, '');
        const isSystemAdmin =
          isSuperAdmin ||
          normRole === 'SUPERADMIN' ||
          normRole === 'ADMIN' ||
          normRole === 'OWNER';
        const isRoleActive = role ? role.isActive !== false : true;

        let subordinateUserIds: string[] = [];
        let teamUserIds: string[] = [];

        if (tenantUser && tenantId) {
          const [subordinates, teamMembers] = await Promise.all([
            tx.tenantUser.findMany({
              where: {
                tenantId,
                reportingManagerId: tenantUser.id,
                status: 'ACTIVE',
              },
              select: { userId: true },
            }),
            tenantUser.departmentId
              ? tx.tenantUser.findMany({
                  where: {
                    tenantId,
                    departmentId: tenantUser.departmentId,
                    status: 'ACTIVE',
                  },
                  select: { userId: true },
                })
              : Promise.resolve([]),
          ]);

          subordinateUserIds = (subordinates || []).map((s) => s.userId);
          teamUserIds = (teamMembers || []).map((t) => t.userId);
        }

        return {
          userId,
          tenantId: tenantId || '',
          roleName: roleName || (isSuperAdmin ? 'SUPER_ADMIN' : 'USER'),
          isSystemAdmin,
          permissions: isRoleActive
            ? role?.permissions || [{ module: 'ALL', hasAccess: true }]
            : [],
          departmentId: tenantUser?.departmentId || null,
          subordinateUserIds,
          teamUserIds,
        };
      },
    );
  }

  /**
   * Check if user has permission to access a specific module.
   */
  hasModulePermission(
    context: UserSecurityContext,
    module: PermissionModule | string,
  ): boolean {
    if (context.isSystemAdmin) {
      return true;
    }

    const perm = context.permissions.find(
      (p) => p.module.toLowerCase() === module.toLowerCase(),
    );

    return !!perm?.hasAccess;
  }

  /**
   * Builds record visibility WHERE clause for Leads.
   */
  getLeadsVisibilityFilter(
    context: UserSecurityContext,
  ): Prisma.LeadWhereInput {
    const baseWhere: Prisma.LeadWhereInput = {
      tenantId: context.tenantId,
      deletedAt: null,
    };

    if (context.isSystemAdmin) {
      return baseWhere;
    }

    if (context.roleName === 'MANAGER') {
      const allowedUserIds = [context.userId, ...context.subordinateUserIds];
      return {
        ...baseWhere,
        OR: [
          { assignedToId: { in: allowedUserIds } },
          { createdById: { in: allowedUserIds } },
          { assignedToId: null },
        ],
      };
    }

    // Default Employee / Sales scoping
    return {
      ...baseWhere,
      OR: [{ assignedToId: context.userId }, { createdById: context.userId }],
    };
  }

  /**
   * Builds record visibility WHERE clause for Deals.
   */
  getDealsVisibilityFilter(
    context: UserSecurityContext,
  ): Prisma.DealWhereInput {
    const baseWhere: Prisma.DealWhereInput = {
      tenantId: context.tenantId,
      deletedAt: null,
    };

    if (context.isSystemAdmin) {
      return baseWhere;
    }

    if (context.roleName === 'MANAGER') {
      const allowedUserIds = [context.userId, ...context.subordinateUserIds];
      return {
        ...baseWhere,
        ownerId: { in: allowedUserIds },
      };
    }

    // Employee / Sales scoping
    return {
      ...baseWhere,
      ownerId: context.userId,
    };
  }

  /**
   * Builds record visibility WHERE clause for Customers.
   */
  getCustomersVisibilityFilter(
    context: UserSecurityContext,
  ): Prisma.CustomerWhereInput {
    const baseWhere: Prisma.CustomerWhereInput = {
      tenantId: context.tenantId,
      deletedAt: null,
    };

    if (context.isSystemAdmin) {
      return baseWhere;
    }

    if (context.roleName === 'MANAGER') {
      const allowedUserIds = [context.userId, ...context.subordinateUserIds];
      return {
        ...baseWhere,
        OR: [{ assignedToId: { in: allowedUserIds } }, { assignedToId: null }],
      };
    }

    // Employee scoping
    return {
      ...baseWhere,
      assignedToId: context.userId,
    };
  }

  /**
   * Builds record visibility WHERE clause for Tasks.
   */
  getTasksVisibilityFilter(
    context: UserSecurityContext,
  ): Prisma.TaskWhereInput {
    const baseWhere: Prisma.TaskWhereInput = {
      tenantId: context.tenantId,
      deletedAt: null,
    };

    if (context.isSystemAdmin) {
      return baseWhere;
    }

    const allowedUserIds =
      context.roleName === 'MANAGER'
        ? [context.userId, ...context.subordinateUserIds]
        : [context.userId];

    const orConditions: Prisma.TaskWhereInput[] = [
      { assignedToId: { in: allowedUserIds } },
      { createdById: { in: allowedUserIds } },
      { visibility: 'ORGANIZATION' },
    ];

    if (context.teamUserIds.length > 0) {
      orConditions.push({
        visibility: 'TEAM',
        OR: [
          { assignedToId: { in: context.teamUserIds } },
          { createdById: { in: context.teamUserIds } },
        ],
      });
    }

    return {
      ...baseWhere,
      OR: orConditions,
    };
  }

  /**
   * Builds record visibility WHERE clause for Meetings / Calendar.
   */
  getMeetingsVisibilityFilter(
    context: UserSecurityContext,
  ): Prisma.MeetingWhereInput {
    const baseWhere: Prisma.MeetingWhereInput = {
      tenantId: context.tenantId,
    };

    if (context.isSystemAdmin) {
      return baseWhere;
    }

    const allowedUserIds =
      context.roleName === 'MANAGER'
        ? [context.userId, ...context.subordinateUserIds]
        : [context.userId];

    const orConditions: Prisma.MeetingWhereInput[] = [
      { assignedToId: { in: allowedUserIds } },
      { ownerId: { in: allowedUserIds } },
      { visibility: 'ORGANIZATION' },
    ];

    if (context.teamUserIds.length > 0) {
      orConditions.push({
        visibility: 'TEAM',
        OR: [
          { assignedToId: { in: context.teamUserIds } },
          { ownerId: { in: context.teamUserIds } },
        ],
      });
    }

    return {
      ...baseWhere,
      OR: orConditions,
    };
  }

  /**
   * Builds record visibility WHERE clause for Quotations.
   */
  getQuotationsVisibilityFilter(
    context: UserSecurityContext,
  ): Prisma.QuotationWhereInput {
    const baseWhere: Prisma.QuotationWhereInput = {
      tenantId: context.tenantId,
      deletedAt: null,
    };

    if (context.isSystemAdmin) {
      return baseWhere;
    }

    if (context.roleName === 'MANAGER') {
      const allowedUserIds = [context.userId, ...context.subordinateUserIds];
      return {
        ...baseWhere,
        OR: [{ assignedToId: { in: allowedUserIds } }, { assignedToId: null }],
      };
    }

    // Employee scoping
    return {
      ...baseWhere,
      assignedToId: context.userId,
    };
  }

  /**
   * Log AI tool execution to AuditLog table.
   * AuditLog is a tenant-scoped table — wrapped in withTenantContext.
   */
  async logToolExecution(
    context: UserSecurityContext,
    toolName: string,
    status: 'ALLOWED' | 'DENIED' | 'ERROR',
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.withTenantContext(
        { tenantId: context.tenantId },
        async (tx) => {
          await tx.auditLog.create({
            data: {
              tenantId: context.tenantId,
              userId: context.userId,
              action: `AI_TOOL:${toolName}`,
              module: 'AI_CHAT',
              details: {
                toolName,
                status,
                role: context.roleName,
                ...details,
              },
            },
          });
        },
      );
    } catch (e: any) {
      this.logger.error(`Failed to record AI tool audit log: ${e.message}`);
    }
  }
}
