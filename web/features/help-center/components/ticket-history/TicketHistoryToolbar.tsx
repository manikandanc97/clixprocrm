"use client";

import React from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  Search,
  X,
  Plus,
  Download,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CATEGORIES } from "./ticket-history.types";

interface TicketHistoryToolbarProps {
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedCount: number;
  onBulkDeleteClick: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onExportClick: () => void;
  onNewTicketClick?: () => void;
}

export function TicketHistoryToolbar({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  searchTerm,
  setSearchTerm,
  selectedCount,
  onBulkDeleteClick,
  hasActiveFilters,
  onClearFilters,
  onExportClick,
  onNewTicketClick,
}: TicketHistoryToolbarProps) {
  return (
    <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
      {/* Left: Filter Selects & Search Input */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_FOR_USER">Waiting for Reply</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        >
          <option value="ALL">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hidden sm:block"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets..."
            className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear search"
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
            <AppIcon
              name="trash"
              icon={Trash2}
              size={14}
              className="w-3.5 h-3.5 text-rose-500 shrink-0"
            />
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
          onClick={onExportClick}
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

        {/* Create new ticket button */}
        {onNewTicketClick && (
          <Button
            onClick={onNewTicketClick}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="plus"
              icon={Plus}
              size={14}
              className="w-3.5 h-3.5 text-white shrink-0"
            />
            <span>New Ticket</span>
          </Button>
        )}
      </div>
    </div>
  );
}
