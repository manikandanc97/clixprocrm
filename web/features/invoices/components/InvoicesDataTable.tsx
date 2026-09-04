"use client";

import { useMemo } from "react";
import {
  Receipt,
  Calendar,
  Eye,
  Printer,
  CreditCard,
  Trash2,
  RotateCcw,
  Plus,
} from "lucide-react";
import {
  CRMDataTable,
  CRMTableHeader,
  CRMTableBody,
  CRMTableRow,
  CRMTableCell,
  CRMTableHeaderCell,
  EmptyState,
} from "@/shared/components/crm";
import {
  DataTableColumnHeader,
  SortDirection,
} from "@/shared/components/DataTableColumnHeader";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { formatDate } from "@/shared/utils/formatters";
import { InvoiceSortConfig } from "@/features/invoices/hooks/use-invoices-data";

// ─── Status Variant Mapping ──────────────────────────────────────────────────
export function getInvoiceStatusVariant(
  status?: string,
  paymentStatus?: string,
  isOverdue?: boolean
): StatusVariant {
  const normStatus = status?.toUpperCase();
  const normPayment = paymentStatus?.toUpperCase();

  if (normStatus === "PAID" || normPayment === "PAID") return "emerald";
  if (normPayment === "PARTIALLY_PAID" || normStatus === "PARTIALLY_PAID") return "amber";
  if (normStatus === "OVERDUE" || isOverdue) return "rose";
  if (normStatus === "SENT") return "blue";
  if (normStatus === "DRAFT") return "slate";
  if (normStatus === "CANCELLED") return "neutral";
  return "neutral";
}

// ─── Props Interface ─────────────────────────────────────────────────────────
export interface InvoicesDataTableProps {
  paginatedInvoices: any[];
  isInitialLoading: boolean;
  selectedInvoiceIds: string[];
  setSelectedInvoiceIds: React.Dispatch<React.SetStateAction<string[]>>;
  isAllCurrentPageSelected?: boolean;
  toggleSelectAllCurrentPage?: () => void;
  toggleSelectInvoice?: (id: string) => void;
  sortConfig: InvoiceSortConfig | null;
  setSort: (key: string, dir: "asc" | "desc" | null) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
  getInvoiceColor?: (name: string) => { bg: string; text: string; border: string };
  onOpenDetail: (id: string) => void;
  onOpenPayment: (invoice: any) => void;
  onPrintPdf: (id: string) => void;
  onDeleteInvoice: (invoice: any) => void;
  onCreateInvoice: () => void;
}

// ─── Skeleton Rows ───────────────────────────────────────────────────────────
function InvoicesTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <CRMTableRow key={i} className="animate-pulse h-16 hover:bg-transparent">
          <CRMTableCell className="px-4 py-4 text-center">
            <div className="h-4 w-4 bg-muted rounded mx-auto" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-3.5 w-28 bg-muted rounded" />
                <div className="h-2.5 w-20 bg-muted/60 rounded" />
              </div>
            </div>
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="h-4 w-32 bg-muted rounded" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="h-4 w-24 bg-muted rounded" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="h-4 w-24 bg-muted rounded" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="h-4 w-20 bg-muted rounded" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="h-4 w-20 bg-muted rounded" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="h-6 w-20 bg-muted rounded-md" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4 text-right">
            <div className="h-6 w-6 bg-muted rounded ml-auto" />
          </CRMTableCell>
        </CRMTableRow>
      ))}
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function InvoicesDataTable({
  paginatedInvoices,
  isInitialLoading,
  selectedInvoiceIds,
  setSelectedInvoiceIds,
  isAllCurrentPageSelected,
  toggleSelectAllCurrentPage,
  toggleSelectInvoice,
  sortConfig,
  setSort,
  hasActiveFilters,
  handleClearFilters,
  formatCurrency,
  getInvoiceColor: getCustomInvoiceColor,
  onOpenDetail,
  onOpenPayment,
  onPrintPdf,
  onDeleteInvoice,
  onCreateInvoice,
}: InvoicesDataTableProps) {
  // Master-checkbox: current page selection state
  const isAllSelected =
    isAllCurrentPageSelected !== undefined
      ? isAllCurrentPageSelected
      : paginatedInvoices.length > 0 &&
        paginatedInvoices.every((inv) => selectedInvoiceIds.includes(inv.id));

  const somePageSelected =
    !isAllSelected &&
    paginatedInvoices.some((inv) => selectedInvoiceIds.includes(inv.id));

  // Sort helper — converts DataTableColumnHeader's 3-state output to setSort
  const makeSortHandler = (key: string) => (dir: SortDirection) => {
    setSort(key, dir);
  };

  // Stable sort direction per key for DataTableColumnHeader
  const sortDirection = useMemo(
    () => (key: string) =>
      sortConfig?.key === key ? (sortConfig.direction as "asc" | "desc") : null,
    [sortConfig]
  );

  const resolveInvoiceColor = (name: string) => {
    if (getCustomInvoiceColor) {
      return getCustomInvoiceColor(name);
    }
    return getOrgAvatarColor(name || "Invoice");
  };

  return (
    <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
      <CRMDataTable
        hasPagination
        containerClassName="border-0 shadow-none rounded-none flex-1 min-h-0"
        className="w-full text-left text-xs border-collapse table-fixed"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <CRMTableHeader className="sticky top-0 z-20 bg-muted/60 dark:bg-muted/40 border-b border-border shadow-xs backdrop-blur-xs">
          <CRMTableRow className="text-xs font-bold text-foreground hover:bg-transparent">
            {/* Master checkbox */}
            <CRMTableHeaderCell className="w-12 px-4 py-3.5 text-center bg-muted/60 dark:bg-muted/40 border-r border-border/40">
              <Checkbox
                checked={isAllSelected ? true : somePageSelected ? "indeterminate" : false}
                onCheckedChange={() => {
                  if (toggleSelectAllCurrentPage) {
                    toggleSelectAllCurrentPage();
                  } else {
                    if (isAllSelected) {
                      const pageIds = new Set(paginatedInvoices.map((inv) => inv.id));
                      setSelectedInvoiceIds((prev) => prev.filter((id) => !pageIds.has(id)));
                    } else {
                      setSelectedInvoiceIds((prev) =>
                        Array.from(new Set([...prev, ...paginatedInvoices.map((inv) => inv.id)]))
                      );
                    }
                  }
                }}
                aria-label="Select all on this page"
                className="mx-auto"
              />
            </CRMTableHeaderCell>

            {/* Invoice # */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
              <DataTableColumnHeader
                title="Invoice #"
                sortable
                sortDirection={sortDirection("invoiceNumber")}
                onSort={makeSortHandler("invoiceNumber")}
              />
            </CRMTableHeaderCell>

            {/* Customer / Company */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
              <DataTableColumnHeader
                title="Customer / Company"
                sortable
                sortDirection={sortDirection("client")}
                onSort={makeSortHandler("client")}
              />
            </CRMTableHeaderCell>

            {/* Due Date */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
              <DataTableColumnHeader
                title="Due Date"
                sortable
                sortDirection={sortDirection("dueDate")}
                onSort={makeSortHandler("dueDate")}
              />
            </CRMTableHeaderCell>

            {/* Total Amount */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
              <DataTableColumnHeader
                title="Total Amount"
                sortable
                sortDirection={sortDirection("totalAmount")}
                onSort={makeSortHandler("totalAmount")}
              />
            </CRMTableHeaderCell>

            {/* Paid */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
              <DataTableColumnHeader
                title="Paid"
                sortable
                sortDirection={sortDirection("paidAmount")}
                onSort={makeSortHandler("paidAmount")}
              />
            </CRMTableHeaderCell>

            {/* Balance */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
              <DataTableColumnHeader
                title="Balance"
                sortable
                sortDirection={sortDirection("balanceAmount")}
                onSort={makeSortHandler("balanceAmount")}
              />
            </CRMTableHeaderCell>

            {/* Status */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-border/40 bg-muted/60 dark:bg-muted/40 select-none">
              <DataTableColumnHeader
                title="Status"
                sortable
                sortDirection={sortDirection("status")}
                onSort={makeSortHandler("status")}
              />
            </CRMTableHeaderCell>

            {/* Actions */}
            <CRMTableHeaderCell className="w-16 px-4 py-3.5 text-right bg-muted/60 dark:bg-muted/40">
              <span className="sr-only">Actions</span>
            </CRMTableHeaderCell>
          </CRMTableRow>
        </CRMTableHeader>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <CRMTableBody className="divide-y divide-border/40 text-xs">
          {isInitialLoading ? (
            <InvoicesTableSkeleton />
          ) : paginatedInvoices.length > 0 ? (
            paginatedInvoices.map((inv: any) => {
              const clientName =
                inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned";
              const color = resolveInvoiceColor(clientName || inv.invoiceNumber);
              const isSelected = selectedInvoiceIds.includes(inv.id);

              return (
                <CRMTableRow
                  key={inv.id}
                  className={cn(
                    "group h-16 hover:bg-muted/30 transition-colors",
                    isSelected && "bg-primary/[0.03]"
                  )}
                >
                  {/* Checkbox */}
                  <CRMTableCell className="px-4 py-3.5 text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {
                        if (toggleSelectInvoice) {
                          toggleSelectInvoice(inv.id);
                        } else {
                          setSelectedInvoiceIds((prev) =>
                            prev.includes(inv.id)
                              ? prev.filter((id) => id !== inv.id)
                              : [...prev, inv.id]
                          );
                        }
                      }}
                      aria-label={`Select invoice ${inv.invoiceNumber || inv.id}`}
                      className="mx-auto"
                    />
                  </CRMTableCell>

                  {/* Invoice # & Icon */}
                  <CRMTableCell className="px-4 py-3.5 font-medium overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs border shrink-0",
                          color.bg,
                          color.text,
                          color.border
                        )}
                      >
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => onOpenDetail(inv.id)}
                          className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate font-mono"
                        >
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {formatDate(inv.invoiceDate, "No date")}
                        </p>
                      </div>
                    </div>
                  </CRMTableCell>

                  {/* Customer / Company */}
                  <CRMTableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                        {clientName ? clientName.charAt(0) : "C"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {clientName}
                        </p>
                        {inv.customer?.name && inv.company?.name && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {inv.customer.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CRMTableCell>

                  {/* Due Date */}
                  <CRMTableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      <span>{formatDate(inv.dueDate, "On Receipt")}</span>
                    </div>
                  </CRMTableCell>

                  {/* Total Amount */}
                  <CRMTableCell className="px-4 py-3.5">
                    <span className="font-bold text-foreground text-xs font-mono">
                      {formatCurrency(inv.totalAmount || inv.total || 0, inv.currency)}
                    </span>
                  </CRMTableCell>

                  {/* Paid Amount */}
                  <CRMTableCell className="px-4 py-3.5">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                      {inv.paidAmount > 0
                        ? formatCurrency(inv.paidAmount, inv.currency)
                        : "—"}
                    </span>
                  </CRMTableCell>

                  {/* Balance Amount */}
                  <CRMTableCell className="px-4 py-3.5">
                    <span className="font-bold text-foreground text-xs font-mono">
                      {formatCurrency(inv.balanceAmount || inv.balance || 0, inv.currency)}
                    </span>
                  </CRMTableCell>

                  {/* Status */}
                  <CRMTableCell className="px-4 py-3.5">
                    <StatusBadge
                      status={inv.status || "DRAFT"}
                      variant={getInvoiceStatusVariant(inv.status, inv.paymentStatus, inv.isOverdue)}
                    />
                  </CRMTableCell>

                  {/* Actions */}
                  <CRMTableCell className="px-4 py-3.5 text-right">
                    <CRMActionMenu
                      triggerOrientation="vertical"
                      items={[
                        {
                          label: "View Details",
                          icon: Eye,
                          onClick: () => onOpenDetail(inv.id),
                        },
                        {
                          label: "Print / PDF",
                          icon: Printer,
                          onClick: () => onPrintPdf(inv.id),
                        },
                        ...((inv.balanceAmount > 0 || inv.balance > 0) && inv.status !== "CANCELLED"
                          ? [
                              {
                                label: "Record Payment",
                                icon: CreditCard,
                                className:
                                  "text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/10 focus:bg-emerald-500/10",
                                onClick: () => onOpenPayment(inv),
                              },
                            ]
                          : []),
                        {
                          label: "Delete Invoice",
                          icon: Trash2,
                          variant: "destructive" as const,
                          separatorBefore: true,
                          onClick: () => onDeleteInvoice(inv),
                        },
                      ]}
                    />
                  </CRMTableCell>
                </CRMTableRow>
              );
            })
          ) : (
            /* Empty state */
            <CRMTableRow className="hover:bg-transparent border-0">
              <CRMTableCell colSpan={9} className="p-6 text-center text-muted-foreground align-middle border-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <EmptyState
                    icon={Receipt}
                    title="No invoices found"
                    description="No customer invoices match your current search or filter criteria."
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear Filters",
                            onClick: handleClearFilters,
                            icon: RotateCcw,
                          }
                        : {
                            label: "Create Invoice",
                            onClick: onCreateInvoice,
                            icon: Plus,
                          }
                    }
                  />
                </div>
              </CRMTableCell>
            </CRMTableRow>
          )}
        </CRMTableBody>
      </CRMDataTable>
    </div>
  );
}
