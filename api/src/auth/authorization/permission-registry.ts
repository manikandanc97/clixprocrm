import { DataScope, PermissionDefinition } from './authorization-types';

export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  // CRM - Leads
  {
    key: 'crm:leads:view',
    module: 'crm',
    resource: 'leads',
    action: 'view',
    label: 'View Leads',
    description: 'View and search lead records',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:leads:create',
    module: 'crm',
    resource: 'leads',
    action: 'create',
    label: 'Create Leads',
    description: 'Create new lead records',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:leads:edit',
    module: 'crm',
    resource: 'leads',
    action: 'edit',
    label: 'Edit Leads',
    description: 'Modify existing lead records',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:leads:delete',
    module: 'crm',
    resource: 'leads',
    action: 'delete',
    label: 'Delete Leads',
    description: 'Delete or archive lead records',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:leads:assign',
    module: 'crm',
    resource: 'leads',
    action: 'assign',
    label: 'Assign Leads',
    description: 'Assign or reassign leads to other users',
    supportedScopes: ['TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:leads:import',
    module: 'crm',
    resource: 'leads',
    action: 'import',
    label: 'Import Leads',
    description: 'Bulk import leads from CSV/Excel',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:leads:export',
    module: 'crm',
    resource: 'leads',
    action: 'export',
    label: 'Export Leads',
    description: 'Bulk export lead data',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // CRM - Deals
  {
    key: 'crm:deals:view',
    module: 'crm',
    resource: 'deals',
    action: 'view',
    label: 'View Deals',
    description: 'View pipeline and deals',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:deals:create',
    module: 'crm',
    resource: 'deals',
    action: 'create',
    label: 'Create Deals',
    description: 'Create new opportunity/deal records',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:deals:edit',
    module: 'crm',
    resource: 'deals',
    action: 'edit',
    label: 'Edit Deals',
    description: 'Update deal stage, value, and metadata',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:deals:delete',
    module: 'crm',
    resource: 'deals',
    action: 'delete',
    label: 'Delete Deals',
    description: 'Delete deals from pipeline',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:deals:assign',
    module: 'crm',
    resource: 'deals',
    action: 'assign',
    label: 'Assign Deals',
    description: 'Reassign deal ownership',
    supportedScopes: ['TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:deals:approve',
    module: 'crm',
    resource: 'deals',
    action: 'approve',
    label: 'Approve Deals',
    description: 'Special approval for high-value deals',
    supportedScopes: ['TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // CRM - Contacts
  {
    key: 'crm:contacts:view',
    module: 'crm',
    resource: 'contacts',
    action: 'view',
    label: 'View Contacts',
    description: 'View contact directory',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:contacts:create',
    module: 'crm',
    resource: 'contacts',
    action: 'create',
    label: 'Create Contacts',
    description: 'Create new contact records',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:contacts:edit',
    module: 'crm',
    resource: 'contacts',
    action: 'edit',
    label: 'Edit Contacts',
    description: 'Modify contact records',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:contacts:delete',
    module: 'crm',
    resource: 'contacts',
    action: 'delete',
    label: 'Delete Contacts',
    description: 'Delete contacts',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // CRM - Companies
  {
    key: 'crm:companies:view',
    module: 'crm',
    resource: 'companies',
    action: 'view',
    label: 'View Companies',
    description: 'View company accounts',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:companies:create',
    module: 'crm',
    resource: 'companies',
    action: 'create',
    label: 'Create Companies',
    description: 'Create new company accounts',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:companies:edit',
    module: 'crm',
    resource: 'companies',
    action: 'edit',
    label: 'Edit Companies',
    description: 'Modify company records',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:companies:delete',
    module: 'crm',
    resource: 'companies',
    action: 'delete',
    label: 'Delete Companies',
    description: 'Delete company records',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // CRM - Customers / Accounts
  {
    key: 'crm:customers:view',
    module: 'crm',
    resource: 'customers',
    action: 'view',
    label: 'View Customers',
    description: 'View customer records and history',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:customers:create',
    module: 'crm',
    resource: 'customers',
    action: 'create',
    label: 'Create Customers',
    description: 'Create customer records',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:customers:edit',
    module: 'crm',
    resource: 'customers',
    action: 'edit',
    label: 'Edit Customers',
    description: 'Modify customer records',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'BRANCH', 'ORGANIZATION', 'SHARED'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:customers:delete',
    module: 'crm',
    resource: 'customers',
    action: 'delete',
    label: 'Delete Customers',
    description: 'Delete customer records',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // CRM - Tasks
  {
    key: 'crm:tasks:view',
    module: 'crm',
    resource: 'tasks',
    action: 'view',
    label: 'View Tasks',
    description: 'View tasks and todos',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:tasks:create',
    module: 'crm',
    resource: 'tasks',
    action: 'create',
    label: 'Create Tasks',
    description: 'Create new tasks',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:tasks:edit',
    module: 'crm',
    resource: 'tasks',
    action: 'edit',
    label: 'Edit Tasks',
    description: 'Update tasks',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:tasks:delete',
    module: 'crm',
    resource: 'tasks',
    action: 'delete',
    label: 'Delete Tasks',
    description: 'Delete tasks',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // CRM - Meetings
  {
    key: 'crm:meetings:view',
    module: 'crm',
    resource: 'meetings',
    action: 'view',
    label: 'View Meetings',
    description: 'View calendar and meetings',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:meetings:create',
    module: 'crm',
    resource: 'meetings',
    action: 'create',
    label: 'Schedule Meetings',
    description: 'Schedule new meetings',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:meetings:edit',
    module: 'crm',
    resource: 'meetings',
    action: 'edit',
    label: 'Edit Meetings',
    description: 'Update scheduled meetings',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:meetings:delete',
    module: 'crm',
    resource: 'meetings',
    action: 'delete',
    label: 'Delete Meetings',
    description: 'Cancel or delete meetings',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Finance - Quotations
  {
    key: 'crm:quotations:view',
    module: 'crm',
    resource: 'quotations',
    action: 'view',
    label: 'View Quotations',
    description: 'View quotes and proposals',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:quotations:create',
    module: 'crm',
    resource: 'quotations',
    action: 'create',
    label: 'Create Quotations',
    description: 'Generate new quotes',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:quotations:edit',
    module: 'crm',
    resource: 'quotations',
    action: 'edit',
    label: 'Edit Quotations',
    description: 'Modify quotations',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:quotations:delete',
    module: 'crm',
    resource: 'quotations',
    action: 'delete',
    label: 'Delete Quotations',
    description: 'Delete quotations',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Finance - Invoices
  {
    key: 'crm:invoices:view',
    module: 'crm',
    resource: 'invoices',
    action: 'view',
    label: 'View Invoices',
    description: 'View billing and invoices',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:invoices:create',
    module: 'crm',
    resource: 'invoices',
    action: 'create',
    label: 'Create Invoices',
    description: 'Issue new invoices',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:invoices:edit',
    module: 'crm',
    resource: 'invoices',
    action: 'edit',
    label: 'Edit Invoices',
    description: 'Modify invoices',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:invoices:delete',
    module: 'crm',
    resource: 'invoices',
    action: 'delete',
    label: 'Delete Invoices',
    description: 'Void or delete invoices',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Support - Tickets
  {
    key: 'crm:tickets:view',
    module: 'crm',
    resource: 'tickets',
    action: 'view',
    label: 'View Tickets',
    description: 'View support tickets',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:tickets:create',
    module: 'crm',
    resource: 'tickets',
    action: 'create',
    label: 'Create Tickets',
    description: 'Create support tickets',
    supportedScopes: ['OWN', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:tickets:edit',
    module: 'crm',
    resource: 'tickets',
    action: 'edit',
    label: 'Edit Tickets',
    description: 'Update support tickets',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:tickets:assign',
    module: 'crm',
    resource: 'tickets',
    action: 'assign',
    label: 'Assign Tickets',
    description: 'Assign tickets to team members',
    supportedScopes: ['TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'crm:tickets:close',
    module: 'crm',
    resource: 'tickets',
    action: 'close',
    label: 'Close Tickets',
    description: 'Resolve and close tickets',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Reports
  {
    key: 'reports:reports:view',
    module: 'reports',
    resource: 'reports',
    action: 'view',
    label: 'View Reports',
    description: 'View analytics and revenue reports',
    supportedScopes: ['OWN', 'TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'reports:reports:create',
    module: 'reports',
    resource: 'reports',
    action: 'create',
    label: 'Create Reports',
    description: 'Build custom reports',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'reports:reports:export',
    module: 'reports',
    resource: 'reports',
    action: 'export',
    label: 'Export Reports',
    description: 'Export report data',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'reports:reports:manage',
    module: 'reports',
    resource: 'reports',
    action: 'manage',
    label: 'Manage Reports',
    description: 'Manage report schedules and targets',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Admin - Roles
  {
    key: 'admin:roles:view',
    module: 'admin',
    resource: 'roles',
    action: 'view',
    label: 'View Roles',
    description: 'View organization roles and permission matrix',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'admin:roles:manage',
    module: 'admin',
    resource: 'roles',
    action: 'manage',
    label: 'Manage Roles',
    description: 'Create, update, and configure custom roles',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Admin - Employees
  {
    key: 'admin:employees:view',
    module: 'admin',
    resource: 'employees',
    action: 'view',
    label: 'View Employees',
    description: 'View organization employee directory',
    supportedScopes: ['TEAM', 'SUBORDINATES', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'admin:employees:manage',
    module: 'admin',
    resource: 'employees',
    action: 'manage',
    label: 'Manage Employees',
    description: 'Invite, assign roles, and manage team members',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Admin - Settings
  {
    key: 'admin:settings:view',
    module: 'admin',
    resource: 'settings',
    action: 'view',
    label: 'View Settings',
    description: 'View organization configuration',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'admin:settings:manage',
    module: 'admin',
    resource: 'settings',
    action: 'manage',
    label: 'Manage Settings',
    description: 'Update organization settings, branding, and policies',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // Admin - Teams
  {
    key: 'admin:teams:view',
    module: 'admin',
    resource: 'teams',
    action: 'view',
    label: 'View Teams',
    description: 'View teams and hierarchy',
    supportedScopes: ['TEAM', 'ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
  {
    key: 'admin:teams:manage',
    module: 'admin',
    resource: 'teams',
    action: 'manage',
    label: 'Manage Teams',
    description: 'Create teams and assign leaders',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },

  // System - Audit Logs
  {
    key: 'system:audit_logs:view',
    module: 'system',
    resource: 'audit_logs',
    action: 'view',
    label: 'View Audit Logs',
    description: 'View organization security and activity audit logs',
    supportedScopes: ['ORGANIZATION'],
    defaultScope: 'ORGANIZATION',
  },
];

const PERMISSION_KEY_MAP = new Map<string, PermissionDefinition>(
  PERMISSION_REGISTRY.map((p) => [p.key.toLowerCase(), p]),
);

/**
 * Normalizes legacy module names (e.g. "Leads", "Deals", "Roles") to canonical permission format
 */
export function normalizePermissionKey(input: string): string {
  if (!input) return '';
  const trimmed = input.trim().toLowerCase();

  // If already formatted as module:resource:action
  if (trimmed.includes(':')) {
    return trimmed;
  }

  // Legacy module name mappings
  const legacyMap: Record<string, string> = {
    leads: 'crm:leads:view',
    deals: 'crm:deals:view',
    contacts: 'crm:contacts:view',
    companies: 'crm:companies:view',
    customers: 'crm:customers:view',
    accounts: 'crm:customers:view',
    tasks: 'crm:tasks:view',
    calendar: 'crm:meetings:view',
    meetings: 'crm:meetings:view',
    quotations: 'crm:quotations:view',
    invoices: 'crm:invoices:view',
    tickets: 'crm:tickets:view',
    'support tickets': 'crm:tickets:view',
    support: 'crm:tickets:view',
    reports: 'reports:reports:view',
    analytics: 'reports:reports:view',
    employees: 'admin:employees:view',
    roles: 'admin:roles:manage',
    settings: 'admin:settings:manage',
    departments: 'admin:settings:manage',
    audit: 'system:audit_logs:view',
    'audit logs': 'system:audit_logs:view',
  };

  return legacyMap[trimmed] || `crm:${trimmed}:view`;
}

/**
 * Checks if a granted permission pattern satisfies the required permission
 */
export function matchesPermissionPattern(grantedPattern: string, requiredPermission: string): boolean {
  if (!grantedPattern || !requiredPermission) return false;
  const granted = grantedPattern.toLowerCase().trim();
  const required = requiredPermission.toLowerCase().trim();

  if (granted === 'all' || granted === '*' || granted === 'admin') {
    return true;
  }

  if (granted === required) {
    return true;
  }

  const [reqMod, reqRes, reqAct] = required.split(':');
  const [grMod, grRes, grAct] = granted.split(':');

  // Single word grant (e.g. "leads" or "crm")
  if (!granted.includes(':')) {
    if (grMod === reqMod || grMod === reqRes) {
      return true;
    }
  }

  // Two part grant (e.g. "crm:leads" or "admin:roles")
  if (grMod === reqMod && grRes === reqRes) {
    if (!grAct || grAct === '*' || grAct === 'manage' || grAct === 'all') {
      return true;
    }
    if (grAct === 'view' || grAct === 'read') {
      return reqAct === 'view' || reqAct === 'read';
    }
    return grAct === reqAct;
  }

  return false;
}
