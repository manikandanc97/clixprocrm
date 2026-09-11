import { SecurityOperationsService } from '../super-admin/services/security-operations.service';

describe('P6 Security Component Health Suite', () => {
  let secOpsService: SecurityOperationsService;
  let mockPrisma: any;
  let mockIntegrityMonitor: any;
  let mockArchiveService: any;
  let mockIncidentsService: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      userSession: {
        count: jest.fn().mockResolvedValue(15),
      },
    };

    mockIntegrityMonitor = {
      getSystemStatus: jest.fn().mockResolvedValue({
        status: 'HEALTHY',
        checkedRecords: 120,
        brokenLinks: 0,
        hashMismatches: 0,
        lastCheckAt: new Date().toISOString(),
      }),
    };

    mockArchiveService = {
      getOutboxStats: jest.fn().mockResolvedValue({
        pending: 2,
        processing: 0,
        archived: 118,
        failed: 0,
        stale: 0,
      }),
    };

    mockIncidentsService = {
      getSecurityCenterStatus: jest.fn().mockResolvedValue({
        openIncidents: 1,
        criticalIncidents: 0,
      }),
    };

    process.env.AWS_S3_AUDIT_BUCKET = 'test-bucket';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

    secOpsService = new SecurityOperationsService(
      mockPrisma,
      mockIntegrityMonitor,
      mockArchiveService,
      mockIncidentsService,
    );

    (secOpsService as any).redisClient = {
      ping: jest.fn().mockResolvedValue('PONG'),
    };
  });

  describe('1. Overall Health Aggregation', () => {
    it('returns HEALTHY when all sub-systems are operating normally', async () => {
      const health = await secOpsService.getSecurityHealth();
      expect(health.overallStatus).toBe('HEALTHY');
      expect(health.database.status).toBe('HEALTHY');
      expect(health.auditIntegrity.status).toBe('HEALTHY');
      expect(health.wormArchive.status).toBe('HEALTHY');
      expect(health.sessions.status).toBe('HEALTHY');
      expect(health.hardening.cors).toBe('HEALTHY');
    });

    it('transitions to CRITICAL if database connection fails', async () => {
      mockPrisma.$queryRaw = jest
        .fn()
        .mockRejectedValue(new Error('Connection terminated'));
      const health = await secOpsService.getSecurityHealth();
      expect(health.database.status).toBe('CRITICAL');
      expect(health.overallStatus).toBe('CRITICAL');
    });

    it('transitions to CRITICAL if audit chain has broken links', async () => {
      mockIntegrityMonitor.getSystemStatus = jest.fn().mockResolvedValue({
        status: 'CRITICAL',
        checkedRecords: 50,
        brokenLinks: 2,
        hashMismatches: 0,
      });

      const health = await secOpsService.getSecurityHealth();
      expect(health.auditIntegrity.status).toBe('CRITICAL');
      expect(health.overallStatus).toBe('CRITICAL');
    });

    it('transitions to DEGRADED if WORM S3 has stale outbox items', async () => {
      mockArchiveService.getOutboxStats = jest.fn().mockResolvedValue({
        pending: 10,
        processing: 0,
        archived: 100,
        failed: 6,
        stale: 2,
      });

      const health = await secOpsService.getSecurityHealth();
      expect(health.wormArchive.status).toBe('DEGRADED');
      expect(health.overallStatus).toBe('DEGRADED');
    });
  });
});
