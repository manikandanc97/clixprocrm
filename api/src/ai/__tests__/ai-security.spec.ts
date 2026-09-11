import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest
    .fn()
    .mockReturnValue((model: string) => ({ model })),
}));

jest.mock('ai', () => ({
  tool: (config: any) => config,
  streamText: jest.fn(),
  generateText: jest.fn(),
  convertToModelMessages: jest.fn(),
  isStepCount: jest.fn(),
}));

import { AiSecurityService, UserSecurityContext } from '../ai-security.service';
import { AiService } from '../ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';
import { PERMISSION_MODULES } from '../../common/role-permissions.constants';

describe('AI Chatbot Enterprise RBAC & Data Access Security Audit Suite', () => {
  let securityService: AiSecurityService;
  let aiService: AiService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      tenantUser: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      deal: {
        findMany: jest.fn(),
      },
      lead: {
        findMany: jest.fn(),
      },
      customer: {
        findMany: jest.fn(),
      },
      task: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      meeting: {
        findMany: jest.fn(),
      },
      quotation: {
        findMany: jest.fn(),
      },
      tenantAiConfig: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      withTenantContext: jest.fn(
        async (opts: any, cb: (tx: any) => Promise<any>) => cb(prismaMock),
      ),
    };

    const encryptionMock = {
      encrypt: jest.fn((v) => (v ? `enc_${v}` : null)),
      decrypt: jest.fn((v) =>
        v && typeof v === 'string' && v.startsWith('enc_')
          ? v.replace('enc_', '')
          : v,
      ),
      decryptFields: jest.fn((obj, fields) => obj),
      decryptMany: jest.fn((arr, fields) => arr),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiSecurityService,
        AiService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EncryptionService, useValue: encryptionMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-gemini-key'),
          },
        },
      ],
    }).compile();

    securityService = module.get<AiSecurityService>(AiSecurityService);
    aiService = module.get<AiService>(AiService);
  });

  describe('1. Security Context & Hierarchy Resolution', () => {
    it('should build full admin security context with isSystemAdmin=true', async () => {
      prismaMock.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-admin',
        userId: 'admin-1',
        tenantId: 'tenant-a',
        role: {
          name: 'ADMIN',
          isSystem: true,
          permissions: [],
        },
      });

      const ctx = await securityService.buildSecurityContext(
        'admin-1',
        'tenant-a',
      );
      expect(ctx.isSystemAdmin).toBe(true);
      expect(ctx.roleName).toBe('ADMIN');
      expect(ctx.tenantId).toBe('tenant-a');
    });

    it('should resolve manager subordinates and team user IDs', async () => {
      prismaMock.tenantUser.findFirst.mockResolvedValue({
        id: 'tu-mgr',
        userId: 'mgr-1',
        tenantId: 'tenant-a',
        departmentId: 'dept-sales',
        role: {
          name: 'MANAGER',
          isSystem: false,
          permissions: [
            { module: 'Leads', hasAccess: true },
            { module: 'Deals', hasAccess: true },
          ],
        },
      });

      prismaMock.tenantUser.findMany
        .mockResolvedValueOnce([{ userId: 'emp-1' }, { userId: 'emp-2' }]) // subordinates
        .mockResolvedValueOnce([
          { userId: 'mgr-1' },
          { userId: 'emp-1' },
          { userId: 'emp-2' },
        ]); // team members

      const ctx = await securityService.buildSecurityContext(
        'mgr-1',
        'tenant-a',
      );
      expect(ctx.isSystemAdmin).toBe(false);
      expect(ctx.roleName).toBe('MANAGER');
      expect(ctx.subordinateUserIds).toEqual(['emp-1', 'emp-2']);
      expect(ctx.teamUserIds).toEqual(['mgr-1', 'emp-1', 'emp-2']);
    });
  });

  describe('2. Module Permission Enforcement', () => {
    const employeeContext: UserSecurityContext = {
      userId: 'emp-1',
      tenantId: 'tenant-a',
      roleName: 'EMPLOYEE',
      isSystemAdmin: false,
      permissions: [
        { module: 'Tasks', hasAccess: true },
        { module: 'Calendar', hasAccess: true },
        { module: 'Leads', hasAccess: false },
      ],
      departmentId: 'dept-1',
      subordinateUserIds: [],
      teamUserIds: ['emp-1', 'emp-2'],
    };

    it('should allow granted modules', () => {
      expect(
        securityService.hasModulePermission(
          employeeContext,
          PERMISSION_MODULES.TASKS,
        ),
      ).toBe(true);
      expect(
        securityService.hasModulePermission(
          employeeContext,
          PERMISSION_MODULES.CALENDAR,
        ),
      ).toBe(true);
    });

    it('should reject ungranted or false modules', () => {
      expect(
        securityService.hasModulePermission(
          employeeContext,
          PERMISSION_MODULES.LEADS,
        ),
      ).toBe(false);
      expect(
        securityService.hasModulePermission(
          employeeContext,
          PERMISSION_MODULES.DEALS,
        ),
      ).toBe(false);
      expect(
        securityService.hasModulePermission(
          employeeContext,
          PERMISSION_MODULES.REPORTS,
        ),
      ).toBe(false);
    });

    it('should always allow System Admins even without explicit permission records', () => {
      const adminContext: UserSecurityContext = {
        userId: 'admin-1',
        tenantId: 'tenant-a',
        roleName: 'ADMIN',
        isSystemAdmin: true,
        permissions: [],
        departmentId: null,
        subordinateUserIds: [],
        teamUserIds: [],
      };
      expect(
        securityService.hasModulePermission(
          adminContext,
          PERMISSION_MODULES.REPORTS,
        ),
      ).toBe(true);
      expect(
        securityService.hasModulePermission(
          adminContext,
          PERMISSION_MODULES.DEALS,
        ),
      ).toBe(true);
    });
  });

  describe('3. Record-Level Visibility Scoping', () => {
    it('Employee visibility: Deals filter must strictly isolate to ownerId == userId', () => {
      const empCtx: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [{ module: 'Deals', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: [],
      };
      const filter = securityService.getDealsVisibilityFilter(empCtx);
      expect(filter).toEqual({
        tenantId: 'tenant-a',
        deletedAt: null,
        ownerId: 'emp-1',
      });
    });

    it('Manager visibility: Deals filter includes self and subordinates', () => {
      const mgrCtx: UserSecurityContext = {
        userId: 'mgr-1',
        tenantId: 'tenant-a',
        roleName: 'MANAGER',
        isSystemAdmin: false,
        permissions: [{ module: 'Deals', hasAccess: true }],
        subordinateUserIds: ['emp-1', 'emp-2'],
        teamUserIds: [],
      };
      const filter = securityService.getDealsVisibilityFilter(mgrCtx);
      expect(filter).toEqual({
        tenantId: 'tenant-a',
        deletedAt: null,
        ownerId: { in: ['mgr-1', 'emp-1', 'emp-2'] },
      });
    });

    it('Task visibility: Never exposes private tasks of other users to an Employee', () => {
      const empCtx: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [{ module: 'Tasks', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: ['emp-1', 'emp-2'],
      };
      const filter = securityService.getTasksVisibilityFilter(empCtx);
      expect(filter.tenantId).toBe('tenant-a');
      expect(filter.OR).toEqual(
        expect.arrayContaining([
          { assignedToId: { in: ['emp-1'] } },
          { createdById: { in: ['emp-1'] } },
          { visibility: 'ORGANIZATION' },
        ]),
      );
    });
  });

  describe('4. AI Tool Execution Authorization & Indirect Leakage Protection', () => {
    it('getDealsSummary rejects Employee if Deals permission is missing', async () => {
      const empNoDeals: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [{ module: 'Tasks', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      const tools = aiService.getAuthorizedTools(empNoDeals);
      const result = await tools.getDealsSummary.execute({});

      expect(result.error).toBe('ACCESS_DENIED');
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'AI_TOOL:getDealsSummary',
            details: expect.objectContaining({ status: 'DENIED' }),
          }),
        }),
      );
    });

    it('getDealsSummary calculates revenue ONLY from deals visible to the user', async () => {
      const empWithDeals: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [{ module: 'Deals', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      prismaMock.deal.findMany.mockResolvedValue([
        { id: 'd-1', value: 10000, stage: 'WON' },
        { id: 'd-2', value: 5000, stage: 'PROPOSAL' },
      ]);

      const tools = aiService.getAuthorizedTools(empWithDeals);
      const result = await tools.getDealsSummary.execute({});

      expect(prismaMock.deal.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: 'tenant-a',
          ownerId: 'emp-1',
        }),
        select: expect.any(Object),
      });

      expect(result.totalDeals).toBe(2);
      expect(result.pipelineValue).toBe(15000);
      expect(result.wonRevenue).toBe(10000);
      expect(result.wonDealsCount).toBe(1);
    });

    it('getLeads tool enforces Leads module permission', async () => {
      const empNoLeads: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      const tools = aiService.getAuthorizedTools(empNoLeads);
      const result = await tools.getLeads.execute({});
      expect(result.error).toBe('ACCESS_DENIED');
    });

    it('getLeads tool returns sanitized leads when authorized', async () => {
      const authorizedUser: UserSecurityContext = {
        userId: 'sales-1',
        tenantId: 'tenant-a',
        roleName: 'SALES',
        isSystemAdmin: false,
        permissions: [{ module: 'Leads', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      prismaMock.lead.findMany.mockResolvedValue([
        {
          id: 'lead-1',
          name: 'Acme Corp Lead',
          company: 'Acme Corp',
          email: 'lead@acme.com',
          phone: '1234567890',
          value: 50000,
          priority: 'HIGH',
          stage: 'NEW',
          isConverted: false,
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const tools = aiService.getAuthorizedTools(authorizedUser);
      const result = await tools.getLeads.execute({});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Acme Corp Lead');
      expect(result[0].value).toBe(50000);
      expect(result[0].password).toBeUndefined();
    });

    it('createTask rejects unauthorized assignee for non-admin', async () => {
      const empContext: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [{ module: 'Tasks', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: ['emp-1'],
      };

      const tools = aiService.getAuthorizedTools(empContext);
      const result = await tools.createTask.execute({
        title: 'Unauthorized Task',
        assignedToId: 'other-user-outside-team',
      });

      expect(result.error).toBe('ACCESS_DENIED');
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });

    it('createTask creates task with tenantId and createdById set to current user', async () => {
      const empContext: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [{ module: 'Tasks', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: ['emp-1'],
      };

      prismaMock.task.create.mockResolvedValue({
        id: 'task-new',
        title: 'Follow up call',
        priority: 'MEDIUM',
        status: 'PENDING',
        visibility: 'PRIVATE',
        dueDate: null,
        createdAt: new Date(),
      });

      const tools = aiService.getAuthorizedTools(empContext);
      const result = await tools.createTask.execute({
        title: 'Follow up call',
      });

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-a',
          createdById: 'emp-1',
          assignedToId: 'emp-1',
          title: 'Follow up call',
        }),
        select: expect.any(Object),
      });

      expect(result.success).toBe(true);
    });

    it('updateTaskStatus refuses update if task is not visible to user', async () => {
      const empContext: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [{ module: 'Tasks', hasAccess: true }],
        subordinateUserIds: [],
        teamUserIds: ['emp-1'],
      };

      prismaMock.task.findFirst.mockResolvedValue(null); // Not visible

      const tools = aiService.getAuthorizedTools(empContext);
      const result = await tools.updateTaskStatus.execute({
        taskId: 'private-task-of-boss',
        status: 'COMPLETED',
      });

      expect(result.error).toBe('NOT_FOUND_OR_DENIED');
      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('getCustomers tool enforces Contacts/Companies/Dashboard module permission', async () => {
      const empNoContacts: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      const tools = aiService.getAuthorizedTools(empNoContacts);
      const result = await tools.getCustomers.execute({});
      expect(result.error).toBe('ACCESS_DENIED');
    });

    it('getMeetings tool enforces Calendar module permission and visibility', async () => {
      const empNoCal: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      const tools = aiService.getAuthorizedTools(empNoCal);
      const result = await tools.getMeetings.execute({});
      expect(result.error).toBe('ACCESS_DENIED');
    });

    it('getQuotations tool enforces Quotations module permission and visibility', async () => {
      const empNoQuotes: UserSecurityContext = {
        userId: 'emp-1',
        tenantId: 'tenant-a',
        roleName: 'EMPLOYEE',
        isSystemAdmin: false,
        permissions: [],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      const tools = aiService.getAuthorizedTools(empNoQuotes);
      const result = await tools.getQuotations.execute({});
      expect(result.error).toBe('ACCESS_DENIED');
    });
  });

  describe('5. Cross-Tenant Isolation Guarantee', () => {
    it('Tenant A user querying tools only ever issues queries scoped to Tenant A', async () => {
      const tenantAUser: UserSecurityContext = {
        userId: 'user-a',
        tenantId: 'tenant-a-uuid',
        roleName: 'ADMIN',
        isSystemAdmin: true,
        permissions: [],
        subordinateUserIds: [],
        teamUserIds: [],
      };

      prismaMock.deal.findMany.mockResolvedValue([]);
      prismaMock.lead.findMany.mockResolvedValue([]);
      prismaMock.customer.findMany.mockResolvedValue([]);

      const tools = aiService.getAuthorizedTools(tenantAUser);
      await tools.getDealsSummary.execute({});
      await tools.getLeads.execute({});
      await tools.getCustomers.execute({});

      expect(prismaMock.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-a-uuid' }),
        }),
      );
      expect(prismaMock.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-a-uuid' }),
        }),
      );
      expect(prismaMock.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-a-uuid' }),
        }),
      );
    });
  });
});
