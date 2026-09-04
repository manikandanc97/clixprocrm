import { Test, TestingModule } from '@nestjs/testing';
import { QueueMetricsService } from './queue-metrics.service';
import { QUEUE_NAMES } from '../queue.constants';
import { getQueueToken } from '@nestjs/bullmq';

describe('QueueMetricsService', () => {
  let service: QueueMetricsService;
  let mockEmailQueue: any;
  let mockImportQueue: any;
  let mockWebhookQueue: any;
  let mockMediaQueue: any;

  beforeEach(async () => {
    mockEmailQueue = {
      getJobCounts: jest.fn().mockResolvedValue({
        active: 1,
        waiting: 2,
        completed: 10,
        failed: 0,
        delayed: 0,
        paused: 0,
      }),
      isPaused: jest.fn().mockResolvedValue(false),
      getFailed: jest.fn().mockResolvedValue([]),
      getJob: jest.fn(),
      clean: jest.fn().mockResolvedValue(['job-1', 'job-2']),
    };

    mockImportQueue = {
      getJobCounts: jest.fn().mockResolvedValue({
        active: 0,
        waiting: 1,
        completed: 5,
        failed: 0,
        delayed: 0,
        paused: 0,
      }),
      isPaused: jest.fn().mockResolvedValue(false),
      getFailed: jest.fn().mockResolvedValue([]),
      getJob: jest.fn(),
      clean: jest.fn().mockResolvedValue([]),
    };

    mockWebhookQueue = {
      getJobCounts: jest.fn().mockResolvedValue({
        active: 0,
        waiting: 0,
        completed: 20,
        failed: 0,
        delayed: 0,
        paused: 0,
      }),
      isPaused: jest.fn().mockResolvedValue(false),
      getFailed: jest.fn().mockResolvedValue([]),
      getJob: jest.fn(),
      clean: jest.fn().mockResolvedValue([]),
    };

    mockMediaQueue = {
      getJobCounts: jest.fn().mockResolvedValue({
        active: 2,
        waiting: 0,
        completed: 15,
        failed: 0,
        delayed: 0,
        paused: 0,
      }),
      isPaused: jest.fn().mockResolvedValue(false),
      getFailed: jest.fn().mockResolvedValue([]),
      getJob: jest.fn(),
      clean: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueMetricsService,
        {
          provide: getQueueToken(QUEUE_NAMES.EMAIL),
          useValue: mockEmailQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.IMPORT),
          useValue: mockImportQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.WEBHOOK),
          useValue: mockWebhookQueue,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.MEDIA),
          useValue: mockMediaQueue,
        },
      ],
    }).compile();

    service = module.get<QueueMetricsService>(QueueMetricsService);
  });

  describe('Queue Resolution', () => {
    it('resolves the correct queue instance for each known QueueName', () => {
      expect(service.getQueueInstance(QUEUE_NAMES.EMAIL)).toBe(mockEmailQueue);
      expect(service.getQueueInstance(QUEUE_NAMES.IMPORT)).toBe(mockImportQueue);
      expect(service.getQueueInstance(QUEUE_NAMES.WEBHOOK)).toBe(mockWebhookQueue);
      expect(service.getQueueInstance(QUEUE_NAMES.MEDIA)).toBe(mockMediaQueue);
      expect(service.getQueueInstance('non-existent' as any)).toBeUndefined();
    });
  });

  describe('Single Queue Metrics', () => {
    it('returns healthy status when no failed jobs exist', async () => {
      const metrics = await service.getSingleQueueMetrics(QUEUE_NAMES.EMAIL);

      expect(metrics.queueName).toBe(QUEUE_NAMES.EMAIL);
      expect(metrics.status).toBe('HEALTHY');
      expect(metrics.available).toBe(true);
      expect(metrics.counts.active).toBe(1);
      expect(metrics.counts.waiting).toBe(2);
      expect(metrics.counts.completed).toBe(10);
      expect(metrics.counts.failed).toBe(0);
      expect(metrics.counts.total).toBe(13);
      expect(metrics.isPaused).toBe(false);
    });

    it('returns degraded status when failed jobs are between 1 and 5', async () => {
      mockEmailQueue.getJobCounts.mockResolvedValueOnce({
        active: 0,
        waiting: 0,
        completed: 10,
        failed: 3,
        delayed: 0,
        paused: 0,
      });

      const metrics = await service.getSingleQueueMetrics(QUEUE_NAMES.EMAIL);
      expect(metrics.status).toBe('DEGRADED');
      expect(metrics.counts.failed).toBe(3);
    });

    it('returns warning status when failed jobs exceed 5', async () => {
      mockEmailQueue.getJobCounts.mockResolvedValueOnce({
        active: 0,
        waiting: 0,
        completed: 10,
        failed: 8,
        delayed: 0,
        paused: 0,
      });

      const metrics = await service.getSingleQueueMetrics(QUEUE_NAMES.EMAIL);
      expect(metrics.status).toBe('WARNING');
      expect(metrics.counts.failed).toBe(8);
    });

    it('returns critical status when failed jobs exceed 20', async () => {
      mockEmailQueue.getJobCounts.mockResolvedValueOnce({
        active: 0,
        waiting: 0,
        completed: 10,
        failed: 25,
        delayed: 0,
        paused: 0,
      });

      const metrics = await service.getSingleQueueMetrics(QUEUE_NAMES.EMAIL);
      expect(metrics.status).toBe('CRITICAL');
      expect(metrics.counts.failed).toBe(25);
    });

    it('gracefully handles unavailable queue', async () => {
      const metrics = await service.getSingleQueueMetrics('unknown-queue' as any);
      expect(metrics.available).toBe(false);
      expect(metrics.status).toBe('WARNING');
      expect(metrics.counts.total).toBe(0);
    });

    it('gracefully handles queue count errors', async () => {
      mockEmailQueue.getJobCounts.mockRejectedValueOnce(new Error('Redis connection lost'));

      const metrics = await service.getSingleQueueMetrics(QUEUE_NAMES.EMAIL);
      expect(metrics.available).toBe(false);
      expect(metrics.status).toBe('CRITICAL');
    });
  });

  describe('Aggregate Metrics', () => {
    it('aggregates counts across all 4 operational queues', async () => {
      const agg = await service.getAggregateMetrics();

      expect(agg.status).toBe('HEALTHY');
      expect(agg.totalActive).toBe(3); // 1 email + 0 import + 0 webhook + 2 media
      expect(agg.totalWaiting).toBe(3); // 2 email + 1 import + 0 webhook + 0 media
      expect(agg.totalCompleted).toBe(50); // 10 + 5 + 20 + 15
      expect(agg.totalFailed).toBe(0);
      expect(agg.queues.length).toBe(4);
      expect(agg.timestamp).toBeDefined();
    });

    it('elevates aggregate status to WARNING when failures exceed 10 across queues', async () => {
      mockEmailQueue.getJobCounts.mockResolvedValueOnce({
        active: 0,
        waiting: 0,
        completed: 10,
        failed: 6,
        delayed: 0,
        paused: 0,
      });
      mockImportQueue.getJobCounts.mockResolvedValueOnce({
        active: 0,
        waiting: 0,
        completed: 5,
        failed: 6,
        delayed: 0,
        paused: 0,
      });

      const agg = await service.getAggregateMetrics();
      expect(agg.totalFailed).toBe(12);
      expect(agg.status).toBe('WARNING');
    });
  });

  describe('Dead-Letter Jobs', () => {
    it('retrieves and sanitizes dead-letter jobs', async () => {
      const sampleFailedJob: any = {
        id: 'job-dead-1',
        name: 'email.security-alert',
        failedReason: 'SMTP connection timeout',
        attemptsMade: 3,
        timestamp: 1700000000000,
        processedOn: 1700000001000,
        finishedOn: 1700000005000,
        stacktrace: ['Error: Timeout\n    at TCPConnectWrap.afterConnect'],
        data: {
          tenantId: 'tenant-123',
          userId: 'user-456',
          correlationId: 'corr-789',
          to: 'customer@example.com',
          password: 'super-secret-password',
          apiKey: 'sec_live_12345',
          deviceType: 'MacBook Pro',
        },
      };

      mockEmailQueue.getFailed.mockResolvedValueOnce([sampleFailedJob]);

      const deadLetters = await service.getDeadLetterJobs(QUEUE_NAMES.EMAIL);

      expect(deadLetters.length).toBe(1);
      const record = deadLetters[0];
      expect(record.id).toBe('job-dead-1');
      expect(record.queueName).toBe(QUEUE_NAMES.EMAIL);
      expect(record.failedReason).toBe('SMTP connection timeout');
      expect(record.attemptsMade).toBe(3);
      expect(record.tenantId).toBe('tenant-123');
      expect(record.userId).toBe('user-456');

      // Sanitization check: sensitive fields redacted
      expect(record.data.password).toBe('[REDACTED]');
      expect(record.data.apiKey).toBe('[REDACTED]');
      expect(record.data.deviceType).toBe('MacBook Pro');
    });

    it('returns empty array when queue is not found or error occurs', async () => {
      const res = await service.getDeadLetterJobs('unknown-queue' as any);
      expect(res).toEqual([]);

      mockEmailQueue.getFailed.mockRejectedValueOnce(new Error('Redis buffer overflow'));
      const errorRes = await service.getDeadLetterJobs(QUEUE_NAMES.EMAIL);
      expect(errorRes).toEqual([]);
    });
  });

  describe('Dead-Letter Job Retry', () => {
    it('retries a job successfully when found', async () => {
      const mockJob = {
        id: 'job-retry-1',
        retry: jest.fn().mockResolvedValue(undefined),
      };
      mockEmailQueue.getJob.mockResolvedValueOnce(mockJob);

      const result = await service.retryDeadLetterJob(QUEUE_NAMES.EMAIL, 'job-retry-1');
      expect(result.success).toBe(true);
      expect(mockJob.retry).toHaveBeenCalled();
      expect(result.message).toContain('successfully re-queued');
    });

    it('returns failure when job is not found', async () => {
      mockEmailQueue.getJob.mockResolvedValueOnce(null);

      const result = await service.retryDeadLetterJob(QUEUE_NAMES.EMAIL, 'job-missing');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('returns failure when queue is unavailable', async () => {
      const result = await service.retryDeadLetterJob('unknown-queue' as any, 'job-1');
      expect(result.success).toBe(false);
    });
  });

  describe('Dead-Letter Clean', () => {
    it('cleans failed jobs and returns cleaned count', async () => {
      const result = await service.cleanDeadLetterJobs(QUEUE_NAMES.EMAIL, 3600000, 50);
      expect(mockEmailQueue.clean).toHaveBeenCalledWith(3600000, 50, 'failed');
      expect(result.cleanedCount).toBe(2);
    });
  });

  describe('Payload Sanitization', () => {
    it('redacts nested sensitive keys and binary buffers', () => {
      const payload = {
        normal: 'data',
        auth: 'secret-token',
        nested: {
          privateKey: 'private-rsa',
          rawBuffer: Buffer.from('hello'),
          safe: 123,
        },
      };

      const sanitized = service.sanitizePayload(payload);
      expect(sanitized.normal).toBe('data');
      expect(sanitized.auth).toBe('[REDACTED]');
      expect(sanitized.nested.privateKey).toBe('[REDACTED]');
      expect(sanitized.nested.rawBuffer).toBe('[REDACTED]'); // matched by rawbuffer pattern
      expect(sanitized.nested.safe).toBe(123);
    });
  });
});
