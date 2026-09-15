"use client";

import React from "react";
import { Search, X, Trash2, RotateCcw, Download } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Input } from "@/shared/ui/input";

interface SupportTableToolbarProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  search: string;
  setSearch: (search: string) => void;
  selectedCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onBulkDelete: () => void;
  onExport: () => void;
  onResetPage: () => void;
}

export function SupportTableToolbar({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  search,
  setSearch,
  selectedCount,
  hasActiveFilters,
  onClearFilters,
  onBulkDelete,
  onExport,
  onResetPage,
}: SupportTableToolbarProps) {
  return (
    <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
      {/* Left: Filter Selects & Search */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            onResetPage();
          }}
          className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_USER">Waiting for User</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            onResetPage();
          }}
          className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 group">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            <AppIcon
              name="search"
              icon={Search}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors"
            />
          </div>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onResetPage();
            }}
            placeholder="Search ticket #, subject..."
            className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                onResetPage();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
        {/* Multi-Select Delete Button */}
        {selectedCount > 0 && (
          <button
            onClick={onBulkDelete}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
          >
            <AppIcon name="trash" icon={Trash2} size={14} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Delete ({selectedCount})</span>
          </button>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
          >
            <AppIcon
              name="reset"
              icon={RotateCcw}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Reset Filters</span>
          </button>
        )}

        {/* Export Button */}
        <button
          onClick={onExport}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <AppIcon
            name="export"
            icon={Download}
            size={14}
            className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
          />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
