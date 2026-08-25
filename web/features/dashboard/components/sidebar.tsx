"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { useSidebar } from "@/features/dashboard/components/SidebarContext";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useWorkspace } from "@/shared/hooks/use-settings";
import { usePlatformNavigation } from "@/shared/hooks/use-platform-navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { BaseSidebar, BaseSidebarContent } from "@/shared/components/sidebar/BaseSidebar";
import { ClixProIcon } from "@/shared/ui/logo";
import { PlanBadgePopover } from "@/shared/components/PlanBadgePopover";

export function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, access } = useAuth();
  const { data: workspace } = useWorkspace();
  const { groups: menuGroups } = usePlatformNavigation();

  const companyName = workspace?.name || user?.companyName || "Clixpro Workspace";
  const companyLogo = workspace?.logo ?? user?.companyLogo;

  const hasHelpAccess = access.permissions.includes("Help Center") || user?.role?.toUpperCase() === "ADMIN";

  const isHelpActive = pathname === "/help";

  const logoElement = companyLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={companyLogo}
      alt={companyName}
      className="w-full h-full object-cover rounded-xl"
    />
  ) : (
    <ClixProIcon pixelSize={isMobile ? 24 : 26} />
  );

  const helpFooter = hasHelpAccess ? (
    <Link
      href="/help"
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[13.5px] font-medium outline-none ${
        isHelpActive
          ? "text-sidebar-primary bg-sidebar-primary/10 dark:bg-sidebar-primary/20 font-bold shadow-sm border border-sidebar-primary/15"
          : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
      }`}
    >
      <LifeBuoy className="w-[18px] h-[18px] transition-colors shrink-0" />
      <span className="flex-1 text-left truncate">Help Center</span>
    </Link>
  ) : undefined;

  const collapsedHelpFooter = hasHelpAccess ? (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/help"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 outline-none ${
              isHelpActive
                ? "text-sidebar-primary bg-sidebar-primary/15 dark:bg-sidebar-primary/20 shadow-sm border border-sidebar-primary/20 font-bold"
                : "text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
            }`}
          >
            <LifeBuoy className="w-5 h-5 shrink-0" />
            <span className="text-[10px] leading-tight mt-1 font-medium truncate max-w-[60px]">Help</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={14}
          className="bg-slate-900 dark:bg-slate-950 text-white border border-white/10 rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
        >
          Help Center
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : undefined;

  return (
    <BaseSidebarContent
      groups={menuGroups}
      header={{
        title: companyName,
        subtitle: "Workspace",
        badgeElement: <PlanBadgePopover size="xs" />,
        logo: logoElement,
        collapsedTag: "CRM",
      }}
      footer={helpFooter}
      collapsedFooter={collapsedHelpFooter}
      isMobile={isMobile}
      isCollapsed={isCollapsed}
      onToggleCollapse={toggleSidebar}
      variant="primary"
      activeLayoutIdPrefix="crm"
    />
  );
}

export default function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, access } = useAuth();
  const { data: workspace } = useWorkspace();
  const { groups: menuGroups } = usePlatformNavigation();
  const pathname = usePathname();

  const companyName = workspace?.name || user?.companyName || "Clixpro Workspace";
  const companyLogo = workspace?.logo ?? user?.companyLogo;

  const hasHelpAccess = access.permissions.includes("Help Center") || user?.role?.toUpperCase() === "ADMIN";

  const isHelpActive = pathname === "/help";

  const logoElement = companyLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={companyLogo}
      alt={companyName}
      className="w-full h-full object-cover rounded-xl"
    />
  ) : (
    <ClixProIcon pixelSize={26} />
  );

  const helpFooter = hasHelpAccess ? (
    <Link
      href="/help"
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[13.5px] font-medium outline-none ${
        isHelpActive
          ? "text-sidebar-primary bg-sidebar-primary/10 dark:bg-sidebar-primary/20 font-bold shadow-sm"
          : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
      }`}
    >
      <LifeBuoy className="w-[18px] h-[18px] transition-colors shrink-0" />
      <span className="flex-1 text-left truncate">Help Center</span>
    </Link>
  ) : undefined;

  const collapsedHelpFooter = hasHelpAccess ? (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/help"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 outline-none ${
              isHelpActive
                ? "text-sidebar-primary bg-sidebar-primary/15 dark:bg-sidebar-primary/20 shadow-sm border border-sidebar-primary/20 font-bold"
                : "text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
            }`}
          >
            <LifeBuoy className="w-5 h-5 shrink-0" />
            <span className="text-[10px] leading-tight mt-1 font-medium truncate max-w-[60px]">Help</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={14}
          className="bg-slate-900 dark:bg-slate-950 text-white border border-white/10 rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
        >
          Help Center
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : undefined;

  return (
    <BaseSidebar
      groups={menuGroups}
      header={{
        title: companyName,
        subtitle: "Workspace",
        badgeElement: <PlanBadgePopover size="xs" />,
        logo: logoElement,
        collapsedTag: "CRM",
      }}
      footer={helpFooter}
      collapsedFooter={collapsedHelpFooter}
      isCollapsed={isCollapsed}
      onToggleCollapse={toggleSidebar}
      variant="primary"
      activeLayoutIdPrefix="crm"
    />
  );
}

