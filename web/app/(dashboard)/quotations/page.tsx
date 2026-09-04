"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Download,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Settings,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMToolbar,
  CRMPagination,
} from "@/shared/components/crm";
import {
  useDeleteQuotation,
  useUpdateQuotationStatus,
  useCreateQuotation,
} from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { FormModal } from "@/shared/components/crm/FormModal";
import { QuoteFormSkeleton } from "@/shared/components/skeletons";
import { QuotationContextualSettings } from "@/features/quotations/components/QuotationContextualSettings";
import { QuotationType } from "@/shared/types/quotation";
import { buildQuotationDuplicatePayload } from "@/features/quotations/utils/quotation-duplicate";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useQuotationsData } from "@/features/quotations/hooks/use-quotations-data";
import { useQuotationsUrlState } from "@/features/quotations/hooks/use-quotations-url-state";
import { toast } from "sonner";
import { QuotationsDataTable } from "@/features/quotations/components/QuotationsDataTable";

const QuoteForm = dynamic(
  () => import("@/features/forms/QuoteForm").then((mod) => ({ default: mod.QuoteForm })),
  {
    loading: () => <QuoteFormSkeleton />,
  }
);

const QuotationPreview = dynamic(
  () => import("@/features/quotations/components/QuotationPreview"),
  { ssr: false }
);

export default function QuotationsPage() {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { formatCurrency } = useCurrency();

  // ─── Data hook ────────────────────────────────────────────────────────────
  const {
    safeQuotations,
    isLoading: loading,
    isPending,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedQuoteIds,
    setSelectedQuoteIds,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    filteredQuotations,
    paginatedQuotations,
    totalPages,
    hasActiveFilters,
    handleClearFilters,
    exportCSV,
  } = useQuotationsData();

  // ─── Mutations ────────────────────────────────────────────────────────────
  const { mutateAsync: deleteQuotationMutate } = useDeleteQuotation();
  const { mutate: updateStatusMutate } = useUpdateQuotationStatus();
  const { mutate: createQuotationMutate } = useCreateQuotation();

  // ─── Modal / panel state ──────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuotationType | null>(null);
  const [quoteToEdit, setQuoteToEdit] = useState<QuotationType | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();

  // ─── Delete state ─────────────────────────────────────────────────────────
  const [quoteToDelete, setQuoteToDelete] = useState<QuotationType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // ─── URL state sync ────────────────────────────────────────────────────────
  useQuotationsUrlState({
    safeQuotations,
    setIsCustomizeOpen,
    setCustomizeDefaultSection,
    setIsAddModalOpen,
    setQuoteToEdit,
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const handleDuplicate = (quote: QuotationType) => {
    const duplicateData = buildQuotationDuplicatePayload(quote);
    createQuotationMutate(duplicateData);
  };

  const handleDeleteSingle = async () => {
    if (!quoteToDelete) return;
    try {
      setDeleting(true);
      await deleteQuotationMutate(quoteToDelete.id);
      setSelectedQuoteIds((prev) => prev.filter((id) => id !== quoteToDelete.id));
      setQuoteToDelete(null);
      refetch();
    } catch {
      // Error handled by mutation toast
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuoteIds.length === 0) return;
    try {
      setBulkDeleting(true);
      for (const id of selectedQuoteIds) {
        await deleteQuotationMutate(id);
      }
      setSelectedQuoteIds([]);
      setBulkDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error("An error occurred during bulk deletion");
    } finally {
      setBulkDeleting(false);
    }
  };

  const isInitialLoading =
    safeQuotations.length === 0 && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Canonical Page Header */}
      <CRMPageHeader
        title="Quotations"
        description="Generate and manage sales quotes with real-time tracking and conversion status."
        icon={FileText}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Create Quote",
          icon: Plus,
          onClick: () => {
            setQuoteToEdit(null);
            setIsAddModalOpen(true);
          },
        }}
      />

      {/* 2. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Canonical Toolbar */}
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search quotes, clients..."
          selectedCount={selectedQuoteIds.length}
          filters={
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
            >
              <SelectTrigger
                aria-label="Status filter"
                className="h-9 w-[130px] px-3 rounded-lg bg-background border-border/70 text-xs font-semibold text-foreground shadow-xs focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer">All Status</SelectItem>
                <SelectItem value="DRAFT" className="text-xs font-medium cursor-pointer">Draft</SelectItem>
                <SelectItem value="SENT" className="text-xs font-medium cursor-pointer">Sent</SelectItem>
                <SelectItem value="ACCEPTED" className="text-xs font-medium cursor-pointer">Accepted</SelectItem>
                <SelectItem value="REJECTED" className="text-xs font-medium cursor-pointer">Rejected</SelectItem>
                <SelectItem value="EXPIRED" className="text-xs font-medium cursor-pointer">Expired</SelectItem>
              </SelectContent>
            </Select>
          }
          bulkActions={
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <AppIcon
                name="trash"
                icon={Trash2}
                size={14}
                className="w-3.5 h-3.5 text-rose-500 shrink-0"
              />
              <span>Delete ({selectedQuoteIds.length})</span>
            </button>
          }
          actions={
            <>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                >
                  <AppIcon
                    name="reset"
                    icon={RotateCcw}
                    size={14}
                    className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                  />
                  <span>Reset Filters</span>
                </button>
              )}
              <button
                onClick={exportCSV}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <AppIcon
                  name="export"
                  icon={Download}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                />
                <span>Export</span>
              </button>
            </>
          }
        />

        {/* Table Content — QuotationsDataTable (canonical CRM table system) */}
        <QuotationsDataTable
          paginatedQuotations={paginatedQuotations}
          isInitialLoading={isInitialLoading}
          selectedQuoteIds={selectedQuoteIds}
          setSelectedQuoteIds={setSelectedQuoteIds}
          sortConfig={sortConfig}
          setSort={setSort}
          hasActiveFilters={hasActiveFilters}
          handleClearFilters={handleClearFilters}
          formatCurrency={formatCurrency}
          onViewQuote={(q) => setSelectedQuote(q)}
          onEditQuote={(q) => {
            setQuoteToEdit(q);
            setIsAddModalOpen(true);
          }}
          onDeleteQuote={(q) => setQuoteToDelete(q)}
          onDuplicateQuote={handleDuplicate}
          onUpdateStatus={(id, status) =>
            updateStatusMutate({ id, status: status as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" })
          }
          onCreateQuote={() => {
            setQuoteToEdit(null);
            setIsAddModalOpen(true);
          }}
        />

        {/* Canonical Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredQuotations.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          itemName="Quotes"
          pageSizeOptions={[10, 25, 50, 100]}
          alwaysShow
        />
      </div>

      {/* Modals */}
      <FormModal
        title={quoteToEdit ? "Edit Sales Quotation" : "Create Sales Quotation"}
        description={
          quoteToEdit
            ? "Update the details of your existing quotation."
            : "Generate a professional quote for your client."
        }
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        size="lg"
      >
        <QuoteForm
          initialData={quoteToEdit || undefined}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setQuoteToEdit(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddModalOpen(false);
            setQuoteToEdit(null);
          }}
        />
      </FormModal>

      {selectedQuote && (
        <QuotationPreview
          quotation={selectedQuote}
          isOpen
          onClose={() => setSelectedQuote(null)}
        />
      )}

      {/* Single Delete Dialog */}
      <AlertDialog open={Boolean(quoteToDelete)} onOpenChange={(open) => !open && setQuoteToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Quotation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete quotation{" "}
              <strong className="text-foreground">{quoteToDelete?.quoteId}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {deleting ? "Deleting..." : "Delete Quotation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete {selectedQuoteIds.length} Selected Quotations?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all selected quotations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuotationContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "templates"}
      />
    </CRMPageContainer>
  );
}
