import { ExecutionContext, UnauthorizedException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SupabaseAuthGuard, invalidateSessionCache, invalidateTokenUserCache, setSupabaseClient } from './supabase.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { getSessionTimeoutConfig } from '../common/utils/session-config.util';

describe('Active Session & Device Security Tests (Phase 1, Phase 2, Phase 3)', () => {
  let sessionsService: SessionsService;
  let sessionsController: SessionsController;
  let supabaseAuthGuard: SupabaseAuthGuard;
  let authService: AuthService;
  let authController: AuthController;
  let mockPrisma: any;
  let mockBrandingService: any;
  let mockSessions: any[];

  function createMockContext(token: string, userAgent = 'Chrome'): ExecutionContext {
    const request: any = {
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': userAgent,
      },
      ip: '127.0.0.1',
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  function createValidTestJwt(payloadObj: Record<string, any>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    const signature = 'test_signature_bytes_123';
    return `${header}.${payload}.${signature}`;
  }

  beforeEach(() => {
    mockSessions = [
      {
        id: 'sess-1',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-1',
        refreshTokenHash: 'hash-12345',
        deviceType: 'desktop',
        browser: 'Google Chrome',
        operatingSystem: 'Windows',
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        lastActiveAt: new Date(Date.now() - 60000), // 1 min ago
        expiresAt: null,
        revokedAt: null,
      },
      {
        id: 'sess-2',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-2',
        refreshTokenHash: 'hash-67890',
        deviceType: 'mobile',
        browser: 'Apple Safari',
        operatingSystem: 'iOS',
        ipAddress: '192.168.1.20',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        lastActiveAt: new Date(Date.now() - 1800000), // 30 min ago
        expiresAt: null,
        revokedAt: null,
      },
      {
        id: 'sess-bob-1',
        userId: 'usr-bob',
        sessionId: 'supabase-sess-bob-1',
        refreshTokenHash: 'hash-bob-secret',
        deviceType: 'desktop',
        browser: 'Mozilla Firefox',
        operatingSystem: 'macOS',
        ipAddress: '10.0.0.5',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0)',
        createdAt: new Date(Date.now() - 1000000),
        lastActiveAt: new Date(Date.now() - 50000),
        expiresAt: null,
        revokedAt: null,
      },
    ];

    mockPrisma = {
      userSession: {
        findMany: jest.fn(async ({ where }) => {
          return mockSessions.filter((s) => {
            if (where.userId && s.userId !== where.userId) return false;
            if (where.sessionId && where.sessionId.not && s.sessionId === where.sessionId.not) return false;
            if (where.revokedAt === null && s.revokedAt !== null) return false;
            return true;
          });
        }),
        findFirst: jest.fn(async ({ where }) => {
          return mockSessions.find((s) => {
            if (where.id && s.id !== where.id) return false;
            if (where.userId && s.userId !== where.userId) return false;
            if (where.sessionId && s.sessionId !== where.sessionId) return false;
            return true;
          }) || null;
        }),
        findUnique: jest.fn(async ({ where }) => {
          return mockSessions.find((s) => s.sessionId === where.sessionId || s.id === where.id) || null;
        }),
        update: jest.fn(async ({ where, data }) => {
          const session = mockSessions.find((s) => s.id === where.id || s.sessionId === where.sessionId);
          if (!session) throw new Error('Record not found');
          Object.assign(session, data);
          return session;
        }),
        updateMany: jest.fn(async ({ where, data }) => {
          let count = 0;
          for (const s of mockSessions) {
            if (where.userId && s.userId !== where.userId) continue;
            if (where.sessionId && where.sessionId.not && s.sessionId === where.sessionId.not) continue;
            if (where.revokedAt === null && s.revokedAt !== null) continue;
            Object.assign(s, data);
            count++;
          }
          return { count };
        }),
        create: jest.fn(async ({ data }) => {
          const newSess = { id: `sess-${Date.now()}`, ...data, createdAt: new Date(), revokedAt: null };
          mockSessions.push(newSess);
          return newSess;
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    mockBrandingService = {};

    const mockSupabaseClient = {
      auth: {
        getClaims: jest.fn(async (token: string) => {
          try {
            const parts = token.split('.');
            if (parts.length >= 2) {
              const claims = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              return { data: { claims }, error: null };
            }
          } catch {}
          return { data: null, error: new Error('Invalid token') };
        }),
        getUser: jest.fn(async (token: string) => {
          try {
            const parts = token.split('.');
            if (parts.length >= 2) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              return {
                data: {
                  user: {
                    id: payload.sub || 'usr-alice',
                    email: payload.email || 'alice@example.com',
                    user_metadata: {},
                    app_metadata: {},
                    role: 'authenticated',
                    aud: 'authenticated',
                  },
                },
                error: null,
              };
            }
          } catch {}
          return { data: null, error: new Error('Invalid token') };
        }),
      },
    };
    setSupabaseClient(mockSupabaseClient);

    sessionsService = new SessionsService(mockPrisma);
    sessionsController = new SessionsController(sessionsService);
    authService = new AuthService(mockPrisma, mockBrandingService);
    authController = new AuthController(authService, sessionsService);
    supabaseAuthGuard = new SupabaseAuthGuard(mockPrisma);

    invalidateSessionCache();
    invalidateTokenUserCache();
  });

  describe('1. User Session Listing & Data Sanitization', () => {
    it("should return ONLY the authenticated user's sessions and NEVER expose token hashes", async () => {
      const result = await sessionsService.listUserSessions('usr-alice', 'supabase-sess-alice-1');

      expect(result).toHaveLength(2);
      expect(result.every((s) => s.id !== 'sess-bob-1')).toBe(true);

      // Verify no sensitive token material exists
      for (const sess of result) {
        expect((sess as any).refreshTokenHash).toBeUndefined();
        expect((sess as any).sessionId).toBeUndefined();
        expect(sess.browser).toBeDefined();
        expect(sess.operatingSystem).toBeDefined();
        expect(sess.deviceType).toBeDefined();
      }

      // Verify current session identification
      const current = result.find((s) => s.id === 'sess-1');
      expect(current?.isCurrent).toBe(true);
      const other = result.find((s) => s.id === 'sess-2');
      expect(other?.isCurrent).toBe(false);
    });

    it('should return session list through controller with active counts', async () => {
      const mockReq = {
        user: { id: 'usr-alice' },
        sessionId: 'supabase-sess-alice-1',
        headers: { 'user-agent': 'Chrome' },
      };

      const res = await sessionsController.getSessions(mockReq);
      expect(res.success).toBe(true);
      expect(res.data.count).toBe(2);
      expect(res.data.activeCount).toBe(2);
      expect(res.data.sessions[0].isCurrent).toBe(true);
    });
  });

  describe('2. Per-Session Revocation & IDOR Protection', () => {
    it('should allow user to revoke their own remote session', async () => {
      const result = await sessionsService.revokeSession(
        'usr-alice',
        'sess-2',
        'supabase-sess-alice-1',
        '192.168.1.10',
        'Chrome',
      );

      expect(result.success).toBe(true);
      expect(result.isCurrent).toBe(false);

      const target = mockSessions.find((s) => s.id === 'sess-2');
      expect(target?.revokedAt).not.toBeNull();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SESSION_REVOKED_REMOTE',
            userId: 'usr-alice',
          }),
        }),
      );
    });

    it("should PREVENT IDOR: Alice CANNOT revoke Bob's session", async () => {
      await expect(
        sessionsService.revokeSession(
          'usr-alice',
          'sess-bob-1',
          'supabase-sess-alice-1',
        ),
      ).rejects.toThrow(NotFoundException);

      const bobSession = mockSessions.find((s) => s.id === 'sess-bob-1');
      expect(bobSession?.revokedAt).toBeNull();
    });

    it('should PREVENT IDOR: Super Admin cannot use session endpoints to bypass user ownership', async () => {
      await expect(
        sessionsService.revokeSession(
          'usr-admin-super',
          'sess-alice-1',
          'supabase-sess-super',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Revoke All Other Sessions', () => {
    it('should revoke all other sessions while keeping the current session active', async () => {
      const result = await sessionsService.revokeAllOtherSessions(
        'usr-alice',
        'supabase-sess-alice-1',
        '192.168.1.10',
        'Chrome',
      );

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(1);

      const currentSess = mockSessions.find((s) => s.id === 'sess-1');
      expect(currentSess?.revokedAt).toBeNull();

      const otherSess = mockSessions.find((s) => s.id === 'sess-2');
      expect(otherSess?.revokedAt).not.toBeNull();

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ALL_OTHER_SESSIONS_REVOKED',
            userId: 'usr-alice',
          }),
        }),
      );
    });
  });

  describe('4. Server-Side Guard Session Revocation Enforcement', () => {
    it('should REJECT API access when the session identifier is marked revoked', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-2',
      });

      // Mark session 2 as revoked
      const target = mockSessions.find((s) => s.sessionId === 'supabase-sess-alice-2');
      if (target) target.revokedAt = new Date();

      invalidateSessionCache('supabase-sess-alice-2');

      const context = createMockContext(token);

      await expect(supabaseAuthGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should REJECT API access when session is invalidated via fast cache', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-revoked-fast',
      });

      invalidateSessionCache('supabase-sess-revoked-fast');

      const context = createMockContext(token);

      await expect(supabaseAuthGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('5. Password Change Session Invalidation (Phase 2)', () => {
    it('should invalidate all remote sessions on password change while preserving current session', async () => {
      const result = await authService.handlePasswordChanged(
        'usr-alice',
        'supabase-sess-alice-1',
        '192.168.1.10',
        'Chrome',
      );

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(1);

      // Alice's remote session 2 must be revoked
      const sess2 = mockSessions.find((s) => s.id === 'sess-2');
      expect(sess2?.revokedAt).not.toBeNull();

      // Alice's current session 1 must remain active
      const sess1 = mockSessions.find((s) => s.id === 'sess-1');
      expect(sess1?.revokedAt).toBeNull();

      // Bob's session must NOT be affected
      const sessBob = mockSessions.find((s) => s.id === 'sess-bob-1');
      expect(sessBob?.revokedAt).toBeNull();

      // Audit log must be created
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PASSWORD_CHANGED',
            userId: 'usr-alice',
            details: expect.objectContaining({
              remoteSessionsRevoked: 1,
              currentSessionPreserved: true,
            }),
          }),
        }),
      );
    });

    it('should trigger password change through controller and log audit event', async () => {
      const mockReq = {
        user: { id: 'usr-alice' },
        sessionId: 'supabase-sess-alice-1',
        headers: { 'user-agent': 'Chrome' },
        ip: '192.168.1.10',
      };

      const res = await authController.changePassword(mockReq);
      expect(res.success).toBe(true);
      expect(res.data.revokedCount).toBe(1);
    });
  });

  describe('6. Password Reset Session Invalidation (Phase 2)', () => {
    it('should invalidate all previous sessions when password is reset via recovery', async () => {
      const result = await authService.handlePasswordReset(
        'usr-alice',
        'recovery-session-new',
        '192.168.1.50',
        'Safari',
      );

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(2);

      // All prior sessions of Alice must be marked revoked
      const sess1 = mockSessions.find((s) => s.id === 'sess-1');
      const sess2 = mockSessions.find((s) => s.id === 'sess-2');
      expect(sess1?.revokedAt).not.toBeNull();
      expect(sess2?.revokedAt).not.toBeNull();

      // Bob's session remains untouched
      const sessBob = mockSessions.find((s) => s.id === 'sess-bob-1');
      expect(sessBob?.revokedAt).toBeNull();

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PASSWORD_RESET',
            userId: 'usr-alice',
          }),
        }),
      );
    });

    it('should trigger password-reset-completed endpoint in controller', async () => {
      const mockReq = {
        user: { id: 'usr-alice' },
        sessionId: 'recovery-session-new',
        headers: { 'user-agent': 'Safari' },
        ip: '192.168.1.50',
      };

      const res = await authController.passwordResetCompleted(mockReq);
      expect(res.success).toBe(true);
      expect(res.data.revokedCount).toBe(2);
    });
  });

  describe('7. Idle & Absolute Session Timeout Enforcement (Phase 3)', () => {
    it('should validate session timeout configuration and use enterprise defaults', () => {
      const config = getSessionTimeoutConfig();
      expect(config.idleTimeoutMs).toBe(30 * 60 * 1000); // 30 mins
      expect(config.absoluteTimeoutMs).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(config.lastActiveThrottleMs).toBe(60 * 1000); // 60s
    });

    it('should ALLOW request when session is active and within both idle and absolute limits', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-1',
      });

      const context = createMockContext(token);
      const allowed = await supabaseAuthGuard.canActivate(context);
      expect(allowed).toBe(true);
    });

    it('should REJECT and mark session revoked when IDLE timeout is exceeded (>30 min inactive)', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-idle-expired',
      });

      // Insert an idle-expired session (lastActiveAt 45 mins ago)
      mockSessions.push({
        id: 'sess-idle',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-idle-expired',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        lastActiveAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago (> 30 min)
        revokedAt: null,
      });

      const context = createMockContext(token);

      await expect(supabaseAuthGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify session was marked revoked in DB
      const session = mockSessions.find((s) => s.sessionId === 'supabase-sess-alice-idle-expired');
      expect(session?.revokedAt).not.toBeNull();

      // Verify audit log for idle timeout was created
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SESSION_EXPIRED_IDLE',
            userId: 'usr-alice',
          }),
        }),
      );
    });

    it('should REJECT and mark session revoked when ABSOLUTE timeout is exceeded (>24 hours duration)', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-absolute-expired',
      });

      // Insert an absolute-expired session (createdAt 25 hours ago, active 2 mins ago)
      mockSessions.push({
        id: 'sess-abs',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-absolute-expired',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago (> 24 hours)
        lastActiveAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago (active!)
        revokedAt: null,
      });

      const context = createMockContext(token);

      await expect(supabaseAuthGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify session was marked revoked in DB
      const session = mockSessions.find((s) => s.sessionId === 'supabase-sess-alice-absolute-expired');
      expect(session?.revokedAt).not.toBeNull();

      // Verify audit log for absolute timeout was created
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SESSION_EXPIRED_ABSOLUTE',
            userId: 'usr-alice',
          }),
        }),
      );
    });

    it('should NOT allow activity to extend absolute timeout lifetime', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-abs-2',
      });

      const absSess = {
        id: 'sess-abs-2',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-abs-2',
        createdAt: new Date(Date.now() - 24.5 * 60 * 60 * 1000), // 24.5 hours ago
        lastActiveAt: new Date(Date.now() - 10000), // active 10 seconds ago
        revokedAt: null,
      };
      mockSessions.push(absSess);

      const context = createMockContext(token);
      await expect(supabaseAuthGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(absSess.revokedAt).not.toBeNull();
    });

    it('should allow active persistent session (Remember Me = ON) to remain valid beyond 24 hours', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-persistent-1',
      });

      // Session created 5 days ago with rememberMe: true
      const persistentSession = {
        id: 'sess-persist-1',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-persistent-1',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastActiveAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days remaining
        revokedAt: null,
        rememberMe: true,
      };
      mockSessions.push(persistentSession);

      const context = createMockContext(token);
      const canActivate = await supabaseAuthGuard.canActivate(context);
      expect(canActivate).toBe(true);
      expect(persistentSession.revokedAt).toBeNull();
    });

    it('should reject persistent session when expired past 30 days (Remember Me = ON)', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-persistent-expired',
      });

      // Session created 31 days ago with rememberMe: true
      const expiredPersistentSession = {
        id: 'sess-persist-exp',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-persistent-expired',
        createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
        lastActiveAt: new Date(Date.now() - 5 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // expired 1 day ago
        revokedAt: null,
        rememberMe: true,
      };
      mockSessions.push(expiredPersistentSession);

      const context = createMockContext(token);
      await expect(supabaseAuthGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(expiredPersistentSession.revokedAt).not.toBeNull();
    });

    it('should revoke active database session on logout and block subsequent requests', async () => {
      const token = createValidTestJwt({
        sub: 'usr-alice',
        email: 'alice@example.com',
        session_id: 'supabase-sess-alice-logout-test',
      });

      const logoutSess = {
        id: 'sess-logout-target',
        userId: 'usr-alice',
        sessionId: 'supabase-sess-alice-logout-test',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt: null,
        revokedAt: null,
        rememberMe: true,
      };
      mockSessions.push(logoutSess);

      // 1. Initial request succeeds
      const context = createMockContext(token);
      expect(await supabaseAuthGuard.canActivate(context)).toBe(true);

      // 2. Perform logout
      const req: any = {
        user: { id: 'usr-alice', sub: 'usr-alice', sessionId: 'supabase-sess-alice-logout-test' },
        sessionId: 'supabase-sess-alice-logout-test',
        headers: { 'user-agent': 'Chrome' },
        ip: '127.0.0.1',
      };
      const logoutResult = await authController.logout(req);
      expect(logoutResult.success).toBe(true);
      expect(logoutSess.revokedAt).not.toBeNull();

      // 3. Subsequent request with the same token is rejected
      await expect(supabaseAuthGuard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
