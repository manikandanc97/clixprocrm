"use client";

import React from "react";
import { LucideIcon, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
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

// ─────────────────────────────────────────────────────────────────────────────
// Color Configuration Map
// ─────────────────────────────────────────────────────────────────────────────
//
// DESIGN SYSTEM NOTE:
// bgClass / borderClass use Tailwind opacity modifiers on known color families.
// These are INTENTIONAL data-visualization colors — not semantic UI surfaces.
// Each color (emerald, violet, amber, rose, blue, cyan, indigo) represents a
// distinct metric category, NOT a status state that follows the accent theme.
//
// Exception: "primary" uses bg-primary/10 so it follows the active accent.
//
// SVG sparkline stroke + halftone dot colors MUST be color values (not classes),
// because SVG fill/stroke attributes cannot consume Tailwind classes.
// They use oklch() values aligned to design system tokens.
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_CONFIGS: Record<MetricColor, MetricCardThemeConfig> = {
  // ── Emerald / Success ──────────────────────────────────────────────────────
  emerald: {
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/15",
    borderClass: "border-emerald-500/20 dark:border-emerald-500/25",
    dotColor: "oklch(0.52 0.165 157)",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ghostIconColor: "text-emerald-500/40 dark:text-emerald-500/30",
    trendColor: "text-emerald-700 dark:text-emerald-300",
    titleColor: "text-emerald-900/80 dark:text-emerald-200/80",
    valueColor: "text-emerald-950 dark:text-emerald-100",
    sparklineStroke: "oklch(0.48 0.165 157)",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },
  success: {
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/15",
    borderClass: "border-emerald-500/20 dark:border-emerald-500/25",
    dotColor: "oklch(0.52 0.165 157)",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ghostIconColor: "text-emerald-500/40 dark:text-emerald-500/30",
    trendColor: "text-emerald-700 dark:text-emerald-300",
    titleColor: "text-emerald-900/80 dark:text-emerald-200/80",
    valueColor: "text-emerald-950 dark:text-emerald-100",
    sparklineStroke: "oklch(0.48 0.165 157)",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },

  // ── Violet / Purple ────────────────────────────────────────────────────────
  violet: {
    bgClass: "bg-violet-500/10 dark:bg-violet-500/15",
    borderClass: "border-violet-500/20 dark:border-violet-500/25",
    dotColor: "oklch(0.54 0.22 295)",
    iconColor: "text-violet-600 dark:text-violet-400",
    ghostIconColor: "text-violet-500/40 dark:text-violet-500/30",
    trendColor: "text-violet-700 dark:text-violet-300",
    titleColor: "text-violet-900/80 dark:text-violet-200/80",
    valueColor: "text-violet-950 dark:text-violet-100",
    sparklineStroke: "oklch(0.50 0.22 295)",
    fallbackWave: "M 4 14 C 12 16, 18 24, 24 24 C 30 20, 36 6, 42 6 C 46 22, 50 28, 56 26 C 60 24, 64 18, 68 18",
  },
  purple: {
    bgClass: "bg-violet-500/10 dark:bg-violet-500/15",
    borderClass: "border-violet-500/20 dark:border-violet-500/25",
    dotColor: "oklch(0.54 0.22 295)",
    iconColor: "text-violet-600 dark:text-violet-400",
    ghostIconColor: "text-violet-500/40 dark:text-violet-500/30",
    trendColor: "text-violet-700 dark:text-violet-300",
    titleColor: "text-violet-900/80 dark:text-violet-200/80",
    valueColor: "text-violet-950 dark:text-violet-100",
    sparklineStroke: "oklch(0.50 0.22 295)",
    fallbackWave: "M 4 14 C 12 16, 18 24, 24 24 C 30 20, 36 6, 42 6 C 46 22, 50 28, 56 26 C 60 24, 64 18, 68 18",
  },

  // ── Amber / Orange / Warning ───────────────────────────────────────────────
  orange: {
    bgClass: "bg-amber-500/10 dark:bg-amber-500/15",
    borderClass: "border-amber-500/20 dark:border-amber-500/25",
    dotColor: "oklch(0.62 0.17 75)",
    iconColor: "text-amber-600 dark:text-amber-400",
    ghostIconColor: "text-amber-500/40 dark:text-amber-500/30",
    trendColor: "text-amber-700 dark:text-amber-300",
    titleColor: "text-amber-900/80 dark:text-amber-200/80",
    valueColor: "text-amber-950 dark:text-amber-100",
    sparklineStroke: "oklch(0.58 0.17 75)",
    fallbackWave: "M 4 20 C 12 18, 16 10, 24 10 C 30 18, 36 22, 42 12 C 48 8, 54 8, 60 22 C 64 18, 66 12, 68 14",
  },
  warning: {
    bgClass: "bg-amber-500/10 dark:bg-amber-500/15",
    borderClass: "border-amber-500/20 dark:border-amber-500/25",
    dotColor: "oklch(0.62 0.17 75)",
    iconColor: "text-amber-600 dark:text-amber-400",
    ghostIconColor: "text-amber-500/40 dark:text-amber-500/30",
    trendColor: "text-amber-700 dark:text-amber-300",
    titleColor: "text-amber-900/80 dark:text-amber-200/80",
    valueColor: "text-amber-950 dark:text-amber-100",
    sparklineStroke: "oklch(0.58 0.17 75)",
    fallbackWave: "M 4 20 C 12 18, 16 10, 24 10 C 30 18, 36 22, 42 12 C 48 8, 54 8, 60 22 C 64 18, 66 12, 68 14",
  },

  // ── Rose / Pink / Destructive ──────────────────────────────────────────────
  pink: {
    bgClass: "bg-rose-500/10 dark:bg-rose-500/15",
    borderClass: "border-rose-500/20 dark:border-rose-500/25",
    dotColor: "oklch(0.56 0.21 15)",
    iconColor: "text-rose-600 dark:text-rose-400",
    ghostIconColor: "text-rose-500/40 dark:text-rose-500/30",
    trendColor: "text-rose-700 dark:text-rose-300",
    titleColor: "text-rose-900/80 dark:text-rose-200/80",
    valueColor: "text-rose-950 dark:text-rose-100",
    sparklineStroke: "oklch(0.52 0.21 15)",
    fallbackWave: "M 4 14 C 10 24, 16 28, 22 26 C 28 14, 34 14, 40 22 C 48 24, 56 12, 68 4",
  },
  destructive: {
    bgClass: "bg-rose-500/10 dark:bg-rose-500/15",
    borderClass: "border-rose-500/20 dark:border-rose-500/25",
    dotColor: "oklch(0.56 0.21 15)",
    iconColor: "text-rose-600 dark:text-rose-400",
    ghostIconColor: "text-rose-500/40 dark:text-rose-500/30",
    trendColor: "text-rose-700 dark:text-rose-300",
    titleColor: "text-rose-900/80 dark:text-rose-200/80",
    valueColor: "text-rose-950 dark:text-rose-100",
    sparklineStroke: "oklch(0.52 0.21 15)",
    fallbackWave: "M 4 14 C 10 24, 16 28, 22 26 C 28 14, 34 14, 40 22 C 48 24, 56 12, 68 4",
  },

  // ── Blue / Info ────────────────────────────────────────────────────────────
  blue: {
    bgClass: "bg-blue-500/10 dark:bg-blue-500/15",
    borderClass: "border-blue-500/20 dark:border-blue-500/25",
    dotColor: "oklch(0.55 0.19 250)",
    iconColor: "text-blue-600 dark:text-blue-400",
    ghostIconColor: "text-blue-500/40 dark:text-blue-500/30",
    trendColor: "text-blue-700 dark:text-blue-300",
    titleColor: "text-blue-900/80 dark:text-blue-200/80",
    valueColor: "text-blue-950 dark:text-blue-100",
    sparklineStroke: "oklch(0.50 0.19 250)",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },

  // ── Primary — Follows active accent theme ──────────────────────────────────
  // IMPORTANT: Unlike other configs, "primary" uses semantic bg-primary/10 so
  // the card background responds to accent theme changes (emerald → blue → violet).
  primary: {
    bgClass: "bg-primary/10 dark:bg-primary/15",
    borderClass: "border-primary/20 dark:border-primary/25",
    dotColor: "oklch(0.58 0.165 157)", // Emerald default; changes with accent via CSS
    iconColor: "text-primary",
    ghostIconColor: "text-primary/30",
    trendColor: "text-primary/80 dark:text-primary/90",
    titleColor: "text-foreground/80",
    valueColor: "text-foreground",
    sparklineStroke: "oklch(0.52 0.165 157)",
    fallbackWave: "M 4 22 C 14 26, 20 18, 28 14 C 36 10, 42 4, 52 4 C 60 4, 64 12, 68 22",
  },

  // ── Cyan / Teal ────────────────────────────────────────────────────────────
  cyan: {
    bgClass: "bg-cyan-500/10 dark:bg-cyan-500/15",
    borderClass: "border-cyan-500/20 dark:border-cyan-500/25",
    dotColor: "oklch(0.60 0.16 210)",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    ghostIconColor: "text-cyan-500/40 dark:text-cyan-500/30",
    trendColor: "text-cyan-700 dark:text-cyan-300",
    titleColor: "text-cyan-900/80 dark:text-cyan-200/80",
    valueColor: "text-cyan-950 dark:text-cyan-100",
    sparklineStroke: "oklch(0.56 0.16 210)",
    fallbackWave: "M 4 14 C 12 16, 18 24, 24 24 C 30 20, 36 6, 42 6 C 46 22, 50 28, 56 26 C 60 24, 64 18, 68 18",
  },

  // ── Indigo ─────────────────────────────────────────────────────────────────
  indigo: {
    bgClass: "bg-indigo-500/10 dark:bg-indigo-500/15",
    borderClass: "border-indigo-500/20 dark:border-indigo-500/25",
    dotColor: "oklch(0.55 0.22 265)",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    ghostIconColor: "text-indigo-500/40 dark:text-indigo-500/30",
    trendColor: "text-indigo-700 dark:text-indigo-300",
    titleColor: "text-indigo-900/80 dark:text-indigo-200/80",
    valueColor: "text-indigo-950 dark:text-indigo-100",
    sparklineStroke: "oklch(0.50 0.22 265)",
    fallbackWave: "M 4 20 C 12 18, 16 10, 24 10 C 30 18, 36 22, 42 12 C 48 8, 54 8, 60 22 C 64 18, 66 12, 68 14",
  },

  // ── Neutral / Slate ────────────────────────────────────────────────────────
  neutral: {
    bgClass: "bg-muted/60 dark:bg-muted/40",
    borderClass: "border-border/60 dark:border-border/40",
    dotColor: "oklch(0.52 0.015 255)",
    iconColor: "text-muted-foreground",
    ghostIconColor: "text-muted-foreground/30",
    trendColor: "text-foreground/70",
    titleColor: "text-muted-foreground",
    valueColor: "text-foreground",
    sparklineStroke: "oklch(0.52 0.015 255)",
    fallbackWave: "M 4 16 C 12 8, 18 22, 26 12 C 34 18, 40 6, 48 20 C 54 10, 58 16, 62 12",
  },
  slate: {
    bgClass: "bg-muted/60 dark:bg-muted/40",
    borderClass: "border-border/60 dark:border-border/40",
    dotColor: "oklch(0.52 0.015 255)",
    iconColor: "text-muted-foreground",
    ghostIconColor: "text-muted-foreground/30",
    trendColor: "text-foreground/70",
    titleColor: "text-muted-foreground",
    valueColor: "text-foreground",
    sparklineStroke: "oklch(0.52 0.015 255)",
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
    <div
      style={delay ? { animationDelay: `${delay * 1000}ms` } : undefined}
      className={cn(
        // Base container: pill-rounded, soft pastel surface with clean border
        "group relative overflow-hidden min-w-0 flex flex-col justify-between select-none",
        "rounded-2xl sm:rounded-[22px] p-5 sm:p-5.5",
        "border shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5",
        "animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both",
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
                "absolute -top-1 -left-1.5 opacity-35",
                config.ghostIconColor
              )}
              aria-hidden="true"
            >
              <AppIcon icon={Icon} name={title} size={28} />
            </div>
            {/* Main foreground icon layer */}
            <div
              className={cn(
                "relative z-10",
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
    </div>
  );
};
