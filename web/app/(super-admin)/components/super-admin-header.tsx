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
    <header className="sticky top-0 z-40 w-full px-3 sm:px-6 lg:px-10 pt-3 pb-3 sm:pb-3.5 shrink-0">
      {/* ── Single Floating Card Container ── */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 bg-sidebar text-sidebar-foreground border border-sidebar-border/80 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-2xl dark:shadow-black/40 rounded-2xl px-3.5 sm:px-5 backdrop-blur-md h-[58px]">
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-3.5 sm:px-4 h-[38px] text-xs md:text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                <span className="hidden sm:inline font-semibold">Create New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl border-border bg-popover/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                Platform Quick Actions
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2">
                <Link href="/super-admin/organizations?create=true" className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-foreground">New Organization</p>
                    <p className="text-[10px] text-muted-foreground">Provision tenant workspace</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2">
                <Link href="/super-admin/users" className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="font-bold text-foreground">Platform User</p>
                    <p className="text-[10px] text-muted-foreground">Manage admin privileges</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2">
                <Link href="/super-admin/modules?add=true" className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-bold text-foreground">Add Menu / Module</p>
                    <p className="text-[10px] text-muted-foreground">Configure navigation route</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs py-2">
                <Link href="/super-admin/plans" className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="font-bold text-foreground">Pricing & Tiers</p>
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
