"use client";

import { useMemo } from "react";
import {
  FileText,
  Building2,
  Calendar,
  Eye,
  Edit,
  Download,
  Copy,
  Trash2,
  Check,
  Send,
} from "lucide-react";
import { CRMDataTable, CRMDataTableColumn } from "@/shared/components/crm/CRMDataTable";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { CRMActionMenu } from "@/shared/components/crm/CRMActionMenu";
import { Checkbox } from "@/shared/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { QuotationType } from "@/shared/types/quotation";
import { QuotationSortConfig } from "@/features/quotations/hooks/use-quotations-data";
import { getQuotationStatusVariant } from "@/features/quotations/utils/quotation-status";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";

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

// ─── Component ─────────────────────────────────────────────────────────────
export function QuotationsDataTable({
  paginatedQuotations,
  isInitialLoading,
  selectedQuoteIds,
  setSelectedQuoteIds,
  sortConfig,
  setSort,
  formatCurrency,
  onViewQuote,
  onEditQuote,
  onDeleteQuote,
  onDuplicateQuote,
  onUpdateStatus,
}: QuotationsDataTableProps) {
  // Master-checkbox: current page selection state
  const allPageSelected =
    paginatedQuotations.length > 0 &&
    paginatedQuotations.every((q) => selectedQuoteIds.includes(q.id));

  const somePageSelected =
    !allPageSelected &&
    paginatedQuotations.some((q) => selectedQuoteIds.includes(q.id));

  // Stable sort direction per key for DataTableColumnHeader
  const sortDirection = useMemo(
    () => (key: string) =>
      sortConfig?.key === key ? (sortConfig.direction as SortDirection) : null,
    [sortConfig]
  );

  const columns = useMemo<CRMDataTableColumn<QuotationType>[]>(() => {
    return [
      // 1. Master Checkbox
      {
        header: (
          <div className="flex items-center justify-center">
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
          </div>
        ),
        cell: (quote) => {
          const isSelected = selectedQuoteIds.includes(quote.id);
          return (
            <div
              className="flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
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
            </div>
          );
        },
        className: "w-12 px-4 py-3.5 text-center",
        headerClassName: "w-12 px-4 py-3.5 text-center",
        align: "center",
      },

      // 2. Quote # & Icon
      {
        header: "Quote #",
        sortable: true,
        sortDirection: sortDirection("quoteId"),
        onSort: (dir) => setSort("quoteId", dir),
        cell: (quote) => {
          const color = getOrgAvatarColor(quote.client || quote.quoteId);
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
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewQuote(quote);
                  }}
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate font-mono block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs"
                >
                  {quote.quoteId}
                </button>
                <p className="text-[11px] text-muted-foreground truncate">
                  {quote.lastActivity || "Created Recently"}
                </p>
              </div>
            </div>
          );
        },
        className: "px-4 py-3.5 font-medium overflow-hidden",
      },

      // 3. Customer
      {
        header: "Customer",
        sortable: true,
        sortDirection: sortDirection("client"),
        onSort: (dir) => setSort("client", dir),
        cell: (quote) => (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
              {quote.client ? quote.client.charAt(0) : "C"}
            </div>
            <span className="text-xs font-semibold text-foreground truncate">
              {quote.client || "Untitled Client"}
            </span>
          </div>
        ),
        className: "px-4 py-3.5",
      },

      // 4. Related Deal
      {
        header: "Related Deal",
        cell: (quote) =>
          quote.leadName ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-muted/40 text-muted-foreground max-w-[160px] truncate">
              <Building2 className="h-3 w-3 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                {quote.leadName}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          ),
        className: "px-4 py-3.5",
      },

      // 5. Quote Value
      {
        header: "Quote Value",
        sortable: true,
        sortDirection: sortDirection("amount"),
        onSort: (dir) => setSort("amount", dir),
        cell: (quote) => (
          <span className="font-bold text-foreground text-xs font-mono">
            {formatCurrency(quote.amountValue ?? 0)}
          </span>
        ),
        className: "px-4 py-3.5",
      },

      // 6. Valid Until
      {
        header: "Valid Until",
        sortable: true,
        sortDirection: sortDirection("validTill"),
        onSort: (dir) => setSort("validTill", dir),
        cell: (quote) => (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span>{quote.validTill || "—"}</span>
          </div>
        ),
        className: "px-4 py-3.5",
      },

      // 7. Status
      {
        header: "Status",
        sortable: true,
        sortDirection: sortDirection("status"),
        onSort: (dir) => setSort("status", dir),
        cell: (quote) => (
          <StatusBadge
            status={quote.status || "DRAFT"}
            variant={getQuotationStatusVariant(quote.status)}
          />
        ),
        className: "px-4 py-3.5",
      },

      // 8. Actions
      {
        header: <span className="sr-only">Actions</span>,
        align: "right",
        cell: (quote) => (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end">
            <CRMActionMenu
              triggerOrientation="vertical"
              items={[
                {
                  label: "View Details",
                  icon: Eye,
                  onClick: () => onViewQuote(quote),
                },
                {
                  label: "Edit Quote",
                  icon: Edit,
                  onClick: () => onEditQuote(quote),
                },
                {
                  label: "Download PDF",
                  icon: Download,
                  onClick: () => window.open(`/quotations/${quote.id}/pdf`, "_blank"),
                },
                {
                  label: "Duplicate Quote",
                  icon: Copy,
                  onClick: () => onDuplicateQuote(quote),
                },
                ...(quote.status !== "ACCEPTED"
                  ? [
                      {
                        label: "Mark Accepted",
                        icon: Check,
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
                        icon: Send,
                        separatorBefore: quote.status === "ACCEPTED",
                        className: "text-blue-600 dark:text-blue-400 font-medium",
                        onClick: () => onUpdateStatus(quote.id, "SENT"),
                      },
                    ]
                  : []),
                {
                  label: "Delete Quote",
                  icon: Trash2,
                  variant: "destructive" as const,
                  separatorBefore: true,
                  onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDeleteQuote(quote);
                  },
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
    allPageSelected,
    somePageSelected,
    paginatedQuotations,
    selectedQuoteIds,
    setSelectedQuoteIds,
    sortDirection,
    setSort,
    formatCurrency,
    onViewQuote,
    onEditQuote,
    onDuplicateQuote,
    onUpdateStatus,
    onDeleteQuote,
  ]);

  return (
    <CRMDataTable
      data={paginatedQuotations}
      columns={columns}
      isLoading={isInitialLoading}
      onRowClick={(quote) => onViewQuote(quote)}
      hasPagination={false}
      rowClassName={(quote) =>
        cn(
          "group h-16 hover:bg-muted/30 transition-colors",
          selectedQuoteIds.includes(quote.id) && "bg-primary/[0.03]"
        )
      }
      emptyIcon={FileText}
      emptyTitle="No quotations found"
      emptyDescription="No quotations match your current search or filter criteria."
    />
  );
}
