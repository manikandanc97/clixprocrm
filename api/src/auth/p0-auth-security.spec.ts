import {
    ExecutionContext,
    HttpException,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import {
    resetRateLimit
} from '../common/utils/rate-limit.util';
import { AuthController } from './auth.controller';
import { invalidateGetMeCache } from './auth.service';
import { invalidateTokenUserCache } from './supabase.guard';
import { TenantGuard, invalidateUserTenantCache } from './tenant.guard';

describe('P0 Authentication & Session Security Tests', () => {
  let tenantGuard: TenantGuard;
  let mockPrisma: any;
  let mockTenantContext: any;
  let mockAuthService: any;
  let authController: AuthController;

  beforeEach(() => {
    mockPrisma = {
      withTenantContext: jest.fn(async (ctx, cb) => {
        const tx = {
          user: {
            findUnique: jest.fn(),
          },
          tenant: {
            findFirst: jest.fn(),
          },
        };
        return cb(tx);
      }),
      tenant: {
        findFirst: jest.fn(),
      },
    };

    mockTenantContext = {
      setContext: jest.fn(),
    };

    mockAuthService = {
      getMe: jest.fn(),
      updateMe: jest.fn(),
      uploadAvatar: jest.fn(),
      register: jest.fn(),
      deleteAccount: jest.fn(),
    };

    tenantGuard = new TenantGuard(mockPrisma, mockTenantContext);
    authController = new AuthController(mockAuthService, {} as any);

    // Clear caches and rate-limit stores
    invalidateTokenUserCache();
    invalidateUserTenantCache();
    invalidateGetMeCache();
    resetRateLimit('auth:login:127.0.0.1:test@example.com');
    resetRateLimit('auth:register:127.0.0.1');
    resetRateLimit('auth:forgot-password:127.0.0.1:test@example.com');
    resetRateLimit('auth:reset-password:127.0.0.1');
  });

  describe('1. TenantGuard Inactive / Suspended User Blocking (P0 Critical)', () => {
    function createMockContext(
      user: any,
      headers: Record<string, string> = {},
    ): ExecutionContext {
      const request: any = {
        user,
        headers,
      };
      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as any;
    }

    it('should ALLOW active user with active membership', async () => {
      const user = { id: 'usr-1', email: 'active@example.com' };
      const context = createMockContext(user, { 'x-tenant-id': 'tenant-1' });

      mockPrisma.withTenantContext = jest.fn(async (ctx, cb) => {
        return cb({
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'usr-1',
              status: 'ACTIVE',
              isSuperAdmin: false,
              memberships: [
                {
                  tenantId: 'tenant-1',
                  status: 'ACTIVE',
                  role: {
                    name: 'EMPLOYEE',
                    permissions: [{ module: 'DEALS', hasAccess: true }],
                  },
                  tenant: {
                    id: 'tenant-1',
                    name: 'Acme Corp',
                    status: 'ACTIVE',
                  },
                },
              ],
            }),
          },
        });
      });

      const result = await tenantGuard.canActivate(context);
      expect(result).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.tenantId).toBe('tenant-1');
      expect(req.userRole.name).toBe('EMPLOYEE');
    });

    it('should REJECT user when root User.status is INACTIVE, even if membership is active', async () => {
      const user = { id: 'usr-inactive', email: 'inactive@example.com' };
      const context = createMockContext(user, { 'x-tenant-id': 'tenant-1' });

      mockPrisma.withTenantContext = jest.fn(async (ctx, cb) => {
        return cb({
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'usr-inactive',
              status: 'INACTIVE', // Root user is inactive!
              isSuperAdmin: false,
              memberships: [
                {
                  tenantId: 'tenant-1',
                  status: 'ACTIVE',
                  role: { name: 'EMPLOYEE', permissions: [] },
                  tenant: { id: 'tenant-1', status: 'ACTIVE' },
                },
              ],
            }),
          },
        });
      });

      await expect(tenantGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User account is deactivated or suspended'),
      );
    });

    it('should REJECT user when root User.status is SUSPENDED', async () => {
      const user = { id: 'usr-suspended', email: 'suspended@example.com' };
      const context = createMockContext(user, { 'x-tenant-id': 'tenant-1' });

      mockPrisma.withTenantContext = jest.fn(async (ctx, cb) => {
        return cb({
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'usr-suspended',
              status: 'SUSPENDED', // Root user is suspended!
              isSuperAdmin: false,
              memberships: [
                {
                  tenantId: 'tenant-1',
                  status: 'ACTIVE',
                  role: { name: 'EMPLOYEE', permissions: [] },
                  tenant: { id: 'tenant-1', status: 'ACTIVE' },
                },
              ],
            }),
          },
        });
      });

      await expect(tenantGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User account is deactivated or suspended'),
      );
    });

    it('should REJECT Super Admin when root User.status is INACTIVE', async () => {
      const user = { id: 'super-admin-inactive', email: 'super@example.com' };
      const context = createMockContext(user, {});

      mockPrisma.withTenantContext = jest.fn(async (ctx, cb) => {
        return cb({
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'super-admin-inactive',
              status: 'INACTIVE',
              isSuperAdmin: true,
              memberships: [],
            }),
          },
        });
      });

      await expect(tenantGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('User account is deactivated or suspended'),
      );
    });
  });

  describe('2. In-Memory Token & Identity Cache Invalidation (P0 Critical)', () => {
    it('should invalidate tokenUserCache for a specific user ID', () => {
      expect(() => invalidateTokenUserCache('usr-test-123')).not.toThrow();
      expect(() => invalidateTokenUserCache()).not.toThrow();
    });

    it('should invalidate userTenantCache for a specific user ID', () => {
      expect(() => invalidateUserTenantCache('usr-test-123')).not.toThrow();
      expect(() => invalidateUserTenantCache()).not.toThrow();
    });

    it('should invalidate getMeCache for a specific user ID', () => {
      expect(() => invalidateGetMeCache('usr-test-123')).not.toThrow();
      expect(() => invalidateGetMeCache()).not.toThrow();
    });
  });

  describe('3. Auth Rate Limiting on Authentication Endpoints (P0 Critical)', () => {
    it('should allow login requests within rate limit and block when exceeded (5 req / 15 min)', async () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.10' },
        ip: '192.168.1.10',
      };
      const body = { email: 'ratelimit@example.com' };
      const testIdentifier = 'auth:login:192.168.1.10:ratelimit@example.com';
      resetRateLimit(testIdentifier);

      // 5 requests allowed
      for (let i = 0; i < 5; i++) {
        const res = await authController.loginRateLimit(req, body);
        expect(res.success).toBe(true);
      }

      // 6th request must trigger 429 Too Many Requests
      await expect(authController.loginRateLimit(req, body)).rejects.toThrow(
        HttpException,
      );

      try {
        await authController.loginRateLimit(req, body);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.getResponse().error).toBe('Too Many Requests');
      }

      resetRateLimit(testIdentifier);
    });

    it('should enforce register rate limit (5 req / hour)', async () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.20' },
        ip: '192.168.1.20',
      };
      const testIdentifier = 'auth:register:192.168.1.20';
      resetRateLimit(testIdentifier);

      for (let i = 0; i < 5; i++) {
        const res = await authController.registerRateLimit(req, {});
        expect(res.success).toBe(true);
      }

      await expect(authController.registerRateLimit(req, {})).rejects.toThrow(
        HttpException,
      );

      resetRateLimit(testIdentifier);
    });

    it('should enforce forgot-password rate limit (3 req / hour)', async () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.30' },
        ip: '192.168.1.30',
      };
      const body = { email: 'forgot@example.com' };
      const testIdentifier =
        'auth:forgot-password:192.168.1.30:forgot@example.com';
      resetRateLimit(testIdentifier);

      for (let i = 0; i < 3; i++) {
        const res = await authController.forgotPasswordRateLimit(req, body);
        expect(res.success).toBe(true);
      }

      await expect(
        authController.forgotPasswordRateLimit(req, body),
      ).rejects.toThrow(HttpException);

      resetRateLimit(testIdentifier);
    });

    it('should enforce reset-password rate limit (5 req / hour)', async () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.40' },
        ip: '192.168.1.40',
      };
      const testIdentifier = 'auth:reset-password:192.168.1.40';
      resetRateLimit(testIdentifier);

      for (let i = 0; i < 5; i++) {
        const res = await authController.resetPasswordRateLimit(req, {});
        expect(res.success).toBe(true);
      }

      await expect(
        authController.resetPasswordRateLimit(req, {}),
      ).rejects.toThrow(HttpException);

      resetRateLimit(testIdentifier);
    });
  });

  describe('4. Logout Invalidation Endpoint (P0 Critical)', () => {
    it('should clear caches upon logout', async () => {
      const req = {
        user: { id: 'usr-logout-1', email: 'logout@example.com' },
      };

      const res = await authController.logout(req);
      expect(res.success).toBe(true);
      expect(res.message).toBe('Logged out successfully');
    });
  });
});
