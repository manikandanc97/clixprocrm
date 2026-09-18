import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeAuditDetails } from '../common/utils/audit-sanitizer.util';
import { PlatformOrganizationsService } from '../super-admin/services/platform-organizations.service';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { SessionsService } from './sessions.service';

describe('P0 AuditLog Immutability & Tamper-Resistance Security Suite', () => {
  let mockPrisma: any;
  let mfaService: MfaService;
  let sessionsService: SessionsService;
  let authService: AuthService;
  let platformOrgsService: PlatformOrganizationsService;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest
          .fn()
          .mockImplementation((args) =>
            Promise.resolve({ id: 'audit-1', ...args.data }),
          ),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        // Destructive methods should not be called in services
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({ id: 'tenant-1' }),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({ id: 'usr-1' }),
      },
      tenantUser: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      userSession: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      role: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      rolePermission: {
        deleteMany: jest.fn(),
      },
      department: {
        deleteMany: jest.fn(),
      },
      aiConversation: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      aiMessage: {
        deleteMany: jest.fn(),
      },
      tenantAiConfig: {
        deleteMany: jest.fn(),
      },
      documentChunk: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      document: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      revenueTarget: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      company: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      invitation: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
      notification: { deleteMany: jest.fn() },
      attachment: { deleteMany: jest.fn() },
      note: { deleteMany: jest.fn() },
      timelineEvent: { deleteMany: jest.fn() },
      lead: { deleteMany: jest.fn() },
      customer: { deleteMany: jest.fn() },
      deal: { deleteMany: jest.fn() },
      task: { deleteMany: jest.fn() },
      meeting: { deleteMany: jest.fn() },
      quotation: { deleteMany: jest.fn() },
      invoice: { deleteMany: jest.fn() },
      invoiceCounter: { deleteMany: jest.fn() },
      withTenantContext: jest
        .fn()
        .mockImplementation((ctx, cb) => cb(mockPrisma)),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    };

    mfaService = new MfaService(mockPrisma);
    sessionsService = new SessionsService(mockPrisma);
    authService = new AuthService(mockPrisma, {} as any);
    platformOrgsService = new PlatformOrganizationsService(mockPrisma);
  });

  describe('1. Database Migration & Immutability Trigger Validation', () => {
    it('validates migration SQL contains prevent_audit_log_mutation function and trigger', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../prisma/migrations/20260820220000_audit_log_immutability/migration.sql',
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const migrationSql = fs.readFileSync(migrationPath, 'utf8');

      // Must drop foreign key constraints to prevent cascade on user deletion
      expect(migrationSql).toContain(
        'ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";',
      );
      expect(migrationSql).toContain(
        'ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_targetUserId_fkey";',
      );

      // Must define PostgreSQL immutability trigger function
      expect(migrationSql).toContain(
        'CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()',
      );
      expect(migrationSql).toContain(
        "RAISE EXCEPTION 'AuditLog entries are immutable and cannot be updated or deleted.';",
      );

      // Must attach trigger BEFORE UPDATE OR DELETE
      expect(migrationSql).toContain('CREATE TRIGGER trg_audit_log_immutable');
      expect(migrationSql).toContain('BEFORE UPDATE OR DELETE ON "AuditLog"');
      expect(migrationSql).toContain(
        'FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();',
      );
    });

    it('ensures Prisma schema defines AuditLog relations as onDelete: NoAction', () => {
      const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      expect(schemaContent).toContain('model AuditLog {');
      expect(schemaContent).toContain(
        '@relation("AuditLogTarget", fields: [targetUserId], references: [id], onDelete: NoAction, onUpdate: NoAction)',
      );
      expect(schemaContent).toContain(
        '@relation("AuditLogActor", fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)',
      );
    });
  });

  describe('2. Zero Destructive AuditLog Operations in Services', () => {
    it('deleteAccount does NOT call auditLog.deleteMany and logs ORGANIZATION_DELETED & USER_ACCOUNT_DELETED', async () => {
      mockPrisma.tenantUser.findUnique.mockResolvedValue({
        id: 'tu-1',
        role: { name: 'ADMIN' },
      });
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1' });
      mockPrisma.tenantUser.findMany.mockResolvedValue([{ userId: 'usr-1' }]);

      await authService.deleteAccount('usr-1', 'tenant-1', {
        confirm1: 'clixprocrm',
        confirm2: 'delete my account',
      });

      // AuditLog.deleteMany MUST NEVER be called
      expect(mockPrisma.auditLog.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.auditLog.delete).not.toHaveBeenCalled();

      // ORGANIZATION_DELETED and USER_ACCOUNT_DELETED MUST be recorded
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ORGANIZATION_DELETED',
            tenantId: 'tenant-1',
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_ACCOUNT_DELETED',
            tenantId: 'tenant-1',
          }),
        }),
      );
    });

    it('deleteOrganization in SuperAdmin does NOT delete audit logs and records ORGANIZATION_DELETED', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-org-1',
        name: 'Target Org',
        slug: 'target-org',
      });

      await platformOrgsService.deleteOrganization(
        'tenant-org-1',
        'super-admin-usr',
      );

      // AuditLog.deleteMany MUST NEVER be called
      expect(mockPrisma.auditLog.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.auditLog.delete).not.toHaveBeenCalled();

      // Must record ORGANIZATION_DELETED in platform audit log
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ORGANIZATION_DELETED',
            module: 'SuperAdmin',
            userId: 'super-admin-usr',
          }),
        }),
      );
    });
  });

  describe('3. MFA Audit Event Authenticity & Forgery Prevention', () => {
    it('rejects MFA_VERIFIED if caller is not AAL2 verified', async () => {
      await expect(
        mfaService.recordAuditEvent(
          'usr-1',
          'MFA_VERIFIED',
          { factorId: 'totp-1' },
          'tenant-1',
          '127.0.0.1',
          'Mozilla',
          'aal1', // Non-AAL2 session trying to forge MFA_VERIFIED
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('allows MFA_VERIFIED when caller session is genuine AAL2 verified', async () => {
      const res = await mfaService.recordAuditEvent(
        'usr-1',
        'MFA_VERIFIED',
        { factorId: 'totp-1' },
        'tenant-1',
        '127.0.0.1',
        'Mozilla',
        'aal2', // Authenticated AAL2 session
      );

      expect(res.success).toBe(true);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'MFA_VERIFIED',
            userId: 'usr-1',
          }),
        }),
      );
    });

    it('rejects invalid MFA audit event types', async () => {
      await expect(
        mfaService.recordAuditEvent('usr-1', 'FORGED_ADMIN_LOGIN' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Audit Payload Hardening & Sanitization', () => {
    it('strips all sensitive credentials, tokens, OTPs, recovery codes, and passwords', () => {
      const dangerousPayload = {
        factorId: 'totp-123',
        safeKey: 'valid-info',
        password: 'PlainTextPassword123!',
        token: 'eyJh...jwtToken',
        jwt: 'secret-jwt',
        secret: 'base32secret',
        otp: '123456',
        recoveryCode: 'ABCD-1234',
        smtpPassword: 'smtp-secret-pass',
        redisAuth: 'redis-pass',
        apiKey: 'sk-123456789',
        nested: {
          userPass: 'nested-pass',
          nestedSafe: 'ok',
        },
      };

      const sanitized = sanitizeAuditDetails(dangerousPayload);

      expect(sanitized.factorId).toBe('totp-123');
      expect(sanitized.safeKey).toBe('valid-info');
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.token).toBeUndefined();
      expect(sanitized.jwt).toBeUndefined();
      expect(sanitized.secret).toBeUndefined();
      expect(sanitized.otp).toBeUndefined();
      expect(sanitized.recoveryCode).toBeUndefined();
      expect(sanitized.smtpPassword).toBeUndefined();
      expect(sanitized.redisAuth).toBeUndefined();
      expect(sanitized.apiKey).toBeUndefined();
      expect(sanitized.nested.nestedSafe).toBe('ok');
      expect(sanitized.nested.userPass).toBeUndefined();
    });

    it('truncates oversized payloads to prevent database log flooding', () => {
      const hugeString = 'A'.repeat(5000);
      const hugePayload = {
        factorId: 'totp-123',
        floodData: hugeString,
      };

      const sanitized = sanitizeAuditDetails(hugePayload, 1000);
      expect(JSON.stringify(sanitized).length).toBeLessThanOrEqual(1000);
    });
  });
});
