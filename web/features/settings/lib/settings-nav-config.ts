import React from "react";
import {
  User,
  Palette,
  Bell,
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  Target,
  Kanban,
  Layers,
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
    id: "personal",
    title: "Personal",
    items: [
      {
        id: "profile",
        label: "My Profile",
        icon: User,
        description: "Manage your personal information and account details.",
      },
      {
        id: "preferences",
        label: "Preferences",
        icon: Palette,
        description: "Customize how ClixProCRM works for you.",
        aliases: ["personalization"],
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
        description: "Manage your workspace configuration and defaults.",
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
        aliases: ["team"],
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
        description: "Control what each role can access and manage.",
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
      {
        id: "billing",
        label: "Subscription & Billing",
        icon: CreditCard,
        description: "Manage your plan, billing and subscription details.",
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
    id: "sales",
    title: "Sales",
    items: [
      {
        id: "sales-preferences",
        label: "Sales Preferences",
        icon: TrendingUp,
        description: "Configure default sales workflows, stages, and deal parameters.",
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER || r === CRM_ROLES.SALES) return true;
          return (
            permissions.includes(PERMISSIONS.DEALS_READ) ||
            permissions.includes(PERMISSIONS.PIPELINE_READ) ||
            permissions.includes(PERMISSIONS.SETTINGS_MANAGE)
          );
        },
      },
      {
        id: "revenue-targets",
        label: "Revenue Targets",
        icon: Target,
        description: "Set, track, and manage organization and team revenue goals.",
        aliases: ["targets"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER || r === CRM_ROLES.SALES) return true;
          return (
            permissions.includes(PERMISSIONS.REPORTS_READ) ||
            permissions.includes(PERMISSIONS.DEALS_READ) ||
            permissions.includes(PERMISSIONS.SETTINGS_MANAGE)
          );
        },
      },
      {
        id: "pipelines",
        label: "Pipelines & Stages",
        icon: Kanban,
        description: "Customize deal pipelines, stages, and stage transition rules.",
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER) return true;
          return (
            permissions.includes(PERMISSIONS.PIPELINE_READ) ||
            permissions.includes(PERMISSIONS.PIPELINE_UPDATE) ||
            permissions.includes(PERMISSIONS.PIPELINE_CREATE) ||
            permissions.includes(PERMISSIONS.SETTINGS_MANAGE)
          );
        },
      },
      {
        id: "lead-sources",
        label: "Lead Sources",
        icon: Layers,
        description: "Manage inbound lead channels, source categories, and routing.",
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER || r === CRM_ROLES.SALES) return true;
          return (
            permissions.includes(PERMISSIONS.LEADS_READ) ||
            permissions.includes(PERMISSIONS.LEADS_CREATE) ||
            permissions.includes(PERMISSIONS.SETTINGS_MANAGE)
          );
        },
      },
    ],
  },
  {
    id: "automation-ai",
    title: "Automation & AI",
    items: [
      {
        id: "ai-settings",
        label: "AI Settings",
        icon: Sparkles,
        description: "Configure AI capabilities and workspace AI preferences.",
        aliases: ["ai"],
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("ai.manage");
        },
      },
      {
        id: "automation",
        label: "Automation",
        icon: Zap,
        description: "Configure automated workflows, assignment rules, and trigger actions.",
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN || r === CRM_ROLES.MANAGER) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("automation.manage");
        },
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: Boxes,
        description: "Manage third-party integrations, webhooks, and API connections.",
        isAuthorized: ({ role, permissions, isSuperAdmin }) => {
          if (isSuperAdmin) return true;
          const r = normalizeRole(role);
          if (r === CRM_ROLES.SUPER_ADMIN || r === CRM_ROLES.ADMIN) return true;
          return permissions.includes(PERMISSIONS.SETTINGS_MANAGE) || permissions.includes("integrations.manage");
        },
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        id: "security-privacy",
        label: "Security & Privacy",
        icon: ShieldAlert,
        description: "Manage account security, sessions and privacy controls.",
        aliases: ["security"],
      },
      {
        id: "sessions",
        label: "Login & Sessions",
        icon: Laptop,
        description: "Monitor active devices, authenticated sessions, and sign-in locations.",
      },
      {
        id: "audit-log",
        label: "Audit Log",
        icon: History,
        description: "Review security activity, authentication history, and system audit logs.",
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
        description: "Access documentation, user guides, and product tutorials.",
        aliases: ["help"],
      },
      {
        id: "contact-support",
        label: "Contact Support",
        icon: LifeBuoy,
        description: "Get help from our technical support team and submit tickets.",
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
