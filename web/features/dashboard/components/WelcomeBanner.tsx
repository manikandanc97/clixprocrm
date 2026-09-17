"use client";

import React from "react";
import { 
  ArrowUpRight, 
  ArrowRight,
  Zap,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Button } from "@/shared/ui/button";
import Link from "next/link";
import { PERMISSIONS } from "@/shared/lib/auth/rbac/permissions";
import { useDashboardData } from "@/shared/hooks/use-dashboard";
import { Skeleton } from "@/shared/ui/skeleton";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { cn } from "@/shared/lib/utils";

export default function WelcomeBanner() {
  const { user, access, hasPermission } = useAuth();
  const { data: dashboardData, isLoading } = useDashboardData();

  const weeklyGrowth = dashboardData?.weeklyGrowth ?? 0;
  const isPositiveGrowth = weeklyGrowth >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[#0b1329] p-5 sm:p-6 lg:p-7 shadow-xl border border-white/10 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 ease-out motion-reduce:animate-none shrink-0 min-h-[140px]"
    >
      {/* Dynamic Theme Reactive Ambient Gradients */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-none transition-all duration-500" 
        style={{
          background: "linear-gradient(to left, color-mix(in srgb, var(--primary) 18%, transparent), transparent)"
        }}
      />
      <div 
        className="absolute -top-16 -right-16 w-60 h-60 blur-[85px] rounded-full pointer-events-none transition-all duration-500" 
        style={{
          backgroundColor: "var(--primary)",
          opacity: 0.22
        }}
      />
      <div 
        className="absolute -bottom-20 right-1/3 w-48 h-48 blur-[75px] rounded-full pointer-events-none transition-all duration-500" 
        style={{
          backgroundColor: "var(--primary)",
          opacity: 0.12
        }}
      />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 z-10">
        <div className="flex-1 space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-3">
            {/* Dynamic Status Badge */}
            <div 
              className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border shadow-xs"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
                borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
                color: "var(--primary)"
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Zap className="w-3 h-3" style={{ fill: "var(--primary)", color: "var(--primary)" }} />
              <span>System Live</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
              Welcome back,{" "}
              <span 
                className="capitalize font-black transition-colors duration-300"
                style={{ color: "var(--primary)" }}
              >
                {user?.displayName || user?.name || access.roleName || "Admin"}
              </span>
            </h1>
            <div className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isLoading ? (
                <span className="flex items-center gap-2 text-slate-400">
                  Your revenue grew by <Skeleton className="h-4 w-12 bg-white/10 inline-block align-middle" /> this week. Check your latest insights below.
                </span>
              ) : (
                <>
                  Your revenue grew by{" "}
                  <span 
                    className={cn(
                      "font-bold transition-colors duration-300",
                      isPositiveGrowth ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {isPositiveGrowth ? "+" : ""}{weeklyGrowth}%
                  </span>{" "}
                  this week. Check your latest insights below.
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {hasPermission(PERMISSIONS.REPORTS_READ) && (
            <Button 
              asChild 
              className="rounded-xl px-4 sm:px-5 h-9 sm:h-10 bg-white text-slate-950 hover:bg-slate-100 font-bold transition-all shadow-md text-xs sm:text-sm group"
            >
              <Link href="/reports" className="flex items-center gap-2">
                <span>View Reports</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          )}
          {hasPermission(PERMISSIONS.LEADS_READ) && (
            <Button 
              asChild 
              variant="outline" 
              className="rounded-xl px-4 sm:px-5 h-9 sm:h-10 border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold transition-all text-xs sm:text-sm group"
            >
              <Link href="/leads" className="flex items-center gap-2">
                <span>Manage Leads</span>
                <AppIcon name="arrowRight" icon={ArrowRight} size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Decorative Sparkle */}
      <div className="absolute top-5 right-1/4 opacity-25 animate-pulse pointer-events-none hidden sm:block">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
