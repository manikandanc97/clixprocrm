import { tool } from 'ai';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { AiSecurityService, UserSecurityContext } from '../ai-security.service';
import { CANONICAL_PLANS } from '../../common/plans/plan-definitions.constant';

/**
 * @file ai/tools/platform.tools.ts
 * AI tool implementations for Platform Superadmin operations.
 * Enforces Superadmin security checks before any cross-tenant platform queries.
 */
export function buildPlatformTools(
  prisma: PrismaService,
  aiSecurityService: AiSecurityService,
  userContext: UserSecurityContext,
) {
  // Guard: Only Superadmin / System Admin can access platform-level tools
  const isSuperAdminUser =
    userContext.roleName === 'SUPER_ADMIN' ||
    userContext.roleName.replace(/[\s_]+/g, '') === 'SUPERADMIN' ||
    userContext.isSystemAdmin;

  if (!isSuperAdminUser) {
    return {};
  }

  return {
    getPlatformOverview: tool({
      description:
        'Get platform-wide overview statistics for Superadmin: active tenants, total users, leads/deals metrics, plan distribution, and recent organizations.',
      parameters: z.object({}),
      execute: async () => {
        const toolName = 'getPlatformOverview';
        try {
          const overview = await prisma.withTenantContext(
            { isSuperAdmin: true },
            async (tx) => {
              const [
                totalOrganizations,
                activeOrganizations,
                suspendedOrganizations,
                totalUsers,
                activeUsers,
                totalLeads,
                totalCustomers,
                totalDeals,
                tenantsByPlan,
                recentOrganizations,
              ] = await Promise.all([
                tx.tenant.count(),
                tx.tenant.count({ where: { status: 'ACTIVE' } }),
                tx.tenant.count({ where: { status: 'SUSPENDED' } }),
                tx.user.count(),
                tx.user.count({ where: { status: 'ACTIVE' } }),
                tx.lead.count({ where: { deletedAt: null } }),
                tx.customer.count({ where: { deletedAt: null } }),
                tx.deal.count({ where: { deletedAt: null } }),
                tx.tenant.groupBy({
                  by: ['plan'],
                  _count: { _all: true },
                }),
                tx.tenant.findMany({
                  take: 6,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    plan: true,
                    status: true,
                    createdAt: true,
                  },
                }),
              ]);

              return {
                metrics: {
                  totalOrganizations,
                  activeOrganizations,
                  suspendedOrganizations,
                  totalUsers,
                  activeUsers,
                  totalLeads,
                  totalCustomers,
                  totalDeals,
                },
                planDistribution: tenantsByPlan.map((p) => ({
                  plan: p.plan || 'free',
                  count: p._count._all,
                })),
                recentOrganizations: recentOrganizations.map((t) => ({
                  id: t.id,
                  name: t.name,
                  slug: t.slug,
                  plan: t.plan,
                  status: t.status,
                  createdAt: t.createdAt.toISOString(),
                })),
              };
            },
          );

          await aiSecurityService.logToolExecution(userContext, toolName, 'ALLOWED', {
            type: 'platform_overview',
          });

          return overview;
        } catch (e: any) {
          await aiSecurityService.logToolExecution(userContext, toolName, 'ERROR', {
            error: e.message,
          });
          return { error: 'Failed to fetch platform overview.', details: e.message };
        }
      },
    } as any),

    getPlatformAnalytics: tool({
      description:
        'Get platform revenue, estimated MRR & ARR in INR, tenant counts, and monthly onboarding growth trends.',
      parameters: z.object({}),
      execute: async () => {
        const toolName = 'getPlatformAnalytics';
        try {
          const now = new Date();
          const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

          const analytics = await prisma.withTenantContext(
            { isSuperAdmin: true },
            async (tx) => {
              const [
                totalTenants,
                activeTenants,
                totalUsers,
                allTenants,
                planStats,
              ] = await Promise.all([
                tx.tenant.count(),
                tx.tenant.count({ where: { status: 'ACTIVE' } }),
                tx.user.count(),
                tx.tenant.findMany({
                  where: { createdAt: { gte: sixMonthsAgo } },
                  select: { id: true, plan: true, createdAt: true },
                }),
                tx.tenant.groupBy({
                  by: ['plan'],
                  _count: { _all: true },
                }),
              ]);

              let estimatedMRR = 0;
              const planBreakdown = planStats.map((p) => {
                const count = p._count._all;
                const planKey = (p.plan || 'free').toLowerCase();
                const canonical = CANONICAL_PLANS[planKey] || (planKey === 'pro' ? CANONICAL_PLANS.growth : CANONICAL_PLANS.free);
                const price = canonical?.priceNum || 0;
                const revenue = count * price;
                estimatedMRR += revenue;
                return {
                  plan: p.plan || 'free',
                  planName: canonical?.name || p.plan,
                  count,
                  priceINR: price,
                  monthlyRevenueINR: revenue,
                };
              });

              return {
                totals: {
                  totalTenants,
                  activeTenants,
                  totalUsers,
                  estimatedMRR_INR: estimatedMRR,
                  estimatedARR_INR: estimatedMRR * 12,
                },
                planBreakdown,
                recent6MonthsNewTenantsCount: allTenants.length,
              };
            },
          );

          await aiSecurityService.logToolExecution(userContext, toolName, 'ALLOWED', {
            type: 'platform_analytics',
          });

          return analytics;
        } catch (e: any) {
          await aiSecurityService.logToolExecution(userContext, toolName, 'ERROR', {
            error: e.message,
          });
          return { error: 'Failed to fetch platform analytics.', details: e.message };
        }
      },
    } as any),

    listPlatformOrganizations: tool({
      description:
        'List tenant organizations across the platform with filtering by status, plan, search name, or limit.',
      parameters: z.object({
        status: z.string().optional().describe('Filter by tenant status e.g. ACTIVE, SUSPENDED, TRIAL'),
        plan: z.string().optional().describe('Filter by subscription plan e.g. free, starter, pro, enterprise'),
        search: z.string().optional().describe('Search tenant name or slug'),
        limit: z.number().optional().describe('Maximum number of organizations to return (default 10, max 50)'),
      }),
      execute: async (args: { status?: string; plan?: string; search?: string; limit?: number }) => {
        const toolName = 'listPlatformOrganizations';
        try {
          const { status, plan, search, limit = 10 } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));

          const where: any = {};
          if (status) where.status = status;
          if (plan) where.plan = plan;
          if (search) {
            where.OR = [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ];
          }

          const orgs = await prisma.withTenantContext(
            { isSuperAdmin: true },
            async (tx) =>
              tx.tenant.findMany({
                where,
                take: safeLimit,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  plan: true,
                  status: true,
                  createdAt: true,
                  _count: {
                    select: { users: true },
                  },
                },
              }),
          );

          await aiSecurityService.logToolExecution(userContext, toolName, 'ALLOWED', {
            count: orgs.length,
          });

          return orgs.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            plan: o.plan,
            status: o.status,
            userCount: o._count.users,
            createdAt: o.createdAt.toISOString(),
          }));
        } catch (e: any) {
          await aiSecurityService.logToolExecution(userContext, toolName, 'ERROR', {
            error: e.message,
          });
          return { error: 'Failed to list organizations.', details: e.message };
        }
      },
    } as any),

    getPlatformAuditLogs: tool({
      description:
        'Get latest platform security audit logs and administrative events across the platform.',
      parameters: z.object({
        limit: z.number().optional().describe('Maximum number of audit logs to retrieve (default 10, max 50)'),
        module: z.string().optional().describe('Optional module filter e.g. AUTH, TENANT, USERS, SECURITY'),
      }),
      execute: async (args: { limit?: number; module?: string }) => {
        const toolName = 'getPlatformAuditLogs';
        try {
          const { limit = 10, module: mod } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));

          const where: any = {};
          if (mod) where.module = mod;

          const logs = await prisma.withTenantContext(
            { isSuperAdmin: true },
            async (tx) =>
              tx.auditLog.findMany({
                where,
                take: safeLimit,
                orderBy: { createdAt: 'desc' },
                include: {
                  user: {
                    select: { id: true, name: true, email: true },
                  },
                },
              }),
          );

          await aiSecurityService.logToolExecution(userContext, toolName, 'ALLOWED', {
            count: logs.length,
          });

          return logs.map((log) => ({
            id: log.id,
            action: log.action,
            module: log.module || 'System',
            actor: log.user ? log.user.name || log.user.email : 'System',
            actorEmail: log.user?.email || null,
            tenantId: log.tenantId,
            createdAt: log.createdAt.toISOString(),
          }));
        } catch (e: any) {
          await aiSecurityService.logToolExecution(userContext, toolName, 'ERROR', {
            error: e.message,
          });
          return { error: 'Failed to fetch platform audit logs.', details: e.message };
        }
      },
    } as any),

    getPlatformUsersSummary: tool({
      description:
        'Get summary of platform users, active users count, and platform super-administrators.',
      parameters: z.object({
        limit: z.number().optional().describe('Max users to list (default 10)'),
      }),
      execute: async (args: { limit?: number }) => {
        const toolName = 'getPlatformUsersSummary';
        try {
          const { limit = 10 } = args;
          const safeLimit = Math.max(1, Math.min(limit, 50));

          const [totalUsers, activeUsers, superAdmins] = await prisma.withTenantContext(
            { isSuperAdmin: true },
            async (tx) => {
              return Promise.all([
                tx.user.count(),
                tx.user.count({ where: { status: 'ACTIVE' } }),
                tx.user.findMany({
                  where: { isSuperAdmin: true },
                  take: safeLimit,
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    status: true,
                    createdAt: true,
                  },
                }),
              ]);
            },
          );

          await aiSecurityService.logToolExecution(userContext, toolName, 'ALLOWED', {
            totalUsers,
          });

          return {
            totalUsers,
            activeUsers,
            superAdminCount: superAdmins.length,
            superAdmins: superAdmins.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              status: u.status,
              createdAt: u.createdAt.toISOString(),
            })),
          };
        } catch (e: any) {
          await aiSecurityService.logToolExecution(userContext, toolName, 'ERROR', {
            error: e.message,
          });
          return { error: 'Failed to fetch platform users summary.', details: e.message };
        }
      },
    } as any),
  };
}
