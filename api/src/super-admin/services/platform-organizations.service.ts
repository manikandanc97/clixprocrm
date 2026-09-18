import {
    Injectable,
    NotFoundException
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SYSTEM_ROLE_PERMISSIONS } from '../../common/role-permissions.constants';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformOrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrganizations(query: {
    search?: string;
    status?: 'ACTIVE' | 'SUSPENDED';
    plan?: string;
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
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.plan) {
      where.plan = query.plan;
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              leads: true,
              customers: true,
              deals: true,
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      organizations: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        status: t.status,
        currency: t.currency,
        timezone: t.timezone,
        userCount: t._count.users,
        leadCount: t._count.leads,
        customerCount: t._count.customers,
        dealCount: t._count.deals,
        taskCount: t._count.tasks,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganizationDetails(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
              },
            },
            role: {
              select: { id: true, name: true, priority: true },
            },
          },
        },
        _count: {
          select: {
            leads: true,
            customers: true,
            deals: true,
            tasks: true,
            invoices: true,
            quotations: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      status: tenant.status,
      taxId: tenant.taxId,
      address: tenant.address,
      currency: tenant.currency,
      timezone: tenant.timezone,
      logo: tenant.logo,
      counts: tenant._count,
      members: tenant.users.map((m) => ({
        membershipId: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        status: m.status,
        role: m.role?.name || 'EMPLOYEE',
        joinedAt: m.joinedAt.toISOString(),
      })),
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }

  async createOrganization(
    data: {
      name: string;
      slug?: string;
      plan?: string;
      currency?: string;
      timezone?: string;
    },
    adminActorId: string,
  ) {
    let slug = data.slug
      ? data.slug.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`;
    }

    return this.prisma.withTenantContext({ isSuperAdmin: true }, async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug,
          plan: data.plan || 'free',
          currency: data.currency || 'INR',
          timezone: data.timezone || 'utc',
          status: 'ACTIVE',
        },
      });

      // Seed default ADMIN system role
      const adminRole = await tx.role.create({
        data: {
          name: 'ADMIN',
          tenantId: tenant.id,
          isSystem: true,
          priority: 100,
        },
      });

      const moduleList = SYSTEM_ROLE_PERMISSIONS['ADMIN'] || [];
      if (moduleList.length > 0) {
        await tx.rolePermission.createMany({
          data: moduleList.map((module: string) => ({
            roleId: adminRole.id,
            module,
            hasAccess: true,
          })),
        });
      }

      // Record platform audit log
      await tx.auditLog.create({
        data: {
          userId: adminActorId,
          tenantId: tenant.id,
          action: 'ORGANIZATION_CREATED',
          module: 'SuperAdmin',
          details: { name: tenant.name, plan: tenant.plan, slug: tenant.slug },
        },
      });

      return tenant;
    });
  }

  async updateOrganization(
    id: string,
    data: {
      name?: string;
      plan?: string;
      status?: 'ACTIVE' | 'SUSPENDED';
      currency?: string;
      timezone?: string;
      taxId?: string;
      address?: string;
    },
    adminActorId: string,
  ) {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.plan && { plan: data.plan }),
        ...(data.status && { status: data.status }),
        ...(data.currency && { currency: data.currency }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.taxId !== undefined && { taxId: data.taxId }),
        ...(data.address !== undefined && { address: data.address }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminActorId,
        tenantId: id,
        action: 'ORGANIZATION_UPDATED',
        module: 'SuperAdmin',
        details: { previous: existing, updated: data },
      },
    });

    return updated;
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED',
    adminActorId: string,
    reason?: string,
  ) {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminActorId,
        tenantId: id,
        action:
          status === 'ACTIVE'
            ? 'ORGANIZATION_ACTIVATED'
            : 'ORGANIZATION_SUSPENDED',
        module: 'SuperAdmin',
        details: { previousStatus: existing.status, newStatus: status, reason },
      },
    });

    return updated;
  }

  async deleteOrganization(id: string, adminActorId: string) {
    const existing = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.withTenantContext(
      { isSuperAdmin: true, timeout: 60000 },
      async (tx) => {
        // 1. Cascade cleanup of all tenant-scoped data
        // Clear self-referential relations first to prevent foreign key errors
        await tx.tenantUser.updateMany({
          where: { tenantId: id },
          data: { reportingManagerId: null },
        });

        await tx.aiMessage.deleteMany({
          where: { conversation: { tenantId: id } },
        });
        await tx.aiConversation.deleteMany({
          where: { tenantId: id },
        });
        await tx.tenantAiConfig.deleteMany({
          where: { tenantId: id },
        });
        await tx.documentChunk.deleteMany({
          where: { document: { tenantId: id } },
        });
        await tx.document.deleteMany({
          where: { tenantId: id },
        });
        await tx.timelineEvent.deleteMany({
          where: { tenantId: id },
        });
        await tx.note.deleteMany({
          where: { tenantId: id },
        });
        await tx.attachment.deleteMany({
          where: { tenantId: id },
        });
        await tx.invoice.deleteMany({
          where: { tenantId: id },
        });
        await tx.quotation.deleteMany({
          where: { tenantId: id },
        });
        await tx.task.deleteMany({
          where: { tenantId: id },
        });
        await tx.meeting.deleteMany({
          where: { tenantId: id },
        });
        await tx.deal.deleteMany({
          where: { tenantId: id },
        });
        await tx.customer.deleteMany({
          where: { tenantId: id },
        });
        await tx.lead.deleteMany({
          where: { tenantId: id },
        });
        await tx.company.deleteMany({
          where: { tenantId: id },
        });
        await tx.product.deleteMany({
          where: { tenantId: id },
        });
        await tx.revenueTarget.deleteMany({
          where: { tenantId: id },
        });
        await tx.notification.deleteMany({
          where: { tenantId: id },
        });
        await tx.invitation.deleteMany({
          where: { tenantId: id },
        });
        await tx.tenantUser.deleteMany({
          where: { tenantId: id },
        });
        await tx.rolePermission.deleteMany({
          where: { role: { tenantId: id } },
        });
        await tx.role.deleteMany({
          where: { tenantId: id },
        });
        await tx.department.deleteMany({
          where: { tenantId: id },
        });
        await tx.invoiceCounter.deleteMany({
          where: { tenantId: id },
        });

        // 3. Delete the tenant
        const deletedTenant = await tx.tenant.delete({
          where: { id },
        });

        // 4. Log the deletion in super-admin audit trail
        await tx.auditLog.create({
          data: {
            userId: adminActorId,
            action: 'ORGANIZATION_DELETED',
            module: 'SuperAdmin',
            details: {
              id: existing.id,
              name: existing.name,
              slug: existing.slug,
            },
          },
        });

        return deletedTenant;
      },
    );
  }
}
