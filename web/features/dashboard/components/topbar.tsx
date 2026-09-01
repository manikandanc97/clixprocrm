"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import CreateNewMenu from "./CreateNewMenu";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/shared/ui/sheet";
import { SidebarContent } from "./sidebar";
import { Button } from "@/shared/ui/button";
import GlobalSearch from "./GlobalSearch";
import CurrencySwitcher from "./CurrencySwitcher";
import ThemeToggle from "./ThemeToggle";

function getInitials(name?: string) {
  if (!name) return "CR";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Topbar() {
  const { user } = useAuth();
  const initials = getInitials(user?.name);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Measure actual header height → expose as --sa-header-h for crm-table-workspace-sticky
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header ref={headerRef} className="w-full px-4 sm:px-6 pt-3.5 pb-2.5 sm:pb-3 shrink-0">
      {/* ── Single Floating Card Container ── */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xs rounded-2xl px-3.5 sm:px-5 backdrop-blur-md h-[58px]">
        {/* Left: Mobile Nav Drawer & Search */}
        <div className="flex flex-1 items-center gap-2.5 max-w-full md:max-w-[460px]">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0 w-9 h-9 rounded-lg hover:bg-sidebar-accent/60 text-sidebar-foreground/70 cursor-pointer">
                <AppIcon name="menu" size={18} />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[270px] bg-sidebar border-sidebar-border [&>button]:hidden">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarContent isMobile={true} />
            </SheetContent>
          </Sheet>

          <GlobalSearch />
        </div>

        {/* Right: Action, Utilities, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <CreateNewMenu />

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
