import * as fs from 'fs';
import * as path from 'path';
import {
    AuditLogSealInput,
    computeAuditRecordHash
} from '../common/audit/audit-crypto.util';
import { AuditLoggerService } from '../common/audit/audit-logger.service';

describe('P1 Cryptographic Tamper Detection & Audit Chain Suite', () => {
  let mockPrisma: any;
  let auditLogger: AuditLoggerService;
  let storedLogs: any[] = [];

  const TEST_SECRET = 'test_audit_hmac_secret_2026_super_secure';

  beforeEach(() => {
    storedLogs = [];

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
        create: jest.fn().mockImplementation(({ data }) => {
          const record = { ...data };
          storedLogs.push(record);
          return Promise.resolve(record);
        }),
      },
    };

    auditLogger = new AuditLoggerService(mockPrisma);
  });

  describe('1. Cryptographic Record Sealing', () => {
    it('generates a deterministic HMAC-SHA256 signature covering all immutable fields', () => {
      const input: AuditLogSealInput = {
        id: 'audit-1',
        tenantId: 'tenant-alpha',
        userId: 'usr-1',
        targetUserId: 'usr-target',
        action: 'ROLE_CREATED',
        module: 'Roles',
        details: {
          roleName: 'Manager',
          permissions: ['Leads:Read', 'Deals:Read'],
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2026-08-20T22:00:00.000Z'),
        previousHash: null,
      };

      const hash1 = computeAuditRecordHash(input, TEST_SECRET);
      const hash2 = computeAuditRecordHash(input, TEST_SECRET);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string is 64 chars
    });

    it('produces identical hash regardless of JSON details key insertion order', () => {
      const input1: AuditLogSealInput = {
        id: 'audit-1',
        tenantId: 'tenant-alpha',
        userId: 'usr-1',
        targetUserId: null,
        action: 'SETTINGS_UPDATED',
        module: 'Settings',
        details: { zKey: 'last', aKey: 'first', nested: { b: 2, a: 1 } },
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
        createdAt: new Date('2026-08-20T22:00:00.000Z'),
        previousHash: null,
      };

      const input2: AuditLogSealInput = {
        id: 'audit-1',
        tenantId: 'tenant-alpha',
        userId: 'usr-1',
        targetUserId: null,
        action: 'SETTINGS_UPDATED',
        module: 'Settings',
        details: { aKey: 'first', zKey: 'last', nested: { a: 1, b: 2 } },
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
        createdAt: new Date('2026-08-20T22:00:00.000Z'),
        previousHash: null,
      };

      expect(computeAuditRecordHash(input1, TEST_SECRET)).toBe(
        computeAuditRecordHash(input2, TEST_SECRET),
      );
    });
  });

  describe('2. Hash Chain Progression & Linking', () => {
    it('creates genesis record with previousHash = null and links subsequent records', async () => {
      const log1 = await auditLogger.log({
        tenantId: 'tenant-chain-1',
        userId: 'usr-1',
        action: 'LOGIN_SUCCESS',
        module: 'Security',
      });

      expect(log1.previousHash).toBeNull();
      expect(log1.recordHash).toBeDefined();

      const log2 = await auditLogger.log({
        tenantId: 'tenant-chain-1',
        userId: 'usr-1',
        action: 'ROLE_CREATED',
        module: 'Roles',
      });

      expect(log2.previousHash).toBe(log1.recordHash);
      expect(log2.recordHash).not.toBe(log1.recordHash);

      const log3 = await auditLogger.log({
        tenantId: 'tenant-chain-1',
        userId: 'usr-1',
        action: 'INVOICE_CREATED',
        module: 'Finance',
      });

      expect(log3.previousHash).toBe(log2.recordHash);

      const verification = await auditLogger.verifyAuditChain('tenant-chain-1');
      expect(verification.valid).toBe(true);
      expect(verification.checkedRecords).toBe(3);
    });

    it('maintains completely isolated chains for Tenant A, Tenant B, and Platform Global', async () => {
      // Tenant A
      const a1 = await auditLogger.log({
        tenantId: 'tenant-A',
        action: 'A_ACTION_1',
      });
      const a2 = await auditLogger.log({
        tenantId: 'tenant-A',
        action: 'A_ACTION_2',
      });

      // Tenant B
      const b1 = await auditLogger.log({
        tenantId: 'tenant-B',
        action: 'B_ACTION_1',
      });

      // Global Platform (tenantId = null)
      const g1 = await auditLogger.log({
        tenantId: null,
        action: 'PLATFORM_MODULE_CREATED',
      });
      const g2 = await auditLogger.log({
        tenantId: null,
        action: 'PLATFORM_SETTINGS_UPDATED',
      });

      // Tenant A chain
      expect(a1.previousHash).toBeNull();
      expect(a2.previousHash).toBe(a1.recordHash);

      // Tenant B chain (isolated from Tenant A)
      expect(b1.previousHash).toBeNull();

      // Platform chain (isolated from both tenants)
      expect(g1.previousHash).toBeNull();
      expect(g2.previousHash).toBe(g1.recordHash);

      // All 3 chains verify independently
      expect((await auditLogger.verifyAuditChain('tenant-A')).valid).toBe(true);
      expect((await auditLogger.verifyAuditChain('tenant-B')).valid).toBe(true);
      expect((await auditLogger.verifyAuditChain(null)).valid).toBe(true);
    });
  });

  describe('3. Tamper Detection & Integrity Verification', () => {
    it('detects tampered action in historical record', async () => {
      await auditLogger.log({
        tenantId: 'tenant-tamper',
        action: 'ORIGINAL_ACTION',
      });
      await auditLogger.log({
        tenantId: 'tenant-tamper',
        action: 'SECOND_ACTION',
      });

      // Attacker attempts to modify action in DB
      storedLogs[0].action = 'TAMPERED_ACTION';

      const result = await auditLogger.verifyAuditChain('tenant-tamper');
      expect(result.valid).toBe(false);
      expect(result.firstInvalidRecordId).toBe(storedLogs[0].id);
      expect(result.reason).toContain('Invalid cryptographic signature');
    });

    it('detects tampered details payload in historical record', async () => {
      await auditLogger.log({
        tenantId: 'tenant-tamper-details',
        action: 'INVOICE_CREATED',
        details: { amount: 500 },
      });

      // Attacker attempts to alter invoice amount in audit log details
      storedLogs[0].details = { amount: 50000 };

      const result = await auditLogger.verifyAuditChain(
        'tenant-tamper-details',
      );
      expect(result.valid).toBe(false);
      expect(result.firstInvalidRecordId).toBe(storedLogs[0].id);
    });

    it('detects tampered previousHash (chain fork/substitution)', async () => {
      await auditLogger.log({
        tenantId: 'tenant-chain-tamper',
        action: 'EVENT_1',
      });
      await auditLogger.log({
        tenantId: 'tenant-chain-tamper',
        action: 'EVENT_2',
      });

      // Attacker alters previousHash link
      storedLogs[1].previousHash = 'forged_fake_previous_hash_value';

      const result = await auditLogger.verifyAuditChain('tenant-chain-tamper');
      expect(result.valid).toBe(false);
      expect(result.firstInvalidRecordId).toBe(storedLogs[1].id);
      expect(result.reason).toContain('Broken chain link');
    });

    it('detects missing/deleted record from middle of chain', async () => {
      await auditLogger.log({
        tenantId: 'tenant-deleted-record',
        action: 'EVENT_1',
      });
      await auditLogger.log({
        tenantId: 'tenant-deleted-record',
        action: 'EVENT_2',
      });
      await auditLogger.log({
        tenantId: 'tenant-deleted-record',
        action: 'EVENT_3',
      });

      // Attacker deletes record 2 from DB
      storedLogs.splice(1, 1);

      const result = await auditLogger.verifyAuditChain(
        'tenant-deleted-record',
      );
      expect(result.valid).toBe(false);
      expect(result.firstInvalidRecordId).toBe(storedLogs[1].id);
      expect(result.reason).toContain('Broken chain link');
    });
  });

  describe('4. Migration & Schema Validation', () => {
    it('validates migration SQL contains previousHash, recordHash, and composite index', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../prisma/migrations/20260820223000_audit_log_hash_chain/migration.sql',
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const migrationSql = fs.readFileSync(migrationPath, 'utf8');

      expect(migrationSql).toContain(
        'ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "previousHash" TEXT;',
      );
      expect(migrationSql).toContain(
        'ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "recordHash" TEXT;',
      );
      expect(migrationSql).toContain(
        'CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt" DESC);',
      );
      expect(migrationSql).toContain(
        'CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);',
      );
    });
  });
});
