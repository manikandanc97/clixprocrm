"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export interface BulkActionItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
}

export interface DataTableBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions?: BulkActionItem[];
  children?: React.ReactNode;
  className?: string;
  entityName?: string;
}

export function DataTableBulkActions({
  selectedCount,
  onClearSelection,
  actions = [],
  children,
  className,
  entityName = "records",
}: DataTableBulkActionsProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl shadow-sm text-xs animate-in slide-in-from-top-1 fade-in duration-200",
        className
      )}
    >
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <div className="flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">
          {selectedCount}
        </div>
        <span>
          {selectedCount} {selectedCount === 1 ? "record" : entityName} selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              type="button"
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "h-8 px-3 text-xs font-semibold gap-1.5",
                action.variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              <span>{action.label}</span>
            </Button>
          );
        })}
        {children}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
          aria-label="Clear selection"
        >
          <X className="size-3.5" />
          <span className="hidden sm:inline">Deselect</span>
        </Button>
      </div>
    </div>
  );
}
