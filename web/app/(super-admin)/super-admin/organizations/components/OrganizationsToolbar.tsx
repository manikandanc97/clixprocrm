"use client";

import React from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Plus,
  Search,
  X,
  Download,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface OrganizationsToolbarProps {
  planFilter: string;
  setPlanFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
  selectedCount: number;
  onBulkDeleteClick: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExportClick: () => void;
  onCreateClick: () => void;
}

export function OrganizationsToolbar({
  planFilter,
  setPlanFilter,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  selectedCount,
  onBulkDeleteClick,
  hasActiveFilters,
  onClearFilters,
  onExportClick,
  onCreateClick,
}: OrganizationsToolbarProps) {
  return (
    <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
      {/* Left: Filter Selects & Search Input */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Plan Filter */}
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        >
          <option value="ALL">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </select>

        {/* Publish / Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Published (Active)</option>
          <option value="SUSPENDED">Draft (Suspended)</option>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
        {/* Multi-Select Delete Button with count */}
        {selectedCount > 0 && (
          <button
            onClick={onBulkDeleteClick}
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
            <AppIcon name="reset" icon={RotateCcw} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            <span>Reset Filters</span>
          </button>
        )}

        {/* Export Button */}
        <button
          onClick={onExportClick}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <AppIcon name="export" icon={Download} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
          <span>Export</span>
        </button>

        {/* New Organization Button */}
        <Button
          onClick={onCreateClick}
          className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
        >
          <AppIcon name="plus" icon={Plus} size={14} className="w-3.5 h-3.5 text-white shrink-0" />
          <span>New Organization</span>
        </Button>
      </div>
    </div>
  );
}
