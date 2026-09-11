import { SecurityGovernanceService } from '../super-admin/services/security-governance.service';

describe('P7 Security Governance Service Suite', () => {
  let governanceService: SecurityGovernanceService;
  let mockPrisma: any;
  let mockSecOps: any;
  let mockIntegrity: any;
  let mockArchive: any;
  let mockIncidents: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    mockSecOps = {
      getSecurityHealth: jest.fn().mockResolvedValue({
        overallStatus: 'HEALTHY',
        auditIntegrity: { status: 'HEALTHY' },
      }),
      getSecurityConfig: jest.fn().mockReturnValue({
        thresholds: { loginFailureThreshold: 50 },
      }),
    };

    mockIntegrity = {};
    mockArchive = {};
    mockIncidents = {
      getSecurityCenterStatus: jest.fn().mockResolvedValue({
        openIncidents: 0,
        criticalIncidents: 0,
        emergencyMode: false,
      }),
    };

    governanceService = new SecurityGovernanceService(
      mockPrisma,
      mockSecOps,
      mockIntegrity,
      mockArchive,
      mockIncidents,
    );
  });

  describe('1. Posture Aggregation', () => {
    it('returns high readiness posture when all controls are verified', async () => {
      const posture = await governanceService.getSecurityPosture();
      expect(posture.overallStatus).toBe('HEALTHY');
      expect(posture.securityReadinessScore).toBeGreaterThanOrEqual(90);
      expect(posture.controlsSummary.total).toBe(15);
      expect(posture.complianceReadiness[0].readinessStatus).toBe('HIGH');
    });
  });
});
