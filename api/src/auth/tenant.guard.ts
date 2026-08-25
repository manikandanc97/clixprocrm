import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/context/tenant-context.service';

interface CachedUserRecord {
  memberships: Array<{
    tenantId: string;
    role: any;
  }>;
  expiresAt: number;
}

const userMembershipCache = new Map<string, CachedUserRecord>();

// Periodically clean expired user memberships
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userMembershipCache.entries()) {
    if (val.expiresAt <= now) {
      userMembershipCache.delete(key);
    }
  }
}, 60000).unref?.();

/**
 * Invalidate cached membership for a user when roles/status change
 */
export function invalidateUserTenantCache(userId?: string) {
  if (userId) {
    userMembershipCache.delete(userId);
  } else {
    userMembershipCache.clear();
  }
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    @Optional() private tenantContext?: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const now = Date.now();

    // Check user and resolve tenant memberships in a user-isolated context
    const userRecord = await this.prisma.withTenantContext(
      { userId: user.id },
      async (tx) => {
        return tx.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: {
                role: { include: { permissions: true } },
                tenant: true,
              },
            },
          },
        });
      },
    );

    if (!userRecord) {
      throw new UnauthorizedException('User account not found');
    }

    if (userRecord.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is deactivated or suspended');
    }

    if (userRecord.isSuperAdmin) {
      // Super Admin operating on a tenant route
      let effectiveTenantId = tenantId;
      if (!effectiveTenantId && userRecord.memberships.length > 0) {
        effectiveTenantId = userRecord.memberships[0].tenantId;
      }
      if (!effectiveTenantId) {
        // Find any active tenant or first tenant for fallback
        const firstTenant = await this.prisma.tenant.findFirst({
          select: { id: true },
        });
        effectiveTenantId = firstTenant?.id;
      }

      request.tenantId = effectiveTenantId;
      request.userRole = {
        name: 'SUPER_ADMIN',
        permissions: [{ module: 'ALL', hasAccess: true }],
        isActive: true,
      };
      request.isSuperAdmin = true;

      this.tenantContext?.setContext({
        userId: user.id,
        tenantId: effectiveTenantId,
        isSuperAdmin: true,
        userRole: request.userRole,
      });

      return true;
    }

    if (!userRecord.memberships || userRecord.memberships.length === 0) {
      throw new UnauthorizedException('User has no active tenant memberships');
    }

    const membership = tenantId
      ? userRecord.memberships.find((m: any) => m.tenantId === tenantId) || userRecord.memberships[0]
      : userRecord.memberships[0];

    if (!membership) {
      throw new UnauthorizedException('Invalid tenant');
    }

    if (membership.tenant?.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Your organization account is suspended. Please contact platform support.',
      );
    }

    request.tenantId = membership.tenantId;
    request.userRole = membership.role;
    request.isSuperAdmin = false;
    request.isOrgOwner = !!membership.isOrgOwner;
    request.branchId = membership.branchId || null;

    this.tenantContext?.setContext({
      userId: user.id,
      tenantId: membership.tenantId,
      isSuperAdmin: false,
      isOrgOwner: !!membership.isOrgOwner,
      branchId: membership.branchId || null,
      userRole: membership.role,
    });

    return true;
  }
}


