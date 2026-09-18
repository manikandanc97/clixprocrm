import { AuditLoggerService } from '../common/audit/audit-logger.service';
import { EmergencySecurityService } from '../super-admin/services/emergency-security.service';

describe('P4 Emergency Security Controls Suite', () => {
  let emergencyService: EmergencySecurityService;
  let mockPrisma: any;
  let auditLogger: AuditLoggerService;

  let storedUsers: any[] = [];
  let storedTenants: any[] = [];
  let storedSessions: any[] = [];
  let storedLogs: any[] = [];
  let platformState: any = {
    id: 'global',
    emergencyMode: false,
    confirmationCode: null,
  };

  beforeEach(() => {
    storedUsers = [
      {
        id: 'usr-1',
        email: 'compromised@example.com',
        securityStatus: 'ACTIVE',
      },
      {
        id: 'admin-1',
        email: 'superadmin@example.com',
        securityStatus: 'ACTIVE',
        isSuperAdmin: true,
      },
    ];
    storedTenants = [
      { id: 'tenant-1', name: 'Acme Corp', securityStatus: 'ACTIVE' },
    ];
    storedSessions = [
      { id: 'sess-1', userId: 'usr-1', isRevoked: false },
      { id: 'sess-2', userId: 'usr-1', isRevoked: false },
    ];
    storedLogs = [];
    platformState = {
      id: 'global',
      emergencyMode: false,
      confirmationCode: null,
    };

    mockPrisma = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
      auditLog: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => {
          storedLogs.push(data);
          return Promise.resolve(data);
        }),
      },
      auditArchiveOutbox: {
        create: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            storedUsers.find((u) => u.id === where.id) || null,
          );
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = storedUsers.findIndex((u) => u.id === where.id);
          if (idx !== -1) {
            storedUsers[idx] = { ...storedUsers[idx], ...data };
            return Promise.resolve(storedUsers[idx]);
          }
          return Promise.resolve(null);
        }),
      },
      tenant: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            storedTenants.find((t) => t.id === where.id) || null,
          );
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = storedTenants.findIndex((t) => t.id === where.id);
          if (idx !== -1) {
            storedTenants[idx] = { ...storedTenants[idx], ...data };
            return Promise.resolve(storedTenants[idx]);
          }
          return Promise.resolve(null);
        }),
      },
      tenantUser: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.tenantId === 'tenant-1') {
            return Promise.resolve([{ userId: 'usr-1' }]);
          }
          return Promise.resolve([]);
        }),
      },
      userSession: {
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          let count = 0;
          storedSessions.forEach((s) => {
            if (
              s.userId === where.userId ||
              (where.userId?.in && where.userId.in.includes(s.userId))
            ) {
              s.isRevoked = true;
              count++;
            }
          });
          return Promise.resolve({ count });
        }),
      },
      platformSecurityState: {
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve(platformState)),
        create: jest.fn().mockImplementation(({ data }) => {
          platformState = { ...data };
          return Promise.resolve(platformState);
        }),
        upsert: jest.fn().mockImplementation(({ update, create }) => {
          platformState = { ...platformState, ...(update || create) };
          return Promise.resolve(platformState);
        }),
        update: jest.fn().mockImplementation(({ data }) => {
          platformState = { ...platformState, ...data };
          return Promise.resolve(platformState);
        }),
      },
    };

    auditLogger = new AuditLoggerService(mockPrisma);
    emergencyService = new EmergencySecurityService(mockPrisma, auditLogger);
  });

  describe('1. User Kill-Switch & Account Lock', () => {
    it('revokes all user sessions and emits sealed audit log', async () => {
      const res = await emergencyService.revokeUserSessions(
        'usr-1',
        'Compromised credential reported on dark web',
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(res.revokedCount).toBe(2);
      expect(storedSessions.every((s) => s.isRevoked)).toBe(true);

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'USER_SESSIONS_EMERGENCY_REVOKED',
          }),
        ]),
      );
    });

    it('locks user account and terminates active sessions', async () => {
      const res = await emergencyService.lockUser(
        'usr-1',
        'Critical account takeover investigation',
        'LOCK USER',
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(storedUsers[0].securityStatus).toBe('LOCKED');

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'USER_SECURITY_LOCKED' }),
        ]),
      );
    });

    it('unlocks user account with reason and audit log', async () => {
      storedUsers[0].securityStatus = 'LOCKED';

      const res = await emergencyService.unlockUser(
        'usr-1',
        'Password rotated and user verified via secondary channel',
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(storedUsers[0].securityStatus).toBe('ACTIVE');

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'USER_SECURITY_UNLOCKED' }),
        ]),
      );
    });
  });

  describe('2. Tenant Lockdown', () => {
    it('locks tenant and revokes all user sessions in tenant', async () => {
      const res = await emergencyService.lockTenant(
        'tenant-1',
        'Suspected cross-tenant data leak investigation',
        'LOCK TENANT',
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(storedTenants[0].securityStatus).toBe('LOCKED');
      expect(storedSessions.every((s) => s.isRevoked)).toBe(true);

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'TENANT_SECURITY_LOCKED' }),
        ]),
      );
    });
  });

  describe('3. Global Platform Emergency Break-Glass Mode', () => {
    it('requires server-side break-glass code to enable emergency mode', async () => {
      const code = await emergencyService.generateBreakGlassCode('admin-1');
      expect(code).toMatch(/^EMERGENCY-[A-F0-9]{8}$/);

      const res = await emergencyService.enablePlatformEmergency(
        'Zero-day vulnerability incident response',
        'ENABLE EMERGENCY MODE',
        code,
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(platformState.emergencyMode).toBe(true);

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'PLATFORM_EMERGENCY_ENABLED' }),
        ]),
      );
    });

    it('disables platform emergency mode', async () => {
      platformState.emergencyMode = true;

      const res = await emergencyService.disablePlatformEmergency(
        'Vulnerability patched and integrity validated',
        'admin-1',
      );

      expect(res.success).toBe(true);
      expect(platformState.emergencyMode).toBe(false);

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'PLATFORM_EMERGENCY_DISABLED' }),
        ]),
      );
    });
  });
});
