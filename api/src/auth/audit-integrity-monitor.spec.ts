import { AuditIntegrityMonitorService } from '../common/audit/integrity/audit-integrity-monitor.service';
import { AuditArchiveService } from '../common/audit/archive/audit-archive.service';
import { AuditIntegrityAlertService } from '../common/audit/integrity/audit-integrity-alert.service';
import { AuditLoggerService } from '../common/audit/audit-logger.service';

describe('P3 Audit Integrity Monitor Suite', () => {
  let mockPrisma: any;
  let auditLogger: AuditLoggerService;
  let archiveService: AuditArchiveService;
  let alertService: AuditIntegrityAlertService;
  let monitorService: AuditIntegrityMonitorService;

  let storedLogs: any[] = [];
  let storedOutbox: any[] = [];
  let emittedAlerts: any[] = [];

  beforeEach(() => {
    storedLogs = [];
    storedOutbox = [];
    emittedAlerts = [];

    mockPrisma = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
      auditLog: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const tenantId = where?.tenantId;
          const matching = storedLogs.filter((l) =>
            tenantId !== undefined ? l.tenantId === tenantId : true,
          );
          return Promise.resolve(matching[matching.length - 1] || null);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          const tenantId = where?.tenantId;
          let matching = storedLogs.filter((l) =>
            tenantId !== undefined ? l.tenantId === tenantId : true,
          );
          if (where?.createdAt?.gte) {
            matching = matching.filter(
              (l) => l.createdAt >= where.createdAt.gte,
            );
          }
          return Promise.resolve([...matching]);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const found = storedLogs.find((l) => l.id === where.id);
          return Promise.resolve(found || null);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const record = { ...data };
          storedLogs.push(record);
          return Promise.resolve(record);
        }),
      },
      auditArchiveOutbox: {
        create: jest.fn().mockImplementation(({ data }) => {
          const record = {
            id: `outbox-${storedOutbox.length + 1}`,
            attempts: 0,
            createdAt: new Date(),
            ...data,
          };
          storedOutbox.push(record);
          return Promise.resolve(record);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          const items = storedOutbox.filter((o) => {
            if (where?.status?.in && !where.status.in.includes(o.status))
              return false;
            if (
              where?.status &&
              typeof where.status === 'string' &&
              o.status !== where.status
            )
              return false;
            return true;
          });
          return Promise.resolve(
            items.map((o) => ({
              ...o,
              auditLog: storedLogs.find((l) => l.id === o.auditLogId),
            })),
          );
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = storedOutbox.findIndex((o) => o.id === where.id);
          if (idx !== -1) {
            storedOutbox[idx] = { ...storedOutbox[idx], ...data };
            return Promise.resolve(storedOutbox[idx]);
          }
          return Promise.resolve(null);
        }),
      },
    };

    alertService = new AuditIntegrityAlertService();
    jest.spyOn(alertService, 'dispatchAlert').mockImplementation((alert) => {
      emittedAlerts.push(alert);
      return Promise.resolve(true);
    });

    auditLogger = new AuditLoggerService(mockPrisma);
    archiveService = new AuditArchiveService(mockPrisma);
    monitorService = new AuditIntegrityMonitorService(
      mockPrisma,
      archiveService,
      alertService,
    );
  });

  describe('1. Health Evaluation', () => {
    it('returns HEALTHY for valid cryptographic chain and active archive', async () => {
      await auditLogger.log({ tenantId: 'tenant-1', action: 'EVENT_1' });
      await auditLogger.log({ tenantId: 'tenant-1', action: 'EVENT_2' });

      // Archive outbox items
      await archiveService.processPendingOutbox(10);

      const report = await monitorService.runIntegrityVerification({
        tenantId: 'tenant-1',
      });

      expect(report.status).toBe('HEALTHY');
      expect(report.checkedRecords).toBe(2);
      expect(report.brokenLinks).toBe(0);
      expect(report.hashMismatches).toBe(0);
      expect(report.archiveCoveragePercent).toBe(100);
    });
  });

  describe('2. Cryptographic Anomaly & Broken Link Detection', () => {
    it('detects broken chain link and transitions status to CRITICAL with alert', async () => {
      await auditLogger.log({ tenantId: 'tenant-crit', action: 'EVT_A' });
      await auditLogger.log({ tenantId: 'tenant-crit', action: 'EVT_B' });

      // Ensure both records are archived first
      await archiveService.processPendingOutbox(10);

      // Tamper with previousHash in record 2
      storedLogs[1].previousHash = 'forged_previous_hash_anomaly';

      const report = await monitorService.runIntegrityVerification({
        tenantId: 'tenant-crit',
      });

      expect(report.status).toBe('CRITICAL');
      expect(report.brokenLinks).toBe(1);
      expect(report.firstFailureId).toBe(storedLogs[1].id);

      expect(emittedAlerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'AUDIT_CHAIN_BROKEN',
            severity: 'CRITICAL',
          }),
        ]),
      );
    });

    it('detects modified database record payload and emits AUDIT_HASH_MISMATCH', async () => {
      await auditLogger.log({
        tenantId: 'tenant-hash-tamper',
        action: 'ROLE_CREATED',
        details: { role: 'Viewer' },
      });

      await archiveService.processPendingOutbox(10);

      // Attacker modifies details directly in DB
      storedLogs[0].details = { role: 'SuperAdmin' };

      const report = await monitorService.runIntegrityVerification({
        tenantId: 'tenant-hash-tamper',
      });

      expect(report.status).toBe('CRITICAL');
      expect(report.hashMismatches).toBe(1);

      expect(emittedAlerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'AUDIT_HASH_MISMATCH',
            severity: 'CRITICAL',
          }),
        ]),
      );
    });
  });

  describe('3. Outbox Health & Stale Checks', () => {
    it('detects stale outbox records and failed archives, setting status to WARNING', async () => {
      await auditLogger.log({ tenantId: 'tenant-stale', action: 'LOGIN' });

      // Age outbox item past stale threshold (> 30 mins)
      storedOutbox[0].createdAt = new Date(Date.now() - 45 * 60 * 1000);
      storedOutbox[0].status = 'PENDING';

      const report = await monitorService.runIntegrityVerification({
        tenantId: 'tenant-stale',
      });

      expect(report.status).toBe('WARNING');
      expect(report.staleOutboxRecords).toBe(1);

      expect(emittedAlerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'AUDIT_OUTBOX_STALE',
            severity: 'WARNING',
          }),
        ]),
      );
    });
  });

  describe('4. Timestamp Anomaly Detection', () => {
    it('detects future timestamps and emits AUDIT_TIMESTAMP_ANOMALY', async () => {
      await auditLogger.log({
        tenantId: 'tenant-future',
        action: 'EVENT_PAST',
      });

      // Simulate a compromised system clock setting future date (+ 2 hours)
      storedLogs[0].createdAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const report = await monitorService.runIntegrityVerification({
        tenantId: 'tenant-future',
      });

      expect(report.timestampAnomalies).toBe(1);
      expect(emittedAlerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'AUDIT_TIMESTAMP_ANOMALY',
            severity: 'WARNING',
          }),
        ]),
      );
    });
  });
});
