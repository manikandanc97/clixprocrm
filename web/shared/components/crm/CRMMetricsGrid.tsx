"use client";

import { cn } from "@/shared/lib/utils";

/**
 * Architectural Rule — Metric Card Usage:
 * CRMMetricCard and CRMMetricsGrid are NOT global CRM page requirements.
 * Designated strictly for Dashboard and Analytics/Reports.
 */
interface CRMMetricsGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: number;
}

export const CRMMetricsGrid = ({
  children,
  className,
  cols = 4,
}: CRMMetricsGridProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3.5 sm:gap-4",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
};











