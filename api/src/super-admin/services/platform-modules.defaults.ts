export const NAVIGATION_SCOPE = {
  TENANT_CRM: 'TENANT_CRM',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type NavigationScope =
  (typeof NAVIGATION_SCOPE)[keyof typeof NAVIGATION_SCOPE];

export class CreatePlatformModuleDto {
  key?: string;
  label!: string;
  icon?: string;
  route!: string;
  group?: string;
  navigationScope?: NavigationScope;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

export class UpdatePlatformModuleDto {
  key?: string;
  label?: string;
  icon?: string;
  route?: string;
  group?: string;
  navigationScope?: NavigationScope;
  parentId?: string | null;
  sortOrder?: number;
  isEnabled?: boolean;
  isVisible?: boolean;
  isSystem?: boolean;
  permission?: string | null;
  badge?: string | null;
  description?: string | null;
}

// ============================================================
// TENANT CRM NAVIGATION — default platform modules for workspace CRM
// navigationScope: TENANT_CRM (default)
// ============================================================
export const DEFAULT_TENANT_CRM_MODULES: CreatePlatformModuleDto[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    group: 'Core',
    sortOrder: 1,
    isSystem: true,
    permission: 'Dashboard',
    description: 'Main workspace KPI overview and operational activity stream',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'Users',
    route: '/contacts',
    group: 'Core',
    sortOrder: 2,
    isSystem: true,
    permission: 'Contacts',
    description: 'Customer contacts and relationship directory',
  },
  {
    key: 'companies',
    label: 'Companies',
    icon: 'Building2',
    route: '/companies',
    group: 'Core',
    sortOrder: 3,
    isSystem: true,
    permission: 'Companies',
    description: 'Organization accounts and B2B corporate entities',
  },
  {
    key: 'deals',
    label: 'Deals',
    icon: 'DollarSign',
    route: '/deals',
    group: 'Core',
    sortOrder: 4,
    isSystem: true,
    permission: 'Deals',
    description: 'Sales opportunity tracking and deal stage management',
  },
  {
    key: 'leads',
    label: 'Leads',
    icon: 'UserPlus',
    route: '/leads',
    group: 'Core',
    sortOrder: 5,
    isSystem: true,
    permission: 'Leads',
    description: 'Inbound prospecting and lead qualification pipeline',
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    icon: 'Kanban',
    route: '/pipeline',
    group: 'Core',
    sortOrder: 6,
    isSystem: true,
    permission: 'Pipeline',
    description: 'Visual drag-and-drop opportunity kanban stages',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'CheckSquare',
    route: '/tasks',
    group: 'Core',
    sortOrder: 7,
    isSystem: true,
    permission: 'Tasks',
    description: 'Team checklists, activities, and operational todos',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: 'Calendar',
    route: '/calendar',
    group: 'Core',
    sortOrder: 8,
    isSystem: true,
    permission: 'Calendar',
    description: 'Scheduled appointments, team meetings, and task timelines',
  },
  {
    key: 'quotations',
    label: 'Quotations',
    icon: 'FileSpreadsheet',
    route: '/quotations',
    group: 'Finance',
    sortOrder: 9,
    isSystem: true,
    permission: 'Quotations',
    description: 'Commercial proposals, quote estimates, and approvals',
  },
  {
    key: 'invoices',
    label: 'Invoices',
    icon: 'Receipt',
    route: '/invoices',
    group: 'Finance',
    sortOrder: 10,
    isSystem: true,
    permission: 'Invoices',
    description: 'Billing collection, GST invoices, and payment tracking',
  },
  {
    key: 'analytics',
    label: 'Reports & Analytics',
    icon: 'TrendingUp',
    route: '/reports',
    group: 'Insights',
    sortOrder: 11,
    isSystem: true,
    permission: 'Analytics',
    description: 'Revenue performance, sales conversion, and custom reports',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'Settings',
    route: '/settings',
    group: 'Administration',
    sortOrder: 12,
    isSystem: true,
    permission: 'Settings',
    description: 'Workspace profile, currencies, branding, and defaults',
  },
  {
    key: 'support_tickets',
    label: 'Support Tickets',
    icon: 'Ticket',
    route: '/support-tickets',
    group: 'Core',
    sortOrder: 13,
    isSystem: false,
    permission: 'Support Tickets',
    description: 'Customer support issues and resolution tracking',
  },
  {
    key: 'team_performance',
    label: 'Team Performance',
    icon: 'BriefcaseBusiness',
    route: '/team-performance',
    group: 'Insights',
    sortOrder: 14,
    isSystem: false,
    permission: 'Team Performance',
    description: 'Managerial performance summaries and KPIs',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: 'CalendarDays',
    route: '/attendance',
    group: 'HRM & Operations',
    sortOrder: 15,
    isSystem: false,
    permission: 'Attendance',
    description: 'Employee attendance and shift monitoring',
  },
  {
    key: 'performance',
    label: 'Performance',
    icon: 'BarChart3',
    route: '/performance',
    group: 'HRM & Operations',
    sortOrder: 16,
    isSystem: false,
    permission: 'Performance',
    description: 'Individual goal appraisal and performance reviews',
  },
  {
    key: 'help_center',
    label: 'Help Center',
    icon: 'LifeBuoy',
    route: '/help',
    group: 'Support',
    sortOrder: 17,
    isSystem: false,
    permission: 'Help Center',
    description: 'Documentation and platform support guides',
  },
];

// ============================================================
// SUPER ADMIN NAVIGATION — platform administration menus
// navigationScope: SUPER_ADMIN
// Keys prefixed with sa_ to avoid collision with CRM keys
// ============================================================
export const DEFAULT_SUPER_ADMIN_NAV_MENUS = [
  {
    key: 'sa_overview',
    label: 'Overview',
    icon: 'LayoutDashboard',
    route: '/super-admin',
    group: 'Overview',
    sortOrder: 1,
    isSystem: true,
    description:
      'Multi-tenant health metrics, live platform activity stream, and tenant summary',
  },
  {
    key: 'sa_copilot',
    label: 'ClixPro AI',
    icon: 'Sparkles',
    route: '/super-admin/copilot',
    group: 'Platform',
    sortOrder: 2,
    isSystem: true,
    description:
      'Intelligent platform operations copilot and interactive root administrative assistant',
  },
  {
    key: 'sa_organizations',
    label: 'Organizations',
    icon: 'Building2',
    route: '/super-admin/organizations',
    group: 'Platform',
    sortOrder: 3,
    isSystem: true,
    description:
      'Manage multi-tenant workspaces, subscription plans, tenant quotas, and lifecycle',
  },
  {
    key: 'sa_users',
    label: 'Platform Users',
    icon: 'UserCog',
    route: '/super-admin/users',
    group: 'Platform',
    sortOrder: 4,
    isSystem: true,
    description:
      'Global user directory, administrative privilege control, and cross-org access',
  },
  {
    key: 'sa_modules',
    label: 'Platform Modules',
    icon: 'Layers',
    route: '/super-admin/modules',
    group: 'Platform',
    sortOrder: 5,
    isSystem: true,
    description:
      'Configure global modules, menu hierarchy, icon customization, and navigation visibility',
  },
  {
    key: 'sa_support',
    label: 'Support Inbox',
    icon: 'Ticket',
    route: '/super-admin/support',
    group: 'Platform',
    sortOrder: 6,
    isSystem: true,
    description:
      'Central platform support ticketing desk, tenant inquiries, SLA tracking, and resolution inbox',
  },
  {
    key: 'sa_plans',
    label: 'Plans & Packages',
    icon: 'CreditCard',
    route: '/super-admin/plans',
    group: 'Commerce',
    sortOrder: 7,
    isSystem: true,
    description:
      'Multi-tenant subscription tiers, pricing models, feature packaging, and MRR metrics',
  },
  {
    key: 'sa_billing',
    label: 'Billing & Revenue',
    icon: 'Receipt',
    route: '/super-admin/billing',
    group: 'Commerce',
    sortOrder: 8,
    isSystem: true,
    description:
      'Platform-wide invoice collections, payment processing, transaction logs, and MRR cashflow',
  },
  {
    key: 'sa_ai',
    label: 'AI Models & Tiers',
    icon: 'Brain',
    route: '/super-admin/ai',
    group: 'AI Platform',
    sortOrder: 9,
    isSystem: true,
    description:
      'Multi-tenant LLM provider routing, token quotas, tier allocations, and prompt controls',
  },
  {
    key: 'sa_analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    route: '/super-admin/analytics',
    group: 'Insights',
    sortOrder: 10,
    isSystem: false,
    description:
      'Cross-tenant SaaS metrics, MRR projections, growth velocity, and system telemetry',
  },
  {
    key: 'sa_security',
    label: 'Security Center',
    icon: 'ShieldCheck',
    route: '/super-admin/security',
    group: 'Security & Operations',
    sortOrder: 11,
    isSystem: true,
    description:
      'Root IAM policy enforcement, multi-factor authentication requirements, and IP firewall filters',
  },
  {
    key: 'sa_secops',
    label: 'SecOps Telemetry',
    icon: 'Activity',
    route: '/super-admin/security/operations',
    group: 'Security & Operations',
    sortOrder: 12,
    isSystem: true,
    description:
      'Live node health telemetry, cluster metrics, threat detection signals, and real-time alerts',
  },
  {
    key: 'sa_audit_logs',
    label: 'Audit Logs',
    icon: 'FileClock',
    route: '/super-admin/audit-logs',
    group: 'Security & Operations',
    sortOrder: 13,
    isSystem: true,
    description:
      'Immutable cross-tenant audit trail, security events, and administrative mutations',
  },
  {
    key: 'sa_settings',
    label: 'Platform Settings',
    icon: 'Settings',
    route: '/super-admin/settings',
    group: 'Configuration',
    sortOrder: 14,
    isSystem: true,
    description:
      'Global application configuration, environment settings, and multi-tenant feature toggles',
  },
];
