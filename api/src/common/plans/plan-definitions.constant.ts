/**
 * ClixProCRM Centralized Plan Definitions & Feature Matrix (API Fallback & Types)
 *
 * Canonical Database Source of Truth: prisma.plan
 * The values below serve strictly as robust fallbacks if the database is unreachable.
 */

export interface PlanLimits {
  maxUsers: number;
  maxContacts: number;
  maxLeads: number;
  maxPipelines: number;
  maxTasks: number;
  maxCustomFields: number;
  maxDeals?: number;
  maxAutomations?: number;
  storageGb?: number;
  maxApiRequests?: number; // per month
  dailyTokenLimit?: number;
}

export interface PlanDefinition {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  annualPriceNum: number;
  currency: string;
  billingInterval: string;
  pricingMode: 'FIXED' | 'CUSTOM';
  description: string;
  target: string;
  recommended: boolean;
  badge?: string;
  displayOrder: number;
  isActive: boolean;
  limits: PlanLimits;
  features: string[]; // Feature descriptions & included entitlements
  featureDescriptions: string[]; // Key highlights
  aiConfig: {
    enabled: boolean;
    level: 'Basic AI' | 'Standard AI' | 'Advanced AI' | 'Premium AI' | 'Full AI';
    dailyTokenLimit: number;
  };
}

export interface MatrixFeatureItem {
  key: string;
  name: string;
  description: string;
  values: Record<string, string | boolean>; // planId -> value
}

export interface MatrixCategory {
  category: string;
  features: MatrixFeatureItem[];
}

export const CANONICAL_PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    price: '₹0',
    priceNum: 0,
    annualPriceNum: 0,
    currency: 'INR',
    billingInterval: 'user/month',
    pricingMode: 'FIXED',
    description: 'Basic CRM tools, contacts, leads, and tasks for getting started',
    target: 'For individuals & early evaluation',
    recommended: false,
    displayOrder: 1,
    isActive: true,
    limits: {
      maxUsers: 3,
      maxContacts: 1000,
      maxLeads: 500,
      maxPipelines: 1,
      maxTasks: 500,
      maxCustomFields: 5,
      maxDeals: 250,
      maxAutomations: 1,
      storageGb: 1,
      maxApiRequests: 5000,
      dailyTokenLimit: 10000,
    },
    features: [
      'Basic CRM & pipeline management',
      'Lead & task tracking',
      'Standard activity timeline',
      'Email notifications',
    ],
    featureDescriptions: [
      'Basic CRM & pipeline management',
      'Lead & task tracking',
      'Standard activity timeline',
      'Email notifications',
    ],
    aiConfig: {
      enabled: true,
      level: 'Basic AI',
      dailyTokenLimit: 10000,
    },
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    price: '₹499',
    priceNum: 499,
    annualPriceNum: 4990,
    currency: 'INR',
    billingInterval: 'user/month',
    pricingMode: 'FIXED',
    description: 'Everything in Free plus custom fields, email integration, and basic automation for small teams',
    target: 'Best for scaling SMBs & active teams',
    recommended: true,
    badge: 'MOST POPULAR',
    displayOrder: 2,
    isActive: true,
    limits: {
      maxUsers: 10,
      maxContacts: 10000,
      maxLeads: 5000,
      maxPipelines: -1,
      maxTasks: -1,
      maxCustomFields: -1,
      maxDeals: -1,
      maxAutomations: 10,
      storageGb: 10,
      maxApiRequests: 25000,
      dailyTokenLimit: 25000,
    },
    features: [
      'Everything in Free',
      'Email Integration & Tracking',
      'Custom Fields & Saved Views',
      'Basic Automation (10 workflows)',
      'Team Collaboration & Shared Views',
    ],
    featureDescriptions: [
      'Everything in Free',
      'Email Integration & Tracking',
      'Custom Fields & Saved Views',
      'Basic Automation (10 workflows)',
      'Team Collaboration & Shared Views',
    ],
    aiConfig: {
      enabled: true,
      level: 'Standard AI',
      dailyTokenLimit: 25000,
    },
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    price: '₹999',
    priceNum: 999,
    annualPriceNum: 9990,
    currency: 'INR',
    billingInterval: 'user/month',
    pricingMode: 'FIXED',
    description: 'Everything in Starter plus advanced automations, custom analytics, team permissions, and AI copilot',
    target: 'Best for scaling SMBs & active teams',
    recommended: false,
    displayOrder: 3,
    isActive: true,
    limits: {
      maxUsers: 25,
      maxContacts: 50000,
      maxLeads: 25000,
      maxPipelines: -1,
      maxTasks: -1,
      maxCustomFields: -1,
      maxDeals: -1,
      maxAutomations: 50,
      storageGb: 50,
      maxApiRequests: 75000,
      dailyTokenLimit: 75000,
    },
    features: [
      'Everything in Starter',
      'Advanced Automation & Workflows',
      'Sales Pipeline Customization',
      'Team Permissions & RBAC',
      'AI Lead Scoring & Copilot',
      'Custom Reporting & Dashboards',
    ],
    featureDescriptions: [
      'Everything in Starter',
      'Advanced Automation & Workflows',
      'Sales Pipeline Customization',
      'Team Permissions & RBAC',
      'AI Lead Scoring & Copilot',
      'Custom Reporting & Dashboards',
    ],
    aiConfig: {
      enabled: true,
      level: 'Advanced AI',
      dailyTokenLimit: 75000,
    },
  },

  business: {
    id: 'business',
    name: 'Business',
    price: '₹1,999',
    priceNum: 1999,
    annualPriceNum: 19990,
    currency: 'INR',
    billingInterval: 'user/month',
    pricingMode: 'FIXED',
    description: 'Advanced RBAC, Departments, Custom Modules, Audit Logs, and API Access for established businesses',
    target: 'For established businesses',
    recommended: false,
    displayOrder: 4,
    isActive: true,
    limits: {
      maxUsers: -1,
      maxContacts: -1,
      maxLeads: -1,
      maxPipelines: -1,
      maxTasks: -1,
      maxCustomFields: -1,
      maxDeals: -1,
      maxAutomations: -1,
      storageGb: 200,
      maxApiRequests: -1,
      dailyTokenLimit: 200000,
    },
    features: [
      'Everything in Growth',
      'Advanced RBAC & Departments',
      'Custom Modules & Entity Builder',
      'Audit Logs & Full API Access',
      'Priority Support & SLA',
      'Webhooks & Custom Integrations',
    ],
    featureDescriptions: [
      'Everything in Growth',
      'Advanced RBAC & Departments',
      'Custom Modules & Entity Builder',
      'Audit Logs & Full API Access',
      'Priority Support & SLA',
      'Webhooks & Custom Integrations',
    ],
    aiConfig: {
      enabled: true,
      level: 'Premium AI',
      dailyTokenLimit: 200000,
    },
  },
};

/**
 * Normalizes any legacy or alias plan string to standard stable plan ID
 */
export function normalizePlanId(rawPlanId?: string | null): string {
  if (!rawPlanId) return 'free';
  const clean = rawPlanId.toLowerCase().trim();
  if (clean === 'free') return 'free';
  if (clean === 'starter') return 'starter';
  if (clean === 'growth') return 'growth';
  if (clean === 'business') return 'business';
  if (clean === 'enterprise') return 'enterprise';
  if (clean === 'pro' || clean === 'professional') return 'growth';
  if (CANONICAL_PLANS[clean]) return clean;
  return clean;
}

/**
 * Returns canonical plan definition with fallback to Free
 */
export function getPlanDefinition(planId?: string | null): PlanDefinition {
  const normalized = normalizePlanId(planId);
  return CANONICAL_PLANS[normalized] || CANONICAL_PLANS.free;
}


