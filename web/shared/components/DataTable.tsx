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
        className="border-none bg-transparent shadow-none p-6 min-h-[220px]"
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
        {data.length > 0 ? (
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
