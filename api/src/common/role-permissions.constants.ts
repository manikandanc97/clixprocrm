/**
 * Canonical module permission names used in RolePermission table.
 * These MUST match what the @Permissions() decorator uses in controllers.
 *
 * Architecture:
 *   Role → Module → hasAccess (boolean)
 *
 * Future enhancement: Extend RolePermission with action column (view/create/edit/delete/export)
 * for fine-grained action-level RBAC. The current boolean model is sufficient for v1.
 */
export const PERMISSION_MODULES = {
  // Core CRM
  DASHBOARD: 'Dashboard',
  LEADS: 'Leads',
  CONTACTS: 'Contacts',
  COMPANIES: 'Companies',
  DEALS: 'Deals',
  TASKS: 'Tasks',
  CALENDAR: 'Calendar',
  QUOTATIONS: 'Quotations',
  INVOICES: 'Invoices',

  // Insights
  REPORTS: 'Reports',

  // Administration
  EMPLOYEES: 'Employees',
  ROLES: 'Roles',
  SETTINGS: 'Settings',
  ORGANIZATION: 'Organization',
  INTEGRATIONS: 'Integrations',
  AUDIT_LOGS: 'AuditLogs',

  // HRM & Operations
  ATTENDANCE: 'Attendance',
  PERFORMANCE: 'Performance',

  // Support (backward compat)
  SUPPORT: 'Support',
} as const;

export type PermissionModule =
  (typeof PERMISSION_MODULES)[keyof typeof PERMISSION_MODULES];

/**
 * Canonical permission sets for the 4 standard system roles.
 * Used during tenant onboarding to seed all roles.
 *
 * Record scope (own / team / organization / all) is enforced at service level
 * by filtering Prisma queries by userId/tenantId rather than stored in RolePermission.
 */
export const SYSTEM_ROLE_PERMISSIONS: Record<string, PermissionModule[]> = {
  ADMIN: [
    PERMISSION_MODULES.DASHBOARD,
    PERMISSION_MODULES.LEADS,
    PERMISSION_MODULES.CONTACTS,
    PERMISSION_MODULES.COMPANIES,
    PERMISSION_MODULES.DEALS,
    PERMISSION_MODULES.TASKS,
    PERMISSION_MODULES.CALENDAR,
    PERMISSION_MODULES.QUOTATIONS,
    PERMISSION_MODULES.INVOICES,
    PERMISSION_MODULES.REPORTS,
    PERMISSION_MODULES.EMPLOYEES,
    PERMISSION_MODULES.ROLES,
    PERMISSION_MODULES.SETTINGS,
    PERMISSION_MODULES.ORGANIZATION,
    PERMISSION_MODULES.INTEGRATIONS,
    PERMISSION_MODULES.AUDIT_LOGS,
    PERMISSION_MODULES.SUPPORT,
  ],

  MANAGER: [
    PERMISSION_MODULES.DASHBOARD,
    PERMISSION_MODULES.LEADS,
    PERMISSION_MODULES.CONTACTS,
    PERMISSION_MODULES.COMPANIES,
    PERMISSION_MODULES.DEALS,
    PERMISSION_MODULES.TASKS,
    PERMISSION_MODULES.CALENDAR,
    PERMISSION_MODULES.QUOTATIONS,
    PERMISSION_MODULES.INVOICES,
    PERMISSION_MODULES.REPORTS,
    PERMISSION_MODULES.EMPLOYEES,
  ],

  SALES: [
    PERMISSION_MODULES.DASHBOARD,
    PERMISSION_MODULES.LEADS,
    PERMISSION_MODULES.CONTACTS,
    PERMISSION_MODULES.COMPANIES,
    PERMISSION_MODULES.DEALS,
    PERMISSION_MODULES.TASKS,
    PERMISSION_MODULES.CALENDAR,
    PERMISSION_MODULES.QUOTATIONS,
    PERMISSION_MODULES.INVOICES,
  ],

  EMPLOYEE: [
    PERMISSION_MODULES.DASHBOARD,
    PERMISSION_MODULES.TASKS,
    PERMISSION_MODULES.CALENDAR,
    // No: Leads (assigned only — enforced at service level), Contacts, Companies,
    // Deals (assigned only), Quotations (view only), Reports, Employees, Roles,
    // Settings, Organization, Integrations, AuditLogs
  ],
};
