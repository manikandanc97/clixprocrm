import {
    BadRequestException,
    ExecutionContext,
    ForbiddenException,
    HttpException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { resetRateLimit } from '../common/utils/rate-limit.util';
import { AalGuard } from './aal.guard';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { SuperAdminGuard } from './super-admin.guard';

describe('P1 Enterprise MFA & AAL2 Security Tests', () => {
  let mockPrisma: any;
  let superAdminGuard: SuperAdminGuard;
  let aalGuard: AalGuard;
  let reflector: Reflector;
  let mfaService: MfaService;
  let mfaController: MfaController;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      mfaRecoveryCode: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 10 }),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    reflector = new Reflector();
    superAdminGuard = new SuperAdminGuard(mockPrisma);
    aalGuard = new AalGuard(reflector, mockPrisma);
    mfaService = new MfaService(mockPrisma);
    mfaController = new MfaController(mfaService);

    resetRateLimit('auth:mfa:recovery:127.0.0.1:usr-test-123');
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
      url: '/test-route',
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

  describe('1. SuperAdminGuard Strict AAL2 Enforcement', () => {
    it('should REJECT Super Admin with AAL1 session and log AAL2_REQUIRED_DENIED', async () => {
      const user = { id: 'super-1', email: 'admin@platform.com', aal: 'aal1' };
      const context = createMockContext(user);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'super-1',
        isSuperAdmin: true,
        status: 'ACTIVE',
      });

      await expect(superAdminGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      // Verify audit event was recorded with denial details
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'super-1',
            action: 'AAL2_REQUIRED_DENIED',
            module: 'SuperAdmin',
          }),
        }),
      );
    });

    it('should ALLOW Super Admin with AAL2 verified session', async () => {
      const user = { id: 'super-1', email: 'admin@platform.com', aal: 'aal2' };
      const context = createMockContext(user);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'super-1',
        isSuperAdmin: true,
        status: 'ACTIVE',
      });

      const result = await superAdminGuard.canActivate(context);
      expect(result).toBe(true);
      const req = context.switchToHttp().getRequest();
      expect(req.isSuperAdmin).toBe(true);
    });

    it('should REJECT non-super-admin user regardless of AAL', async () => {
      const user = {
        id: 'regular-user',
        email: 'regular@example.com',
        aal: 'aal2',
      };
      const context = createMockContext(user);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'regular-user',
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

  describe('2. AalGuard & Tenant MFA Policy Enforcement', () => {
    it('should REJECT user when @RequireAal("aal2") is set and session is AAL1', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('aal2');

      const user = { id: 'usr-1', email: 'user@tenant.com', aal: 'aal1' };
      const context = createMockContext(user);

      await expect(aalGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'AAL2_REQUIRED_DENIED',
            userId: 'usr-1',
          }),
        }),
      );
    });

    it('should ALLOW user when @RequireAal("aal2") is set and session is AAL2', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('aal2');

      const user = { id: 'usr-1', email: 'user@tenant.com', aal: 'aal2' };
      const context = createMockContext(user);

      const result = await aalGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should REJECT Admin at AAL1 when organization has mfaPolicy = "REQUIRED"', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const user = { id: 'admin-1', email: 'admin@tenant.com', aal: 'aal1' };
      const context = createMockContext(
        user,
        {},
        {
          tenantId: 'tenant-1',
          userRole: { name: 'ADMIN' },
        },
      );

      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        mfaPolicy: 'REQUIRED',
      });

      await expect(aalGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should ALLOW Admin at AAL2 when organization has mfaPolicy = "REQUIRED"', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const user = { id: 'admin-1', email: 'admin@tenant.com', aal: 'aal2' };
      const context = createMockContext(
        user,
        {},
        {
          tenantId: 'tenant-1',
          userRole: { name: 'ADMIN' },
        },
      );

      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        mfaPolicy: 'REQUIRED',
      });

      const result = await aalGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should ALLOW Admin at AAL1 when organization has mfaPolicy = "OPTIONAL"', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const user = { id: 'admin-1', email: 'admin@tenant.com', aal: 'aal1' };
      const context = createMockContext(
        user,
        {},
        {
          tenantId: 'tenant-1',
          userRole: { name: 'ADMIN' },
        },
      );

      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        mfaPolicy: 'OPTIONAL',
      });

      const result = await aalGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should ALLOW normal Employee at AAL1 when no explicit AAL2 required', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const user = { id: 'emp-1', email: 'emp@tenant.com', aal: 'aal1' };
      const context = createMockContext(
        user,
        {},
        {
          tenantId: 'tenant-1',
          userRole: { name: 'EMPLOYEE' },
        },
      );

      const result = await aalGuard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('3. MFA Backup Recovery Codes & Hash Verification', () => {
    it('should generate 10 recovery codes and store ONLY cryptographic hashes', async () => {
      const res = await mfaService.generateRecoveryCodes(
        'usr-test-123',
        'usr-test-123',
      );

      expect(res.recoveryCodes).toHaveLength(10);
      expect(res.count).toBe(10);

      // Verify Prisma created 10 hashed records
      expect(mockPrisma.mfaRecoveryCode.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              userId: 'usr-test-123',
              codeHash: expect.any(String),
            }),
          ]),
        }),
      );

      // Verify code hashes are 64-char hex strings (SHA-256) and NOT plaintext codes
      const createManyArg =
        mockPrisma.mfaRecoveryCode.createMany.mock.calls[0][0];
      for (const entry of createManyArg.data) {
        expect(entry.codeHash).toMatch(/^[a-f0-9]{64}$/i);
        expect(res.recoveryCodes).not.toContain(entry.codeHash);
      }
    });

    it('should consume valid recovery code and mark as used', async () => {
      mockPrisma.mfaRecoveryCode.findFirst.mockResolvedValue({
        id: 'code-1',
        userId: 'usr-test-123',
        used: false,
      });
      mockPrisma.mfaRecoveryCode.count.mockResolvedValue(9);

      const res = await mfaService.verifyAndConsumeRecoveryCode(
        'usr-test-123',
        'ABCD-1234',
        '127.0.0.1',
      );

      expect(res.success).toBe(true);
      expect(res.remainingRecoveryCodes).toBe(9);
      expect(mockPrisma.mfaRecoveryCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: expect.objectContaining({ used: true }),
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'MFA_RECOVERY_USED',
            details: expect.objectContaining({ remainingRecoveryCodes: 9 }),
          }),
        }),
      );
    });

    it('should reject invalid or already used recovery code and log failure', async () => {
      mockPrisma.mfaRecoveryCode.findFirst.mockResolvedValue(null);

      await expect(
        mfaService.verifyAndConsumeRecoveryCode(
          'usr-test-123',
          'INVALID-CODE',
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'MFA_CHALLENGE_FAILED',
            details: expect.objectContaining({
              reason: 'Invalid or already used recovery code',
            }),
          }),
        }),
      );
    });
  });

  describe('4. Zero Secrets Leaked in Audit Logging', () => {
    it('should NEVER record secrets, OTP codes, or passwords in audit logs', async () => {
      await mfaService.recordAuditEvent(
        'usr-test-123',
        'MFA_VERIFIED',
        {
          factorId: 'factor-abc',
          otpCode: '123456',
          secret: 'JBSWY3DPEHPK3PXP',
          token: 'jwt-access-token',
          password: 'mySecretPassword',
          safeMetadata: 'ok',
        },
        'tenant-1',
        undefined,
        undefined,
        'aal2',
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'MFA_VERIFIED',
            details: {
              factorId: 'factor-abc',
              safeMetadata: 'ok',
            },
          }),
        }),
      );

      const savedDetails =
        mockPrisma.auditLog.create.mock.calls[0][0].data.details;
      expect(savedDetails.otpCode).toBeUndefined();
      expect(savedDetails.secret).toBeUndefined();
      expect(savedDetails.token).toBeUndefined();
      expect(savedDetails.password).toBeUndefined();
    });
  });

  describe('5. Rate Limiting on MFA Recovery Endpoint', () => {
    it('should enforce rate limit on recovery verification (3 attempts / 15 min)', async () => {
      const req = {
        user: { id: 'usr-test-123', sub: 'usr-test-123' },
        headers: { 'x-forwarded-for': '127.0.0.1' },
        ip: '127.0.0.1',
      };
      const identifier = 'auth:mfa:recovery:127.0.0.1:usr-test-123';
      resetRateLimit(identifier);

      mockPrisma.mfaRecoveryCode.findFirst.mockResolvedValue({
        id: 'code-1',
        userId: 'usr-test-123',
        used: false,
      });

      // 3 attempts allowed
      for (let i = 0; i < 3; i++) {
        const res = await mfaController.verifyRecoveryCode(req, {
          code: 'AAAA-1111',
        });
        expect(res.success).toBe(true);
      }

      // 4th attempt must trigger 429 Too Many Requests
      await expect(
        mfaController.verifyRecoveryCode(req, { code: 'AAAA-1111' }),
      ).rejects.toThrow(HttpException);

      resetRateLimit(identifier);
    });
  });
});
