import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSuperAdminNavigation,
  PlatformModule,
} from "@/shared/lib/api/super-admin.api";
import { getDynamicIcon } from "@/shared/lib/icons/dynamic-icon";
import type { NavGroup, NavItem } from "@/shared/lib/auth/rbac";

// ============================================================
// STATIC FALLBACK — used when API is unavailable or erroring.
// Mirrors the structure that was previously hardcoded in super-admin-sidebar.tsx
// ============================================================
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  UserCog,
  Layers,
  Ticket,
  CreditCard,
  Receipt,
  Brain,
  BarChart3,
  ShieldCheck,
  Activity,
  FileClock,
  Settings,
} from "lucide-react";

const STATIC_SUPER_ADMIN_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Overview",
        href: "/super-admin",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "ClixPro AI", href: "/super-admin/copilot", icon: Sparkles },
      { title: "Organizations", href: "/super-admin/organizations", icon: Building2 },
      { title: "Platform Users", href: "/super-admin/users", icon: UserCog },
      { title: "Platform Modules", href: "/super-admin/modules", icon: Layers },
      { title: "Support Inbox", href: "/super-admin/support", icon: Ticket },
    ],
  },
  {
    label: "Commerce",
    items: [
      { title: "Plans & Packages", href: "/super-admin/plans", icon: CreditCard },
      { title: "Billing & Revenue", href: "/super-admin/billing", icon: Receipt },
    ],
  },
  {
    label: "AI Platform",
    items: [
      { title: "AI Models & Tiers", href: "/super-admin/ai", icon: Brain },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", href: "/super-admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Security & Operations",
    items: [
      { title: "Security Center", href: "/super-admin/security", icon: ShieldCheck },
      { title: "SecOps Telemetry", href: "/super-admin/security/operations", icon: Activity },
      { title: "Audit Logs", href: "/super-admin/audit-logs", icon: FileClock },
    ],
  },
  {
    label: "Configuration",
    items: [
      { title: "Platform Settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

// ============================================================
// QUERY KEY — used by mutations to invalidate the super admin nav cache
// ============================================================
export const SUPER_ADMIN_NAV_QUERY_KEY = ["super-admin-navigation"] as const;

// ============================================================
// HOOK
// ============================================================

export function useSuperAdminNavigation() {
  const {
    data: dynamicModules,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: SUPER_ADMIN_NAV_QUERY_KEY,
    queryFn: fetchSuperAdminNavigation,
    staleTime: 30_000,
    retry: 1,
  });

  const groups: NavGroup[] = useMemo(() => {
    // Use static fallback if API hasn't returned yet or errored
    if (!dynamicModules || dynamicModules.length === 0) {
      return STATIC_SUPER_ADMIN_GROUPS;
    }

    // Build groups from DB data, preserving sortOrder
    const groupMap = new Map<string, NavItem[]>();
    const groupOrder: string[] = [];

    for (const mod of dynamicModules) {
      const groupName = mod.group || "Platform";
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
        groupOrder.push(groupName);
      }

      const IconComponent = getDynamicIcon(mod.icon);

      groupMap.get(groupName)!.push({
        title: mod.label,
        href: mod.route,
        icon: IconComponent,
        // Overview route needs exact matching to not stay active for all /super-admin/* routes
        exact: mod.route === "/super-admin",
      });
    }

    const result: NavGroup[] = groupOrder
      .filter((grpName) => (groupMap.get(grpName)?.length || 0) > 0)
      .map((grpName) => ({
        label: grpName,
        items: groupMap.get(grpName) || [],
      }));

    return result.length > 0 ? result : STATIC_SUPER_ADMIN_GROUPS;
  }, [dynamicModules]);

  return {
    groups,
    rawModules: dynamicModules || [],
    isLoading,
    isError,
    refetch,
  };
}

/**
 * Convenience hook to get the query client invalidation function for super admin navigation.
 * Call this after any Super Admin navigation mutation.
 */
export function useInvalidateSuperAdminNav() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_NAV_QUERY_KEY });
}

