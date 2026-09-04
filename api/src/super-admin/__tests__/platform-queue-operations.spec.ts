import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSecurityOperationsController } from '../controllers/platform-security-operations.controller';
import { SecurityOperationsService } from '../services/security-operations.service';
import { SecurityAlertsService } from '../services/security-alerts.service';
import { EmergencySecurityService } from '../services/emergency-security.service';
import { QueueMetricsService } from '../../queue/services/queue-metrics.service';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditIntegrityMonitorService } from '../../common/audit/integrity/audit-integrity-monitor.service';
import { SecurityIncidentsService } from '../services/security-incidents.service';

describe('PlatformQueueOperations (Phase 2.1.8)', () => {
  let controller: PlatformSecurityOperationsController;
  let secOpsService: SecurityOperationsService;
  let mockQueueMetricsService: any;
  let mockPrisma: any;

  beforeEach(async () => {
    mockQueueMetricsService = {
      getAggregateMetrics: jest.fn().mockResolvedValue({
        status: 'HEALTHY',
        totalActive: 2,
        totalWaiting: 1,
        totalCompleted: 50,
        totalFailed: 0,
        totalDelayed: 0,
        queues: [
          {
            queueName: QUEUE_NAMES.EMAIL,
            status: 'HEALTHY',
            available: true,
            counts: { active: 1, waiting: 0, completed: 20, failed: 0, delayed: 0, paused: 0, total: 21 },
            isPaused: false,
          },
          {
            queueName: QUEUE_NAMES.IMPORT,
            status: 'HEALTHY',
            available: true,
            counts: { active: 1, waiting: 1, completed: 10, failed: 0, delayed: 0, paused: 0, total: 12 },
            isPaused: false,
          },
          {
            queueName: QUEUE_NAMES.WEBHOOK,
            status: 'HEALTHY',
            available: true,
            counts: { active: 0, waiting: 0, completed: 15, failed: 0, delayed: 0, paused: 0, total: 15 },
            isPaused: false,
          },
          {
            queueName: QUEUE_NAMES.MEDIA,
            status: 'HEALTHY',
            available: true,
            counts: { active: 0, waiting: 0, completed: 5, failed: 0, delayed: 0, paused: 0, total: 5 },
            isPaused: false,
          },
        ],
        timestamp: new Date().toISOString(),
      }),
      getSingleQueueMetrics: jest.fn().mockResolvedValue({
        queueName: QUEUE_NAMES.EMAIL,
        status: 'HEALTHY',
        available: true,
        counts: { active: 1, waiting: 0, completed: 20, failed: 0, delayed: 0, paused: 0, total: 21 },
        isPaused: false,
      }),
      getDeadLetterJobs: jest.fn().mockResolvedValue([
        {
          id: 'dead-1',
          name: 'email.security-alert',
          queueName: QUEUE_NAMES.EMAIL,
          failedReason: 'SMTP connection refused',
          attemptsMade: 3,
          timestamp: Date.now(),
          stacktrace: [],
          data: { to: 'test@example.com', password: '[REDACTED]' },
        },
      ]),
      retryDeadLetterJob: jest.fn().mockResolvedValue({
        success: true,
        message: 'Job dead-1 successfully re-queued in "crm-email-queue"',
      }),
      cleanDeadLetterJobs: jest.fn().mockResolvedValue({
        cleanedCount: 1,
      }),
    };

    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      user: { count: jest.fn().mockResolvedValue(10) },
      session: { count: jest.fn().mockResolvedValue(5) },
      auditLog: { count: jest.fn().mockResolvedValue(100), findMany: jest.fn().mockResolvedValue([]) },
      auditArchiveOutbox: { count: jest.fn().mockResolvedValue(0) },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformSecurityOperationsController],
      providers: [
        SecurityOperationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AuditIntegrityMonitorService,
          useValue: { getSystemStatus: jest.fn().mockResolvedValue({ brokenLinks: 0, hashMismatches: 0 }) },
        },
        {
          provide: SecurityIncidentsService,
          useValue: { getSecurityCenterStatus: jest.fn().mockResolvedValue({ openIncidents: 0 }) },
        },
        {
          provide: SecurityAlertsService,
          useValue: {
            listAlerts: jest.fn().mockResolvedValue([]),
            runDetectionPass: jest.fn().mockResolvedValue({ alertsCreated: 0 }),
          },
        },
        {
          provide: EmergencySecurityService,
          useValue: {},
        },
        {
          provide: QueueMetricsService,
          useValue: mockQueueMetricsService,
        },
      ],
    }).compile();

    controller = module.get<PlatformSecurityOperationsController>(
      PlatformSecurityOperationsController,
    );
    secOpsService = module.get<SecurityOperationsService>(
      SecurityOperationsService,
    );
  });

  describe('Controller Queue Endpoints', () => {
    it('returns aggregate metrics when no queueName query parameter is supplied', async () => {
      const res = await controller.getQueueMetrics();
      expect(res.success).toBe(true);
      expect(mockQueueMetricsService.getAggregateMetrics).toHaveBeenCalled();
      expect(res.data.totalActive).toBe(2);
      expect(res.data.status).toBe('HEALTHY');
    });

    it('returns single queue metrics when valid queueName query parameter is supplied', async () => {
      const res = await controller.getQueueMetrics(QUEUE_NAMES.EMAIL);
      expect(res.success).toBe(true);
      expect(mockQueueMetricsService.getSingleQueueMetrics).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL,
      );
      expect(res.data.queueName).toBe(QUEUE_NAMES.EMAIL);
    });

    it('retrieves dead-letter jobs across all queues or for a specific queue', async () => {
      const res = await controller.getDeadLetterJobs(QUEUE_NAMES.EMAIL, '10', '0');
      expect(res.success).toBe(true);
      expect(mockQueueMetricsService.getDeadLetterJobs).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL,
        { limit: 10, offset: 0 },
      );
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe('dead-1');
    });

    it('retries a dead-letter job via POST endpoint', async () => {
      const res = await controller.retryDeadLetterJob(QUEUE_NAMES.EMAIL, 'dead-1');
      expect(res.success).toBe(true);
      expect(mockQueueMetricsService.retryDeadLetterJob).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL,
        'dead-1',
      );
      expect(res.message).toContain('successfully re-queued');
    });

    it('cleans dead-letter jobs via DELETE endpoint', async () => {
      const res = await controller.cleanDeadLetterJobs(QUEUE_NAMES.EMAIL, '3600000', '50');
      expect(res.success).toBe(true);
      expect(mockQueueMetricsService.cleanDeadLetterJobs).toHaveBeenCalledWith(
        QUEUE_NAMES.EMAIL,
        3600000,
        50,
      );
      expect(res.data.cleanedCount).toBe(1);
    });
  });

  describe('SecOps Health Integration with BullMQ', () => {
    it('integrates BullMQ queue metrics into Background Jobs platform health row', async () => {
      const health = await secOpsService.getPlatformSecurityHealth();
      const bgJobsRow = health.find((r) => r.service === 'Background Jobs');

      expect(bgJobsRow).toBeDefined();
      expect(bgJobsRow?.status).toBe('Healthy');
      expect(bgJobsRow?.detail).toContain('4 queues healthy');
    });

    it('flags Background Jobs as Warning when dead-letter / failed jobs exceed threshold', async () => {
      mockQueueMetricsService.getAggregateMetrics.mockResolvedValueOnce({
        status: 'WARNING',
        totalActive: 0,
        totalWaiting: 0,
        totalCompleted: 50,
        totalFailed: 15,
        totalDelayed: 0,
        queues: [],
        timestamp: new Date().toISOString(),
      });

      const health = await secOpsService.getPlatformSecurityHealth();
      const bgJobsRow = health.find((r) => r.service === 'Background Jobs');

      expect(bgJobsRow).toBeDefined();
      expect(bgJobsRow?.status).toBe('Warning');
    });
  });
});
