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

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { TenantGuard } from '../auth/tenant.guard';
import { AuthService } from '../auth/auth.service';
import { CompaniesService } from '../companies/companies.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { SearchService } from '../system/services/search.service';
import { LeadsImportService } from '../leads/services/leads.import.service';
import { TasksExportService } from '../activities/services/tasks.export.service';
import { RoleStatsService } from '../admin/services/role-stats.service';
import { AnalyticsInsightsService } from '../insights/services/analytics.insights.service';
import { AiService } from '../ai/ai.service';
import { PlatformDashboardService } from '../super-admin/services/platform-dashboard.service';
import { PlatformAnalyticsService } from '../super-admin/services/platform-analytics.service';
import { PlatformOrganizationsService } from '../super-admin/services/platform-organizations.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { BrandingService } from '../branding/branding.service';
import { TenantContextService } from '../common/context/tenant-context.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

function buildModelMocks() {
  return {
    $executeRaw: jest.fn().mockResolvedValue(undefined),
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    tenantUser: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      count: jest.fn().mockResolvedValue(0),
    },
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      count: jest.fn().mockResolvedValue(0),
    },
    rolePermission: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      count: jest.fn().mockResolvedValue(0),
    },
    lead: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    customer: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    company: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    deal: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    task: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    quotation: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'notif-1', ...data })),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      count: jest.fn().mockResolvedValue(0),
    },
    tenantAiConfig: {
      findUnique: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    aiConversation: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    aiMessage: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    document: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    documentChunk: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    timelineEvent: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    attachment: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    note: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    invitation: {
      count: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    department: {
      count: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    invoice: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    invoiceCounter: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    meeting: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    product: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    revenueTarget: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

describe('RLS Phase 4 — Final Access Path Remediation & Isolation Tests', () => {
  let mockPrisma: any;
  let mockTx: any;
  let encService: EncryptionService;

  beforeEach(() => {
    mockTx = buildModelMocks();
    mockPrisma = buildModelMocks();

    mockPrisma.withTenantContext = jest.fn(
      async (opts: any, callback: (tx: any) => Promise<any>) => {
        return callback(mockTx);
      },
    );

    encService = {
      encrypt: jest.fn((v) => (v ? `enc_${v}` : v)),
      decrypt: jest.fn((v) => (v && v.startsWith('enc_') ? v.replace('enc_', '') : v)),
      hash: jest.fn((v) => (v ? `hash_${v}` : v)),
      encryptWithHash: jest.fn((v) => ({
        encrypted: v ? `enc_${v}` : null,
        hash: v ? `hash_${v}` : null,
      })),
    } as any;
  });

  describe('1. TenantGuard & Normal User Discovery Bootstrap', () => {
    it('should query user memberships in userId-scoped tenant context (without superadmin flag)', async () => {
      const guard = new TenantGuard(mockPrisma as any, new TenantContextService());

      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-normal-1' },
            headers: { 'x-tenant-id': 'tenant-alpha' },
          }),
        }),
      };

      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-normal-1',
        status: 'ACTIVE',
        isSuperAdmin: false,
        memberships: [
          {
            tenantId: 'tenant-alpha',
            status: 'ACTIVE',
            role: { name: 'MEMBER', permissions: [] },
            tenant: { id: 'tenant-alpha', status: 'ACTIVE' },
          },
        ],
      });

      const allowed = await guard.canActivate(mockExecutionContext);
      expect(allowed).toBe(true);

      // Verify withTenantContext was invoked with userId
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { userId: 'user-normal-1' },
        expect.any(Function),
      );
      expect(mockTx.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-normal-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('2. AuthService Bootstrap, Registration & Deletion', () => {
    let authService: AuthService;

    beforeEach(() => {
      authService = new AuthService(
        mockPrisma as any,
        { processAndUploadLogo: jest.fn(), processAndUploadAvatar: jest.fn() } as any,
        new TenantContextService(),
      );
    });

    it('getMe wraps profile discovery in userId context', async () => {
      mockTx.user.findUnique.mockResolvedValue({
        id: 'user-profile-1',
        name: 'Test User',
        email: 'test@example.com',
        memberships: [
          {
            tenantId: 'tenant-123',
            role: { name: 'ADMIN', permissions: [{ module: 'ALL', hasAccess: true }] },
            tenant: { name: 'Test Workspace', status: 'ACTIVE' },
          },
        ],
      });

      const profile = await authService.getMe('user-profile-1', 'tenant-123');
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { userId: 'user-profile-1' },
        expect.any(Function),
      );
      expect(profile.user.id).toBe('user-profile-1');
      expect(profile.user.tenantId).toBe('tenant-123');
    });

    it('register wraps workspace creation in superadmin tenant context', async () => {
      mockTx.tenant.create.mockResolvedValue({ id: 'tenant-new', name: 'Acme Corp', slug: 'acme-corp' });
      mockTx.role.create.mockResolvedValue({ id: 'role-admin' });
      mockTx.rolePermission.createMany.mockResolvedValue({ count: 1 });
      mockTx.user.findUnique.mockResolvedValue({ id: 'user-reg-1', name: 'John Doe' });
      mockTx.tenantUser.create.mockResolvedValue({ id: 'tu-1' });
      mockTx.auditLog.create.mockResolvedValue({ id: 'al-1' });

      const res = await authService.register(
        { userId: 'user-reg-1', name: 'John Doe', email: 'john@acme.com', companyName: 'Acme Corp' },
        { ip: '127.0.0.1', userAgent: 'test' },
      );

      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { isSuperAdmin: true },
        expect.any(Function),
      );
      expect(mockTx.tenant.create).toHaveBeenCalled();
      expect(res.tenant.id).toBe('tenant-new');
    });
  });

  describe('3. CompaniesService Tenant Isolation', () => {
    let service: CompaniesService;

    beforeEach(() => {
      service = new CompaniesService(mockPrisma as any, encService);
    });

    it('getCompanies executes within tenantId context', async () => {
      mockTx.company.findMany.mockResolvedValue([]);
      mockTx.company.count.mockResolvedValue(0);

      await service.getCompanies('tenant-co-1', { page: 1, limit: 10 });
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-co-1' },
        expect.any(Function),
      );
      expect(mockTx.company.findMany).toHaveBeenCalled();
    });

    it('createCompany executes within tenantId context', async () => {
      mockTx.company.create.mockResolvedValue({ id: 'comp-1' });

      await service.createCompany(
        'tenant-co-1',
        { name: 'Stark Industries', industry: 'Tech' } as any,
        'user-1',
      );
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-co-1' },
        expect.any(Function),
      );
      expect(mockTx.company.create).toHaveBeenCalled();
    });
  });

  describe('4. NotificationsService Tenant Isolation', () => {
    let service: NotificationsService;

    beforeEach(() => {
      service = new NotificationsService(mockPrisma as any);
    });

    it('getNotifications executes within tenantId context', async () => {
      mockTx.notification.findMany.mockResolvedValue([]);

      await service.getNotifications('tenant-notif-1', 'user-1');
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-notif-1' },
        expect.any(Function),
      );
      expect(mockTx.notification.findMany).toHaveBeenCalled();
    });

    it('markAllAsRead executes within tenantId context', async () => {
      await service.markAllAsRead('tenant-notif-1', 'user-1');
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-notif-1' },
        expect.any(Function),
      );
      expect(mockTx.notification.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-notif-1', userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('5. SearchService Global Search', () => {
    let service: SearchService;

    beforeEach(() => {
      service = new SearchService(mockPrisma as any);
    });

    it('globalSearch executes all entity lookups inside withTenantContext', async () => {
      mockTx.lead.findMany.mockResolvedValue([]);
      mockTx.customer.findMany.mockResolvedValue([]);
      mockTx.company.findMany.mockResolvedValue([]);
      mockTx.deal.findMany.mockResolvedValue([]);
      mockTx.task.findMany.mockResolvedValue([]);

      await service.globalSearch('tenant-srch-1', 'user-1', false, 'test query');
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-srch-1' },
        expect.any(Function),
      );
      expect(mockTx.lead.findMany).toHaveBeenCalled();
      expect(mockTx.customer.findMany).toHaveBeenCalled();
    });
  });

  describe('6. LeadsImportService Tenant Isolation', () => {
    let service: LeadsImportService;

    beforeEach(() => {
      service = new LeadsImportService(mockPrisma as any, encService);
    });

    it('bulkImportLeads executes within tenantId context', async () => {
      mockTx.lead.findFirst.mockResolvedValue(null);
      mockTx.lead.create.mockResolvedValue({ id: 'lead-imp-1' });

      await service.bulkImportLeads(
        'tenant-imp-1',
        'user-1',
        [{ name: 'Jane Doe', email: 'jane@example.com' }],
        'skip',
      );

      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-imp-1' },
        expect.any(Function),
      );
      expect(mockTx.lead.create).toHaveBeenCalled();
    });
  });

  describe('7. TasksExportService Tenant Isolation', () => {
    let service: TasksExportService;

    beforeEach(() => {
      service = new TasksExportService(mockPrisma as any);
    });

    it('exportTasks executes within tenantId context', async () => {
      mockTx.task.findMany.mockResolvedValue([]);

      await service.exportTasks('tenant-exp-1', 'user-1', {});
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-exp-1' },
        expect.any(Function),
      );
      expect(mockTx.task.findMany).toHaveBeenCalled();
    });
  });

  describe('8. RoleStatsService & AnalyticsInsightsService', () => {
    it('getRoleManagementStats executes within tenant context', async () => {
      const service = new RoleStatsService(mockPrisma as any);
      await service.getRoleManagementStats('tenant-stats-1');

      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-stats-1' },
        expect.any(Function),
      );
      expect(mockTx.tenantUser.count).toHaveBeenCalled();
    });

    it('getAiInsights executes within tenant context', async () => {
      const service = new AnalyticsInsightsService(mockPrisma as any);
      mockTx.lead.findMany.mockResolvedValue([]);
      mockTx.task.findMany.mockResolvedValue([]);

      await service.getAiInsights('tenant-insights-1');
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { tenantId: 'tenant-insights-1' },
        expect.any(Function),
      );
      expect(mockTx.lead.findMany).toHaveBeenCalled();
    });
  });

  describe('9. Super Admin Platform Services', () => {
    it('PlatformDashboardService executes in isSuperAdmin: true context', async () => {
      const service = new PlatformDashboardService(mockPrisma as any);
      mockTx.tenant.findMany.mockResolvedValue([]);
      mockTx.auditLog.findMany.mockResolvedValue([]);
      mockTx.tenant.groupBy.mockResolvedValue([]);

      await service.getPlatformOverview();
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { isSuperAdmin: true },
        expect.any(Function),
      );
      expect(mockTx.tenant.count).toHaveBeenCalled();
    });

    it('PlatformAnalyticsService executes in isSuperAdmin: true context', async () => {
      const service = new PlatformAnalyticsService(mockPrisma as any);
      mockTx.tenant.findMany.mockResolvedValue([]);
      mockTx.tenant.groupBy.mockResolvedValue([]);

      await service.getPlatformAnalytics();
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { isSuperAdmin: true },
        expect.any(Function),
      );
      expect(mockTx.tenant.count).toHaveBeenCalled();
    });

    it('PlatformOrganizationsService createOrganization executes in isSuperAdmin: true context', async () => {
      const service = new PlatformOrganizationsService(mockPrisma as any);
      mockTx.tenant.findUnique.mockResolvedValue(null);
      mockTx.tenant.create.mockResolvedValue({ id: 'ten-1', name: 'New Org', slug: 'new-org' });
      mockTx.role.create.mockResolvedValue({ id: 'role-1' });

      await service.createOrganization({ name: 'New Org' }, 'admin-1');
      expect(mockPrisma.withTenantContext).toHaveBeenCalledWith(
        { isSuperAdmin: true },
        expect.any(Function),
      );
      expect(mockTx.tenant.create).toHaveBeenCalled();
    });
  });
});
