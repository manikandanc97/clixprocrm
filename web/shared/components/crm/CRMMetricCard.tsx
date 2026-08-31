"use client";

import React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, YAxis } from "recharts";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { ChartContainer } from "../charts/ChartContainer";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Config
// ─────────────────────────────────────────────────────────────────────────────

type MetricColor =
  | "emerald"
  | "cyan"
  | "indigo"
  | "violet"
  | "orange"
  | "pink"
  | "blue"
  | "purple"
  | "primary"
  | "slate";

type SparklineDotProps = {
  cx?: number;
  cy?: number;
  index?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified Premium Color Token Map
// 6 strategic accent colors — no rainbow overload
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_TOKENS: Record<
  MetricColor,
  {
    // Recharts sparkline stroke/fill
    stroke: string;
    gradientId: string;
    // Tailwind: left border accent
    border: string;
    // Tailwind: hover border glow
    hoverBorder: string;
    // Tailwind: icon container (light + dark)
    iconBg: string;
    iconText: string;
    // Tailwind: radial glow behind card
    glowBg: string;
    // Tailwind: trend badge (up/neutral)
    badgeBg: string;
    badgeText: string;
  }
> = {
  emerald: {
    stroke: "#10b981",
    gradientId: "sparkline-emerald",
    border: "border-l-emerald-500",
    hoverBorder: "hover:border-l-emerald-400",
    iconBg:
      "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    iconText: "text-emerald-600 dark:text-emerald-400",
    glowBg: "bg-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-400",
  },
  cyan: {
    stroke: "#06b6d4",
    gradientId: "sparkline-cyan",
    border: "border-l-cyan-500",
    hoverBorder: "hover:border-l-cyan-400",
    iconBg:
      "bg-cyan-50 border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20",
    iconText: "text-cyan-600 dark:text-cyan-400",
    glowBg: "bg-cyan-400",
    badgeBg: "bg-cyan-500/10 border-cyan-500/20",
    badgeText: "text-cyan-700 dark:text-cyan-400",
  },
  indigo: {
    stroke: "#6366f1",
    gradientId: "sparkline-indigo",
    border: "border-l-indigo-500",
    hoverBorder: "hover:border-l-indigo-400",
    iconBg:
      "bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20",
    iconText: "text-indigo-600 dark:text-indigo-400",
    glowBg: "bg-indigo-400",
    badgeBg: "bg-indigo-500/10 border-indigo-500/20",
    badgeText: "text-indigo-700 dark:text-indigo-400",
  },
  violet: {
    stroke: "#8b5cf6",
    gradientId: "sparkline-violet",
    border: "border-l-violet-500",
    hoverBorder: "hover:border-l-violet-400",
    iconBg:
      "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
    iconText: "text-violet-600 dark:text-violet-400",
    glowBg: "bg-violet-400",
    badgeBg: "bg-violet-500/10 border-violet-500/20",
    badgeText: "text-violet-700 dark:text-violet-400",
  },
  orange: {
    stroke: "#f97316",
    gradientId: "sparkline-orange",
    border: "border-l-orange-500",
    hoverBorder: "hover:border-l-orange-400",
    iconBg:
      "bg-orange-50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20",
    iconText: "text-orange-600 dark:text-orange-400",
    glowBg: "bg-orange-400",
    badgeBg: "bg-orange-500/10 border-orange-500/20",
    badgeText: "text-orange-700 dark:text-orange-400",
  },
  pink: {
    stroke: "#ec4899",
    gradientId: "sparkline-pink",
    border: "border-l-pink-500",
    hoverBorder: "hover:border-l-pink-400",
    iconBg:
      "bg-pink-50 border-pink-100 dark:bg-pink-500/10 dark:border-pink-500/20",
    iconText: "text-pink-600 dark:text-pink-400",
    glowBg: "bg-pink-400",
    badgeBg: "bg-pink-500/10 border-pink-500/20",
    badgeText: "text-pink-700 dark:text-pink-400",
  },
  // Legacy aliases — map to primary 6
  blue: {
    stroke: "#6366f1",
    gradientId: "sparkline-indigo",
    border: "border-l-indigo-500",
    hoverBorder: "hover:border-l-indigo-400",
    iconBg:
      "bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20",
    iconText: "text-indigo-600 dark:text-indigo-400",
    glowBg: "bg-indigo-400",
    badgeBg: "bg-indigo-500/10 border-indigo-500/20",
    badgeText: "text-indigo-700 dark:text-indigo-400",
  },
  purple: {
    stroke: "#8b5cf6",
    gradientId: "sparkline-violet",
    border: "border-l-violet-500",
    hoverBorder: "hover:border-l-violet-400",
    iconBg:
      "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
    iconText: "text-violet-600 dark:text-violet-400",
    glowBg: "bg-violet-400",
    badgeBg: "bg-violet-500/10 border-violet-500/20",
    badgeText: "text-violet-700 dark:text-violet-400",
  },
  primary: {
    stroke: "#6366f1",
    gradientId: "sparkline-indigo",
    border: "border-l-indigo-500",
    hoverBorder: "hover:border-l-indigo-400",
    iconBg:
      "bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20",
    iconText: "text-indigo-600 dark:text-indigo-400",
    glowBg: "bg-indigo-400",
    badgeBg: "bg-indigo-500/10 border-indigo-500/20",
    badgeText: "text-indigo-700 dark:text-indigo-400",
  },
  slate: {
    stroke: "#6366f1",
    gradientId: "sparkline-indigo",
    border: "border-l-indigo-500",
    hoverBorder: "hover:border-l-indigo-400",
    iconBg:
      "bg-indigo-50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20",
    iconText: "text-indigo-600 dark:text-indigo-400",
    glowBg: "bg-indigo-400",
    badgeBg: "bg-indigo-500/10 border-indigo-500/20",
    badgeText: "text-indigo-700 dark:text-indigo-400",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface CRMMetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  /** Override icon colour classes if needed */
  iconColor?: string;
  sparklineData?: { value: number }[];
  /** Framer-motion stagger delay in seconds */
  delay?: number;
  color?: MetricColor;
  loading?: boolean;
  comparisonText?: string;
  /** Additional classes for the card root */
  className?: string;
  /** Hide the bottom skeletons (change, comparison, sparkline) during loading state */
  hideBottomSkeletons?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Premium KPI Card Component
// ─────────────────────────────────────────────────────────────────────────────

export const CRMMetricCard = ({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  iconColor,
  sparklineData,
  delay = 0,
  color = "indigo",
  loading = false,
  comparisonText,
  className,
  hideBottomSkeletons = false,
}: CRMMetricCardProps) => {
  const t = COLOR_TOKENS[color] ?? COLOR_TOKENS.indigo;
  const isUp = trend === "up";
  const isDown = trend === "down";
  
  const chartData = sparklineData && sparklineData.length > 0 ? sparklineData : [{ value: 0 }, { value: 0 }, { value: 0 }];
  const isFlat = chartData.every(d => d.value === chartData[0]?.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        // ── Base surface ──
        "group relative overflow-hidden min-w-0",
        "bg-card text-card-foreground",
        // ── Premium border system: subtle all-around + left accent ──
        "border border-border/70 border-l-4",
        t.border,
        // ── Rounded corners matching CRM design system ──
        "rounded-xl",
        // ── Breathing layout ──
        "p-4 sm:p-5 flex flex-col justify-between h-full",
        // ── Clean border surface ──
        "shadow-none",
        // ── Premium subtle hover ──
        "transition-all duration-200 ease-out",
        t.hoverBorder,
        "hover:border-t-border/70 hover:border-r-border/70 hover:border-b-border/70",
        className
      )}
    >
      {/* ── Ambient Radial Glow (top-right) ── */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full",
          "blur-2xl opacity-[0.06] transition-opacity duration-500",
          "group-hover:opacity-[0.12]",
          t.glowBg
        )}
      />

      {/* ── Top Row: Label + Icon ── */}
      <div className="flex items-start justify-between gap-3 mb-3.5 min-w-0">
        <div className="space-y-1 flex-1 min-w-0">
          {/* Label */}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 truncate leading-none">
            {title}
          </p>

          {/* Metric value */}
          {loading ? (
            <Skeleton className="h-7 w-24 mt-1 rounded-md" />
          ) : (
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums truncate text-foreground leading-tight mt-1">
              {value}
            </h3>
          )}
        </div>

        {/* Floating Icon Container */}
        {Icon && (
          <div
            className={cn(
              "flex shrink-0 size-9 sm:size-10 items-center justify-center",
              "rounded-lg border",
              "transition-all duration-300",
              "group-hover:scale-105",
              // Premium icon glow on hover
              "group-hover:shadow-[0_3px_10px_-3px_currentColor]",
              t.iconBg,
              t.iconText,
              iconColor // optional override
            )}
          >
            <AppIcon icon={Icon} name={title} size={18} />
          </div>
        )}
      </div>

      {/* ── Bottom Row: Trend Badge + Sparkline ── */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1 min-w-0">
        {/* Trend badge + comparison text */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {loading && !hideBottomSkeletons ? (
            <Skeleton className="h-4.5 w-14 rounded-full" />
          ) : (
            change && (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {/* Pill badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold",
                    "px-2 py-0.5 rounded-full border tracking-normal shrink-0",
                    isUp
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400"
                      : isDown
                      ? "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400"
                      : "bg-muted/60 text-muted-foreground border-border/60"
                  )}
                >
                  {isUp && <TrendingUp className="w-2.5 h-2.5 shrink-0" />}
                  {isDown && <TrendingDown className="w-2.5 h-2.5 shrink-0" />}
                  {!isUp && !isDown && (
                    <Minus className="w-2.5 h-2.5 shrink-0" />
                  )}
                  <span className="truncate max-w-[120px]">{change}</span>
                </div>

                {/* Comparison context text */}
                {comparisonText && (
                  <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/65 tracking-tight truncate">
                    {comparisonText}
                  </span>
                )}
              </div>
            )
          )}
        </div>

        {/* Sparkline chart */}
        {(sparklineData || (loading && !hideBottomSkeletons)) && (
          <div className="h-8 w-20 -mr-1 min-h-[32px] min-w-0 shrink-0">
            <ChartContainer
              height="100%"
              loading={loading}
              hasData={true}
              className="w-full h-full"
            >
              <AreaChart data={chartData}>
                <YAxis hide domain={[0, isFlat ? (dataMax: number) => (dataMax || 1) * 100 : 'dataMax']} />
                <defs>
                  <linearGradient
                    id={t.gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={t.stroke}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="100%"
                      stopColor={t.stroke}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={t.stroke}
                  strokeWidth={2}
                  fill={`url(#${t.gradientId})`}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  dot={({ cx, cy, index }: SparklineDotProps) => {
                    // Premium pulsing dot only on the last data point
                    if (
                      index === chartData.length - 1 &&
                      cx !== undefined &&
                      cy !== undefined
                    ) {
                      return (
                        <g key={`dot-last-${index}`}>
                          {/* Outer pulse ring */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={t.stroke}
                            fillOpacity={0.2}
                          />
                          {/* Inner solid dot */}
                          <circle
                            cx={cx}
                            cy={cy}
                            r={2.5}
                            fill={t.stroke}
                            stroke="white"
                            strokeWidth={1.5}
                          />
                        </g>
                      );
                    }
                    return <g key={`dot-${index}`} />;
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};


