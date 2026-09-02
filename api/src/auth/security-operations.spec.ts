import { PlatformSecurityOperationsController } from '../super-admin/controllers/platform-security-operations.controller';

describe('P6 Platform Security Operations Controller Suite', () => {
  let controller: PlatformSecurityOperationsController;
  let mockSecOpsService: any;
  let mockAlertsService: any;
  let mockEmergencyService: any;

  beforeEach(() => {
    mockSecOpsService = {
      getSecOpsSummary: jest.fn().mockResolvedValue({
        overallStatus: 'HEALTHY',
        overallStatusBadge: 'System Healthy',
        metrics: {
          systemHealth: 'HEALTHY',
          securityServices: '6 / 6 Operational',
          operationalServicesCount: 6,
          totalServicesCount: 6,
          securityAlertsCount: 0,
          openIncidentsCount: 0,
        },
        servicesHealth: [],
        lastCheckedAt: new Date().toISOString(),
      }),
      getPlatformSecurityHealth: jest.fn().mockResolvedValue([
        { service: 'Database', status: 'Healthy', lastChecked: new Date().toISOString(), detail: 'Responsive' },
      ]),
      getSecurityHealth: jest.fn().mockResolvedValue({
        overallStatus: 'HEALTHY',
        lastCheckedAt: new Date().toISOString(),
      }),
      getSecurityMetrics: jest.fn().mockResolvedValue({
        period: '24h',
        metrics: { loginSuccessCount: 150, loginFailureCount: 2, openIncidentsCount: 0 },
        anomaliesDetected: [],
      }),
      getSecurityTimeline: jest.fn().mockResolvedValue([
        { id: 'log-1', action: 'LOGIN_SUCCESS', createdAt: new Date() },
      ]),
      getSecurityConfig: jest.fn().mockReturnValue({
        thresholds: { loginFailureThreshold: 5 },
      }),
    };

    mockAlertsService = {
      listAlerts: jest.fn().mockResolvedValue({ alerts: [], pagination: { total: 0 } }),
      runDetectionPass: jest.fn().mockResolvedValue({ success: true, alertsCreated: 0, alerts: [] }),
      acknowledgeAlert: jest.fn().mockResolvedValue({ id: 'alert-1', status: 'ACKNOWLEDGED' }),
      resolveAlert: jest.fn().mockResolvedValue({ id: 'alert-1', status: 'RESOLVED' }),
      escalateAlertToIncident: jest.fn().mockResolvedValue({ success: true, incident: { id: 'inc-1' }, alertId: 'alert-1' }),
    };

    mockEmergencyService = {
      forcePasswordReset: jest.fn().mockResolvedValue({ success: true, message: 'Password reset forced' }),
    };

    controller = new PlatformSecurityOperationsController(
      mockSecOpsService as any,
      mockAlertsService as any,
      mockEmergencyService as any,
    );
  });

  describe('1. Controller Endpoints', () => {
    it('returns summary metrics via GET /summary', async () => {
      const res = await controller.getSummary();
      expect(res.success).toBe(true);
      expect(res.data.overallStatus).toBe('HEALTHY');
      expect(mockSecOpsService.getSecOpsSummary).toHaveBeenCalled();
    });

    it('returns live health rows via GET /health', async () => {
      const res = await controller.getHealth();
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(mockSecOpsService.getPlatformSecurityHealth).toHaveBeenCalled();
    });

    it('returns alerts via GET /alerts', async () => {
      const res = await controller.listAlerts({});
      expect(res.success).toBe(true);
      expect(mockAlertsService.listAlerts).toHaveBeenCalled();
    });

    it('triggers threat detection via POST /alerts/detect', async () => {
      const res = await controller.runDetection({ user: { id: 'admin-1' } });
      expect(res.success).toBe(true);
      expect(mockAlertsService.runDetectionPass).toHaveBeenCalledWith('admin-1');
    });

    it('forces password reset via POST /emergency/force-password-reset/:userId', async () => {
      const res = await controller.forcePasswordReset('usr-1', { reason: 'Suspicious login' }, { user: { id: 'admin-1' } });
      expect(res.success).toBe(true);
      expect(mockEmergencyService.forcePasswordReset).toHaveBeenCalledWith('usr-1', 'Suspicious login', 'admin-1');
    });
  });
});
