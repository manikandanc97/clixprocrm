"use client";

import * as React from "react";
import { X, Filter, RotateCcw } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export interface ActiveFilterItem {
  id: string;
  label: string;
  value: string | React.ReactNode;
  onRemove: () => void;
}

export interface DataTableFilterBarProps {
  filters: ActiveFilterItem[];
  onClearAll?: () => void;
  className?: string;
  clearAllLabel?: string;
}

export function DataTableFilterBar({
  filters,
  onClearAll,
  className,
  clearAllLabel = "Clear all",
}: DataTableFilterBarProps) {
  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-2 px-1 text-xs animate-in fade-in duration-200",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px] uppercase tracking-wider mr-1">
        <Filter className="size-3" />
        <span>Active Filters ({filters.length}):</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {filters.map((filter) => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-muted/90 border border-border/80 text-foreground"
          >
            <span className="text-muted-foreground">{filter.label}:</span>
            <span className="font-semibold">{filter.value}</span>
            <button
              type="button"
              onClick={filter.onRemove}
              aria-label={`Remove filter for ${filter.label}`}
              className="p-0.5 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>

      {onClearAll && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-destructive gap-1 shrink-0"
        >
          <RotateCcw className="size-3" />
          <span>{clearAllLabel}</span>
        </Button>
      )}
    </div>
  );
}
