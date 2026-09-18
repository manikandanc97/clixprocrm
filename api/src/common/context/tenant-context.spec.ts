import {
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SuperAdminGuard } from '../../auth/super-admin.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestTenantContext } from './tenant-context.interface';
import { TenantContextService } from './tenant-context.service';

describe('TenantContext & Guard Security Specifications', () => {
  let tenantContextService: TenantContextService;
  let prismaService: PrismaService;
  let tenantGuard: TenantGuard;
  let superAdminGuard: SuperAdminGuard;

  const mockPrismaService: any = {
    user: {
      findUnique: jest.fn(),
    },
    tenant: {
      findFirst: jest.fn(),
    },
    withTenantContext: jest.fn(
      async (opts: any, cb: (tx: any) => Promise<any>) => cb(mockPrismaService),
    ),
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextService,
        TenantGuard,
        SuperAdminGuard,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    tenantContextService =
      module.get<TenantContextService>(TenantContextService);
    prismaService = module.get<PrismaService>(PrismaService);
    tenantGuard = module.get<TenantGuard>(TenantGuard);
    superAdminGuard = module.get<SuperAdminGuard>(SuperAdminGuard);
  });

  // Helper to create mock ExecutionContext
  function createMockExecutionContext(req: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}) as any,
        getNext: () => ({}) as any,
      }),
      getType: () => 'http' as any,
      getClass: () => ({}) as any,
      getHandler: () => ({}) as any,
      getArgs: () => [] as any,
      getArgByIndex: () => ({}) as any,
      switchToRpc: () => ({}) as any,
      switchToWs: () => ({}) as any,
    };
  }

  // ─── 1. Tenant A & Tenant B Request Context Isolation ───────────────────────────

  it('should establish and isolate Tenant A request context', async () => {
    const contextA: RequestTenantContext = {
      tenantId: 'tenant-aaa-111',
      userId: 'user-aaa',
      isSuperAdmin: false,
      userRole: { name: 'EMPLOYEE' },
    };

    await tenantContextService.run(contextA, async () => {
      expect(tenantContextService.getTenantId()).toBe('tenant-aaa-111');
      expect(tenantContextService.getUserId()).toBe('user-aaa');
      expect(tenantContextService.isSuperAdmin()).toBe(false);
      expect(tenantContextService.getUserRole()).toEqual({ name: 'EMPLOYEE' });
    });
  });

  it('should establish and isolate Tenant B request context', async () => {
    const contextB: RequestTenantContext = {
      tenantId: 'tenant-bbb-222',
      userId: 'user-bbb',
      isSuperAdmin: false,
      userRole: { name: 'ADMIN' },
    };

    await tenantContextService.run(contextB, async () => {
      expect(tenantContextService.getTenantId()).toBe('tenant-bbb-222');
      expect(tenantContextService.getUserId()).toBe('user-bbb');
      expect(tenantContextService.isSuperAdmin()).toBe(false);
      expect(tenantContextService.getUserRole()).toEqual({ name: 'ADMIN' });
    });
  });

  // ─── 2. Concurrent Tenant A & B Requests (No Cross-Talk) ───────────────────────

  it('should maintain strict isolation between concurrent Tenant A and Tenant B requests across async ticks', async () => {
    const executionResults: string[] = [];

    const requestA = tenantContextService.run(
      { tenantId: 'tenant-A', userId: 'user-A', isSuperAdmin: false },
      async () => {
        // Step 1
        expect(tenantContextService.getTenantId()).toBe('tenant-A');
        executionResults.push(`A:start:${tenantContextService.getTenantId()}`);

        // Async delay to interleave execution with Request B
        await new Promise((resolve) => setTimeout(resolve, 30));

        // Step 2 (after delay)
        expect(tenantContextService.getTenantId()).toBe('tenant-A');
        expect(tenantContextService.getUserId()).toBe('user-A');
        executionResults.push(`A:end:${tenantContextService.getTenantId()}`);
        return 'RESULT_A';
      },
    );

    const requestB = tenantContextService.run(
      { tenantId: 'tenant-B', userId: 'user-B', isSuperAdmin: false },
      async () => {
        // Step 1
        expect(tenantContextService.getTenantId()).toBe('tenant-B');
        executionResults.push(`B:start:${tenantContextService.getTenantId()}`);

        // Async delay to interleave execution with Request A
        await new Promise((resolve) => setTimeout(resolve, 15));

        // Step 2 (after delay)
        expect(tenantContextService.getTenantId()).toBe('tenant-B');
        expect(tenantContextService.getUserId()).toBe('user-B');
        executionResults.push(`B:end:${tenantContextService.getTenantId()}`);
        return 'RESULT_B';
      },
    );

    const [resA, resB] = await Promise.all([requestA, requestB]);

    expect(resA).toBe('RESULT_A');
    expect(resB).toBe('RESULT_B');
    expect(executionResults).toEqual([
      'A:start:tenant-A',
      'B:start:tenant-B',
      'B:end:tenant-B',
      'A:end:tenant-A',
    ]);
  });

  // ─── 3. Context Cleanup After Request ──────────────────────────────────────────

  it('should cleanly return undefined outside of the active request scope', () => {
    expect(tenantContextService.getContext()).toBeUndefined();
    expect(tenantContextService.getTenantId()).toBeUndefined();
    expect(tenantContextService.getUserId()).toBeUndefined();
    expect(tenantContextService.isSuperAdmin()).toBe(false);
  });

  // ─── 4. Context Cleanup / Rollback After Transaction Failure ───────────────────

  it('should handle errors cleanly without corrupting the context or leaving residual session state', async () => {
    const context: RequestTenantContext = {
      tenantId: 'tenant-error-test',
      userId: 'user-error-test',
      isSuperAdmin: false,
    };

    const failingOperation = () =>
      tenantContextService.run(context, async () => {
        expect(tenantContextService.getTenantId()).toBe('tenant-error-test');
        throw new Error('Simulated database deadlock / constraint violation');
      });

    await expect(failingOperation()).rejects.toThrow(
      'Simulated database deadlock / constraint violation',
    );

    // Context must be undefined outside the scope
    expect(tenantContextService.getContext()).toBeUndefined();
  });

  // ─── 5. Super Admin Context ───────────────────────────────────────────────────

  it('should correctly populate Super Admin context only when verified by backend database', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'superadmin-uuid',
      status: 'ACTIVE',
      isSuperAdmin: true,
      memberships: [],
    });

    const req: any = {
      user: {
        id: 'superadmin-uuid',
        email: 'admin@clixprocrm.com',
        aal: 'aal2',
      },
      headers: {},
    };

    await tenantContextService.run({ isSuperAdmin: false }, async () => {
      const execCtx = createMockExecutionContext(req);
      const canActivate = await superAdminGuard.canActivate(execCtx);

      expect(canActivate).toBe(true);
      expect(req['isSuperAdmin']).toBe(true);
      expect(tenantContextService.isSuperAdmin()).toBe(true);
      expect(tenantContextService.getUserId()).toBe('superadmin-uuid');
    });
  });

  // ─── 6. Unauthenticated Request Handling ───────────────────────────────────────

  it('should reject unauthenticated request in TenantGuard with UnauthorizedException', async () => {
    const req = {
      user: null,
      headers: {},
    };

    const execCtx = createMockExecutionContext(req);
    await expect(tenantGuard.canActivate(execCtx)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject unauthenticated request in SuperAdminGuard with UnauthorizedException', async () => {
    const req = {
      user: null,
      headers: {},
    };

    const execCtx = createMockExecutionContext(req);
    await expect(superAdminGuard.canActivate(execCtx)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ─── 7. Frontend Tenant ID Tampering Rejection ─────────────────────────────────

  it('should reject spoofed x-tenant-id header if user has no membership in that tenant', async () => {
    // User belongs ONLY to tenant-legit
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-victim',
      status: 'ACTIVE',
      isSuperAdmin: false,
      memberships: [
        {
          tenantId: 'tenant-legit',
          status: 'ACTIVE',
          role: { id: 'role-1', name: 'EMPLOYEE', permissions: [] },
          tenant: { id: 'tenant-legit', status: 'ACTIVE' },
        },
      ],
    });

    // Attacker sends request with header x-tenant-id: tenant-victim-tampered
    const req: any = {
      user: { id: 'user-victim' },
      headers: {
        'x-tenant-id': 'tenant-victim-tampered',
      },
    };

    await tenantContextService.run({ isSuperAdmin: false }, async () => {
      const execCtx = createMockExecutionContext(req);
      await tenantGuard.canActivate(execCtx);

      // TenantGuard must NOT use the forged header; it falls back to verified membership or rejects
      expect(tenantContextService.getTenantId()).toBe('tenant-legit');
      expect(req['tenantId']).toBe('tenant-legit');
      expect(tenantContextService.getTenantId()).not.toBe(
        'tenant-victim-tampered',
      );
    });
  });

  it('should reject Super Admin route access if regular user attempts to tamper with request headers', async () => {
    // User is NOT super admin in database
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'regular-user-id',
      status: 'ACTIVE',
      isSuperAdmin: false,
    });

    const req = {
      user: { id: 'regular-user-id' },
      headers: {
        'x-is-super-admin': 'true',
      },
      isSuperAdmin: true, // Frontend attempted to inject property
    };

    await tenantContextService.run({ isSuperAdmin: false }, async () => {
      const execCtx = createMockExecutionContext(req);
      await expect(superAdminGuard.canActivate(execCtx)).rejects.toThrow(
        ForbiddenException,
      );

      // Context must remain non-super-admin
      expect(tenantContextService.isSuperAdmin()).toBe(false);
    });
  });
});
