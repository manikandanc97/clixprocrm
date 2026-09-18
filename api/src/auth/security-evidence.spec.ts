import { SecurityGovernanceService } from '../super-admin/services/security-governance.service';

describe('P7 Security Evidence Export & SHA-256 Sealing Suite', () => {
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

  describe('1. Evidence Report Generation', () => {
    it('generates JSON evidence report with deterministic SHA-256 checksum', async () => {
      const report = await governanceService.generateEvidenceReport('json');
      expect(report.format).toBe('json');
      expect(report.filename).toContain('.json');
      expect(report.checksum).toBeDefined();
      expect(report.checksum.length).toBe(64); // SHA-256 hex length

      const parsed = JSON.parse(report.content);
      expect(parsed.reportId).toBeDefined();
      expect(parsed.controls.length).toBeGreaterThanOrEqual(15);
      expect(parsed.sha256Checksum).toBe(report.checksum);

      // Verify no secrets or JWT tokens leaked in content
      expect(report.content).not.toContain('eyJ'); // JWT pattern
      expect(report.content).not.toContain('postgres://');
      expect(report.content).not.toContain('AWS_SECRET');
    });

    it('generates CSV evidence report', async () => {
      const report = await governanceService.generateEvidenceReport('csv');
      expect(report.format).toBe('csv');
      expect(report.filename).toContain('.csv');
      expect(report.content).toContain(
        'Control ID,Category,Name,Status,Severity,Evidence',
      );
    });
  });
});
