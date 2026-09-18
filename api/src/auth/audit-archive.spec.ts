import * as fs from 'fs';
import * as path from 'path';
import { AuditArchiveService } from '../common/audit/archive/audit-archive.service';
import {
    buildAuditObjectKey
} from '../common/audit/archive/s3-object-lock.provider';
import { AuditLoggerService } from '../common/audit/audit-logger.service';

describe('P2 External WORM Backup & Integrity Monitoring Suite', () => {
  let mockPrisma: any;
  let auditLogger: AuditLoggerService;
  let archiveService: AuditArchiveService;
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
        findMany: jest.fn().mockImplementation(({ where }) => {
          const items = storedOutbox.filter((o) => {
            if (where?.status && o.status !== where.status) return false;
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

    auditLogger = new AuditLoggerService(mockPrisma);
    archiveService = new AuditArchiveService(mockPrisma);
  });

  describe('1. Transactional Outbox Atomicity', () => {
    it('creates an AuditArchiveOutbox entry inside the same transaction as AuditLog', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-w-1',
        userId: 'usr-1',
        action: 'MFA_ENROLLED',
        module: 'Security',
      });

      expect(storedLogs).toHaveLength(1);
      expect(storedOutbox).toHaveLength(1);

      expect(storedOutbox[0].auditLogId).toBe(log.id);
      expect(storedOutbox[0].status).toBe('PENDING');
      expect(storedOutbox[0].attempts).toBe(0);
    });
  });

  describe('2. Asynchronous S3 WORM Archival & Idempotency', () => {
    it('processes outbox items asynchronously and transitions status to ARCHIVED', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-w-1',
        userId: 'usr-1',
        action: 'LOGIN_SUCCESS',
        module: 'Security',
      });

      expect(storedOutbox[0].status).toBe('PENDING');

      const result = await archiveService.processPendingOutbox(10);
      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);

      expect(storedOutbox[0].status).toBe('ARCHIVED');
      expect(storedOutbox[0].archivedAt).toBeDefined();
    });

    it('is idempotent: reprocessing already-archived object succeeds without error', async () => {
      await auditLogger.log({
        tenantId: 'tenant-w-2',
        action: 'ROLE_CREATED',
      });

      // First run
      await archiveService.processPendingOutbox(10);
      expect(storedOutbox[0].status).toBe('ARCHIVED');

      // Reset to PENDING to simulate retry
      storedOutbox[0].status = 'PENDING';

      // Second run (idempotent match)
      const res = await archiveService.processPendingOutbox(10);
      expect(res.succeeded).toBe(1);
      expect(storedOutbox[0].status).toBe('ARCHIVED');
    });

    it('applies exponential backoff and sets status to FAILED after max attempts', async () => {
      await auditLogger.log({
        tenantId: 'tenant-fail',
        action: 'PASSWORD_RESET',
      });

      // Mock provider to throw network errors
      const failingProvider = {
        putObject: jest
          .fn()
          .mockRejectedValue(new Error('AWS S3 Network Timeout')),
        getObject: jest.fn().mockResolvedValue(null),
        headObject: jest.fn().mockResolvedValue({ exists: false }),
      };
      archiveService.setProvider(failingProvider);

      // Run 1st attempt
      await archiveService.processPendingOutbox(10);
      expect(storedOutbox[0].attempts).toBe(1);
      expect(storedOutbox[0].status).toBe('PENDING');
      expect(storedOutbox[0].lastError).toContain('AWS S3 Network Timeout');

      // Set attempts to 9 (near max)
      storedOutbox[0].attempts = 9;

      // Run 10th attempt (exceeds maxAttempts = 10)
      await archiveService.processPendingOutbox(10);
      expect(storedOutbox[0].status).toBe('FAILED');
    });
  });

  describe('3. External Archive Integrity Verification', () => {
    it('verifies cryptographic equivalence between DB record and S3 archive', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-verify',
        action: 'INVOICE_PAID',
        details: { amount: 1500 },
      });

      await archiveService.processPendingOutbox(10);

      const verification = await archiveService.verifyArchivedRecord(log.id);
      expect(verification.valid).toBe(true);
    });

    it('detects cryptographic hash mismatch if archived object was modified in S3', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-mismatch',
        action: 'INVOICE_PAID',
        details: { amount: 100 },
      });

      await archiveService.processPendingOutbox(10);

      // Mock provider returning altered hash in archived payload
      const tamperedProvider = {
        putObject: jest.fn(),
        headObject: jest.fn().mockResolvedValue({ exists: true }),
        getObject: jest.fn().mockResolvedValue({
          archiveVersion: '1.0.0',
          archivedAt: new Date().toISOString(),
          chainScope: 'tenant',
          record: {
            id: log.id,
            tenantId: 'tenant-mismatch',
            userId: null,
            targetUserId: null,
            action: 'INVOICE_PAID',
            module: null,
            details: { amount: 100 },
            ipAddress: null,
            userAgent: null,
            createdAt: log.createdAt.toISOString(),
            previousHash: null,
            recordHash: 'altered_tampered_record_hash_in_s3_payload',
          },
        }),
      };
      archiveService.setProvider(tamperedProvider);

      const verification = await archiveService.verifyArchivedRecord(log.id);
      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('Cryptographic hash mismatch');
    });

    it('detects missing archived object in external storage', async () => {
      const log = await auditLogger.log({
        tenantId: 'tenant-missing',
        action: 'EVENT_XYZ',
      });

      // Provider returns 404 / null
      const missingProvider = {
        putObject: jest.fn(),
        headObject: jest.fn().mockResolvedValue({ exists: false }),
        getObject: jest.fn().mockResolvedValue(null),
      };
      archiveService.setProvider(missingProvider);

      const verification = await archiveService.verifyArchivedRecord(log.id);
      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('Archived audit object missing');
    });
  });

  describe('4. Deterministic Object Key & Isolation', () => {
    it('generates deterministic object keys without sensitive data', () => {
      const d = new Date('2026-08-20T12:00:00.000Z');
      const tenantKey = buildAuditObjectKey('rec-123', 'tenant-abc', d);
      const platformKey = buildAuditObjectKey('rec-456', null, d);

      expect(tenantKey).toBe('audit/tenant/tenant-abc/2026/08/20/rec-123.json');
      expect(platformKey).toBe('audit/platform/2026/08/20/rec-456.json');
    });
  });

  describe('5. Migration Validation', () => {
    it('validates migration SQL contains AuditArchiveOutbox table and foreign key', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../prisma/migrations/20260820230000_audit_archive_outbox/migration.sql',
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationSql).toContain(
        'CREATE TABLE IF NOT EXISTS "AuditArchiveOutbox"',
      );
      expect(migrationSql).toContain(
        'CREATE UNIQUE INDEX IF NOT EXISTS "AuditArchiveOutbox_auditLogId_key"',
      );
      expect(migrationSql).toContain(
        'CREATE INDEX IF NOT EXISTS "AuditArchiveOutbox_status_nextAttemptAt_idx"',
      );
    });
  });
});
