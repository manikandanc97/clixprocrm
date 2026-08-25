import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PLAN_FEATURE_KEY = 'require_plan_feature';
export const RequirePlanFeature = (feature: string) =>
  SetMetadata(REQUIRE_PLAN_FEATURE_KEY, feature);

export const REQUIRE_PLAN_LIMIT_KEY = 'require_plan_limit';
export const RequirePlanLimit = (
  limitKey: 'maxUsers' | 'maxContacts' | 'maxLeads' | 'maxDeals' | 'maxAutomations',
) => SetMetadata(REQUIRE_PLAN_LIMIT_KEY, limitKey);
