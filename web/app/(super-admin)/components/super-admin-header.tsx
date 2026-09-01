"use client";

import { useAuth } from "@/features/auth/components/auth-provider";
import { useEffect, useRef } from "react";
import ProfileMenu from "@/features/dashboard/components/ProfileMenu";
import GlobalSearch from "@/features/dashboard/components/GlobalSearch";
import CurrencySwitcher from "@/features/dashboard/components/CurrencySwitcher";
import NotificationPanel from "@/features/dashboard/components/NotificationPanel";
import ThemeToggle from "@/features/dashboard/components/ThemeToggle";

function getInitials(name?: string) {
  if (!name) return "SA";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function SuperAdminHeader() {
  const { user } = useAuth();
  const initials = getInitials(user?.name);
  const headerRef = useRef<HTMLElement>(null);

  // Measure actual header height → expose as --sa-header-h for table workspace calc
  useEffect(() => {
    if (!headerRef.current) return;
    const update = () => {
      const h = headerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--sa-header-h", `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="w-full px-4 sm:px-6 pt-3.5 pb-2.5 sm:pb-3 shrink-0">
      {/* ── Single Floating Card Container ── */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xs rounded-2xl px-3.5 sm:px-5 backdrop-blur-md h-[58px]">
        {/* Left: Global Search */}
        <div className="flex flex-1 items-center gap-2.5 max-w-full md:max-w-[460px]">
          <GlobalSearch />
        </div>

        {/* Right: Utilities, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="hidden sm:block h-4 w-px bg-sidebar-border/60 mx-0.5" />
            <CurrencySwitcher />
            <div className="h-4 w-px bg-sidebar-border/60 mx-0.5" />
            <NotificationPanel />
          </div>

          <div className="h-6 w-px bg-sidebar-border/60 mx-0.5 hidden sm:block" />

          <ProfileMenu user={user} initials={initials} />
        </div>
      </div>
    </header>
  );
}
