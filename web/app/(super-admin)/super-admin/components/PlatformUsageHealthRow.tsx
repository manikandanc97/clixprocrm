"use client";

import React from "react";
import Link from "next/link";
import { Activity, Users, Server, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

interface UsageStatsShape {
  dau: number;
  wau: number;
  mau: number;
  loginSuccessRate: number;
  activeOrganizationRate: number;
  dailyTrend: Array<{ date: string; dau: number; logins: number }>;
}

interface HealthServiceShape {
  name: string;
  status: string;
  latencyMs: number;
  details?: string;
}

interface PlatformUsageHealthRowProps {
  usageStats: UsageStatsShape;
  healthServices: HealthServiceShape[];
  isClient: boolean;
}

export function PlatformUsageHealthRow({
  usageStats,
  healthServices,
  isClient,
}: PlatformUsageHealthRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Platform Usage (2 cols) */}
      <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Platform Usage &amp; Activity
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily active users, engagement volume, and session success telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            <Users className="w-3.5 h-3.5" />
            <span>{usageStats.loginSuccessRate}% Login Success</span>
          </div>
        </div>

        {/* Usage Metrics Header */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              DAU
            </span>
            <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {usageStats.dau}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              WAU
            </span>
            <p className="text-base sm:text-lg font-bold text-indigo-600 mt-0.5">
              {usageStats.wau}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              MAU
            </span>
            <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">
              {usageStats.mau}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Login Success
            </span>
            <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">
              {usageStats.loginSuccessRate}%
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border/40 p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Active Orgs
            </span>
            <p className="text-base sm:text-lg font-bold text-primary mt-0.5">
              {usageStats.activeOrganizationRate}%
            </p>
          </div>
        </div>

        {/* 30-Day Activity Sparkline */}
        <div className="h-44 w-full pt-1">
          {isClient && usageStats.dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={usageStats.dailyTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "12px",
                    fontSize: "11px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "var(--foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="dau"
                  name="Active Users"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#usageGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Loading usage trends...
            </div>
          )}
        </div>
      </div>

      {/* Platform Health & Microservices (1 col) */}
      <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Platform Health
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            99.98% Uptime
          </span>
        </div>

        {/* Microservices List */}
        <div className="space-y-2 flex-1">
          {healthServices.map((srv, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-muted/20 border border-border/30 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-foreground truncate">
                  {srv.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {srv.latencyMs}ms
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Operational
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Live telemetry ping: 30s
          </span>
          <Link
            href="/super-admin/security"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            <span>View SecOps</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
