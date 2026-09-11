import { SecurityOperationsService } from '../super-admin/services/security-operations.service';

describe('P6 Security Metrics & Threshold Anomaly Detection Suite', () => {
  let secOpsService: SecurityOperationsService;
  let mockPrisma: any;
  let mockIntegrityMonitor: any;
  let mockArchiveService: any;
  let mockIncidentsService: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.action === 'LOGIN_SUCCESS') return Promise.resolve(200);
          if (where.action === 'LOGIN_FAILED') return Promise.resolve(5);
          if (where.action === 'NEW_DEVICE_LOGIN') return Promise.resolve(8);
          if (where.action === 'MFA_CHALLENGE_FAILED')
            return Promise.resolve(2);
          return Promise.resolve(0);
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: { count: jest.fn().mockResolvedValue(0) },
      tenant: { count: jest.fn().mockResolvedValue(0) },
      securityIncident: { count: jest.fn().mockResolvedValue(0) },
      platformSecurityState: {
        findUnique: jest.fn().mockResolvedValue({ emergencyMode: false }),
      },
    };

    mockIntegrityMonitor = {
      getSystemStatus: jest
        .fn()
        .mockResolvedValue({ brokenLinks: 0, hashMismatches: 0 }),
    };

    mockArchiveService = {
      getOutboxStats: jest.fn().mockResolvedValue({ failed: 0, stale: 0 }),
    };

    mockIncidentsService = {
      getSecurityCenterStatus: jest
        .fn()
        .mockResolvedValue({ openIncidents: 0, criticalIncidents: 0 }),
    };

    secOpsService = new SecurityOperationsService(
      mockPrisma,
      mockIntegrityMonitor,
      mockArchiveService,
      mockIncidentsService,
    );
  });

  describe('1. Normal Metrics Aggregation', () => {
    it('aggregates metrics without triggering anomalies under thresholds', async () => {
      const res = await secOpsService.getSecurityMetrics('24h');
      expect(res.period).toBe('24h');
      expect(res.metrics.loginSuccessCount).toBe(200);
      expect(res.metrics.loginFailureCount).toBe(5);
      expect(res.anomaliesDetected.length).toBe(0);
    });
  });

  describe('2. Threshold Anomaly Detection', () => {
    it('detects and flags LOGIN_FAILED_SPIKE when exceeding configured threshold', async () => {
      mockPrisma.auditLog.count = jest.fn().mockImplementation(({ where }) => {
        if (where.action === 'LOGIN_FAILED') return Promise.resolve(120); // Spike (> 50)
        return Promise.resolve(10);
      });

      const res = await secOpsService.getSecurityMetrics('24h');
      expect(res.anomaliesDetected).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metric: 'LOGIN_FAILED_SPIKE',
            severity: 'HIGH',
          }),
        ]),
      );
    });

    it('detects and flags MFA_FAILURE_SPIKE when exceeding threshold', async () => {
      mockPrisma.auditLog.count = jest.fn().mockImplementation(({ where }) => {
        if (where.action === 'MFA_CHALLENGE_FAILED') return Promise.resolve(45); // Spike (> 20)
        return Promise.resolve(0);
      });

      const res = await secOpsService.getSecurityMetrics('24h');
      expect(res.anomaliesDetected).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metric: 'MFA_FAILURE_SPIKE',
            severity: 'HIGH',
          }),
        ]),
      );
    });
  });
});
