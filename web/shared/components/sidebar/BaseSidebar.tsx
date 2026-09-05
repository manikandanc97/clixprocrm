"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { ClixProIcon } from "@/shared/ui/logo";
import { NavAnimatedIcon } from "@/shared/components/sidebar/NavAnimatedIcon";
import { MOTION_EASINGS } from "@/shared/lib/motion";
import { type NavGroup, type NavItem, isNavRouteActive } from "@/shared/lib/auth/rbac";
import { useAutoFadeScrollbar } from "@/shared/hooks/use-auto-fade-scrollbar";

export interface SidebarHeaderConfig {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
  };
  badgeElement?: React.ReactNode;
  collapsedTag?: string;
  logo?: React.ReactNode;
}

export interface BaseSidebarProps {
  groups: NavGroup[];
  header: SidebarHeaderConfig;
  footer?: React.ReactNode;
  collapsedFooter?: React.ReactNode;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  variant?: "primary" | "emerald";
  activeLayoutIdPrefix?: string;
  className?: string;
}

interface SidebarThemeClasses {
  logoBox: string;
  logoBoxHover: string;
  collapsedLogoBox: string;
  collapsedTag: string;
  badge: string;
  toggleBtn: string;
  itemActiveText: string;
  itemActiveBg: string;
  itemActiveCollapsedBg: string;
  activePill: string;
}

interface ItemComponentProps {
  item: NavItem;
  isActive: boolean;
  themeClasses: SidebarThemeClasses;
  activeLayoutIdPrefix: string;
}

function MobileNavItem({ item, isActive, themeClasses, activeLayoutIdPrefix }: ItemComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const Icon = item.icon;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setClickKey((c) => c + 1)}
    >
      <Link
        href={item.href || "#"}
        aria-current={isActive ? "page" : undefined}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 text-[13.5px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
          isActive
            ? `${themeClasses.itemActiveText} font-semibold shadow-sm`
            : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
        }`}
      >
        {isActive && (
          <>
            <motion.div
              layoutId={`${activeLayoutIdPrefix}MobileActiveBg`}
              transition={MOTION_EASINGS.springGlider}
              className={`absolute inset-0 rounded-xl ${themeClasses.itemActiveBg} border border-sidebar-primary/15`}
            />
            <motion.div
              layoutId={`${activeLayoutIdPrefix}MobileActivePill`}
              transition={MOTION_EASINGS.springGlider}
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r-full z-10 ${themeClasses.activePill}`}
            />
          </>
        )}
        <NavAnimatedIcon
          icon={Icon}
          name={item.title}
          href={item.href}
          isActive={isActive}
          isHovered={isHovered}
          triggerAnimation={clickKey}
          size={18}
          className={`w-[18px] h-[18px] shrink-0 transition-colors z-10 ${
            isActive ? themeClasses.itemActiveText : "text-sidebar-foreground/50 group-hover:text-primary"
          }`}
        />
        <span className="truncate flex-1 z-10">{item.title}</span>
      </Link>
    </motion.div>
  );
}

function MobileExpandableNavItem({
  item,
  isChildActive,
  themeClasses,
}: {
  item: NavItem;
  isChildActive: (child: NavItem) => boolean;
  themeClasses: SidebarThemeClasses;
}) {
  const isAnyChildActive = item.children?.some(isChildActive) ?? false;
  const [isOpen, setIsOpen] = useState(isAnyChildActive);
  const [isHovered, setIsHovered] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const Icon = item.icon;

  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isAnyChildActive]);

  return (
    <div className="flex flex-col">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          setClickKey((c) => c + 1);
          setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors duration-150 text-[13.5px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 cursor-pointer ${
          isAnyChildActive
            ? "text-sidebar-foreground font-semibold"
            : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
        }`}
      >
        <NavAnimatedIcon
          icon={Icon}
          name={item.title}
          href={item.href}
          isActive={isAnyChildActive}
          isHovered={isHovered}
          triggerAnimation={clickKey}
          size={18}
          className={`w-[18px] h-[18px] shrink-0 transition-colors z-10 ${
            isAnyChildActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-primary"
          }`}
        />
        <span className="truncate flex-1 text-left z-10">{item.title}</span>
        <ChevronRight
          className={`w-3.5 h-3.5 text-sidebar-foreground/40 group-hover:text-primary transition-transform duration-200 shrink-0 z-10 ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
        />
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden space-y-0.5 mt-1 ml-4 pl-3 border-l border-sidebar-border/50"
          >
            {item.children?.map((child) => {
              const active = isChildActive(child);
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href || child.title}
                  href={child.href}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors duration-150 text-[13px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    active
                      ? `${themeClasses.itemActiveText} font-semibold ${themeClasses.itemActiveBg} shadow-sm`
                      : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
                  }`}
                >
                  <ChildIcon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? themeClasses.itemActiveText : "text-sidebar-foreground/50 group-hover:text-primary"
                    }`}
                  />
                  <span className="truncate flex-1">{child.title}</span>
                  {active && (
                    <span className={`w-1.5 h-1.5 rounded-full ${themeClasses.activePill} shrink-0`} />
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DesktopCollapsedNavItem({ item, isActive, themeClasses, activeLayoutIdPrefix }: ItemComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileTap={{ scale: 0.96 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setClickKey((c) => c + 1)}
        >
          <Link
            href={item.href || "#"}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors duration-150 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
              isActive
                ? `${themeClasses.itemActiveText} font-semibold shadow-sm`
                : "text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
            }`}
          >
            {isActive && (
              <>
                <motion.div
                  layoutId={`${activeLayoutIdPrefix}CollapsedActiveBg`}
                  transition={MOTION_EASINGS.springGlider}
                  className={`absolute inset-0 rounded-xl ${themeClasses.itemActiveCollapsedBg}`}
                />
                <motion.div
                  layoutId={`${activeLayoutIdPrefix}CollapsedActiveIndicator`}
                  transition={MOTION_EASINGS.springGlider}
                  className={`absolute -left-1 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full z-10 ${themeClasses.activePill}`}
                />
              </>
            )}
            <NavAnimatedIcon
              icon={Icon}
              name={item.title}
              href={item.href}
              isActive={isActive}
              isHovered={isHovered}
              triggerAnimation={clickKey}
              size={18}
              className={`w-[18px] h-[18px] shrink-0 transition-colors z-10 ${
                isActive
                  ? themeClasses.itemActiveText
                  : "text-sidebar-foreground/60 group-hover:text-primary"
              }`}
            />
            <span
              className={`text-[9.5px] leading-tight mt-1 text-center font-medium truncate max-w-[58px] z-10 transition-colors duration-150 ${
                isActive
                  ? `${themeClasses.itemActiveText} font-bold`
                  : "text-sidebar-foreground/70 group-hover:text-primary"
              }`}
            >
              {item.title}
            </span>
          </Link>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={14}
        className="rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
      >
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

function DesktopCollapsedExpandableItem({
  item,
  isChildActive,
  themeClasses,
  activeLayoutIdPrefix,
}: {
  item: NavItem;
  isChildActive: (child: NavItem) => boolean;
  themeClasses: SidebarThemeClasses;
  activeLayoutIdPrefix: string;
}) {
  const isAnyChildActive = item.children?.some(isChildActive) ?? false;
  const [isHovered, setIsHovered] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileTap={{ scale: 0.96 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setClickKey((c) => c + 1)}
        >
          <Link
            href={item.href || item.children?.[0]?.href || "#"}
            aria-current={isAnyChildActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-colors duration-150 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
              isAnyChildActive
                ? `${themeClasses.itemActiveText} font-semibold shadow-sm`
                : "text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
            }`}
          >
            {isAnyChildActive && (
              <>
                <motion.div
                  layoutId={`${activeLayoutIdPrefix}CollapsedActiveBg`}
                  transition={MOTION_EASINGS.springGlider}
                  className={`absolute inset-0 rounded-xl ${themeClasses.itemActiveCollapsedBg}`}
                />
                <motion.div
                  layoutId={`${activeLayoutIdPrefix}CollapsedActiveIndicator`}
                  transition={MOTION_EASINGS.springGlider}
                  className={`absolute -left-1 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full z-10 ${themeClasses.activePill}`}
                />
              </>
            )}
            <NavAnimatedIcon
              icon={Icon}
              name={item.title}
              href={item.href}
              isActive={isAnyChildActive}
              isHovered={isHovered}
              triggerAnimation={clickKey}
              size={18}
              className={`w-[18px] h-[18px] shrink-0 transition-colors z-10 ${
                isAnyChildActive
                  ? themeClasses.itemActiveText
                  : "text-sidebar-foreground/60 group-hover:text-primary"
              }`}
            />
            <span
              className={`text-[9.5px] leading-tight mt-1 text-center font-medium truncate max-w-[58px] z-10 transition-colors duration-150 ${
                isAnyChildActive
                  ? `${themeClasses.itemActiveText} font-bold`
                  : "text-sidebar-foreground/70 group-hover:text-primary"
              }`}
            >
              {item.title}
            </span>
          </Link>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={14}
        className="rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
      >
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

function DesktopExpandedNavItem({ item, isActive, themeClasses, activeLayoutIdPrefix }: ItemComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const Icon = item.icon;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setClickKey((c) => c + 1)}
    >
      <Link
        href={item.href || "#"}
        aria-current={isActive ? "page" : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-150 text-[13.5px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
          isActive
            ? `${themeClasses.itemActiveText} font-semibold shadow-sm`
            : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
        }`}
      >
        {isActive && (
          <>
            <motion.div
              layoutId={`${activeLayoutIdPrefix}ActiveBg`}
              transition={MOTION_EASINGS.springGlider}
              className={`absolute inset-0 rounded-xl ${themeClasses.itemActiveBg} border border-sidebar-primary/15`}
            />
            <motion.div
              layoutId={`${activeLayoutIdPrefix}ActivePill`}
              transition={MOTION_EASINGS.springGlider}
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r-full z-10 ${themeClasses.activePill}`}
            />
          </>
        )}
        <NavAnimatedIcon
          icon={Icon}
          name={item.title}
          href={item.href}
          isActive={isActive}
          isHovered={isHovered}
          triggerAnimation={clickKey}
          size={18}
          className={`w-[18px] h-[18px] transition-colors shrink-0 z-10 ${
            isActive
              ? themeClasses.itemActiveText
              : "text-sidebar-foreground/50 group-hover:text-primary"
          }`}
        />
        <span className="truncate flex-1 z-10">{item.title}</span>
      </Link>
    </motion.div>
  );
}

function DesktopExpandedExpandableItem({
  item,
  isChildActive,
  themeClasses,
}: {
  item: NavItem;
  isChildActive: (child: NavItem) => boolean;
  themeClasses: SidebarThemeClasses;
}) {
  const isAnyChildActive = item.children?.some(isChildActive) ?? false;
  const [isOpen, setIsOpen] = useState(isAnyChildActive);
  const [isHovered, setIsHovered] = useState(false);
  const [clickKey, setClickKey] = useState(0);
  const Icon = item.icon;

  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isAnyChildActive]);

  return (
    <div className="flex flex-col">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          setClickKey((c) => c + 1);
          setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-150 text-[13.5px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 cursor-pointer ${
          isAnyChildActive
            ? "text-sidebar-foreground font-semibold"
            : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
        }`}
      >
        <NavAnimatedIcon
          icon={Icon}
          name={item.title}
          href={item.href}
          isActive={isAnyChildActive}
          isHovered={isHovered}
          triggerAnimation={clickKey}
          size={18}
          className={`w-[18px] h-[18px] transition-colors shrink-0 z-10 ${
            isAnyChildActive
              ? "text-primary"
              : "text-sidebar-foreground/50 group-hover:text-primary"
          }`}
        />
        <span className="truncate flex-1 text-left z-10">{item.title}</span>
        <ChevronRight
          className={`w-3.5 h-3.5 text-sidebar-foreground/40 group-hover:text-primary transition-transform duration-200 shrink-0 z-10 ${
            isOpen ? "rotate-90" : "rotate-0"
          }`}
        />
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden space-y-0.5 mt-0.5 ml-3 pl-3 border-l border-sidebar-border/50"
          >
            {item.children?.map((child) => {
              const active = isChildActive(child);
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href || child.title}
                  href={child.href}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors duration-150 text-[12.5px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    active
                      ? `${themeClasses.itemActiveText} font-semibold ${themeClasses.itemActiveBg} shadow-sm`
                      : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
                  }`}
                >
                  <ChildIcon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      active ? themeClasses.itemActiveText : "text-sidebar-foreground/50 group-hover:text-primary"
                    }`}
                  />
                  <span className="truncate flex-1">{child.title}</span>
                  {active && (
                    <span className={`w-1.5 h-1.5 rounded-full ${themeClasses.activePill} shrink-0`} />
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BaseSidebarContent({
  groups,
  header,
  footer,
  collapsedFooter,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse,
  variant = "primary",
  activeLayoutIdPrefix = "sidebar",
}: BaseSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString();
  const currentUrl = searchString ? `${pathname}?${searchString}` : pathname;
  const collapsedState = isMobile ? false : isCollapsed;
  const { scrollbarProps } = useAutoFadeScrollbar(1000);

  // Flatten all navigation item hrefs including children for segment-aware longest-prefix resolution
  const allItemHrefs = React.useMemo(() => {
    return groups
      .flatMap((group) =>
        group.items.flatMap((item) => [
          item.href,
          ...(item.children?.map((c) => c.href) || []),
        ])
      )
      .filter(Boolean);
  }, [groups]);

  // Theme variant styling tokens
  const isEmerald = variant === "emerald";
  const themeClasses = isEmerald
    ? {
        logoBox: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        logoBoxHover: "hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30",
        collapsedLogoBox: "bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30",
        collapsedTag: "text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        toggleBtn: "bg-emerald-500/8 hover:bg-emerald-500/15 text-emerald-600/60 hover:text-emerald-600",
        itemActiveText: "text-emerald-600 dark:text-emerald-400",
        itemActiveBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        itemActiveCollapsedBg: "bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/20",
        activePill: "bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
      }
    : {
        logoBox: "bg-primary/10 text-primary border-primary/20",
        logoBoxHover: "group-hover/ws:bg-primary/20",
        collapsedLogoBox: "bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30",
        collapsedTag: "text-primary",
        badge: "bg-primary/20 text-primary",
        toggleBtn: "bg-primary/8 hover:bg-primary/15 text-primary/60 hover:text-primary",
        itemActiveText: "text-sidebar-primary",
        itemActiveBg: "bg-sidebar-primary/10 dark:bg-sidebar-primary/20",
        itemActiveCollapsedBg: "bg-sidebar-primary/15 dark:bg-sidebar-primary/20 border-sidebar-primary/20",
        activePill: "bg-sidebar-primary shadow-sm shadow-sidebar-primary/50",
      };

  const isItemActive = (item: NavItem) => {
    return isNavRouteActive(
      item.href,
      pathname,
      allItemHrefs,
      item.exact || item.match === "exact",
      currentUrl
    );
  };

  // Mobile drawer single-card layout
  if (isMobile) {
    const BadgeIcon = header.badge?.icon;
    return (
      <div className="flex flex-col h-full relative overflow-hidden select-none">
        {/* Header / Workspace info */}
        <div className="pt-5 pb-3 px-4">
          <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sidebar-accent/50 cursor-pointer border border-sidebar-border/50 hover:border-sidebar-border shadow-sm hover:shadow-md transition-all group/ws bg-background/60 dark:bg-muted/15 backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex shrink-0 justify-center items-center rounded-xl w-9 h-9 border shadow-sm transition-all ${themeClasses.logoBox} ${themeClasses.logoBoxHover}`}>
                {header.logo || <ClixProIcon pixelSize={24} />}
              </div>
              <div className="overflow-hidden whitespace-nowrap min-w-0">
                <h1 className="text-sidebar-foreground font-bold text-sm tracking-tight leading-tight truncate max-w-[145px] capitalize">
                  {header.title}
                </h1>
                <div className="flex items-center mt-0.5 gap-1.5">
                  {header.badgeElement ? (
                    header.badgeElement
                  ) : header.badge ? (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider inline-flex items-center gap-1 ${header.badge.className || themeClasses.badge}`}>
                      {BadgeIcon && <BadgeIcon className="w-2.5 h-2.5" />}
                      {header.badge.text}
                    </span>
                  ) : null}
                  {header.subtitle && (
                    <span className="text-sidebar-foreground/50 text-[11px] font-medium truncate max-w-[85px]">
                      {header.subtitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-sidebar-foreground/40 group-hover/ws:text-sidebar-foreground transition-colors shrink-0" />
          </div>
        </div>

        <div className="px-3 mb-2">
          <div className="h-px bg-sidebar-border/60 w-full" />
        </div>

        <TooltipProvider delayDuration={0}>
          <div className="flex-1 overflow-y-auto sidebar-scroll px-3 pb-4" {...scrollbarProps}>
            {groups.map((group, groupIdx) => (
              <div key={group.label || groupIdx} className={groupIdx > 0 ? "mt-4" : ""}>
                {group.label && (
                  <div className="px-3 mb-1.5">
                    <h4 className="text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                      {group.label}
                    </h4>
                  </div>
                )}
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    if (hasChildren) {
                      return (
                        <MobileExpandableNavItem
                          key={item.href || item.title}
                          item={item}
                          isChildActive={isItemActive}
                          themeClasses={themeClasses}
                        />
                      );
                    }

                    return (
                      <MobileNavItem
                        key={item.href || item.title}
                        item={item}
                        isActive={isItemActive(item)}
                        themeClasses={themeClasses}
                        activeLayoutIdPrefix={activeLayoutIdPrefix}
                      />
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </TooltipProvider>

        {footer && (
          <div className="mt-auto shrink-0 border-t border-sidebar-border/60 p-3">
            {footer}
          </div>
        )}
      </div>
    );
  }

  const BadgeIcon = header.badge?.icon;

  return (
    <>
      {/* ── CARD 1: Workspace / Brand Header ── */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className="relative shrink-0 h-[58px] flex items-center bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xs rounded-2xl overflow-hidden"
      >
        {collapsedState ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={onToggleCollapse}
                  className={`flex flex-col items-center justify-center w-full h-full p-1.5 rounded-2xl cursor-pointer group/logo transition-all ${themeClasses.collapsedLogoBox}`}
                >
                  {header.logo || <ClixProIcon pixelSize={24} />}
                  <span className={`text-[8.5px] font-extrabold uppercase mt-0.5 tracking-wider ${themeClasses.collapsedTag}`}>
                    {header.collapsedTag || "CRM"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={14}
                className="rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
              >
                {header.title}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center justify-between px-3 py-2.5 gap-2 w-full h-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`flex shrink-0 justify-center items-center rounded-xl w-9 h-9 border shadow-sm ${themeClasses.logoBox}`}>
                {header.logo || <ClixProIcon pixelSize={22} />}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key="ws-label"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0"
                >
                  <h1 className="text-sidebar-foreground font-bold text-[13.5px] tracking-tight leading-tight truncate max-w-[130px] capitalize">
                    {header.title}
                  </h1>
                  <div className="flex items-center mt-0.5 gap-1.5 flex-wrap">
                    {header.badgeElement ? (
                      header.badgeElement
                    ) : header.badge ? (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider inline-flex items-center gap-1 ${header.badge.className || themeClasses.badge}`}>
                        {BadgeIcon && <BadgeIcon className="w-2.5 h-2.5" />}
                        {header.badge.text}
                      </span>
                    ) : null}
                    {header.subtitle && (
                      <span className="text-sidebar-foreground/50 text-[10.5px] font-medium truncate">
                        {header.subtitle}
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Collapse Toggle */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                aria-label="Collapse Sidebar"
                className={`shrink-0 flex items-center justify-center w-6.5 h-6.5 rounded-lg transition-all duration-200 cursor-pointer ${themeClasses.toggleBtn}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ── CARD 2: Navigation Menu ── */}
      <motion.div
        initial={false}
        className="relative flex-1 min-h-0 bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xs rounded-2xl overflow-hidden flex flex-col"
      >
        <TooltipProvider delayDuration={0}>
          <div className={`flex-1 overflow-y-auto sidebar-scroll pt-2.5 pb-2.5 ${collapsedState ? "px-1.5" : "px-2.5"}`} {...scrollbarProps}>
            {groups.map((group, groupIdx) => (
              <div key={group.label || groupIdx} className={groupIdx > 0 ? "mt-3.5" : ""}>
                <AnimatePresence mode="wait">
                  {!collapsedState && group.label ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-2 mb-1.5"
                    >
                      <h4 className="text-[10.5px] font-semibold text-sidebar-foreground/45 uppercase tracking-wider">
                        {group.label}
                      </h4>
                    </motion.div>
                  ) : (
                    collapsedState && groupIdx > 0 && (
                      <div className="my-2 px-1.5">
                        <div className="h-px bg-sidebar-border/40 w-full" />
                      </div>
                    )
                  )}
                </AnimatePresence>

                <nav className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;

                    if (collapsedState) {
                      if (hasChildren) {
                        return (
                          <div key={item.title}>
                            <DesktopCollapsedExpandableItem
                              item={item}
                              isChildActive={isItemActive}
                              themeClasses={themeClasses}
                              activeLayoutIdPrefix={activeLayoutIdPrefix}
                            />
                          </div>
                        );
                      }

                      const isActive = isItemActive(item);
                      return (
                        <div key={item.title}>
                          <DesktopCollapsedNavItem
                            item={item}
                            isActive={isActive}
                            themeClasses={themeClasses}
                            activeLayoutIdPrefix={activeLayoutIdPrefix}
                          />
                        </div>
                      );
                    }

                    if (hasChildren) {
                      return (
                        <div key={item.title}>
                          <DesktopExpandedExpandableItem
                            key={item.title}
                            item={item}
                            isChildActive={isItemActive}
                            themeClasses={themeClasses}
                          />
                        </div>
                      );
                    }

                    const isActive = isItemActive(item);
                    return (
                      <div key={item.title}>
                        <DesktopExpandedNavItem
                          item={item}
                          isActive={isActive}
                          themeClasses={themeClasses}
                          activeLayoutIdPrefix={activeLayoutIdPrefix}
                        />
                      </div>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </motion.div>

      {/* ── CARD 3: Footer (Standalone Card) ── */}
      {(footer || collapsedFooter) && (
        <motion.div
          initial={false}
          className={`shrink-0 bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xs rounded-2xl overflow-hidden ${
            collapsedState ? "p-1.5" : "p-2"
          }`}
        >
          {collapsedState ? (collapsedFooter || footer) : footer}
        </motion.div>
      )}
    </>
  );
}

export function BaseSidebar(props: BaseSidebarProps) {
  const { isCollapsed = false } = props;

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`hidden md:flex flex-col fixed top-3.5 left-3.5 h-[calc(100dvh-32px)] z-40 overflow-visible gap-2.5 select-none ${props.className || ""}`}
    >
      <BaseSidebarContent {...props} />
    </motion.div>
  );
}
