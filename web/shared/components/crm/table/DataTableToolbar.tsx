"use client";

import * as React from "react";
import { SearchInput } from "@/shared/ui/search-input";
import { DataTableDensityToggle, TableDensity } from "./DataTableDensityToggle";
import { DataTableFilterBar, ActiveFilterItem } from "./DataTableFilterBar";
import { DataTableBulkActions, BulkActionItem } from "./DataTableBulkActions";
import { cn } from "@/shared/lib/utils";

export interface DataTableToolbarProps {
  // Search
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  isSearchLoading?: boolean;

  // Filters slot & active filters
  filters?: React.ReactNode;
  activeFilters?: ActiveFilterItem[];
  onClearAllFilters?: () => void;

  // Density
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;

  // Extra controls & Actions
  viewControls?: React.ReactNode;
  actions?: React.ReactNode;

  // Bulk actions
  selectedCount?: number;
  onClearSelection?: () => void;
  bulkActions?: BulkActionItem[];
  entityName?: string;

  className?: string;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search records...",
  isSearchLoading = false,
  filters,
  activeFilters = [],
  onClearAllFilters,
  density,
  onDensityChange,
  viewControls,
  actions,
  selectedCount = 0,
  onClearSelection,
  bulkActions,
  entityName,
  className,
}: DataTableToolbarProps) {
  return (
    <div className={cn("space-y-2 w-full", className)}>
      {/* Top row: Search, Filter Selects, View Controls, Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Left cluster: Search + Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
          {onSearchChange !== undefined && (
            <div className="w-full sm:w-64 md:w-72 shrink-0">
              <SearchInput
                value={search || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                onClear={() => onSearchChange("")}
                placeholder={searchPlaceholder}
                isLoading={isSearchLoading}
              />
            </div>
          )}

          {filters && (
            <div className="flex flex-wrap items-center gap-2">
              {filters}
            </div>
          )}
        </div>

        {/* Right cluster: Density, View Controls, Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {density && onDensityChange && (
            <DataTableDensityToggle
              density={density}
              onDensityChange={onDensityChange}
            />
          )}

          {viewControls}
          {actions}
        </div>
      </div>

      {/* Bulk selection actions bar */}
      {selectedCount > 0 && onClearSelection && (
        <DataTableBulkActions
          selectedCount={selectedCount}
          onClearSelection={onClearSelection}
          actions={bulkActions}
          entityName={entityName}
        />
      )}

      {/* Active filter chips bar */}
      {activeFilters.length > 0 && (
        <DataTableFilterBar
          filters={activeFilters}
          onClearAll={onClearAllFilters}
        />
      )}
    </div>
  );
}
