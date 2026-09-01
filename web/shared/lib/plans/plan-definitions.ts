/**
 * ClixProCRM Centralized Plan Definitions & Feature Matrix (Frontend Source of Truth)
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
  pricingMode: "FIXED" | "CUSTOM";
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
    level: "Basic AI" | "Standard AI" | "Advanced AI" | "Premium AI" | "Full AI";
    dailyTokenLimit: number;
  };
}

export const CANONICAL_PLANS: Record<string, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    price: "₹0",
    priceNum: 0,
    annualPriceNum: 0,
    currency: "INR",
    billingInterval: "user/month",
    pricingMode: "FIXED",
    description: "Basic CRM & Pipeline Management for individuals and small teams getting started.",
    target: "For individuals and small teams getting started",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_crm",
      "basic_pipeline",
      "basic_dashboard",
      "basic_timeline",
      "limited_email",
      "limited_automation",
      "basic_permissions",
      "import_export",
      "basic_notifications",
      "ai_basic",
    ],
    featureDescriptions: [
      "Basic CRM & Pipeline Management",
      "Basic Dashboard",
      "Basic Activity Timeline",
      "Limited Email Integration",
      "Limited Automation",
      "Basic permissions",
    ],
    aiConfig: {
      enabled: true,
      level: "Basic AI",
      dailyTokenLimit: 10000,
    },
  },

  growth: {
    id: "growth",
    name: "Growth",
    price: "₹499",
    priceNum: 499,
    annualPriceNum: 4990,
    currency: "INR",
    billingInterval: "user/month",
    pricingMode: "FIXED",
    description: "Advanced Automation, Workflows, Sales Pipeline Customization, and Email Tracking for growing SMB teams.",
    target: "For growing SMB teams",
    recommended: true,
    badge: "MOST POPULAR",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_crm",
      "basic_pipeline",
      "basic_dashboard",
      "basic_timeline",
      "limited_email",
      "limited_automation",
      "basic_permissions",
      "import_export",
      "basic_notifications",
      "advanced_automation",
      "workflow_automation",
      "pipeline_customization",
      "email_integration",
      "email_tracking",
      "saved_views",
      "advanced_analytics",
      "advanced_reports",
      "team_permissions",
      "role_based_permissions",
      "additional_integrations",
      "priority_support",
      "custom_fields",
      "ai_copilot",
      "lead_scoring",
      "ai_advanced",
    ],
    featureDescriptions: [
      "Everything in Free",
      "Advanced Automation & Workflows",
      "Sales Pipeline Customization",
      "Email Integration & Tracking",
      "Saved Views",
      "Advanced Analytics & Reports",
      "Team Permissions",
      "Additional integrations",
      "Priority support",
    ],
    aiConfig: {
      enabled: true,
      level: "Advanced AI",
      dailyTokenLimit: 75000,
    },
  },

  business: {
    id: "business",
    name: "Business",
    price: "₹999",
    priceNum: 999,
    annualPriceNum: 9990,
    currency: "INR",
    billingInterval: "user/month",
    pricingMode: "FIXED",
    description: "Advanced RBAC, Departments, Custom Modules, Audit Logs, and API Access for established businesses.",
    target: "For established businesses",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_crm",
      "basic_pipeline",
      "basic_dashboard",
      "basic_timeline",
      "limited_email",
      "limited_automation",
      "basic_permissions",
      "import_export",
      "basic_notifications",
      "advanced_automation",
      "workflow_automation",
      "pipeline_customization",
      "email_integration",
      "email_tracking",
      "saved_views",
      "advanced_analytics",
      "advanced_reports",
      "team_permissions",
      "role_based_permissions",
      "additional_integrations",
      "priority_support",
      "custom_fields",
      "ai_copilot",
      "lead_scoring",
      "advanced_rbac",
      "departments",
      "multiple_departments",
      "custom_modules",
      "audit_logs",
      "advanced_audit_logs",
      "api_access",
      "webhooks",
      "ai_premium",
    ],
    featureDescriptions: [
      "Everything in Growth",
      "Advanced Automation",
      "Advanced Workflows",
      "Advanced RBAC",
      "Departments",
      "Custom Modules",
      "Advanced Analytics & Reports",
      "Audit Logs",
      "API Access",
      "Advanced Integrations",
      "Priority support",
    ],
    aiConfig: {
      enabled: true,
      level: "Premium AI",
      dailyTokenLimit: 200000,
    },
  },
};

/**
 * Comprehensive Feature Comparison Categories for the Pricing Matrix (3 Tiers)
 */
export interface MatrixFeatureItem {
  key: string;
  name: string;
  description: string;
  free: string | boolean;
  growth: string | boolean;
  business: string | boolean;
}

export interface MatrixCategory {
  category: string;
  features: MatrixFeatureItem[];
}

export const COMPARISON_MATRIX: MatrixCategory[] = [
  {
    category: "CRM & Capacity",
    features: [
      {
        key: "contacts_leads",
        name: "Contacts & Leads Capacity",
        description: "Max records stored in workspace",
        free: "500 / 250",
        growth: "10,000 / 5,000",
        business: "Unlimited",
      },
      {
        key: "tasks_capacity",
        name: "Tasks Capacity",
        description: "Active assigned tasks and checklists",
        free: "500",
        growth: "Unlimited",
        business: "Unlimited",
      },
      {
        key: "deal_pipelines",
        name: "Deals & Pipelines",
        description: "Opportunity tracking and stages",
        free: "1 Pipeline",
        growth: "Unlimited",
        business: "Unlimited",
      },
      {
        key: "custom_fields",
        name: "Custom Fields",
        description: "Tailor schemas to your business",
        free: "Up to 5",
        growth: "Unlimited",
        business: "Unlimited",
      },
    ],
  },
  {
    category: "Automation & Workflows",
    features: [
      {
        key: "workflow_rules",
        name: "Automation & Workflows",
        description: "Trigger stage shifts and automated tasks",
        free: "Limited Automation",
        growth: "Advanced Automation & Workflows",
        business: "Advanced Workflows & Governance",
      },
      {
        key: "pipeline_customization",
        name: "Sales Pipeline Customization",
        description: "Custom stages, probabilities, and funnels",
        free: false,
        growth: true,
        business: true,
      },
    ],
  },
  {
    category: "Communication & Email",
    features: [
      {
        key: "email_integration",
        name: "Email Integration & Tracking",
        description: "Direct email sync, tracking and activity logging",
        free: "Limited Email",
        growth: "Full Email Sync & Tracking",
        business: "Full Email Sync & Tracking",
      },
      {
        key: "saved_views",
        name: "Saved Views & Filters",
        description: "Custom filters and quick list views",
        free: false,
        growth: true,
        business: true,
      },
    ],
  },
  {
    category: "Analytics & Reporting",
    features: [
      {
        key: "reports_dashboards",
        name: "Analytics & Reports",
        description: "Dashboard widgets, revenue funnels and BI exports",
        free: "Basic Dashboard",
        growth: "Advanced Analytics & Reports",
        business: "Advanced Analytics & Reports",
      },
      {
        key: "activity_timeline",
        name: "Activity Timeline",
        description: "Full history of interactions and touches",
        free: "Basic Timeline",
        growth: "Advanced Activity Timeline",
        business: "Advanced Activity Timeline",
      },
    ],
  },
  {
    category: "Team & Permissions",
    features: [
      {
        key: "user_capacity",
        name: "Team Member Seats",
        description: "Active user accounts in workspace",
        free: "2 Users",
        growth: "10 Users",
        business: "Unlimited",
      },
      {
        key: "rbac_roles",
        name: "Permissions & Access Control",
        description: "Granular roles, team scopes, and department isolation",
        free: "Basic permissions",
        growth: "Team Permissions",
        business: "Advanced RBAC & Departments",
      },
      {
        key: "custom_modules",
        name: "Custom Modules",
        description: "Build custom database entities and views",
        free: false,
        growth: false,
        business: true,
      },
    ],
  },
  {
    category: "Governance, API & Security",
    features: [
      {
        key: "audit_logs",
        name: "Audit Logs",
        description: "Tamper-evident activity and security logs",
        free: false,
        growth: false,
        business: true,
      },
      {
        key: "rest_api",
        name: "API Access & Webhooks",
        description: "Programmatic REST API access and webhook events",
        free: false,
        growth: false,
        business: true,
      },
      {
        key: "cloud_storage",
        name: "Cloud Storage",
        description: "Secure document and attachment storage",
        free: "1 GB",
        growth: "50 GB",
        business: "200 GB",
      },
      {
        key: "support_level",
        name: "Support Channel",
        description: "Support channel and response priority",
        free: "Community Support",
        growth: "Priority Support",
        business: "Priority Support",
      },
    ],
  },
];

/**
 * Normalizes any legacy or alias plan string to standard canonical plan ID
 */
export function normalizePlanId(rawPlanId?: string | null): string {
  if (!rawPlanId) return "free";
  const clean = rawPlanId.toLowerCase().trim();
  if (clean === "free") return "free";
  if (clean === "starter" || clean === "pro" || clean === "growth" || clean === "professional") return "growth";
  if (clean === "business" || clean === "enterprise" || clean === "custom") return "business";
  if (CANONICAL_PLANS[clean]) return clean;
  return "free";
}

/**
 * Returns canonical plan definition with fallback to Free
 */
export function getPlanDefinition(planId?: string | null): PlanDefinition {
  const normalized = normalizePlanId(planId);
  return CANONICAL_PLANS[normalized] || CANONICAL_PLANS.free;
}

/**
 * Checks if a plan definition unlocks a specific feature
 */
export function hasPlanFeature(planId: string | null | undefined, featureKey: string): boolean {
  const plan = getPlanDefinition(planId);
  if (!plan || !plan.features) return false;
  return plan.features.includes(featureKey);
}

/**
 * Formats pricing string for display (e.g. ₹499/user/month or ₹999/user/month)
 */
export function formatPlanDisplayPrice(
  plan: PlanDefinition,
  billingCycle: "monthly" | "annual" = "monthly"
): { priceText: string; periodText: string; savingsText?: string } {
  if (plan.pricingMode === "CUSTOM" || plan.priceNum === 0) {
    if (plan.pricingMode === "CUSTOM") {
      return { priceText: "Custom", periodText: "tailored for your organization" };
    }
    return { priceText: "₹0", periodText: "/user/month" };
  }

  if (billingCycle === "annual") {
    const annualMonthlyEquivalent = Math.round(plan.annualPriceNum / 12);
    return {
      priceText: `₹${annualMonthlyEquivalent.toLocaleString("en-IN")}`,
      periodText: "/user/month, billed annually",
      savingsText: "Save ~17% with annual billing",
    };
  }

  return {
    priceText: `₹${plan.priceNum.toLocaleString("en-IN")}`,
    periodText: "/user/month, billed monthly",
  };
}


