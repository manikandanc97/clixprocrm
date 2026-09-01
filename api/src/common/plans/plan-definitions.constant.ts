/**
 * ClixProCRM Centralized Plan Definitions & Feature Matrix (API Source of Truth)
 *
 * Exact 3-Tier Plan Structure:
 * 1. Free:       ₹0/user/month       (For individuals and small teams getting started)
 * 2. Growth ⭐:   ₹499/user/month     (For growing SMB teams - Most Popular)
 * 3. Business:   ₹999/user/month     (For established businesses)
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
  features: string[]; // Feature keys
  featureDescriptions: string[]; // Key highlights
  aiConfig: {
    enabled: boolean;
    level: 'Basic AI' | 'Standard AI' | 'Advanced AI' | 'Premium AI' | 'Full AI';
    dailyTokenLimit: number;
  };
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
    description: 'Basic CRM & Pipeline Management for individuals and small teams getting started',
    target: 'For individuals and small teams getting started',
    recommended: false,
    displayOrder: 1,
    isActive: true,
    limits: {
      maxUsers: 2,
      maxContacts: 500,
      maxLeads: 250,
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
      'contacts',
      'companies',
      'leads',
      'deals',
      'tasks',
      'basic_crm',
      'basic_pipeline',
      'basic_dashboard',
      'basic_timeline',
      'limited_email',
      'limited_automation',
      'basic_permissions',
      'import_export',
      'basic_notifications',
      'ai_basic',
    ],
    featureDescriptions: [
      'Basic CRM & Pipeline Management',
      'Basic Dashboard',
      'Basic Activity Timeline',
      'Limited Email Integration',
      'Limited Automation',
      'Basic permissions',
    ],
    aiConfig: {
      enabled: true,
      level: 'Basic AI',
      dailyTokenLimit: 10000,
    },
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    price: '₹499',
    priceNum: 499,
    annualPriceNum: 4990,
    currency: 'INR',
    billingInterval: 'user/month',
    pricingMode: 'FIXED',
    description: 'Advanced Automation, Workflows, Sales Pipeline Customization, and Email Tracking for growing SMB teams',
    target: 'For growing SMB teams',
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
      maxAutomations: 50,
      storageGb: 50,
      maxApiRequests: 50000,
      dailyTokenLimit: 75000,
    },
    features: [
      'contacts',
      'companies',
      'leads',
      'deals',
      'tasks',
      'basic_crm',
      'basic_pipeline',
      'basic_dashboard',
      'basic_timeline',
      'limited_email',
      'limited_automation',
      'basic_permissions',
      'import_export',
      'basic_notifications',
      'advanced_automation',
      'workflow_automation',
      'pipeline_customization',
      'email_integration',
      'email_tracking',
      'saved_views',
      'advanced_analytics',
      'advanced_reports',
      'team_permissions',
      'role_based_permissions',
      'additional_integrations',
      'priority_support',
      'custom_fields',
      'ai_copilot',
      'lead_scoring',
      'ai_advanced',
    ],
    featureDescriptions: [
      'Everything in Free',
      'Advanced Automation & Workflows',
      'Sales Pipeline Customization',
      'Email Integration & Tracking',
      'Saved Views',
      'Advanced Analytics & Reports',
      'Team Permissions',
      'Additional integrations',
      'Priority support',
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
    price: '₹999',
    priceNum: 999,
    annualPriceNum: 9990,
    currency: 'INR',
    billingInterval: 'user/month',
    pricingMode: 'FIXED',
    description: 'Advanced RBAC, Departments, Custom Modules, Audit Logs, and API Access for established businesses',
    target: 'For established businesses',
    recommended: false,
    displayOrder: 3,
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
      'contacts',
      'companies',
      'leads',
      'deals',
      'tasks',
      'basic_crm',
      'basic_pipeline',
      'basic_dashboard',
      'basic_timeline',
      'limited_email',
      'limited_automation',
      'basic_permissions',
      'import_export',
      'basic_notifications',
      'advanced_automation',
      'workflow_automation',
      'pipeline_customization',
      'email_integration',
      'email_tracking',
      'saved_views',
      'advanced_analytics',
      'advanced_reports',
      'team_permissions',
      'role_based_permissions',
      'additional_integrations',
      'priority_support',
      'custom_fields',
      'ai_copilot',
      'lead_scoring',
      'advanced_rbac',
      'departments',
      'multiple_departments',
      'custom_modules',
      'audit_logs',
      'advanced_audit_logs',
      'api_access',
      'webhooks',
      'ai_premium',
    ],
    featureDescriptions: [
      'Everything in Growth',
      'Advanced Automation',
      'Advanced Workflows',
      'Advanced RBAC',
      'Departments',
      'Custom Modules',
      'Advanced Analytics & Reports',
      'Audit Logs',
      'API Access',
      'Advanced Integrations',
      'Priority support',
    ],
    aiConfig: {
      enabled: true,
      level: 'Premium AI',
      dailyTokenLimit: 200000,
    },
  },
};

/**
 * Normalizes any legacy or alias plan string to standard canonical plan ID
 */
export function normalizePlanId(rawPlanId?: string | null): string {
  if (!rawPlanId) return 'free';
  const clean = rawPlanId.toLowerCase().trim();
  if (clean === 'free') return 'free';
  if (clean === 'starter' || clean === 'pro' || clean === 'growth' || clean === 'professional') return 'growth';
  if (clean === 'business' || clean === 'enterprise' || clean === 'custom') return 'business';
  if (CANONICAL_PLANS[clean]) return clean;
  return 'free';
}

/**
 * Returns canonical plan definition with fallback to Free
 */
export function getPlanDefinition(planId?: string | null): PlanDefinition {
  const normalized = normalizePlanId(planId);
  return CANONICAL_PLANS[normalized] || CANONICAL_PLANS.free;
}

