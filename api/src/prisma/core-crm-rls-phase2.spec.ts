import { PrismaService } from './prisma.service';
import { LeadsService } from '../leads/services/leads.service';
import { LeadsQueryService } from '../leads/services/leads.query.service';
import { LeadsConvertService } from '../leads/services/leads.convert.service';
import { CustomersService } from '../customers/customers.service';
import { ContactsService } from '../contacts/contacts.service';
import { DealsService } from '../deals/services/deals.service';
import { PipelineService } from '../deals/services/pipeline.service';
import { TasksService } from '../activities/services/tasks.service';
import { MeetingsService } from '../activities/services/meetings.service';
import { CalendarService } from '../activities/services/calendar.service';
import { InvoicesService } from '../finance/services/invoices.service';
import { QuotationsService } from '../finance/services/quotations.service';
import { RevenueService } from '../finance/services/revenue.service';
import { EmployeesService } from '../admin/services/employees.service';
import { RolesService } from '../admin/services/roles.service';
import { DepartmentsService } from '../admin/services/departments.service';
import { SettingsService } from '../workspace/services/settings.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';

describe('Core CRM Services RLS Phase 2 - Tenant Context Integration & Isolation', () => {
  jest.setTimeout(30000);
  let prismaService: PrismaService;
  let enc: EncryptionService;
  let executedSqlConfigs: Array<{ tenant: string; isSuperAdmin: string }>;

  beforeEach(() => {
    executedSqlConfigs = [];

    const mockConfigService = {
      get: jest.fn((k: string) => {
        if (k === 'FIELD_ENCRYPTION_KEY') {
          return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        }
        return '';
      }),
    } as any;
    enc = new EncryptionService(mockConfigService);
    enc.onModuleInit();

    prismaService = new PrismaService();

    // Mock $transaction to record set_config calls and simulate tenant context
    jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
      let currentTenant = '';
      let isSuperAdmin = 'false';

      const mockTx: any = {
        $executeRaw: jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
          const sql = strings.join('?');
          if (sql.includes("set_config('app.current_tenant_id'")) {
            currentTenant = values[0];
          }
          if (sql.includes("set_config('app.is_super_admin'")) {
            isSuperAdmin = values[0];
            executedSqlConfigs.push({ tenant: currentTenant, isSuperAdmin });
          }
          return Promise.resolve(1);
        }),
        $queryRaw: jest.fn().mockResolvedValue([{ current: 1 }]),
        lead: {
          findMany: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve([]);
            return Promise.resolve([
              {
                id: 'lead-1',
                name: enc.encrypt('Lead 1'),
                company: enc.encrypt('Acme Corp'),
                email: enc.encrypt('lead1@acme.com'),
                phone: enc.encrypt('1234567890'),
                value: 1000,
                stage: 'NEW',
                tenantId: 'tenant-a',
                meetings: [],
                _count: { notes: 0, meetings: 0 },
              },
            ]);
          }),
          count: jest.fn().mockImplementation(() => Promise.resolve(currentTenant === 'tenant-a' ? 1 : 0)),
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where.id || 'lead-1',
              tenantId: 'tenant-a',
              name: enc.encrypt('Lead 1'),
              company: enc.encrypt('Acme Corp'),
              email: enc.encrypt('lead1@acme.com'),
              stage: 'NEW',
              value: 1000,
              customerId: null,
              isConverted: false,
            });
          }),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({
              id: 'new-lead-id',
              ...data,
              tenantId: currentTenant,
            }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) => {
            if (currentTenant !== 'tenant-a') {
              return Promise.resolve(null);
            }
            return Promise.resolve({
              id: where.id,
              tenantId: currentTenant,
              ...data,
            });
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          aggregate: jest.fn().mockResolvedValue({ _sum: { value: 5000 } }),
        },
        customer: {
          findFirst: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where?.id || 'cust-1',
              name: enc.encrypt('Customer 1'),
              company: enc.encrypt('Customer Corp'),
              email: enc.encrypt('cust@corp.com'),
              companyId: 'comp-1',
              tenantId: 'tenant-a',
            });
          }),
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where?.id || 'cust-1',
              name: enc.encrypt('Customer 1'),
              company: enc.encrypt('Customer Corp'),
              email: enc.encrypt('cust@corp.com'),
              companyId: 'comp-1',
              tenantId: 'tenant-a',
            });
          }),
          findMany: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve([]);
            return Promise.resolve([
              {
                id: 'cust-1',
                name: enc.encrypt('Customer 1'),
                company: enc.encrypt('Customer Corp'),
                email: enc.encrypt('cust@corp.com'),
                tenantId: 'tenant-a',
                deals: [],
                _count: { deals: 0 },
              },
            ]);
          }),
          count: jest.fn().mockImplementation(() => Promise.resolve(currentTenant === 'tenant-a' ? 1 : 0)),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'cust-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({ id: where.id, ...data, tenantId: currentTenant });
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        deal: {
          findMany: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve([]);
            return Promise.resolve([
              {
                id: 'deal-1',
                name: 'Deal 1',
                value: 5000,
                stage: 'NEW',
                probability: 20,
                tenantId: 'tenant-a',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]);
          }),
          findFirst: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where.id,
              name: 'Deal 1',
              tenantId: 'tenant-a',
              stage: 'NEW',
              value: 5000,
            });
          }),
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where.id,
              name: 'Deal 1',
              tenantId: 'tenant-a',
              stage: 'NEW',
              value: 5000,
            });
          }),
          count: jest.fn().mockImplementation(() => Promise.resolve(currentTenant === 'tenant-a' ? 1 : 0)),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'deal-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({ id: where.id, ...data, tenantId: currentTenant });
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        task: {
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where.id,
              title: 'Task 1',
              tenantId: 'tenant-a',
              assignedToId: 'user-1',
              status: 'PENDING',
              deletedAt: null,
            });
          }),
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'task-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({ id: where.id, ...data, tenantId: currentTenant }),
          ),
        },
        meeting: {
          findFirst: jest.fn().mockResolvedValue(null),
          findUnique: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where.id,
              title: 'Meeting 1',
              tenantId: 'tenant-a',
              ownerId: 'user-1',
              assignedToId: 'user-1',
              startTime: new Date(),
              endTime: new Date(),
              status: 'SCHEDULED',
            });
          }),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'mtg-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({ id: where.id, ...data, tenantId: currentTenant }),
          ),
        },
        invoice: {
          findFirst: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where.id,
              tenantId: 'tenant-a',
              invoiceNumber: 'INV-0001',
              amount: 500,
              status: 'DRAFT',
            });
          }),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          groupBy: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'inv-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({ id: where.id, ...data, tenantId: currentTenant }),
          ),
          delete: jest.fn().mockResolvedValue({ id: 'inv-1' }),
        },
        quotation: {
          findFirst: jest.fn().mockImplementation(({ where }) => {
            if (currentTenant !== 'tenant-a') return Promise.resolve(null);
            return Promise.resolve({
              id: where.id,
              tenantId: 'tenant-a',
              quoteNumber: 'QT-0001',
              client: enc.encrypt('Client 1'),
              notes: enc.encrypt('Notes'),
              amount: 500,
              status: 'DRAFT',
            });
          }),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          groupBy: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'qt-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({ id: where.id, ...data, tenantId: currentTenant }),
          ),
        },
        revenueTarget: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'rt-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({ id: where.id, ...data, tenantId: currentTenant }),
          ),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          delete: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        },
        role: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'role-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({ id: where.id, ...data, tenantId: currentTenant }),
          ),
          delete: jest.fn().mockResolvedValue({ id: 'role-1' }),
        },
        rolePermission: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        department: {
          findMany: jest.fn().mockResolvedValue([]),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({ id: 'dept-1', ...data, tenantId: currentTenant }),
          ),
          update: jest.fn().mockImplementation(({ where, data }) =>
            Promise.resolve({ id: where.id, ...data, tenantId: currentTenant }),
          ),
          delete: jest.fn().mockResolvedValue({ id: 'dept-1' }),
        },
        tenantAiConfig: {
          findUnique: jest.fn().mockResolvedValue({
            tenantId: currentTenant,
            isAiEnabled: true,
            useRag: true,
            useTools: true,
          }),
          upsert: jest.fn().mockResolvedValue({ tenantId: currentTenant }),
        },
        tenantUser: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(1),
          upsert: jest.fn().mockResolvedValue({ id: 'tu-1' }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          delete: jest.fn().mockResolvedValue({ id: 'tu-1' }),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(1),
          create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'user-1', ...data })),
          update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
          delete: jest.fn().mockResolvedValue({ id: 'user-1' }),
        },
        invitation: {
          upsert: jest.fn().mockResolvedValue({
            id: 'inv-1',
            email: 'test@example.com',
            createdAt: new Date(),
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        timelineEvent: {
          create: jest.fn().mockResolvedValue({ id: 'te-1' }),
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
          findMany: jest.fn().mockResolvedValue([]),
        },
        attachment: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue({ id: 'att-1' }),
        },
        note: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue({ id: 'note-1', message: enc.encrypt('Note') }),
        },
        auditLog: {
          create: jest.fn().mockResolvedValue({ id: 'al-1' }),
        },
        company: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'comp-1' }),
        },
        tenantInvoiceSettings: {
          findUnique: jest.fn().mockResolvedValue({ defaultTaxRate: 18, state: 'Karnataka' }),
        },
        tenant: {
          findUnique: jest.fn().mockResolvedValue({ id: 'tenant-a', name: 'Tenant A', currency: 'INR' }),
        },
      };

      return callback(mockTx);
    });

    (prismaService as any).tenant = {
      findUnique: jest.fn().mockResolvedValue({ id: 'tenant-a', currency: 'INR' }),
    };
  });

  describe('1. Leads Services (LeadsService, Query, Convert)', () => {
    it('executes CRUD inside Tenant A context with proper set_config and prevents Tenant B access', async () => {
      const queryService = new LeadsQueryService(prismaService, enc);
      const convertService = new LeadsConvertService(prismaService, enc);
      const service = new LeadsService(prismaService, queryService, convertService, enc);

      // Create lead in Tenant A
      const lead = await service.createLead('tenant-a', 'user-1', {
        name: 'John Doe',
        company: 'Acme',
        email: 'john@acme.com',
      } as any);

      expect(lead).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      // Tenant A can query leads
      const resA = await service.getLeads('tenant-a', {});
      expect(resA.leads).toHaveLength(1);
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      // Tenant B queries in Tenant B context
      const resB = await service.getLeads('tenant-b', {});
      expect(resB.leads).toHaveLength(0); // Cannot see Tenant A data
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-b');
    });
  });

  describe('2. Customers & Contacts Services', () => {
    it('executes CustomersService and ContactsService inside isolated tenant context', async () => {
      const customersService = new CustomersService(prismaService, enc);
      const contactsService = new ContactsService(prismaService, enc);

      await customersService.createCustomer('tenant-a', 'user-1', {
        name: 'Jane Customer',
        company: 'Customer Co',
      });
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const contactsA = await contactsService.getCustomers('tenant-a', {});
      expect(contactsA.customers).toHaveLength(1);
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const contactsB = await contactsService.getCustomers('tenant-b', {});
      expect(contactsB.customers).toHaveLength(0);
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-b');
    });
  });

  describe('3. Deals & Pipeline Services', () => {
    it('executes DealsService and PipelineService inside isolated tenant context', async () => {
      const dealsService = new DealsService(prismaService);
      const pipelineService = new PipelineService(prismaService);

      await dealsService.createDeal('tenant-a', 'user-1', {
        name: 'Big Deal',
        value: 10000,
      } as any);
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const pipelineA = await pipelineService.getPipeline('tenant-a');
      expect(pipelineA.stats).toBeDefined();
      expect(pipelineA.items).toHaveLength(1);
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const pipelineB = await pipelineService.getPipeline('tenant-b');
      expect(pipelineB.items).toHaveLength(0);
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-b');
    });
  });

  describe('4. Activities Services (Tasks, Meetings, Calendar)', () => {
    it('executes TasksService, MeetingsService, and CalendarService inside isolated tenant context', async () => {
      const tasksService = new TasksService(prismaService);
      const meetingsService = new MeetingsService(prismaService, enc);
      const calendarService = new CalendarService(prismaService);

      const task = await tasksService.createTask('tenant-a', 'user-1', {
        title: 'Call Client',
        dueDate: new Date().toISOString(),
      } as any);
      expect(task).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const meeting = await meetingsService.createMeeting('tenant-a', { id: 'user-1' }, {
        title: 'Strategy Meeting',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
      } as any);
      expect(meeting).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const calendar = await calendarService.getCalendarEvents(
        'tenant-a',
        { id: 'user-1', role: 'ADMIN' },
        new Date().toISOString(),
        new Date(Date.now() + 86400000).toISOString(),
      );
      expect(calendar).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');
    });
  });

  describe('5. Finance Services (Invoices, Quotations, Revenue)', () => {
    it('executes InvoicesService, QuotationsService, and RevenueService in tenant context', async () => {
      const invoicesService = new InvoicesService(prismaService);
      const quotationsService = new QuotationsService(prismaService, enc);
      const revenueService = new RevenueService(prismaService);

      const inv = await invoicesService.createInvoice('tenant-a', 'user-1', {
        customerId: 'cust-1',
        amount: 2500,
      } as any);
      expect(inv).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const quote = await quotationsService.createQuotation('tenant-a', {
        client: 'Client ABC',
        amount: 3000,
      } as any);
      expect(quote).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const target = await revenueService.createRevenueTarget('tenant-a', {
        value: 50000,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      } as any);
      expect(target).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');
    });
  });

  describe('6. Admin Services (Employees, Roles, Departments)', () => {
    it('executes EmployeesService, RolesService, and DepartmentsService in tenant context', async () => {
      const mockConfigService = { get: jest.fn().mockReturnValue('') } as any;
      const employeesService = new EmployeesService(prismaService, mockConfigService);
      const rolesService = new RolesService(prismaService);
      const departmentsService = new DepartmentsService(prismaService);

      const emp = await employeesService.inviteEmployee('tenant-a', 'emp@tenant.com', 'SALES');
      expect(emp).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const role = await rolesService.createRole('tenant-a', 'user-1', 'ADMIN', {
        name: 'Account Manager',
      });
      expect(role).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const dept = await departmentsService.createDepartment('tenant-a', 'user-1', 'Engineering');
      expect(dept).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');
    });
  });

  describe('7. Workspace SettingsService', () => {
    it('executes SettingsService inside tenant context', async () => {
      const settingsService = new SettingsService(prismaService, enc);

      const settings = await settingsService.getAiSettings('tenant-a');
      expect(settings).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');

      const updated = await settingsService.updateAiSettings('tenant-a', {
        isAiEnabled: true,
        model: 'gemini-2.0-flash',
      });
      expect(updated).toBeDefined();
      expect(executedSqlConfigs[executedSqlConfigs.length - 1].tenant).toBe('tenant-a');
    });
  });
});
