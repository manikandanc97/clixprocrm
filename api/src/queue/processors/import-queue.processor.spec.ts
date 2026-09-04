import { ImportQueueProcessor } from './import-queue.processor';
import { IMPORT_JOB_NAMES } from '../interfaces/import-jobs';

describe('ImportQueueProcessor Suite', () => {
  let processor: ImportQueueProcessor;
  let mockLeadsImportService: any;

  beforeEach(() => {
    mockLeadsImportService = {
      bulkImportLeads: jest.fn().mockResolvedValue({
        imported: 2,
        skipped: 1,
        failed: 0,
        failedRows: [],
      }),
    };

    processor = new ImportQueueProcessor(mockLeadsImportService);
  });

  it('should route LEADS_BULK_IMPORT jobs to LeadsImportService and return summary', async () => {
    const mockJob: any = {
      id: 'job-imp-1',
      name: IMPORT_JOB_NAMES.LEADS_BULK_IMPORT,
      data: {
        tenantId: 'tenant-abc',
        userId: 'usr-123',
        correlationId: 'corr-123',
        leads: [
          { name: 'Lead 1', email: 'lead1@example.com' },
          { name: 'Lead 2', email: 'lead2@example.com' },
        ],
        duplicateStrategy: 'skip',
      },
    };

    const result = await processor.process(mockJob);

    expect(mockLeadsImportService.bulkImportLeads).toHaveBeenCalledWith(
      'tenant-abc',
      'usr-123',
      mockJob.data.leads,
      'skip',
    );
    expect(result).toEqual({
      imported: 2,
      skipped: 1,
      failed: 0,
      failedRowsCount: 0,
    });
  });

  it('should reject jobs with missing tenantId to maintain strict tenant isolation', async () => {
    const mockJob: any = {
      id: 'job-imp-no-tenant',
      name: IMPORT_JOB_NAMES.LEADS_BULK_IMPORT,
      data: {
        userId: 'usr-123',
        leads: [{ name: 'Lead 1', email: 'lead1@example.com' }],
        duplicateStrategy: 'skip',
      },
    };

    await expect(processor.process(mockJob)).rejects.toThrow(
      'Tenant context missing',
    );
  });

  it('should handle empty leads list gracefully without invoking service', async () => {
    const mockJob: any = {
      id: 'job-imp-empty',
      name: IMPORT_JOB_NAMES.LEADS_BULK_IMPORT,
      data: {
        tenantId: 'tenant-abc',
        leads: [],
        duplicateStrategy: 'skip',
      },
    };

    const result = await processor.process(mockJob);

    expect(mockLeadsImportService.bulkImportLeads).not.toHaveBeenCalled();
    expect(result).toEqual({
      imported: 0,
      skipped: 0,
      failed: 0,
      failedRowsCount: 0,
    });
  });

  it('should re-throw errors so BullMQ triggers bounded exponential retry', async () => {
    mockLeadsImportService.bulkImportLeads.mockRejectedValueOnce(
      new Error('DB connection reset'),
    );

    const mockJob: any = {
      id: 'job-imp-fail',
      name: IMPORT_JOB_NAMES.LEADS_BULK_IMPORT,
      data: {
        tenantId: 'tenant-abc',
        leads: [{ name: 'Lead 1', email: 'lead1@example.com' }],
        duplicateStrategy: 'skip',
      },
    };

    await expect(processor.process(mockJob)).rejects.toThrow(
      'DB connection reset',
    );
  });

  it('should skip unknown job types safely', async () => {
    const mockJob: any = {
      id: 'job-unknown',
      name: 'unknown-job-type',
      data: {
        tenantId: 'tenant-abc',
      },
    };

    const result = await processor.process(mockJob);
    expect(result).toEqual({
      skipped: true,
      reason: 'Unknown job type: unknown-job-type',
    });
  });
});
