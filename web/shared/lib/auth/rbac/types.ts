import type React from "react";

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
