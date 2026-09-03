import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdatePlatformSettingsDto {
  name?: string;
  defaultTenantPlan?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
  allowPublicRegistrations?: boolean;
  requireEmailVerification?: boolean;
  allowWorkspaceSelfRegistration?: boolean;
  maintenanceMode?: boolean;
  general?: {
    name?: string;
    defaultTenantPlan?: string;
    defaultCurrency?: string;
    defaultTimezone?: string;
  };
  workspaceRegistration?: {
    allowPublicRegistrations?: boolean;
    requireEmailVerification?: boolean;
    allowWorkspaceSelfRegistration?: boolean;
    maintenanceMode?: boolean;
  };
  platform?: Record<string, any>;
}

@Injectable()
export class PlatformSettingsService {
  private readonly logger = new Logger(PlatformSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPlatformSettings() {
    try {
      let dbStatus = 'Connected';
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (dbErr) {
        dbStatus = 'Degraded';
        this.logger.warn(`Database health check query warning: ${dbErr}`);
      }

      const [config, rawPlans] = await Promise.all([
        (this.prisma as any).platformConfig.findUnique({
          where: { id: 'global' },
        }),
        (this.prisma as any).plan.findMany({
          orderBy: { sortOrder: 'asc' },
        }),
      ]);

      const activePlans = (rawPlans || [])
        .filter((p: any) => p.status !== 'ARCHIVED' && p.isActive !== false)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          priceNum: Number(p.priceNum || 0),
          status: p.status || 'ACTIVE',
        }));

      const platformConfig = config || {
        name: 'ClixProCRM',
        defaultTenantPlan: activePlans[0]?.id || 'free',
        defaultCurrency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
        maintenanceMode: false,
        allowPublicRegistrations: true,
        requireEmailVerification: false,
        allowWorkspaceSelfRegistration: true,
      };

      const environment =
        process.env.NODE_ENV === 'production'
          ? 'Production'
          : process.env.NODE_ENV === 'staging'
          ? 'Staging'
          : 'Development';

      return {
        general: {
          name: platformConfig.name || 'ClixProCRM',
          defaultTenantPlan: platformConfig.defaultTenantPlan || 'free',
          defaultCurrency: platformConfig.defaultCurrency || 'INR',
          defaultTimezone: platformConfig.defaultTimezone || 'Asia/Kolkata',
        },
        workspaceRegistration: {
          allowPublicRegistrations: platformConfig.allowPublicRegistrations ?? true,
          requireEmailVerification: platformConfig.requireEmailVerification ?? false,
          allowWorkspaceSelfRegistration: platformConfig.allowWorkspaceSelfRegistration ?? true,
          maintenanceMode: platformConfig.maintenanceMode ?? false,
        },
        systemInfo: {
          platformVersion: '2.4.0',
          apiVersion: '2.4.0',
          platformStatus: 'Operational',
          databaseStatus: dbStatus,
          environment,
        },
        availablePlans: activePlans.length > 0 ? activePlans : [
          { id: 'free', name: 'Free', price: '₹0' },
          { id: 'starter', name: 'Starter', price: '₹999' },
          { id: 'pro', name: 'Professional', price: '₹2,499' },
          { id: 'enterprise', name: 'Enterprise', price: 'Custom' },
        ],
        // Legacy backward compatibility format
        platform: {
          name: platformConfig.name || 'ClixProCRM',
          defaultTenantPlan: platformConfig.defaultTenantPlan || 'free',
          defaultCurrency: platformConfig.defaultCurrency || 'INR',
          defaultTimezone: platformConfig.defaultTimezone || 'Asia/Kolkata',
          allowPublicRegistrations: platformConfig.allowPublicRegistrations ?? true,
          requireEmailVerification: platformConfig.requireEmailVerification ?? false,
          allowWorkspaceSelfRegistration: platformConfig.allowWorkspaceSelfRegistration ?? true,
          maintenanceMode: platformConfig.maintenanceMode ?? false,
          version: '2.4.0',
          apiVersion: '2.4.0',
          environment,
          systemStatus: 'Operational',
          databaseStatus: dbStatus,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to get platform settings:', error);
      throw error;
    }
  }

  async updatePlatformSettings(data: UpdatePlatformSettingsDto, adminActorId: string) {
    try {
      // Normalize incoming payload
      const name =
        data.general?.name ?? data.platform?.name ?? data.name;
      const defaultTenantPlan =
        data.general?.defaultTenantPlan ?? data.platform?.defaultTenantPlan ?? data.defaultTenantPlan;
      const defaultCurrency =
        data.general?.defaultCurrency ?? data.platform?.defaultCurrency ?? data.defaultCurrency;
      const defaultTimezone =
        data.general?.defaultTimezone ?? data.platform?.defaultTimezone ?? data.defaultTimezone;

      const allowPublicRegistrations =
        data.workspaceRegistration?.allowPublicRegistrations ??
        data.platform?.allowPublicRegistrations ??
        data.allowPublicRegistrations;

      const requireEmailVerification =
        data.workspaceRegistration?.requireEmailVerification ??
        data.platform?.requireEmailVerification ??
        data.requireEmailVerification;

      const allowWorkspaceSelfRegistration =
        data.workspaceRegistration?.allowWorkspaceSelfRegistration ??
        data.platform?.allowWorkspaceSelfRegistration ??
        data.allowWorkspaceSelfRegistration;

      const maintenanceMode =
        data.workspaceRegistration?.maintenanceMode ??
        data.platform?.maintenanceMode ??
        data.maintenanceMode;

      // Validate default plan if provided
      if (defaultTenantPlan) {
        const existingPlan = await (this.prisma as any).plan.findUnique({
          where: { id: defaultTenantPlan },
        });
        if (!existingPlan) {
          throw new BadRequestException(
            `Selected default plan '${defaultTenantPlan}' does not exist.`,
          );
        }
      }

      // Fetch current settings to detect changed fields
      const existingConfig = await (this.prisma as any).platformConfig.findUnique({
        where: { id: 'global' },
      });

      const previousState = existingConfig || {
        name: 'ClixProCRM',
        defaultTenantPlan: 'free',
        defaultCurrency: 'INR',
        defaultTimezone: 'Asia/Kolkata',
        maintenanceMode: false,
        allowPublicRegistrations: true,
        requireEmailVerification: false,
        allowWorkspaceSelfRegistration: true,
      };

      const changedFields: string[] = [];
      const previousValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      const checkField = (fieldName: string, newVal: any, prevVal: any) => {
        if (newVal !== undefined && newVal !== prevVal) {
          changedFields.push(fieldName);
          previousValues[fieldName] = prevVal;
          newValues[fieldName] = newVal;
        }
      };

      checkField('name', name, previousState.name);
      checkField('defaultTenantPlan', defaultTenantPlan, previousState.defaultTenantPlan);
      checkField('defaultCurrency', defaultCurrency, previousState.defaultCurrency);
      checkField('defaultTimezone', defaultTimezone, previousState.defaultTimezone);
      checkField('allowPublicRegistrations', allowPublicRegistrations, previousState.allowPublicRegistrations);
      checkField('requireEmailVerification', requireEmailVerification, previousState.requireEmailVerification);
      checkField('allowWorkspaceSelfRegistration', allowWorkspaceSelfRegistration, previousState.allowWorkspaceSelfRegistration);
      checkField('maintenanceMode', maintenanceMode, previousState.maintenanceMode);

      // Perform atomic upsert
      const updated = await (this.prisma as any).platformConfig.upsert({
        where: { id: 'global' },
        update: {
          ...(name !== undefined && { name }),
          ...(defaultTenantPlan !== undefined && { defaultTenantPlan }),
          ...(defaultCurrency !== undefined && { defaultCurrency }),
          ...(defaultTimezone !== undefined && { defaultTimezone }),
          ...(allowPublicRegistrations !== undefined && { allowPublicRegistrations }),
          ...(requireEmailVerification !== undefined && { requireEmailVerification }),
          ...(allowWorkspaceSelfRegistration !== undefined && { allowWorkspaceSelfRegistration }),
          ...(maintenanceMode !== undefined && { maintenanceMode }),
          updatedBy: adminActorId,
        },
        create: {
          id: 'global',
          name: name || 'ClixProCRM',
          defaultTenantPlan: defaultTenantPlan || 'free',
          defaultCurrency: defaultCurrency || 'INR',
          defaultTimezone: defaultTimezone || 'Asia/Kolkata',
          allowPublicRegistrations: allowPublicRegistrations ?? true,
          requireEmailVerification: requireEmailVerification ?? false,
          allowWorkspaceSelfRegistration: allowWorkspaceSelfRegistration ?? true,
          maintenanceMode: maintenanceMode || false,
          updatedBy: adminActorId,
        },
      });

      // Create sealed audit log for changes
      if (changedFields.length > 0) {
        await this.prisma.createSealedAuditLog({
          userId: adminActorId,
          action: 'PLATFORM_SETTINGS_UPDATED',
          module: 'PlatformSettings',
          details: {
            actor: adminActorId,
            changedFields,
            previousValues,
            newValues,
            result: 'SUCCESS',
            timestamp: new Date().toISOString(),
          },
        });

        // If maintenance mode specifically changed, log explicit security event
        if (maintenanceMode !== undefined && maintenanceMode !== previousState.maintenanceMode) {
          await this.prisma.createSealedAuditLog({
            userId: adminActorId,
            action: maintenanceMode ? 'PLATFORM_MAINTENANCE_ENABLED' : 'PLATFORM_MAINTENANCE_DISABLED',
            module: 'PlatformSettings',
            details: {
              actor: adminActorId,
              maintenanceMode,
              result: 'SUCCESS',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      return {
        success: true,
        message: 'Platform settings updated successfully',
        data: {
          general: {
            name: updated.name,
            defaultTenantPlan: updated.defaultTenantPlan,
            defaultCurrency: updated.defaultCurrency,
            defaultTimezone: updated.defaultTimezone,
          },
          workspaceRegistration: {
            allowPublicRegistrations: updated.allowPublicRegistrations,
            requireEmailVerification: updated.requireEmailVerification,
            allowWorkspaceSelfRegistration: updated.allowWorkspaceSelfRegistration,
            maintenanceMode: updated.maintenanceMode,
          },
          platform: {
            name: updated.name,
            defaultTenantPlan: updated.defaultTenantPlan,
            defaultCurrency: updated.defaultCurrency,
            defaultTimezone: updated.defaultTimezone,
            allowPublicRegistrations: updated.allowPublicRegistrations,
            requireEmailVerification: updated.requireEmailVerification,
            allowWorkspaceSelfRegistration: updated.allowWorkspaceSelfRegistration,
            maintenanceMode: updated.maintenanceMode,
          },
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to update platform settings:', error);
      throw error;
    }
  }
}
