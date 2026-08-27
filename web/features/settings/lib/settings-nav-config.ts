import React from "react";
import {
  User,
  Palette,
  Bell,
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Receipt,
  Sparkles,
  Zap,
  Boxes,
  ShieldAlert,
  Laptop,
  History,
  BookOpen,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { CRM_ROLES, normalizeRole, PERMISSIONS } from "@/shared/lib/auth/rbac";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  aliases?: string[];
  /**
   * Permission predicate. If true or undefined, accessible.
   */
  isAuthorized?: (ctx: { role: string; permissions: string[]; isSuperAdmin?: boolean }) => boolean;
}

export interface SettingsCategory {
  id: string;
  title: string;
  items: SettingsNavItem[];
}

export const SETTINGS_NAVIGATION: SettingsCategory[] = [
  {
    id: "account",
    title: "My Account",
    items: [
      {
        id: "profile",
        label: "My Profile",
        icon: User,
        description: "Manage your personal information and account details.",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        description: "Control which notifications and alerts you receive.",
      },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    items: [
      {
        id: "general",
        label: "General",
        icon: Building2,
        description: "Manage workspace details, company branding, and timezone.",
        aliases: ["workspace"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("settings.general");
        },
      },
      {
        id: "members",
        label: "Workspace Members",
        icon: Users,
        description: "Manage team members, invites, and departmental assignments.",
        aliases: ["team", "employees-settings"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER) return true;
          return (
            permissions.includes(PERMISSIONS.EMPLOYEES_READ) ||
            permissions.includes(PERMISSIONS.EMPLOYEES_MANAGE) ||
            permissions.includes(PERMISSIONS.SETTINGS_MANAGE)
          );
        },
      },
      {
        id: "roles",
        label: "Roles & Permissions",
        icon: ShieldCheck,
        description: "Control role access levels, governance, and permission scopes.",
        aliases: ["role-management", "roles-permissions"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN) return true;
          return (
            permissions.includes(PERMISSIONS.ROLES_READ) ||
            permissions.includes(PERMISSIONS.ROLES_MANAGE) ||
            permissions.includes(PERMISSIONS.SETTINGS_MANAGE)
          );
        },
      },
    ],
  },
  {
    id: "business",
    title: "Business & Billing",
    items: [
      {
        id: "billing",
        label: "Subscription & Plan",
        icon: CreditCard,
        description: "Manage your plan, seat quotas, and subscription details.",
        aliases: ["subscription"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("billing.manage");
        },
      },
    ],
  },
  {
    id: "automation-integrations",
    title: "Automation & Integrations",
    items: [
      {
        id: "integrations",
        label: "Integrations & API",
        icon: Boxes,
        description: "Manage connected services, API keys, and third-party integrations.",
        aliases: ["api-keys", "webhooks"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("integrations.manage");
        },
      },
      {
        id: "automation",
        label: "Automation Workflows",
        icon: Zap,
        description: "Configure automated workflows, webhook actions, and trigger rules.",
        aliases: ["workflows"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("automation.manage");
        },
      },
    ],
  },
  {
    id: "security",
    title: "Security & Governance",
    items: [
      {
        id: "security-privacy",
        label: "Security & Privacy",
        icon: ShieldAlert,
        description: "Manage passwords, two-factor authentication, and security policies.",
        aliases: ["security"],
      },
      {
        id: "sessions",
        label: "Login & Sessions",
        icon: Laptop,
        description: "Monitor active devices, logged-in sessions, and sign-in locations.",
      },
      {
        id: "audit-log",
        label: "Audit Log",
        icon: History,
        description: "Review workspace activity logs, user logins, and administrative actions.",
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("audit.read");
        },
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        id: "help-center",
        label: "Help Center",
        icon: BookOpen,
        description: "Access CRM documentation, tutorials, and user guides.",
        aliases: ["help"],
      },
      {
        id: "contact-support",
        label: "Contact Support",
        icon: LifeBuoy,
        description: "Submit support tickets and reach out to the customer success team.",
      },
    ],
  },
];

/**
 * Normalizes any section ID or alias to canonical ID.
 */
export function resolveCanonicalSectionId(rawSectionId: string | null | undefined): string {
  if (!rawSectionId) return "profile";
  const needle = rawSectionId.trim().toLowerCase();

  for (const category of SETTINGS_NAVIGATION) {
    for (const item of category.items) {
      if (item.id.toLowerCase() === needle) return item.id;
      if (item.aliases?.some((a) => a.toLowerCase() === needle)) return item.id;
    }
  }

  // Handle migrated contextual settings redirects
  if (needle === "preferences" || needle === "personalization") return "preferences_redirect";
  if (needle === "invoicing" || needle === "invoice-settings" || needle === "invoices-config" || needle === "gst-settings") return "invoicing_redirect";
  if (needle === "ai" || needle === "ai-settings" || needle === "intelligence") return "ai_settings_redirect";
  if (needle === "pipelines" || needle === "pipeline" || needle === "stages") return "pipelines_redirect";
  if (needle === "lead-sources" || needle === "leadsources" || needle === "sources") return "lead_sources_redirect";
  if (needle === "sales-preferences" || needle === "sales") return "sales_preferences_redirect";
  if (needle === "revenue-targets" || needle === "targets") return "revenue_targets_redirect";

  return "profile";
}

/**
 * Resolves item metadata for header and breadcrumbs.
 */
export function getSettingsItemMetadata(sectionId: string): {
  item: SettingsNavItem;
  category: SettingsCategory;
} {
  const canonicalId = resolveCanonicalSectionId(sectionId);

  for (const category of SETTINGS_NAVIGATION) {
    for (const item of category.items) {
      if (item.id === canonicalId) {
        return { item, category };
      }
    }
  }

  // Fallback
  const defaultCategory = SETTINGS_NAVIGATION[0];
  const defaultItem = defaultCategory.items[0];
  return { item: defaultItem, category: defaultCategory };
}

/**
 * Filters the settings navigation by authenticated user's role and permissions.
 */
export function getAuthorizedSettingsNav(
  role?: string,
  permissions: string[] = [],
  isSuperAdmin = false
): SettingsCategory[] {
  const authContext = {
    role: role || CRM_ROLES.EMPLOYEE,
    permissions,
    isSuperAdmin,
  };

  const filteredCategories: SettingsCategory[] = [];

  for (const category of SETTINGS_NAVIGATION) {
    const authorizedItems = category.items.filter((item) => {
      if (!item.isAuthorized) return true;
      return item.isAuthorized(authContext);
    });

    if (authorizedItems.length > 0) {
      filteredCategories.push({
        ...category,
        items: authorizedItems,
      });
    }
  }

  return filteredCategories;
}

/**
 * Checks if a specific section is authorized for the given role/permissions.
 */
export function isSectionAuthorized(
  sectionId: string,
  role?: string,
  permissions: string[] = [],
  isSuperAdmin = false
): boolean {
  const canonicalId = resolveCanonicalSectionId(sectionId);
  const authorizedCategories = getAuthorizedSettingsNav(role, permissions, isSuperAdmin);

  for (const cat of authorizedCategories) {
    if (cat.items.some((item) => item.id === canonicalId)) {
      return true;
    }
  }
  return false;
}
