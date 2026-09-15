"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { TimeframeOption } from "./dashboard-types";

interface GrowthDataShape {
  newOrganizations: number;
  activatedOrganizations: number;
  churnedOrganizations: number;
  growthPercent: number;
}

interface GrowthSeriesPoint {
  label: string;
  organizations?: number;
  total: number;
  active: number;
}

interface OrganizationGrowthCardProps {
  growthData: GrowthDataShape;
  currentGrowthSeries: GrowthSeriesPoint[];
  timeRange: TimeframeOption;
  isClient: boolean;
}

export function OrganizationGrowthCard({
  growthData,
  currentGrowthSeries,
  timeRange,
  isClient,
}: OrganizationGrowthCardProps) {
  return (
    <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Organization Growth
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Workspace registrations, activation trajectory, and expansion velocity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            +{growthData.growthPercent}% Velocity ({timeRange})
          </span>
        </div>
      </div>

      {/* Quick Metrics Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            New Workspaces
          </span>
          <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">
            +{growthData.newOrganizations}
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            Activated
          </span>
          <p className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">
            {growthData.activatedOrganizations}
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            Churned / Suspended
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-500 mt-0.5">
            {growthData.churnedOrganizations}
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border/40 p-3">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            Growth Rate
          </span>
          <p className="text-base sm:text-lg font-bold text-primary mt-0.5">
            +{growthData.growthPercent}%
          </p>
        </div>
      </div>

      {/* Lightweight Clean Chart */}
      <div className="h-56 w-full pt-2">
        {isClient && currentGrowthSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={currentGrowthSeries}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="orgGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="label"
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
                dataKey="total"
                name="Total Workspaces"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#orgGrowthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Loading analytics data...
          </div>
        )}
      </div>
    </div>
  );
}
