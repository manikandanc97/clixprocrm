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

interface SemanticToneConfig {
  iconBg: string;
  iconColor: string;
  sparklineStroke: string;
}

const COLOR_TO_SEMANTIC: Record<MetricColor, SemanticTone> = {
  neutral: "neutral",
  slate: "neutral",
  primary: "primary",
  indigo: "primary",
  blue: "primary",
  violet: "primary",
  purple: "primary",
  cyan: "primary",
  emerald: "success",
  success: "success",
  orange: "warning",
  warning: "warning",
  pink: "destructive",
  destructive: "destructive",
};

const SEMANTIC_TOKENS: Record<SemanticTone, SemanticToneConfig> = {
  neutral: {
    iconBg: "bg-muted text-muted-foreground",
    iconColor: "text-muted-foreground",
    sparklineStroke: "var(--muted-foreground)",
  },
  primary: {
    iconBg: "bg-primary/10 text-primary",
    iconColor: "text-primary",
    sparklineStroke: "var(--primary)",
  },
  success: {
    iconBg: "bg-success/10 text-success",
    iconColor: "text-success",
    sparklineStroke: "var(--success)",
  },
  warning: {
    iconBg: "bg-warning/10 text-warning",
    iconColor: "text-warning",
    sparklineStroke: "var(--warning)",
  },
  destructive: {
    iconBg: "bg-destructive/10 text-destructive",
    iconColor: "text-destructive",
    sparklineStroke: "var(--destructive)",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline Wave Curve Component (Bottom-Right)
// ─────────────────────────────────────────────────────────────────────────────

interface SparklineCurveProps {
  data?: { value: number }[];
  trend?: "up" | "down" | "neutral";
  strokeColor: string;
}

const SparklineCurve = ({ data, trend = "neutral", strokeColor }: SparklineCurveProps) => {
  const hasVariation =
    data &&
    data.length >= 2 &&
    data.some((d, _, arr) => d.value !== arr[0].value);

  // If custom numeric points exist with variation across time, compute smooth cubic bezier path
  if (data && data.length >= 2 && hasVariation) {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 64;
    const height = 28;
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
      <svg className="w-16 h-7 shrink-0 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Pre-configured natural organic sparkline waves
  let pathD = "";
  if (trend === "up") {
    pathD = "M 4 20 C 12 24, 18 14, 26 18 C 34 22, 40 8, 48 12 C 54 16, 58 6, 62 4";
  } else if (trend === "down") {
    pathD = "M 4 6 C 12 4, 18 16, 26 12 C 34 8, 40 22, 48 18 C 54 14, 58 24, 62 24";
  } else {
    pathD = "M 4 16 C 12 8, 18 22, 26 12 C 34 18, 40 6, 48 20 C 54 10, 58 16, 62 12";
  }

  return (
    <svg className="w-16 h-7 shrink-0 overflow-visible" viewBox="0 0 66 28">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  title,
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
  const tone = directTone ?? COLOR_TO_SEMANTIC[color] ?? "primary";
  const semantic = SEMANTIC_TOKENS[tone];
  const isUp = trend === "up";
  const isDown = trend === "down";

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
        // Base container: canonical neutral card surface
        "group relative overflow-hidden min-w-0 flex flex-col justify-between select-none",
        "rounded-xl p-4 sm:p-5",
        "bg-card text-card-foreground border border-border shadow-xs hover:shadow-sm transition-all duration-200",
        className
      )}
    >
      {/* ── TOP ROW: Semantic Icon Badge (Left) + Trend Percentage (Right) ── */}
      <div className="flex items-center justify-between gap-3 z-10">
        {Icon && (
          <div
            className={cn(
              "flex size-9 sm:size-10 items-center justify-center rounded-lg shadow-xs transition-transform duration-150 group-hover:scale-105 motion-reduce:transform-none",
              semantic.iconBg,
              semantic.iconColor,
              iconColor
            )}
          >
            <AppIcon icon={Icon} name={title} size={18} />
          </div>
        )}

        {/* Trend Indicator Badge (Top Right) */}
        {loading && !hideBottomSkeletons ? (
          <Skeleton className="h-5 w-14 rounded-full opacity-60" />
        ) : (
          displayChange && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs sm:text-sm font-semibold tracking-tight shrink-0",
                isUp && "text-success",
                isDown && "text-destructive",
                !isUp && !isDown && "text-muted-foreground"
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

      {/* ── BOTTOM ROW: Metric Label & Bold Value (Left) + Sparkline (Right) ── */}
      <div className="flex items-end justify-between gap-2 mt-4 sm:mt-5 z-10">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate tracking-tight">
            {title}
          </p>

          {loading ? (
            <Skeleton className="h-8 w-24 rounded-md opacity-60 mt-1" />
          ) : (
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums truncate leading-tight">
              {value}
            </h3>
          )}

          {comparisonText && !loading && (
            <p className="text-[11px] sm:text-xs font-medium text-muted-foreground/75 truncate leading-tight pt-0.5">
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
              strokeColor={semantic.sparklineStroke}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
