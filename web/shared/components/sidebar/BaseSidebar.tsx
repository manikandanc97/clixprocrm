"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { ClixProIcon } from "@/shared/ui/logo";
import { type NavGroup, type NavItem, isNavRouteActive } from "@/shared/lib/auth/rbac";

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
  const collapsedState = isMobile ? false : isCollapsed;

  // Flatten all navigation item hrefs for segment-aware longest-prefix resolution
  const allItemHrefs = React.useMemo(() => {
    return groups.flatMap((group) => group.items.map((item) => item.href)).filter(Boolean);
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
      item.exact || item.match === "exact"
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
          <div className="flex-1 overflow-y-auto kanban-board-scroll px-3 pb-4">
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
                    const Icon = item.icon;
                    const isActive = isItemActive(item);
                    return (
                      <Link
                        key={item.href || item.title}
                        href={item.href || "#"}
                        aria-current={isActive ? "page" : undefined}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[13.5px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
                          isActive
                            ? `${themeClasses.itemActiveText} ${themeClasses.itemActiveBg} font-bold shadow-sm border border-sidebar-primary/15`
                            : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
                        }`}
                      >
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            isActive ? themeClasses.itemActiveText : "text-sidebar-foreground/50 group-hover:text-primary"
                          }`}
                        />
                        <span className="truncate flex-1">{item.title}</span>
                        {isActive && (
                          <motion.div
                            layoutId={`${activeLayoutIdPrefix}MobileActivePill`}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r-full ${themeClasses.activePill}`}
                          />
                        )}
                      </Link>
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
        className="relative shrink-0 h-[66px] flex items-center bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/40 rounded-2xl overflow-hidden"
      >
        {collapsedState ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={onToggleCollapse}
                  className={`flex flex-col items-center justify-center w-full h-full p-2 rounded-2xl cursor-pointer group/logo transition-all ${themeClasses.collapsedLogoBox}`}
                >
                  {header.logo || <ClixProIcon pixelSize={26} />}
                  <span className={`text-[9px] font-extrabold uppercase mt-1 tracking-wider ${themeClasses.collapsedTag}`}>
                    {header.collapsedTag || "CRM"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={14}
                className="bg-slate-900 dark:bg-slate-950 text-white border border-white/10 rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
              >
                {header.title}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center justify-between p-3 gap-2 w-full h-full">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex shrink-0 justify-center items-center rounded-xl w-10 h-10 border shadow-sm ${themeClasses.logoBox}`}>
                {header.logo || <ClixProIcon pixelSize={26} />}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key="ws-label"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="min-w-0"
                >
                  <h1 className="text-sidebar-foreground font-bold text-sm tracking-tight leading-tight truncate max-w-[130px] capitalize">
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
                      <span className="text-sidebar-foreground/50 text-[11px] font-medium truncate">
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
                className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 cursor-pointer ${themeClasses.toggleBtn}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ── CARD 2: Navigation Menu & Footer ── */}
      <motion.div
        initial={false}
        className="relative flex-1 min-h-0 bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/40 rounded-2xl overflow-hidden flex flex-col"
      >
        <TooltipProvider delayDuration={0}>
          <div className={`flex-1 overflow-y-auto kanban-board-scroll pt-3 pb-3 ${collapsedState ? "px-1.5" : "px-3"}`}>
            {groups.map((group, groupIdx) => (
              <div key={group.label || groupIdx} className={groupIdx > 0 ? "mt-4" : ""}>
                <AnimatePresence mode="wait">
                  {!collapsedState && group.label ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-1 mb-2"
                    >
                      <h4 className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                        {group.label}
                      </h4>
                    </motion.div>
                  ) : (
                    collapsedState && groupIdx > 0 && (
                      <div className="my-2 px-2">
                        <div className="h-px bg-sidebar-border/40 w-full" />
                      </div>
                    )
                  )}
                </AnimatePresence>

                <nav className="flex flex-col gap-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item);

                    if (collapsedState) {
                      return (
                        <div key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href || "#"}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
                                  isActive
                                    ? `${themeClasses.itemActiveText} ${themeClasses.itemActiveCollapsedBg} font-semibold shadow-sm`
                                    : "text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
                                }`}
                              >
                                <motion.div
                                  whileTap={{ scale: 0.9 }}
                                  animate={
                                    isActive
                                      ? { scale: [1, 1.06, 1], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }
                                      : {}
                                  }
                                >
                                  <Icon
                                    className={`w-5 h-5 shrink-0 transition-colors ${
                                      isActive
                                        ? themeClasses.itemActiveText
                                        : "text-sidebar-foreground/60 group-hover:text-primary"
                                    }`}
                                  />
                                </motion.div>
                                <span
                                  className={`text-[10px] leading-tight mt-1 text-center font-medium truncate max-w-[60px] ${
                                    isActive
                                      ? `${themeClasses.itemActiveText} font-bold`
                                      : "text-sidebar-foreground/70 group-hover:text-primary"
                                  }`}
                                >
                                  {item.title}
                                </span>
                                {isActive && (
                                  <motion.div
                                    layoutId={`${activeLayoutIdPrefix}ActiveIndicator`}
                                    className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full ${themeClasses.activePill}`}
                                  />
                                )}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              sideOffset={14}
                              className="bg-slate-900 dark:bg-slate-950 text-white border border-white/10 rounded-lg px-3 py-1.5 font-semibold text-xs shadow-xl z-50"
                            >
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    }

                    return (
                      <div key={item.title}>
                        <Link
                          href={item.href || "#"}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[13.5px] group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
                            isActive
                              ? `${themeClasses.itemActiveText} ${themeClasses.itemActiveBg} font-bold shadow-sm border border-sidebar-primary/15`
                              : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 font-medium"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId={`${activeLayoutIdPrefix}ActivePill`}
                              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r-full ${themeClasses.activePill}`}
                            />
                          )}
                          <motion.div
                            animate={
                              isActive
                                ? { scale: [1, 1.05, 1], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
                                : {}
                            }
                            className="shrink-0"
                          >
                            <Icon
                              className={`w-[18px] h-[18px] transition-colors ${
                                isActive
                                  ? themeClasses.itemActiveText
                                  : "text-sidebar-foreground/50 group-hover:text-primary"
                              }`}
                            />
                          </motion.div>
                          <span className="truncate flex-1">{item.title}</span>
                        </Link>
                      </div>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </TooltipProvider>

        {/* Footer Area */}
        {(footer || collapsedFooter) && (
          <div className={`shrink-0 border-t border-sidebar-border/60 ${collapsedState ? "p-1.5" : "px-3 py-2.5"}`}>
            {collapsedState ? (collapsedFooter || footer) : footer}
          </div>
        )}
      </motion.div>
    </>
  );
}

export function BaseSidebar(props: BaseSidebarProps) {
  const { isCollapsed = false } = props;

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 78 : 290 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`hidden md:flex flex-col fixed top-3 left-3 h-[calc(100vh-24px)] z-40 overflow-visible gap-2.5 select-none ${props.className || ""}`}
    >
      <BaseSidebarContent {...props} />
    </motion.div>
  );
}
