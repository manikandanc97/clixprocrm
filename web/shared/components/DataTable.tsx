"use client";

import * as React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/shared/ui/table";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/components/EmptyState";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { LucideIcon } from "lucide-react";

import { Skeleton } from "@/shared/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";

export interface DataTableColumn<T> {
  header: string | React.ReactNode;
  cell: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Semantic alignment for this column */
  align?: "left" | "center" | "right";
  /** Whether this column supports sorting */
  sortable?: boolean;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Called when user clicks sort on this column */
  onSort?: (direction: SortDirection) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  wrapperClassName?: string;
  rowClassName?: string | ((item: T) => string);
  emptyMessage?: string | React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  hasPagination?: boolean;
  isLoading?: boolean;
  loadingRows?: number;
  isError?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
}

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  className,
  wrapperClassName,
  rowClassName,
  emptyMessage,
  emptyTitle = "No data available",
  emptyDescription = "There are no records matching your criteria.",
  emptyIcon,
  hasPagination = true,
  isLoading = false,
  loadingRows = 5,
  isError = false,
  error,
  onRetry,
}: DataTableProps<T>) {
  const renderEmptyState = () => {
    if (React.isValidElement(emptyMessage)) {
      return emptyMessage;
    }

    const title = typeof emptyMessage === "string" ? emptyMessage : emptyTitle;

    return (
      <EmptyState 
        icon={emptyIcon}
        title={title}
        description={emptyDescription}
        className="border-none bg-transparent shadow-none p-4 min-h-0"
      />
    );
  };

  return (
    <Table className={cn("min-w-full", className)} wrapperClassName={cn(!hasPagination && "crm-table-no-pagination", wrapperClassName)}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((column, index) => {
            const alignClass = column.align === "right"
              ? "text-right"
              : column.align === "center"
              ? "text-center"
              : "text-left";
            return (
              <TableHead
                key={index}
                className={cn(alignClass, column.headerClassName, column.className)}
              >
                {typeof column.header === "string" ? (
                  <DataTableColumnHeader
                    title={column.header}
                    align={column.align ?? "left"}
                    sortable={column.sortable}
                    sortDirection={column.sortDirection}
                    onSort={column.onSort}
                  />
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: loadingRows }).map((_, rIdx) => (
            <TableRow key={`skeleton-row-${rIdx}`} className="h-16 animate-pulse hover:bg-transparent">
              {columns.map((column, cIdx) => (
                <TableCell key={`skeleton-col-${cIdx}`} className={column.className}>
                  {cIdx === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-28 max-w-[80%]" />
                        <Skeleton className="h-2.5 w-20 max-w-[60%]" />
                      </div>
                    </div>
                  ) : cIdx === columns.length - 1 ? (
                    <div className="flex items-center justify-end gap-1.5 ml-auto">
                      <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                  ) : (
                    <Skeleton className="h-3.5 w-24 max-w-full" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : isError ? (
          <TableRow className="hover:bg-transparent border-0">
            <TableCell
              colSpan={columns.length}
              className="p-8 text-center border-0"
            >
              <div className="flex flex-col items-center justify-center space-y-3 py-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Failed to load data</h4>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {typeof error === "string" ? error : error?.message || "An unexpected error occurred while fetching table records."}
                </p>
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 text-xs font-semibold mt-2">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ) : data.length > 0 ? (
          data.map((item, rowIndex) => (
            <TableRow
              key={rowIndex}
              onClick={() => onRowClick?.(item)}
              className={cn(
                onRowClick && "cursor-pointer transition-colors hover:bg-muted/[0.03]",
                typeof rowClassName === "function" ? rowClassName(item) : rowClassName
              )}
            >
              {columns.map((column, colIndex) => {
                const cellAlignClass = column.align === "right"
                  ? "text-right"
                  : column.align === "center"
                  ? "text-center"
                  : undefined;
                return (
                  <TableCell key={colIndex} className={cn(column.className, cellAlignClass)}>
                    {column.cell(item)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : (
          <TableRow className="hover:bg-transparent border-0">
            <TableCell
              colSpan={columns.length}
              className="p-4 text-center text-muted-foreground border-0"
            >
              {renderEmptyState()}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
