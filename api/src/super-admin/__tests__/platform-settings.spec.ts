import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PlatformSettingsService } from '../services/platform-settings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      platformConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      plan: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'free', name: 'Free', price: '₹0', priceNum: 0, status: 'ACTIVE', isActive: true, sortOrder: 1 },
          { id: 'starter', name: 'Starter', price: '₹999', priceNum: 999, status: 'ACTIVE', isActive: true, sortOrder: 2 },
          { id: 'pro', name: 'Professional', price: '₹2,499', priceNum: 2499, status: 'ACTIVE', isActive: true, sortOrder: 3 },
        ]),
        findUnique: jest.fn(),
      },
      createSealedAuditLog: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformSettingsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PlatformSettingsService>(PlatformSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlatformSettings', () => {
    it('should return configured platform settings with active plans and operational status', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        name: 'ClixProCRM Enterprise',
        defaultTenantPlan: 'starter',
        defaultCurrency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
        allowPublicRegistrations: true,
        requireEmailVerification: true,
        allowWorkspaceSelfRegistration: true,
        maintenanceMode: false,
      });

      const result = await service.getPlatformSettings();

      expect(result.general.name).toBe('ClixProCRM Enterprise');
      expect(result.general.defaultTenantPlan).toBe('starter');
      expect(result.general.defaultCurrency).toBe('INR');
      expect(result.general.defaultTimezone).toBe('Asia/Kolkata');
      expect(result.workspaceRegistration.requireEmailVerification).toBe(true);
      expect(result.workspaceRegistration.maintenanceMode).toBe(false);
      expect(result.systemInfo.platformStatus).toBe('Operational');
      expect(result.systemInfo.databaseStatus).toBe('Connected');
      expect(result.availablePlans.length).toBe(3);
    });

    it('should fallback to default values when platformConfig is not found in database', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue(null);

      const result = await service.getPlatformSettings();

      expect(result.general.name).toBe('ClixProCRM');
      expect(result.general.defaultTenantPlan).toBe('free');
      expect(result.general.defaultCurrency).toBe('INR');
      expect(result.general.defaultTimezone).toBe('Asia/Kolkata');
      expect(result.workspaceRegistration.allowPublicRegistrations).toBe(true);
      expect(result.workspaceRegistration.maintenanceMode).toBe(false);
    });
  });

  describe('updatePlatformSettings', () => {
    it('should update platform settings and create sealed audit log for changes', async () => {
      prismaMock.platformConfig.findUnique.mockResolvedValue({
        id: 'global',
        name: 'ClixProCRM',
        defaultTenantPlan: 'free',
        defaultCurrency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
        allowPublicRegistrations: true,
        requireEmailVerification: false,
        allowWorkspaceSelfRegistration: true,
        maintenanceMode: false,
      });

      prismaMock.plan.findUnique.mockResolvedValue({ id: 'pro', name: 'Professional' });

      prismaMock.platformConfig.upsert.mockResolvedValue({
        id: 'global',
        name: 'Acme SaaS CRM',
        defaultTenantPlan: 'pro',
        defaultCurrency: 'USD',
        defaultTimezone: 'America/New_York',
        allowPublicRegistrations: false,
        requireEmailVerification: true,
        allowWorkspaceSelfRegistration: false,
        maintenanceMode: true,
      });

      const updateDto = {
        general: {
          name: 'Acme SaaS CRM',
          defaultTenantPlan: 'pro',
          defaultCurrency: 'USD',
          defaultTimezone: 'America/New_York',
        },
        workspaceRegistration: {
          allowPublicRegistrations: false,
          requireEmailVerification: true,
          allowWorkspaceSelfRegistration: false,
          maintenanceMode: true,
        },
      };

      const result = await service.updatePlatformSettings(updateDto, 'admin-user-123');

      expect(result.success).toBe(true);
      expect(result.data.general.name).toBe('Acme SaaS CRM');
      expect(result.data.workspaceRegistration.maintenanceMode).toBe(true);

      // Verify audit logs were created
      expect(prismaMock.createSealedAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-user-123',
          action: 'PLATFORM_SETTINGS_UPDATED',
          module: 'PlatformSettings',
          details: expect.objectContaining({
            changedFields: expect.arrayContaining([
              'name',
              'defaultTenantPlan',
              'defaultCurrency',
              'defaultTimezone',
              'allowPublicRegistrations',
              'requireEmailVerification',
              'allowWorkspaceSelfRegistration',
              'maintenanceMode',
            ]),
          }),
        }),
      );

      // Verify explicit maintenance mode audit log
      expect(prismaMock.createSealedAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-user-123',
          action: 'PLATFORM_MAINTENANCE_ENABLED',
          module: 'PlatformSettings',
        }),
      );
    });

    it('should reject invalid default plan reference', async () => {
      prismaMock.plan.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePlatformSettings(
          { defaultTenantPlan: 'non-existent-plan' },
          'admin-user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
