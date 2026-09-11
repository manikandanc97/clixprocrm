import { PlatformAuditIntegrityController } from '../super-admin/controllers/platform-audit-integrity.controller';
import { AuditIntegrityMonitorService } from '../common/audit/integrity/audit-integrity-monitor.service';
import { AuditDisasterRecoveryService } from '../common/audit/integrity/audit-dr.service';

describe('P3 Audit Integrity Dashboard & Controller Security Suite', () => {
  let controller: PlatformAuditIntegrityController;
  let mockMonitorService: any;
  let mockDrService: any;

  beforeEach(() => {
    mockMonitorService = {
      getSystemStatus: jest.fn().mockResolvedValue({
        status: 'HEALTHY',
        checkedRecords: 150,
        archiveCoveragePercent: 100,
        brokenLinks: 0,
        hashMismatches: 0,
      }),
      verifyRecent: jest.fn().mockResolvedValue({
        status: 'HEALTHY',
        checkedRecords: 50,
      }),
      runIntegrityVerification: jest.fn().mockImplementation(({ tenantId }) =>
        Promise.resolve({
          status: 'HEALTHY',
          scope: tenantId ? `tenant:${tenantId}` : 'platform',
          checkedRecords: 20,
        }),
      ),
    };

    mockDrService = {
      verifyAuditArchiveRestore: jest.fn().mockImplementation((recordId) =>
        Promise.resolve({
          restorable: true,
          recordId,
          reason: null,
        }),
      ),
    };

    controller = new PlatformAuditIntegrityController(
      mockMonitorService,
      mockDrService,
    );
  });

  describe('1. Controller Endpoints', () => {
    it('returns system integrity status for Super Admin', async () => {
      const res = await controller.getStatus();
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('HEALTHY');
      expect(mockMonitorService.getSystemStatus).toHaveBeenCalled();
    });

    it('triggers platform verification', async () => {
      const res = await controller.triggerVerify();
      expect(res.success).toBe(true);
      expect(res.data.scope).toBe('platform');
    });

    it('triggers tenant-scoped verification with tenantId', async () => {
      const res = await controller.triggerTenantVerify('tenant-specific-123');
      expect(res.success).toBe(true);
      expect(res.data.scope).toBe('tenant:tenant-specific-123');
    });

    it('executes DR verification dry run for record', async () => {
      const res = await controller.triggerDrVerify('rec-dr-789');
      expect(res.success).toBe(true);
      expect(res.data.restorable).toBe(true);
    });
  });
});
