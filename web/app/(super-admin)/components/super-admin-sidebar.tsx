"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Crown,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { BaseSidebar } from "@/shared/components/sidebar/BaseSidebar";
import { useSuperAdminNavigation } from "@/shared/hooks/use-super-admin-navigation";

export function SuperAdminSidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { groups: navGroups, isLoading } = useSuperAdminNavigation();

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  const superAdminFooter = (
    <div className="space-y-2">
      <Link
        href="/dashboard"
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground bg-sidebar-accent/30 hover:bg-sidebar-accent/60 transition-all"
      >
        <ArrowLeftRight className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate">Switch to Tenant CRM</span>
      </Link>

      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-background/50">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-sm">
          {user?.name?.charAt(0) || "S"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-sidebar-foreground truncate">
            {user?.name || "Super Admin"}
          </p>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-primary shrink-0" />
            <span className="text-[10px] font-semibold text-primary truncate">
              Platform Root
            </span>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const collapsedSuperAdminFooter = (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => logout()}
            className="flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-[10px] leading-tight mt-1 text-center font-medium">Out</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={14}
          className="bg-slate-900 text-white rounded-lg text-xs font-medium z-50 shadow-xl"
        >
          Sign Out
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      {/* Layout Spacer for main content column */}
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 86 : 270 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:block shrink-0 h-full"
      />

      <BaseSidebar
        groups={navGroups}
        header={{
          title: "ClixProPlatform",
          badge: {
            text: "Super Admin",
            icon: Crown,
          },
          collapsedTag: "ROOT",
        }}
        footer={superAdminFooter}
        collapsedFooter={collapsedSuperAdminFooter}
        isCollapsed={collapsed}
        onToggleCollapse={toggleSidebar}
        variant="primary"
        activeLayoutIdPrefix="superAdmin"
      />
    </>
  );
}
