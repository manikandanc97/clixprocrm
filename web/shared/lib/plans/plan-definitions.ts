/**
 * ClixProCRM Centralized Plan Definitions & Feature Matrix (Frontend Source of Truth)
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
    description: "Basic CRM tools, contacts, leads, and tasks for getting started.",
    target: "Trial / very small teams",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_dashboard",
      "basic_timeline",
      "basic_search",
      "basic_reports",
      "import_export",
      "basic_notifications",
      "ai_basic",
    ],
    featureDescriptions: [
      "Basic CRM & pipeline management",
      "Up to 3 team members",
      "1,000 Contacts & 500 Leads",
      "Lead & task tracking",
      "Standard activity timeline",
      "1 GB Cloud Storage",
    ],
    aiConfig: {
      enabled: true,
      level: "Basic AI",
      dailyTokenLimit: 10000,
    },
  },

  starter: {
    id: "starter",
    name: "Starter",
    price: "₹499",
    priceNum: 499,
    annualPriceNum: 4990,
    currency: "INR",
    billingInterval: "user/month",
    pricingMode: "FIXED",
    description: "Everything in Free plus custom fields, email integration, and basic automation for small teams.",
    target: "Small businesses",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_dashboard",
      "basic_timeline",
      "basic_search",
      "basic_reports",
      "email_integration",
      "custom_fields",
      "basic_automation",
      "advanced_filters",
      "saved_views",
      "import_export",
      "basic_notifications",
      "ai_standard",
    ],
    featureDescriptions: [
      "Everything in Free",
      "Up to 10 team members",
      "10,000 Contacts & 5,000 Leads",
      "Email Integration & Tracking",
      "Custom Fields & Saved Views",
      "Basic Automation (10 workflows)",
      "10 GB Cloud Storage",
    ],
    aiConfig: {
      enabled: true,
      level: "Standard AI",
      dailyTokenLimit: 25000,
    },
  },

  growth: {
    id: "growth",
    name: "Growth",
    price: "₹999",
    priceNum: 999,
    annualPriceNum: 9990,
    currency: "INR",
    billingInterval: "user/month",
    pricingMode: "FIXED",
    description: "Everything in Starter plus advanced automations, custom analytics, team permissions, and AI copilot.",
    target: "Growing SMBs",
    recommended: true,
    badge: "Most Popular",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_dashboard",
      "basic_timeline",
      "basic_search",
      "basic_reports",
      "email_integration",
      "custom_fields",
      "basic_automation",
      "advanced_filters",
      "saved_views",
      "import_export",
      "basic_notifications",
      "advanced_automation",
      "advanced_dashboards",
      "pipeline_customization",
      "workflow_automation",
      "email_sync",
      "calendar_integration",
      "advanced_reports",
      "team_management",
      "role_based_permissions",
      "custom_dashboards",
      "advanced_activity_tracking",
      "ai_copilot",
      "lead_scoring",
      "ai_advanced",
    ],
    featureDescriptions: [
      "Everything in Starter",
      "Up to 25 team members",
      "50,000 Contacts & 25,000 Leads",
      "Advanced Automation & Workflows",
      "Sales Pipeline Customization",
      "Team Permissions & RBAC",
      "AI Lead Scoring & Copilot",
      "50 GB Cloud Storage",
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
    price: "₹1,799",
    priceNum: 1799,
    annualPriceNum: 17990,
    currency: "INR",
    billingInterval: "user/month",
    pricingMode: "FIXED",
    description: "Everything in Growth plus advanced RBAC, custom modules, audit logs, and advanced workflows.",
    target: "Established companies",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_dashboard",
      "basic_timeline",
      "basic_search",
      "basic_reports",
      "email_integration",
      "custom_fields",
      "basic_automation",
      "advanced_filters",
      "saved_views",
      "import_export",
      "basic_notifications",
      "advanced_automation",
      "advanced_dashboards",
      "pipeline_customization",
      "workflow_automation",
      "email_sync",
      "calendar_integration",
      "advanced_reports",
      "team_management",
      "role_based_permissions",
      "custom_dashboards",
      "advanced_activity_tracking",
      "ai_copilot",
      "lead_scoring",
      "advanced_rbac",
      "multiple_departments",
      "approval_workflows",
      "advanced_analytics",
      "custom_modules",
      "territory_management",
      "advanced_audit_logs",
      "webhooks",
      "advanced_integrations",
      "advanced_security",
      "data_export_controls",
      "priority_support",
      "ai_premium",
    ],
    featureDescriptions: [
      "Everything in Growth",
      "Up to 100 team members",
      "250,000 Contacts & 100,000 Leads",
      "Advanced RBAC & Departments",
      "Custom Modules & Workflows",
      "Cryptographic Audit Logs",
      "Webhooks & REST API",
      "200 GB Storage & Priority Support",
    ],
    aiConfig: {
      enabled: true,
      level: "Premium AI",
      dailyTokenLimit: 200000,
    },
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceNum: 0,
    annualPriceNum: 0,
    currency: "INR",
    billingInterval: "custom",
    pricingMode: "CUSTOM",
    description: "Custom capacity, SSO/SAML, custom security, dedicated support, and enterprise governance.",
    target: "Larger organizations",
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
      "contacts",
      "companies",
      "leads",
      "deals",
      "tasks",
      "basic_dashboard",
      "basic_timeline",
      "basic_search",
      "basic_reports",
      "email_integration",
      "custom_fields",
      "basic_automation",
      "advanced_filters",
      "saved_views",
      "import_export",
      "basic_notifications",
      "advanced_automation",
      "advanced_dashboards",
      "pipeline_customization",
      "workflow_automation",
      "email_sync",
      "calendar_integration",
      "advanced_reports",
      "team_management",
      "role_based_permissions",
      "custom_dashboards",
      "advanced_activity_tracking",
      "ai_copilot",
      "lead_scoring",
      "advanced_rbac",
      "multiple_departments",
      "approval_workflows",
      "advanced_analytics",
      "custom_modules",
      "territory_management",
      "advanced_audit_logs",
      "webhooks",
      "advanced_integrations",
      "advanced_security",
      "data_export_controls",
      "priority_support",
      "sso_saml",
      "custom_retention",
      "sandbox_environment",
      "dedicated_onboarding",
      "dedicated_account_manager",
      "custom_integrations",
      "ai_full",
    ],
    featureDescriptions: [
      "Unlimited / Custom Seats & Records",
      "Enterprise SAML 2.0 & SSO",
      "Advanced Security & Governance",
      "Custom Integrations & Retention",
      "Dedicated Account Manager & TAM",
      "24/7 SLA & Dedicated Onboarding",
    ],
    aiConfig: {
      enabled: true,
      level: "Full AI",
      dailyTokenLimit: 1000000,
    },
  },
};

/**
 * 12 Comprehensive Feature Comparison Categories for the Pricing Matrix
 */
export interface MatrixFeatureItem {
  key: string;
  name: string;
  description: string;
  free: string | boolean;
  starter: string | boolean;
  growth: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
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
        free: "1,000 / 500",
        starter: "10,000 / 5,000",
        growth: "50,000 / 25,000",
        business: "250,000 / 100,000",
        enterprise: "Unlimited / Custom",
      },
      {
        key: "deal_pipelines",
        name: "Deals & Pipelines",
        description: "Opportunity tracking and stages",
        free: "1 Pipeline (250 deals)",
        starter: "3 Pipelines (2,500 deals)",
        growth: "Multiple Pipelines (10,000 deals)",
        business: "Unlimited Pipelines (50,000 deals)",
        enterprise: "Unlimited / Custom",
      },
      {
        key: "custom_fields",
        name: "Custom Fields & Tags",
        description: "Tailor schemas to your business",
        free: false,
        starter: "Up to 20 fields",
        growth: "Up to 100 fields",
        business: "Unlimited",
        enterprise: "Unlimited + Validation",
      },
    ],
  },
  {
    category: "Automation",
    features: [
      {
        key: "workflow_rules",
        name: "Active Workflows",
        description: "Trigger stage shifts and automated tasks",
        free: "1 workflow",
        starter: "10 workflows",
        growth: "50 workflows",
        business: "250 workflows",
        enterprise: "Unlimited",
      },
      {
        key: "approval_hierarchy",
        name: "Approval Workflows",
        description: "Managerial sign-off on quotes & discounts",
        free: false,
        starter: false,
        growth: "Basic Approvals",
        business: "Multi-Tier Approvals",
        enterprise: "Custom Governance",
      },
    ],
  },
  {
    category: "Communication",
    features: [
      {
        key: "email_integration",
        name: "Email Integration & Tracking",
        description: "Direct email sync and activity logging",
        free: false,
        starter: true,
        growth: true,
        business: true,
        enterprise: true,
      },
      {
        key: "calendar_sync",
        name: "Calendar & Meeting Sync",
        description: "Two-way Google & Outlook sync",
        free: false,
        starter: false,
        growth: true,
        business: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "Analytics",
    features: [
      {
        key: "reports_dashboards",
        name: "Reports & Custom Dashboards",
        description: "Revenue metrics, funnels, and KPI widgets",
        free: "Standard Reports",
        starter: "Standard Reports + Export",
        growth: "Custom Dashboards & Funnels",
        business: "Advanced BI Analytics",
        enterprise: "Custom BI & Data Export",
      },
    ],
  },
  {
    category: "AI & Intelligence",
    features: [
      {
        key: "ai_copilot",
        name: "AI Copilot & Lead Scoring",
        description: "Predictive lead scoring, auto summary & copilot",
        free: "Basic AI",
        starter: "Standard AI",
        growth: "Advanced AI Copilot",
        business: "Premium AI Copilot",
        enterprise: "Full AI & Document RAG",
      },
    ],
  },
  {
    category: "Team Management",
    features: [
      {
        key: "user_capacity",
        name: "Team Member Seats",
        description: "Active user accounts in workspace",
        free: "Up to 3",
        starter: "Up to 10",
        growth: "Up to 25",
        business: "Up to 100",
        enterprise: "Unlimited / Custom",
      },
    ],
  },
  {
    category: "Permissions & Security",
    features: [
      {
        key: "rbac_roles",
        name: "Role-Based Access Control (RBAC)",
        description: "Granular roles and data boundary scopes",
        free: "Basic Admin/User",
        starter: "Standard Roles",
        growth: "Custom Roles & Scopes",
        business: "Multi-Department Scopes",
        enterprise: "Enterprise Attribute RBAC",
      },
      {
        key: "sso_security",
        name: "Single Sign-On (SSO / SAML)",
        description: "Enterprise Okta, Azure AD, SAML 2.0",
        free: false,
        starter: false,
        growth: false,
        business: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Integrations & API",
    features: [
      {
        key: "rest_api",
        name: "REST API & Webhooks",
        description: "Programmatic API access & webhooks",
        free: "5,000 req/mo",
        starter: "10,000 req/mo",
        growth: "50,000 req/mo",
        business: "250,000 req/mo + Webhooks",
        enterprise: "Unlimited / Dedicated Gateway",
      },
      {
        key: "cloud_storage",
        name: "Cloud Storage",
        description: "Secure storage for documents and attachments",
        free: "1 GB",
        starter: "10 GB",
        growth: "50 GB",
        business: "200 GB",
        enterprise: "Unlimited / Custom",
      },
    ],
  },
  {
    category: "Administration & Audit",
    features: [
      {
        key: "audit_logs",
        name: "Audit Logs & Compliance",
        description: "Tamper-evident cryptographic audit records",
        free: false,
        starter: false,
        growth: "Activity Logs",
        business: "HMAC Audit Trails",
        enterprise: "WORM Compliance Archive",
      },
    ],
  },
  {
    category: "Support & SLA",
    features: [
      {
        key: "support_level",
        name: "Support Channel & Response SLA",
        description: "Dedicated channels and guarantee",
        free: "Community / Help Center",
        starter: "Email Support",
        growth: "Priority Email & Chat",
        business: "Priority 24/7 SLA Support",
        enterprise: "Dedicated TAM & 99.9% SLA",
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
  if (clean === "pro" || clean === "professional") return "growth";
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
 * Formats pricing string for display (e.g. ₹999/user/month or Custom)
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

