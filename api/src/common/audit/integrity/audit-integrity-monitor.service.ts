import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditArchiveService } from '../archive/audit-archive.service';
import { AuditIntegrityAlertService } from './audit-integrity-alert.service';
import { verifyRecordHash, AuditLogSealInput } from '../audit-crypto.util';

export interface IntegrityReport {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  scope: string;
  checkedRecords: number;
  brokenLinks: number;
  missingArchives: number;
  hashMismatches: number;
  missingHashes: number;
  timestampAnomalies: number;
  failedArchives: number;
  staleOutboxRecords: number;
  archiveCoveragePercent: number;
  firstFailureId: string | null;
  lastCheckAt: string;
  reason: string | null;
}

@Injectable()
export class AuditIntegrityMonitorService {
  private readonly logger = new Logger(AuditIntegrityMonitorService.name);
  private lastReport: IntegrityReport | null = null;
  private readonly staleThresholdMinutes: number;
  private readonly timestampToleranceMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly archiveService: AuditArchiveService,
    private readonly alertService: AuditIntegrityAlertService,
  ) {
    this.staleThresholdMinutes = parseInt(
      process.env.AUDIT_OUTBOX_STALE_MINUTES || '30',
      10,
    );
    this.timestampToleranceMinutes = parseInt(
      process.env.AUDIT_TIMESTAMP_TOLERANCE_MINUTES || '5',
      10,
    );
  }

  /**
   * Verifies the cryptographic chain and external WORM archive for recent records (Level 1).
   */
  async verifyRecent(
    hours = 24,
    tenantId?: string | null,
  ): Promise<IntegrityReport> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.runIntegrityVerification({ since, tenantId });
  }

  /**
   * Verifies complete audit chain for a given tenant or platform scope (Level 3).
   */
  async verifyFull(tenantId?: string | null): Promise<IntegrityReport> {
    return this.runIntegrityVerification({ tenantId });
  }

  /**
   * Core verification engine evaluating DB cryptographic integrity, timestamp sequence, outbox health, and S3 archives.
   */
  async runIntegrityVerification(params: {
    since?: Date;
    tenantId?: string | null;
  }): Promise<IntegrityReport> {
    const scope = params.tenantId ? `tenant:${params.tenantId}` : 'platform';
    const where: any = {};

    if (params.tenantId !== undefined) {
      where.tenantId = params.tenantId;
    }
    if (params.since) {
      where.createdAt = { gte: params.since };
    }

    const records = await this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    let brokenLinks = 0;
    let hashMismatches = 0;
    let missingHashes = 0;
    let timestampAnomalies = 0;
    let missingArchives = 0;
    let firstFailureId: string | null = null;
    let firstReason: string | null = null;

    let expectedPreviousHash: string | null = null;
    let previousTimestamp: Date | null = null;
    const now = Date.now();
    const futureToleranceMs = this.timestampToleranceMinutes * 60 * 1000;

    for (const rawRecord of records) {
      const record: any = rawRecord;
      const createdAtMs = new Date(record.createdAt).getTime();

      // 1. Clock / Timestamp Anomaly Check
      if (createdAtMs > now + futureToleranceMs) {
        timestampAnomalies++;
        await this.alertService.dispatchAlert({
          type: 'AUDIT_TIMESTAMP_ANOMALY',
          scope,
          recordId: record.id,
          severity: 'WARNING',
          details: `Audit record ${record.id} timestamp is in the future: ${record.createdAt.toISOString()}`,
        });
      }

      if (
        previousTimestamp &&
        createdAtMs < previousTimestamp.getTime() - futureToleranceMs
      ) {
        timestampAnomalies++;
        await this.alertService.dispatchAlert({
          type: 'AUDIT_TIMESTAMP_ANOMALY',
          scope,
          recordId: record.id,
          severity: 'WARNING',
          details: `Audit record ${record.id} timestamp out of order: ${record.createdAt.toISOString()} < ${previousTimestamp.toISOString()}`,
        });
      }
      previousTimestamp = new Date(record.createdAt);

      // 2. Cryptographic Hash & Link Continuity Check
      if (record.previousHash !== expectedPreviousHash) {
        brokenLinks++;
        if (!firstFailureId) {
          firstFailureId = record.id;
          firstReason = `Broken chain link at ${record.id}: expected previousHash "${expectedPreviousHash || 'null'}", found "${record.previousHash || 'null'}"`;
        }
        await this.alertService.dispatchAlert({
          type: 'AUDIT_CHAIN_BROKEN',
          scope,
          recordId: record.id,
          severity: 'CRITICAL',
          details: firstReason || `Broken chain link detected at ${record.id}`,
        });
      }

      if (!record.recordHash) {
        missingHashes++;
        if (!firstFailureId) {
          firstFailureId = record.id;
          firstReason = `Missing recordHash at ${record.id}`;
        }
      } else {
        const sealInput: AuditLogSealInput = {
          id: record.id,
          tenantId: record.tenantId,
          userId: record.userId,
          targetUserId: record.targetUserId,
          action: record.action,
          module: record.module,
          details: record.details,
          ipAddress: record.ipAddress,
          userAgent: record.userAgent,
          createdAt: record.createdAt,
          previousHash: record.previousHash,
        };

        const isSignatureValid = verifyRecordHash(sealInput, record.recordHash);
        if (!isSignatureValid) {
          hashMismatches++;
          if (!firstFailureId) {
            firstFailureId = record.id;
            firstReason = `Cryptographic signature mismatch at ${record.id}: database record modified or forged`;
          }
          await this.alertService.dispatchAlert({
            type: 'AUDIT_HASH_MISMATCH',
            scope,
            recordId: record.id,
            severity: 'CRITICAL',
            details:
              firstReason || `Cryptographic signature mismatch at ${record.id}`,
          });
        }
      }

      // 3. External WORM Archive Verification
      const archiveVerification =
        await this.archiveService.verifyArchivedRecord(record.id);
      if (!archiveVerification.valid) {
        missingArchives++;
        if (!firstFailureId) {
          firstFailureId = record.id;
          firstReason =
            archiveVerification.reason || 'Archive verification failed';
        }
        if (archiveVerification.reason?.includes('mismatch')) {
          await this.alertService.dispatchAlert({
            type: 'AUDIT_ARCHIVE_OBJECT_MISMATCH',
            scope,
            recordId: record.id,
            severity: 'CRITICAL',
            details: archiveVerification.reason,
          });
        }
      }

      expectedPreviousHash = record.recordHash || null;
    }

    // 4. Outbox Health Check
    const staleThreshold = new Date(
      Date.now() - this.staleThresholdMinutes * 60 * 1000,
    );
    const staleOutboxItems = await (
      this.prisma as any
    ).auditArchiveOutbox.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { lte: staleThreshold },
      },
      take: 50,
    });
    const staleOutboxRecords = staleOutboxItems.length;

    const failedOutboxItems = await (
      this.prisma as any
    ).auditArchiveOutbox.findMany({
      where: { status: 'FAILED' },
      take: 50,
    });
    const failedArchives = failedOutboxItems.length;

    if (staleOutboxRecords > 0) {
      await this.alertService.dispatchAlert({
        type: 'AUDIT_OUTBOX_STALE',
        scope,
        severity: 'WARNING',
        details: `${staleOutboxRecords} audit archive outbox records are stale (> ${this.staleThresholdMinutes}m)`,
      });
    }

    if (failedArchives > 0) {
      await this.alertService.dispatchAlert({
        type: 'AUDIT_ARCHIVE_FAILED',
        scope,
        severity: 'WARNING',
        details: `${failedArchives} audit archive jobs failed after retry exhaustion`,
      });
    }

    // Determine overall status
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (brokenLinks > 0 || hashMismatches > 0) {
      status = 'CRITICAL';
    } else if (
      missingArchives > 0 ||
      staleOutboxRecords > 0 ||
      failedArchives > 0 ||
      timestampAnomalies > 0
    ) {
      status = 'WARNING';
    }

    const archiveCoveragePercent =
      records.length > 0
        ? Math.round(
            ((records.length - missingArchives) / records.length) * 100,
          )
        : 100;

    const report: IntegrityReport = {
      status,
      scope,
      checkedRecords: records.length,
      brokenLinks,
      missingArchives,
      hashMismatches,
      missingHashes,
      timestampAnomalies,
      failedArchives,
      staleOutboxRecords,
      archiveCoveragePercent,
      firstFailureId,
      lastCheckAt: new Date().toISOString(),
      reason: firstReason,
    };

    this.lastReport = report;
    return report;
  }

  /**
   * Retrieves the latest cached or instantaneous system integrity status.
   */
  async getSystemStatus(): Promise<IntegrityReport> {
    if (this.lastReport) {
      return this.lastReport;
    }
    return this.verifyRecent(24);
  }
}
