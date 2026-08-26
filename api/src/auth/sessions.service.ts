import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { invalidateSessionCache } from './supabase.guard';

export interface FormattedUserSession {
  id: string;
  deviceType: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
  isRevoked: boolean;
  revokedAt: Date | null;
  rememberMe?: boolean;
}

export interface SecurityActivityDto {
  id: string;
  action: string;
  module: string;
  createdAt: Date;
  ipAddress: string | null;
  browser: string | null;
  operatingSystem: string | null;
  deviceType: string | null;
  sessionId: string | null;
  isCurrent: boolean;
  isRevoked: boolean;
  firstLogin?: boolean;
}

export const SECURITY_ACTIONS_ALLOWLIST = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'NEW_DEVICE_LOGIN',
  'MFA_ENROLLED',
  'MFA_VERIFIED',
  'MFA_DISABLED',
  'MFA_CHALLENGE_FAILED',
  'MFA_RECOVERY_CODE_GENERATED',
  'MFA_RECOVERY_CODE_VERIFIED',
  'AAL2_REQUIRED_DENIED',
  'PASSWORD_CHANGED',
  'PASSWORD_RESET',
  'SESSION_REVOKED',
  'SESSION_REVOKED_REMOTE',
  'ALL_OTHER_SESSIONS_REVOKED',
  'SESSION_EXPIRED_IDLE',
  'SESSION_EXPIRED_ABSOLUTE',
];


@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listUserSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<FormattedUserSession[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceType: session.deviceType || 'unknown',
      browser: session.browser || 'Unknown Browser',
      operatingSystem: session.operatingSystem || 'Unknown OS',
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      isCurrent: Boolean(currentSessionId && session.sessionId === currentSessionId),
      isRevoked: Boolean(session.revokedAt),
      revokedAt: session.revokedAt,
      rememberMe: Boolean((session as any).rememberMe),
    }));
  }

  async revokeSession(
    userId: string,
    targetId: string,
    currentSessionId?: string,
    reqIp?: string,
    userAgent?: string,
  ) {
    // Strictly verify ownership via userId to prevent IDOR
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: targetId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found or not owned by the current user');
    }

    if (session.revokedAt) {
      return {
        success: true,
        message: 'Session is already revoked',
        sessionId: session.id,
      };
    }

    const updated = await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Invalidate guard memory cache for this session
    invalidateSessionCache(session.sessionId, userId);

    const isCurrent = Boolean(currentSessionId && session.sessionId === currentSessionId);
    const action = isCurrent ? 'SESSION_REVOKED' : 'SESSION_REVOKED_REMOTE';

    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          module: 'Security',
          details: {
            sessionRecordId: session.id,
            browser: session.browser,
            operatingSystem: session.operatingSystem,
            deviceType: session.deviceType,
            isCurrentSession: isCurrent,
          },
          ipAddress: reqIp || null,
          userAgent: userAgent || null,
        },
      });
    } catch (auditErr: any) {
      this.logger.warn(`Failed to write session revocation audit log: ${auditErr?.message || auditErr}`);
    }

    return {
      success: true,
      message: isCurrent ? 'Current session revoked' : 'Remote session revoked successfully',
      sessionId: updated.id,
      isCurrent,
    };
  }

  async revokeSessionBySessionId(
    userId: string,
    sessionId: string,
    reqIp?: string,
    userAgent?: string,
  ) {
    const session = await this.prisma.userSession.findFirst({
      where: {
        sessionId,
        userId,
      },
    });

    if (!session) {
      return null;
    }

    return this.revokeSession(userId, session.id, sessionId, reqIp, userAgent);
  }

  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string,
    reqIp?: string,
    userAgent?: string,
  ) {
    // Find all other active sessions
    const otherSessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        sessionId: { not: currentSessionId },
        revokedAt: null,
      },
    });

    if (otherSessions.length === 0) {
      return {
        success: true,
        message: 'No other active sessions found',
        revokedCount: 0,
      };
    }

    const now = new Date();
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        sessionId: { not: currentSessionId },
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    });

    // Invalidate each revoked session in guard cache
    for (const s of otherSessions) {
      invalidateSessionCache(s.sessionId);
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ALL_OTHER_SESSIONS_REVOKED',
          module: 'Security',
          details: {
            revokedCount: otherSessions.length,
            revokedSessionIds: otherSessions.map((s) => s.id),
          },
          ipAddress: reqIp || null,
          userAgent: userAgent || null,
        },
      });
    } catch (auditErr: any) {
      this.logger.warn(`Failed to write all other sessions revoked audit log: ${auditErr?.message || auditErr}`);
    }

    return {
      success: true,
      message: `Successfully revoked ${otherSessions.length} other active session(s)`,
      revokedCount: otherSessions.length,
    };
  }

  async getSecurityActivity(
    userId: string,
    currentSessionId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ activity: SecurityActivityDto[]; total: number; page: number; limit: number }> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // 1. Fetch user security audit logs (strictly isolated by userId)
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          userId,
          action: { in: SECURITY_ACTIONS_ALLOWLIST },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          action: true,
          module: true,
          details: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({
        where: {
          userId,
          action: { in: SECURITY_ACTIONS_ALLOWLIST },
        },
      }),
    ]);

    // 2. Fetch user active/revoked sessions for session correlation
    const userSessions = await this.prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        sessionId: true,
        revokedAt: true,
      },
    });

    const sessionMap = new Map<string, { isCurrent: boolean; isRevoked: boolean; id: string }>();
    for (const s of userSessions) {
      const isCurrent = Boolean(currentSessionId && s.sessionId === currentSessionId);
      const isRevoked = Boolean(s.revokedAt);
      sessionMap.set(s.id, { isCurrent, isRevoked, id: s.id });
      sessionMap.set(s.sessionId, { isCurrent, isRevoked, id: s.id });
    }

    // 3. Map to strictly sanitized DTO (zero sensitive fields)
    const activity: SecurityActivityDto[] = logs.map((log) => {
      const details: any =
        typeof log.details === 'object' && log.details !== null ? log.details : {};
      const refSessionId = details.sessionId || details.sessionRecordId || null;
      const sessionInfo = refSessionId ? sessionMap.get(refSessionId) : null;

      return {
        id: log.id,
        action: log.action,
        module: log.module || 'Security',
        createdAt: log.createdAt,
        ipAddress: log.ipAddress || null,
        browser: details.browser || null,
        operatingSystem: details.operatingSystem || null,
        deviceType: details.deviceType || null,
        sessionId: sessionInfo ? sessionInfo.id : refSessionId || null,
        isCurrent: sessionInfo ? sessionInfo.isCurrent : false,
        isRevoked: sessionInfo ? sessionInfo.isRevoked : false,
        firstLogin: Boolean(details.firstLogin),
      };
    });

    return {
      activity,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }
}

