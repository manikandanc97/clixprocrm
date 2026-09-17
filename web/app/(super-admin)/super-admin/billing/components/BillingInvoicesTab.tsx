"use client";

import React from "react";
import { Receipt, Building2, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  CRMToolbar,
  CRMPagination,
  TruncatedText,
  EmptyState,
} from "@/shared/components/crm";
import { DataTableColumnHeader } from "@/shared/components/DataTableColumnHeader";
import { cn } from "@/shared/lib/utils";
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
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead className="sticky top-0 z-20 bg-muted border-b border-border shadow-xs">
              <tr className="h-10 text-xs font-bold text-foreground">
                <th className="h-10 px-4 py-2 text-left border-r border-border/60 bg-muted whitespace-nowrap cursor-pointer select-none">
                  <DataTableColumnHeader
                    title="Platform Invoice #"
                    sortable
                    sortDirection={invSortConfig?.key === "invoiceNumber" ? invSortConfig.direction : null}
                    onSort={(d) => setInvSortConfig(d ? { key: "invoiceNumber", direction: d } : null)}
                  />
                </th>
                <th className="h-10 px-4 py-2 text-left border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Organization (Tenant)" />
                </th>
                <th className="h-10 px-4 py-2 text-left border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Plan & Seats" />
                </th>
                <th className="h-10 px-4 py-2 text-left border-r border-border/60 bg-muted whitespace-nowrap cursor-pointer select-none">
                  <DataTableColumnHeader
                    title="Date"
                    sortable
                    sortDirection={invSortConfig?.key === "invoiceDate" ? invSortConfig.direction : null}
                    onSort={(d) => setInvSortConfig(d ? { key: "invoiceDate", direction: d } : null)}
                  />
                </th>
                <th className="h-10 px-4 py-2 text-right border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Tax (GST)" align="right" />
                </th>
                <th className="h-10 px-4 py-2 text-right border-r border-border/60 bg-muted whitespace-nowrap cursor-pointer select-none">
                  <DataTableColumnHeader
                    title="Total Amount"
                    align="right"
                    sortable
                    sortDirection={invSortConfig?.key === "totalAmount" ? invSortConfig.direction : null}
                    onSort={(d) => setInvSortConfig(d ? { key: "totalAmount", direction: d } : null)}
                  />
                </th>
                <th className="h-10 px-4 py-2 text-center border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Status" align="center" />
                </th>
                <th className="h-10 w-24 px-4 py-2 text-right bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Actions" align="right" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-muted rounded font-mono" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-36 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 w-20 bg-muted rounded ml-auto" /></td>
                    <td className="px-4 py-4 text-center"><div className="h-5 w-16 bg-muted rounded-full mx-auto" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-7 w-20 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 border-0">
                    <EmptyState
                      title="No platform invoices yet"
                      description="Invoices will appear here when paid subscriptions generate billing."
                      icon={Receipt}
                      className="border-none bg-transparent shadow-none p-0 min-h-0"
                    />
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="group h-16 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-foreground text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground text-xs max-w-[200px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <TruncatedText text={inv.tenantName} lines={1} className="font-semibold text-foreground" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground capitalize text-xs max-w-[160px]">
                      <TruncatedText text={`${inv.planName} (${inv.seats} seats)`} lines={1} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-muted-foreground text-xs">
                      {formatCurrency(inv.taxAmount, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground text-xs">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getInvStatusBadge(inv.status, inv.paymentStatus)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
