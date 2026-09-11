import { PlatformSecurityCenterController } from '../super-admin/controllers/platform-security-center.controller';

describe('P4 Security Center Controller & Server Guard Suite', () => {
  let controller: PlatformSecurityCenterController;
  let mockIncidentsService: any;
  let mockEmergencyService: any;

  beforeEach(() => {
    mockIncidentsService = {
      getSecurityCenterStatus: jest.fn().mockResolvedValue({
        emergencyMode: false,
        openIncidents: 2,
        criticalIncidents: 0,
        lockedUsers: 0,
        lockedTenants: 0,
        auditIntegrityStatus: 'HEALTHY',
      }),
      listIncidents: jest.fn().mockResolvedValue({
        incidents: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
      getIncidentById: jest
        .fn()
        .mockResolvedValue({ id: 'inc-1', title: 'Test' }),
      createIncident: jest.fn().mockResolvedValue({
        id: 'inc-1',
        incidentNumber: 'INC-20260820-0001',
      }),
      updateIncidentStatus: jest
        .fn()
        .mockResolvedValue({ id: 'inc-1', status: 'INVESTIGATING' }),
      resolveIncident: jest
        .fn()
        .mockResolvedValue({ id: 'inc-1', status: 'RESOLVED' }),
    };

    mockEmergencyService = {
      revokeUserSessions: jest
        .fn()
        .mockResolvedValue({ success: true, revokedCount: 3 }),
      lockUser: jest.fn().mockResolvedValue({ success: true }),
      unlockUser: jest.fn().mockResolvedValue({ success: true }),
      lockTenant: jest.fn().mockResolvedValue({ success: true }),
      unlockTenant: jest.fn().mockResolvedValue({ success: true }),
      generateBreakGlassCode: jest.fn().mockResolvedValue('EMERGENCY-12345678'),
      enablePlatformEmergency: jest.fn().mockResolvedValue({ success: true }),
      disablePlatformEmergency: jest.fn().mockResolvedValue({ success: true }),
    };

    controller = new PlatformSecurityCenterController(
      mockIncidentsService,
      mockEmergencyService,
    );
  });

  describe('1. Security Center Status API', () => {
    it('returns aggregated security center status', async () => {
      const res = await controller.getStatus();
      expect(res.success).toBe(true);
      expect(res.data.openIncidents).toBe(2);
    });
  });

  describe('2. Incident APIs', () => {
    it('creates security incident via controller', async () => {
      const req = { user: { id: 'usr-admin-1' } };
      const res = await controller.createIncident(
        {
          title: 'Brute force attack',
          description: '15 failed logins',
          severity: 'HIGH',
        },
        req,
      );
      expect(res.success).toBe(true);
      expect(mockIncidentsService.createIncident).toHaveBeenCalled();
    });
  });

  describe('3. Emergency Action APIs', () => {
    it('executes emergency user lock', async () => {
      const req = { user: { id: 'usr-admin-1' } };
      const res = await controller.emergencyLockUser(
        'usr-compromised',
        { reason: 'Compromised account reported', confirmation: 'LOCK USER' },
        req,
      );
      expect(res.success).toBe(true);
      expect(mockEmergencyService.lockUser).toHaveBeenCalledWith(
        'usr-compromised',
        'Compromised account reported',
        'LOCK USER',
        'usr-admin-1',
      );
    });

    it('generates break-glass code', async () => {
      const req = { user: { id: 'usr-admin-1' } };
      const res = await controller.generateBreakGlassCode(req);
      expect(res.success).toBe(true);
      expect(res.data.confirmationCode).toBe('EMERGENCY-12345678');
    });
  });
});
