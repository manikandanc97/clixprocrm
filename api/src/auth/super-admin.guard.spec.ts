import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { SuperAdminGuard } from './super-admin.guard';
import { TenantContextService } from '../common/context/tenant-context.service';

describe('SuperAdminGuard Comprehensive Security Suite', () => {
  let mockPrisma: any;
  let tenantContextService: TenantContextService;
  let superAdminGuard: SuperAdminGuard;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    tenantContextService = new TenantContextService();
    superAdminGuard = new SuperAdminGuard(mockPrisma, tenantContextService);
  });

  function createMockContext(
    user: any,
    headers: Record<string, string> = {},
    extra: Record<string, any> = {},
  ): ExecutionContext {
    const request: any = {
      user,
      headers,
      ip: '127.0.0.1',
      url: '/api/super-admin/dashboard',
      ...extra,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  describe('1. Unauthenticated Request', () => {
    it('should throw UnauthorizedException if req.user is missing', async () => {
      const context = createMockContext(null);
      await expect(superAdminGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if req.user.id is missing', async () => {
      const context = createMockContext({ email: 'no-id@platform.com' });
      await expect(superAdminGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('2. User Database Existence & Status Verification', () => {
    it('should throw ForbiddenException if user is not found in database', async () => {
      const user = {
        id: 'usr-missing',
        email: 'ghost@platform.com',
        aal: 'aal2',
      };
      const context = createMockContext(user);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(superAdminGuard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User record not found'),
      );
    });

    it('should throw ForbiddenException if user status is SUSPENDED or INACTIVE', async () => {
      const user = {
        id: 'usr-suspended',
        email: 'suspended@platform.com',
        aal: 'aal2',
      };
      const context = createMockContext(user);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-suspended',
        isSuperAdmin: true,
        status: 'SUSPENDED',
      });

      await expect(superAdminGuard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('User account is not active'),
      );
    });
  });

  describe('3. Super Admin Role Authorization', () => {
    it('should REJECT regular tenant user (isSuperAdmin = false) with 403', async () => {
      const user = { id: 'usr-regular', email: 'user@tenant.com', aal: 'aal2' };
      const context = createMockContext(user);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'usr-regular',
        isSuperAdmin: false,
        status: 'ACTIVE',
      });

      await expect(superAdminGuard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Access denied: Super Admin platform privileges required',
        ),
      );
    });

    it('should REJECT tenant admin (isSuperAdmin = false) with 403', async () => {
      const user = {
        id: 'tenant-admin-1',
        email: 'admin@acme.com',
        aal: 'aal2',
      };
      const context = createMockContext(user);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'tenant-admin-1',
        isSuperAdmin: false,
        status: 'ACTIVE',
      });

      await expect(superAdminGuard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Access denied: Super Admin platform privileges required',
        ),
      );
    });
  });

  describe('4. Strict AAL2 MFA Session Assurance', () => {
    it('should REJECT Super Admin with AAL1 session and record AAL2_REQUIRED_DENIED audit log', async () => {
      const user = {
        id: 'super-admin-1',
        email: 'root@clixpro.com',
        aal: 'aal1',
      };
      const context = createMockContext(user);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'super-admin-1',
        isSuperAdmin: true,
        status: 'ACTIVE',
      });

      let caughtError: any;
      try {
        await superAdminGuard.canActivate(context);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(ForbiddenException);
      const res = caughtError.getResponse();
      expect(res).toEqual(
        expect.objectContaining({
          statusCode: 403,
          code: 'AAL2_REQUIRED',
          message: expect.stringContaining('AAL2 session assurance required'),
        }),
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'super-admin-1',
            action: 'AAL2_REQUIRED_DENIED',
            module: 'SuperAdmin',
          }),
        }),
      );
    });

    it('should ALLOW Super Admin with AAL2 verified session and set platform context', async () => {
      const user = {
        id: 'super-admin-1',
        email: 'root@clixpro.com',
        aal: 'aal2',
      };
      const context = createMockContext(user);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'super-admin-1',
        isSuperAdmin: true,
        status: 'ACTIVE',
      });

      await tenantContextService.run({ isSuperAdmin: false }, async () => {
        const allowed = await superAdminGuard.canActivate(context);
        expect(allowed).toBe(true);

        const req = context.switchToHttp().getRequest();
        expect(req.isSuperAdmin).toBe(true);

        // Verify AsyncLocalStorage context was set for platform queries
        const tenantCtx = tenantContextService.getContext();
        expect(tenantCtx?.isSuperAdmin).toBe(true);
        expect(tenantCtx?.userId).toBe('super-admin-1');
      });
    });
  });
});
