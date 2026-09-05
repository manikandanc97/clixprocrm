import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/components/auth-provider";
import { fetchPlatformNavigation } from "@/shared/lib/api/super-admin.api";
import { getRoleMenu, NavGroup, NavItem } from "@/shared/lib/auth/rbac";
import { getDynamicIcon } from "@/shared/lib/icons/dynamic-icon";

export function usePlatformNavigation() {
  const { user, access, isAuthenticated } = useAuth();

  const {
    data: dynamicModules,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["platform-navigation", user?.id, user?.role, access.permissions],
    queryFn: fetchPlatformNavigation,
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 30000,
    retry: 1,
  });

  const staticMenuGroups = useMemo(() => {
    return getRoleMenu(user?.role, access.permissions);
  }, [user?.role, access.permissions]);

  const menuGroups: NavGroup[] = useMemo(() => {
    // If no dynamic modules returned yet, return static fallback
    if (!dynamicModules || dynamicModules.length === 0) {
      return staticMenuGroups;
    }

    // Group dynamic modules by their 'group' property preserving sort order
    const groupMap = new Map<string, NavItem[]>();
    const groupOrder: string[] = [];

    // Filter only enabled and visible modules (backend already filters, but frontend safety guard)
    const visibleModules = dynamicModules.filter(
      (m) => m.isEnabled !== false && m.isVisible !== false
    );

    for (const mod of visibleModules) {
      const groupName = mod.group || "Core";
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
        groupOrder.push(groupName);
      }

      const IconComponent = getDynamicIcon(mod.icon);

      groupMap.get(groupName)!.push({
        title: mod.label,
        href: mod.route,
        icon: IconComponent,
      });
    }

    const result: NavGroup[] = groupOrder
      .filter((grpName) => (groupMap.get(grpName)?.length || 0) > 0)
      .map((grpName) => ({
        label: grpName,
        items: groupMap.get(grpName) || [],
      }));

    return result.length > 0 ? result : staticMenuGroups;
  }, [dynamicModules, staticMenuGroups]);

  return {
    groups: menuGroups,
    rawModules: dynamicModules || [],
    isLoading,
    isError,
    refetch,
  };
}
