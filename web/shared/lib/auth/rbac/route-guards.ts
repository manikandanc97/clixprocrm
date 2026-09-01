import { CRM_ROLES, type RoleKey } from "./roles";

export const roleRouteConfig: Record<RoleKey, string[]> = {
  [CRM_ROLES.SUPER_ADMIN]: [
    "*",
    "/super-admin",
    "/super-admin/ai",
    "/super-admin/organizations",
    "/super-admin/modules",
    "/super-admin/users",
    "/super-admin/plans",
    "/super-admin/billing",
    "/super-admin/analytics",
    "/super-admin/security",
    "/super-admin/security/operations",
    "/super-admin/audit-logs",
    "/super-admin/settings",
    "/dashboard",
    "/ai",
    "/contacts",
    "/leads",
    "/customers",
    "/companies",
    "/deals",
    "/pipeline",
    "/tasks",
    "/calendar",
    "/quotations",
    "/invoices",
    "/reports",
    "/analytics",
    "/ai-insights",
    "/employees",
    "/role-management",
    "/settings",
    "/help",
    "/support",
    "/pricing",
  ],
  [CRM_ROLES.ADMIN]: [
    "/dashboard",
    "/ai",
    "/contacts",
    "/leads",
    "/customers",
    "/companies",
    "/deals",
    "/pipeline",
    "/tasks",
    "/calendar",
    "/quotations",
    "/invoices",
    "/reports",
    "/analytics",
    "/ai-insights",
    "/employees",
    "/role-management",
    "/settings",
    "/help",
    "/support",
    "/pricing",
  ],
  [CRM_ROLES.MANAGER]: [
    "/dashboard",
    "/ai",
    "/contacts",
    "/leads",
    "/customers",
    "/companies",
    "/deals",
    "/pipeline",
    "/tasks",
    "/calendar",
    "/quotations",
    "/invoices",
    "/reports",
    "/team-performance",
    "/settings",
    "/help",
    "/support",
    "/pricing",
  ],
  [CRM_ROLES.SALES]: [
    "/dashboard",
    "/ai",
    "/contacts",
    "/my-leads",
    "/customers",
    "/companies",
    "/deals",
    "/tasks",
    "/calendar",
    "/quotations",
    "/invoices",
    "/settings",
    "/help",
    "/support",
    "/pricing",
  ],
  [CRM_ROLES.SUPPORT]: [
    "/dashboard",
    "/ai",
    "/contacts",
    "/customers",
    "/companies",
    "/support-tickets",
    "/tasks",
    "/calendar",
    "/settings",
    "/help",
    "/support",
    "/pricing",
  ],
  [CRM_ROLES.EMPLOYEE]: [
    "/dashboard",
    "/ai",
    "/tasks",
    "/calendar",
    "/settings",
    "/help",
    "/support",
    "/pricing",
  ],
};

export function isRouteAllowed(pathname: string, allowedRoutes: string[]): boolean {
  if (pathname === "/" || pathname === "/unauthorized") {
    return true;
  }

  // Universal modules accessible to all authenticated workspace users
  if (
    pathname === "/ai" ||
    pathname.startsWith("/ai/") ||
    pathname === "/pricing" ||
    pathname.startsWith("/pricing/")
  ) {
    return true;
  }

  if (allowedRoutes.includes("*")) {
    return true;
  }

  return allowedRoutes.some((route) => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}
