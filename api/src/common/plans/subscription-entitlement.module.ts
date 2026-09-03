import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SubscriptionEntitlementService } from './subscription-entitlement.service';
import { PlanFeatureGuard, PlanLimitGuard } from './plan-feature.guard';
import { BillingModule } from '../billing/billing.module';

@Global()
@Module({
  imports: [PrismaModule, BillingModule],
  providers: [
    SubscriptionEntitlementService,
    PlanFeatureGuard,
    PlanLimitGuard,
  ],
  exports: [
    SubscriptionEntitlementService,
    PlanFeatureGuard,
    PlanLimitGuard,
    BillingModule,
  ],
})
export class SubscriptionEntitlementModule {}
