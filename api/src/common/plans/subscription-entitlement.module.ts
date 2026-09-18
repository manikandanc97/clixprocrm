import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { PlanFeatureGuard, PlanLimitGuard } from './plan-feature.guard';
import { SubscriptionEntitlementService } from './subscription-entitlement.service';

@Global()
@Module({
  imports: [PrismaModule, BillingModule],
  providers: [SubscriptionEntitlementService, PlanFeatureGuard, PlanLimitGuard],
  exports: [
    SubscriptionEntitlementService,
    PlanFeatureGuard,
    PlanLimitGuard,
    BillingModule,
  ],
})
export class SubscriptionEntitlementModule {}
