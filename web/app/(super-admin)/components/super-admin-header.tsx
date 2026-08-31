"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useTheme } from "next-themes";
import { Crown, Sun, Moon, ExternalLink, Plus, Building2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProfileMenu from "@/features/dashboard/components/ProfileMenu";
import GlobalSearch from "@/features/dashboard/components/GlobalSearch";
import CurrencySwitcher from "@/features/dashboard/components/CurrencySwitcher";
import NotificationPanel from "@/features/dashboard/components/NotificationPanel";
import ThemeToggle from "@/features/dashboard/components/ThemeToggle";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

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

  return (
    <header className="w-full px-4 sm:px-6 pt-3.5 pb-2.5 sm:pb-3 shrink-0">
      {/* ── Single Floating Card Container ── */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-none rounded-2xl px-3.5 sm:px-5 backdrop-blur-md h-[58px]">
        {/* Left: Global Search */}
        <div className="flex flex-1 items-center gap-2.5 max-w-full md:max-w-[460px]">
          <GlobalSearch />
        </div>

        {/* Right: Action, Utilities, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 font-semibold text-xs sm:text-sm px-3 sm:px-3.5 h-9 cursor-pointer"
              >
                <AppIcon name="plus" size={15} />
                <span className="hidden sm:inline font-semibold">Create New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl border-border bg-popover/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2.5 py-1.5">
                Platform Quick Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2 px-2.5 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary group">
                <Link href="/super-admin/organizations?create=true" className="flex items-center gap-2.5 w-full">
                  <div className="w-7 h-7 rounded-lg bg-muted/80 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/15 group-focus:bg-primary/15 transition-colors shrink-0">
                    <AppIcon name="companies" size={15} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary group-focus:text-primary transition-colors text-xs">New Organization</p>
                    <p className="text-[10px] text-muted-foreground">Provision tenant workspace</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2 px-2.5 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary group">
                <Link href="/super-admin/users" className="flex items-center gap-2.5 w-full">
                  <div className="w-7 h-7 rounded-lg bg-muted/80 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/15 group-focus:bg-primary/15 transition-colors shrink-0">
                    <AppIcon name="platformUsers" size={15} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary group-focus:text-primary transition-colors text-xs">Platform User</p>
                    <p className="text-[10px] text-muted-foreground">Manage admin privileges</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2 px-2.5 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary group">
                <Link href="/super-admin/modules?add=true" className="flex items-center gap-2.5 w-full">
                  <div className="w-7 h-7 rounded-lg bg-muted/80 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/15 group-focus:bg-primary/15 transition-colors shrink-0">
                    <AppIcon name="modules" size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary group-focus:text-primary transition-colors text-xs">Add Menu / Module</p>
                    <p className="text-[10px] text-muted-foreground">Configure navigation route</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2 px-2.5 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary group">
                <Link href="/super-admin/plans" className="flex items-center gap-2.5 w-full">
                  <div className="w-7 h-7 rounded-lg bg-muted/80 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/15 group-focus:bg-primary/15 transition-colors shrink-0">
                    <AppIcon name="plans" size={15} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary group-focus:text-primary transition-colors text-xs">Pricing & Tiers</p>
                    <p className="text-[10px] text-muted-foreground">Configure subscription plans</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
