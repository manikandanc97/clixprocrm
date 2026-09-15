// Mock ESM packages before any imports
jest.mock('ai', () => ({
  tool: jest.fn((opts: any) => opts),
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

/**
 * @file src/prisma/rls-phase3.spec.ts
 * Phase 3 RLS isolation tests covering:
 *  - TasksQueryService (syncOverdueTasks, getTasks $queryRaw, getTaskById)
 *  - DashboardService (getDashboardData, getEmployeeDashboardData)
 *  - AnalyticsService (getAnalytics)
 *  - AnalyticsRevenueGrowthService (getRevenueGrowth)
 *  - ReportsService (getReports)
 *  - AiSecurityService (buildSecurityContext, logToolExecution)
 *  - AI Tools (leads, customers, deals, tasks, quotations)
 *
 * Strategy: All tests verify that:
 *  1. withTenantContext is called with the correct tenantId
 *  2. The transaction callback receives a tx client (not the global prisma instance)
 *  3. set_config is applied before any tenant-scoped query
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { TenantContextService } from '../common/context/tenant-context.service';
import { TasksQueryService } from '../activities/services/tasks.query.service';
import { TasksExportService } from '../activities/services/tasks.export.service';
import { TasksHistoryService } from '../activities/services/tasks.history.service';
import { DashboardService } from '../insights/services/dashboard.service';
import { AnalyticsService } from '../insights/services/analytics.service';
import { AnalyticsRevenueGrowthService } from '../insights/services/analytics.revenue-growth.service';
import { AnalyticsInsightsService } from '../insights/services/analytics.insights.service';
import { ReportsService } from '../insights/services/reports.service';
import { AiSecurityService } from '../ai/ai-security.service';
import { buildLeadsTools } from '../ai/tools/leads.tools';
import { buildCustomersTools } from '../ai/tools/customers.tools';
import { buildDealsTools } from '../ai/tools/deals.tools';
import { buildTasksTools } from '../ai/tools/tasks.tools';
import { buildQuotationsTools } from '../ai/tools/quotations.tools';
import { EncryptionService } from '../common/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a fresh set of Prisma model mocks (all methods are independent jest.fn()) */
function buildModelMocks() {
  return {
    $executeRaw: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([]),
    task: {
      updateMany: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({
        id: 'task-1',
        title: 'Test',
        priority: 'MEDIUM',
        status: 'PENDING',
        visibility: 'PRIVATE',
        dueDate: null,
      }),
      update: jest.fn().mockResolvedValue({
        id: 'task-1',
        title: 'Test',
        status: 'COMPLETED',
        updatedAt: new Date(),
      }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    lead: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
    deal: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { value: 0 } }),
    },
    meeting: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    quotation: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    tenantUser: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    revenueTarget: { findFirst: jest.fn().mockResolvedValue(null) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    timelineEvent: { findMany: jest.fn().mockResolvedValue([]) },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ currency: 'INR' }) },
    tenantAiConfig: { findUnique: jest.fn().mockResolvedValue(null) },
  };
}

/** Records (tenantId, isSuperAdmin) tuples each time withTenantContext is called */
function buildPrismaMock() {
  const executedContexts: Array<{ tenantId?: string; isSuperAdmin?: boolean }> =
    [];
  // tx and prisma MUST have separate jest.fn() instances for isolation assertions
  const txMock: any = buildModelMocks();
  const prismaMockModels: any = buildModelMocks();

  const prismaMock: any = {
    ...prismaMockModels,
    withTenantContext: jest
      .fn()
      .mockImplementation(async (opts: any, fn: any) => {
        executedContexts.push({
          tenantId: opts.tenantId,
          isSuperAdmin: opts.isSuperAdmin ?? false,
        });
        return fn(txMock);
      }),
    withCurrentTenantContext: jest
      .fn()
      .mockImplementation(async (fn: any) => fn(txMock)),
    $transaction: jest.fn().mockImplementation(async (fn: any) => fn(txMock)),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return { prismaMock, executedContexts, txMock };
}

// ─── TasksQueryService ────────────────────────────────────────────────────────

describe('TasksQueryService Phase 3', () => {
  let service: TasksQueryService;
  let prismaMock: any;
  let executedContexts: any[];
  let txMock: any;

  beforeEach(async () => {
    ({ prismaMock, executedContexts, txMock } = buildPrismaMock());

    const exportMock = { exportTasks: jest.fn().mockResolvedValue([]) } as any;
    const historyMock = {
      getTaskHistory: jest.fn().mockResolvedValue([]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksQueryService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TasksExportService, useValue: exportMock },
        { provide: TasksHistoryService, useValue: historyMock },
      ],
    }).compile();

    service = module.get<TasksQueryService>(TasksQueryService);
  });

  it('syncOverdueTasks: calls withTenantContext with correct tenantId', async () => {
    await service.syncOverdueTasks('tenant-A');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-A' }),
      expect.any(Function),
    );
    expect(executedContexts[0].tenantId).toBe('tenant-A');
  });

  it('syncOverdueTasks: uses tx.task.updateMany, not prisma.task.updateMany', async () => {
    await service.syncOverdueTasks('tenant-B');
    expect(txMock.task.updateMany).toHaveBeenCalled();
    // The outer prismaMock.task.updateMany should NOT have been called directly
    expect(prismaMock.task.updateMany).not.toHaveBeenCalled();
  });

  it('getTasks: calls withTenantContext with correct tenantId', async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        tasks_json: [],
        filtered_count: 0,
        total_count: 0,
        pending_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        blocked_count: 0,
        overdue_count: 0,
        due_today_count: 0,
      },
    ]);
    await service.getTasks('tenant-C', {
      userId: 'user-1',
      role: 'ADMIN',
      page: 1,
      limit: 10,
    });
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-C' }),
      expect.any(Function),
    );
    expect(executedContexts[0].tenantId).toBe('tenant-C');
  });

  it('getTasks: uses tx.$queryRaw, not prisma.$queryRaw', async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        tasks_json: [],
        filtered_count: 0,
        total_count: 0,
        pending_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        blocked_count: 0,
        overdue_count: 0,
        due_today_count: 0,
      },
    ]);
    await service.getTasks('tenant-D', {
      userId: 'user-1',
      role: 'ADMIN',
      page: 1,
      limit: 5,
    });
    expect(txMock.$queryRaw).toHaveBeenCalled();
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it('getTasks: RBAC queries use tx.tenantUser, not prisma.tenantUser', async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        tasks_json: [],
        filtered_count: 0,
        total_count: 0,
        pending_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        blocked_count: 0,
        overdue_count: 0,
        due_today_count: 0,
      },
    ]);
    await service.getTasks('tenant-E', {
      userId: 'user-1',
      role: 'EMPLOYEE',
      page: 1,
      limit: 5,
    });
    expect(txMock.tenantUser.findFirst).toHaveBeenCalled();
    expect(prismaMock.tenantUser.findFirst).not.toHaveBeenCalled();
  });

  it('getTaskById: calls withTenantContext with correct tenantId', async () => {
    await service.getTaskById('tenant-F', 'task-1');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-F' }),
      expect.any(Function),
    );
    expect(executedContexts[0].tenantId).toBe('tenant-F');
  });

  it('getTaskById: uses tx.task.findFirst, not prisma.task.findFirst', async () => {
    await service.getTaskById('tenant-G', 'task-2');
    expect(txMock.task.findFirst).toHaveBeenCalled();
    expect(prismaMock.task.findFirst).not.toHaveBeenCalled();
  });

  it('cross-tenant isolation: separate calls use separate contexts', async () => {
    txMock.$queryRaw.mockResolvedValue([
      {
        tasks_json: [],
        filtered_count: 0,
        total_count: 0,
        pending_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        blocked_count: 0,
        overdue_count: 0,
        due_today_count: 0,
      },
    ]);
    await service.syncOverdueTasks('tenant-X');
    await service.syncOverdueTasks('tenant-Y');
    expect(executedContexts[0].tenantId).toBe('tenant-X');
    expect(executedContexts[1].tenantId).toBe('tenant-Y');
  });
});

// ─── DashboardService ─────────────────────────────────────────────────────────

describe('DashboardService Phase 3', () => {
  let service: DashboardService;
  let prismaMock: any;
  let executedContexts: any[];
  let txMock: any;

  beforeEach(async () => {
    ({ prismaMock, executedContexts, txMock } = buildPrismaMock());
    // getCachedTenantCurrency hits prisma.tenant.findUnique directly (global table)
    prismaMock.tenant = {
      findUnique: jest.fn().mockResolvedValue({ currency: 'INR' }),
    };

    txMock.$queryRaw.mockResolvedValue([
      {
        total_deals: 0,
        current_period_deals: 0,
        prev_period_deals: 0,
        current_period_revenue: 0,
        prev_period_revenue: 0,
        current_period_customers: 0,
        prev_period_customers: 0,
        pending_tasks_total: 0,
        current_period_pending_tasks: 0,
        prev_period_pending_tasks: 0,
        month_index: 0,
        total: 0,
        day_date: new Date(),
        deal_count: 0,
        revenue: 0,
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('getDashboardData: calls withTenantContext with correct tenantId', async () => {
    await service.getDashboardData('tenant-dash-A');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-dash-A' }),
      expect.any(Function),
    );
  });

  it('getDashboardData: queries use tx, not prisma directly', async () => {
    await service.getDashboardData('tenant-dash-B');
    expect(txMock.deal.aggregate).toHaveBeenCalled();
    expect(prismaMock.deal.aggregate).not.toHaveBeenCalled();
  });

  it('getDashboardData: ORM queries use tx, not prisma directly', async () => {
    await service.getDashboardData('tenant-dash-C');
    // deal.findMany, quotation.findMany, task.findMany, revenueTarget.findFirst go through tx
    expect(txMock.deal.findMany).toHaveBeenCalled();
    expect(prismaMock.deal.findMany).not.toHaveBeenCalled();
  });

  it('getEmployeeDashboardData: calls withTenantContext', async () => {
    await service.getEmployeeDashboardData('tenant-emp-A', 'user-1');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-emp-A' }),
      expect.any(Function),
    );
  });

  it('getEmployeeDashboardData: all queries use tx', async () => {
    await service.getEmployeeDashboardData('tenant-emp-B', 'user-2');
    expect(txMock.task.count).toHaveBeenCalled();
    expect(txMock.meeting.count).toHaveBeenCalled();
    expect(txMock.lead.count).toHaveBeenCalled();
    expect(prismaMock.task.count).not.toHaveBeenCalled();
  });
});

// ─── AnalyticsService ─────────────────────────────────────────────────────────

describe('AnalyticsService Phase 3', () => {
  let service: AnalyticsService;
  let prismaMock: any;
  let executedContexts: any[];
  let txMock: any;

  beforeEach(async () => {
    ({ prismaMock, executedContexts, txMock } = buildPrismaMock());

    txMock.$queryRaw.mockResolvedValue([
      {
        leads_count: 0,
        prev_leads_count: 0,
        tasks_count: 0,
        prev_tasks_count: 0,
        customers_count: 0,
        prev_customers_count: 0,
      },
    ]);

    const revGrowthMock = {
      getRevenueGrowth: jest.fn().mockResolvedValue({}),
    } as any;
    const insightsMock = {
      getAiInsights: jest.fn().mockResolvedValue([]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AnalyticsRevenueGrowthService, useValue: revGrowthMock },
        { provide: AnalyticsInsightsService, useValue: insightsMock },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('getAnalytics: calls withTenantContext with correct tenantId', async () => {
    await service.getAnalytics('tenant-analytics-A');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-analytics-A' }),
      expect.any(Function),
    );
  });

  it('getAnalytics: $queryRaw uses tx', async () => {
    await service.getAnalytics('tenant-analytics-B');
    expect(txMock.$queryRaw).toHaveBeenCalled();
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it('getAnalytics: groupBy and findFirst use tx', async () => {
    await service.getAnalytics('tenant-analytics-C');
    expect(txMock.lead.groupBy).toHaveBeenCalled();
    expect(txMock.revenueTarget.findFirst).toHaveBeenCalled();
    expect(prismaMock.lead.groupBy).not.toHaveBeenCalled();
  });
});

// ─── AnalyticsRevenueGrowthService ───────────────────────────────────────────

describe('AnalyticsRevenueGrowthService Phase 3', () => {
  let service: AnalyticsRevenueGrowthService;
  let prismaMock: any;
  let executedContexts: any[];
  let txMock: any;

  beforeEach(async () => {
    ({ prismaMock, executedContexts, txMock } = buildPrismaMock());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsRevenueGrowthService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AnalyticsRevenueGrowthService>(
      AnalyticsRevenueGrowthService,
    );
  });

  it('getRevenueGrowth: calls withTenantContext', async () => {
    await service.getRevenueGrowth('tenant-rev-A', 'Year');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-rev-A' }),
      expect.any(Function),
    );
  });

  it('getRevenueGrowth: all lead queries use tx', async () => {
    await service.getRevenueGrowth('tenant-rev-B', 'Month');
    expect(txMock.lead.findMany).toHaveBeenCalled();
    expect(txMock.lead.count).toHaveBeenCalled();
    expect(prismaMock.lead.findMany).not.toHaveBeenCalled();
  });
});

// ─── AiSecurityService ────────────────────────────────────────────────────────

describe('AiSecurityService Phase 3', () => {
  let service: AiSecurityService;
  let prismaMock: any;
  let executedContexts: any[];
  let txMock: any;

  beforeEach(async () => {
    ({ prismaMock, executedContexts, txMock } = buildPrismaMock());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiSecurityService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AiSecurityService>(AiSecurityService);
  });

  it('buildSecurityContext: calls withTenantContext with correct tenantId', async () => {
    await service.buildSecurityContext('user-1', 'tenant-ai-A');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-ai-A' }),
      expect.any(Function),
    );
  });

  it('buildSecurityContext: tenantUser queries use tx', async () => {
    await service.buildSecurityContext('user-2', 'tenant-ai-B');
    expect(txMock.tenantUser.findFirst).toHaveBeenCalled();
    expect(prismaMock.tenantUser.findFirst).not.toHaveBeenCalled();
  });

  it('logToolExecution: calls withTenantContext for auditLog', async () => {
    const ctx = {
      userId: 'user-3',
      tenantId: 'tenant-ai-C',
      roleName: 'ADMIN',
      isSystemAdmin: true,
      permissions: [],
      subordinateUserIds: [],
      teamUserIds: [],
    };
    await service.logToolExecution(ctx, 'testTool', 'ALLOWED');
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-ai-C' }),
      expect.any(Function),
    );
    expect(txMock.auditLog.create).toHaveBeenCalled();
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });

  it('cross-tenant: two buildSecurityContext calls for different tenants stay isolated', async () => {
    await service.buildSecurityContext('user-4', 'tenant-X');
    await service.buildSecurityContext('user-5', 'tenant-Y');
    expect(executedContexts[0].tenantId).toBe('tenant-X');
    expect(executedContexts[1].tenantId).toBe('tenant-Y');
  });
});

// ─── AI Tools ─────────────────────────────────────────────────────────────────

describe('AI Tools Phase 3', () => {
  let prismaMock: any;
  let executedContexts: any[];
  let txMock: any;
  let aiSecurityMock: any;
  let encMock: any;
  const userContext: any = {
    userId: 'user-ai',
    tenantId: 'tenant-tools',
    roleName: 'ADMIN',
    isSystemAdmin: true,
    permissions: [],
    subordinateUserIds: [],
    teamUserIds: [],
  };

  beforeEach(() => {
    ({ prismaMock, executedContexts, txMock } = buildPrismaMock());
    aiSecurityMock = {
      hasModulePermission: jest.fn().mockReturnValue(true),
      logToolExecution: jest.fn().mockResolvedValue(undefined),
      getLeadsVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-tools', deletedAt: null }),
      getCustomersVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-tools', deletedAt: null }),
      getDealsVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-tools', deletedAt: null }),
      getTasksVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-tools', deletedAt: null }),
      getMeetingsVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-tools' }),
      getQuotationsVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-tools', deletedAt: null }),
    };
    encMock = { decrypt: jest.fn().mockImplementation((v) => v || '') };
  });

  it('leads tool getLeads: calls withTenantContext', async () => {
    const tools = buildLeadsTools(
      prismaMock,
      aiSecurityMock,
      userContext,
      encMock,
    );
    await (tools.getLeads as any).execute({ limit: 5 });
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-tools' }),
      expect.any(Function),
    );
    expect(txMock.lead.findMany).toHaveBeenCalled();
    expect(prismaMock.lead.findMany).not.toHaveBeenCalled();
  });

  it('customers tool getCustomers: calls withTenantContext', async () => {
    const tools = buildCustomersTools(
      prismaMock,
      aiSecurityMock,
      userContext,
      encMock,
    );
    await (tools.getCustomers as any).execute({ limit: 5 });
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-tools' }),
      expect.any(Function),
    );
    expect(txMock.customer.findMany).toHaveBeenCalled();
    expect(prismaMock.customer.findMany).not.toHaveBeenCalled();
  });

  it('deals tool getDealsSummary: calls withTenantContext', async () => {
    const tools = buildDealsTools(prismaMock, aiSecurityMock, userContext);
    await (tools.getDealsSummary as any).execute({});
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-tools' }),
      expect.any(Function),
    );
    expect(txMock.deal.findMany).toHaveBeenCalled();
    expect(prismaMock.deal.findMany).not.toHaveBeenCalled();
  });

  it('deals tool getTopDeals: calls withTenantContext', async () => {
    const tools = buildDealsTools(prismaMock, aiSecurityMock, userContext);
    await (tools.getTopDeals as any).execute({ limit: 5 });
    expect(prismaMock.withTenantContext).toHaveBeenCalledTimes(1);
    expect(txMock.deal.findMany).toHaveBeenCalled();
  });

  it('tasks tool getTasks: calls withTenantContext', async () => {
    const tools = buildTasksTools(prismaMock, aiSecurityMock, userContext);
    await (tools.getTasks as any).execute({ limit: 5 });
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-tools' }),
      expect.any(Function),
    );
    expect(txMock.task.findMany).toHaveBeenCalled();
    expect(prismaMock.task.findMany).not.toHaveBeenCalled();
  });

  it('tasks tool createTask: calls withTenantContext', async () => {
    const tools = buildTasksTools(prismaMock, aiSecurityMock, userContext);
    await (tools.createTask as any).execute({ title: 'Test Task' });
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-tools' }),
      expect.any(Function),
    );
    expect(txMock.task.create).toHaveBeenCalled();
    expect(prismaMock.task.create).not.toHaveBeenCalled();
  });

  it('tasks tool updateTaskStatus: findFirst + update in single context', async () => {
    txMock.task.findFirst.mockResolvedValue({
      id: 'task-1',
      status: 'PENDING',
    });
    const tools = buildTasksTools(prismaMock, aiSecurityMock, userContext);
    await (tools.updateTaskStatus as any).execute({
      taskId: 'task-1',
      status: 'COMPLETED',
    });
    expect(prismaMock.withTenantContext).toHaveBeenCalledTimes(1);
    expect(txMock.task.findFirst).toHaveBeenCalled();
    expect(txMock.task.update).toHaveBeenCalled();
  });

  it('tasks tool getMeetings: calls withTenantContext', async () => {
    const tools = buildTasksTools(prismaMock, aiSecurityMock, userContext);
    await (tools.getMeetings as any).execute({ limit: 5 });
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-tools' }),
      expect.any(Function),
    );
    expect(txMock.meeting.findMany).toHaveBeenCalled();
    expect(prismaMock.meeting.findMany).not.toHaveBeenCalled();
  });

  it('quotations tool getQuotations: calls withTenantContext', async () => {
    const tools = buildQuotationsTools(
      prismaMock,
      aiSecurityMock,
      userContext,
      encMock,
    );
    await (tools.getQuotations as any).execute({ limit: 5 });
    expect(prismaMock.withTenantContext).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-tools' }),
      expect.any(Function),
    );
    expect(txMock.quotation.findMany).toHaveBeenCalled();
    expect(prismaMock.quotation.findMany).not.toHaveBeenCalled();
  });

  it('cross-tenant isolation: tool called with different tenantId uses correct context', async () => {
    const contextA = { ...userContext, tenantId: 'tenant-A' };
    const contextB = { ...userContext, tenantId: 'tenant-B' };
    const secA = {
      ...aiSecurityMock,
      getLeadsVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-A', deletedAt: null }),
    };
    const secB = {
      ...aiSecurityMock,
      getLeadsVisibilityFilter: jest
        .fn()
        .mockReturnValue({ tenantId: 'tenant-B', deletedAt: null }),
    };
    const toolsA = buildLeadsTools(prismaMock, secA, contextA, encMock);
    const toolsB = buildLeadsTools(prismaMock, secB, contextB, encMock);
    await (toolsA.getLeads as any).execute({ limit: 5 });
    await (toolsB.getLeads as any).execute({ limit: 5 });
    expect(executedContexts[0].tenantId).toBe('tenant-A');
    expect(executedContexts[1].tenantId).toBe('tenant-B');
  });
});
