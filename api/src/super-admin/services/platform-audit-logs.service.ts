import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformAuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAuditLogs(query: {
    tenantId?: string;
    action?: string;
    module?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(query.limit || 20, 1000));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.module) {
      where.module = { contains: query.module, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { module: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          targetUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Fetch tenant names for logs that have a tenantId
    const tenantIds = Array.from(
      new Set(logs.map((l) => l.tenantId).filter(Boolean)),
    ) as string[];
    const tenants = await this.prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, slug: true },
    });
    const tenantMap = new Map(tenants.map((t) => [t.id, t]));

    return {
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        module: l.module || 'System',
        tenantId: l.tenantId,
        organizationName: l.tenantId
          ? tenantMap.get(l.tenantId)?.name || 'Unknown Org'
          : 'Platform',
        actor: l.user ? l.user.name || l.user.email : 'System',
        actorEmail: l.user?.email || null,
        targetUser: l.targetUser
          ? l.targetUser.name || l.targetUser.email
          : null,
        details: l.details,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
