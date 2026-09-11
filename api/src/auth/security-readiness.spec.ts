import { SecurityGovernanceService } from '../super-admin/services/security-governance.service';

describe('P7 Security Readiness Score Calculation Suite', () => {
  let governanceService: SecurityGovernanceService;
  let mockSecOps: any;

  beforeEach(() => {
    mockSecOps = {
      getSecurityHealth: jest.fn().mockResolvedValue({
        overallStatus: 'HEALTHY',
        auditIntegrity: { status: 'HEALTHY' },
      }),
    };

    governanceService = new SecurityGovernanceService(
      {} as any,
      mockSecOps,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  describe('1. Weighted Readiness Scoring', () => {
    it('calculates score within 0 to 100 range', async () => {
      const { score, breakdown, overallStatus } =
        await governanceService.calculateReadinessScore();

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(overallStatus).toBe('HEALTHY');

      expect(breakdown.AUTH.weight).toBe(15);
      expect(breakdown.RLS.weight).toBe(15);
      expect(breakdown.AUDIT.weight).toBe(15);
      expect(breakdown.MFA.weight).toBe(10);
      expect(breakdown.SESSION.weight).toBe(10);
      expect(breakdown.RBAC.weight).toBe(10);
    });
  });
});
