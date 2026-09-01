"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
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
  pageSizeOptions = [10, 25, 50, 100],
  className,
  alwaysShow = false,
}: CRMPaginationProps) {
  if (totalItems === 0 || (!alwaysShow && totalItems <= rowsPerPage)) return null;

  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 bg-card border border-border rounded-2xl p-3.5 sm:p-4 shadow-card shrink-0 w-full transition-all",
        className
      )}
    >
      {/* Showing item range */}
      <div className="text-xs sm:text-sm text-muted-foreground font-medium w-full md:w-auto text-center md:text-left">
        Showing <span className="font-bold text-foreground">{startItem}</span>–
        <span className="font-bold text-foreground">{endItem}</span> of{" "}
        <span className="font-bold text-foreground">
          {new Intl.NumberFormat().format(totalItems)}
        </span>{" "}
        {itemName}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 w-full md:w-auto justify-center md:justify-end">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            Rows per page:
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 font-semibold text-xs rounded-lg"
              >
                {rowsPerPage}{" "}
                <AppIcon icon={ChevronDown} name="chevronDown" size={14} className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[4.5rem]">
              {pageSizeOptions.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => {
                    onRowsPerPageChange(size);
                    onPageChange(1);
                  }}
                  className={cn(
                    "font-medium text-xs cursor-pointer hover:bg-muted",
                    rowsPerPage === size && "bg-muted/80 font-bold text-foreground"
                  )}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 cursor-pointer"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            aria-label="First page"
            title="First page"
          >
            <AppIcon icon={ChevronsLeft} name="chevronLeft" size={16} />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 cursor-pointer"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            title="Previous page"
          >
            <AppIcon icon={ChevronLeft} name="chevronLeft" size={16} />
          </Button>

          {/* Page indicator */}
          <div className="flex items-center justify-center px-3 text-xs sm:text-sm font-semibold text-foreground min-w-[5.5rem]">
            Page {currentPage} of {safeTotalPages}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 cursor-pointer"
            onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
            disabled={currentPage >= safeTotalPages}
            aria-label="Next page"
            title="Next page"
          >
            <AppIcon icon={ChevronRight} name="chevronRight" size={16} />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 cursor-pointer"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={currentPage >= safeTotalPages}
            aria-label="Last page"
            title="Last page"
          >
            <AppIcon icon={ChevronsRight} name="chevronRight" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
