"use client";

import React, { useEffect, useRef } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";
import { ViewToggle, ViewOption } from "./ViewToggle";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export interface CRMToolbarProps {
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  filterCount?: number;
  /** Explicit slot for filter chips or filter dropdowns */
  filters?: React.ReactNode;
  /** Explicit slot for grouped filters / popovers */
  filterGroups?: React.ReactNode;
  /** Bulk action controls when rows are selected */
  bulkActions?: React.ReactNode;
  selectedCount?: number;
  /** Right-side action buttons */
  actions?: React.ReactNode;
  viewMode?: string;
  setViewMode?: (mode: any) => void;
  viewOptions?: readonly ViewOption[] | ViewOption[];
  children?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const CRMToolbar = ({
  searchQuery = "",
  setSearchQuery,
  placeholder = "Search...",
  onFilterClick,
  filterCount,
  filters,
  filterGroups,
  bulkActions,
  selectedCount = 0,
  actions,
  viewMode,
  setViewMode,
  viewOptions,
  children,
  className,
  sticky = false,
}: CRMToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolbarRef.current) return;
    const updateHeight = () => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.offsetHeight;
        document.documentElement.style.setProperty("--crm-toolbar-h", `${height}px`);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(toolbarRef.current);
    return () => ro.disconnect();
  }, []);

  const hasSearch = typeof setSearchQuery === "function";

  return (
    <motion.div
      ref={toolbarRef}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "crm-toolbar",
        sticky && "sticky top-0 z-30 bg-card/95 backdrop-blur-md shadow-xs",
        className
      )}
    >
      {/* ── LEFT / SEARCH & FILTERS ROW ── */}
      <div className="flex w-full flex-1 flex-wrap items-center gap-2.5 sm:w-auto">
        {hasSearch && (
          <div className="relative flex-1 sm:max-w-xs md:max-w-sm group min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
              <AppIcon icon={Search} name="search" size={15} />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "h-9 text-xs border-border/80 bg-muted/40 pl-9 shadow-none focus-visible:border-primary focus-visible:bg-background transition-colors",
                searchQuery && "pr-8"
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                aria-label="Clear search"
              >
                <AppIcon icon={X} name="close" size={13} />
              </button>
            )}
          </div>
        )}

        {onFilterClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterClick}
            className="h-9 gap-1.5 text-xs font-semibold shrink-0"
          >
            <AppIcon icon={Filter} name="filter" size={14} />
            <span>Filters</span>
            {filterCount !== undefined && filterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                {filterCount}
              </span>
            )}
          </Button>
        )}

        {filters}
        {filterGroups}
      </div>

      {/* ── BULK ACTIONS (if items selected) ── */}
      {selectedCount > 0 && bulkActions && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/60 text-xs font-medium text-foreground">
          <span className="font-semibold text-primary">{selectedCount} selected</span>
          <div className="h-4 w-px bg-border mx-1" />
          {bulkActions}
        </div>
      )}

      {/* ── RIGHT CONTROLS / VIEW MODE / ACTIONS ── */}
      <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
        {actions}
        {children}

        {viewMode && setViewMode && viewOptions && viewOptions.length > 1 && (
          <ViewToggle
            viewMode={viewMode}
            setViewMode={setViewMode}
            options={viewOptions}
          />
        )}
      </div>
    </motion.div>
  );
};
