"use client";

import { cn } from "@/shared/lib/utils";
import { CRMCard } from "./CRMCard";

interface CRMDataTableProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  hasPagination?: boolean;
}

export const crmTableStyles = {
  container: "bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0",
  table: "w-full border-collapse text-left text-xs",
  header: "sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs",
  body: "divide-y divide-border/40 text-xs",
  row: "group h-16 border-b border-border/40 align-middle hover:bg-muted/30 transition-colors",
  rowInteractive: "cursor-pointer transition-colors duration-150 hover:bg-muted/30",
  cell: "h-16 px-4 py-3.5 align-middle text-xs",
  headerCell: "h-11 px-4 py-3.5 text-left text-xs font-bold text-foreground border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 whitespace-nowrap last:border-r-0 select-none",
} as const;

export const CRMDataTable = ({
  children,
  className,
  containerClassName,
  hasPagination = true,
}: CRMDataTableProps) => {
  return (
    <div className={cn(crmTableStyles.container, !hasPagination && "crm-table-no-pagination", containerClassName)}>
      <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
        <table className={cn(crmTableStyles.table, className)}>
          {children}
        </table>
      </div>
    </div>
  );
};

export const CRMTableHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <thead className={cn(crmTableStyles.header, className)}>
    {children}
  </thead>
);

export const CRMTableBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tbody className={cn(crmTableStyles.body, className)}>
    {children}
  </tbody>
);

export const CRMTableRow = ({
  children,
  className,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr 
    className={cn(
      crmTableStyles.row,
      onClick && crmTableStyles.rowInteractive,
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </tr>
);

export const CRMTableCell = ({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn(crmTableStyles.cell, className)} {...props}>
    {children}
  </td>
);

export const CRMTableHeaderCell = ({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(crmTableStyles.headerCell, "group", className)}
    {...props}
  >
    {children}
  </th>
);











