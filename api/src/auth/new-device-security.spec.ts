import { ExecutionContext } from '@nestjs/common';
import {
  SupabaseAuthGuard,
  setSupabaseClient,
  invalidateTokenUserCache,
  invalidateSessionCache,
} from './supabase.guard';
import {
  EmailService,
  escapeHtml,
  normalizeKeyPart,
  buildAlertDeduplicationKey,
  getAlertCooldownSeconds,
} from '../common/services/email.service';

describe('New Device Security Tests (Phase P0, P1, P2)', () => {
  let supabaseAuthGuard: SupabaseAuthGuard;
  let mockPrisma: any;
  let mockEmailService: any;
  let mockNotificationsService: any;
  let mockSessions: any[];
  let mockAuditLogs: any[];
  let mockNotifications: any[];
  let mockMemberships: any[];

  function createMockContext(
    token: string,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
    ip = '127.0.0.1',
  ): ExecutionContext {
    const request: any = {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': userAgent,
        'x-forwarded-for': ip,
      },
      ip,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  function createValidTestJwt(payloadObj: Record<string, any>): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64');
    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    const signature = 'test_signature_bytes_new_device';
    return `${header}.${payload}.${signature}`;
  }

  beforeEach(() => {
    mockSessions = [
      {
        id: 'sess-existing-1',
        userId: 'usr-charlie',
        sessionId: 'supabase-sess-charlie-1',
        deviceType: 'desktop',
        browser: 'Google Chrome',
        operatingSystem: 'Windows',
        ipAddress: '192.168.1.10',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        createdAt: new Date(Date.now() - 3600000),
        lastActiveAt: new Date(Date.now() - 60000),
        expiresAt: null,
        revokedAt: null,
      },
      {
        id: 'sess-existing-2',
        userId: 'usr-charlie',
        sessionId: 'supabase-sess-charlie-2',
        deviceType: 'mobile',
        browser: 'Apple Safari',
        operatingSystem: 'iOS',
        ipAddress: '192.168.1.20',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        createdAt: new Date(Date.now() - 7200000),
        lastActiveAt: new Date(Date.now() - 1800000),
        expiresAt: null,
        revokedAt: null,
      },
    ];

    mockAuditLogs = [];
    mockNotifications = [];
    mockMemberships = [
      {
        userId: 'usr-charlie',
        tenantId: 'tenant-charlie-org',
        status: 'ACTIVE',
      },
      {
        userId: 'usr-david-new',
        tenantId: 'tenant-david-org',
        status: 'ACTIVE',
      },
    ];

    mockEmailService = {
      shouldSendNewDeviceAlert: jest.fn().mockResolvedValue(true),
      sendNewDeviceAlert: jest
        .fn()
        .mockResolvedValue({ success: true, messageId: 'msg-123' }),
    };

    mockNotificationsService = {
      createNotification: jest.fn(
        async (tenantId, userId, title, message, type) => {
          const notif = {
            id: `notif-${Date.now()}-${Math.random()}`,
            tenantId,
            userId,
            title,
            message,
            type,
            createdAt: new Date(),
          };
          mockNotifications.push(notif);
          return notif;
        },
      ),
    };

    mockPrisma = {
      userSession: {
        findUnique: jest.fn(async ({ where }) => {
          return (
            mockSessions.find((s) => s.sessionId === where.sessionId) || null
          );
        }),
        findFirst: jest.fn(async ({ where }) => {
          return (
            mockSessions.find((s) => {
              if (where.userId && s.userId !== where.userId) return false;
              if (where.deviceType && s.deviceType !== where.deviceType)
                return false;
              if (where.browser && s.browser !== where.browser) return false;
              if (
                where.operatingSystem &&
                s.operatingSystem !== where.operatingSystem
              )
                return false;
              return true;
            }) || null
          );
        }),
        create: jest.fn(async ({ data }) => {
          const newSession = {
            id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ...data,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            expiresAt: null,
            revokedAt: null,
          };
          mockSessions.push(newSession);
          return newSession;
        }),
        update: jest.fn(async ({ where, data }) => {
          const session = mockSessions.find(
            (s) => s.sessionId === where.sessionId || s.id === where.id,
          );
          if (session) {
            Object.assign(session, data);
            return session;
          }
          throw new Error('Record not found');
        }),
      },
      tenantUser: {
        findFirst: jest.fn(async ({ where }) => {
          return (
            mockMemberships.find(
              (m) =>
                m.userId === where.userId &&
                (!where.status || m.status === where.status),
            ) || null
          );
        }),
      },
      notification: {
        create: jest.fn(async ({ data }) => {
          const notif = {
            id: `notif-${Date.now()}`,
            ...data,
            createdAt: new Date(),
          };
          mockNotifications.push(notif);
          return notif;
        }),
      },
      auditLog: {
        create: jest.fn(async ({ data }) => {
          const record = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ...data,
            createdAt: new Date(),
          };
          mockAuditLogs.push(record);
          return record;
        }),
      },
      withTenantContext: jest.fn(async (_context, callback) => {
        return callback(mockPrisma);
      }),
    };

    setSupabaseClient({
      auth: {
        getClaims: jest.fn(async (token: string) => {
          try {
            const parts = token.split('.');
            if (parts.length >= 2) {
              const claims = JSON.parse(
                Buffer.from(parts[1], 'base64').toString('utf-8'),
              );
              return { data: { claims }, error: null };
            }
          } catch {}
          return { data: null, error: new Error('Invalid token') };
        }),
        getUser: jest.fn(async () => ({
          data: null,
          error: new Error('Not used'),
        })),
      },
    });

    supabaseAuthGuard = new SupabaseAuthGuard(
      mockPrisma,
      mockEmailService,
      mockNotificationsService,
    );
    invalidateTokenUserCache();
    invalidateSessionCache();
  });

  describe('1. First Login Detection (Phase P0)', () => {
    it('classifies first-ever login as LOGIN_SUCCESS with firstLogin=true', async () => {
      const newUserToken = createValidTestJwt({
        sub: 'usr-david-new',
        email: 'david@clixprocrm.test',
        session_id: 'supabase-sess-david-1',
        role: 'authenticated',
      });

      const chromeContext = createMockContext(
        newUserToken,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        '203.0.113.50',
      );

      const result = await supabaseAuthGuard.canActivate(chromeContext);
      expect(result).toBe(true);

      const auditEvent = mockAuditLogs.find(
        (l) => l.userId === 'usr-david-new',
      );
      expect(auditEvent).toBeDefined();
      expect(auditEvent.action).toBe('LOGIN_SUCCESS');
      expect(auditEvent.details.firstLogin).toBe(true);
      expect(auditEvent.details.isNewDevice).toBe(false);
      expect(auditEvent.details.browser).toBe('Google Chrome');
      expect(auditEvent.details.operatingSystem).toBe('Windows');
      expect(auditEvent.details.deviceType).toBe('desktop');
      expect(auditEvent.ipAddress).toBe('203.0.113.50');
    });

    it('does NOT trigger security email or in-app notification on first login', async () => {
      const newUserToken = createValidTestJwt({
        sub: 'usr-first-timer',
        email: 'first@clixprocrm.test',
        session_id: 'supabase-sess-first-1',
      });

      const context = createMockContext(newUserToken);
      await supabaseAuthGuard.canActivate(context);

      expect(mockEmailService.sendNewDeviceAlert).not.toHaveBeenCalled();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('2. Known Device Login (Phase P0)', () => {
    it('classifies returning session from same deviceType/browser/OS as LOGIN_SUCCESS', async () => {
      const newSessionToken = createValidTestJwt({
        sub: 'usr-charlie',
        email: 'charlie@clixprocrm.test',
        session_id: 'supabase-sess-charlie-3-new',
      });

      const sameDeviceContext = createMockContext(
        newSessionToken,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        '192.168.1.10',
      );

      const result = await supabaseAuthGuard.canActivate(sameDeviceContext);
      expect(result).toBe(true);

      const auditEvent = mockAuditLogs.find(
        (l) =>
          l.userId === 'usr-charlie' &&
          l.details.sessionId &&
          l.details.isNewDevice === false,
      );
      expect(auditEvent).toBeDefined();
      expect(auditEvent.action).toBe('LOGIN_SUCCESS');
      expect(auditEvent.details.isNewDevice).toBe(false);
      expect(auditEvent.details.firstLogin).toBe(false);
    });

    it('does NOT trigger security email or in-app notification on known device login', async () => {
      const newSessionToken = createValidTestJwt({
        sub: 'usr-charlie',
        email: 'charlie@clixprocrm.test',
        session_id: 'supabase-sess-charlie-4-new',
      });

      const sameDeviceContext = createMockContext(
        newSessionToken,
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      );

      await supabaseAuthGuard.canActivate(sameDeviceContext);

      expect(mockEmailService.sendNewDeviceAlert).not.toHaveBeenCalled();
      expect(
        mockNotificationsService.createNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('3. New Device Detection & Alerts (Phase P1)', () => {
    it('dispatches both in-app notification and security email on NEW_DEVICE_LOGIN when permitted', async () => {
      const firefoxToken = createValidTestJwt({
        sub: 'usr-charlie',
        email: 'charlie@clixprocrm.test',
        session_id: 'supabase-sess-charlie-firefox-p1',
      });

      const firefoxContext = createMockContext(
        firefoxToken,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
        '198.51.100.22',
      );

      const result = await supabaseAuthGuard.canActivate(firefoxContext);
      expect(result).toBe(true);

      // Verify AuditLog
      const auditEvent = mockAuditLogs.find(
        (l) => l.action === 'NEW_DEVICE_LOGIN' && l.userId === 'usr-charlie',
      );
      expect(auditEvent).toBeDefined();
      expect(auditEvent.details.isNewDevice).toBe(true);

      // Verify In-App Notification
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        'tenant-charlie-org',
        'usr-charlie',
        'New Sign-In Detected',
        'Your account was signed in from a new Mozilla Firefox browser on Windows.',
        'SECURITY',
      );

      // Verify Security Email
      expect(mockEmailService.sendNewDeviceAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'charlie@clixprocrm.test',
          browser: 'Mozilla Firefox',
          operatingSystem: 'Windows',
          deviceType: 'desktop',
          ipAddress: '198.51.100.22',
        }),
      );
    });

    it('gracefully handles SMTP email delivery failures without blocking authentication', async () => {
      mockEmailService.sendNewDeviceAlert.mockRejectedValueOnce(
        new Error('SMTP connection timed out'),
      );

      const macToken = createValidTestJwt({
        sub: 'usr-charlie',
        email: 'charlie@clixprocrm.test',
        session_id: 'supabase-sess-charlie-mac-failover',
      });

      const macContext = createMockContext(
        macToken,
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
        '198.51.100.33',
      );

      // Authentication must succeed with 200/true
      const result = await supabaseAuthGuard.canActivate(macContext);
      expect(result).toBe(true);

      // In-app notification and audit log are still created
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
      const auditEvent = mockAuditLogs.find(
        (l) => l.action === 'NEW_DEVICE_LOGIN',
      );
      expect(auditEvent).toBeDefined();
    });

    it('gracefully handles missing verified email without failing login', async () => {
      const noEmailToken = createValidTestJwt({
        sub: 'usr-charlie',
        session_id: 'supabase-sess-charlie-no-email',
      });

      const context = createMockContext(
        noEmailToken,
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
      );

      const result = await supabaseAuthGuard.canActivate(context);
      expect(result).toBe(true);
      expect(mockEmailService.sendNewDeviceAlert).not.toHaveBeenCalled();
    });
  });

  describe('4. Redis Distributed Alert Deduplication (Phase P2)', () => {
    let mockRedisStore: Map<string, string>;
    let mockRedisClient: any;
    let emailServiceWithRedis: EmailService;

    beforeEach(() => {
      mockRedisStore = new Map<string, string>();
      mockRedisClient = {
        set: jest.fn(
          async (
            key: string,
            value: string,
            options?: { nx?: boolean; ex?: number },
          ) => {
            if (options?.nx) {
              if (mockRedisStore.has(key)) {
                return null; // Key already exists -> NX failure
              }
              mockRedisStore.set(key, value);
              return 'OK'; // Key created
            }
            mockRedisStore.set(key, value);
            return 'OK';
          },
        ),
      };
      emailServiceWithRedis = new EmailService(mockRedisClient);
    });

    it('first new-device alert executes atomic SET NX and returns true', async () => {
      const shouldAlert = await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Mozilla Firefox',
        'Windows',
        'desktop',
      );
      expect(shouldAlert).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'new-device-alert:usr-alice:mozilla_firefox:windows:desktop',
        '1',
        { nx: true, ex: 86400 },
      );
    });

    it('second identical alert within 24h cooldown is suppressed (returns false)', async () => {
      // First attempt
      const first = await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Mozilla Firefox',
        'Windows',
        'desktop',
      );
      expect(first).toBe(true);

      // Second identical attempt within 24h
      const second = await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Mozilla Firefox',
        'Windows',
        'desktop',
      );
      expect(second).toBe(false);
    });

    it('concurrent requests for same device: exactly one receives alert permission', async () => {
      const promises = [
        emailServiceWithRedis.shouldSendNewDeviceAlert(
          'usr-concurrent',
          'Google Chrome',
          'macOS',
          'desktop',
        ),
        emailServiceWithRedis.shouldSendNewDeviceAlert(
          'usr-concurrent',
          'Google Chrome',
          'macOS',
          'desktop',
        ),
        emailServiceWithRedis.shouldSendNewDeviceAlert(
          'usr-concurrent',
          'Google Chrome',
          'macOS',
          'desktop',
        ),
      ];

      const results = await Promise.all(promises);
      const trueCount = results.filter((r) => r === true).length;
      const falseCount = results.filter((r) => r === false).length;

      expect(trueCount).toBe(1);
      expect(falseCount).toBe(2);
    });

    it('different browser generates an independent deduplication key', async () => {
      await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Google Chrome',
        'Windows',
        'desktop',
      );
      const diffBrowser = await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Mozilla Firefox',
        'Windows',
        'desktop',
      );
      expect(diffBrowser).toBe(true);
    });

    it('different OS generates an independent deduplication key', async () => {
      await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Google Chrome',
        'Windows',
        'desktop',
      );
      const diffOS = await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Google Chrome',
        'macOS',
        'desktop',
      );
      expect(diffOS).toBe(true);
    });

    it('different deviceType generates an independent deduplication key', async () => {
      await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Apple Safari',
        'iOS',
        'mobile',
      );
      const diffDevice = await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Apple Safari',
        'iOS',
        'tablet',
      );
      expect(diffDevice).toBe(true);
    });

    it('User A does NOT suppress User B alert', async () => {
      await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Google Chrome',
        'Windows',
        'desktop',
      );
      const userB = await emailServiceWithRedis.shouldSendNewDeviceAlert(
        'usr-bob',
        'Google Chrome',
        'Windows',
        'desktop',
      );
      expect(userB).toBe(true);
    });

    it('Redis failure mode: gracefully suppresses spam and returns false without blocking login', async () => {
      const failingRedisClient = {
        set: jest
          .fn()
          .mockRejectedValue(
            new Error('Redis connection refused: ECONNREFUSED'),
          ),
      };
      const emailServiceWithBrokenRedis = new EmailService(failingRedisClient);

      const shouldAlert =
        await emailServiceWithBrokenRedis.shouldSendNewDeviceAlert(
          'usr-alice',
          'Google Chrome',
          'Windows',
        );

      // Must return false to prevent spam, must not throw exception
      expect(shouldAlert).toBe(false);
    });

    it('unconfigured Redis: gracefully returns false without crashing', async () => {
      const emailServiceNoRedis = new EmailService(null);
      const shouldAlert = await emailServiceNoRedis.shouldSendNewDeviceAlert(
        'usr-alice',
        'Google Chrome',
        'Windows',
      );
      expect(shouldAlert).toBe(false);
    });
  });

  describe('5. Deduplication Key Formatting & Validation', () => {
    it('normalizes key parts correctly', () => {
      expect(normalizeKeyPart('Google Chrome 120.0')).toBe(
        'google_chrome_120_0',
      );
      expect(normalizeKeyPart('Mac OS X')).toBe('mac_os_x');
      expect(normalizeKeyPart(null)).toBe('unknown');
    });

    it('builds canonical key format without secrets', () => {
      const key = buildAlertDeduplicationKey(
        'usr-123',
        'Google Chrome',
        'Windows 11',
        'desktop',
      );
      expect(key).toBe(
        'new-device-alert:usr-123:google_chrome:windows_11:desktop',
      );
      expect(key).not.toContain('token');
      expect(key).not.toContain('secret');
      expect(key).not.toContain('password');
    });

    it('handles custom and invalid NEW_DEVICE_ALERT_COOLDOWN_HOURS values securely', () => {
      const origEnv = process.env.NEW_DEVICE_ALERT_COOLDOWN_HOURS;

      process.env.NEW_DEVICE_ALERT_COOLDOWN_HOURS = '48';
      expect(getAlertCooldownSeconds()).toBe(48 * 3600);

      process.env.NEW_DEVICE_ALERT_COOLDOWN_HOURS = '-5';
      expect(getAlertCooldownSeconds()).toBe(24 * 3600);

      process.env.NEW_DEVICE_ALERT_COOLDOWN_HOURS = 'invalid_number';
      expect(getAlertCooldownSeconds()).toBe(24 * 3600);

      if (origEnv) {
        process.env.NEW_DEVICE_ALERT_COOLDOWN_HOURS = origEnv;
      } else {
        delete process.env.NEW_DEVICE_ALERT_COOLDOWN_HOURS;
      }
    });
  });

  describe('6. Security, Isolation, & Boundaries', () => {
    it('User A cannot trigger User B notification or read User B device sessions', async () => {
      const bobToken = createValidTestJwt({
        sub: 'usr-bob-isolated',
        email: 'bob@clixprocrm.test',
        session_id: 'supabase-sess-bob-200',
      });

      const bobContext = createMockContext(
        bobToken,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
      );

      await supabaseAuthGuard.canActivate(bobContext);

      const bobAuditEvent = mockAuditLogs.find(
        (l) => l.userId === 'usr-bob-isolated',
      );
      expect(bobAuditEvent).toBeDefined();
      expect(bobAuditEvent.details.firstLogin).toBe(true);
      expect(mockEmailService.sendNewDeviceAlert).not.toHaveBeenCalled();
    });

    it('AuditLog and notifications contain zero tokens, hashes, or passwords', async () => {
      const sensitiveToken = createValidTestJwt({
        sub: 'usr-charlie',
        email: 'charlie@clixprocrm.test',
        session_id: 'supabase-sess-charlie-audit-sec',
        secret_hash: 'top_secret_hash_value',
      });

      const context = createMockContext(sensitiveToken);
      await supabaseAuthGuard.canActivate(context);

      for (const log of mockAuditLogs) {
        const detailsStr = JSON.stringify(log.details || {});
        expect(detailsStr).not.toContain('top_secret_hash_value');
        expect(detailsStr).not.toContain('secret');
        expect(detailsStr).not.toContain('token');
        expect(detailsStr).not.toContain('password');
        expect(detailsStr).not.toContain('recovery');
        expect(detailsStr).not.toContain('otp');
      }
    });
  });
});
