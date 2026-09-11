import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

export type AuditAlertType =
  | 'AUDIT_CHAIN_BROKEN'
  | 'AUDIT_HASH_MISMATCH'
  | 'AUDIT_ARCHIVE_MISSING'
  | 'AUDIT_ARCHIVE_FAILED'
  | 'AUDIT_OUTBOX_STALE'
  | 'AUDIT_ARCHIVE_OBJECT_MISMATCH'
  | 'AUDIT_TIMESTAMP_ANOMALY'
  | 'AUDIT_INTEGRITY_CHECK_FAILED';

export interface AuditIntegrityAlert {
  type: AuditAlertType;
  scope: string; // 'platform' or tenantId
  recordId?: string | null;
  severity: 'WARNING' | 'CRITICAL';
  details: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditIntegrityAlertService {
  private readonly logger = new Logger(AuditIntegrityAlertService.name);
  private redisClient: Redis | null = null;
  private readonly cooldownSeconds: number;

  constructor() {
    const cooldownHours = parseInt(
      process.env.AUDIT_INTEGRITY_ALERT_COOLDOWN_HOURS || '24',
      10,
    );
    this.cooldownSeconds = (isNaN(cooldownHours) ? 24 : cooldownHours) * 3600;

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redisClient = new Redis({
          url: redisUrl,
          token: redisToken,
        });
      } catch (err: any) {
        this.logger.warn(
          `Redis client initialization failed for alert deduplication: ${err?.message || err}`,
        );
      }
    }
  }

  /**
   * Dispatches a sanitized security alert with Upstash Redis deduplication.
   * Prevents spamming administrators on repeated scheduled checks.
   */
  async dispatchAlert(alert: AuditIntegrityAlert): Promise<boolean> {
    const dedupKey = `audit-integrity:${alert.scope}:${alert.type}:${alert.recordId || 'general'}`;

    if (this.redisClient) {
      try {
        const isNew = await this.redisClient.set(dedupKey, '1', {
          nx: true,
          ex: this.cooldownSeconds,
        });

        if (!isNew) {
          this.logger.debug(
            `Suppressed duplicate audit integrity alert: ${dedupKey}`,
          );
          return false; // Alert suppressed by deduplication
        }
      } catch (redisErr: any) {
        this.logger.warn(
          `Alert deduplication check failed: ${redisErr?.message || redisErr}. Emitting alert directly.`,
        );
      }
    }

    // Structured server-side security log
    if (alert.severity === 'CRITICAL') {
      this.logger.error(
        `[AUDIT INTEGRITY CRITICAL] [${alert.type}] Scope: ${alert.scope} | Record: ${alert.recordId || 'N/A'} | Details: ${alert.details}`,
      );
    } else {
      this.logger.warn(
        `[AUDIT INTEGRITY WARNING] [${alert.type}] Scope: ${alert.scope} | Record: ${alert.recordId || 'N/A'} | Details: ${alert.details}`,
      );
    }

    return true;
  }
}
