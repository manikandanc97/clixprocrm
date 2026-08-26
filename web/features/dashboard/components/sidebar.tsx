"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { useSidebar } from "@/features/dashboard/components/SidebarContext";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useWorkspace } from "@/shared/hooks/use-settings";
import { usePlatformNavigation } from "@/shared/hooks/use-platform-navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { BaseSidebar, BaseSidebarContent } from "@/shared/components/sidebar/BaseSidebar";
import { NavAnimatedIcon } from "@/shared/components/sidebar/NavAnimatedIcon";
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

  const hasHelpAccess = access.permissions.includes("Help Center") || access.permissions.includes("Support") || user?.role?.toUpperCase() === "ADMIN" || true;

  const isHelpActive = pathname === "/help";

  const logoElement = companyLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={companyLogo}
      alt={companyName}
      className="w-full h-full object-cover rounded-xl"
    />
  ) : (
    <ClixProIcon pixelSize={isMobile ? 24 : 22} />
  );

function HelpFooterItem({
  isHelpActive,
  collapsed = false,
}: {
  isHelpActive: boolean;
  collapsed?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [clickKey, setClickKey] = useState(0);

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/help"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setClickKey((c: number) => c + 1)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 outline-none ${
                isHelpActive
                  ? "text-sidebar-primary bg-sidebar-primary/15 dark:bg-sidebar-primary/20 shadow-sm border border-sidebar-primary/20 font-semibold"
                  : "text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
              }`}
            >
              <NavAnimatedIcon
                icon={LifeBuoy}
                name="Support"
                href="/help"
                isActive={isHelpActive}
                isHovered={isHovered}
                triggerAnimation={clickKey}
                size={18}
                className="w-[18px] h-[18px] shrink-0"
              />
              <span className="text-[9.5px] leading-tight mt-1 font-medium truncate max-w-[58px]">Support</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={14}
            className="bg-slate-900 dark:bg-slate-950 text-white border border-white/10 rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
          >
            Support
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      href="/help"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setClickKey((c: number) => c + 1)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-[13.5px] font-medium outline-none ${
        isHelpActive
          ? "text-sidebar-primary bg-sidebar-primary/10 dark:bg-sidebar-primary/20 font-semibold shadow-sm border border-sidebar-primary/15"
          : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
      }`}
    >
      <NavAnimatedIcon
        icon={LifeBuoy}
        name="Support"
        href="/help"
        isActive={isHelpActive}
        isHovered={isHovered}
        triggerAnimation={clickKey}
        size={18}
        className="w-[18px] h-[18px] transition-colors shrink-0"
      />
      <span className="flex-1 text-left truncate">Support</span>
    </Link>
  );
}

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
      footer={hasHelpAccess ? <HelpFooterItem isHelpActive={isHelpActive} /> : undefined}
      collapsedFooter={hasHelpAccess ? <HelpFooterItem isHelpActive={isHelpActive} collapsed /> : undefined}
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

  const hasHelpAccess = access.permissions.includes("Help Center") || access.permissions.includes("Support") || user?.role?.toUpperCase() === "ADMIN" || true;

  const isHelpActive = pathname === "/help";

  const logoElement = companyLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={companyLogo}
      alt={companyName}
      className="w-full h-full object-cover rounded-xl"
    />
  ) : (
    <ClixProIcon pixelSize={22} />
  );

  const helpFooter = hasHelpAccess ? (
    <Link
      href="/help"
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-[13.5px] font-medium outline-none ${
        isHelpActive
          ? "text-sidebar-primary bg-sidebar-primary/10 dark:bg-sidebar-primary/20 font-semibold shadow-sm"
          : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
      }`}
    >
      <NavAnimatedIcon
        icon={LifeBuoy}
        name="Support"
        href="/help"
        isActive={isHelpActive}
        size={18}
        className="w-[18px] h-[18px] transition-colors shrink-0"
      />
      <span className="flex-1 text-left truncate">Support</span>
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
                ? "text-sidebar-primary bg-sidebar-primary/15 dark:bg-sidebar-primary/20 shadow-sm border border-sidebar-primary/20 font-semibold"
                : "text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
            }`}
          >
            <NavAnimatedIcon
              icon={LifeBuoy}
              name="Support"
              href="/help"
              isActive={isHelpActive}
              size={18}
              className="w-[18px] h-[18px] shrink-0"
            />
            <span className="text-[9.5px] leading-tight mt-1 font-medium truncate max-w-[58px]">Support</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={14}
          className="bg-slate-900 dark:bg-slate-950 text-white border border-white/10 rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
        >
          Support
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

