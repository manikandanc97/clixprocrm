import React from "react";
import { CRMCard } from "@/shared/components/crm/CRMCard";
import { CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                DASHBOARD & WIDGETS                         */
/* -------------------------------------------------------------------------- */

export function DashboardWidgetSkeleton({
  rows = 3,
  showHeader = true,
  className,
}: {
  rows?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <CRMCard noPadding className={cn("h-full flex flex-col min-h-[260px]", className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
          <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
        </CardHeader>
      )}
      <CardContent className="p-5 flex-1 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-3.5 w-3/4 max-w-[200px]" />
              <Skeleton className="h-2.5 w-1/2 max-w-[140px]" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full shrink-0" />
          </div>
        ))}
      </CardContent>
    </CRMCard>
  );
}

export function MetricCardSkeleton({ className }: { className?: string } = {}) {
  return (
    <div
      className={cn(
        "p-4 sm:p-5 flex flex-col justify-between min-h-[140px] rounded-2xl border border-border/50 bg-card/60 relative overflow-hidden",
        className
      )}
    >
      {/* Top Row: Icon on left + Trend on right */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <Skeleton className="h-5 w-14 rounded-full shrink-0" />
      </div>
      {/* Bottom Row: Title + Hero Value on left, Sparkline on right */}
      <div className="flex items-end justify-between gap-2 mt-4">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md shrink-0 mb-0.5" />
      </div>
    </div>
  );
}

export function KpiCardSkeleton({ className }: { className?: string } = {}) {
  return <MetricCardSkeleton className={className} />;
}

/* -------------------------------------------------------------------------- */
/*                                   CHARTS                                   */
/* -------------------------------------------------------------------------- */

export type ChartSkeletonType = "bar" | "line" | "area" | "donut" | "pie" | "funnel";

export function ChartSkeleton({
  height = 280,
  type = "area",
  className,
}: {
  height?: number | string;
  type?: ChartSkeletonType;
  className?: string;
}) {
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  if (type === "donut" || type === "pie") {
    return (
      <div
        className={cn("w-full flex items-center justify-center p-6", className)}
        style={{ height: heightStyle }}
      >
        <div className="relative flex items-center justify-center">
          <div className="w-44 h-44 rounded-full border-[18px] border-muted/30 flex items-center justify-center">
            <div className="space-y-1.5 text-center flex flex-col items-center">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "funnel") {
    return (
      <div
        className={cn("w-full flex flex-col justify-center gap-3 p-6", className)}
        style={{ height: heightStyle }}
      >
        {[100, 80, 60, 42, 25].map((widthPct, i) => (
          <div key={i} className="flex items-center gap-3 w-full">
            <Skeleton className="h-3 w-16 shrink-0" />
            <div className="flex-1 flex justify-center">
              <Skeleton
                className="h-8 rounded-lg"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <Skeleton className="h-3 w-10 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div className={cn("w-full flex flex-col justify-end p-4", className)} style={{ height: heightStyle }}>
        <div className="flex items-end justify-between gap-3 h-full pb-2 border-b border-border/40">
          {[45, 75, 55, 90, 65, 80, 40, 85, 60, 95, 70, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <Skeleton
                className="w-full max-w-[28px] rounded-t-md"
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-2">
          {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m, i) => (
            <Skeleton key={i} className="h-2.5 w-7" />
          ))}
        </div>
      </div>
    );
  }

  // Default: Line / Area Chart
  return (
    <div className={cn("w-full flex flex-col justify-between p-4", className)} style={{ height: heightStyle }}>
      <div className="flex-1 w-full relative flex items-end pb-3 border-b border-border/40">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-border" />
          <div className="border-b border-dashed border-border" />
          <div className="border-b border-dashed border-border" />
          <div className="border-b border-dashed border-border" />
        </div>
        <div className="w-full flex items-end gap-1.5 h-full z-10">
          {[35, 50, 42, 68, 55, 72, 60, 85, 75, 92, 80, 65].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground/30 mb-1"
                style={{ marginBottom: `${Math.max(0, h - 10)}%` }}
              />
              <Skeleton className="w-full rounded-t-sm opacity-60" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between pt-3">
        {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"].map((w, i) => (
          <Skeleton key={i} className="h-2.5 w-6" />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               TABLES & LISTS                               */
/* -------------------------------------------------------------------------- */

export function TableRowSkeleton({
  cols = 5,
  hasAvatar = false,
  hasActions = true,
}: {
  cols?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
}) {
  return (
    <tr className="border-b border-border/50 h-16">
      {Array.from({ length: cols }).map((_, i) => {
        if (i === 0 && hasAvatar) {
          return (
            <td key={i} className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            </td>
          );
        }
        if (i === cols - 1 && hasActions) {
          return (
            <td key={i} className="px-6 py-4 text-right">
              <div className="flex items-center justify-end gap-1.5 ml-auto">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </td>
          );
        }
        return (
          <td key={i} className="px-6 py-4">
            <Skeleton className="h-3.5 w-24 max-w-full" />
          </td>
        );
      })}
    </tr>
  );
}

export function TableSkeleton({
  rows = 8,
  cols = 6,
  showPagination = true,
  hasAvatar = true,
}: {
  rows?: number;
  cols?: number;
  showPagination?: boolean;
  hasAvatar?: boolean;
}) {
  return (
    <div className="space-y-4 w-full">
      <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 h-10 sm:h-11">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 sm:px-6 py-3 text-left">
                  <Skeleton className="h-2.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} cols={cols} hasAvatar={hasAvatar} />
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between px-3 py-2">
          <Skeleton className="h-3.5 w-44" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PAGE HEADERS                                */
/* -------------------------------------------------------------------------- */

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-48 sm:w-64" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-60 sm:w-96" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export function ToolbarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
      <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
      <Skeleton className="h-10 flex-1 w-full rounded-xl" />
      <Skeleton className="h-10 w-28 rounded-xl" />
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                TIMELINE & NOTES                            */
/* -------------------------------------------------------------------------- */

export function TimelineSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-6 relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border/60" />
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="relative">
          <div className="absolute -left-6 mt-0.5 w-6 h-6 rounded-full bg-background border-2 border-muted-foreground/30 flex items-center justify-center z-10">
            <Skeleton className="w-2.5 h-2.5 rounded-full" />
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm ml-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-5/6" />
            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotesSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4 relative">
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border/60" />
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4 relative">
          <div className="flex flex-col items-center z-10 pt-1">
            <Skeleton className="w-8 h-8 rounded-full border-2 border-background shadow-sm" />
          </div>
          <div className="flex-1 bg-card border border-border/60 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeetingsSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4 relative">
      <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-border/60" />
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4 relative">
          <div className="flex flex-col items-center z-10 pt-1">
            <div className="w-12 h-12 rounded-full bg-muted/40 border-2 border-background flex flex-col items-center justify-center p-1 space-y-1">
              <Skeleton className="h-2 w-6" />
              <Skeleton className="h-3.5 w-5" />
            </div>
          </div>
          <div className="flex-1 bg-card border border-border/60 rounded-xl p-4 shadow-sm space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-44" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-lg bg-muted/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AttachmentsSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                FORMS & MODALS                              */
/* -------------------------------------------------------------------------- */

export function FormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <div className="pt-4 flex justify-end gap-3">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function QuoteFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Steps pill indicator */}
      <div className="flex items-center justify-center gap-6 pb-4 border-b border-border/50">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Items Repeater Box */}
      <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-center">
            <Skeleton className="col-span-5 h-10 rounded-xl" />
            <Skeleton className="col-span-2 h-10 rounded-xl" />
            <Skeleton className="col-span-2 h-10 rounded-xl" />
            <Skeleton className="col-span-2 h-10 rounded-xl" />
            <Skeleton className="col-span-1 h-10 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end pt-2">
        <div className="w-64 space-y-2.5">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <FormSkeleton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                KANBAN BOARD                                */
/* -------------------------------------------------------------------------- */

export function KanbanSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex gap-5 h-full overflow-hidden pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-80 flex-shrink-0 flex flex-col gap-4 bg-muted/20 p-4 rounded-2xl border border-border/60 h-full"
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-7 rounded-full" />
          </div>

          <div className="flex-1 min-h-0 space-y-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, j) => (
              <CRMCard key={j} className="p-4 space-y-3 shadow-sm border-border/60">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </CRMCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                GENERIC CARDS & DETAILS                     */
/* -------------------------------------------------------------------------- */

export function CardSkeleton({ className }: { className?: string } = {}) {
  return (
    <CRMCard className={cn("p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      <div className="pt-4 flex gap-2.5">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </CRMCard>
  );
}

export function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  return <Skeleton className={cn(sizeClasses[size], "rounded-full")} />;
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
        <div className="space-y-3 flex-1 w-full">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-3.5 w-1/4" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2.5 mt-4 sm:mt-0 w-full sm:w-auto">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <CRMCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`header-${i}`} className="bg-muted/40 p-3 text-center border-b border-border/50">
            <Skeleton className="h-3.5 w-8 mx-auto" />
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={`day-${i}`} className="bg-card min-h-[110px] p-2.5 space-y-2">
            <Skeleton className="h-3.5 w-5 ml-auto" />
            {i % 4 === 0 && <Skeleton className="h-5 w-full rounded-md" />}
            {i % 7 === 0 && <Skeleton className="h-5 w-full rounded-md" />}
          </div>
        ))}
      </div>
    </CRMCard>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-64 h-full border-r border-border bg-sidebar flex flex-col p-4 gap-6">
      <div className="flex items-center gap-3 px-2">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex-1 space-y-2 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
      <div className="mt-auto border-t border-border pt-4">
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 w-full">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </header>
  );
}
