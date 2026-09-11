import { SecurityGovernanceService } from '../super-admin/services/security-governance.service';

describe('P7 Security Posture & Critical Override Suite', () => {
  let governanceService: SecurityGovernanceService;
  let mockPrisma: any;
  let mockSecOps: any;
  let mockIncidents: any;

  beforeEach(() => {
    mockPrisma = {};
    mockSecOps = {
      getSecurityHealth: jest.fn().mockResolvedValue({
        overallStatus: 'HEALTHY',
        auditIntegrity: { status: 'HEALTHY' },
      }),
    };
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
      {} as any,
      {} as any,
      mockIncidents,
    );
  });

  describe('1. Critical Control Failure Override', () => {
    it('forces overall status to CRITICAL if HMAC audit chain is degraded', async () => {
      mockSecOps.getSecurityHealth = jest.fn().mockResolvedValue({
        overallStatus: 'DEGRADED',
        auditIntegrity: { status: 'CRITICAL' },
      });

      const { overallStatus } =
        await governanceService.calculateReadinessScore();
      expect(overallStatus).toBe('CRITICAL');
    });
  });
});
