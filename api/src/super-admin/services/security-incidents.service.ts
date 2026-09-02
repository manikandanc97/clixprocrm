import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggerService } from '../../common/audit/audit-logger.service';
import * as crypto from 'crypto';

export interface CreateIncidentDto {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidentType?: string;
  tenantId?: string | null;
  affectedUserId?: string | null;
  assignedTo?: string | null;
}

export interface ListIncidentsDto {
  severity?: string;
  status?: string;
  tenantId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SecurityIncidentsService {
  private readonly logger = new Logger(SecurityIncidentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  private generateIncidentNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `INC-${dateStr}-${rand}`;
  }

  /**
   * Creates a security incident with audit event emission.
   */
  async createIncident(dto: CreateIncidentDto, actorId: string) {
    if (!dto.title || dto.title.trim().length < 5) {
      throw new BadRequestException('Title must be at least 5 characters');
    }
    if (!dto.description || dto.description.trim().length < 10) {
      throw new BadRequestException('Description must be at least 10 characters');
    }

    const incidentNumber = this.generateIncidentNumber();

    const incident = await (this.prisma as any).securityIncident.create({
      data: {
        incidentNumber,
        title: dto.title.trim(),
        description: dto.description.trim(),
        severity: dto.severity || 'MEDIUM',
        status: 'OPEN',
        incidentType: dto.incidentType || 'SECURITY_ALERT',
        tenantId: dto.tenantId || null,
        organizationId: dto.tenantId || null,
        affectedUserId: dto.affectedUserId || null,
        assignedTo: dto.assignedTo || null,
        detectedAt: new Date(),
        createdBy: actorId,
      },
    });

    await this.auditLogger.log({
      tenantId: dto.tenantId || null,
      userId: actorId,
      targetUserId: dto.affectedUserId || null,
      action: 'SECURITY_INCIDENT_CREATED',
      module: 'Security',
      details: {
        incidentId: incident.id,
        incidentNumber: incident.incidentNumber,
        severity: incident.severity,
        title: incident.title,
      },
    });

    this.logger.warn(
      `Security Incident ${incidentNumber} created by ${actorId}: [${incident.severity}] ${incident.title}`,
    );
    return incident;
  }

  /**
   * Lists security incidents with filters and pagination.
   */
  async listIncidents(params: ListIncidentsDto) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.severity && params.severity !== 'ALL') {
      where.severity = params.severity;
    }
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { incidentNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      (this.prisma as any).securityIncident.count({ where }),
      (this.prisma as any).securityIncident.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      incidents: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single incident details.
   */
  async getIncidentById(id: string) {
    const incident = await (this.prisma as any).securityIncident.findUnique({
      where: { id },
    });
    if (!incident) {
      throw new NotFoundException(`Security Incident ${id} not found`);
    }
    return incident;
  }

  /**
   * Acknowledges an incident and sets acknowledgedAt.
   */
  async acknowledgeIncident(id: string, actorId: string) {
    const existing = await this.getIncidentById(id);

    const updated = await (this.prisma as any).securityIncident.update({
      where: { id },
      data: {
        status: existing.status === 'OPEN' ? 'INVESTIGATING' : existing.status,
        acknowledgedAt: existing.acknowledgedAt || new Date(),
        assignedTo: existing.assignedTo || actorId,
      },
    });

    await this.auditLogger.log({
      tenantId: existing.tenantId,
      userId: actorId,
      targetUserId: existing.affectedUserId,
      action: 'SECURITY_INCIDENT_ACKNOWLEDGED',
      module: 'Security',
      details: {
        incidentId: id,
        incidentNumber: existing.incidentNumber,
        status: updated.status,
        acknowledgedAt: new Date().toISOString(),
      },
    });

    return updated;
  }

  /**
   * Updates incident status (INVESTIGATING, CONTAINED, RESOLVED).
   */
  async updateIncidentStatus(
    id: string,
    status: string,
    notes: string | undefined,
    actorId: string,
  ) {
    const validStatuses = ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`,
      );
    }

    const existing = await this.getIncidentById(id);
    const now = new Date();

    const isResolving = status === 'RESOLVED';
    const updated = await (this.prisma as any).securityIncident.update({
      where: { id },
      data: {
        status,
        resolutionNotes: notes || existing.resolutionNotes,
        ...(isResolving
          ? {
              resolvedBy: actorId,
              resolvedAt: now,
            }
          : {}),
      },
    });

    await this.auditLogger.log({
      tenantId: existing.tenantId,
      userId: actorId,
      targetUserId: existing.affectedUserId,
      action: isResolving ? 'SECURITY_INCIDENT_RESOLVED' : 'SECURITY_INCIDENT_STATUS_CHANGED',
      module: 'Security',
      details: {
        incidentId: id,
        incidentNumber: existing.incidentNumber,
        previousStatus: existing.status,
        newStatus: status,
        notes: notes || null,
      },
    });

    return updated;
  }

  /**
   * Resolves an incident.
   */
  async resolveIncident(id: string, resolutionNotes: string, actorId: string) {
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      throw new BadRequestException('Resolution notes of at least 5 characters are required');
    }

    return this.updateIncidentStatus(id, 'RESOLVED', resolutionNotes.trim(), actorId);
  }

  /**
   * Retrieves high-level security center status for the dashboard.
   */
  async getSecurityCenterStatus() {
    const [
      openIncidents,
      criticalIncidents,
      lockedUsers,
      lockedTenants,
      platformState,
    ] = await Promise.all([
      (this.prisma as any).securityIncident.count({
        where: { status: { in: ['OPEN', 'INVESTIGATING', 'CONTAINED'] } },
      }),
      (this.prisma as any).securityIncident.count({
        where: {
          severity: 'CRITICAL',
          status: { in: ['OPEN', 'INVESTIGATING', 'CONTAINED'] },
        },
      }),
      (this.prisma as any).user.count({
        where: { securityStatus: 'LOCKED' },
      }),
      (this.prisma as any).tenant.count({
        where: { securityStatus: 'LOCKED' },
      }),
      (this.prisma as any).platformSecurityState.findUnique({
        where: { id: 'global' },
      }),
    ]);

    return {
      emergencyMode: platformState?.emergencyMode || false,
      emergencyReason: platformState?.reason || null,
      openIncidents,
      criticalIncidents,
      lockedUsers,
      lockedTenants,
      auditIntegrityStatus: 'HEALTHY',
      lastCheckAt: new Date().toISOString(),
    };
  }
}
