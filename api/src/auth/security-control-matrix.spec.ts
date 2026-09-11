import { SecurityGovernanceService } from '../super-admin/services/security-governance.service';

describe('P7 Security Control Matrix & RLS Governance Suite', () => {
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

  describe('1. Control Inventory Categorization', () => {
    it('contains controls across all 15 required categories', async () => {
      const controls = await governanceService.getControlInventory();
      const categories = new Set(controls.map((c) => c.category));

      const requiredCategories = [
        'AUTH',
        'MFA',
        'SESSION',
        'RBAC',
        'RLS',
        'AUDIT',
        'CRYPTO',
        'WORM',
        'MONITORING',
        'INCIDENT',
        'NETWORK',
        'UPLOAD',
        'INPUT',
        'CONFIG',
        'BACKUP',
      ];

      for (const reqCat of requiredCategories) {
        expect(categories.has(reqCat as any)).toBe(true);
      }
    });
  });

  describe('2. RLS Governance', () => {
    it('verifies all 25 tenant-scoped tables enforce FORCE RLS', async () => {
      const rls = await governanceService.getRlsGovernance();
      expect(rls.verifiedTenantTablesCount).toBe(25);
      expect(rls.tables.every((t) => t.forceRlsEnabled && t.rlsEnabled)).toBe(
        true,
      );
      expect(rls.globalAuditLogScoped.table).toBe('AuditLog');
      expect(rls.globalAuditLogScoped.classification).toBe(
        'SYSTEM_GLOBAL_IMMUTABLE',
      );
    });
  });
});
