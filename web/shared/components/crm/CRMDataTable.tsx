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
  container: "crm-table-wrap",
  table: "w-full border-collapse text-left text-sm",
  header: "sticky top-0 z-20 border-b border-border/60 bg-card",
  body: "divide-y divide-border/40",
  row: "group h-16 border-b border-border/40 align-middle",
  rowInteractive: "cursor-pointer transition-colors duration-150 hover:bg-muted/[0.03]",
  cell: "h-16 px-4 sm:px-6 py-3 align-middle text-sm",
  headerCell: "h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground bg-card",
} as const;

export const CRMDataTable = ({
  children,
  className,
  containerClassName,
  hasPagination = true,
}: CRMDataTableProps) => {
  return (
    <CRMCard noPadding withAccent={false} className={cn(crmTableStyles.container, !hasPagination && "crm-table-no-pagination", containerClassName)}>
      <div className="overflow-auto flex-1 min-h-0">
        <table className={cn(crmTableStyles.table, className)}>
          {children}
        </table>
      </div>
    </CRMCard>
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











