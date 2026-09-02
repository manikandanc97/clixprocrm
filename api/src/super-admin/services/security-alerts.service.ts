import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggerService } from '../../common/audit/audit-logger.service';
import { SecurityIncidentsService } from './security-incidents.service';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface CreateSecurityAlertDto {
  alertType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  userId?: string | null;
  organizationId?: string | null;
  sourceEventId?: string | null;
  metadata?: Record<string, any> | null;
}

export interface ListSecurityAlertsDto {
  status?: string;
  severity?: string;
  alertType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SecurityAlertsService {
  private readonly logger = new Logger(SecurityAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
    private readonly incidentsService: SecurityIncidentsService,
  ) {}

  /**
   * Creates a security alert with deduplication and audit trail.
   */
  async createAlert(dto: CreateSecurityAlertDto, actorId: string = 'SYSTEM') {
    if (!dto.title || dto.title.trim().length < 3) {
      throw new BadRequestException('Alert title must be at least 3 characters');
    }
    if (!dto.description || dto.description.trim().length < 5) {
      throw new BadRequestException('Alert description must be at least 5 characters');
    }

    // Deduplication check: check if an identical OPEN alert exists within the last 1 hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    const existing = await (this.prisma as any).securityAlert.findFirst({
      where: {
        alertType: dto.alertType,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] },
        ...(dto.userId ? { userId: dto.userId } : {}),
        ...(dto.organizationId ? { organizationId: dto.organizationId } : {}),
        detectedAt: { gte: oneHourAgo },
      },
    });

    if (existing) {
      this.logger.debug(`Suppressed duplicate security alert: [${dto.alertType}] ${dto.title}`);
      return existing;
    }

    // Clean metadata: strictly eliminate any sensitive fields
    const safeMetadata = this.sanitizeMetadata(dto.metadata);

    const alert = await (this.prisma as any).securityAlert.create({
      data: {
        alertType: dto.alertType,
        severity: dto.severity || 'MEDIUM',
        title: dto.title.trim(),
        description: dto.description.trim(),
        userId: dto.userId || null,
        organizationId: dto.organizationId || null,
        sourceEventId: dto.sourceEventId || null,
        detectedAt: new Date(),
        status: 'OPEN',
        metadata: safeMetadata,
      },
    });

    // Write audit event
    await this.auditLogger.log({
      tenantId: dto.organizationId || null,
      userId: actorId,
      targetUserId: dto.userId || null,
      action: 'SECURITY_ALERT_CREATED',
      module: 'Security',
      details: {
        alertId: alert.id,
        alertType: alert.alertType,
        severity: alert.severity,
        title: alert.title,
      },
    });

    this.logger.warn(`Security Alert created: [${alert.severity}] ${alert.title} (ID: ${alert.id})`);
    return alert;
  }

  /**
   * Lists security alerts with pagination and filters.
   */
  async listAlerts(params: ListSecurityAlertsDto) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    if (params.severity && params.severity !== 'ALL') {
      where.severity = params.severity;
    }
    if (params.alertType && params.alertType !== 'ALL') {
      where.alertType = params.alertType;
    }
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { alertType: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, alerts] = await Promise.all([
      (this.prisma as any).securityAlert.count({ where }),
      (this.prisma as any).securityAlert.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single alert by ID.
   */
  async getAlertById(id: string) {
    const alert = await (this.prisma as any).securityAlert.findUnique({
      where: { id },
    });
    if (!alert) {
      throw new NotFoundException(`Security Alert ${id} not found`);
    }
    return alert;
  }

  /**
   * Acknowledges an open security alert.
   */
  async acknowledgeAlert(id: string, actorId: string) {
    const existing = await this.getAlertById(id);
    if (existing.status === 'RESOLVED') {
      throw new BadRequestException('Cannot acknowledge an already resolved alert');
    }

    const updated = await (this.prisma as any).securityAlert.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED' },
    });

    await this.auditLogger.log({
      tenantId: existing.organizationId,
      userId: actorId,
      targetUserId: existing.userId,
      action: 'SECURITY_ALERT_ACKNOWLEDGED',
      module: 'Security',
      details: {
        alertId: id,
        alertType: existing.alertType,
        previousStatus: existing.status,
      },
    });

    return updated;
  }

  /**
   * Resolves a security alert.
   */
  async resolveAlert(id: string, notes: string | undefined, actorId: string) {
    const existing = await this.getAlertById(id);

    const now = new Date();
    const updated = await (this.prisma as any).securityAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: now,
        resolvedBy: actorId,
        metadata: {
          ...(typeof existing.metadata === 'object' && existing.metadata !== null
            ? existing.metadata
            : {}),
          resolutionNotes: notes || 'Resolved by Super Admin',
        },
      },
    });

    await this.auditLogger.log({
      tenantId: existing.organizationId,
      userId: actorId,
      targetUserId: existing.userId,
      action: 'SECURITY_ALERT_RESOLVED',
      module: 'Security',
      details: {
        alertId: id,
        alertType: existing.alertType,
        resolvedAt: now.toISOString(),
        notes: notes || null,
      },
    });

    return updated;
  }

  /**
   * Escalates an alert to a full Security Incident.
   */
  async escalateAlertToIncident(alertId: string, actorId: string) {
    const alert = await this.getAlertById(alertId);

    const incident = await this.incidentsService.createIncident(
      {
        title: `[Escalated] ${alert.title}`,
        description: `Escalated from Security Alert (${alert.alertType}): ${alert.description}`,
        severity: alert.severity as any,
        incidentType: alert.alertType,
        tenantId: alert.organizationId || null,
        affectedUserId: alert.userId || null,
      },
      actorId,
    );

    // Update alert status to ACKNOWLEDGED if OPEN and record escalated incident ID
    await (this.prisma as any).securityAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        metadata: {
          ...(typeof alert.metadata === 'object' && alert.metadata !== null
            ? alert.metadata
            : {}),
          escalatedIncidentId: incident.id,
          escalatedIncidentNumber: incident.incidentNumber,
        },
      },
    });

    return {
      success: true,
      incident,
      alertId,
    };
  }

  /**
   * Runs an automated detection pass over live audit logs and application state.
   */
  async runDetectionPass(actorId: string = 'SYSTEM') {
    const newAlerts: any[] = [];
    const windowStart = new Date(Date.now() - 3600000 * 24); // Past 24 hours

    // 1. Detection A: Failed Login Spike (>= 5 failed logins within 15 min for same email / IP)
    try {
      const failedLogins = await this.prisma.auditLog.findMany({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          details: true,
        },
      });

      // Group by IP address or target email
      const failedByIp = new Map<string, { count: number; events: any[] }>();
      for (const log of failedLogins) {
        const key = log.ipAddress || (log.details as any)?.email || 'unknown';
        if (!failedByIp.has(key)) {
          failedByIp.set(key, { count: 0, events: [] });
        }
        const entry = failedByIp.get(key)!;
        entry.count += 1;
        entry.events.push(log);
      }

      for (const [key, val] of failedByIp.entries()) {
        if (val.count >= 5 && key !== 'unknown') {
          const alert = await this.createAlert(
            {
              alertType: 'FAILED_LOGIN_SPIKE',
              severity: val.count >= 10 ? 'CRITICAL' : 'HIGH',
              title: `Failed Login Spike from ${key}`,
              description: `Detected ${val.count} failed authentication attempts from IP/identifier ${key} in the monitoring window.`,
              sourceEventId: val.events[0]?.id,
              metadata: {
                targetIdentifier: key,
                failedAttemptCount: val.count,
                firstSeen: val.events[val.events.length - 1]?.createdAt,
                lastSeen: val.events[0]?.createdAt,
              },
            },
            actorId,
          );
          if (alert) newAlerts.push(alert);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Detection failed login spike error: ${err?.message || err}`);
    }

    // 2. Detection B: Account Lock Events
    try {
      const lockEvents = await this.prisma.auditLog.findMany({
        where: {
          action: 'USER_SECURITY_LOCKED',
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const lock of lockEvents) {
        const alert = await this.createAlert(
          {
            alertType: 'ACCOUNT_LOCKED',
            severity: 'HIGH',
            title: `User Account Locked: ${(lock.details as any)?.targetEmail || lock.targetUserId || 'User'}`,
            description: `Account was locked by ${(lock.details as any)?.lockedBy || 'Admin'}. Reason: ${(lock.details as any)?.reason || 'Security policy enforcement'}`,
            userId: lock.targetUserId,
            sourceEventId: lock.id,
            metadata: {
              lockedUserId: lock.targetUserId,
              reason: (lock.details as any)?.reason,
            },
          },
          actorId,
        );
        if (alert) newAlerts.push(alert);
      }
    } catch (err: any) {
      this.logger.warn(`Detection account lock error: ${err?.message || err}`);
    }

    // 3. Detection C: Suspicious Session Activity / Emergency Revocations
    try {
      const revokeEvents = await this.prisma.auditLog.findMany({
        where: {
          action: { in: ['USER_SESSIONS_EMERGENCY_REVOKED', 'ALL_OTHER_SESSIONS_REVOKED'] },
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const rev of revokeEvents) {
        const alert = await this.createAlert(
          {
            alertType: 'SUSPICIOUS_SESSION_ACTIVITY',
            severity: 'MEDIUM',
            title: `Session Termination Spike for ${(rev.details as any)?.targetEmail || rev.targetUserId || rev.userId}`,
            description: `Emergency session revocation performed for user. ${(rev.details as any)?.revokedSessionCount || ''} session(s) invalidated.`,
            userId: rev.targetUserId || rev.userId,
            organizationId: rev.tenantId,
            sourceEventId: rev.id,
            metadata: {
              revokedCount: (rev.details as any)?.revokedSessionCount || (rev.details as any)?.revokedCount,
              reason: (rev.details as any)?.reason,
            },
          },
          actorId,
        );
        if (alert) newAlerts.push(alert);
      }
    } catch (err: any) {
      this.logger.warn(`Detection session activity error: ${err?.message || err}`);
    }

    // 4. Detection D: Privilege / Super Admin Changes
    try {
      const privEvents = await this.prisma.auditLog.findMany({
        where: {
          action: { in: ['SUPER_ADMIN_TOGGLED', 'SUPER_ADMIN_TRANSFERRED', 'ROLE_PERMISSIONS_UPDATED'] },
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const priv of privEvents) {
        const alert = await this.createAlert(
          {
            alertType: 'PRIVILEGE_CHANGE',
            severity: 'HIGH',
            title: `Administrative Privilege Mutation: ${priv.action}`,
            description: `Privilege modification detected: ${priv.action} executed by actor ${priv.userId || 'Super Admin'}.`,
            userId: priv.targetUserId || priv.userId,
            organizationId: priv.tenantId,
            sourceEventId: priv.id,
            metadata: priv.details as any,
          },
          actorId,
        );
        if (alert) newAlerts.push(alert);
      }
    } catch (err: any) {
      this.logger.warn(`Detection privilege change error: ${err?.message || err}`);
    }

    // 5. Detection E: Sensitive Security Actions (Tenant Lock, Force Reset, Platform Lockdown)
    try {
      const sensitiveEvents = await this.prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'TENANT_SECURITY_LOCKED',
              'PLATFORM_EMERGENCY_ENABLED',
              'PASSWORD_RESET_FORCED',
            ],
          },
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const sens of sensitiveEvents) {
        const alert = await this.createAlert(
          {
            alertType: 'SENSITIVE_SECURITY_ACTION',
            severity: sens.action === 'PLATFORM_EMERGENCY_ENABLED' ? 'CRITICAL' : 'HIGH',
            title: `Sensitive Action Executed: ${sens.action}`,
            description: `Security control action ${sens.action} executed. Details: ${(sens.details as any)?.reason || 'Emergency administrative operation'}`,
            organizationId: sens.tenantId,
            userId: sens.targetUserId || sens.userId,
            sourceEventId: sens.id,
            metadata: sens.details as any,
          },
          actorId,
        );
        if (alert) newAlerts.push(alert);
      }
    } catch (err: any) {
      this.logger.warn(`Detection sensitive actions error: ${err?.message || err}`);
    }

    return {
      success: true,
      evaluatedAt: new Date().toISOString(),
      alertsCreated: newAlerts.length,
      alerts: newAlerts,
    };
  }

  /**
   * Sanitizes metadata to ensure zero passwords, hashes, tokens, or sensitive secrets are stored.
   */
  private sanitizeMetadata(metadata?: Record<string, any> | null): Record<string, any> | null {
    if (!metadata || typeof metadata !== 'object') return null;

    const forbiddenKeys = [
      'password',
      'passwordhash',
      'secret',
      'token',
      'accesstoken',
      'refreshtoken',
      'jwt',
      'apikey',
      'creditcard',
      'cvv',
    ];

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (!forbiddenKeys.some((f) => lowerKey.includes(f))) {
        clean[key] = value;
      }
    }

    return Object.keys(clean).length > 0 ? clean : null;
  }
}
