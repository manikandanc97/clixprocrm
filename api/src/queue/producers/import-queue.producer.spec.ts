import {
  ImportQueueProducer,
  IMPORT_DEFAULT_JOB_OPTS,
} from './import-queue.producer';
import { IMPORT_JOB_NAMES } from '../interfaces/import-jobs';

describe('ImportQueueProducer Suite', () => {
  let producer: ImportQueueProducer;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn().mockImplementation(async (name, data, opts) => ({
        id: opts?.jobId || 'mock-job-id-123',
        name,
        data,
        opts,
      })),
    };
    producer = new ImportQueueProducer(mockQueue);
  });

  it('should indicate queue is available when injected', () => {
    expect(producer.isQueueAvailable()).toBe(true);
  });

  it('should indicate queue is unavailable when not injected', () => {
    const disconnectedProducer = new ImportQueueProducer(undefined);
    expect(disconnectedProducer.isQueueAvailable()).toBe(false);
  });

  describe('enqueueLeadsImport', () => {
    it('should enqueue Leads bulk import with BaseJobPayload and deterministic options', async () => {
      const result = await producer.enqueueLeadsImport({
        tenantId: 'tenant-abc',
        userId: 'usr-123',
        leads: [
          { name: 'Alice Smith', email: 'alice@example.com', company: 'Acme Corp' },
          { name: 'Bob Jones', email: 'bob@example.com', company: 'Beta LLC' },
        ],
        duplicateStrategy: 'skip',
        importBatchId: 'batch-001',
        correlationId: 'corr-imp-1',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        IMPORT_JOB_NAMES.LEADS_BULK_IMPORT,
        expect.objectContaining({
          tenantId: 'tenant-abc',
          userId: 'usr-123',
          duplicateStrategy: 'skip',
          importBatchId: 'batch-001',
          correlationId: 'corr-imp-1',
          timestamp: expect.any(String),
          jobId: 'leads-import:tenant-abc:batch-001',
          leads: expect.arrayContaining([
            expect.objectContaining({ email: 'alice@example.com' }),
            expect.objectContaining({ email: 'bob@example.com' }),
          ]),
        }),
        expect.objectContaining({
          attempts: IMPORT_DEFAULT_JOB_OPTS.attempts,
          backoff: IMPORT_DEFAULT_JOB_OPTS.backoff,
          jobId: 'leads-import:tenant-abc:batch-001',
        }),
      );
    });

    it('should handle missing optional identifiers gracefully with correlationId fallback for jobId', async () => {
      const result = await producer.enqueueLeadsImport({
        leads: [{ name: 'Test User', email: 'test@example.com' }],
        duplicateStrategy: 'create',
      });

      expect(result.enqueued).toBe(true);
      expect(mockQueue.add).toHaveBeenCalledWith(
        IMPORT_JOB_NAMES.LEADS_BULK_IMPORT,
        expect.objectContaining({
          tenantId: 'system',
          userId: 'system',
          duplicateStrategy: 'create',
          correlationId: expect.any(String),
          jobId: expect.stringMatching(/^leads-import:system:/),
        }),
        expect.any(Object),
      );
    });

    it('should return { enqueued: false } if queue is disconnected', async () => {
      const disconnectedProducer = new ImportQueueProducer(undefined);
      const result = await disconnectedProducer.enqueueLeadsImport({
        tenantId: 'tenant-abc',
        leads: [{ name: 'Test', email: 'test@example.com' }],
        duplicateStrategy: 'skip',
      });

      expect(result.enqueued).toBe(false);
    });
  });
});
