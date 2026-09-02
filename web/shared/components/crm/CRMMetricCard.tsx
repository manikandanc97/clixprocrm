"use client";

import React, { useId } from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { motion } from "framer-motion";
import { AppIcon } from "@/shared/components/icons/icon-registry";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Config
// ─────────────────────────────────────────────────────────────────────────────

export type MetricColor =
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

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Theme Tokens (Image 2 Aesthetic)
// Rich pastel gradient surfaces + deep contrast typography + vibrant accents
// ─────────────────────────────────────────────────────────────────────────────

interface ColorConfig {
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  valueColor: string;
  trendUpColor: string;
  trendDownColor: string;
  trendNeutralColor: string;
  iconBackdrop: string;
  iconFrontBg: string;
  iconColor: string;
  sparklineStroke: string;
  dotFill: string;
}

const COLOR_TOKENS: Record<MetricColor, ColorConfig> = {
  emerald: {
    cardBg: "bg-gradient-to-br from-[#D8F5E5] via-[#E2F8EC] to-[#C9F2DC] dark:from-emerald-950/40 dark:via-emerald-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#B2E8CB]/80 dark:border-emerald-500/20",
    titleColor: "text-[#0B4628] dark:text-emerald-100",
    valueColor: "text-[#004B50] dark:text-[#A7F3D0]",
    trendUpColor: "text-[#007A48] dark:text-emerald-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#0B4628]/80 dark:text-emerald-200/80",
    iconBackdrop: "bg-[#7BE3A8]/60 dark:bg-emerald-500/30",
    iconFrontBg: "bg-[#00A76F] dark:bg-emerald-500",
    iconColor: "text-white",
    sparklineStroke: "#00A76F",
    dotFill: "fill-[#00A76F]",
  },
  violet: {
    cardBg: "bg-gradient-to-br from-[#EAD9FF] via-[#F1E6FF] to-[#E1CAFE] dark:from-purple-950/40 dark:via-purple-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#D4B5FC]/80 dark:border-purple-500/20",
    titleColor: "text-[#3B1475] dark:text-purple-100",
    valueColor: "text-[#300D61] dark:text-[#DDD6FE]",
    trendUpColor: "text-[#5B10B8] dark:text-purple-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#3B1475]/80 dark:text-purple-200/80",
    iconBackdrop: "bg-[#C495FD]/60 dark:bg-purple-500/30",
    iconFrontBg: "bg-[#8E33FF] dark:bg-purple-500",
    iconColor: "text-white",
    sparklineStroke: "#8E33FF",
    dotFill: "fill-[#8E33FF]",
  },
  purple: {
    cardBg: "bg-gradient-to-br from-[#EAD9FF] via-[#F1E6FF] to-[#E1CAFE] dark:from-purple-950/40 dark:via-purple-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#D4B5FC]/80 dark:border-purple-500/20",
    titleColor: "text-[#3B1475] dark:text-purple-100",
    valueColor: "text-[#300D61] dark:text-[#DDD6FE]",
    trendUpColor: "text-[#5B10B8] dark:text-purple-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#3B1475]/80 dark:text-purple-200/80",
    iconBackdrop: "bg-[#C495FD]/60 dark:bg-purple-500/30",
    iconFrontBg: "bg-[#8E33FF] dark:bg-purple-500",
    iconColor: "text-white",
    sparklineStroke: "#8E33FF",
    dotFill: "fill-[#8E33FF]",
  },
  orange: {
    cardBg: "bg-gradient-to-br from-[#FFF1C2] via-[#FFF6D6] to-[#FFE7A0] dark:from-amber-950/40 dark:via-amber-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#FCE08F]/80 dark:border-amber-500/20",
    titleColor: "text-[#7A4F01] dark:text-amber-100",
    valueColor: "text-[#5C3B00] dark:text-[#FDE68A]",
    trendUpColor: "text-[#B76E00] dark:text-amber-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#7A4F01]/80 dark:text-amber-200/80",
    iconBackdrop: "bg-[#FFD666]/70 dark:bg-amber-500/30",
    iconFrontBg: "bg-[#FFAB00] dark:bg-amber-500",
    iconColor: "text-white",
    sparklineStroke: "#B76E00",
    dotFill: "fill-[#FFAB00]",
  },
  pink: {
    cardBg: "bg-gradient-to-br from-[#FFE3D9] via-[#FFECE5] to-[#FFD4C5] dark:from-rose-950/40 dark:via-rose-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#FCBEAC]/80 dark:border-rose-500/20",
    titleColor: "text-[#7A0916] dark:text-rose-100",
    valueColor: "text-[#5B0410] dark:text-[#FECDD3]",
    trendUpColor: "text-[#B71D18] dark:text-rose-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#7A0916]/80 dark:text-rose-200/80",
    iconBackdrop: "bg-[#FFA48D]/70 dark:bg-rose-500/30",
    iconFrontBg: "bg-[#FF5630] dark:bg-rose-500",
    iconColor: "text-white",
    sparklineStroke: "#B71D18",
    dotFill: "fill-[#FF5630]",
  },
  cyan: {
    cardBg: "bg-gradient-to-br from-[#D0F2FE] via-[#E0F6FE] to-[#BEECFC] dark:from-cyan-950/40 dark:via-cyan-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#A1E4FA]/80 dark:border-cyan-500/20",
    titleColor: "text-[#044463] dark:text-cyan-100",
    valueColor: "text-[#003750] dark:text-[#A5F3FC]",
    trendUpColor: "text-[#007B8C] dark:text-cyan-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#044463]/80 dark:text-cyan-200/80",
    iconBackdrop: "bg-[#70D7F9]/60 dark:bg-cyan-500/30",
    iconFrontBg: "bg-[#00B8D9] dark:bg-cyan-500",
    iconColor: "text-white",
    sparklineStroke: "#007B8C",
    dotFill: "fill-[#00B8D9]",
  },
  indigo: {
    cardBg: "bg-gradient-to-br from-[#E0E7FF] via-[#EBF0FE] to-[#D3DCFE] dark:from-indigo-950/40 dark:via-indigo-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#C2D0FC]/80 dark:border-indigo-500/20",
    titleColor: "text-[#1E2E6B] dark:text-indigo-100",
    valueColor: "text-[#1A237E] dark:text-[#C7D2FE]",
    trendUpColor: "text-[#3730A3] dark:text-indigo-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#1E2E6B]/80 dark:text-indigo-200/80",
    iconBackdrop: "bg-[#A5B4FC]/60 dark:bg-indigo-500/30",
    iconFrontBg: "bg-[#4F46E5] dark:bg-indigo-500",
    iconColor: "text-white",
    sparklineStroke: "#4F46E5",
    dotFill: "fill-[#4F46E5]",
  },
  blue: {
    cardBg: "bg-gradient-to-br from-[#E0E7FF] via-[#EBF0FE] to-[#D3DCFE] dark:from-indigo-950/40 dark:via-indigo-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#C2D0FC]/80 dark:border-indigo-500/20",
    titleColor: "text-[#1E2E6B] dark:text-indigo-100",
    valueColor: "text-[#1A237E] dark:text-[#C7D2FE]",
    trendUpColor: "text-[#3730A3] dark:text-indigo-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#1E2E6B]/80 dark:text-indigo-200/80",
    iconBackdrop: "bg-[#A5B4FC]/60 dark:bg-indigo-500/30",
    iconFrontBg: "bg-[#4F46E5] dark:bg-indigo-500",
    iconColor: "text-white",
    sparklineStroke: "#4F46E5",
    dotFill: "fill-[#4F46E5]",
  },
  primary: {
    cardBg: "bg-gradient-to-br from-[#E0E7FF] via-[#EBF0FE] to-[#D3DCFE] dark:from-indigo-950/40 dark:via-indigo-900/25 dark:to-slate-900/60",
    cardBorder: "border-[#C2D0FC]/80 dark:border-indigo-500/20",
    titleColor: "text-[#1E2E6B] dark:text-indigo-100",
    valueColor: "text-[#1A237E] dark:text-[#C7D2FE]",
    trendUpColor: "text-[#3730A3] dark:text-indigo-300",
    trendDownColor: "text-[#B71D18] dark:text-rose-300",
    trendNeutralColor: "text-[#1E2E6B]/80 dark:text-indigo-200/80",
    iconBackdrop: "bg-[#A5B4FC]/60 dark:bg-indigo-500/30",
    iconFrontBg: "bg-[#4F46E5] dark:bg-indigo-500",
    iconColor: "text-white",
    sparklineStroke: "#4F46E5",
    dotFill: "fill-[#4F46E5]",
  },
  slate: {
    cardBg: "bg-gradient-to-br from-[#E2E8F0] via-[#EDF2F7] to-[#CBD5E1] dark:from-slate-900/70 dark:via-slate-800/40 dark:to-slate-900/80",
    cardBorder: "border-slate-300/80 dark:border-slate-700/50",
    titleColor: "text-slate-700 dark:text-slate-200",
    valueColor: "text-slate-900 dark:text-slate-100",
    trendUpColor: "text-emerald-600 dark:text-emerald-400",
    trendDownColor: "text-rose-600 dark:text-rose-400",
    trendNeutralColor: "text-slate-600 dark:text-slate-400",
    iconBackdrop: "bg-slate-300/60 dark:bg-slate-700/40",
    iconFrontBg: "bg-slate-700 dark:bg-slate-600",
    iconColor: "text-white",
    sparklineStroke: "#64748B",
    dotFill: "fill-slate-500",
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// Sparkline Wave Curve Component (Bottom-Right)
// Renders smooth curved trend line matching Image 2
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
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Pre-configured natural organic sparkline waves with lively peaks & valleys (ups and downs)
  let pathD = "";
  if (trend === "up") {
    // Dynamic rising wave with natural peaks & valleys
    pathD = "M 4 20 C 12 24, 18 14, 26 18 C 34 22, 40 8, 48 12 C 54 16, 58 6, 62 4";
  } else if (trend === "down") {
    // Dynamic descending wave with natural peaks & valleys
    pathD = "M 4 6 C 12 4, 18 16, 26 12 C 34 8, 40 22, 48 18 C 54 14, 58 24, 62 24";
  } else {
    // Dynamic undulating multi-wave with organic rhythm (ups & downs)
    pathD = "M 4 16 C 12 8, 18 22, 26 12 C 34 18, 40 6, 48 20 C 54 10, 58 16, 62 12";
  }

  return (
    <svg className="w-16 h-7 shrink-0 overflow-visible" viewBox="0 0 66 28">
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
  /** Hide the bottom skeletons during loading state */
  hideBottomSkeletons?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Enterprise Metric Card Component (Matching Image 2 Reference)
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

  // Trend text styling
  const trendColorClass = isUp
    ? t.trendUpColor
    : isDown
    ? t.trendDownColor
    : t.trendNeutralColor;

  const displayChange = change
    ? !isUp && !isDown && change.startsWith("+")
      ? change.slice(1)
      : change
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        // Base container: rounded-2xl + pastel gradient background
        "group relative overflow-hidden min-w-0 flex flex-col justify-between select-none",
        "rounded-2xl p-4 sm:p-5",
        "border shadow-sm transition-all duration-300",
        t.cardBg,
        t.cardBorder,
        className
      )}
    >
      {/* Decorative Semi-Cropped Background Icon (Static subtle watermark at bottom-right) */}
      {Icon && (
        <div className="pointer-events-none absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-14 h-14 sm:w-16 sm:h-16 opacity-[0.07] dark:opacity-[0.05] select-none flex items-center justify-center">
          <Icon className={cn("w-full h-full", t.titleColor)} strokeWidth={1.5} />
        </div>
      )}

      {/* ── TOP ROW: Layered 3D Icon Badge (Left) + Trend Percentage (Right) ── */}
      <div className="flex items-center justify-between gap-3 z-10">
        {/* Layered 3D Icon Container */}
        {Icon && (
          <div className="relative flex items-center justify-center shrink-0">
            {/* Frosted Offset Backdrop Pill (3D layered look) */}
            <div
              className={cn(
                "absolute -left-1 -top-1 w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5",
                t.iconBackdrop
              )}
            />
            {/* Front Solid Saturated Icon Badge */}
            <div
              className={cn(
                "relative z-10 flex size-9 sm:size-10 items-center justify-center rounded-xl shadow-sm transition-all duration-300 group-hover:scale-105",
                t.iconFrontBg,
                t.iconColor,
                iconColor
              )}
            >
              <AppIcon icon={Icon} name={title} size={18} />
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
                "flex items-center gap-0.5 text-xs sm:text-sm font-bold tracking-tight shrink-0",
                trendColorClass
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
        {/* Metric Label and Hero Value */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p
            className={cn(
              "text-xs sm:text-[13px] font-semibold truncate tracking-tight",
              t.titleColor
            )}
          >
            {title}
          </p>

          {loading ? (
            <Skeleton className="h-8 w-24 rounded-md opacity-60 mt-1" />
          ) : (
            <h3
              className={cn(
                "text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums truncate leading-tight",
                t.valueColor
              )}
            >
              {value}
            </h3>
          )}

          {/* Comparison text if present */}
          {comparisonText && !loading && (
            <p className="text-[10px] sm:text-[11px] font-medium opacity-65 truncate leading-tight pt-0.5">
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
              strokeColor={t.sparklineStroke}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
