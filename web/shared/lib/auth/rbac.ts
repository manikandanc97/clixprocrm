import type React from "react";
import {
  Building2,
  Crown,
  ShieldCheck,
  Ticket,
  UserSquare2,
  Users,
} from "lucide-react";

// Re-export everything from modular files
export * from "./rbac/roles";
export * from "./rbac/permissions";
export * from "./rbac/menu-config";
export * from "./rbac/route-guards";

import { CRM_ROLES, type RoleKey } from "./rbac/roles";
import { roleMenuConfig, navLibrary } from "./rbac/menu-config";

// Maintain shared types for compatibility
export type RoleAccess = {
  roleName: string;
  description: string;
  permissions: string[];
  routes: string[];
  dashboardWidgets: string[];
  analyticsVisibility: "full" | "team" | "self" | "limited" | "hr";
};

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  match?: "exact" | "prefix";
  badge?: string | number;
  children?: NavItem[];
  permission?: string;
  isAuthorized?: (ctx: { role: string; permissions: string[]; isSuperAdmin?: boolean }) => boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Resolves whether a navigation item is active given the current pathname and URL,
 * with segment awareness, query parameter matching, mutual exclusivity, and longest-prefix priority.
 */
export function isNavRouteActive(
  targetHref: string | undefined,
  currentPathname: string,
  allHrefs: string[] = [],
  exactOnly?: boolean,
  currentUrl?: string
): boolean {
  if (!targetHref || targetHref === "#" || !currentPathname) return false;

  const normalize = (p: string) => {
    const withoutTrailing = p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
    return withoutTrailing;
  };

  const activeUrl = normalize(currentUrl || currentPathname);
  const target = normalize(targetHref);
  const current = normalize(currentPathname);

  // If target has query params (e.g. /settings?section=general)
  if (target.includes("?")) {
    return activeUrl === target;
  }

  // If activeUrl has query params but target does not (e.g. /settings vs /settings?section=profile)
  if (activeUrl.includes("?")) {
    const [activePath] = activeUrl.split("?");
    if (activePath === target) {
      // Check if any other item in allHrefs exactly matches the full activeUrl
      const hasSpecificQueryMatch = allHrefs.some((h) => normalize(h) === activeUrl);
      if (!hasSpecificQueryMatch) {
        return true;
      }
    }
  }

  // 1. Direct exact match
  if (current === target) return true;

  // 2. Overview / root dashboard routes should not match loosely as prefixes
  if (
    exactOnly ||
    target === "/super-admin" ||
    target === "/dashboard" ||
    target === "/"
  ) {
    return false;
  }

  // 3. Segment-aware prefix check (e.g. /super-admin/security/findings matches /super-admin/security)
  const isPrefixMatch = current.startsWith(`${target}/`);
  if (!isPrefixMatch) return false;

  // 4. Mutual exclusivity / longest prefix check:
  // If there is another sibling or menu item href that provides a longer/more specific match
  // for currentPathname, this parent item must yield to the more specific item.
  const hasMoreSpecificMatch = allHrefs.some((otherHref) => {
    if (!otherHref || otherHref === target || otherHref === "#") return false;
    const other = normalize(otherHref);
    const otherMatches = current === other || current.startsWith(`${other}/`);
    return otherMatches && other.length > target.length;
  });

  return !hasMoreSpecificMatch;
}

export const defaultRoleAccess: RoleAccess = {
  roleName: "Employee",
  description: "Limited assigned features only.",
  permissions: [],
  routes: ["/dashboard"],
  dashboardWidgets: [],
  analyticsVisibility: "self",
};

/**
 * Role mapping for backward compatibility
 */
const legacyRoleMap: Record<string, RoleKey> = {
  "super_admin": CRM_ROLES.SUPER_ADMIN,
  "superadmin": CRM_ROLES.SUPER_ADMIN,
  "admin": CRM_ROLES.ADMIN,
  "owner": CRM_ROLES.ADMIN,
  "is_org_owner": CRM_ROLES.ADMIN,
  "sales_manager": CRM_ROLES.MANAGER,
  "sales_executive": CRM_ROLES.SALES,
  "support_executive": CRM_ROLES.SUPPORT,
  "hr_manager": CRM_ROLES.MANAGER,
  "staff": CRM_ROLES.EMPLOYEE,
};

export function normalizeRole(role?: string): RoleKey {
  if (!role) return CRM_ROLES.EMPLOYEE;
  
  const upper = role.trim().toUpperCase();
  // Try direct match
  if (Object.values(CRM_ROLES).includes(upper as RoleKey)) {
    return upper as RoleKey;
  }

  const lower = role.trim().toLowerCase();
  // Try legacy map
  if (lower in legacyRoleMap) {
    return legacyRoleMap[lower];
  }

  return CRM_ROLES.EMPLOYEE;
}

export const MODULE_SYNONYMS: Record<string, string[]> = {
  "Dashboard": ["dashboard", "dashboard.view"],
  "Contacts": ["contacts", "contacts.read", "contacts.create", "contacts.update", "contacts.delete"],
  "Companies": ["companies", "companies.read", "companies.create", "companies.update", "companies.delete"],
  "Deals": ["deals", "deals.read", "deals.create", "deals.update", "deals.delete"],
  "Tasks": ["tasks", "tasks.read", "tasks.create", "tasks.update", "tasks.delete"],
  "Calendar": ["calendar"],
  "Quotations": ["quotations", "quotations.read", "quotations.create", "quotations.update", "quotations.delete", "quotations.approve"],
  "Invoices": ["invoices", "invoices.read", "invoices.create", "invoices.update", "invoices.delete", "invoices.send", "invoices.payment", "billing", "invoice"],
  "ClixPro AI": ["clixpro ai", "clixpro_ai", "ai", "ai.view", "ai.access", "ai.chat", "ai_assistant", "ai assistant", "clixproai"],
  "Reports & Analytics": ["reports & analytics", "reports", "report", "analytics", "reports.read", "reports:read", "reports:view", "reports.view"],
  "Employees": ["employees", "employee", "employees.read", "employees.manage", "employees:view", "employees:manage"],
  "Role Management": ["role management", "roles", "role", "role_management", "roles:manage", "roles:view", "rolemanagement", "role_management.read", "role_management.manage", "roles.read", "roles.manage"],
  "Settings": ["settings", "settings.read", "settings.manage", "settings:view", "settings:manage"],
  "Support Tickets": ["support tickets", "support", "ticket", "tickets", "support_tickets", "support_tickets.read", "support_tickets.manage"],
  "Team Performance": ["team performance", "teamperformance", "performance", "reports", "employees"],
  "Attendance": ["attendance", "attendance.read"],
  "Performance": ["performance", "performance.read"],
  "Help Center": ["help center", "help"],
};

export function normalizeToModuleTitle(perm: string): string | null {
  if (!perm) return null;
  const p = perm.trim().toLowerCase();
  for (const [title, synonyms] of Object.entries(MODULE_SYNONYMS)) {
    if (title.toLowerCase() === p || synonyms.some(s => s.toLowerCase() === p)) {
      return title;
    }
  }
  return null;
}

export function hasModuleAccess(itemTitle: string, permissions?: string[], role?: string): boolean {
  const roleKey = normalizeRole(role);
  if (roleKey === CRM_ROLES.SUPER_ADMIN || roleKey === CRM_ROLES.ADMIN) return true;
  if (itemTitle === "Dashboard" || itemTitle === "ClixPro AI" || itemTitle === "Help Center") return true;
  if (!permissions || permissions.length === 0) return false;
  
  const titleLower = itemTitle.toLowerCase();
  const synonyms = MODULE_SYNONYMS[itemTitle]?.map(s => s.toLowerCase()) || [titleLower];
  
  return permissions.some(p => {
    const pLower = p.trim().toLowerCase();
    if (pLower === titleLower || synonyms.includes(pLower)) return true;
    const normalized = normalizeToModuleTitle(p);
    return normalized === itemTitle;
  });
}

export function getRoleMenu(role?: string, permissions?: string[]) {
  const roleKey = normalizeRole(role);
  const baseMenu = roleMenuConfig[roleKey] || roleMenuConfig[CRM_ROLES.EMPLOYEE];
  
  // SUPER_ADMIN and ADMIN roles always get full base menu
  if (roleKey === CRM_ROLES.SUPER_ADMIN || roleKey === CRM_ROLES.ADMIN) {
    return baseMenu;
  }
  
  if (!permissions || permissions.length === 0) {
    return baseMenu;
  }
  
  const resultGroups: NavGroup[] = [];
  const handledTitles = new Set<string>();
  
  // 1. Filter base menu using permissions
  for (const group of baseMenu) {
    const filteredItems: NavItem[] = [];
    for (const item of group.items) {
      const hasPerm = hasModuleAccess(item.title, permissions, role);
      if (hasPerm) {
        handledTitles.add(item.title);
        if (item.children && item.children.length > 0) {
          const filteredChildren = item.children.filter((child) => {
            if (child.isAuthorized) {
              return child.isAuthorized({ role: role || "", permissions: permissions || [] });
            }
            if (child.permission) {
              return permissions?.includes(child.permission) || permissions?.includes("settings.manage") || permissions?.includes("Settings");
            }
            return true;
          });
          if (filteredChildren.length > 0) {
            filteredItems.push({
              ...item,
              children: filteredChildren,
            });
          }
        } else {
          filteredItems.push(item);
        }
      }
    }
    
    if (filteredItems.length > 0) {
      resultGroups.push({
        label: group.label,
        items: filteredItems,
      });
    }
  }
  
  // 2. Add items that are in permissions but not in base menu
  const missingItems: NavItem[] = [];
  for (const perm of permissions) {
    if (perm === "Help Center" || perm.toLowerCase() === "help") continue;
    const title = normalizeToModuleTitle(perm);
    if (title && !handledTitles.has(title)) {
      const navItem = Object.values(navLibrary).find(n => n.title === title);
      if (navItem && !handledTitles.has(navItem.title)) {
        handledTitles.add(navItem.title);
        missingItems.push(navItem);
      }
    }
  }
  
  if (missingItems.length > 0) {
    if (resultGroups.length > 0) {
      // Append to the first group (e.g. Workspace / Daily Tasks)
      resultGroups[0].items.push(...missingItems);
    } else {
      resultGroups.push({
        label: "Modules",
        items: missingItems,
      });
    }
  }
  
  return resultGroups;
}

export const roleAccent: Record<RoleKey, string> = {
  [CRM_ROLES.SUPER_ADMIN]: "from-amber-500 to-indigo-600",
  [CRM_ROLES.ADMIN]: "from-violet-500 to-purple-600",
  [CRM_ROLES.MANAGER]: "from-emerald-500 to-green-600",
  [CRM_ROLES.SALES]: "from-blue-500 to-cyan-600",
  [CRM_ROLES.SUPPORT]: "from-orange-500 to-amber-600",
  [CRM_ROLES.EMPLOYEE]: "from-rose-500 to-pink-600",
};

export const roleIcon: Record<RoleKey, React.ComponentType<{ className?: string }>> = {
  [CRM_ROLES.SUPER_ADMIN]: Crown,
  [CRM_ROLES.ADMIN]: ShieldCheck,
  [CRM_ROLES.MANAGER]: Building2,
  [CRM_ROLES.SALES]: Users,
  [CRM_ROLES.SUPPORT]: Ticket,
  [CRM_ROLES.EMPLOYEE]: UserSquare2,
};

export function getRoleBadge(role?: string) {
  const roleKey = normalizeRole(role);
  return {
    roleKey,
    style: {
      badge: "bg-primary/10 text-primary border-primary/20",
      text: "text-primary",
      bg: "bg-primary/10",
    },
    Icon: roleIcon[roleKey] || roleIcon[CRM_ROLES.EMPLOYEE],
  };
}

