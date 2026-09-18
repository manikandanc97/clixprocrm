import { AuditArchiveService } from '../common/audit/archive/audit-archive.service';
import { AuditLoggerService } from '../common/audit/audit-logger.service';
import { AuditDisasterRecoveryService } from '../common/audit/integrity/audit-dr.service';

describe('P3 Disaster Recovery Verification Dry Run Suite', () => {
  let mockPrisma: any;
  let auditLogger: AuditLoggerService;
  let archiveService: AuditArchiveService;
  let drService: AuditDisasterRecoveryService;

  let storedLogs: any[] = [];
  let storedOutbox: any[] = [];

  beforeEach(() => {
    storedLogs = [];
    storedOutbox = [];

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
          const matching = storedLogs.filter((l) =>
            tenantId !== undefined ? l.tenantId === tenantId : true,
          );
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
        findMany: jest.fn().mockImplementation(() =>
          Promise.resolve(
            storedOutbox.map((o) => ({
              ...o,
              auditLog: storedLogs.find((l) => l.id === o.auditLogId),
            })),
          ),
        ),
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

    auditLogger = new AuditLoggerService(mockPrisma);
    archiveService = new AuditArchiveService(mockPrisma);
    drService = new AuditDisasterRecoveryService(mockPrisma, archiveService);
  });

  describe('1. DR Restore Dry Run', () => {
    it('verifies that an archived record is 100% restorable with valid cryptographic signature', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-dr-1',
        action: 'INVOICE_GENERATED',
        details: { invoiceId: 'inv-999', total: 4500 },
      });

      // Archive record to S3 provider
      await archiveService.processPendingOutbox(10);

      const result = await drService.verifyAuditArchiveRestore(log.id);

      expect(result.restorable).toBe(true);
      expect(result.archiveFound).toBe(true);
      expect(result.payloadValid).toBe(true);
      expect(result.hashValid).toBe(true);
      expect(result.chainLinkValid).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('rejects tampered external archive payload during DR dry run', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-dr-2',
        action: 'USER_DELETED',
      });

      // Mock tampered external archive provider
      const tamperedProvider = {
        putObject: jest.fn(),
        headObject: jest.fn().mockResolvedValue({ exists: true }),
        getObject: jest.fn().mockResolvedValue({
          archiveVersion: '1.0.0',
          archivedAt: new Date().toISOString(),
          chainScope: 'tenant',
          record: {
            id: log.id,
            tenantId: 'tenant-dr-2',
            userId: null,
            targetUserId: null,
            action: 'USER_DELETED',
            module: null,
            details: { tampered: true },
            ipAddress: null,
            userAgent: null,
            createdAt: log.createdAt.toISOString(),
            previousHash: null,
            recordHash: 'forged_fake_hash_123',
          },
        }),
      };
      drService.setProvider(tamperedProvider);

      const result = await drService.verifyAuditArchiveRestore(log.id);

      expect(result.restorable).toBe(false);
      expect(result.hashValid).toBe(false);
      expect(result.reason).toContain(
        'signature is invalid or payload was modified',
      );
    });

    it('performs zero database or S3 write operations', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-dr-3',
        action: 'SETTINGS_CHANGED',
      });

      await archiveService.processPendingOutbox(10);

      // Reset mock write counters
      mockPrisma.auditLog.create.mockClear();
      mockPrisma.auditArchiveOutbox.create.mockClear();
      mockPrisma.auditArchiveOutbox.update.mockClear();

      await drService.verifyAuditArchiveRestore(log.id);

      // Verify ZERO writes occurred during DR verification
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
      expect(mockPrisma.auditArchiveOutbox.create).not.toHaveBeenCalled();
      expect(mockPrisma.auditArchiveOutbox.update).not.toHaveBeenCalled();
    });
  });
});
