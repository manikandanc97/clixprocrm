import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemModule } from '../system/system.module';
import { PlatformAiController } from './controllers/platform-ai.controller';
import { PlatformAnalyticsController } from './controllers/platform-analytics.controller';
import { PlatformAuditIntegrityController } from './controllers/platform-audit-integrity.controller';
import { PlatformAuditLogsController } from './controllers/platform-audit-logs.controller';
import { PlatformBillingController } from './controllers/platform-billing.controller';
import { PlatformDashboardController } from './controllers/platform-dashboard.controller';
import { PlatformModulesController } from './controllers/platform-modules.controller';
import { PlatformOrganizationsController } from './controllers/platform-organizations.controller';
import { PlatformPlansController } from './controllers/platform-plans.controller';
import { PlatformSecurityCenterController } from './controllers/platform-security-center.controller';
import { PlatformSecurityGovernanceController } from './controllers/platform-security-governance.controller';
import { PlatformSecurityOperationsController } from './controllers/platform-security-operations.controller';
import { PlatformSettingsController } from './controllers/platform-settings.controller';
import { PlatformSupportTicketsController } from './controllers/platform-support-tickets.controller';
import { PlatformUsersController } from './controllers/platform-users.controller';
import { EmergencySecurityService } from './services/emergency-security.service';
import { PlatformAiService } from './services/platform-ai.service';
import { PlatformAnalyticsService } from './services/platform-analytics.service';
import { PlatformAuditLogsService } from './services/platform-audit-logs.service';
import { PlatformBillingService } from './services/platform-billing.service';
import { PlatformDashboardService } from './services/platform-dashboard.service';
import { PlatformModulesService } from './services/platform-modules.service';
import { PlatformOrganizationsService } from './services/platform-organizations.service';
import { PlatformPlansService } from './services/platform-plans.service';
import { PlatformSettingsService } from './services/platform-settings.service';
import { PlatformSupportTicketsService } from './services/platform-support-tickets.service';
import { PlatformUsersService } from './services/platform-users.service';
import { SecurityAlertsService } from './services/security-alerts.service';
import { SecurityGovernanceService } from './services/security-governance.service';
import { SecurityIncidentsService } from './services/security-incidents.service';
import { SecurityOperationsService } from './services/security-operations.service';

@Module({
  imports: [PrismaModule, SystemModule, AiModule, NotificationsModule],
  controllers: [
    PlatformDashboardController,
    PlatformOrganizationsController,
    PlatformUsersController,
    PlatformAnalyticsController,
    PlatformAuditLogsController,
    PlatformAuditIntegrityController,
    PlatformSecurityCenterController,
    PlatformSecurityOperationsController,
    PlatformSecurityGovernanceController,
    PlatformSettingsController,
    PlatformModulesController,
    PlatformAiController,
    PlatformPlansController,
    PlatformBillingController,
    PlatformSupportTicketsController,
  ],
  providers: [
    PlatformDashboardService,
    PlatformOrganizationsService,
    PlatformUsersService,
    PlatformAnalyticsService,
    PlatformAuditLogsService,
    PlatformSettingsService,
    PlatformModulesService,
    PlatformAiService,
    PlatformPlansService,
    PlatformBillingService,
    PlatformSupportTicketsService,
    EmergencySecurityService,
    SecurityIncidentsService,
    SecurityOperationsService,
    SecurityGovernanceService,
    SecurityAlertsService,
  ],
  exports: [
    PlatformDashboardService,
    PlatformOrganizationsService,
    PlatformUsersService,
    PlatformAnalyticsService,
    PlatformAuditLogsService,
    PlatformSettingsService,
    PlatformModulesService,
    PlatformAiService,
    PlatformPlansService,
    PlatformBillingService,
    PlatformSupportTicketsService,
    EmergencySecurityService,
    SecurityIncidentsService,
    SecurityOperationsService,
    SecurityGovernanceService,
    SecurityAlertsService,
  ],
})
export class SuperAdminModule {}
