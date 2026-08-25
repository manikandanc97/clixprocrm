import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes, randomUUID, createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { invalidateTokenUserCache } from '../../auth/supabase.guard';
import { invalidateUserTenantCache } from '../../auth/tenant.guard';
import { invalidateGetMeCache } from '../../auth/auth.service';

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getEmployees(tenantId: string, page = 1, limit = 10) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      page = Math.max(1, page);
      limit = Math.max(1, Math.min(limit, 10000));
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        tx.user.findMany({
          where: { memberships: { some: { tenantId } } },
          include: {
            memberships: {
              where: { tenantId },
              select: { role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        tx.user.count({
          where: { memberships: { some: { tenantId } } },
        }),
      ]);

      const mappedUsers = users.map((u) => {
        const membership = u.memberships[0];
        return {
          id: u.id,
          name: u.name || 'Unknown User',
          email: u.email,
          phone: (u as any).phone,
          avatar: (u as any).avatar,
          status: u.status,
          role: membership?.role?.name || 'EMPLOYEE',
          roleId: (membership?.role as any)?.id || null,
          isOrgOwner: !!(membership as any)?.isOrgOwner,
          branchId: (membership as any)?.branchId || null,
          reportingManagerId: (membership as any)?.reportingManagerId || null,
          joinedAt: (membership as any)?.joinedAt || u.createdAt,
          createdAt: u.createdAt,
        };
      });

      return {
        employees: mappedUsers,
        stats: [
          { title: 'Total Employees', value: total.toString(), change: '0', positive: true },
          { title: 'Active Now', value: total.toString(), change: '0', positive: true },
          { title: 'Departments', value: '1', change: '0', positive: true },
          { title: 'On Leave', value: '0', change: '0', positive: true },
        ],
        activities: [],
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    });
  }

  async inviteEmployee(
    tenantId: string,
    email: string,
    roleName: string,
    name?: string,
    password?: string,
  ) {
    if (
      roleName.toUpperCase() === 'SUPER_ADMIN' ||
      roleName.toUpperCase() === 'SUPER ADMIN'
    ) {
      throw new HttpException(
        'SUPER_ADMIN is a platform-level role and cannot be created inside an organization.',
        HttpStatus.FORBIDDEN,
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existingTenantUser = await tx.tenantUser.findFirst({
        where: {
          tenantId,
          user: { email: normalizedEmail },
        },
      });

      if (existingTenantUser) {
        throw new HttpException(
          'User is already an employee in this workspace',
          HttpStatus.BAD_REQUEST,
        );
      }

      let roleObj = await tx.role.findFirst({
        where: { tenantId, name: roleName },
      });
      if (!roleObj) {
        roleObj = await tx.role.create({
          data: { name: roleName, tenantId, isSystem: false },
        });
      }

      const rawToken = randomBytes(32).toString('hex');
      const hashedToken = hashInvitationToken(rawToken);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      let authUserId: string = randomUUID();

      if (password) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>(
          'SUPABASE_SERVICE_ROLE_KEY',
        );

        if (!supabaseUrl || !serviceRoleKey) {
          throw new HttpException(
            'Employee creation requires SUPABASE_SERVICE_ROLE_KEY to be configured. Please add it to your .env file from Supabase Dashboard → Settings → API → service_role key.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        try {
          const supabase = createClient(supabaseUrl, serviceRoleKey);
          const { data, error } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: password,
            email_confirm: true,
          });

          if (error) {
            const isAlreadyExists =
              error.message.toLowerCase().includes('already') ||
              error.message.toLowerCase().includes('exists') ||
              (error as any).status === 422;

            if (isAlreadyExists) {
              // User already exists in Supabase auth — link them to this tenant without overwriting their password
              const { data: listData } = await supabase.auth.admin.listUsers({
                perPage: 1000,
              });
              const existingAuthUser = listData?.users?.find(
                (u: any) => u.email?.toLowerCase() === normalizedEmail,
              );
              if (existingAuthUser) {
                authUserId = existingAuthUser.id;
              } else {
                throw new HttpException(
                  `Could not locate existing Supabase user for email: ${normalizedEmail}`,
                  HttpStatus.INTERNAL_SERVER_ERROR,
                );
              }
            } else {
              throw new HttpException(
                `Failed to create auth user: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }
          } else if (data?.user?.id) {
            authUserId = data.user.id;
          }
        } catch (e: any) {
          if (e instanceof HttpException) throw e;
          throw new HttpException(
            `Supabase admin error: ${e.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      // Find or create DB user, ensuring their ID matches the Supabase auth UUID
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!user) {
        user = await tx.user.create({
          data: {
            id: authUserId,
            email: normalizedEmail,
            name: name || 'New Employee',
          },
        });
      } else {
        // If DB user ID doesn't match Supabase auth UUID, update it so login works
        const updateData: any = {};
        if (name) updateData.name = name;
        if (user.id !== authUserId) {
          // Update the user ID to match Supabase UUID
          user = await tx.user.update({
            where: { id: user.id },
            data: { id: authUserId, ...updateData },
          });
        } else {
          user = await tx.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
      }

      await tx.tenantUser.upsert({
        where: { tenantId_userId: { tenantId, userId: user.id } },
        update: { roleId: roleObj.id, status: 'ACTIVE' },
        create: {
          tenantId,
          userId: user.id,
          roleId: roleObj.id,
          status: 'ACTIVE',
        },
      });

      const invitation = await tx.invitation.upsert({
        where: { tenantId_email: { tenantId, email: normalizedEmail } },
        update: { roleId: roleObj.id, token: hashedToken, expiresAt, status: 'PENDING' },
        create: {
          tenantId,
          email: normalizedEmail,
          roleId: roleObj.id,
          token: hashedToken,
          expiresAt,
        },
      });

      return {
        id: user.id,
        name: user.name,
        email: invitation.email,
        role: roleName,
        status: 'ACTIVE',
        createdAt: invitation.createdAt.toISOString(),
        inviteToken: rawToken,
      };
    });
  }

  async updateEmployee(
    tenantId: string,
    userId: string,
    actorRole: string,
    data: { name?: string; email?: string; role?: string },
  ) {
    if (
      data.role &&
      (data.role.toUpperCase() === 'SUPER_ADMIN' ||
        data.role.toUpperCase() === 'SUPER ADMIN')
    ) {
      throw new HttpException(
        'SUPER_ADMIN is a platform-level role and cannot be assigned by an organization admin.',
        HttpStatus.FORBIDDEN,
      );
    }

    if (data.role === 'ADMIN' && actorRole !== 'ADMIN') {
      throw new HttpException(
        'Only ADMIN can assign the ADMIN role',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existingUser = await tx.tenantUser.findFirst({
        where: { userId, tenantId },
        include: { user: true, role: true },
      });

      if (!existingUser) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }

      if (existingUser.isOrgOwner && data.role !== undefined && data.role !== existingUser.role?.name) {
        throw new HttpException(
          'Cannot demote the active Organization Owner. Transfer ownership first.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (existingUser.role?.name === 'ADMIN' && actorRole !== 'ADMIN') {
        throw new HttpException(
          'Only an ADMIN can modify an ADMIN',
          HttpStatus.FORBIDDEN,
        );
      }

      const userData: Prisma.UserUpdateInput = {};
      if (data.name) userData.name = data.name;
      if (data.email) userData.email = data.email;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userData,
        });
      }

      if (data.role !== undefined && data.role !== existingUser.role.name) {
        if (existingUser.role.name === 'ADMIN') {
          const adminCount = await tx.tenantUser.count({
            where: { tenantId, role: { name: 'ADMIN' }, status: 'ACTIVE' },
          });
          if (adminCount <= 1) {
            throw new HttpException(
              'Cannot demote the last active ADMIN.',
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        let finalRoleId: string = data.role;
        const roleObj = await tx.role.findFirst({
          where: { tenantId, name: data.role },
        });
        if (roleObj) finalRoleId = roleObj.id;

        await tx.tenantUser.update({
          where: { id: existingUser.id },
          data: { roleId: finalRoleId },
        });
      }

      invalidateTokenUserCache(userId);
      invalidateUserTenantCache(userId);
      invalidateGetMeCache(userId);

      return { id: userId };
    });
  }

  async patchEmployeeStatus(
    tenantId: string,
    userId: string,
    actorRole: string,
    status: string,
  ) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const existingUser = await tx.tenantUser.findFirst({
        where: { userId, tenantId },
        include: { role: true },
      });

      if (!existingUser) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }

      if (existingUser.isOrgOwner && status === 'INACTIVE') {
        throw new HttpException(
          'Cannot deactivate the active Organization Owner. Transfer ownership first.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (existingUser.role.name === 'ADMIN' && actorRole !== 'ADMIN') {
        throw new HttpException(
          'Only an ADMIN can deactivate an ADMIN',
          HttpStatus.FORBIDDEN,
        );
      }

      if (existingUser.role.name === 'ADMIN' && status === 'INACTIVE') {
        const adminCount = await tx.tenantUser.count({
          where: { tenantId, role: { name: 'ADMIN' }, status: 'ACTIVE' },
        });
        if (adminCount <= 1) {
          throw new HttpException(
            'Cannot deactivate the last active ADMIN.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: { status: status as UserStatus },
      });

      await tx.tenantUser.updateMany({
        where: { userId, tenantId },
        data: { status: status as UserStatus },
      });

      invalidateTokenUserCache(userId);
      invalidateUserTenantCache(userId);
      invalidateGetMeCache(userId);

      return { id: userId };
    });
  }

  async deleteEmployee(tenantId: string, userId: string, actorRole: string) {
    return this.prisma.withTenantContext({ tenantId }, async (tx) => {
      const userRecord = await tx.user.findUnique({
        where: { id: userId },
        select: { isSuperAdmin: true },
      });

      if (userRecord?.isSuperAdmin) {
        throw new HttpException(
          'Cannot delete the Platform Super Admin from workspace employee management.',
          HttpStatus.FORBIDDEN,
        );
      }

      const existingUser = await tx.tenantUser.findFirst({
        where: { userId, tenantId },
        include: { role: true },
      });

      if (!existingUser) {
        throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      }

      if (existingUser.isOrgOwner) {
        throw new HttpException(
          'Cannot delete the active Organization Owner. Transfer ownership first.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (existingUser.role.name === 'ADMIN' && actorRole !== 'ADMIN') {
        throw new HttpException(
          'Only an ADMIN can delete an ADMIN',
          HttpStatus.FORBIDDEN,
        );
      }

      if (existingUser.role.name === 'ADMIN') {
        const adminCount = await tx.tenantUser.count({
          where: { tenantId, role: { name: 'ADMIN' }, status: 'ACTIVE' },
        });
        if (adminCount <= 1) {
          throw new HttpException(
            'Cannot delete the last active ADMIN.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const [leadsCount, dealsCount, tasksCount, customersCount] =
        await Promise.all([
          tx.lead.count({
            where: {
              OR: [{ createdById: userId }, { assignedToId: userId }],
              tenantId,
            },
          }),
          tx.deal.count({ where: { ownerId: userId, tenantId } }),
          tx.task.count({
            where: {
              OR: [{ createdById: userId }, { assignedToId: userId }],
              tenantId,
            },
          }),
          tx.customer.count({
            where: { assignedToId: userId, tenantId },
          }),
        ]);

      if (
        leadsCount > 0 ||
        dealsCount > 0 ||
        tasksCount > 0 ||
        customersCount > 0
      ) {
        throw new HttpException(
          'Cannot delete employee with historical CRM activity. Please DEACTIVATE the employee instead to preserve data.',
          HttpStatus.BAD_REQUEST,
        );
      }

      await tx.tenantUser.delete({
        where: { id: existingUser.id },
      });

      const remainingMemberships = await tx.tenantUser.count({
        where: { userId },
      });

      if (remainingMemberships === 0 && !userRecord?.isSuperAdmin) {
        await tx.user.delete({
          where: { id: userId },
        });
      }

      invalidateTokenUserCache(userId);
      invalidateUserTenantCache(userId);
      invalidateGetMeCache(userId);

      return { id: userId };
    });
  }

}
