import { Module } from '@nestjs/common';
import { WorkspaceController } from './controllers/workspace.controller';
import { SettingsController } from './controllers/settings.controller';
import { WorkspaceService } from './services/workspace.service';
import { SettingsService } from './services/settings.service';
import { BrandingService } from './services/branding.service';
import { PrismaModule } from '../prisma/prisma.module';

import { SubscriptionController } from './controllers/subscription.controller';
import { SubscriptionEntitlementService } from '../common/plans/subscription-entitlement.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspaceController, SettingsController, SubscriptionController],
  providers: [
    WorkspaceService,
    SettingsService,
    BrandingService,
    SubscriptionEntitlementService,
  ],
  exports: [
    WorkspaceService,
    SettingsService,
    BrandingService,
    SubscriptionEntitlementService,
  ],
})
export class WorkspaceModule {}

