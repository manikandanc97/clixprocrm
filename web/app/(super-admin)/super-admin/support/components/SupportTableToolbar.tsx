"use client";

import React from "react";
import { Search, X, Trash2, RotateCcw, Download } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

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
        <Select 
          value={statusFilter} 
          onValueChange={(val) => {
            setStatusFilter(val);
            onResetPage();
          }}
        >
          <SelectTrigger className="h-9 w-[130px] text-xs font-semibold bg-background border-border/70 shadow-xs focus:ring-primary/20">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select 
          value={priorityFilter} 
          onValueChange={(val) => {
            setPriorityFilter(val);
            onResetPage();
          }}
        >
          <SelectTrigger className="h-9 w-[130px] text-xs font-semibold bg-background border-border/70 shadow-xs focus:ring-primary/20">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

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
