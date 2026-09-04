import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { QUEUE_NAMES, QueueName } from '../queue.constants';
import {
  QueueJobCounts,
  QueueHealthStatus,
  SingleQueueMetrics,
  AggregateQueueMetrics,
  DeadLetterJobRecord,
  DeadLetterQueryOptions,
} from '../interfaces/queue-metrics.interface';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /credential/i,
  /\bauth/i,
  /authorization/i,
  /auth_header/i,
  /rawbuffer/i,
  /buffer/i,
  /privatekey/i,
  /private_key/i,
  /cookie/i,
];

@Injectable()
export class QueueMetricsService {
  private readonly logger = new Logger(QueueMetricsService.name);

  constructor(
    @Optional()
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private readonly emailQueue?: Queue,

    @Optional()
    @InjectQueue(QUEUE_NAMES.IMPORT)
    private readonly importQueue?: Queue,

    @Optional()
    @InjectQueue(QUEUE_NAMES.WEBHOOK)
    private readonly webhookQueue?: Queue,

    @Optional()
    @InjectQueue(QUEUE_NAMES.MEDIA)
    private readonly mediaQueue?: Queue,
  ) {}

  /**
   * Resolves the BullMQ Queue instance for a given QueueName.
   */
  public getQueueInstance(queueName: QueueName): Queue | undefined {
    switch (queueName) {
      case QUEUE_NAMES.EMAIL:
        return this.emailQueue;
      case QUEUE_NAMES.IMPORT:
        return this.importQueue;
      case QUEUE_NAMES.WEBHOOK:
        return this.webhookQueue;
      case QUEUE_NAMES.MEDIA:
        return this.mediaQueue;
      default:
        return undefined;
    }
  }

  /**
   * Retrieves real-time metrics and health status for a single queue.
   */
  public async getSingleQueueMetrics(queueName: QueueName): Promise<SingleQueueMetrics> {
    const queue = this.getQueueInstance(queueName);

    if (!queue) {
      return {
        queueName,
        status: 'WARNING',
        available: false,
        counts: {
          active: 0,
          waiting: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
          total: 0,
        },
        isPaused: false,
      };
    }

    try {
      const countsRaw = await queue.getJobCounts(
        'active',
        'completed',
        'failed',
        'delayed',
        'waiting',
      );

      const isPaused = typeof queue.isPaused === 'function' ? await queue.isPaused() : false;

      const counts: QueueJobCounts = {
        active: countsRaw.active || 0,
        waiting: countsRaw.waiting || 0,
        completed: countsRaw.completed || 0,
        failed: countsRaw.failed || 0,
        delayed: countsRaw.delayed || 0,
        paused: countsRaw.paused || 0,
        total:
          (countsRaw.active || 0) +
          (countsRaw.waiting || 0) +
          (countsRaw.completed || 0) +
          (countsRaw.failed || 0) +
          (countsRaw.delayed || 0),
      };

      let status: QueueHealthStatus = 'HEALTHY';
      if (counts.failed > 20) {
        status = 'CRITICAL';
      } else if (counts.failed > 5 || counts.delayed > 50) {
        status = 'WARNING';
      } else if (counts.failed > 0) {
        status = 'DEGRADED';
      }

      return {
        queueName,
        status,
        available: true,
        counts,
        isPaused,
      };
    } catch (err: any) {
      this.logger.warn(
        `Failed to retrieve metrics for queue "${queueName}": ${err?.message || err}`,
      );
      return {
        queueName,
        status: 'CRITICAL',
        available: false,
        counts: {
          active: 0,
          waiting: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
          total: 0,
        },
        isPaused: false,
      };
    }
  }

  /**
   * Retrieves aggregate metrics across all 4 operational queues.
   */
  public async getAggregateMetrics(): Promise<AggregateQueueMetrics> {
    const queueNames: QueueName[] = [
      QUEUE_NAMES.EMAIL,
      QUEUE_NAMES.IMPORT,
      QUEUE_NAMES.WEBHOOK,
      QUEUE_NAMES.MEDIA,
    ];

    const queues = await Promise.all(
      queueNames.map((name) => this.getSingleQueueMetrics(name)),
    );

    let totalActive = 0;
    let totalWaiting = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    let totalDelayed = 0;

    let hasCritical = false;
    let hasWarning = false;
    let hasDegraded = false;

    for (const q of queues) {
      totalActive += q.counts.active;
      totalWaiting += q.counts.waiting;
      totalCompleted += q.counts.completed;
      totalFailed += q.counts.failed;
      totalDelayed += q.counts.delayed;

      if (q.status === 'CRITICAL') hasCritical = true;
      if (q.status === 'WARNING') hasWarning = true;
      if (q.status === 'DEGRADED') hasDegraded = true;
    }

    let overallStatus: QueueHealthStatus = 'HEALTHY';
    if (hasCritical || totalFailed > 30) {
      overallStatus = 'CRITICAL';
    } else if (hasWarning || totalFailed > 10) {
      overallStatus = 'WARNING';
    } else if (hasDegraded || totalFailed > 0) {
      overallStatus = 'DEGRADED';
    }

    return {
      status: overallStatus,
      totalActive,
      totalWaiting,
      totalCompleted,
      totalFailed,
      totalDelayed,
      queues,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves failed / dead-letter jobs from a specified queue.
   * Payloads are strictly sanitized to prevent credential leakage.
   */
  public async getDeadLetterJobs(
    queueName: QueueName,
    options?: DeadLetterQueryOptions,
  ): Promise<DeadLetterJobRecord[]> {
    const queue = this.getQueueInstance(queueName);
    if (!queue) {
      return [];
    }

    const offset = Math.max(0, options?.offset || 0);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));

    try {
      const failedJobs: Job[] = await queue.getFailed(offset, offset + limit - 1);

      return failedJobs.map((job) => ({
        id: String(job.id),
        name: job.name,
        queueName,
        tenantId: job.data?.tenantId,
        userId: job.data?.userId,
        correlationId: job.data?.correlationId,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        stacktrace: job.stacktrace || [],
        data: this.sanitizePayload(job.data),
      }));
    } catch (err: any) {
      this.logger.error(
        `Failed to retrieve dead-letter jobs for queue "${queueName}": ${err?.message || err}`,
      );
      return [];
    }
  }

  /**
   * Re-queues a failed dead-letter job for execution retry.
   */
  public async retryDeadLetterJob(
    queueName: QueueName,
    jobId: string,
  ): Promise<{ success: boolean; message: string }> {
    const queue = this.getQueueInstance(queueName);
    if (!queue) {
      return { success: false, message: `Queue "${queueName}" is not available` };
    }

    try {
      const job = await queue.getJob(jobId);
      if (!job) {
        return {
          success: false,
          message: `Job "${jobId}" not found in queue "${queueName}"`,
        };
      }

      await job.retry();
      this.logger.log(
        `[DEAD-LETTER] Job "${jobId}" in queue "${queueName}" re-queued for retry`,
      );
      return {
        success: true,
        message: `Job "${jobId}" successfully re-queued in "${queueName}"`,
      };
    } catch (err: any) {
      this.logger.error(
        `[DEAD-LETTER] Failed to retry job "${jobId}" in queue "${queueName}": ${err?.message || err}`,
      );
      return {
        success: false,
        message: `Failed to retry job: ${err?.message || err}`,
      };
    }
  }

  /**
   * Cleans older failed jobs from the dead-letter set.
   */
  public async cleanDeadLetterJobs(
    queueName: QueueName,
    gracePeriodMs: number = 0,
    limit: number = 100,
  ): Promise<{ cleanedCount: number }> {
    const queue = this.getQueueInstance(queueName);
    if (!queue) {
      return { cleanedCount: 0 };
    }

    try {
      const cleaned = await queue.clean(gracePeriodMs, limit, 'failed');
      const count = Array.isArray(cleaned) ? cleaned.length : Number(cleaned) || 0;
      this.logger.log(
        `[DEAD-LETTER] Cleaned ${count} failed jobs from queue "${queueName}"`,
      );
      return { cleanedCount: count };
    } catch (err: any) {
      this.logger.error(
        `[DEAD-LETTER] Failed to clean failed jobs from queue "${queueName}": ${err?.message || err}`,
      );
      return { cleanedCount: 0 };
    }
  }

  /**
   * Sanitizes payload data by redacting sensitive keys and byte buffers.
   */
  public sanitizePayload(data: any): Record<string, any> {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized: Record<string, any> = {};

    for (const [key, val] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
        pattern.test(key),
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (Buffer.isBuffer(val)) {
        sanitized[key] = '[BINARY_BUFFER]';
      } else if (typeof val === 'string' && val.length > 2048) {
        sanitized[key] = `${val.slice(0, 128)}... [TRUNCATED ${val.length} BYTES]`;
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        sanitized[key] = this.sanitizePayload(val);
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }
}
