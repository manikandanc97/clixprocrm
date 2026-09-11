import { SecurityIncidentsService } from '../super-admin/services/security-incidents.service';
import { AuditLoggerService } from '../common/audit/audit-logger.service';
import { AuditIntegrityMonitorService } from '../common/audit/integrity/audit-integrity-monitor.service';

describe('P4 Security Incidents Management Suite', () => {
  let incidentsService: SecurityIncidentsService;
  let mockPrisma: any;
  let auditLogger: AuditLoggerService;
  let mockIntegrityMonitor: any;

  let storedIncidents: any[] = [];
  let storedLogs: any[] = [];

  beforeEach(() => {
    storedIncidents = [];
    storedLogs = [];

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
      securityIncident: {
        create: jest.fn().mockImplementation(({ data }) => {
          const record = {
            id: `inc-${storedIncidents.length + 1}`,
            ...data,
            createdAt: new Date(),
          };
          storedIncidents.push(record);
          return Promise.resolve(record);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          let items = storedIncidents;
          if (where?.severity)
            items = items.filter((i) => i.severity === where.severity);
          if (where?.status)
            items = items.filter((i) => i.status === where.status);
          return Promise.resolve(items);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            storedIncidents.find((i) => i.id === where.id) || null,
          );
        }),
        count: jest.fn().mockImplementation(({ where }) => {
          let items = storedIncidents;
          if (where?.severity)
            items = items.filter((i) => i.severity === where.severity);
          if (where?.status?.in)
            items = items.filter((i) => where.status.in.includes(i.status));
          return Promise.resolve(items.length);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = storedIncidents.findIndex((i) => i.id === where.id);
          if (idx !== -1) {
            storedIncidents[idx] = { ...storedIncidents[idx], ...data };
            return Promise.resolve(storedIncidents[idx]);
          }
          return Promise.resolve(null);
        }),
      },
      user: {
        count: jest.fn().mockResolvedValue(0),
      },
      tenant: {
        count: jest.fn().mockResolvedValue(0),
      },
      platformSecurityState: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'global', emergencyMode: false }),
      },
    };

    auditLogger = new AuditLoggerService(mockPrisma);
    mockIntegrityMonitor = {
      getSystemStatus: jest.fn().mockResolvedValue({
        status: 'HEALTHY',
        checkedRecords: 100,
        archiveCoveragePercent: 100,
      }),
    };

    incidentsService = new SecurityIncidentsService(
      mockPrisma,
      auditLogger,
      mockIntegrityMonitor,
    );
  });

  describe('1. Incident Creation & Numbering', () => {
    it('creates security incident with unique incidentNumber and emits sealed audit log', async () => {
      const incident = await incidentsService.createIncident(
        {
          title: 'Suspicious Brute-Force Activity',
          description: 'Detected 10 failed login attempts from single IP',
          severity: 'HIGH',
          incidentType: 'LOGIN_BRUTE_FORCE',
          tenantId: 'tenant-123',
        },
        'usr-super-admin',
      );

      expect(incident.id).toBeDefined();
      expect(incident.incidentNumber).toMatch(/^INC-\d{8}-[A-F0-9]{4}$/);
      expect(incident.status).toBe('OPEN');
      expect(incident.severity).toBe('HIGH');

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'SECURITY_INCIDENT_CREATED',
          }),
        ]),
      );
    });
  });

  describe('2. Incident Workflow & Resolution', () => {
    it('updates incident status and resolves with resolution notes', async () => {
      const incident = await incidentsService.createIncident(
        {
          title: 'MFA Anomaly',
          description: 'Repeated challenge failures on admin account',
          severity: 'MEDIUM',
        },
        'usr-super-admin',
      );

      // Transition to INVESTIGATING
      const updated = await incidentsService.updateIncidentStatus(
        incident.id,
        'INVESTIGATING',
        'Security analyst reviewing session logs',
        'usr-super-admin',
      );
      expect(updated.status).toBe('INVESTIGATING');

      // Resolve incident
      const resolved = await incidentsService.resolveIncident(
        incident.id,
        'User verified legitimate password reset via secondary channel',
        'usr-super-admin',
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();

      expect(storedLogs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: 'SECURITY_INCIDENT_RESOLVED' }),
        ]),
      );
    });
  });

  describe('3. Security Center Aggregation', () => {
    it('aggregates incident counts, locked entities, and WORM archive status', async () => {
      await incidentsService.createIncident(
        {
          title: 'Crit Issue 1',
          description: 'Critical tamper event detected',
          severity: 'CRITICAL',
        },
        'admin',
      );

      const status = await incidentsService.getSecurityCenterStatus();
      expect(status.criticalIncidents).toBe(1);
      expect(status.openIncidents).toBe(1);
      expect(status.auditIntegrityStatus).toBe('HEALTHY');
      expect(status.emergencyMode).toBe(false);
    });
  });
});
