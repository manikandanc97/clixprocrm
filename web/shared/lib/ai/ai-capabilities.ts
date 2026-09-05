import {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Calendar,
  FileText,
  CheckSquare,
  ShieldCheck,
  Activity,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface QuickActionItem {
  id: string;
  label: string;
  prompt: string;
  capabilityId: string;
  iconName: string;
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  requiredPermissions: string[];
  iconName: string;
  icon: LucideIcon;
  quickActions: Array<{
    id: string;
    label: string;
    prompt: string;
  }>;
}

/**
 * Superadmin / Platform Administrator Capabilities
 */
export const SUPER_ADMIN_CAPABILITIES: AICapability[] = [
  {
    id: 'platform_analytics',
    name: 'Platform Analytics & MRR',
    description: 'Monitor platform overview, active tenant counts, MRR, and ARR revenue',
    requiredPermissions: ['*'],
    iconName: 'Activity',
    icon: Activity,
    quickActions: [
      {
        id: 'super_platform_overview',
        label: 'Platform overview & MRR',
        prompt: 'Show platform overview, active tenants count, and MRR metrics.',
      },
      {
        id: 'super_growth_trends',
        label: 'Tenants growth trend',
        prompt: 'Show monthly organization growth and user registration trends.',
      },
    ],
  },
  {
    id: 'platform_organizations',
    name: 'Organizations & Tenants',
    description: 'Manage active, trial, and suspended client organizations',
    requiredPermissions: ['*'],
    iconName: 'Building2',
    icon: Building2,
    quickActions: [
      {
        id: 'super_active_tenants',
        label: 'List active organizations',
        prompt: 'List all active organizations, tenant plans, and usage status.',
      },
      {
        id: 'super_suspended_tenants',
        label: 'Suspended tenants check',
        prompt: 'Show summary of all active vs suspended organizations.',
      },
    ],
  },
  {
    id: 'platform_audit_logs',
    name: 'Security & Audit Logs',
    description: 'Inspect platform security logs and admin activity audits',
    requiredPermissions: ['*'],
    iconName: 'ShieldCheck',
    icon: ShieldCheck,
    quickActions: [
      {
        id: 'super_audit_logs',
        label: 'Recent security audit logs',
        prompt: 'Show recent platform audit logs and security activities.',
      },
    ],
  },
  {
    id: 'platform_users',
    name: 'Platform Users',
    description: 'Query users and administrators across the platform',
    requiredPermissions: ['*'],
    iconName: 'Users',
    icon: Users,
    quickActions: [
      {
        id: 'super_platform_users',
        label: 'Platform users summary',
        prompt: 'Show total users and administrators across the platform.',
      },
    ],
  },
  {
    id: 'platform_plans',
    name: 'Subscription Plans',
    description: 'Track tenant distribution across subscription tiers',
    requiredPermissions: ['*'],
    iconName: 'CreditCard',
    icon: CreditCard,
    quickActions: [
      {
        id: 'super_plan_breakdown',
        label: 'Subscription plans breakdown',
        prompt: 'Show tenant distribution across Free, Starter, Pro, and Enterprise plans.',
      },
    ],
  },
];

/**
 * Canonical capability registry mapping backend permissions to AI assistant capabilities
 * and dynamic suggested questions/quick actions for workspace CRM users.
 *
 * Architecture:
 *   Authenticated User → Permissions from RBAC → Authorized Capabilities → Dynamic Quick Actions
 */
export const AI_CAPABILITIES: AICapability[] = [
  {
    id: 'leads',
    name: 'Leads Management',
    description: 'Query and manage leads, conversions, and follow-ups',
    requiredPermissions: [
      'Leads',
      'LEADS_READ',
      'leads.read',
      'leads.view',
      'leads.read_assigned',
      'leads',
    ],
    iconName: 'Users',
    icon: Users,
    quickActions: [
      {
        id: 'leads_list',
        label: 'Show my leads',
        prompt: 'Show my leads.',
      },
      {
        id: 'leads_followup',
        label: 'Hot leads follow-up',
        prompt: 'Show me all the hot leads that need follow-up.',
      },
    ],
  },
  {
    id: 'customers',
    name: 'Customers & Contacts',
    description: 'Query customer profiles, contacts, and account details',
    requiredPermissions: [
      'Customers',
      'CUSTOMERS_READ',
      'customers.read',
      'customers.view',
      'Contacts',
      'contacts.read',
      'contacts.view',
      'customers',
      'contacts',
      'Companies',
      'companies.read',
    ],
    iconName: 'Building2',
    icon: Building2,
    quickActions: [
      {
        id: 'customers_list',
        label: 'Show my customers',
        prompt: 'Show my customers.',
      },
      {
        id: 'customers_recent',
        label: 'Find recent customers',
        prompt: 'Find recent customers.',
      },
    ],
  },
  {
    id: 'deals',
    name: 'Pipeline & Deals',
    description: 'Monitor deals, sales stages, and pipeline value',
    requiredPermissions: [
      'Deals',
      'DEALS_READ',
      'deals.read',
      'deals.view',
      'deals.read_assigned',
      'deals',
      'Pipeline',
      'PIPELINE_READ',
      'pipeline.read',
      'pipeline.view',
      'pipeline',
    ],
    iconName: 'Briefcase',
    icon: Briefcase,
    quickActions: [
      {
        id: 'deals_pipeline',
        label: 'Show my pipeline',
        prompt: 'Show my sales pipeline and open deals.',
      },
      {
        id: 'deals_open',
        label: "What's my open deals?",
        prompt: "What are my open deals in the pipeline?",
      },
    ],
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Analyze revenue metrics, sales trends, and team performance',
    requiredPermissions: [
      'Reports',
      'REPORTS_READ',
      'reports.read',
      'reports.view',
      'Reports & Analytics',
      'reports & analytics',
      'reports',
      'Analytics',
      'analytics',
    ],
    iconName: 'TrendingUp',
    icon: TrendingUp,
    quickActions: [
      {
        id: 'reports_sales',
        label: 'Show my sales report',
        prompt: 'Show my sales report and performance breakdown.',
      },
      {
        id: 'reports_revenue',
        label: 'Revenue this month',
        prompt: 'Show me the revenue generated this month.',
      },
    ],
  },
  {
    id: 'tasks',
    name: 'Tasks & Activities',
    description: 'Track daily tasks, meetings, deadlines, and action items',
    requiredPermissions: [
      'Tasks',
      'TASKS_READ',
      'tasks.read',
      'tasks.view',
      'tasks.read_assigned',
      'tasks',
      'Calendar',
      'calendar',
    ],
    iconName: 'Calendar',
    icon: Calendar,
    quickActions: [
      {
        id: 'tasks_pending',
        label: 'Show my pending tasks',
        prompt: 'Show my pending tasks.',
      },
      {
        id: 'tasks_today',
        label: 'Tasks due today',
        prompt: 'What are my upcoming tasks for today?',
      },
    ],
  },
  {
    id: 'quotations',
    name: 'Quotations',
    description: 'Manage sales proposals, estimates, and quotations',
    requiredPermissions: [
      'Quotations',
      'QUOTATIONS_READ',
      'quotations.read',
      'quotations.view',
      'quotations.read_assigned',
      'quotations',
    ],
    iconName: 'FileText',
    icon: FileText,
    quickActions: [
      {
        id: 'quotations_pending',
        label: 'Pending quotations',
        prompt: 'List all pending quotations.',
      },
      {
        id: 'quotations_generate',
        label: 'Generate quotation',
        prompt: 'Generate a new quotation for a client.',
      },
    ],
  },
];

/**
 * Module Synonyms map for robust matching across legacy, snake_case, dot.notation, and canonical names.
 */
const MODULE_SYNONYMS: Record<string, string[]> = {
  leads: ['leads', 'lead', 'leads.read', 'leads_read', 'leads:read', 'leads.view', 'leads:view'],
  customers: ['customers', 'customer', 'customers.read', 'customers_read', 'customers:read', 'contacts', 'contact', 'contacts.read', 'companies', 'company'],
  deals: ['deals', 'deal', 'deals.read', 'deals_read', 'pipeline', 'pipeline.read', 'pipeline_read'],
  reports: ['reports', 'report', 'reports.read', 'reports_read', 'reports & analytics', 'analytics'],
  tasks: ['tasks', 'task', 'tasks.read', 'tasks_read', 'calendar', 'activities'],
  quotations: ['quotations', 'quotation', 'quotations.read', 'quotations_read', 'quotes', 'invoices'],
};

/**
 * Normalizes a permission string into lowercase token for matching.
 */
function normalizePermissionToken(perm: string): string {
  return (perm || '').toLowerCase().trim().replace(/[_\s:]+/g, '.');
}

/**
 * Checks if a specific capability is accessible based on the authenticated user's permissions and role.
 */
export function hasCapabilityAccess(
  capabilityId: string,
  userPermissions?: string[],
  userRole?: string
): boolean {
  const normalizedRole = (userRole || '').toUpperCase().trim().replace(/[\s_]+/g, '');
  if (
    normalizedRole === 'SUPERADMIN' ||
    normalizedRole === 'ADMIN' ||
    normalizedRole === 'OWNER'
  ) {
    return true;
  }

  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  if (userPermissions.includes('*') || userPermissions.includes('ALL') || userPermissions.includes('all')) {
    return true;
  }

  const capability = AI_CAPABILITIES.find((c) => c.id === capabilityId);
  if (!capability) return false;

  const normalizedUserPerms = userPermissions.map(normalizePermissionToken);
  const synonyms = MODULE_SYNONYMS[capabilityId] || [];
  const normalizedRequired = [
    ...capability.requiredPermissions.map(normalizePermissionToken),
    ...synonyms.map(normalizePermissionToken),
  ];

  return normalizedUserPerms.some((userPerm) => {
    if (normalizedRequired.includes(userPerm)) return true;

    // Check module prefix matching (e.g., 'leads' satisfies 'leads.read')
    return normalizedRequired.some((req) => {
      const baseReq = req.split('.')[0];
      const baseUser = userPerm.split('.')[0];
      return baseReq === baseUser && (userPerm === baseUser || req === userPerm);
    });
  });
}

export const MAX_QUICK_ACTIONS = 5;

/**
 * Generates dynamic Quick Actions derived strictly from the authenticated user's role and permissions,
 * capped at a MAXIMUM of 5 most relevant actions.
 *
 * Rules:
 * 1. Superadmin role receives dedicated Platform & Organization management quick actions.
 * 2. Workspace users receive actions strictly derived from their authorized CRM capabilities.
 * 3. Maximum of 5 Quick Actions at any time (never more than 5).
 * 4. Never displays unauthorized actions just to fill slots.
 * 5. If no capabilities match, returns an empty array to allow the UI to render graceful fallback.
 */
export function getAuthorizedQuickActions(
  userPermissions?: string[],
  userRole?: string,
  maxActions: number = MAX_QUICK_ACTIONS
): QuickActionItem[] {
  const normalizedRole = (userRole || '').toUpperCase().trim().replace(/[\s_]+/g, '');

  // 1. Super Admin specific handling: Return Platform Management Quick Actions
  if (normalizedRole === 'SUPERADMIN') {
    const superActions: QuickActionItem[] = [];
    for (const cap of SUPER_ADMIN_CAPABILITIES) {
      if (superActions.length < maxActions && cap.quickActions[0]) {
        superActions.push({
          id: cap.quickActions[0].id,
          label: cap.quickActions[0].label,
          prompt: cap.quickActions[0].prompt,
          capabilityId: cap.id,
          iconName: cap.iconName,
        });
      }
    }
    // Fill with secondary actions if space remains
    if (superActions.length < maxActions) {
      for (const cap of SUPER_ADMIN_CAPABILITIES) {
        for (let i = 1; i < cap.quickActions.length; i++) {
          if (superActions.length < maxActions) {
            superActions.push({
              id: cap.quickActions[i].id,
              label: cap.quickActions[i].label,
              prompt: cap.quickActions[i].prompt,
              capabilityId: cap.id,
              iconName: cap.iconName,
            });
          }
        }
      }
    }
    return superActions.slice(0, maxActions);
  }

  // 2. Tenant Workspace users: Derive from authorized CRM capabilities
  const authorizedCapabilities = AI_CAPABILITIES.filter((capability) =>
    hasCapabilityAccess(capability.id, userPermissions, userRole)
  );

  if (authorizedCapabilities.length === 0) {
    return [];
  }

  const prioritizedActions: QuickActionItem[] = [];
  const addedIds = new Set<string>();

  const addAction = (qa: { id: string; label: string; prompt: string }, cap: AICapability) => {
    if (!addedIds.has(qa.id) && prioritizedActions.length < maxActions) {
      addedIds.add(qa.id);
      prioritizedActions.push({
        id: qa.id,
        label: qa.label,
        prompt: qa.prompt,
        capabilityId: cap.id,
        iconName: cap.iconName,
      });
    }
  };

  // Priority Pass 1: Core CRM lead actions + primary action of each authorized capability
  const leadsCap = authorizedCapabilities.find((c) => c.id === 'leads');
  if (leadsCap) {
    if (leadsCap.quickActions[0]) addAction(leadsCap.quickActions[0], leadsCap);
    if (leadsCap.quickActions[1]) addAction(leadsCap.quickActions[1], leadsCap);
  }

  for (const cap of authorizedCapabilities) {
    if (cap.id !== 'leads' && cap.quickActions[0]) {
      addAction(cap.quickActions[0], cap);
    }
  }

  // Priority Pass 2: Secondary useful actions from authorized capabilities to fill up to maxActions
  for (const cap of authorizedCapabilities) {
    for (let i = 1; i < cap.quickActions.length; i++) {
      addAction(cap.quickActions[i], cap);
    }
  }

  return prioritizedActions.slice(0, maxActions);
}

/**
 * Helper to get the Lucide icon component for a given capability or icon name.
 */
export function getCapabilityIcon(iconName: string): LucideIcon {
  switch (iconName) {
    case 'Users':
      return Users;
    case 'Building2':
      return Building2;
    case 'Briefcase':
      return Briefcase;
    case 'TrendingUp':
      return TrendingUp;
    case 'Calendar':
      return Calendar;
    case 'FileText':
      return FileText;
    case 'CheckSquare':
      return CheckSquare;
    case 'Activity':
      return Activity;
    case 'CreditCard':
      return CreditCard;
    case 'ShieldCheck':
    default:
      return ShieldCheck;
  }
}

