import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformSettings() {
    const [tenantCount, userCount, superAdminCount, config] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isSuperAdmin: true } }),
      (this.prisma as any).platformConfig.findUnique({
        where: { id: 'global' },
      }),
    ]);

    const platformConfig = config || {
      name: 'ClixProCRM Multi-Tenant Platform',
      defaultTenantPlan: 'free',
      maintenanceMode: false,
      allowPublicRegistrations: true,
      aiCopilot: true,
      documentRag: true,
      multiCurrency: true,
    };

    return {
      platform: {
        name: platformConfig.name,
        version: '2.4.0',
        environment: process.env.NODE_ENV || 'development',
        systemStatus: 'HEALTHY',
        maintenanceMode: platformConfig.maintenanceMode,
        allowPublicRegistrations: platformConfig.allowPublicRegistrations,
        defaultTenantPlan: platformConfig.defaultTenantPlan,
        apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
      },
      stats: {
        totalOrganizations: tenantCount,
        totalUsers: userCount,
        superAdminCount,
      },
      features: {
        aiCopilot: platformConfig.aiCopilot,
        documentRag: platformConfig.documentRag,
        multiCurrency: platformConfig.multiCurrency,
        auditLogging: true,
        rateLimiting: true,
      },
    };
  }

  async updatePlatformSettings(data: any, adminActorId: string) {
    const platformData = data.platform || {};
    const featuresData = data.features || {};

    const updated = await (this.prisma as any).platformConfig.upsert({
      where: { id: 'global' },
      update: {
        ...(platformData.name && { name: platformData.name }),
        ...(platformData.defaultTenantPlan && { defaultTenantPlan: platformData.defaultTenantPlan }),
        ...(platformData.maintenanceMode !== undefined && { maintenanceMode: platformData.maintenanceMode }),
        ...(platformData.allowPublicRegistrations !== undefined && { allowPublicRegistrations: platformData.allowPublicRegistrations }),
        ...(featuresData.aiCopilot !== undefined && { aiCopilot: featuresData.aiCopilot }),
        ...(featuresData.documentRag !== undefined && { documentRag: featuresData.documentRag }),
        ...(featuresData.multiCurrency !== undefined && { multiCurrency: featuresData.multiCurrency }),
        updatedBy: adminActorId,
      },
      create: {
        id: 'global',
        name: platformData.name || 'ClixProCRM Multi-Tenant Platform',
        defaultTenantPlan: platformData.defaultTenantPlan || 'free',
        maintenanceMode: platformData.maintenanceMode || false,
        allowPublicRegistrations: platformData.allowPublicRegistrations ?? true,
        aiCopilot: featuresData.aiCopilot ?? true,
        documentRag: featuresData.documentRag ?? true,
        multiCurrency: featuresData.multiCurrency ?? true,
        updatedBy: adminActorId,
      },
    });

    await this.prisma.createSealedAuditLog({
      userId: adminActorId,
      action: 'PLATFORM_SETTINGS_UPDATED',
      module: 'SuperAdminSettings',
      details: data,
    });

    return {
      success: true,
      message: 'Platform settings updated successfully',
      settings: updated,
    };
  }
}
