import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemModule } from '../system/system.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformDashboardController } from './controllers/platform-dashboard.controller';
import { PlatformDashboardService } from './services/platform-dashboard.service';
import { PlatformOrganizationsController } from './controllers/platform-organizations.controller';
import { PlatformOrganizationsService } from './services/platform-organizations.service';
import { PlatformUsersController } from './controllers/platform-users.controller';
import { PlatformUsersService } from './services/platform-users.service';
import { PlatformAnalyticsController } from './controllers/platform-analytics.controller';
import { PlatformAnalyticsService } from './services/platform-analytics.service';
import { PlatformAuditLogsController } from './controllers/platform-audit-logs.controller';
import { PlatformAuditLogsService } from './services/platform-audit-logs.service';
import { PlatformSettingsController } from './controllers/platform-settings.controller';
import { PlatformSettingsService } from './services/platform-settings.service';
import { PlatformModulesController } from './controllers/platform-modules.controller';
import { PlatformModulesService } from './services/platform-modules.service';
import { PlatformAuditIntegrityController } from './controllers/platform-audit-integrity.controller';
import { PlatformSecurityCenterController } from './controllers/platform-security-center.controller';
import { PlatformSecurityOperationsController } from './controllers/platform-security-operations.controller';
import { PlatformSecurityGovernanceController } from './controllers/platform-security-governance.controller';
import { PlatformAiController } from './controllers/platform-ai.controller';
import { PlatformAiService } from './services/platform-ai.service';
import { PlatformPlansController } from './controllers/platform-plans.controller';
import { PlatformPlansService } from './services/platform-plans.service';
import { PlatformBillingController } from './controllers/platform-billing.controller';
import { PlatformBillingService } from './services/platform-billing.service';
import { PlatformSupportTicketsController } from './controllers/platform-support-tickets.controller';
import { PlatformSupportTicketsService } from './services/platform-support-tickets.service';
import { EmergencySecurityService } from './services/emergency-security.service';
import { SecurityIncidentsService } from './services/security-incidents.service';
import { SecurityOperationsService } from './services/security-operations.service';
import { SecurityGovernanceService } from './services/security-governance.service';
import { SecurityAlertsService } from './services/security-alerts.service';

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
