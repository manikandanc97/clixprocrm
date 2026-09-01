"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
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

export default function WelcomeBanner() {
  const { user, access, hasPermission } = useAuth();
  const { data: dashboardData, isLoading } = useDashboardData();

  const weeklyGrowth = dashboardData?.weeklyGrowth ?? 0;
  const isPositiveGrowth = weeklyGrowth >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl bg-slate-950 p-5 sm:p-6 shadow-xl border border-white/5"
    >
      {/* Dynamic Theme Reactive Ambient Gradients */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-none transition-all duration-500" 
        style={{
          background: "linear-gradient(to left, color-mix(in srgb, var(--primary) 20%, transparent), transparent)"
        }}
      />
      <div 
        className="absolute -top-16 -right-16 w-56 h-56 blur-[80px] rounded-full pointer-events-none transition-all duration-500" 
        style={{
          backgroundColor: "var(--primary)",
          opacity: 0.22
        }}
      />
      <div 
        className="absolute -bottom-20 right-1/3 w-44 h-44 blur-[70px] rounded-full pointer-events-none transition-all duration-500" 
        style={{
          backgroundColor: "var(--primary)",
          opacity: 0.12
        }}
      />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {/* Dynamic Status Badge */}
            <div 
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border"
              style={{
                backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                borderColor: "color-mix(in srgb, var(--primary) 28%, transparent)",
                color: "var(--primary)"
              }}
            >
              <Zap className="w-3 h-3" style={{ fill: "var(--primary)", color: "var(--primary)" }} />
              System Live
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome back, <span className="capitalize font-extrabold transition-colors duration-300" style={{ color: "var(--primary)" }}>{user?.displayName || user?.name || access.roleName}</span>
            </h1>
            <div className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  Your revenue grew by <Skeleton className="h-4 w-12 bg-white/10 inline-block align-middle" /> this week. Check your latest insights below.
                </span>
              ) : (
                <>
                  Your revenue grew by <span className={isPositiveGrowth ? "font-semibold transition-colors duration-300" : "text-rose-400 font-semibold"} style={isPositiveGrowth ? { color: "var(--primary)" } : undefined}>
                    {isPositiveGrowth ? "+" : ""}{weeklyGrowth}%
                  </span> this week. Check your latest insights below.
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          {hasPermission(PERMISSIONS.REPORTS_READ) && (
            <Button asChild className="rounded-full px-6 h-10 bg-white text-slate-950 hover:bg-slate-200 font-bold transition-all shadow-md group">
              <Link href="/reports" className="flex items-center gap-2 text-sm">
                <span>View Reports</span>
                <AppIcon name="arrowUpRight" icon={ArrowUpRight} size={15} />
              </Link>
            </Button>
          )}
          {hasPermission(PERMISSIONS.LEADS_READ) && (
            <Button asChild variant="outline" className="rounded-full px-6 h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold transition-all text-sm group">
              <Link href="/leads" className="flex items-center gap-2">
                <span>Manage Leads</span>
                <AppIcon name="arrowRight" size={15} />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Decorative Sparkle */}
      <div className="absolute top-6 right-1/4 opacity-20 animate-pulse pointer-events-none">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
    </motion.div>
  );
}
