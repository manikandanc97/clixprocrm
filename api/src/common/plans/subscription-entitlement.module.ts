import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SubscriptionEntitlementService } from './subscription-entitlement.service';
import { PlanFeatureGuard, PlanLimitGuard } from './plan-feature.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    SubscriptionEntitlementService,
    PlanFeatureGuard,
    PlanLimitGuard,
  ],
  exports: [
    SubscriptionEntitlementService,
    PlanFeatureGuard,
    PlanLimitGuard,
  ],
})
export class SubscriptionEntitlementModule {}
