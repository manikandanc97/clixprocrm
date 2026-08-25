import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('PostgreSQL Row-Level Security (RLS) - Stage 1 Architecture & Context Isolation', () => {
  let prismaService: PrismaService;
  let executedSqlQueries: Array<{ sql: string; values: any[] }>;

  beforeEach(() => {
    executedSqlQueries = [];

    prismaService = new PrismaService();

    // Mock $transaction and $executeRaw
    jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        $executeRaw: jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
          executedSqlQueries.push({
            sql: strings.join('?'),
            values,
          });
          return Promise.resolve(1);
        }),
      };
      return callback(mockTx);
    });
  });

  describe('1. Transaction-Local Tenant Context Propagation', () => {
    it('propagates tenantId using transaction-local set_config (is_local = true)', async () => {
      const tenantA = 'tenant-uuid-aaaa-1111';

      const result = await prismaService.withTenantContext(
        { tenantId: tenantA, isSuperAdmin: false },
        async (tx) => {
          return { status: 'success', tenant: tenantA };
        },
      );

      expect(result.status).toBe('success');
      expect(executedSqlQueries).toHaveLength(2);

      // Verify app.current_tenant_id is set with tenantA
      expect(executedSqlQueries[0].sql).toContain("set_config('app.current_tenant_id'");
      expect(executedSqlQueries[0].values).toContain(tenantA);

      // Verify is_super_admin is set to false
      expect(executedSqlQueries[1].sql).toContain("set_config('app.is_super_admin'");
      expect(executedSqlQueries[1].values).toContain('false');
    });

    it('propagates Super Admin bypass context only when explicitly authorized', async () => {
      await prismaService.withTenantContext(
        { isSuperAdmin: true },
        async (tx) => {
          return { role: 'SUPER_ADMIN' };
        },
      );

      expect(executedSqlQueries).toHaveLength(2);
      expect(executedSqlQueries[0].values).toContain('');
      expect(executedSqlQueries[1].values).toContain('true');
    });

    it('withCurrentTenantContext automatically uses active AsyncLocalStorage context', async () => {
      const mockTenantContextService = {
        getContext: jest.fn().mockReturnValue({
          tenantId: 'tenant-als-123',
          userId: 'user-als-456',
          isSuperAdmin: false,
        }),
      } as any;

      const prismaWithAls = new PrismaService(mockTenantContextService);
      jest.spyOn(prismaWithAls, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          $executeRaw: jest.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
            executedSqlQueries.push({
              sql: strings.join('?'),
              values,
            });
            return Promise.resolve(1);
          }),
        };
        return callback(mockTx);
      });

      const res = await prismaWithAls.withCurrentTenantContext(async (tx) => {
        return 'ALS_QUERY_SUCCESS';
      });

      expect(res).toBe('ALS_QUERY_SUCCESS');
      expect(executedSqlQueries[0].values).toContain('tenant-als-123');
      expect(executedSqlQueries[1].values).toContain('false');
      expect(executedSqlQueries[2].values).toContain('user-als-456');
    });

    it('withCurrentTenantContext throws explicit error when context is missing', async () => {
      const mockTenantContextService = {
        getContext: jest.fn().mockReturnValue(undefined),
      } as any;

      const prismaWithAls = new PrismaService(mockTenantContextService);
      await expect(
        prismaWithAls.withCurrentTenantContext(async () => 'FAIL'),
      ).rejects.toThrow('Tenant context missing');
    });
  });


  describe('2. Context Isolation Across Sequential & Concurrent Requests', () => {
    it('Tenant A request followed by Tenant B request receives distinct, isolated contexts', async () => {
      const tenantA = 'tenant-aaaa';
      const tenantB = 'tenant-bbbb';

      await prismaService.withTenantContext({ tenantId: tenantA }, async () => 'A_DONE');
      const queriesAfterA = [...executedSqlQueries];

      await prismaService.withTenantContext({ tenantId: tenantB }, async () => 'B_DONE');
      const queriesAfterB = [...executedSqlQueries];

      // Request A set tenantA
      expect(queriesAfterA[0].values).toContain(tenantA);
      // Request B set tenantB
      expect(queriesAfterB[2].values).toContain(tenantB);
      // Contexts are separate
      expect(queriesAfterB[2].values).not.toContain(tenantA);
    });

    it('simultaneous concurrent tenant requests maintain separate transaction contexts', async () => {
      const tenant1 = 'tenant-concurrent-1';
      const tenant2 = 'tenant-concurrent-2';

      const [res1, res2] = await Promise.all([
        prismaService.withTenantContext({ tenantId: tenant1 }, async () => `RES_${tenant1}`),
        prismaService.withTenantContext({ tenantId: tenant2 }, async () => `RES_${tenant2}`),
      ]);

      expect(res1).toBe('RES_tenant-concurrent-1');
      expect(res2).toBe('RES_tenant-concurrent-2');
    });
  });

  describe('3. Stage 1 Migration SQL Validation', () => {
    it('validates migration SQL contains all 23 direct and child tenant tables', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../prisma/migrations/20260820180500_stage1_enable_row_level_security/migration.sql',
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const migrationSql = fs.readFileSync(migrationPath, 'utf8');

      // Helper functions present
      expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION current_app_tenant()');
      expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION is_app_super_admin()');

      // Direct tenant tables
      const expectedDirectTables = [
        'Lead',
        'Customer',
        'Deal',
        'Task',
        'Meeting',
        'Quotation',
        'Invoice',
        'InvoiceCounter',
        'Note',
        'Attachment',
        'TimelineEvent',
        'Product',
        'RevenueTarget',
        'Notification',
        'TenantAiConfig',
        'AiConversation',
        'Document',
        'Company',
        'Role',
        'Department',
        'Invitation',
        'TenantUser',
      ];

      for (const table of expectedDirectTables) {
        expect(migrationSql).toContain(table);
      }

      // Child relational tables
      expect(migrationSql).toContain('ALTER TABLE "AiMessage" ENABLE ROW LEVEL SECURITY;');
      expect(migrationSql).toContain('ALTER TABLE "DocumentChunk" ENABLE ROW LEVEL SECURITY;');
      expect(migrationSql).toContain('ALTER TABLE "RolePermission" ENABLE ROW LEVEL SECURITY;');

      // Global tables must NOT have direct RLS in this migration
      expect(migrationSql).not.toContain('ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;');
      expect(migrationSql).not.toContain('ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;');
      expect(migrationSql).not.toContain('ALTER TABLE "PlatformModule" ENABLE ROW LEVEL SECURITY;');
      expect(migrationSql).not.toContain('ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;');

      // MUST NOT have FORCE ROW LEVEL SECURITY in Stage 1
      expect(migrationSql).not.toContain('FORCE ROW LEVEL SECURITY');
    });
  });

  describe('4. Stage 3 FORCE ROW LEVEL SECURITY Migration SQL Validation', () => {
    it('validates Stage 3 migration SQL enables FORCE ROW LEVEL SECURITY on all 25 tenant-scoped tables', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../prisma/migrations/20260820201500_stage3_force_row_level_security/migration.sql',
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const migrationSql = fs.readFileSync(migrationPath, 'utf8');

      const expectedForceTables = [
        'Lead',
        'Customer',
        'Deal',
        'Task',
        'Meeting',
        'Quotation',
        'Invoice',
        'InvoiceCounter',
        'Note',
        'Attachment',
        'TimelineEvent',
        'Product',
        'RevenueTarget',
        'Notification',
        'TenantAiConfig',
        'AiConversation',
        'AiMessage',
        'Document',
        'DocumentChunk',
        'Company',
        'Role',
        'RolePermission',
        'Department',
        'Invitation',
        'TenantUser',
      ];

      for (const table of expectedForceTables) {
        expect(migrationSql).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`);
      }

      // Ensure global tables do NOT have FORCE ROW LEVEL SECURITY
      expect(migrationSql).not.toContain('"Tenant"');
      expect(migrationSql).not.toContain('"User"');
      expect(migrationSql).not.toContain('"AuditLog"');
      expect(migrationSql).not.toContain('"PlatformModule"');
    });
  });
});

