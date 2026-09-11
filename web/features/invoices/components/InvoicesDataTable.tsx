"use client";

import { useMemo, useCallback } from "react";
import {
  Receipt,
  Calendar,
  Eye,
  Printer,
  CreditCard,
  Trash2,
} from "lucide-react";
import { CRMDataTable, CRMDataTableColumn } from "@/shared/components/crm/CRMDataTable";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { formatDate } from "@/shared/utils/formatters";
import { InvoiceSortConfig } from "@/features/invoices/hooks/use-invoices-data";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";

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
  formatCurrency,
  getInvoiceColor: getCustomInvoiceColor,
  onOpenDetail,
  onOpenPayment,
  onPrintPdf,
  onDeleteInvoice,
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

  // Stable sort direction per key for DataTableColumnHeader
  const sortDirection = useMemo(
    () => (key: string) =>
      sortConfig?.key === key ? (sortConfig.direction as SortDirection) : null,
    [sortConfig]
  );

  const resolveInvoiceColor = useCallback(
    (name: string) => {
      if (getCustomInvoiceColor) {
        return getCustomInvoiceColor(name);
      }
      return getOrgAvatarColor(name || "Invoice");
    },
    [getCustomInvoiceColor]
  );

  const columns = useMemo<CRMDataTableColumn<any>[]>(() => {
    return [
      // 1. Checkbox
      {
        header: (
          <div className="flex items-center justify-center">
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
          </div>
        ),
        cell: (inv: any) => {
          const isSelected = selectedInvoiceIds.includes(inv.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
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
            </div>
          );
        },
        className: "w-12 px-4 py-3.5 text-center",
        headerClassName: "w-12 px-4 py-3.5 text-center",
        align: "center",
      },

      // 2. Invoice # & Icon
      {
        header: "Invoice #",
        sortable: true,
        sortDirection: sortDirection("invoiceNumber"),
        onSort: (dir) => setSort("invoiceNumber", dir),
        cell: (inv: any) => {
          const clientName =
            inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned";
          const color = resolveInvoiceColor(clientName || inv.invoiceNumber);
          return (
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(inv.id);
                  }}
                  className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate font-mono block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs"
                >
                  {inv.invoiceNumber}
                </button>
                <p className="text-[11px] text-muted-foreground truncate">
                  {formatDate(inv.invoiceDate, "No date")}
                </p>
              </div>
            </div>
          );
        },
        className: "px-4 py-3.5 font-medium overflow-hidden",
      },

      // 3. Customer / Company
      {
        header: "Customer / Company",
        sortable: true,
        sortDirection: sortDirection("client"),
        onSort: (dir) => setSort("client", dir),
        cell: (inv: any) => {
          const clientName =
            inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned";
          return (
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
          );
        },
        className: "px-4 py-3.5",
      },

      // 4. Due Date
      {
        header: "Due Date",
        sortable: true,
        sortDirection: sortDirection("dueDate"),
        onSort: (dir) => setSort("dueDate", dir),
        cell: (inv: any) => (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span>{formatDate(inv.dueDate, "On Receipt")}</span>
          </div>
        ),
        className: "px-4 py-3.5",
      },

      // 5. Total Amount
      {
        header: "Total Amount",
        sortable: true,
        sortDirection: sortDirection("totalAmount"),
        onSort: (dir) => setSort("totalAmount", dir),
        cell: (inv: any) => (
          <span className="font-bold text-foreground text-xs font-mono">
            {formatCurrency(inv.totalAmount || inv.total || 0, inv.currency)}
          </span>
        ),
        className: "px-4 py-3.5",
      },

      // 6. Paid Amount
      {
        header: "Paid",
        sortable: true,
        sortDirection: sortDirection("paidAmount"),
        onSort: (dir) => setSort("paidAmount", dir),
        cell: (inv: any) => (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
            {inv.paidAmount > 0
              ? formatCurrency(inv.paidAmount, inv.currency)
              : "—"}
          </span>
        ),
        className: "px-4 py-3.5",
      },

      // 7. Balance Amount
      {
        header: "Balance",
        sortable: true,
        sortDirection: sortDirection("balanceAmount"),
        onSort: (dir) => setSort("balanceAmount", dir),
        cell: (inv: any) => (
          <span className="font-bold text-foreground text-xs font-mono">
            {formatCurrency(inv.balanceAmount || inv.balance || 0, inv.currency)}
          </span>
        ),
        className: "px-4 py-3.5",
      },

      // 8. Status
      {
        header: "Status",
        sortable: true,
        sortDirection: sortDirection("status"),
        onSort: (dir) => setSort("status", dir),
        cell: (inv: any) => (
          <StatusBadge
            status={inv.status || "DRAFT"}
            variant={getInvoiceStatusVariant(inv.status, inv.paymentStatus, inv.isOverdue)}
          />
        ),
        className: "px-4 py-3.5",
      },

      // 9. Actions
      {
        header: <span className="sr-only">Actions</span>,
        align: "right",
        cell: (inv: any) => (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end">
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
          </div>
        ),
        className: "w-16 px-4 py-3.5 text-right",
        headerClassName: "w-16 px-4 py-3.5 text-right",
      },
    ];
  }, [
    isAllSelected,
    somePageSelected,
    paginatedInvoices,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    toggleSelectAllCurrentPage,
    toggleSelectInvoice,
    sortDirection,
    setSort,
    resolveInvoiceColor,
    formatCurrency,
    onOpenDetail,
    onPrintPdf,
    onOpenPayment,
    onDeleteInvoice,
  ]);

  return (
    <CRMDataTable
      data={paginatedInvoices}
      columns={columns}
      isLoading={isInitialLoading}
      onRowClick={(inv) => onOpenDetail(inv.id)}
      hasPagination={false}
      rowClassName={(inv) =>
        cn(
          "group h-16 hover:bg-muted/30 transition-colors",
          selectedInvoiceIds.includes(inv.id) && "bg-primary/[0.03]"
        )
      }
      emptyIcon={Receipt}
      emptyTitle="No invoices found"
      emptyDescription="No customer invoices match your current search or filter criteria."
    />
  );
}
