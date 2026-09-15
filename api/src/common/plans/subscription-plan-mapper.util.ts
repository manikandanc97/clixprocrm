import {
  PlanDefinition,
  MatrixCategory,
  MatrixFeatureItem,
} from './plan-definitions.constant';
import { WorkspaceUsageStats } from './subscription-entitlement.interface';

/**
 * Maps a Prisma database plan record to the canonical PlanDefinition shape.
 * Pure data transformation — no database calls.
 */
export function mapDbPlanToDefinition(dbPlan: any): PlanDefinition {
  const parseLimit = (val?: number) =>
    val === undefined || val >= 1000000 ? -1 : val;

  const currSymbol =
    dbPlan.currency === 'USD'
      ? '$'
      : dbPlan.currency === 'EUR'
        ? '€'
        : dbPlan.currency === 'GBP'
          ? '£'
          : '₹';

  const priceNum = Number(dbPlan.priceNum || 0);
  const annualPriceNum = Number(
    dbPlan.annualPriceNum || (priceNum ? priceNum * 10 : 0),
  );
  const priceDisplay =
    dbPlan.pricingMode === 'CUSTOM'
      ? 'Custom'
      : `${currSymbol}${priceNum.toLocaleString()}`;
  const rawFeatures = Array.isArray(dbPlan.features)
    ? (dbPlan.features as string[])
    : [];

  return {
    id: dbPlan.id,
    name: dbPlan.name,
    price: dbPlan.price || priceDisplay,
    priceNum,
    annualPriceNum,
    currency: dbPlan.currency || 'INR',
    billingInterval: 'user/month',
    pricingMode:
      (dbPlan.pricingMode as 'FIXED' | 'CUSTOM') ||
      (priceNum === 0 && dbPlan.id !== 'free' ? 'CUSTOM' : 'FIXED'),
    target: dbPlan.description || '',
    description: dbPlan.description || '',
    recommended: Boolean(dbPlan.highlight),
    badge: dbPlan.highlight ? 'MOST POPULAR' : undefined,
    displayOrder: dbPlan.sortOrder || 0,
    isActive:
      dbPlan.isActive !== false &&
      dbPlan.status !== 'INACTIVE' &&
      dbPlan.status !== 'ARCHIVED',
    limits: {
      maxUsers: parseLimit(dbPlan.maxUsers),
      maxContacts: parseLimit(dbPlan.maxContacts),
      maxLeads: parseLimit(dbPlan.maxLeads),
      maxPipelines: parseLimit(
        dbPlan.maxPipelines ?? (dbPlan.id === 'free' ? 1 : -1),
      ),
      maxTasks: parseLimit(
        dbPlan.maxTasks ?? (dbPlan.id === 'free' ? 500 : -1),
      ),
      maxCustomFields: parseLimit(
        dbPlan.maxCustomFields ?? (dbPlan.id === 'free' ? 5 : -1),
      ),
      maxDeals: parseLimit(
        dbPlan.maxDeals ?? (dbPlan.maxLeads ? dbPlan.maxLeads : -1),
      ),
      maxAutomations: parseLimit(
        dbPlan.maxAutomations ??
          (dbPlan.id === 'free'
            ? 1
            : dbPlan.id === 'starter'
              ? 10
              : dbPlan.id === 'growth'
                ? 50
                : -1),
      ),
      storageGb:
        dbPlan.storageGb ||
        (dbPlan.id === 'free'
          ? 1
          : dbPlan.id === 'starter'
            ? 10
            : dbPlan.id === 'growth'
              ? 50
              : 200),
      maxApiRequests: parseLimit(dbPlan.maxApiRequests),
      dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
    },
    features: rawFeatures,
    featureDescriptions: rawFeatures,
    aiConfig: {
      enabled: dbPlan.aiEnabled !== false,
      level: (dbPlan.aiLevel as any) || 'Standard AI',
      dailyTokenLimit: Number(dbPlan.dailyTokenLimit || 50000),
    },
  };
}

/**
 * Calculates a single usage/limit stat for a workspace resource counter.
 * Returns unlimited-style data for platform tenants and for -1 limits.
 */
export function calculateUsageLimit(
  current: number,
  maxLimit: number,
  isPlatformTenant: boolean,
) {
  if (
    isPlatformTenant ||
    maxLimit === -1 ||
    maxLimit === null ||
    maxLimit === undefined
  ) {
    return {
      current,
      limit: -1,
      remaining: 999999,
      percentage: 0,
      isLimitReached: false,
    };
  }
  const remaining = Math.max(0, maxLimit - current);
  const percentage = Math.min(100, Math.round((current / maxLimit) * 100));
  return {
    current,
    limit: maxLimit,
    remaining,
    percentage,
    isLimitReached: current >= maxLimit,
  };
}

/**
 * Assembles the full WorkspaceUsageStats object from raw counters and plan limits.
 */
export function assembleWorkspaceUsage(
  counts: {
    userCount: number;
    contactCount: number;
    leadCount: number;
    taskCount: number;
    dealCount: number;
    storageGbUsed: number;
  },
  planLimits: PlanDefinition['limits'],
  isPlatformTenant: boolean,
): WorkspaceUsageStats {
  const calc = (current: number, max: number) =>
    calculateUsageLimit(current, max, isPlatformTenant);

  return {
    users: calc(counts.userCount, planLimits.maxUsers),
    contacts: calc(counts.contactCount, planLimits.maxContacts),
    leads: calc(counts.leadCount, planLimits.maxLeads),
    tasks: calc(counts.taskCount, planLimits.maxTasks),
    pipelines: calc(1, planLimits.maxPipelines),
    customFields: calc(0, planLimits.maxCustomFields),
    deals: calc(counts.dealCount, planLimits.maxDeals ?? -1),
    automations: calc(0, planLimits.maxAutomations ?? -1),
    storageGb: calc(counts.storageGbUsed, planLimits.storageGb ?? -1),
    apiRequests: calc(0, planLimits.maxApiRequests ?? -1),
  };
}
