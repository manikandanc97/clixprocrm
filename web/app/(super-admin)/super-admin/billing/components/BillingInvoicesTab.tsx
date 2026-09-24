"use client";

import React, { useMemo } from "react";
import { Receipt, Building2, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  CRMToolbar,
  CRMPagination,
  TruncatedText,
} from "@/shared/components/crm";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
import { PlatformInvoiceItemData } from "@/shared/lib/api/super-admin.api";
import { getInvStatusBadge } from "../utils/billing-formatters.util";

interface BillingInvoicesTabProps {
  loading: boolean;
  invSearch: string;
  setInvSearch: (val: string) => void;
  invStatusFilter: string;
  setInvStatusFilter: (val: string) => void;
  invPage: number;
  setInvPage: (page: number) => void;
  invRowsPerPage: number;
  setInvRowsPerPage: (rows: number) => void;
  invSortConfig: { key: string; direction: "asc" | "desc" } | null;
  setInvSortConfig: (cfg: { key: string; direction: "asc" | "desc" } | null) => void;
  filteredInvoices: PlatformInvoiceItemData[];
  paginatedInvoices: PlatformInvoiceItemData[];
  totalInvPages: number;
  formatCurrency: (amount: number, currency?: string) => string;
  onViewInvoice: (inv: PlatformInvoiceItemData) => void;
  onRefundInvoice: (inv: PlatformInvoiceItemData) => void;
}

export function BillingInvoicesTab({
  loading,
  invSearch,
  setInvSearch,
  invStatusFilter,
  setInvStatusFilter,
  invPage,
  setInvPage,
  invRowsPerPage,
  setInvRowsPerPage,
  invSortConfig,
  setInvSortConfig,
  filteredInvoices,
  paginatedInvoices,
  totalInvPages,
  formatCurrency,
  onViewInvoice,
  onRefundInvoice,
}: BillingInvoicesTabProps) {

  const columns = useMemo<CRMDataTableColumn<PlatformInvoiceItemData>[]>(() => {
    return [
      {
        header: "Platform Invoice #",
        sortable: true,
        sortDirection: invSortConfig?.key === "invoiceNumber" ? invSortConfig.direction : null,
        onSort: (dir) => setInvSortConfig(dir ? { key: "invoiceNumber", direction: dir } : null),
        cell: (inv) => (
          <span className="font-mono font-bold text-foreground text-xs">
            {inv.invoiceNumber}
          </span>
        ),
        className: "w-[160px]",
      },
      {
        header: "Organization (Tenant)",
        cell: (inv) => (
          <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <TruncatedText text={inv.tenantName} lines={1} className="font-semibold text-foreground text-xs" />
          </div>
        ),
        className: "min-w-[200px]",
      },
      {
        header: "Plan & Seats",
        cell: (inv) => (
          <div className="text-muted-foreground capitalize text-xs max-w-[160px]">
            <TruncatedText text={`${inv.planName} (${inv.seats} seats)`} lines={1} />
          </div>
        ),
        className: "w-[160px]",
      },
      {
        header: "Date",
        sortable: true,
        sortDirection: invSortConfig?.key === "invoiceDate" ? invSortConfig.direction : null,
        onSort: (dir) => setInvSortConfig(dir ? { key: "invoiceDate", direction: dir } : null),
        cell: (inv) => (
          <span className="text-xs text-muted-foreground">
            {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
        className: "w-[130px]",
      },
      {
        header: "Tax (GST)",
        align: "right",
        cell: (inv) => (
          <span className="font-mono text-muted-foreground text-xs">
            {formatCurrency(inv.taxAmount, inv.currency)}
          </span>
        ),
        className: "w-[120px]",
      },
      {
        header: "Total Amount",
        align: "right",
        sortable: true,
        sortDirection: invSortConfig?.key === "totalAmount" ? invSortConfig.direction : null,
        onSort: (dir) => setInvSortConfig(dir ? { key: "totalAmount", direction: dir } : null),
        cell: (inv) => (
          <span className="font-mono font-bold text-foreground text-xs">
            {formatCurrency(inv.totalAmount, inv.currency)}
          </span>
        ),
        className: "w-[140px]",
      },
      {
        header: "Status",
        align: "center",
        cell: (inv) => getInvStatusBadge(inv.status, inv.paymentStatus),
        className: "w-[120px]",
      },
      {
        header: "Actions",
        align: "right",
        cell: (inv) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewInvoice(inv)}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              title="View Invoice"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {inv.paymentStatus === "PAID" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRefundInvoice(inv)}
                className="h-7 px-2.5 text-[11px] text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 font-semibold gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Refund
              </Button>
            )}
          </div>
        ),
        className: "w-24 text-right",
        headerClassName: "w-24 text-right",
      },
    ];
  }, [invSortConfig, setInvSortConfig, formatCurrency, onViewInvoice, onRefundInvoice]);

  return (
    <div className="crm-table-workspace-sticky">
      <CRMToolbar
        searchQuery={invSearch}
        setSearchQuery={setInvSearch}
        placeholder="Search by invoice # or organization..."
        sticky={false}
      >
        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
          {["all", "paid", "pending", "refunded"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setInvStatusFilter(st);
                setInvPage(1);
              }}
              className={`h-7 px-2.5 rounded-md text-xs font-semibold capitalize transition-all ${
                invStatusFilter === st
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </CRMToolbar>

      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <CRMDataTable<PlatformInvoiceItemData>
          data={paginatedInvoices}
          columns={columns}
          isLoading={loading}
          isError={false}
          emptyIcon={Receipt}
          emptyTitle="No platform invoices yet"
          emptyDescription="Invoices will appear here when paid subscriptions generate billing."
          hasPagination={false}
        />

        {/* Pagination */}
        <CRMPagination
          currentPage={invPage}
          totalPages={totalInvPages}
          totalItems={filteredInvoices.length}
          rowsPerPage={invRowsPerPage}
          onPageChange={setInvPage}
          onRowsPerPageChange={(rows: number) => {
            setInvRowsPerPage(rows);
            setInvPage(1);
          }}
          itemName="Invoices"
        />
      </div>
    </div>
  );
}
