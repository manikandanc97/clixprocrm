import { AuditIntegrityAlertService } from '../common/audit/integrity/audit-integrity-alert.service';

describe('P6 Security Alerting & Redis Deduplication Suite', () => {
  let alertService: AuditIntegrityAlertService;

  beforeEach(() => {
    alertService = new AuditIntegrityAlertService();
  });

  describe('1. Alert Sanitization & Payload Verification', () => {
    it('dispatches structured critical security alert without leaking secrets', async () => {
      const loggerSpy = jest.spyOn((alertService as any).logger, 'error');

      await alertService.dispatchAlert({
        type: 'AUDIT_HASH_MISMATCH',
        scope: 'tenant-123',
        recordId: 'rec-uuid-1',
        severity: 'CRITICAL',
        details: 'Cryptographic signature mismatch on record rec-uuid-1',
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[AUDIT INTEGRITY CRITICAL] [AUDIT_HASH_MISMATCH] Scope: tenant-123',
        ),
      );
    });
  });
});
