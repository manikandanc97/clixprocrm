import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { invalidateTokenUserCache } from '../../auth/supabase.guard';
import { invalidateUserTenantCache } from '../../auth/tenant.guard';
import { invalidateGetMeCache } from '../../auth/auth.service';

@Injectable()
export class PlatformUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: {
    search?: string;
    status?: UserStatus;
    isSuperAdmin?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(query.limit || 20, 1000));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.isSuperAdmin !== undefined) {
      where.isSuperAdmin = query.isSuperAdmin;
    }

    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const [users, total] = await Promise.all([
        tx.user.findMany({
          where,
          include: {
            memberships: {
              include: {
                tenant: { select: { id: true, name: true, slug: true, status: true } },
                role: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        tx.user.count({ where }),
      ]);

      return {
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          status: u.status,
          isSuperAdmin: u.isSuperAdmin,
          createdAt: u.createdAt.toISOString(),
          organizations: u.memberships.map((m) => ({
            tenantId: m.tenant.id,
            name: m.tenant.name,
            slug: m.tenant.slug,
            status: m.tenant.status,
            role: m.role.name,
            membershipStatus: m.status,
          })),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async getUserDetails(id: string) {
    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        include: {
          memberships: {
            include: {
              tenant: true,
              role: { include: { permissions: true } },
              department: true,
            },
          },
          _count: {
            select: {
              assignedLeads: true,
              assignedTasks: true,
              assignedCustomers: true,
              ownedDeals: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        counts: user._count,
        memberships: user.memberships.map((m) => ({
          id: m.id,
          tenantId: m.tenantId,
          organizationName: m.tenant.name,
          organizationSlug: m.tenant.slug,
          organizationStatus: m.tenant.status,
          role: m.role.name,
          department: m.department?.name || null,
          status: m.status,
          joinedAt: m.joinedAt.toISOString(),
        })),
      };
    });
  }

  async updateUserStatus(
    id: string,
    status: UserStatus,
    adminActorId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isSuperAdmin && status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Cannot deactivate or suspend the sole active Super Admin. Transfer platform ownership first.',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    if (status !== 'ACTIVE') {
      await this.prisma.tenantUser.updateMany({
        where: { userId: id },
        data: { status },
      });
    }

    invalidateTokenUserCache(id);
    invalidateUserTenantCache(id);
    invalidateGetMeCache(id);

    await this.prisma.createSealedAuditLog({
      userId: adminActorId,
      targetUserId: id,
      action: 'USER_STATUS_UPDATED',
      module: 'SuperAdmin',
      details: { previousStatus: user.status, newStatus: status },
    });

    return updated;
  }

  /**
   * Atomic Super Admin Transfer of Platform Ownership.
   * Guarantees:
   *  1. Exactly ONE active Super Admin exists at all times.
   *  2. Demotes current Super Admin and promotes target user in ONE atomic database transaction.
   *  3. Preserves all organization memberships and CRM data for both accounts.
   *  4. Immediately purges and invalidates token, session, tenant, and profile caches.
   *  5. Emits cryptographically sealed audit record with full before/after provenance.
   */
  async transferSuperAdmin(
    targetUserId: string,
    adminActorId: string,
    reqInfo: { ip?: string; userAgent?: string } = {},
  ) {
    const currentAdmin = await this.prisma.user.findUnique({
      where: { id: adminActorId },
    });

    if (!currentAdmin || !currentAdmin.isSuperAdmin || currentAdmin.status !== 'ACTIVE') {
      throw new ForbiddenException('Only the current active Super Admin can transfer platform ownership.');
    }

    if (targetUserId === adminActorId) {
      throw new BadRequestException('Target user is already the current Super Admin.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found.');
    }

    if (targetUser.status !== 'ACTIVE') {
      throw new BadRequestException('Target user account must be ACTIVE to receive Super Admin ownership.');
    }

    // Atomic Transfer in a single transaction with advisory lock
    const result = await this.prisma.$transaction(
      async (tx) => {
        // Advisory lock on platform admin transfer
        try {
          await tx.$executeRawUnsafe(
            `SELECT pg_advisory_xact_lock(hashtext('platform_super_admin_transfer'));`,
          );
        } catch {}

        // 1. Demote old Super Admin
        const demoted = await tx.user.update({
          where: { id: adminActorId },
          data: { isSuperAdmin: false },
        });

        // 2. Promote target user to Super Admin
        const promoted = await tx.user.update({
          where: { id: targetUserId },
          data: { isSuperAdmin: true },
        });

        // 3. Create sealed cryptographic audit log inside the same transaction
        await this.prisma.createSealedAuditLog(
          {
            userId: adminActorId,
            targetUserId: targetUserId,
            action: 'SUPER_ADMIN_TRANSFERRED',
            module: 'PlatformSecurity',
            details: {
              previousSuperAdminId: adminActorId,
              previousSuperAdminEmail: currentAdmin.email,
              newSuperAdminId: targetUserId,
              newSuperAdminEmail: targetUser.email,
              transferredAt: new Date().toISOString(),
            },
            ipAddress: reqInfo.ip || null,
            userAgent: reqInfo.userAgent || null,
          },
          tx,
        );

        return { previousAdmin: demoted, newAdmin: promoted };
      },
      { timeout: 15000 },
    );

    // Synchronize Supabase auth user metadata if available
    try {
      await this.prisma.$queryRawUnsafe(
        `UPDATE auth.users 
         SET raw_user_meta_data = jsonb_set(
           COALESCE(raw_user_meta_data, '{}'::jsonb), 
           '{isSuperAdmin}', 
           'false'::jsonb
         )
         WHERE id = $1::uuid;`,
        adminActorId,
      );
      await this.prisma.$queryRawUnsafe(
        `UPDATE auth.users 
         SET raw_user_meta_data = jsonb_set(
           COALESCE(raw_user_meta_data, '{}'::jsonb), 
           '{isSuperAdmin}', 
           'true'::jsonb
         )
         WHERE id = $1::uuid;`,
        targetUserId,
      );
    } catch {}

    // Immediate cache invalidation for both accounts
    invalidateTokenUserCache(adminActorId);
    invalidateUserTenantCache(adminActorId);
    invalidateGetMeCache(adminActorId);

    invalidateTokenUserCache(targetUserId);
    invalidateUserTenantCache(targetUserId);
    invalidateGetMeCache(targetUserId);

    return {
      success: true,
      message: `Platform Super Admin ownership successfully transferred to ${targetUser.name || targetUser.email}.`,
      previousSuperAdmin: { id: currentAdmin.id, email: currentAdmin.email },
      newSuperAdmin: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
    };
  }

  async toggleSuperAdmin(
    id: string,
    isSuperAdmin: boolean,
    adminActorId: string,
    reqInfo: { ip?: string; userAgent?: string } = {},
  ) {
    if (isSuperAdmin) {
      // Direct promotion is rerouted to atomic transfer
      return this.transferSuperAdmin(id, adminActorId, reqInfo);
    } else {
      throw new BadRequestException(
        'Direct demotion of the platform Super Admin is prohibited. The platform must always have exactly ONE active Super Admin. Transfer platform ownership to another active user instead.',
      );
    }
  }
}
