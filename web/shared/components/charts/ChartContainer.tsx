"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { ChartSkeleton, ChartSkeletonType } from "@/shared/components/skeletons";

export interface ChartDimensions {
  width: number;
  height: number;
}

export interface ChartContainerProps {
  children: React.ReactNode | ((dimensions: ChartDimensions) => React.ReactNode);
  /** Height of the container, default is 300 */
  height?: string | number;
  /** Loading state */
  loading?: boolean;
  /** Whether there is data to display */
  hasData?: boolean;
  /** Message to show when there is no data */
  emptyMessage?: string;
  /** Additional class names for the container */
  className?: string;
  /** Minimum height of the container */
  minHeight?: string | number;
  /** Skeleton type to show while loading or measuring */
  skeletonType?: ChartSkeletonType;
}

/**
 * Standardized wrapper for Recharts that ensures proper rendering dimensions.
 * Eliminates "The width(-1) and height(-1) of chart should be greater than 0" warnings
 * by ensuring charts only mount once the parent container has measurable, positive dimensions,
 * injecting positive initialDimension values, and cleanly unmounting when hidden inside tabs.
 */
export const ChartContainer = ({
  children,
  height = 300,
  loading = false,
  hasData = true,
  emptyMessage = "No data available",
  className,
  minHeight,
  skeletonType = "area",
}: ChartContainerProps) => {
  const [dimensions, setDimensions] = useState<ChartDimensions>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const measure = () => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (width > 0 && height > 0) {
        setDimensions((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height }
        );
      }
    };

    // Immediate initial measurement
    measure();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const w = Math.floor(width);
      const h = Math.floor(height);

      if (w > 0 && h > 0) {
        setDimensions((prev) =>
          prev.width === w && prev.height === h ? prev : { width: w, height: h }
        );
      } else {
        // Container has collapsed or is hidden (e.g. inside an inactive tab/accordion)
        setDimensions((prev) => (prev.width === 0 && prev.height === 0 ? prev : { width: 0, height: 0 }));
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const resolvedMinHeight = minHeight ?? (typeof height === "number" ? height : undefined);
  const containerStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    minHeight: typeof resolvedMinHeight === "number" ? `${resolvedMinHeight}px` : resolvedMinHeight,
  };

  const isReady = dimensions.width > 0 && dimensions.height > 0;

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full min-w-0 relative", className)}
      style={containerStyle}
    >
      {!isReady || loading ? (
        <div className="absolute inset-0 z-10 w-full h-full bg-card rounded-xl">
          <ChartSkeleton height="100%" type={skeletonType} />
        </div>
      ) : !hasData ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/50">
          <p className="text-sm font-medium italic">{emptyMessage}</p>
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full min-w-0">
          {typeof children === "function"
            ? children(dimensions)
            : React.isValidElement(children)
            ? React.cloneElement(
                children as React.ReactElement<{
                  width?: number | string;
                  height?: number | string;
                }>,
                {
                  width: (children.props as { width?: string | number }).width ?? dimensions.width,
                  height: (children.props as { height?: string | number }).height ?? dimensions.height,
                }
              )
            : children}
        </div>
      )}
    </div>
  );
};












