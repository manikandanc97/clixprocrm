"use client";

import * as React from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface DataTableColumnHeaderProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: (direction: SortDirection) => void;
  className?: string;
  iconClassName?: string;
}

export function DataTableColumnHeader({
  title,
  children,
  align = "left",
  sortable = false,
  sortDirection = null,
  onSort,
  className,
  iconClassName,
}: DataTableColumnHeaderProps) {
  const content = title ?? children;

  const handleToggleSort = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!sortable || !onSort) return;
    e.stopPropagation();

    // 3-state cycling: null -> asc -> desc -> null
    if (sortDirection === "asc") {
      onSort("desc");
    } else if (sortDirection === "desc") {
      onSort(null);
    } else {
      onSort("asc");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (sortable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleToggleSort(e);
    }
  };

  const alignmentClass = 
    align === "right" 
      ? "justify-end text-right" 
      : align === "center" 
      ? "justify-center text-center" 
      : "justify-start text-left";

  if (!sortable) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground select-none",
          alignmentClass,
          className
        )}
      >
        {typeof content === "string" ? <span>{content}</span> : content}
      </div>
    );
  }

  const isSorted = sortDirection === "asc" || sortDirection === "desc";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none"}
      onClick={handleToggleSort}
      onKeyDown={handleKeyDown}
      className={cn(
        "group inline-flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight select-none transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-ring rounded py-0.5",
        isSorted ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground",
        alignmentClass,
        className
      )}
      >
        <span>{content}</span>
      <span className={cn("inline-flex shrink-0 items-center transition-colors", iconClassName)}>
        {sortDirection === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        ) : sortDirection === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-opacity" aria-hidden="true" />
        )}
      </span>
    </div>
  );
}
