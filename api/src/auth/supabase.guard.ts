import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Optional,
  Logger,
} from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { parseUserAgent } from '../common/utils/device-parser.util';
import { getClientIp } from '../common/utils/rate-limit.util';
import { getSessionTimeoutConfig } from '../common/utils/session-config.util';
import { EmailService } from '../common/services/email.service';
import { NotificationsService } from '../notifications/services/notifications.service';

// In-memory token cache for authenticated users (60s TTL)
interface CachedTokenUser {
  user: User & { sessionId?: string };
  sessionId: string;
  rememberMe?: boolean;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

const tokenUserCache = new Map<string, CachedTokenUser>();
const revokedSessionsSet = new Set<string>();
let cachedSupabaseClient: SupabaseClient | null = null;

export function setSupabaseClient(client: any) {
  cachedSupabaseClient = client;
}

function getSupabaseClient(): SupabaseClient {
  if (cachedSupabaseClient) return cachedSupabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing');
  }

  cachedSupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedSupabaseClient;
}

// Periodically clean expired tokens and memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tokenUserCache.entries()) {
    if (val.expiresAt <= now) {
      tokenUserCache.delete(key);
    }
  }
}, 60000).unref?.();

/**
 * Invalidate cached token user records when user status or privileges change
 */
export function invalidateTokenUserCache(userId?: string) {
  if (userId) {
    for (const [token, cached] of tokenUserCache.entries()) {
      if (cached.user?.id === userId || (cached.user as any)?.sub === userId) {
        tokenUserCache.delete(token);
      }
    }
  } else {
    tokenUserCache.clear();
  }
}

/**
 * Invalidate and block a specific revoked session identifier
 */
export function invalidateSessionCache(sessionId?: string, userId?: string) {
  if (sessionId) {
    revokedSessionsSet.add(sessionId);
    for (const [token, cached] of tokenUserCache.entries()) {
      if (cached.sessionId === sessionId) {
        tokenUserCache.delete(token);
      }
    }
  } else {
    revokedSessionsSet.clear();
  }
  if (userId) {
    invalidateTokenUserCache(userId);
  }
}

/**
 * Safely derive a deterministic session identifier from JWT claims or token payload
 */
export function deriveSessionId(token: string, claimsOrUser?: any): string {
  if (claimsOrUser?.session_id) {
    return claimsOrUser.session_id;
  }
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      if (payload.session_id) {
        return payload.session_id;
      }
    }
  } catch {
    // Fall back to token hash
  }

  const userId = claimsOrUser?.id || claimsOrUser?.sub || 'anonymous';
  const tokenSig = token.split('.')[2] || token;
  return crypto.createHash('sha256').update(`${userId}:${tokenSig}`).digest('hex');
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  public emailServiceInstance: EmailService;

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly emailService?: EmailService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {
    this.emailServiceInstance = emailService || new EmailService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.headers.cookie) {
      // Extract from Supabase SSR cookie
      const cookies = request.headers.cookie;
      const match = cookies.match(/(?:^|;)\s*sb-[a-z0-9]+-auth-token=([^;]+)/);
      if (match) {
        try {
          const parsed = JSON.parse(decodeURIComponent(match[1]));
          token = parsed[0];
          if (typeof token !== 'string') {
            token = parsed.access_token || parsed[0] || '';
          }
        } catch (e) {
          token = decodeURIComponent(match[1]);
        }
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    const now = Date.now();
    const { idleTimeoutMs, absoluteTimeoutMs, persistentTimeoutMs, lastActiveThrottleMs } = getSessionTimeoutConfig();
    const cached = tokenUserCache.get(token);

    if (cached && cached.expiresAt > now) {
      // Check in-memory revoked set
      if (revokedSessionsSet.has(cached.sessionId)) {
        tokenUserCache.delete(token);
        throw new UnauthorizedException('Session has been revoked. Please sign in again.');
      }

      // Check timeout on fast cache hit
      const isPersistent = Boolean(cached.rememberMe);
      const isExpired = isPersistent
        ? now > cached.createdAt + persistentTimeoutMs
        : now > cached.createdAt + absoluteTimeoutMs || now > cached.lastActiveAt + idleTimeoutMs;

      if (isExpired) {
        tokenUserCache.delete(token);
        revokedSessionsSet.add(cached.sessionId);
      } else {
        cached.lastActiveAt = now;
        request.user = cached.user;
        request.sessionId = cached.sessionId;
        return true;
      }
    }

    const supabase = getSupabaseClient();
    let user: any = null;
    let sessionId = '';

    try {
      const { data, error } = await (supabase.auth as any).getClaims(token);
      if (!error && data?.claims) {
        const claims: any = data.claims;
        sessionId = deriveSessionId(token, claims);
        user = {
          id: claims.sub,
          sub: claims.sub,
          email: claims.email,
          user_metadata: claims.user_metadata || {},
          app_metadata: claims.app_metadata || {},
          role: claims.role,
          aud: claims.aud,
          aal: claims.aal || 'aal1',
          amr: Array.isArray(claims.amr) ? claims.amr : [],
          sessionId,
          ...claims,
        };
      }
    } catch {
      // Fall through to getUser
    }

    if (!user) {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        tokenUserCache.delete(token);
        throw new UnauthorizedException(
          error?.message || 'Invalid or expired authentication token',
        );
      }

      sessionId = deriveSessionId(token, data.user);

      let aal = 'aal1';
      let amr: any[] = [];
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length >= 2) {
          const payloadJson = Buffer.from(tokenParts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          if (payload.aal) aal = payload.aal;
          if (Array.isArray(payload.amr)) amr = payload.amr;
          if (payload.session_id) sessionId = payload.session_id;
        }
      } catch {
        // Use default aal1
      }

      user = {
        id: data.user.id,
        sub: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata || {},
        app_metadata: data.user.app_metadata || {},
        role: data.user.role,
        aud: data.user.aud,
        aal,
        amr,
        sessionId,
      };
    }

    if (!user.aal) {
      user.aal = 'aal1';
    }
    user.sessionId = sessionId;

    // Check fast revoked set
    if (revokedSessionsSet.has(sessionId)) {
      tokenUserCache.delete(token);
      throw new UnauthorizedException('Session has been revoked. Please sign in again.');
    }

    let sessionCreatedAt = now;
    let sessionLastActiveAt = now;
    let isSessionRemembered =
      request.headers['x-remember-me'] === 'true' ||
      request.headers['x-remember-me'] === '1';

    // Check DB for session revocation, absolute timeout, idle timeout, and P4 security status
    if (this.prisma) {
      try {
        // P4 Server-Side Check 1: Global Platform Emergency Mode Check
        const platformState = await (this.prisma as any).platformSecurityState
          ?.findUnique({ where: { id: 'global' } })
          .catch(() => null);

        if (platformState?.emergencyMode) {
          const isSuperAdmin = user.isSuperAdmin === true;
          const isAal2 = user.aal === 'aal2';
          if (!isSuperAdmin || !isAal2) {
            tokenUserCache.delete(token);
            throw new ForbiddenException(
              'Platform is in emergency lockdown mode. Access restricted to verified Super Admins with AAL2 authentication.',
            );
          }
        }

        // P4 Server-Side Check 2: User Account Lock Check
        const dbUser = await (this.prisma as any).user
          ?.findUnique({
            where: { id: user.id },
            select: { securityStatus: true, isSuperAdmin: true },
          })
          .catch(() => null);

        if (dbUser && dbUser.securityStatus === 'LOCKED') {
          revokedSessionsSet.add(sessionId);
          tokenUserCache.delete(token);
          throw new ForbiddenException(
            'Your account has been locked due to security policy. Please contact your system administrator.',
          );
        }

        // P4 Server-Side Check 3: Tenant Organization Lockdown Check
        if (request.tenantId && !user.isSuperAdmin) {
          const dbTenant = await (this.prisma as any).tenant
            ?.findUnique({
              where: { id: request.tenantId },
              select: { securityStatus: true },
            })
            .catch(() => null);

          if (dbTenant && dbTenant.securityStatus === 'LOCKED') {
            tokenUserCache.delete(token);
            throw new ForbiddenException(
              'Your organization has been temporarily locked for security verification. Please contact support.',
            );
          }
        }

        const sessionRecord = await this.prisma.userSession.findUnique({
          where: { sessionId },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            lastActiveAt: true,
            expiresAt: true,
            revokedAt: true,
            rememberMe: true,
          },
        });

        const ip = getClientIp(request);
        const ua = request.headers['user-agent'] || '';
        const deviceInfo = parseUserAgent(ua);
        const isRememberMeHeader =
          request.headers['x-remember-me'] === 'true' ||
          request.headers['x-remember-me'] === '1';

        let isSessionRemembered = false;

        if (sessionRecord) {
          sessionCreatedAt = sessionRecord.createdAt.getTime();
          sessionLastActiveAt = sessionRecord.lastActiveAt.getTime();
          isSessionRemembered = Boolean(sessionRecord.rememberMe);

          // If client passes explicit X-Remember-Me and session is not marked, upgrade session persistence
          if (isRememberMeHeader && !sessionRecord.rememberMe) {
            isSessionRemembered = true;
            await this.prisma.userSession
              .update({
                where: { sessionId },
                data: {
                  rememberMe: true,
                  expiresAt: new Date(sessionCreatedAt + persistentTimeoutMs),
                },
              })
              .catch(() => {});
          }

          // 1. Check explicit revocation
          if (sessionRecord.revokedAt) {
            revokedSessionsSet.add(sessionId);
            tokenUserCache.delete(token);
            throw new UnauthorizedException('Session has been revoked. Please sign in again.');
          }

          // 2. Check absolute / persistent timeout expiry
          const maxSessionLifetime = isSessionRemembered ? persistentTimeoutMs : absoluteTimeoutMs;
          const effectiveExpiresAt = sessionRecord.expiresAt
            ? sessionRecord.expiresAt.getTime()
            : sessionCreatedAt + maxSessionLifetime;

          if (now > sessionCreatedAt + maxSessionLifetime || now > effectiveExpiresAt) {
            revokedSessionsSet.add(sessionId);
            tokenUserCache.delete(token);
            await this.prisma.userSession
              .update({
                where: { sessionId },
                data: { revokedAt: new Date() },
              })
              .catch(() => {});

            await this.prisma.auditLog
              .create({
                data: {
                  userId: user.id,
                  action: 'SESSION_EXPIRED_ABSOLUTE',
                  module: 'Security',
                  details: {
                    sessionId: sessionRecord.id,
                    rememberMe: isSessionRemembered,
                    sessionLifetimeHours: Math.round((now - sessionCreatedAt) / 3600000),
                  },
                  ipAddress: typeof ip === 'string' ? ip : null,
                  userAgent: ua || null,
                },
              })
              .catch(() => {});

            throw new UnauthorizedException(
              'Session has expired (maximum session duration reached). Please sign in again.',
            );
          }

          // 3. Check idle timeout expiry (for non-persistent sessions)
          if (!isSessionRemembered) {
            const idleExpiresAt = sessionLastActiveAt + idleTimeoutMs;
            if (now > idleExpiresAt) {
              revokedSessionsSet.add(sessionId);
              tokenUserCache.delete(token);
              await this.prisma.userSession
                .update({
                  where: { sessionId },
                  data: { revokedAt: new Date() },
                })
                .catch(() => {});

              await this.prisma.auditLog
                .create({
                  data: {
                    userId: user.id,
                    action: 'SESSION_EXPIRED_IDLE',
                    module: 'Security',
                    details: {
                      sessionId: sessionRecord.id,
                      idleMinutes: Math.round((now - sessionLastActiveAt) / 60000),
                    },
                    ipAddress: typeof ip === 'string' ? ip : null,
                    userAgent: ua || null,
                  },
                })
                .catch(() => {});

              throw new UnauthorizedException(
                'Session has expired due to inactivity. Please sign in again.',
              );
            }
          }

          // 4. Valid active session - throttle lastActiveAt updates
          if (now - sessionLastActiveAt > lastActiveThrottleMs) {
            sessionLastActiveAt = now;
            await this.prisma.userSession
              .update({
                where: { sessionId },
                data: {
                  lastActiveAt: new Date(),
                  ipAddress: typeof ip === 'string' ? ip : null,
                },
              })
              .catch(() => {});
          }
        } else {
          isSessionRemembered = isRememberMeHeader;

          // Check prior session history for device matching before registering new session
          const priorMatchingSession = await this.prisma.userSession
            .findFirst({
              where: {
                userId: user.id,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                operatingSystem: deviceInfo.operatingSystem,
              },
              select: { id: true },
            })
            .catch(() => null);

          let firstLogin = false;
          let isNewDevice = false;
          let loginAction = 'LOGIN_SUCCESS';

          if (!priorMatchingSession) {
            // No matching device environment found. Check if this is the user's first-ever login
            const priorAnySession = await this.prisma.userSession
              .findFirst({
                where: { userId: user.id },
                select: { id: true },
              })
              .catch(() => null);

            if (!priorAnySession) {
              // First-ever login for this user
              firstLogin = true;
              isNewDevice = false;
              loginAction = 'LOGIN_SUCCESS';
            } else {
              // Returning user from a new device/browser environment
              firstLogin = false;
              isNewDevice = true;
              loginAction = 'NEW_DEVICE_LOGIN';
            }
          } else {
            // Known device environment
            firstLogin = false;
            isNewDevice = false;
            loginAction = 'LOGIN_SUCCESS';
          }

          const initialExpiresAt = isSessionRemembered
            ? new Date(now + persistentTimeoutMs)
            : new Date(now + absoluteTimeoutMs);

          // Register new session
          const createdSession = await this.prisma.userSession
            .create({
              data: {
                userId: user.id,
                sessionId,
                ipAddress: typeof ip === 'string' ? ip : null,
                userAgent: ua || null,
                deviceType: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                operatingSystem: deviceInfo.operatingSystem,
                lastActiveAt: new Date(),
                expiresAt: initialExpiresAt,
                rememberMe: isSessionRemembered,
              },
            })
            .catch(() => null);

          if (createdSession) {
            sessionCreatedAt = createdSession.createdAt.getTime();
            sessionLastActiveAt = createdSession.lastActiveAt.getTime();

            // Emit secure AuditLog event for login / session creation
            await this.prisma.auditLog
              .create({
                data: {
                  userId: user.id,
                  action: loginAction,
                  module: 'Security',
                  details: {
                    sessionId: createdSession.id,
                    rememberMe: isSessionRemembered,
                    browser: deviceInfo.browser,
                    operatingSystem: deviceInfo.operatingSystem,
                    deviceType: deviceInfo.deviceType,
                    isNewDevice,
                    firstLogin,
                  },
                  ipAddress: typeof ip === 'string' ? ip : null,
                  userAgent: ua || null,
                },
              })
              .catch(() => {});

            // Phase P1 & P2: Gated alert delivery with distributed Redis deduplication
            if (loginAction === 'NEW_DEVICE_LOGIN') {
              try {
                const shouldAlert =
                  await this.emailServiceInstance.shouldSendNewDeviceAlert(
                    user.id,
                    deviceInfo.browser,
                    deviceInfo.operatingSystem,
                    deviceInfo.deviceType,
                  );

                if (shouldAlert) {
                  // 1. In-App Notification (Tenant Scoped & FORCE RLS Safe)
                  try {
                    const membership = await this.prisma.tenantUser
                      .findFirst({
                        where: { userId: user.id, status: 'ACTIVE' },
                        select: { tenantId: true },
                      })
                      .catch(() => null);

                    if (membership?.tenantId) {
                      const notifTitle = 'New Sign-In Detected';
                      const notifMessage = `Your account was signed in from a new ${deviceInfo.browser} browser on ${deviceInfo.operatingSystem}.`;

                      if (this.notificationsService) {
                        await this.notificationsService
                          .createNotification(
                            membership.tenantId,
                            user.id,
                            notifTitle,
                            notifMessage,
                            'SECURITY',
                          )
                          .catch((err) => {
                            this.logger.warn(
                              `Failed to create in-app notification for new device sign-in: ${err?.message || err}`,
                            );
                          });
                      } else {
                        await this.prisma
                          .withTenantContext(
                            { tenantId: membership.tenantId },
                            async (tx) => {
                              return tx.notification.create({
                                data: {
                                  tenantId: membership.tenantId,
                                  userId: user.id,
                                  title: notifTitle,
                                  message: notifMessage,
                                  type: 'SECURITY',
                                },
                              });
                            },
                          )
                          .catch((err) => {
                            this.logger.warn(
                              `Failed to create in-app notification via tenant context: ${err?.message || err}`,
                            );
                          });
                      }
                    }
                  } catch (notifErr: any) {
                    this.logger.warn(
                      `Non-fatal error in new device in-app notification dispatch: ${notifErr?.message || notifErr}`,
                    );
                  }

                  // 2. Transactional Security Email (Non-blocking / Graceful Failure)
                  try {
                    const verifiedEmail = user.email;
                    if (
                      verifiedEmail &&
                      typeof verifiedEmail === 'string' &&
                      verifiedEmail.includes('@')
                    ) {
                      // Fire-and-forget asynchronous alert: does not block or fail login
                      this.emailServiceInstance
                        .sendNewDeviceAlert({
                          to: verifiedEmail,
                          deviceType: deviceInfo.deviceType,
                          browser: deviceInfo.browser,
                          operatingSystem: deviceInfo.operatingSystem,
                          ipAddress: typeof ip === 'string' ? ip : null,
                          time: new Date(),
                        })
                        .catch((emailErr) => {
                          this.logger.warn(
                            `Non-fatal error sending new device security email: ${emailErr?.message || emailErr}`,
                          );
                        });
                    }
                  } catch (emailDispatchErr: any) {
                    this.logger.warn(
                      `Non-fatal error in security email dispatch trigger: ${emailDispatchErr?.message || emailDispatchErr}`,
                    );
                  }
                }
              } catch (alertGateErr: any) {
                this.logger.warn(
                  `Non-fatal error during new-device alert gating: ${alertGateErr?.message || alertGateErr}`,
                );
              }
            }
          } else {
            // Concurrent request fallback: retrieve the existing session record if another request inserted it
            const existingFallback = await this.prisma.userSession
              .findUnique({
                where: { sessionId },
                select: { createdAt: true, lastActiveAt: true },
              })
              .catch(() => null);

            if (existingFallback) {
              sessionCreatedAt = existingFallback.createdAt.getTime();
              sessionLastActiveAt = existingFallback.lastActiveAt.getTime();
            }
          }
        }
      } catch (dbErr: any) {
        if (dbErr instanceof UnauthorizedException || dbErr instanceof ForbiddenException) {
          throw dbErr;
        }
        // Suppress other non-fatal session registry DB errors
      }
    }

    // Cache valid user for 60 seconds
    tokenUserCache.set(token, {
      user,
      sessionId,
      rememberMe: isSessionRemembered,
      createdAt: sessionCreatedAt,
      lastActiveAt: sessionLastActiveAt,
      expiresAt: now + 60000,
    });

    request.user = user;
    request.sessionId = sessionId;
    return true;
  }
}
