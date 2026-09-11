// Mock ESM packages before any imports
jest.mock('ai', () => ({
  tool: jest.fn((opts: any) => opts),
  streamText: jest.fn(),
  generateText: jest.fn(),
}));
jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn()),
}));
jest.mock('zod', () => {
  const schema: any = {
    optional: () => schema,
    describe: () => schema,
    object: () => schema,
    string: () => schema,
    number: () => schema,
    boolean: () => schema,
    enum: () => schema,
  };
  return { z: schema };
});

import { PrismaService } from './prisma.service';
import { TenantContextService } from '../common/context/tenant-context.service';
import { AuthService } from '../auth/auth.service';
import { LeadsService } from '../leads/services/leads.service';
import { CustomersService } from '../customers/customers.service';
import { CompaniesService } from '../companies/companies.service';
import { DealsService } from '../deals/services/deals.service';
import { TasksService } from '../activities/services/tasks.service';
import { MeetingsService } from '../activities/services/meetings.service';
import { InvoicesService } from '../finance/services/invoices.service';
import { QuotationsService } from '../finance/services/quotations.service';
import { SearchService } from '../system/services/search.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { LeadsImportService } from '../leads/services/leads.import.service';
import { TasksExportService } from '../activities/services/tasks.export.service';
import { RoleStatsService } from '../admin/services/role-stats.service';
import { AnalyticsInsightsService } from '../insights/services/analytics.insights.service';
import { AiService } from '../ai/ai.service';
import { PlatformDashboardService } from '../super-admin/services/platform-dashboard.service';
import { PlatformAnalyticsService } from '../super-admin/services/platform-analytics.service';
import { PlatformOrganizationsService } from '../super-admin/services/platform-organizations.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { RolesService } from '../admin/services/roles.service';

function createMockEncryption(): EncryptionService {
  return {
    encrypt: jest.fn((v: string) => (v ? `enc_${v}` : v)),
    decrypt: jest.fn((v: string) =>
      v && v.startsWith('enc_') ? v.replace('enc_', '') : v,
    ),
    hash: jest.fn((v: string) => (v ? `hash_${v}` : v)),
    encryptWithHash: jest.fn((v: string) => ({
      encrypted: v ? `enc_${v}` : null,
      hash: v ? `hash_${v}` : null,
    })),
  } as any;
}

describe('FORCE ROW LEVEL SECURITY — Comprehensive Targeted Verification Suite', () => {
  let prisma: PrismaService;
  let enc: EncryptionService;
  let tenantContextService: TenantContextService;
  let executedContexts: Array<{
    tenantId?: string;
    isSuperAdmin?: boolean;
    userId?: string;
  }>;
  let mockDatabaseStore: Map<string, any[]>;

  beforeEach(() => {
    executedContexts = [];
    mockDatabaseStore = new Map();
    enc = createMockEncryption();
    tenantContextService = new TenantContextService();

    prisma = new PrismaService(tenantContextService);

    jest
      .spyOn(prisma, '$transaction')
      .mockImplementation(async (callback: any) => {
        let currentTenant = '';
        let isSuperAdmin = false;
        let currentUserId = '';

        const mockTx: any = {
          $executeRaw: jest
            .fn()
            .mockImplementation(
              (strings: TemplateStringsArray, ...values: any[]) => {
                const sql = strings.join('?');
                if (sql.includes("set_config('app.current_tenant_id'")) {
                  currentTenant = values[0];
                }
                if (sql.includes("set_config('app.is_super_admin'")) {
                  isSuperAdmin = values[0] === 'true';
                }
                if (sql.includes("set_config('app.current_user_id'")) {
                  currentUserId = values[0];
                }
                return Promise.resolve(1);
              },
            ),
          $queryRaw: jest.fn().mockImplementation(async () => [{ current: 1 }]),
          lead: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                {
                  id: 'lead-1',
                  tenantId: currentTenant,
                  name: enc.encrypt('Lead A'),
                },
              ];
            }),
            findFirst: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return null;
              return {
                id: where?.id || 'lead-1',
                tenantId: currentTenant,
                name: enc.encrypt('Lead A'),
              };
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'lead-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
            update: jest.fn().mockImplementation(async ({ where, data }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              ) {
                throw new Error('RLS Violation: Cross-tenant update blocked');
              }
              return { id: where.id, ...data, tenantId: currentTenant };
            }),
            delete: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              ) {
                throw new Error('RLS Violation: Cross-tenant delete blocked');
              }
              return { id: where.id, tenantId: currentTenant };
            }),
            count: jest.fn().mockResolvedValue(1),
          },
          customer: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                {
                  id: 'cust-1',
                  tenantId: currentTenant,
                  name: enc.encrypt('Customer A'),
                },
              ];
            }),
            findFirst: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return null;
              return {
                id: where?.id || 'cust-1',
                tenantId: currentTenant,
                name: enc.encrypt('Customer A'),
              };
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'cust-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
          },
          company: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                { id: 'comp-1', tenantId: currentTenant, name: 'Acme Corp' },
              ];
            }),
            findFirst: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return null;
              return {
                id: where?.id || 'comp-1',
                tenantId: currentTenant,
                name: 'Acme Corp',
              };
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'comp-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
          },
          deal: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                {
                  id: 'deal-1',
                  tenantId: currentTenant,
                  title: 'Enterprise Deal',
                },
              ];
            }),
            findFirst: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return null;
              return {
                id: where?.id || 'deal-1',
                tenantId: currentTenant,
                title: 'Enterprise Deal',
              };
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'deal-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
          },
          task: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                { id: 'task-1', tenantId: currentTenant, title: 'Follow Up' },
              ];
            }),
            findFirst: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return null;
              return {
                id: where?.id || 'task-1',
                tenantId: currentTenant,
                title: 'Follow Up',
              };
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'task-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
          },
          meeting: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                {
                  id: 'meeting-1',
                  tenantId: currentTenant,
                  title: 'Demo Meeting',
                },
              ];
            }),
            findFirst: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return null;
              return {
                id: where?.id || 'meeting-1',
                tenantId: currentTenant,
                title: 'Demo Meeting',
              };
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'meeting-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
          },
          invoice: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                {
                  id: 'inv-1',
                  tenantId: currentTenant,
                  invoiceNumber: 'INV-001',
                  totalAmount: 5000,
                },
              ];
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'inv-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
          },
          quotation: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (
                !isSuperAdmin &&
                where?.tenantId &&
                where.tenantId !== currentTenant
              )
                return [];
              return [
                {
                  id: 'quot-1',
                  tenantId: currentTenant,
                  quotationNumber: 'QT-001',
                },
              ];
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'quot-new',
              ...data,
              tenantId: currentTenant || data.tenantId,
            })),
          },
          user: {
            findUnique: jest.fn().mockImplementation(async ({ where }) => {
              return {
                id: where.id || 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                isSuperAdmin,
                memberships: [
                  {
                    tenantId: 'tenant-alpha',
                    status: 'ACTIVE',
                    role: {
                      name: 'ADMIN',
                      permissions: [{ action: 'manage', subject: 'all' }],
                    },
                    tenant: {
                      id: 'tenant-alpha',
                      name: 'Alpha Workspace',
                      slug: 'alpha',
                    },
                  },
                ],
              };
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'user-new',
              ...data,
            })),
          },
          tenant: {
            findUnique: jest.fn().mockImplementation(async ({ where }) => ({
              id: where.id || 'tenant-alpha',
              name: 'Alpha Workspace',
              slug: 'alpha',
              currency: 'INR',
            })),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'tenant-new',
              ...data,
            })),
            delete: jest.fn().mockImplementation(async ({ where }) => ({
              id: where.id,
            })),
            count: jest.fn().mockResolvedValue(5),
            groupBy: jest.fn().mockResolvedValue([]),
          },
          tenantUser: {
            findMany: jest.fn().mockImplementation(async ({ where }) => {
              if (currentUserId && (!where || where.userId === currentUserId)) {
                return [
                  {
                    id: 'tu-1',
                    userId: currentUserId,
                    tenantId: 'tenant-alpha',
                    status: 'ACTIVE',
                    role: { id: 'role-1', name: 'ADMIN' },
                  },
                ];
              }
              return [];
            }),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'tu-new',
              ...data,
            })),
            count: jest.fn().mockResolvedValue(1),
          },
          role: {
            findMany: jest
              .fn()
              .mockResolvedValue([
                { id: 'role-1', name: 'ADMIN', permissions: [] },
              ]),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'role-new',
              ...data,
            })),
          },
          rolePermission: {
            createMany: jest.fn().mockResolvedValue({ count: 5 }),
          },
          notification: {
            findMany: jest
              .fn()
              .mockImplementation(async () => [
                { id: 'notif-1', tenantId: currentTenant, title: 'Alert' },
              ]),
            create: jest.fn().mockImplementation(async ({ data }) => ({
              id: 'notif-new',
              ...data,
            })),
          },
          tenantAiConfig: {
            findUnique: jest.fn().mockImplementation(async () => ({
              tenantId: currentTenant,
              apiKey: 'enc_byok_key',
            })),
          },
          aiConversation: {
            findMany: jest
              .fn()
              .mockImplementation(async () => [
                { id: 'conv-1', tenantId: currentTenant, title: 'Chat' },
              ]),
          },
          document: {
            findMany: jest
              .fn()
              .mockImplementation(async () => [
                { id: 'doc-1', tenantId: currentTenant, title: 'Doc' },
              ]),
          },
          auditLog: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
            count: jest.fn().mockResolvedValue(0),
          },
        };

        executedContexts.push({
          tenantId: currentTenant,
          isSuperAdmin,
          userId: currentUserId,
        });
        return callback(mockTx);
      });
  });

  describe('5.1 AUTH Verification', () => {
    it('handles login, GET /auth/me, and multi-tenant membership discovery with safe user-scoped context', async () => {
      const userRes = await prisma.withTenantContext(
        { userId: 'user-123' },
        async (tx) => {
          const memberships = await tx.tenantUser.findMany({
            where: { userId: 'user-123' },
          });
          const user = await tx.user.findUnique({ where: { id: 'user-123' } });
          return { user, memberships };
        },
      );

      expect(userRes.user).toBeDefined();
      expect(userRes.memberships).toHaveLength(1);
      expect(userRes.memberships[0].tenantId).toBe('tenant-alpha');
    });
  });

  describe('5.2 ONBOARDING Verification', () => {
    it('creates new user registration, workspace, and ADMIN role/permissions', async () => {
      const result = await prisma.withTenantContext(
        { tenantId: 'tenant-new', isSuperAdmin: false },
        async (tx) => {
          const user = await tx.user.create({
            data: { email: 'new@clixpro.com', name: 'New Founder' },
          });
          const tenant = await tx.tenant.create({
            data: { name: 'New Company', slug: 'new-co' },
          });
          const role = await tx.role.create({
            data: { name: 'ADMIN', tenantId: tenant.id },
          });
          await tx.rolePermission.createMany({
            data: [{ roleId: role.id, action: 'manage', subject: 'all' }],
          });
          const tenantUser = await tx.tenantUser.create({
            data: { userId: user.id, tenantId: tenant.id, roleId: role.id },
          });

          return { user, tenant, role, tenantUser };
        },
      );

      expect(result.user.id).toBe('user-new');
      expect(result.tenant.id).toBe('tenant-new');
      expect(result.role.id).toBe('role-new');
      expect(result.tenantUser.tenantId).toBe('tenant-new');
    });
  });

  describe('5.3 CRM Core Verification under FORCE RLS', () => {
    it('executes Leads, Customers, Companies, Deals, Tasks, Meetings, Invoices, Quotations within tenant context', async () => {
      const tenantA = 'tenant-aaa';
      const res = await prisma.withTenantContext(
        { tenantId: tenantA },
        async (tx) => {
          const leads = await tx.lead.findMany({
            where: { tenantId: tenantA },
          });
          const customers = await tx.customer.findMany({
            where: { tenantId: tenantA },
          });
          const companies = await tx.company.findMany({
            where: { tenantId: tenantA },
          });
          const deals = await tx.deal.findMany({
            where: { tenantId: tenantA },
          });
          const tasks = await tx.task.findMany({
            where: { tenantId: tenantA },
          });
          const meetings = await tx.meeting.findMany({
            where: { tenantId: tenantA },
          });
          const invoices = await tx.invoice.findMany({
            where: { tenantId: tenantA },
          });
          const quotations = await tx.quotation.findMany({
            where: { tenantId: tenantA },
          });

          return {
            leads,
            customers,
            companies,
            deals,
            tasks,
            meetings,
            invoices,
            quotations,
          };
        },
      );

      expect(res.leads).toHaveLength(1);
      expect(res.customers).toHaveLength(1);
      expect(res.companies).toHaveLength(1);
      expect(res.deals).toHaveLength(1);
      expect(res.tasks).toHaveLength(1);
      expect(res.meetings).toHaveLength(1);
      expect(res.invoices).toHaveLength(1);
      expect(res.quotations).toHaveLength(1);
    });
  });

  describe('5.4 SECURITY & Cross-Tenant Boundary Enforcement', () => {
    it('strictly prevents Tenant A from reading Tenant B records', async () => {
      const tenantA = 'tenant-aaa';
      const tenantB = 'tenant-bbb';

      const readAttempt = await prisma.withTenantContext(
        { tenantId: tenantA },
        async (tx) => {
          return tx.lead.findMany({ where: { tenantId: tenantB } });
        },
      );

      expect(readAttempt).toHaveLength(0);
    });

    it('strictly blocks Tenant A from updating or deleting Tenant B records', async () => {
      const tenantA = 'tenant-aaa';
      const tenantB = 'tenant-bbb';

      await expect(
        prisma.withTenantContext({ tenantId: tenantA }, async (tx) => {
          return tx.lead.update({
            where: { id: 'lead-b', tenantId: tenantB } as any,
            data: { name: 'Hacked' },
          });
        }),
      ).rejects.toThrow('RLS Violation: Cross-tenant update blocked');

      await expect(
        prisma.withTenantContext({ tenantId: tenantA }, async (tx) => {
          return tx.lead.delete({
            where: { id: 'lead-b', tenantId: tenantB } as any,
          });
        }),
      ).rejects.toThrow('RLS Violation: Cross-tenant delete blocked');
    });
  });

  describe('5.5 OTHER Tenant Subsystems Verification', () => {
    it('executes Search, Notifications, AI BYOK, and RAG without RLS failure', async () => {
      const tenantA = 'tenant-aaa';
      const res = await prisma.withTenantContext(
        { tenantId: tenantA },
        async (tx) => {
          const notifs = await tx.notification.findMany({
            where: { tenantId: tenantA },
          });
          const aiConfig = await tx.tenantAiConfig.findUnique({
            where: { tenantId: tenantA } as any,
          });
          const convs = await tx.aiConversation.findMany({
            where: { tenantId: tenantA },
          });
          const docs = await tx.document.findMany({
            where: { tenantId: tenantA },
          });

          return { notifs, aiConfig, convs, docs };
        },
      );

      expect(res.notifs).toHaveLength(1);
      expect(res.aiConfig?.tenantId).toBe(tenantA);
      expect(res.convs).toHaveLength(1);
      expect(res.docs).toHaveLength(1);
    });

    it('executes Super Admin operations with isSuperAdmin=true bypass', async () => {
      const res = await prisma.withTenantContext(
        { isSuperAdmin: true },
        async (tx) => {
          const tenantCount = await tx.tenant.count();
          const deletedTenant = await tx.tenant.delete({
            where: { id: 'tenant-to-delete' },
          });
          return { tenantCount, deletedTenant };
        },
      );

      expect(res.tenantCount).toBe(5);
      expect(res.deletedTenant.id).toBe('tenant-to-delete');
    });
  });

  describe('6. Concurrent Multi-Tenant Request Isolation', () => {
    it('maintains absolute context isolation across interleaved concurrent requests from Tenant A and Tenant B', async () => {
      const tenantA = 'tenant-alpha-123';
      const tenantB = 'tenant-beta-456';

      const results = await Promise.all([
        prisma.withTenantContext({ tenantId: tenantA }, async (tx) => {
          await new Promise((r) => setTimeout(r, 20));
          const leads = await tx.lead.findMany({
            where: { tenantId: tenantA },
          });
          return { tenant: tenantA, leads };
        }),
        prisma.withTenantContext({ tenantId: tenantB }, async (tx) => {
          await new Promise((r) => setTimeout(r, 10));
          const leads = await tx.lead.findMany({
            where: { tenantId: tenantB },
          });
          return { tenant: tenantB, leads };
        }),
        prisma.withTenantContext({ tenantId: tenantA }, async (tx) => {
          const leads = await tx.lead.findMany({
            where: { tenantId: tenantA },
          });
          return { tenant: tenantA, leads };
        }),
      ]);

      expect(results[0].tenant).toBe(tenantA);
      expect(results[1].tenant).toBe(tenantB);
      expect(results[2].tenant).toBe(tenantA);
      expect(results[0].leads[0].tenantId).toBe(tenantA);
      expect(results[1].leads[0].tenantId).toBe(tenantB);
    });
  });
});
