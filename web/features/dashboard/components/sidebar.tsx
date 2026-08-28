"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LifeBuoy, Sparkles } from "lucide-react";
import { useSidebar } from "@/features/dashboard/components/SidebarContext";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useWorkspace } from "@/shared/hooks/use-settings";
import { usePlatformNavigation } from "@/shared/hooks/use-platform-navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { BaseSidebar, BaseSidebarContent } from "@/shared/components/sidebar/BaseSidebar";
import { NavAnimatedIcon } from "@/shared/components/sidebar/NavAnimatedIcon";
import { ClixProIcon } from "@/shared/ui/logo";
import { PlanBadgePopover } from "@/shared/components/PlanBadgePopover";

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

function UpgradeFooterItem({
  isUpgradeActive,
  collapsed = false,
}: {
  isUpgradeActive: boolean;
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
              href="/pricing"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setClickKey((c: number) => c + 1)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 outline-none ${
                isUpgradeActive
                  ? "text-primary bg-primary/15 dark:bg-primary/25 shadow-sm border border-primary/25 font-semibold"
                  : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
              }`}
            >
              <NavAnimatedIcon
                icon={Sparkles}
                name="Upgrade"
                href="/pricing"
                isActive={isUpgradeActive}
                isHovered={isHovered}
                triggerAnimation={clickKey}
                size={18}
                className="w-[18px] h-[18px] shrink-0 text-amber-500 dark:text-amber-400"
              />
              <span className="text-[9.5px] leading-tight mt-1 font-medium truncate max-w-[58px]">Upgrade</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={14}
            className="bg-slate-900 dark:bg-slate-950 text-white border border-white/10 rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
          >
            Upgrade & Plans
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      href="/pricing"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setClickKey((c: number) => c + 1)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-[13.5px] font-medium outline-none ${
        isUpgradeActive
          ? "text-primary bg-primary/10 dark:bg-primary/20 font-semibold shadow-sm border border-primary/20"
          : "text-sidebar-foreground/80 hover:text-primary hover:bg-primary/10"
      }`}
    >
      <NavAnimatedIcon
        icon={Sparkles}
        name="Upgrade"
        href="/pricing"
        isActive={isUpgradeActive}
        isHovered={isHovered}
        triggerAnimation={clickKey}
        size={18}
        className="w-[18px] h-[18px] text-amber-500 dark:text-amber-400 shrink-0"
      />
      <span className="flex-1 text-left truncate font-semibold">Upgrade</span>
      <span className="text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        Plan
      </span>
    </Link>
  );
}

export function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, access } = useAuth();
  const { data: workspace } = useWorkspace();
  const { groups: menuGroups } = usePlatformNavigation();

  const companyName = workspace?.name || user?.companyName || "Clixpro Workspace";
  const companyLogo = workspace?.logo ?? user?.companyLogo;

  const hasHelpAccess = access.permissions.includes("Help Center") || access.permissions.includes("Support") || user?.role?.toUpperCase() === "ADMIN" || true;

  const isHelpActive = pathname === "/help";
  const isUpgradeActive = (pathname === "/settings" && searchParams?.get("section") === "billing") || pathname === "/pricing";

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

  const footerElement = (
    <div className="flex flex-col gap-1 w-full">
      {hasHelpAccess && <HelpFooterItem isHelpActive={isHelpActive} />}
      <UpgradeFooterItem isUpgradeActive={isUpgradeActive} />
    </div>
  );

  const collapsedFooterElement = (
    <div className="flex flex-col gap-1 w-full">
      {hasHelpAccess && <HelpFooterItem isHelpActive={isHelpActive} collapsed />}
      <UpgradeFooterItem isUpgradeActive={isUpgradeActive} collapsed />
    </div>
  );

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
      footer={footerElement}
      collapsedFooter={collapsedFooterElement}
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
  const searchParams = useSearchParams();

  const companyName = workspace?.name || user?.companyName || "Clixpro Workspace";
  const companyLogo = workspace?.logo ?? user?.companyLogo;

  const hasHelpAccess = access.permissions.includes("Help Center") || access.permissions.includes("Support") || user?.role?.toUpperCase() === "ADMIN" || true;

  const isHelpActive = pathname === "/help";
  const isUpgradeActive = (pathname === "/settings" && searchParams?.get("section") === "billing") || pathname === "/pricing";

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

  const footerElement = (
    <div className="flex flex-col gap-1 w-full">
      {hasHelpAccess && <HelpFooterItem isHelpActive={isHelpActive} />}
      <UpgradeFooterItem isUpgradeActive={isUpgradeActive} />
    </div>
  );

  const collapsedFooterElement = (
    <div className="flex flex-col gap-1 w-full">
      {hasHelpAccess && <HelpFooterItem isHelpActive={isHelpActive} collapsed />}
      <UpgradeFooterItem isUpgradeActive={isUpgradeActive} collapsed />
    </div>
  );

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
      footer={footerElement}
      collapsedFooter={collapsedFooterElement}
      isCollapsed={isCollapsed}
      onToggleCollapse={toggleSidebar}
      variant="primary"
      activeLayoutIdPrefix="crm"
    />
  );
}

