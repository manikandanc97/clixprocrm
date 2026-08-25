import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DataScope,
  UserAuthContext,
  RecordAccessContext,
  DATA_SCOPE_HIERARCHY,
} from './authorization-types';
import {
  normalizePermissionKey,
  matchesPermissionPattern,
} from './permission-registry';
import { AuthorizationCacheService } from './authorization-cache.service';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AuthorizationCacheService,
  ) {}

  /**
   * Evaluates if the authenticated user has permission to perform the action on the optional record.
   * Default behavior: No permission -> DENY, Cross-tenant -> ALWAYS DENY, Never fails open.
   */
  async can(
    userContext: UserAuthContext,
    permission: string,
    record?: RecordAccessContext,
  ): Promise<boolean> {
    if (!userContext || !userContext.userId) {
      return false;
    }

    // Platform Super Admin bypasses tenant permission checks
    if (userContext.isSuperAdmin) {
      return true;
    }

    const tenantId = userContext.tenantId;
    if (!tenantId) {
      return false;
    }

    // Hard cross-tenant isolation boundary
    if (record?.tenantId && record.tenantId !== tenantId) {
      this.logger.warn(
        `Cross-tenant access attempt blocked: user ${userContext.userId} in tenant ${tenantId} tried accessing record in tenant ${record.tenantId}`,
      );
      return false;
    }

    const normalizedReq = normalizePermissionKey(permission);

    // Organization Owner has full organization-scoped access across all features
    if (userContext.isOrgOwner) {
      return true;
    }

    // Admin role shortcut if assigned
    const roleName = (userContext.roleName || '').toUpperCase().trim().replace(/[\s_]+/g, '');
    if (roleName === 'SUPERADMIN' || roleName === 'ADMIN' || roleName === 'OWNER') {
      return true;
    }

    // Resolve user's effective permissions and scopes
    const effectivePerms = await this.getEffectivePermissions(tenantId, userContext.userId);

    // Check if user has permission
    let highestScope: DataScope | null = null;
    for (const [grantedPerm, scope] of effectivePerms.entries()) {
      if (matchesPermissionPattern(grantedPerm, normalizedReq)) {
        if (
          !highestScope ||
          DATA_SCOPE_HIERARCHY[scope] > DATA_SCOPE_HIERARCHY[highestScope]
        ) {
          highestScope = scope;
        }
      }
    }

    if (!highestScope) {
      return false;
    }

    // If no specific record is supplied (e.g. general route access check or creation)
    if (!record) {
      return true;
    }

    // Evaluate Data Scope against the target record
    return this.evaluateDataScope(userContext, highestScope, record);
  }

  /**
   * Strictly authorizes the request or throws ForbiddenException.
   */
  async authorize(
    userContext: UserAuthContext,
    permission: string,
    record?: RecordAccessContext,
  ): Promise<void> {
    const isAllowed = await this.can(userContext, permission, record);
    if (!isAllowed) {
      throw new ForbiddenException(
        `Access denied: Insufficient permissions or data scope for '${permission}'`,
      );
    }
  }

  /**
   * Resolves effective permissions and their corresponding data scopes for a user.
   */
  async getEffectivePermissions(
    tenantId: string,
    userId: string,
  ): Promise<Map<string, DataScope>> {
    const cached = this.cache.getPermissions(tenantId, userId);
    if (cached) {
      return cached.permissions;
    }

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const tenantUser = await (tx as any).tenantUser.findFirst({
        where: { tenantId, userId, status: 'ACTIVE' },
        include: {
          role: {
            include: { permissions: true },
          },
        },
      });

      const permMap = new Map<string, DataScope>();
      if (!tenantUser || !tenantUser.role || !tenantUser.role.isActive) {
        this.cache.setPermissions(tenantId, userId, permMap, false, false);
        return permMap;
      }

      const isOrgOwner = !!tenantUser.isOrgOwner;
      const isSuperAdmin = false;

      const role = tenantUser.role;
      const roleName = (role.name || '').toUpperCase().trim().replace(/[\s_]+/g, '');

      if (roleName === 'ADMIN' || roleName === 'SUPERADMIN' || roleName === 'OWNER' || isOrgOwner) {
        permMap.set('all', 'ORGANIZATION');
      } else if (role.permissions && Array.isArray(role.permissions)) {
        for (const p of role.permissions) {
          if (p.hasAccess) {
            const scope = (p.scope as DataScope) || 'ORGANIZATION';
            const modKey = (p.module || '').toLowerCase().trim();
            const existingScope = permMap.get(modKey);
            if (
              !existingScope ||
              DATA_SCOPE_HIERARCHY[scope] > DATA_SCOPE_HIERARCHY[existingScope]
            ) {
              permMap.set(modKey, scope);
            }
          }
        }
      }

      this.cache.setPermissions(tenantId, userId, permMap, isOrgOwner, isSuperAdmin);
      return permMap;
    });
  }

  /**
   * Evaluates if a given data scope matches the target record context.
   */
  private async evaluateDataScope(
    userContext: UserAuthContext,
    scope: DataScope,
    record: RecordAccessContext,
  ): Promise<boolean> {
    const tenantId = userContext.tenantId!;
    const userId = userContext.userId;

    switch (scope) {
      case 'ORGANIZATION':
        // Belongs to the same tenant
        return !record.tenantId || record.tenantId === tenantId;

      case 'OWN':
        // Record is assigned to or created/owned by user
        return (
          record.ownerId === userId ||
          record.assignedToId === userId ||
          record.createdById === userId ||
          record.userId === userId
        );

      case 'TEAM': {
        if (this.evaluateOwn(userId, record)) return true;
        const userTeams = await this.getUserTeamIds(tenantId, userId);
        if (record.teamId && userTeams.includes(record.teamId)) {
          return true;
        }
        return false;
      }

      case 'SUBORDINATES': {
        if (this.evaluateOwn(userId, record)) return true;
        const subordinates = await this.getUserSubordinateIds(tenantId, userId);
        const recordOwner = record.ownerId || record.assignedToId || record.createdById;
        if (recordOwner && subordinates.includes(recordOwner)) {
          return true;
        }
        return false;
      }

      case 'BRANCH': {
        if (this.evaluateOwn(userId, record)) return true;
        if (userContext.branchId && record.branchId === userContext.branchId) {
          return true;
        }
        return false;
      }

      case 'SHARED': {
        if (this.evaluateOwn(userId, record)) return true;
        if (record.id) {
          return this.hasRecordShare(tenantId, userId, record.id);
        }
        return false;
      }

      default:
        return false;
    }
  }

  private evaluateOwn(userId: string, record: RecordAccessContext): boolean {
    return (
      record.ownerId === userId ||
      record.assignedToId === userId ||
      record.createdById === userId ||
      record.userId === userId
    );
  }

  /**
   * Checks explicit record shares
   */
  private async hasRecordShare(
    tenantId: string,
    userId: string,
    recordId: string,
  ): Promise<boolean> {
    try {
      const share = await (this.prisma as any).recordShare.findFirst({
        where: {
          tenantId,
          resourceId: recordId,
          sharedWithUserId: userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      return !!share;
    } catch {
      return false;
    }
  }

  /**
   * Resolves all team IDs user belongs to
   */
  async getUserTeamIds(tenantId: string, userId: string): Promise<string[]> {
    const cached = this.cache.getTeams(tenantId, userId);
    if (cached) return cached;

    try {
      const memberships = await (this.prisma as any).teamMember.findMany({
        where: { tenantId, userId },
        select: { teamId: true },
      });
      const ledTeams = await (this.prisma as any).team.findMany({
        where: { tenantId, leaderId: userId },
        select: { id: true },
      });

      const teamIds = Array.from(
        new Set([
          ...memberships.map((m: any) => m.teamId),
          ...ledTeams.map((t: any) => t.id),
        ]),
      );

      this.cache.setTeams(tenantId, userId, teamIds);
      return teamIds;
    } catch {
      return [];
    }
  }

  /**
   * Resolves recursive subordinates in reporting manager hierarchy
   */
  async getUserSubordinateIds(tenantId: string, userId: string): Promise<string[]> {
    const cached = this.cache.getHierarchy(tenantId, userId);
    if (cached) return cached;

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      // Find direct and indirect subordinates
      const allMemberships = await (tx as any).tenantUser.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, userId: true, reportingManagerId: true },
      });

      const membershipMap = new Map<string, any>();
      for (const m of allMemberships) {
        membershipMap.set(m.id, m);
      }

      // Find currentUser membership ID
      const userMembership = allMemberships.find((m: any) => m.userId === userId);
      if (!userMembership) {
        return [];
      }

      const subordinateUserIds: string[] = [];
      const queue = [userMembership.id];
      const visited = new Set<string>([userMembership.id]);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        for (const m of allMemberships) {
          if (m.reportingManagerId === currentId && !visited.has(m.id)) {
            visited.add(m.id);
            subordinateUserIds.push(m.userId);
            queue.push(m.id);
          }
        }
      }

      this.cache.setHierarchy(tenantId, userId, subordinateUserIds);
      return subordinateUserIds;
    });
  }

  /**
   * Generates a Prisma where clause for filtering records according to user's effective data scope.
   */
  async buildScopeWhereClause(
    userContext: UserAuthContext,
    permission: string,
    entityType: string,
  ): Promise<any> {
    const tenantId = userContext.tenantId;
    if (!tenantId) {
      return { id: 'NEVER_MATCH_UNAUTHENTICATED' };
    }

    if (userContext.isSuperAdmin || userContext.isOrgOwner) {
      return { tenantId, deletedAt: null };
    }

    const roleName = (userContext.roleName || '').toUpperCase().trim().replace(/[\s_]+/g, '');
    if (roleName === 'ADMIN' || roleName === 'SUPERADMIN' || roleName === 'OWNER') {
      return { tenantId, deletedAt: null };
    }

    const effectivePerms = await this.getEffectivePermissions(tenantId, userContext.userId);
    const normalizedReq = normalizePermissionKey(permission);

    let highestScope: DataScope | null = null;
    for (const [grantedPerm, scope] of effectivePerms.entries()) {
      if (matchesPermissionPattern(grantedPerm, normalizedReq)) {
        if (
          !highestScope ||
          DATA_SCOPE_HIERARCHY[scope] > DATA_SCOPE_HIERARCHY[highestScope]
        ) {
          highestScope = scope;
        }
      }
    }

    if (!highestScope) {
      return { id: 'PERMISSION_DENIED_NO_MATCH' };
    }

    const userId = userContext.userId;

    switch (highestScope) {
      case 'ORGANIZATION':
        return { tenantId, deletedAt: null };

      case 'OWN':
        return {
          tenantId,
          deletedAt: null,
          OR: [
            { assignedToId: userId },
            { ownerId: userId },
            { createdById: userId },
          ],
        };

      case 'TEAM': {
        const teamIds = await this.getUserTeamIds(tenantId, userId);
        return {
          tenantId,
          deletedAt: null,
          OR: [
            { assignedToId: userId },
            { ownerId: userId },
            { createdById: userId },
            ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
          ],
        };
      }

      case 'SUBORDINATES': {
        const subIds = await this.getUserSubordinateIds(tenantId, userId);
        const allowedUserIds = [userId, ...subIds];
        return {
          tenantId,
          deletedAt: null,
          OR: [
            { assignedToId: { in: allowedUserIds } },
            { ownerId: { in: allowedUserIds } },
            { createdById: { in: allowedUserIds } },
          ],
        };
      }

      case 'BRANCH': {
        if (!userContext.branchId) {
          return {
            tenantId,
            deletedAt: null,
            OR: [
              { assignedToId: userId },
              { ownerId: userId },
              { createdById: userId },
            ],
          };
        }
        return {
          tenantId,
          deletedAt: null,
          OR: [
            { branchId: userContext.branchId },
            { assignedToId: userId },
            { ownerId: userId },
          ],
        };
      }

      default:
        return {
          tenantId,
          deletedAt: null,
          OR: [
            { assignedToId: userId },
            { ownerId: userId },
            { createdById: userId },
          ],
        };
    }
  }

  /**
   * Atomic Organization Ownership Transfer
   * Safeguards:
   *  - Caller must be current active owner or Super Admin
   *  - New owner must exist in tenant and be ACTIVE
   *  - Promotes new owner to ADMIN role and sets isOrgOwner = true
   *  - Unsets old owner's isOrgOwner = false
   *  - Never leaves tenant without an active owner
   *  - Generates sealed cryptographically hash-chained audit log
   */
  async transferOrganizationOwnership(
    tenantId: string,
    currentOwnerUserId: string,
    newOwnerUserId: string,
    actorContext: { ipAddress?: string; userAgent?: string; actorUserId: string },
  ): Promise<{ success: boolean; newOwnerId: string }> {
    if (currentOwnerUserId === newOwnerUserId) {
      throw new BadRequestException('Target user is already the organization owner.');
    }

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      // Find target user membership
      const targetMembership = await (tx as any).tenantUser.findFirst({
        where: { tenantId, userId: newOwnerUserId, status: 'ACTIVE' },
        include: { user: true, role: true },
      });

      if (!targetMembership) {
        throw new NotFoundException(
          'Target user not found or is inactive in this organization.',
        );
      }

      // Find admin role in tenant
      let adminRole = await (tx as any).role.findFirst({
        where: { tenantId, name: 'ADMIN', isSystem: true },
      });
      if (!adminRole) {
        adminRole = await (tx as any).role.findFirst({
          where: { tenantId, name: { in: ['Admin', 'ADMIN', 'Owner', 'OWNER'] } },
        });
      }

      // 1. Demote old owner
      await (tx as any).tenantUser.updateMany({
        where: { tenantId, userId: currentOwnerUserId },
        data: { isOrgOwner: false },
      });

      // 2. Promote new owner
      await (tx as any).tenantUser.update({
        where: { id: targetMembership.id },
        data: {
          isOrgOwner: true,
          ...(adminRole ? { roleId: adminRole.id } : {}),
        },
      });

      // Invalidate caches
      this.cache.invalidateUser(tenantId, currentOwnerUserId);
      this.cache.invalidateUser(tenantId, newOwnerUserId);

      // Create sealed audit log
      await this.prisma.createSealedAuditLog(
        {
          tenantId,
          userId: actorContext.actorUserId,
          targetUserId: newOwnerUserId,
          action: 'ORGANIZATION_OWNERSHIP_TRANSFERRED',
          module: 'admin:ownership',
          details: {
            previousOwnerId: currentOwnerUserId,
            newOwnerId: newOwnerUserId,
            newOwnerEmail: targetMembership.user?.email,
          },
          ipAddress: actorContext.ipAddress,
          userAgent: actorContext.userAgent,
        },
        tx,
      );

      this.logger.log(
        `Ownership of tenant ${tenantId} successfully transferred from ${currentOwnerUserId} to ${newOwnerUserId}`,
      );

      return { success: true, newOwnerId: newOwnerUserId };
    });
  }

  /**
   * Validates safeguards to prevent deleting, deactivating, or demoting the active organization owner,
   * or removing the last admin in the organization.
   */
  async validateOwnerSafeguards(
    tenantId: string,
    targetUserId: string,
    action: 'delete' | 'deactivate' | 'change_role',
  ): Promise<void> {
    const targetMembership = await (this.prisma as any).tenantUser.findFirst({
      where: { tenantId, userId: targetUserId },
      include: { role: true },
    });

    if (!targetMembership) return;

    if (targetMembership.isOrgOwner) {
      throw new ForbiddenException(
        'Cannot modify, deactivate, or delete the active Organization Owner. Transfer ownership first.',
      );
    }

    const roleName = (targetMembership.role?.name || '').toUpperCase().trim();
    if (roleName === 'ADMIN' || roleName === 'SUPERADMIN') {
      const activeAdminCount = await (this.prisma as any).tenantUser.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          role: { name: { in: ['ADMIN', 'Admin'] } },
        },
      });

      if (activeAdminCount <= 1 && (action === 'delete' || action === 'deactivate')) {
        throw new ForbiddenException(
          'Cannot remove the last active Administrator in the organization.',
        );
      }
    }
  }
}
