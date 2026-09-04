import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { QUEUE_NAMES } from '../queue.constants';
import {
  IMPORT_JOB_NAMES,
  LeadsBulkImportJobPayload,
} from '../interfaces/import-jobs';

export const IMPORT_DEFAULT_JOB_OPTS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
  removeOnComplete: true,
  removeOnFail: 100,
} as const;

@Injectable()
export class ImportQueueProducer {
  private readonly logger = new Logger(ImportQueueProducer.name);

  constructor(
    @Optional()
    @InjectQueue(QUEUE_NAMES.IMPORT)
    private readonly importQueue?: Queue,
  ) {}

  /**
   * Helper to check if queue is available (e.g. during disconnected/testing environments).
   */
  public isQueueAvailable(): boolean {
    return Boolean(this.importQueue);
  }

  /**
   * Enqueues a Leads bulk import job into crm-import-queue.
   * Ensures deterministic job ID generation and typed BaseJobPayload structure.
   */
  async enqueueLeadsImport(
    payload: Omit<LeadsBulkImportJobPayload, 'correlationId' | 'timestamp'> & {
      correlationId?: string;
      timestamp?: string;
    },
  ): Promise<{ enqueued: boolean; jobId?: string }> {
    const correlationId = payload.correlationId || randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const tenantId = payload.tenantId || 'system';
    const userId = payload.userId || 'system';

    const deterministicSuffix = payload.importBatchId
      ? payload.importBatchId.replace(/[^a-zA-Z0-9_-]/g, '_')
      : correlationId;
    const jobId =
      payload.jobId || `leads-import:${tenantId}:${deterministicSuffix}`;

    const fullPayload: LeadsBulkImportJobPayload = {
      ...payload,
      tenantId,
      userId,
      correlationId,
      timestamp,
      jobId,
    };

    if (!this.importQueue) {
      this.logger.warn(
        `Import queue not initialized; cannot enqueue leads bulk import for tenant ${tenantId}`,
      );
      return { enqueued: false };
    }

    const job = await this.importQueue.add(
      IMPORT_JOB_NAMES.LEADS_BULK_IMPORT,
      fullPayload,
      {
        ...IMPORT_DEFAULT_JOB_OPTS,
        jobId,
      },
    );

    this.logger.log(
      `[IMPORT QUEUE] Enqueued leads bulk import job ${job.id} for tenant ${tenantId} (${payload.leads?.length || 0} rows, correlationId: ${correlationId})`,
    );

    return { enqueued: true, jobId: job.id };
  }
}
