import { AuthController } from './auth.controller';
import {
    SECURITY_ACTIONS_ALLOWLIST,
    SessionsService,
} from './sessions.service';

describe('Security Activity Tests (Phase P3)', () => {
  let sessionsService: SessionsService;
  let authController: AuthController;
  let mockPrisma: any;
  let mockAuthService: any;
  let mockAuditLogs: any[];
  let mockUserSessions: any[];

  beforeEach(() => {
    mockAuditLogs = [
      {
        id: 'audit-1',
        userId: 'usr-alice',
        action: 'NEW_DEVICE_LOGIN',
        module: 'Security',
        details: {
          sessionId: 'sess-rec-alice-1',
          browser: 'Mozilla Firefox',
          operatingSystem: 'Windows 11',
          deviceType: 'desktop',
          sensitive_token: 'top_secret_token_123',
          password_hash: 'hashed_password_abc',
        },
        ipAddress: '198.51.100.10',
        createdAt: new Date('2026-08-20T12:00:00Z'),
      },
      {
        id: 'audit-2',
        userId: 'usr-alice',
        action: 'LOGIN_SUCCESS',
        module: 'Security',
        details: {
          sessionId: 'sess-rec-alice-2',
          browser: 'Google Chrome',
          operatingSystem: 'macOS',
          deviceType: 'desktop',
        },
        ipAddress: '198.51.100.11',
        createdAt: new Date('2026-08-20T11:00:00Z'),
      },
      {
        id: 'audit-3',
        userId: 'usr-alice',
        action: 'PASSWORD_CHANGED',
        module: 'Security',
        details: {
          userId: 'usr-alice',
          raw_passwords_leak: 'should_never_appear',
        },
        ipAddress: '198.51.100.10',
        createdAt: new Date('2026-08-20T10:00:00Z'),
      },
      {
        id: 'audit-4',
        userId: 'usr-alice',
        action: 'LEAD_CREATED', // Non-security event
        module: 'Leads',
        details: { leadId: 'lead-999' },
        ipAddress: '198.51.100.10',
        createdAt: new Date('2026-08-20T09:00:00Z'),
      },
      {
        id: 'audit-bob-1',
        userId: 'usr-bob-isolated',
        action: 'NEW_DEVICE_LOGIN',
        module: 'Security',
        details: {
          browser: 'Apple Safari',
          operatingSystem: 'iOS',
        },
        ipAddress: '203.0.113.88',
        createdAt: new Date('2026-08-20T12:30:00Z'),
      },
    ];

    mockUserSessions = [
      {
        id: 'sess-rec-alice-1',
        userId: 'usr-alice',
        sessionId: 'token-sig-current',
        deviceType: 'desktop',
        browser: 'Mozilla Firefox',
        operatingSystem: 'Windows 11',
        revokedAt: null,
      },
      {
        id: 'sess-rec-alice-2',
        userId: 'usr-alice',
        sessionId: 'token-sig-revoked',
        deviceType: 'desktop',
        browser: 'Google Chrome',
        operatingSystem: 'macOS',
        revokedAt: new Date('2026-08-20T11:30:00Z'),
      },
    ];

    mockPrisma = {
      auditLog: {
        findMany: jest.fn(async ({ where, skip = 0, take = 20, orderBy }) => {
          const items = mockAuditLogs.filter((l) => {
            if (where.userId && l.userId !== where.userId) return false;
            if (where.action?.in && !where.action.in.includes(l.action))
              return false;
            return true;
          });

          if (orderBy?.createdAt === 'desc') {
            items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }

          return items.slice(skip, skip + take);
        }),
        count: jest.fn(async ({ where }) => {
          return mockAuditLogs.filter((l) => {
            if (where.userId && l.userId !== where.userId) return false;
            if (where.action?.in && !where.action.in.includes(l.action))
              return false;
            return true;
          }).length;
        }),
      },
      userSession: {
        findMany: jest.fn(async ({ where }) => {
          return mockUserSessions.filter((s) => s.userId === where.userId);
        }),
      },
    };

    mockAuthService = {
      getMe: jest.fn(),
      updateMe: jest.fn(),
    };

    sessionsService = new SessionsService(mockPrisma);
    authController = new AuthController(mockAuthService, sessionsService);
  });

  describe('1. User Isolation & Security Boundaries', () => {
    it('returns ONLY records belonging to the requesting user (Alice)', async () => {
      const result = await sessionsService.getSecurityActivity(
        'usr-alice',
        'token-sig-current',
      );

      expect(result.total).toBe(3); // audit-1, audit-2, audit-3 (excluding LEAD_CREATED and Bob's log)
      expect(result.activity.every((a) => a.id !== 'audit-bob-1')).toBe(true);
      expect(result.activity.every((a) => a.action !== 'LEAD_CREATED')).toBe(
        true,
      );
    });

    it('User B receives strictly their own isolated logs', async () => {
      const result =
        await sessionsService.getSecurityActivity('usr-bob-isolated');

      expect(result.total).toBe(1);
      expect(result.activity[0].id).toBe('audit-bob-1');
      expect(result.activity[0].browser).toBe('Apple Safari');
    });

    it('controller endpoint extracts userId strictly from req.user without trusting client query/params', async () => {
      const req = {
        user: { id: 'usr-alice' },
        sessionId: 'token-sig-current',
        headers: {},
      };

      const response = await authController.getSecurityActivity(req, '1', '20');
      expect(response.success).toBe(true);
      expect(response.data.total).toBe(3);
      expect(response.data.activity.length).toBe(3);
    });
  });

  describe('2. Safe Response DTO & Zero Secret Leakage', () => {
    it('whitelists safe fields and strips tokens, passwords, raw details, and secrets', async () => {
      const result = await sessionsService.getSecurityActivity(
        'usr-alice',
        'token-sig-current',
      );

      for (const item of result.activity) {
        // Safe allowed fields
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('action');
        expect(item).toHaveProperty('module');
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('ipAddress');
        expect(item).toHaveProperty('browser');
        expect(item).toHaveProperty('operatingSystem');
        expect(item).toHaveProperty('deviceType');
        expect(item).toHaveProperty('isCurrent');
        expect(item).toHaveProperty('isRevoked');

        // Disallowed / sensitive fields must NEVER be present
        const json = JSON.stringify(item);
        expect(json).not.toContain('top_secret_token_123');
        expect(json).not.toContain('hashed_password_abc');
        expect(json).not.toContain('should_never_appear');
        expect(json).not.toContain('sensitive_token');
        expect(json).not.toContain('password_hash');
        expect(json).not.toContain('raw_passwords_leak');
        expect((item as any).details).toBeUndefined();
      }
    });
  });

  describe('3. Session State Correlation', () => {
    it('accurately identifies current device vs revoked remote device', async () => {
      const result = await sessionsService.getSecurityActivity(
        'usr-alice',
        'token-sig-current',
      );

      const currentActivity = result.activity.find((a) => a.id === 'audit-1');
      expect(currentActivity).toBeDefined();
      expect(currentActivity?.isCurrent).toBe(true);
      expect(currentActivity?.isRevoked).toBe(false);

      const revokedActivity = result.activity.find((a) => a.id === 'audit-2');
      expect(revokedActivity).toBeDefined();
      expect(revokedActivity?.isCurrent).toBe(false);
      expect(revokedActivity?.isRevoked).toBe(true);
    });
  });

  describe('4. Pagination & Ordering', () => {
    it('paginates correctly with page and limit caps', async () => {
      const page1 = await sessionsService.getSecurityActivity(
        'usr-alice',
        undefined,
        1,
        2,
      );
      expect(page1.activity.length).toBe(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);

      const page2 = await sessionsService.getSecurityActivity(
        'usr-alice',
        undefined,
        2,
        2,
      );
      expect(page2.activity.length).toBe(1);
      expect(page2.page).toBe(2);
    });

    it('caps limit at 50 max and defaults to 20', async () => {
      const defaultRes = await sessionsService.getSecurityActivity('usr-alice');
      expect(defaultRes.limit).toBe(20);

      const cappedRes = await sessionsService.getSecurityActivity(
        'usr-alice',
        undefined,
        1,
        9999,
      );
      expect(cappedRes.limit).toBe(50);
    });
  });

  describe('5. Allowlist Filtering', () => {
    it('strictly filters only recognized security events', () => {
      expect(SECURITY_ACTIONS_ALLOWLIST).toContain('NEW_DEVICE_LOGIN');
      expect(SECURITY_ACTIONS_ALLOWLIST).toContain('LOGIN_SUCCESS');
      expect(SECURITY_ACTIONS_ALLOWLIST).toContain('LOGIN_FAILED');
      expect(SECURITY_ACTIONS_ALLOWLIST).toContain('MFA_VERIFIED');
      expect(SECURITY_ACTIONS_ALLOWLIST).toContain('PASSWORD_CHANGED');
      expect(SECURITY_ACTIONS_ALLOWLIST).toContain('SESSION_REVOKED');
      expect(SECURITY_ACTIONS_ALLOWLIST).not.toContain('LEAD_CREATED');
      expect(SECURITY_ACTIONS_ALLOWLIST).not.toContain('USER_DELETED');
    });
  });
});
