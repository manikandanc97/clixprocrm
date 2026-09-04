import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import {
  IMPORT_JOB_NAMES,
  ImportJobPayload,
  LeadsBulkImportJobPayload,
} from '../interfaces/import-jobs';
import { LeadsImportService } from '../../leads/services/leads.import.service';

@Processor(QUEUE_NAMES.IMPORT)
export class ImportQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportQueueProcessor.name);

  constructor(
    @Inject(forwardRef(() => LeadsImportService))
    private readonly leadsImportService: LeadsImportService,
  ) {
    super();
  }

  async process(job: Job<ImportJobPayload, any, string>): Promise<any> {
    this.logger.log(
      `[IMPORT WORKER] Processing job "${job.name}" (ID: ${job.id}, Tenant: ${job.data.tenantId}, Correlation: ${job.data.correlationId})`,
    );

    try {
      switch (job.name) {
        case IMPORT_JOB_NAMES.LEADS_BULK_IMPORT:
          return await this.handleLeadsBulkImport(
            job.data as LeadsBulkImportJobPayload,
          );

        default:
          this.logger.warn(
            `[IMPORT WORKER] Unknown import job type received: "${job.name}"`,
          );
          return { skipped: true, reason: `Unknown job type: ${job.name}` };
      }
    } catch (err: any) {
      this.logger.error(
        `[IMPORT WORKER] Job "${job.name}" (ID: ${job.id}, Tenant: ${job.data?.tenantId}) failed: ${err?.message || err}`,
        err?.stack,
      );
      // Re-throw to let BullMQ perform configured exponential retries
      throw err;
    }
  }

  /**
   * Processes a batch of leads import rows by invoking LeadsImportService.
   * Multi-tenant safety is enforced inside LeadsImportService.bulkImportLeads.
   */
  private async handleLeadsBulkImport(
    payload: LeadsBulkImportJobPayload,
  ): Promise<{
    imported: number;
    skipped: number;
    failed: number;
    failedRowsCount: number;
  }> {
    const { tenantId, userId, leads, duplicateStrategy, correlationId } =
      payload;

    if (!tenantId) {
      throw new Error(
        'Tenant context missing: tenantId is required for Leads bulk import processing',
      );
    }

    if (!leads || leads.length === 0) {
      this.logger.warn(
        `[IMPORT WORKER] Empty leads data received for tenant ${tenantId}`,
      );
      return { imported: 0, skipped: 0, failed: 0, failedRowsCount: 0 };
    }

    const effectiveUserId = userId || 'system';

    this.logger.log(
      `[IMPORT WORKER] Starting bulk import of ${leads.length} leads for tenant ${tenantId} (strategy: ${duplicateStrategy}, correlation: ${correlationId})`,
    );

    const result = await this.leadsImportService.bulkImportLeads(
      tenantId,
      effectiveUserId,
      leads,
      duplicateStrategy || 'skip',
    );

    this.logger.log(
      `[IMPORT WORKER] Completed bulk import for tenant ${tenantId}: imported=${result.imported}, skipped=${result.skipped}, failed=${result.failed}`,
    );

    return {
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
      failedRowsCount: result.failedRows?.length || 0,
    };
  }
}
