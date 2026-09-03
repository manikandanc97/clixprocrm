"use client";

import { useMemo } from "react";
import { FileText, Plus, RotateCcw, Building2, Calendar } from "lucide-react";
import {
  CRMDataTable,
  CRMTableHeader,
  CRMTableBody,
  CRMTableRow,
  CRMTableCell,
  CRMTableHeaderCell,
  EmptyState,
} from "@/shared/components/crm";
import { DataTableColumnHeader } from "@/shared/components/DataTableColumnHeader";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { QuotationType } from "@/shared/types/quotation";
import { QuotationSortConfig } from "@/features/quotations/hooks/use-quotations-data";

// ─── Status variant mapping ────────────────────────────────────────────────
const QUOTATION_STATUS_VARIANT = {
  ACCEPTED: "emerald",
  SENT: "blue",
  DRAFT: "slate",
  REJECTED: "rose",
  EXPIRED: "amber",
} as const satisfies Record<string, import("@/shared/components/StatusBadge").StatusVariant>;

function getStatusVariant(status: string | undefined) {
  return QUOTATION_STATUS_VARIANT[status as keyof typeof QUOTATION_STATUS_VARIANT] ?? "neutral";
}

// ─── Props ─────────────────────────────────────────────────────────────────
export interface QuotationsDataTableProps {
  paginatedQuotations: QuotationType[];
  isInitialLoading: boolean;
  selectedQuoteIds: string[];
  setSelectedQuoteIds: React.Dispatch<React.SetStateAction<string[]>>;
  sortConfig: QuotationSortConfig | null;
  setSort: (key: string, dir: "asc" | "desc" | null) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;
  formatCurrency: (v: number) => string;
  onViewQuote: (quote: QuotationType) => void;
  onEditQuote: (quote: QuotationType) => void;
  onDeleteQuote: (quote: QuotationType) => void;
  onDuplicateQuote: (quote: QuotationType) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onCreateQuote: () => void;
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────
function QuotationsTableSkeleton() {
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
            <div className="h-4 w-28 bg-muted rounded" />
          </CRMTableCell>
          <CRMTableCell className="px-4 py-4">
            <div className="h-4 w-24 bg-muted rounded" />
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

// ─── Component ─────────────────────────────────────────────────────────────
export function QuotationsDataTable({
  paginatedQuotations,
  isInitialLoading,
  selectedQuoteIds,
  setSelectedQuoteIds,
  sortConfig,
  setSort,
  hasActiveFilters,
  handleClearFilters,
  formatCurrency,
  onViewQuote,
  onEditQuote,
  onDeleteQuote,
  onDuplicateQuote,
  onUpdateStatus,
  onCreateQuote,
}: QuotationsDataTableProps) {
  // Master-checkbox: current page selection state
  const allPageSelected =
    paginatedQuotations.length > 0 &&
    paginatedQuotations.every((q) => selectedQuoteIds.includes(q.id));

  const somePageSelected =
    !allPageSelected &&
    paginatedQuotations.some((q) => selectedQuoteIds.includes(q.id));

  // Sort helper — converts DataTableColumnHeader's 3-state output to setSort
  const makeSortHandler = (key: string) => (dir: "asc" | "desc" | null) => {
    setSort(key, dir);
  };

  // Stable sort direction per key for DataTableColumnHeader
  const sortDirection = useMemo(
    () => (key: string) =>
      sortConfig?.key === key ? (sortConfig.direction as "asc" | "desc") : null,
    [sortConfig]
  );

  return (
    <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
      <CRMDataTable
        hasPagination
        containerClassName="border-0 shadow-none rounded-none flex-1 min-h-0"
        className="w-full text-left text-xs border-collapse table-fixed"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <CRMTableHeader className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
          <CRMTableRow className="text-xs font-bold text-foreground hover:bg-transparent">
            {/* Master checkbox */}
            <CRMTableHeaderCell className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
              <Checkbox
                checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedQuoteIds((prev) =>
                      Array.from(new Set([...prev, ...paginatedQuotations.map((q) => q.id)]))
                    );
                  } else {
                    const pageIds = new Set(paginatedQuotations.map((q) => q.id));
                    setSelectedQuoteIds((prev) => prev.filter((id) => !pageIds.has(id)));
                  }
                }}
                aria-label="Select all on this page"
                className="mx-auto"
              />
            </CRMTableHeaderCell>

            {/* Quote # */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 select-none">
              <DataTableColumnHeader
                title="Quote #"
                sortable
                sortDirection={sortDirection("quoteId")}
                onSort={makeSortHandler("quoteId")}
              />
            </CRMTableHeaderCell>

            {/* Customer */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 select-none">
              <DataTableColumnHeader
                title="Customer"
                sortable
                sortDirection={sortDirection("client")}
                onSort={makeSortHandler("client")}
              />
            </CRMTableHeaderCell>

            {/* Related Deal */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
              <DataTableColumnHeader title="Related Deal" />
            </CRMTableHeaderCell>

            {/* Quote Value */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 select-none">
              <DataTableColumnHeader
                title="Quote Value"
                sortable
                sortDirection={sortDirection("amount")}
                onSort={makeSortHandler("amount")}
              />
            </CRMTableHeaderCell>

            {/* Valid Until */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 select-none">
              <DataTableColumnHeader
                title="Valid Until"
                sortable
                sortDirection={sortDirection("validTill")}
                onSort={makeSortHandler("validTill")}
              />
            </CRMTableHeaderCell>

            {/* Status */}
            <CRMTableHeaderCell className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 select-none">
              <DataTableColumnHeader
                title="Status"
                sortable
                sortDirection={sortDirection("status")}
                onSort={makeSortHandler("status")}
              />
            </CRMTableHeaderCell>

            {/* Actions */}
            <CRMTableHeaderCell className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
              <span className="sr-only">Actions</span>
            </CRMTableHeaderCell>
          </CRMTableRow>
        </CRMTableHeader>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <CRMTableBody className="divide-y divide-border/40 text-xs">
          {isInitialLoading ? (
            <QuotationsTableSkeleton />
          ) : paginatedQuotations.length > 0 ? (
            paginatedQuotations.map((quote) => {
              const color = getOrgAvatarColor(quote.client || quote.quoteId);
              const isSelected = selectedQuoteIds.includes(quote.id);

              return (
                <CRMTableRow
                  key={quote.id}
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
                        setSelectedQuoteIds((prev) =>
                          prev.includes(quote.id)
                            ? prev.filter((id) => id !== quote.id)
                            : [...prev, quote.id]
                        );
                      }}
                      aria-label={`Select quotation ${quote.quoteId}`}
                      className="mx-auto"
                    />
                  </CRMTableCell>

                  {/* Quote ID & Icon */}
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
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => onViewQuote(quote)}
                          className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate font-mono"
                        >
                          {quote.quoteId}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {quote.lastActivity || "Created Recently"}
                        </p>
                      </div>
                    </div>
                  </CRMTableCell>

                  {/* Customer / Client */}
                  <CRMTableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                        {quote.client ? quote.client.charAt(0) : "C"}
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate">
                        {quote.client || "Untitled Client"}
                      </span>
                    </div>
                  </CRMTableCell>

                  {/* Related Deal */}
                  <CRMTableCell className="px-4 py-3.5">
                    {quote.leadName ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-muted/40 text-muted-foreground max-w-[160px] truncate">
                        <Building2 className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {quote.leadName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </CRMTableCell>

                  {/* Amount */}
                  <CRMTableCell className="px-4 py-3.5">
                    <span className="font-bold text-foreground text-xs font-mono">
                      {formatCurrency(quote.amountValue ?? 0)}
                    </span>
                  </CRMTableCell>

                  {/* Valid Until */}
                  <CRMTableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      <span>{quote.validTill || "—"}</span>
                    </div>
                  </CRMTableCell>

                  {/* Status — canonical StatusBadge */}
                  <CRMTableCell className="px-4 py-3.5">
                    <StatusBadge
                      status={quote.status || "DRAFT"}
                      variant={getStatusVariant(quote.status)}
                    />
                  </CRMTableCell>

                  {/* Actions — canonical CRMActionMenu */}
                  <CRMTableCell className="px-4 py-3.5 text-right">
                    <CRMActionMenu
                      triggerOrientation="vertical"
                      items={[
                        {
                          label: "View Details",
                          icon: "eye",
                          onClick: () => onViewQuote(quote),
                        },
                        {
                          label: "Edit Quote",
                          icon: "edit",
                          onClick: () => onEditQuote(quote),
                        },
                        {
                          label: "Download PDF",
                          icon: "download",
                          onClick: () => window.open(`/quotations/${quote.id}/pdf`, "_blank"),
                        },
                        {
                          label: "Duplicate Quote",
                          icon: "copy",
                          onClick: () => onDuplicateQuote(quote),
                        },
                        ...(quote.status !== "ACCEPTED"
                          ? [
                              {
                                label: "Mark Accepted",
                                icon: "check" as const,
                                separatorBefore: true,
                                className: "text-emerald-600 dark:text-emerald-400 font-medium",
                                onClick: () => onUpdateStatus(quote.id, "ACCEPTED"),
                              },
                            ]
                          : []),
                        ...(quote.status !== "SENT"
                          ? [
                              {
                                label: "Mark Sent",
                                icon: "send" as const,
                                separatorBefore: quote.status === "ACCEPTED",
                                className: "text-blue-600 dark:text-blue-400 font-medium",
                                onClick: () => onUpdateStatus(quote.id, "SENT"),
                              },
                            ]
                          : []),
                        {
                          label: "Delete Quote",
                          icon: "trash",
                          variant: "destructive" as const,
                          separatorBefore: true,
                          onClick: (e: React.MouseEvent) => {
                            e.stopPropagation();
                            onDeleteQuote(quote);
                          },
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
              <CRMTableCell colSpan={8} className="p-6 text-center text-muted-foreground align-middle border-0">
                <div className="flex flex-col items-center justify-center py-6">
                  <EmptyState
                    icon={FileText}
                    title="No quotations found"
                    description="No quotations match your current search or filter criteria."
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear Filters",
                            onClick: handleClearFilters,
                            icon: RotateCcw,
                          }
                        : {
                            label: "Create Quote",
                            onClick: onCreateQuote,
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
