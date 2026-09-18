import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { SettingsController } from './controllers/settings.controller';
import { WorkspaceController } from './controllers/workspace.controller';
import { BrandingService } from './services/branding.service';
import { SettingsService } from './services/settings.service';
import { WorkspaceService } from './services/workspace.service';

import { SubscriptionEntitlementService } from '../common/plans/subscription-entitlement.service';
import { SubscriptionController } from './controllers/subscription.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule)],
  controllers: [
    WorkspaceController,
    SettingsController,
    SubscriptionController,
  ],
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
