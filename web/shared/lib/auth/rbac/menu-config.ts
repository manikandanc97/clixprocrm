import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckSquare,
  FileText,
  Handshake,
  History,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  UserSquare2,
} from "lucide-react";
import { CRM_ROLES, type RoleKey } from "./roles";
import type { NavGroup, NavItem } from "../rbac";

export const navLibrary: Record<string, NavItem> = {
  dashboard: { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  contacts: { title: "Contacts", href: "/contacts", icon: Users },
  companies: { title: "Companies", href: "/companies", icon: Building2 },
  deals: { title: "Deals", href: "/deals", icon: Handshake },
  tasks: { title: "Tasks", href: "/tasks", icon: CheckSquare },
  calendar: { title: "Calendar", href: "/calendar", icon: CalendarDays },
  quotations: { title: "Quotations", href: "/quotations", icon: FileText },
  invoices: { title: "Invoices", href: "/invoices", icon: Receipt },
  ai: { title: "ClixPro AI", href: "/ai", icon: Sparkles },
  reports: { title: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  employees: { title: "Employees", href: "/employees", icon: UserSquare2 },
  roleManagement: {
    title: "Role Management",
    href: "/role-management",
    icon: ShieldCheck,
  },
  settings: {
    title: "Settings",
    href: "/settings?section=general",
    icon: Settings,
    children: [
      {
        title: "General",
        href: "/settings?section=general",
        icon: Building2,
        permission: "settings.general",
      },
      {
        title: "Integrations & API",
        href: "/settings?section=integrations",
        icon: Boxes,
        permission: "integrations.manage",
      },
      {
        title: "Security & Privacy",
        href: "/settings?section=security-privacy",
        icon: ShieldAlert,
      },
      {
        title: "Audit Log",
        href: "/settings?section=audit-log",
        icon: History,
        permission: "audit.read",
      },
    ],
  },
  supportTickets: { title: "Support Tickets", href: "/support-tickets", icon: Ticket },
  teamPerformance: {
    title: "Team Performance",
    href: "/team-performance",
    icon: BriefcaseBusiness,
  },
  attendance: { title: "Attendance", href: "/attendance", icon: CalendarDays },
  performance: { title: "Performance", href: "/performance", icon: BarChart3 },
};

export const roleMenuConfig: Record<RoleKey, NavGroup[]> = {
  [CRM_ROLES.SUPER_ADMIN]: [
    {
      label: "Platform Control",
      items: [
        { title: "Super Admin Platform", href: "/super-admin", icon: ShieldCheck },
      ],
    },
    {
      label: "Core",
      items: [
        navLibrary.dashboard,
      ],
    },
    {
      label: "CRM",
      items: [
        navLibrary.contacts,
        navLibrary.companies,
        navLibrary.deals,
        navLibrary.tasks,
        navLibrary.calendar,
        navLibrary.quotations,
        navLibrary.invoices,
      ],
    },
    {
      label: "AI",
      items: [navLibrary.ai],
    },
    {
      label: "Insights",
      items: [navLibrary.reports],
    },
    {
      label: "Administration",
      items: [
        navLibrary.employees,
        navLibrary.roleManagement,
        navLibrary.settings,
      ],
    },
  ],
  [CRM_ROLES.ADMIN]: [
    {
      label: "Core",
      items: [navLibrary.dashboard],
    },
    {
      label: "CRM",
      items: [
        navLibrary.contacts,
        navLibrary.companies,
        navLibrary.deals,
        navLibrary.tasks,
        navLibrary.calendar,
        navLibrary.quotations,
        navLibrary.invoices,
      ],
    },
    {
      label: "AI",
      items: [navLibrary.ai],
    },
    {
      label: "Insights",
      items: [navLibrary.reports],
    },
    {
      label: "Administration",
      items: [
        navLibrary.employees,
        navLibrary.roleManagement,
        navLibrary.settings,
      ],
    },
  ],
  [CRM_ROLES.MANAGER]: [
    {
      label: "Core",
      items: [navLibrary.dashboard],
    },
    {
      label: "CRM",
      items: [
        navLibrary.contacts,
        navLibrary.companies,
        navLibrary.deals,
        navLibrary.tasks,
        navLibrary.calendar,
        navLibrary.quotations,
        navLibrary.invoices,
      ],
    },
    {
      label: "AI",
      items: [navLibrary.ai],
    },
    {
      label: "Performance",
      items: [navLibrary.reports, navLibrary.teamPerformance],
    },
  ],
  [CRM_ROLES.SALES]: [
    {
      label: "Core",
      items: [navLibrary.dashboard],
    },
    {
      label: "CRM",
      items: [
        navLibrary.contacts,
        navLibrary.companies,
        navLibrary.deals,
        navLibrary.tasks,
        navLibrary.calendar,
        navLibrary.quotations,
        navLibrary.invoices,
      ],
    },
    {
      label: "AI",
      items: [navLibrary.ai],
    },
  ],
  [CRM_ROLES.SUPPORT]: [
    {
      label: "Core",
      items: [navLibrary.dashboard],
    },
    {
      label: "Support Workspace",
      items: [
        navLibrary.contacts,
        navLibrary.supportTickets,
        navLibrary.tasks,
        navLibrary.calendar,
      ],
    },
    {
      label: "AI",
      items: [navLibrary.ai],
    },
  ],
  [CRM_ROLES.EMPLOYEE]: [
    {
      label: "Core",
      items: [navLibrary.dashboard],
    },
    {
      label: "Daily Tasks",
      items: [
        navLibrary.tasks,
        navLibrary.calendar,
      ],
    },
    {
      label: "AI",
      items: [navLibrary.ai],
    },
  ],
};
