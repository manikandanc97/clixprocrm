import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PLAN_FEATURE_KEY,
  REQUIRE_PLAN_LIMIT_KEY,
} from './plan-feature.decorator';
import { SubscriptionEntitlementService } from './subscription-entitlement.service';

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: SubscriptionEntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRE_PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    // Super Admin bypasses tenant-level feature gating
    if (request.isSuperAdmin || !tenantId) {
      return true;
    }

    await this.entitlementService.assertFeature(tenantId, requiredFeature);
    return true;
  }
}

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: SubscriptionEntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitKey = this.reflector.getAllAndOverride<any>(
      REQUIRE_PLAN_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!limitKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (request.isSuperAdmin || !tenantId) {
      return true;
    }

    await this.entitlementService.assertWithinLimit(tenantId, limitKey, 1);
    return true;
  }
}
