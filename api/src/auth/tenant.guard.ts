import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Optional,
    UnauthorizedException,
} from '@nestjs/common';
import { TenantContextService } from '../common/context/tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';

interface CachedUserRecord {
  userRecord: any;
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

    // Check in-memory user membership cache (60s TTL) to prevent DB connection pool exhaustion under concurrency
    let userRecord: any = null;
    const cached = userMembershipCache.get(user.id);
    if (cached && cached.expiresAt > now) {
      userRecord = (cached as any).userRecord || cached;
    } else {
      userRecord = await this.prisma.withTenantContext(
        { userId: user.id },
        async (tx) => {
          return tx.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              status: true,
              isSuperAdmin: true,
              memberships: {
                where: { status: 'ACTIVE' },
                select: {
                  tenantId: true,
                  isOrgOwner: true,
                  branchId: true,
                  status: true,
                  role: {
                    include: {
                      permissions: true,
                    },
                  },
                  tenant: {
                    select: {
                      id: true,
                      name: true,
                      status: true,
                    },
                  },
                },
              },
            },
          });
        },
      );

      if (userRecord) {
        userMembershipCache.set(user.id, {
          userRecord,
          expiresAt: now + 60000,
        });
      }
    }

    if (!userRecord) {
      throw new UnauthorizedException('User account not found');
    }

    if (userRecord.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'User account is deactivated or suspended',
      );
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
      ? userRecord.memberships.find((m: any) => m.tenantId === tenantId) ||
        userRecord.memberships[0]
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
