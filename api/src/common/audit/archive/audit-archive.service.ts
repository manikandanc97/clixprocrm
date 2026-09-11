import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AuditArchiveProvider,
  CanonicalAuditArchiveRecord,
  ArchiveIntegrityResult,
} from './audit-archive.interface';
import {
  S3ObjectLockProvider,
  buildAuditObjectKey,
} from './s3-object-lock.provider';

@Injectable()
export class AuditArchiveService implements OnModuleInit {
  private readonly logger = new Logger(AuditArchiveService.name);
  private provider: AuditArchiveProvider;
  private isEnabled = false;
  private retentionDays = 365;
  private maxAttempts = 10;

  constructor(private readonly prisma: PrismaService) {
    this.initProvider();
  }

  private initProvider() {
    this.isEnabled = process.env.AUDIT_ARCHIVE_ENABLED === 'true';
    this.retentionDays = parseInt(
      process.env.AUDIT_ARCHIVE_RETENTION_DAYS || '365',
      10,
    );
    if (isNaN(this.retentionDays) || this.retentionDays <= 0) {
      this.retentionDays = 365;
    }
    this.maxAttempts = parseInt(
      process.env.AUDIT_ARCHIVE_MAX_ATTEMPTS || '10',
      10,
    );

    const region = process.env.AWS_REGION || 'us-east-1';
    const bucket =
      process.env.AUDIT_ARCHIVE_BUCKET ||
      process.env.AWS_S3_AUDIT_BUCKET ||
      'clixpro-audit-archive-default';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    this.provider = new S3ObjectLockProvider({
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      retentionDays: this.retentionDays,
    });
  }

  onModuleInit() {
    if (this.isEnabled) {
      this.logger.log(
        `AuditArchiveService initialized with S3 Object Lock compliance retention (${this.retentionDays} days)`,
      );
    } else {
      this.logger.log(
        'AuditArchiveService: External WORM backup is in passive mode (AUDIT_ARCHIVE_ENABLED=false)',
      );
    }
  }

  /**
   * Sets a custom archive provider (e.g. for testing).
   */
  setProvider(customProvider: AuditArchiveProvider) {
    this.provider = customProvider;
  }

  /**
   * Asynchronously processes pending audit outbox entries with exponential backoff.
   * Safe to call from scheduled background workers or post-commit dispatchers.
   */
  async processPendingOutbox(
    batchSize = 50,
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    const now = new Date();

    const pendingItems = await (this.prisma as any).auditArchiveOutbox.findMany(
      {
        where: {
          status: 'PENDING',
          nextAttemptAt: { lte: now },
        },
        take: batchSize,
        include: {
          auditLog: true,
        },
        orderBy: { nextAttemptAt: 'asc' },
      },
    );

    let succeeded = 0;
    let failed = 0;

    for (const item of pendingItems) {
      const log = item.auditLog;
      if (!log) {
        // Orphaned outbox item
        await (this.prisma as any).auditArchiveOutbox.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            lastError: 'Referenced AuditLog record not found',
          },
        });
        failed++;
        continue;
      }

      if (item.attempts >= this.maxAttempts) {
        await (this.prisma as any).auditArchiveOutbox.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            lastError: `Exceeded maximum archive attempts (${this.maxAttempts})`,
          },
        });
        this.logger.error(
          `Audit archive failed permanently for auditLogId ${log.id} after ${this.maxAttempts} attempts`,
        );
        failed++;
        continue;
      }

      try {
        const objectKey = buildAuditObjectKey(
          log.id,
          log.tenantId,
          log.createdAt,
        );

        // Idempotency check: check if object already exists in S3
        const head = await this.provider.headObject(objectKey);
        if (head.exists && head.recordHash === log.recordHash) {
          // Object already archived with matching hash
          await (this.prisma as any).auditArchiveOutbox.update({
            where: { id: item.id },
            data: {
              status: 'ARCHIVED',
              archivedAt: new Date(),
              lastAttemptAt: new Date(),
              lastError: null,
            },
          });
          succeeded++;
          continue;
        }

        const canonicalPayload: CanonicalAuditArchiveRecord = {
          archiveVersion: '1.0.0',
          archivedAt: new Date().toISOString(),
          chainScope: log.tenantId ? 'tenant' : 'platform',
          record: {
            id: log.id,
            tenantId: log.tenantId,
            userId: log.userId,
            targetUserId: log.targetUserId,
            action: log.action,
            module: log.module,
            details: log.details,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt.toISOString(),
            previousHash: log.previousHash,
            recordHash: log.recordHash || '',
          },
        };

        await this.provider.putObject(
          objectKey,
          canonicalPayload,
          this.retentionDays,
        );

        await (this.prisma as any).auditArchiveOutbox.update({
          where: { id: item.id },
          data: {
            status: 'ARCHIVED',
            archivedAt: new Date(),
            lastAttemptAt: new Date(),
            lastError: null,
          },
        });

        succeeded++;
      } catch (err: any) {
        failed++;
        const currentAttempts = item.attempts + 1;
        // Exponential backoff: 1 min, 2 min, 4 min, 8 min, 16 min... capped at 60 mins
        const delayMinutes = Math.min(60, Math.pow(2, currentAttempts - 1));
        const nextAttemptAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        await (this.prisma as any).auditArchiveOutbox.update({
          where: { id: item.id },
          data: {
            attempts: currentAttempts,
            lastAttemptAt: new Date(),
            nextAttemptAt,
            lastError: err?.message || 'External storage archive failure',
            status: currentAttempts >= this.maxAttempts ? 'FAILED' : 'PENDING',
          },
        });

        this.logger.warn(
          `Archive attempt ${currentAttempts} for auditLogId ${log.id} failed: ${err?.message || err}. Next attempt at ${nextAttemptAt.toISOString()}`,
        );
      }
    }

    return { processed: pendingItems.length, succeeded, failed };
  }

  /**
   * Verifies the cryptographic equivalence of a PostgreSQL audit row against the external WORM archive.
   */
  async verifyArchivedRecord(
    auditLogId: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: auditLogId },
    });

    if (!log) {
      return {
        valid: false,
        reason: `AuditLog ${auditLogId} not found in database`,
      };
    }

    const objectKey = buildAuditObjectKey(log.id, log.tenantId, log.createdAt);
    const archived = await this.provider.getObject(objectKey);

    if (!archived) {
      return {
        valid: false,
        reason: `Archived audit object missing at ${objectKey}`,
      };
    }

    if (archived.record.recordHash !== log.recordHash) {
      return {
        valid: false,
        reason: `Cryptographic hash mismatch: DB (${log.recordHash}) vs Archive (${archived.record.recordHash})`,
      };
    }

    if (archived.record.previousHash !== log.previousHash) {
      return {
        valid: false,
        reason: `Previous hash chain mismatch: DB (${log.previousHash}) vs Archive (${archived.record.previousHash})`,
      };
    }

    return { valid: true };
  }

  /**
   * Verifies external archive completeness and cryptographic integrity across multiple records.
   */
  async verifyTenantAuditArchive(
    tenantId: string | null,
    limit = 50,
  ): Promise<ArchiveIntegrityResult> {
    const records = await this.prisma.auditLog.findMany({
      where: tenantId ? { tenantId } : { tenantId: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    let missingArchives = 0;
    let mismatchedArchives = 0;
    let firstMismatchId: string | null = null;
    let reason: string | null = null;

    for (const record of records) {
      const verification = await this.verifyArchivedRecord(record.id);
      if (!verification.valid) {
        if (verification.reason?.includes('missing')) {
          missingArchives++;
        } else {
          mismatchedArchives++;
        }
        if (!firstMismatchId) {
          firstMismatchId = record.id;
          reason = verification.reason || 'Verification failure';
        }
      }
    }

    return {
      valid: missingArchives === 0 && mismatchedArchives === 0,
      checkedRecords: records.length,
      missingArchives,
      mismatchedArchives,
      firstMismatchId,
      reason,
    };
  }

  /**
   * Scheduled incremental integrity monitor.
   */
  async runScheduledIntegrityCheck(): Promise<{
    healthy: boolean;
    details: any;
  }> {
    const recentArchived = await (
      this.prisma as any
    ).auditArchiveOutbox.findMany({
      where: { status: 'ARCHIVED' },
      orderBy: { archivedAt: 'desc' },
      take: 25,
      select: { auditLogId: true },
    });

    let errors = 0;
    for (const item of recentArchived) {
      const v = await this.verifyArchivedRecord(item.auditLogId);
      if (!v.valid) {
        errors++;
        this.logger.error(
          `Scheduled WORM integrity check failure for ${item.auditLogId}: ${v.reason}`,
        );
      }
    }

    return {
      healthy: errors === 0,
      details: {
        checkedRecentArchived: recentArchived.length,
        errors,
      },
    };
  }

  /**
   * Retrieves aggregate statistics for the AuditArchiveOutbox.
   */
  async getOutboxStats(): Promise<{
    pending: number;
    archived: number;
    failed: number;
    stale: number;
  }> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [pending, archived, failed, stale] = await Promise.all([
      (this.prisma as any).auditArchiveOutbox.count({
        where: { status: 'PENDING' },
      }),
      (this.prisma as any).auditArchiveOutbox.count({
        where: { status: 'ARCHIVED' },
      }),
      (this.prisma as any).auditArchiveOutbox.count({
        where: { status: 'FAILED' },
      }),
      (this.prisma as any).auditArchiveOutbox.count({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          createdAt: { lt: thirtyMinutesAgo },
        },
      }),
    ]);

    return { pending, archived, failed, stale };
  }
}
