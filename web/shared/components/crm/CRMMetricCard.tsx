"use client";

import React from "react";
import { LucideIcon, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";
/**
 * Architectural Rule — Metric Card Usage:
 * CRMMetricCard and CRMMetricsGrid are NOT global CRM page requirements.
 *
 * Allowed / Expected:
 * - Dashboard (/dashboard)
 * - Analytics / Reports (/reports, /analytics)
 *
 * NOT required by default on standard CRUD/list pages:
 * - Contacts, Companies, Deals, Tasks, Invoices, Quotations, Employees, Settings, Super Admin.
 */
// ─────────────────────────────────────────────────────────────────────────────
// Types & Config
// ─────────────────────────────────────────────────────────────────────────────

export type SemanticTone = "neutral" | "primary" | "success" | "warning" | "destructive";

export type MetricColor =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "emerald"
  | "cyan"
  | "indigo"
  | "violet"
  | "orange"
  | "pink"
  | "blue"
  | "purple"
  | "slate";

interface MetricCardThemeConfig {
  bgClass: string;
  borderClass: string;
  dotColor: string;
  iconColor: string;
  ghostIconColor: string;
  trendColor: string;
  titleColor: string;
  valueColor: string;
  sparklineStroke: string;
  fallbackWave: string;
}

const COLOR_CONFIGS: Record<MetricColor, MetricCardThemeConfig> = {
  emerald: {
    bgClass: "bg-[#d7f4e3] dark:bg-emerald-950/40",
    borderClass: "border-emerald-200/60 dark:border-emerald-800/40",
    dotColor: "#059669",
    iconColor: "text-[#059669] dark:text-emerald-400",
    ghostIconColor: "text-[#10b981] dark:text-emerald-500",
    trendColor: "text-[#047857] dark:text-emerald-300",
    titleColor: "text-[#065f46]/85 dark:text-emerald-200/85",
    valueColor: "text-[#064e3b] dark:text-emerald-100",
    sparklineStroke: "#047857",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },
  success: {
    bgClass: "bg-[#d7f4e3] dark:bg-emerald-950/40",
    borderClass: "border-emerald-200/60 dark:border-emerald-800/40",
    dotColor: "#059669",
    iconColor: "text-[#059669] dark:text-emerald-400",
    ghostIconColor: "text-[#10b981] dark:text-emerald-500",
    trendColor: "text-[#047857] dark:text-emerald-300",
    titleColor: "text-[#065f46]/85 dark:text-emerald-200/85",
    valueColor: "text-[#064e3b] dark:text-emerald-100",
    sparklineStroke: "#047857",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },
  violet: {
    bgClass: "bg-[#ece3fc] dark:bg-violet-950/40",
    borderClass: "border-violet-200/60 dark:border-violet-800/40",
    dotColor: "#7c3aed",
    iconColor: "text-[#7c3aed] dark:text-violet-400",
    ghostIconColor: "text-[#8b5cf6] dark:text-violet-500",
    trendColor: "text-[#5b21b6] dark:text-violet-300",
    titleColor: "text-[#4c1d95]/85 dark:text-violet-200/85",
    valueColor: "text-[#3b0764] dark:text-violet-100",
    sparklineStroke: "#6d28d9",
    fallbackWave: "M 4 14 C 12 16, 18 24, 24 24 C 30 20, 36 6, 42 6 C 46 22, 50 28, 56 26 C 60 24, 64 18, 68 18",
  },
  purple: {
    bgClass: "bg-[#ece3fc] dark:bg-violet-950/40",
    borderClass: "border-violet-200/60 dark:border-violet-800/40",
    dotColor: "#7c3aed",
    iconColor: "text-[#7c3aed] dark:text-violet-400",
    ghostIconColor: "text-[#8b5cf6] dark:text-violet-500",
    trendColor: "text-[#5b21b6] dark:text-violet-300",
    titleColor: "text-[#4c1d95]/85 dark:text-violet-200/85",
    valueColor: "text-[#3b0764] dark:text-violet-100",
    sparklineStroke: "#6d28d9",
    fallbackWave: "M 4 14 C 12 16, 18 24, 24 24 C 30 20, 36 6, 42 6 C 46 22, 50 28, 56 26 C 60 24, 64 18, 68 18",
  },
  orange: {
    bgClass: "bg-[#fef3c7] dark:bg-amber-950/40",
    borderClass: "border-amber-200/60 dark:border-amber-800/40",
    dotColor: "#d97706",
    iconColor: "text-[#d97706] dark:text-amber-400",
    ghostIconColor: "text-[#f59e0b] dark:text-amber-500",
    trendColor: "text-[#92400e] dark:text-amber-300",
    titleColor: "text-[#78350f]/85 dark:text-amber-200/85",
    valueColor: "text-[#78350f] dark:text-amber-100",
    sparklineStroke: "#b45309",
    fallbackWave: "M 4 20 C 12 18, 16 10, 24 10 C 30 18, 36 22, 42 12 C 48 8, 54 8, 60 22 C 64 18, 66 12, 68 14",
  },
  warning: {
    bgClass: "bg-[#fef3c7] dark:bg-amber-950/40",
    borderClass: "border-amber-200/60 dark:border-amber-800/40",
    dotColor: "#d97706",
    iconColor: "text-[#d97706] dark:text-amber-400",
    ghostIconColor: "text-[#f59e0b] dark:text-amber-500",
    trendColor: "text-[#92400e] dark:text-amber-300",
    titleColor: "text-[#78350f]/85 dark:text-amber-200/85",
    valueColor: "text-[#78350f] dark:text-amber-100",
    sparklineStroke: "#b45309",
    fallbackWave: "M 4 20 C 12 18, 16 10, 24 10 C 30 18, 36 22, 42 12 C 48 8, 54 8, 60 22 C 64 18, 66 12, 68 14",
  },
  pink: {
    bgClass: "bg-[#fedcd2] dark:bg-rose-950/40",
    borderClass: "border-rose-200/60 dark:border-rose-800/40",
    dotColor: "#e11d48",
    iconColor: "text-[#e11d48] dark:text-rose-400",
    ghostIconColor: "text-[#fb7185] dark:text-rose-500",
    trendColor: "text-[#9f1239] dark:text-rose-300",
    titleColor: "text-[#881337]/85 dark:text-rose-200/85",
    valueColor: "text-[#881337] dark:text-rose-100",
    sparklineStroke: "#be123c",
    fallbackWave: "M 4 14 C 10 24, 16 28, 22 26 C 28 14, 34 14, 40 22 C 48 24, 56 12, 68 4",
  },
  destructive: {
    bgClass: "bg-[#fedcd2] dark:bg-rose-950/40",
    borderClass: "border-rose-200/60 dark:border-rose-800/40",
    dotColor: "#e11d48",
    iconColor: "text-[#e11d48] dark:text-rose-400",
    ghostIconColor: "text-[#fb7185] dark:text-rose-500",
    trendColor: "text-[#9f1239] dark:text-rose-300",
    titleColor: "text-[#881337]/85 dark:text-rose-200/85",
    valueColor: "text-[#881337] dark:text-rose-100",
    sparklineStroke: "#be123c",
    fallbackWave: "M 4 14 C 10 24, 16 28, 22 26 C 28 14, 34 14, 40 22 C 48 24, 56 12, 68 4",
  },
  blue: {
    bgClass: "bg-[#dbeafe] dark:bg-blue-950/40",
    borderClass: "border-blue-200/60 dark:border-blue-800/40",
    dotColor: "#2563eb",
    iconColor: "text-[#2563eb] dark:text-blue-400",
    ghostIconColor: "text-[#3b82f6] dark:text-blue-500",
    trendColor: "text-[#1e40af] dark:text-blue-300",
    titleColor: "text-[#1e3a8a]/85 dark:text-blue-200/85",
    valueColor: "text-[#1e3a8a] dark:text-blue-100",
    sparklineStroke: "#1d4ed8",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },
  primary: {
    bgClass: "bg-[#dbeafe] dark:bg-blue-950/40",
    borderClass: "border-blue-200/60 dark:border-blue-800/40",
    dotColor: "#2563eb",
    iconColor: "text-[#2563eb] dark:text-blue-400",
    ghostIconColor: "text-[#3b82f6] dark:text-blue-500",
    trendColor: "text-[#1e40af] dark:text-blue-300",
    titleColor: "text-[#1e3a8a]/85 dark:text-blue-200/85",
    valueColor: "text-[#1e3a8a] dark:text-blue-100",
    sparklineStroke: "#1d4ed8",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },
  cyan: {
    bgClass: "bg-[#cffafe] dark:bg-cyan-950/40",
    borderClass: "border-cyan-200/60 dark:border-cyan-800/40",
    dotColor: "#0891b2",
    iconColor: "text-[#0891b2] dark:text-cyan-400",
    ghostIconColor: "text-[#06b6d4] dark:text-cyan-500",
    trendColor: "text-[#155e75] dark:text-cyan-300",
    titleColor: "text-[#164e63]/85 dark:text-cyan-200/85",
    valueColor: "text-[#164e63] dark:text-cyan-100",
    sparklineStroke: "#0e7490",
    fallbackWave: "M 4 14 C 12 16, 18 24, 24 24 C 30 20, 36 6, 42 6 C 46 22, 50 28, 56 26 C 60 24, 64 18, 68 18",
  },
  indigo: {
    bgClass: "bg-[#e0e7ff] dark:bg-indigo-950/40",
    borderClass: "border-indigo-200/60 dark:border-indigo-800/40",
    dotColor: "#4f46e5",
    iconColor: "text-[#4f46e5] dark:text-indigo-400",
    ghostIconColor: "text-[#6366f1] dark:text-indigo-500",
    trendColor: "text-[#3730a3] dark:text-indigo-300",
    titleColor: "text-[#312e81]/85 dark:text-indigo-200/85",
    valueColor: "text-[#312e81] dark:text-indigo-100",
    sparklineStroke: "#4338ca",
    fallbackWave: "M 4 20 C 12 18, 16 10, 24 10 C 30 18, 36 22, 42 12 C 48 8, 54 8, 60 22 C 64 18, 66 12, 68 14",
  },
  neutral: {
    bgClass: "bg-[#f1f5f9] dark:bg-slate-900/50",
    borderClass: "border-slate-200/60 dark:border-slate-800/40",
    dotColor: "#64748b",
    iconColor: "text-[#475569] dark:text-slate-300",
    ghostIconColor: "text-[#94a3b8] dark:text-slate-500",
    trendColor: "text-[#334155] dark:text-slate-300",
    titleColor: "text-[#1e293b]/85 dark:text-slate-300/85",
    valueColor: "text-[#0f172a] dark:text-slate-100",
    sparklineStroke: "#475569",
    fallbackWave: "M 4 16 C 12 8, 18 22, 26 12 C 34 18, 40 6, 48 20 C 54 10, 58 16, 62 12",
  },
  slate: {
    bgClass: "bg-[#f1f5f9] dark:bg-slate-900/50",
    borderClass: "border-slate-200/60 dark:border-slate-800/40",
    dotColor: "#64748b",
    iconColor: "text-[#475569] dark:text-slate-300",
    ghostIconColor: "text-[#94a3b8] dark:text-slate-500",
    trendColor: "text-[#334155] dark:text-slate-300",
    titleColor: "text-[#1e293b]/85 dark:text-slate-300/85",
    valueColor: "text-[#0f172a] dark:text-slate-100",
    sparklineStroke: "#475569",
    fallbackWave: "M 4 16 C 12 8, 18 22, 26 12 C 34 18, 40 6, 48 20 C 54 10, 58 16, 62 12",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline Wave Curve Component (Bottom-Right)
// ─────────────────────────────────────────────────────────────────────────────

interface SparklineCurveProps {
  data?: { value: number }[];
  trend?: "up" | "down" | "neutral";
  strokeColor: string;
  fallbackWave?: string;
}

const SparklineCurve = ({ data, trend = "neutral", strokeColor, fallbackWave }: SparklineCurveProps) => {
  const hasVariation =
    data &&
    data.length >= 2 &&
    data.some((d, _, arr) => d.value !== arr[0].value);

  const width = 72;
  const height = 32;

  // If custom numeric points exist with variation across time, compute smooth cubic bezier path
  if (data && data.length >= 2 && hasVariation) {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const paddingX = 4;
    const paddingY = 4;

    const points = values.map((v, i) => ({
      x: paddingX + (i / (values.length - 1)) * (width - 2 * paddingX),
      y: height - paddingY - ((v - min) / range) * (height - 2 * paddingY),
    }));

    // Generate smooth bezier curve path
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX.toFixed(1)} ${p0.y.toFixed(1)}, ${cpX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    return (
      <svg className="w-[72px] h-[32px] shrink-0 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Pre-configured natural organic sparkline waves matching reference design
  let pathD = fallbackWave;
  if (!pathD) {
    if (trend === "up") {
      pathD = "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22";
    } else if (trend === "down") {
      pathD = "M 4 14 C 12 16, 18 24, 24 24 C 30 20, 36 6, 42 6 C 46 22, 50 28, 56 26 C 60 24, 64 18, 68 18";
    } else {
      pathD = "M 4 20 C 12 18, 16 10, 24 10 C 30 18, 36 22, 42 12 C 48 8, 54 8, 60 22 C 64 18, 66 12, 68 14";
    }
  }

  return (
    <svg className="w-[72px] h-[32px] shrink-0 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Halftone Dot Grid Component (Bottom-Left Decorative Texture)
// ─────────────────────────────────────────────────────────────────────────────

interface HalftonePatternProps {
  dotColor: string;
  patternId: string;
}

const HalftonePattern = ({ dotColor, patternId }: HalftonePatternProps) => {
  return (
    <svg
      className="absolute -bottom-3 -left-3 w-40 h-40 pointer-events-none select-none overflow-hidden"
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`dot-gradient-${patternId}`} cx="5%" cy="95%" r="85%">
          <stop offset="0%" stopColor={dotColor} stopOpacity="0.32" />
          <stop offset="45%" stopColor={dotColor} stopOpacity="0.16" />
          <stop offset="100%" stopColor={dotColor} stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`dots-${patternId}`}
          x="0"
          y="0"
          width="11"
          height="11"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.6" fill={`url(#dot-gradient-${patternId})`} />
        </pattern>
      </defs>
      <rect width="160" height="160" fill={`url(#dots-${patternId})`} />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface CRMMetricCardProps {
  /** Metric label / title */
  title?: string;
  /** Canonical label prop (alias for title) */
  label?: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  /** Override icon colour classes if needed */
  iconColor?: string;
  sparklineData?: { value: number }[];
  /** Framer-motion stagger delay in seconds */
  delay?: number;
  /** Canonical semantic tone */
  tone?: SemanticTone;
  /** Legacy color prop mapped to semantic tone */
  color?: MetricColor;
  loading?: boolean;
  comparisonText?: string;
  /** Additional classes for the card root */
  className?: string;
  /** Hide the bottom skeletons during loading state */
  hideBottomSkeletons?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical Semantic Metric Card Component
// ─────────────────────────────────────────────────────────────────────────────

export const CRMMetricCard = ({
  title: directTitle,
  label,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  iconColor,
  sparklineData,
  delay = 0,
  tone: directTone,
  color = "primary",
  loading = false,
  comparisonText,
  className,
  hideBottomSkeletons = false,
}: CRMMetricCardProps) => {
  const title = directTitle ?? label;
  const activeColor: MetricColor = color ?? directTone ?? "primary";
  const config = COLOR_CONFIGS[activeColor] ?? COLOR_CONFIGS.primary;

  const isUp = trend === "up";
  const isDown = trend === "down";

  // Generate safe unique ID for SVG pattern defs
  const rawId = React.useId();
  const patternId = React.useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, "_"), [rawId]);

  const displayChange = change
    ? !isUp && !isDown && change.startsWith("+")
      ? change.slice(1)
      : change
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        // Base container: pill-rounded, soft pastel surface with clean border
        "group relative overflow-hidden min-w-0 flex flex-col justify-between select-none",
        "rounded-2xl sm:rounded-[22px] p-5 sm:p-5.5",
        "border shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5",
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      {/* ── Halftone dot texture on bottom-left ── */}
      <HalftonePattern dotColor={config.dotColor} patternId={patternId} />

      {/* ── TOP ROW: Layered Floating Icon (Left) + Trend Percentage (Right) ── */}
      <div className="flex items-center justify-between gap-3 z-10">
        {Icon && (
          <div className="relative inline-flex items-center justify-center select-none">
            {/* Ghost offset icon layer */}
            <div
              className={cn(
                "absolute -top-1 -left-1.5 opacity-35 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5",
                config.ghostIconColor
              )}
              aria-hidden="true"
            >
              <AppIcon icon={Icon} name={title} size={28} />
            </div>
            {/* Main foreground icon layer */}
            <div
              className={cn(
                "relative z-10 transition-transform duration-300 group-hover:scale-105",
                config.iconColor,
                iconColor
              )}
            >
              <AppIcon icon={Icon} name={title} size={25} />
            </div>
          </div>
        )}

        {/* Trend Indicator Badge (Top Right) */}
        {loading && !hideBottomSkeletons ? (
          <Skeleton className="h-5 w-14 rounded-full opacity-60" />
        ) : (
          displayChange && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs sm:text-sm font-bold tracking-tight shrink-0",
                config.trendColor
              )}
            >
              {isUp && <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />}
              {isDown && <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />}
              {!isUp && !isDown && <Minus className="w-3 h-3 stroke-[2.5]" />}
              <span>{displayChange}</span>
            </div>
          )
        )}
      </div>

      {/* ── BOTTOM ROW: Metric Label & Hero Value (Left) + Sparkline (Right) ── */}
      <div className="flex items-end justify-between gap-2 mt-4 sm:mt-5 z-10">
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={cn("text-xs sm:text-sm font-semibold tracking-tight truncate", config.titleColor)}>
            {title}
          </p>

          {loading ? (
            <Skeleton className="h-8 w-24 rounded-md opacity-60 mt-1" />
          ) : (
            <h3 className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums truncate leading-tight", config.valueColor)}>
              {value}
            </h3>
          )}

          {comparisonText && !loading && (
            <p className={cn("text-[11px] sm:text-xs font-medium opacity-70 truncate leading-tight pt-0.5", config.titleColor)}>
              {comparisonText}
            </p>
          )}
        </div>

        {/* Sparkline Curve */}
        {!loading && (
          <div className="shrink-0 mb-0.5">
            <SparklineCurve
              data={sparklineData}
              trend={trend}
              strokeColor={config.sparklineStroke}
              fallbackWave={config.fallbackWave}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
