/**
 * ClixProCRM Centralized Plan Definitions & Feature Matrix (API Source of Truth)
 *
 * Final 5-Tier Plan Structure:
 * 1. Free:       ₹0/user/month       (Trial / very small teams)
 * 2. Starter:    ₹499/user/month     (Small businesses)
 * 3. Growth ⭐:   ₹999/user/month     (Growing SMBs - Most Popular / Recommended)
 * 4. Business:   ₹1,799/user/month   (Established companies)
 * 5. Enterprise: Custom              (Larger organizations)
 */

export interface PlanLimits {
  maxUsers: number;
  maxContacts: number;
  maxLeads: number;
  maxDeals: number;
  maxAutomations: number;
  storageGb: number;
  maxApiRequests: number; // per month
  dailyTokenLimit: number;
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
    description: 'Basic CRM tools, contacts, leads, and tasks for getting started',
    target: 'Trial / very small teams',
    recommended: false,
    displayOrder: 1,
    isActive: true,
    limits: {
      maxUsers: 3,
      maxContacts: 1000,
      maxLeads: 500,
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
      'basic_dashboard',
      'basic_timeline',
      'basic_search',
      'basic_reports',
      'import_export',
      'basic_notifications',
      'ai_basic',
    ],
    featureDescriptions: [
      'Basic CRM & pipeline management',
      'Up to 3 team members',
      '1,000 Contacts & 500 Leads',
      'Lead & task tracking',
      'Standard activity timeline',
      '1 GB Cloud Storage',
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
    target: 'Small businesses',
    recommended: false,
    displayOrder: 2,
    isActive: true,
    limits: {
      maxUsers: 10,
      maxContacts: 10000,
      maxLeads: 5000,
      maxDeals: 2500,
      maxAutomations: 10,
      storageGb: 10,
      maxApiRequests: 10000,
      dailyTokenLimit: 25000,
    },
    features: [
      'contacts',
      'companies',
      'leads',
      'deals',
      'tasks',
      'basic_dashboard',
      'basic_timeline',
      'basic_search',
      'basic_reports',
      'email_integration',
      'custom_fields',
      'basic_automation',
      'advanced_filters',
      'saved_views',
      'import_export',
      'basic_notifications',
      'ai_standard',
    ],
    featureDescriptions: [
      'Everything in Free',
      'Up to 10 team members',
      '10,000 Contacts & 5,000 Leads',
      'Email Integration & Tracking',
      'Custom Fields & Saved Views',
      'Basic Automation (10 workflows)',
      '10 GB Cloud Storage',
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
    target: 'Growing SMBs',
    recommended: true,
    badge: 'Most Popular',
    displayOrder: 3,
    isActive: true,
    limits: {
      maxUsers: 25,
      maxContacts: 50000,
      maxLeads: 25000,
      maxDeals: 10000,
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
      'basic_dashboard',
      'basic_timeline',
      'basic_search',
      'basic_reports',
      'email_integration',
      'custom_fields',
      'basic_automation',
      'advanced_filters',
      'saved_views',
      'import_export',
      'basic_notifications',
      'advanced_automation',
      'advanced_dashboards',
      'pipeline_customization',
      'workflow_automation',
      'email_sync',
      'calendar_integration',
      'advanced_reports',
      'team_management',
      'role_based_permissions',
      'custom_dashboards',
      'advanced_activity_tracking',
      'ai_copilot',
      'lead_scoring',
      'ai_advanced',
    ],
    featureDescriptions: [
      'Everything in Starter',
      'Up to 25 team members',
      '50,000 Contacts & 25,000 Leads',
      'Advanced Automation & Workflows',
      'Sales Pipeline Customization',
      'Team Permissions & RBAC',
      'AI Lead Scoring & Copilot',
      '50 GB Cloud Storage',
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
    price: '₹1,799',
    priceNum: 1799,
    annualPriceNum: 17990,
    currency: 'INR',
    billingInterval: 'user/month',
    pricingMode: 'FIXED',
    description: 'Everything in Growth plus advanced RBAC, custom modules, audit logs, and advanced workflows',
    target: 'Established companies',
    recommended: false,
    displayOrder: 4,
    isActive: true,
    limits: {
      maxUsers: 100,
      maxContacts: 250000,
      maxLeads: 100000,
      maxDeals: 50000,
      maxAutomations: 250,
      storageGb: 200,
      maxApiRequests: 250000,
      dailyTokenLimit: 200000,
    },
    features: [
      'contacts',
      'companies',
      'leads',
      'deals',
      'tasks',
      'basic_dashboard',
      'basic_timeline',
      'basic_search',
      'basic_reports',
      'email_integration',
      'custom_fields',
      'basic_automation',
      'advanced_filters',
      'saved_views',
      'import_export',
      'basic_notifications',
      'advanced_automation',
      'advanced_dashboards',
      'pipeline_customization',
      'workflow_automation',
      'email_sync',
      'calendar_integration',
      'advanced_reports',
      'team_management',
      'role_based_permissions',
      'custom_dashboards',
      'advanced_activity_tracking',
      'ai_copilot',
      'lead_scoring',
      'advanced_rbac',
      'multiple_departments',
      'approval_workflows',
      'advanced_analytics',
      'custom_modules',
      'territory_management',
      'advanced_audit_logs',
      'webhooks',
      'advanced_integrations',
      'advanced_security',
      'data_export_controls',
      'priority_support',
      'ai_premium',
    ],
    featureDescriptions: [
      'Everything in Growth',
      'Up to 100 team members',
      '250,000 Contacts & 100,000 Leads',
      'Advanced RBAC & Departments',
      'Custom Modules & Workflows',
      'Cryptographic Audit Logs',
      'Webhooks & REST API',
      '200 GB Storage & Priority Support',
    ],
    aiConfig: {
      enabled: true,
      level: 'Premium AI',
      dailyTokenLimit: 200000,
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceNum: 0,
    annualPriceNum: 0,
    currency: 'INR',
    billingInterval: 'custom',
    pricingMode: 'CUSTOM',
    description: 'Custom capacity, SSO/SAML, custom security, dedicated support, and enterprise governance',
    target: 'Larger organizations',
    recommended: false,
    displayOrder: 5,
    isActive: true,
    limits: {
      maxUsers: -1, // Unlimited
      maxContacts: -1,
      maxLeads: -1,
      maxDeals: -1,
      maxAutomations: -1,
      storageGb: -1,
      maxApiRequests: -1,
      dailyTokenLimit: -1,
    },
    features: [
      'contacts',
      'companies',
      'leads',
      'deals',
      'tasks',
      'basic_dashboard',
      'basic_timeline',
      'basic_search',
      'basic_reports',
      'email_integration',
      'custom_fields',
      'basic_automation',
      'advanced_filters',
      'saved_views',
      'import_export',
      'basic_notifications',
      'advanced_automation',
      'advanced_dashboards',
      'pipeline_customization',
      'workflow_automation',
      'email_sync',
      'calendar_integration',
      'advanced_reports',
      'team_management',
      'role_based_permissions',
      'custom_dashboards',
      'advanced_activity_tracking',
      'ai_copilot',
      'lead_scoring',
      'advanced_rbac',
      'multiple_departments',
      'approval_workflows',
      'advanced_analytics',
      'custom_modules',
      'territory_management',
      'advanced_audit_logs',
      'webhooks',
      'advanced_integrations',
      'advanced_security',
      'data_export_controls',
      'priority_support',
      'sso_saml',
      'custom_retention',
      'sandbox_environment',
      'dedicated_onboarding',
      'dedicated_account_manager',
      'custom_integrations',
      'ai_full',
    ],
    featureDescriptions: [
      'Unlimited / Custom Seats & Records',
      'Enterprise SAML 2.0 & SSO',
      'Advanced Security & Governance',
      'Custom Integrations & Retention',
      'Dedicated Account Manager & TAM',
      '24/7 SLA & Dedicated Onboarding',
    ],
    aiConfig: {
      enabled: true,
      level: 'Full AI',
      dailyTokenLimit: 1000000,
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
  if (clean === 'pro' || clean === 'professional') return 'growth';
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

