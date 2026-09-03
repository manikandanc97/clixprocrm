"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { AppIcon } from "@/shared/components/icons/icon-registry";

export interface CRMPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  itemName?: string;
  pageSizeOptions?: number[];
  className?: string;
  alwaysShow?: boolean;
}

export function CRMPagination({
  currentPage,
  totalPages,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  itemName = "items",
  pageSizeOptions = [10, 20, 50, 100],
  className,
  alwaysShow = false,
}: CRMPaginationProps) {
  if (totalItems === 0 || (!alwaysShow && totalItems <= rowsPerPage)) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn(
        "p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto",
        className
      )}
    >
      {/* Showing item range */}
      <div className="w-full sm:w-auto text-center sm:text-left">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {startItem}
        </span>
        -
        <span className="font-semibold text-foreground">
          {endItem}
        </span>{" "}
        of <span className="font-semibold text-foreground">{totalItems}</span> {itemName}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(val) => {
              onRowsPerPageChange(Number(val));
              onPageChange(1);
            }}
          >
            <SelectTrigger
              aria-label="Rows per page"
              className="h-8 w-[72px] px-2.5 rounded-lg border-border/60 bg-background text-xs font-semibold text-foreground cursor-pointer"
            >
              <SelectValue placeholder={String(rowsPerPage)} />
            </SelectTrigger>
            <SelectContent side="top" align="end">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs font-medium cursor-pointer">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator & navigation buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="whitespace-nowrap">
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{safeTotalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(1)}
              className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
              title="First page"
              aria-label="First page"
            >
              <AppIcon name="chevronsLeft" icon={ChevronsLeft} size={14} className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
              title="Previous page"
              aria-label="Previous page"
            >
              <AppIcon name="chevronLeft" icon={ChevronLeft} size={14} className="h-4 w-4" />
            </Button>

            {/* Next Page */}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= safeTotalPages}
              onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
              className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
              title="Next page"
              aria-label="Next page"
            >
              <AppIcon name="chevronRight" icon={ChevronRight} size={14} className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= safeTotalPages}
              onClick={() => onPageChange(safeTotalPages)}
              className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
              title="Last page"
              aria-label="Last page"
            >
              <AppIcon name="chevronsRight" icon={ChevronsRight} size={14} className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
