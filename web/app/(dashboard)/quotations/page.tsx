"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Settings,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import { CRMPageContainer } from "@/shared/components/crm";
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
    const duplicateData = {
      ...quote,
      quoteId: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "DRAFT" as const,
    };
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
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="quotations"
              icon={FileText}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Quotations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate and manage sales quotes with real-time tracking and conversion status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCustomizeOpen(true)}
            className="group font-semibold text-xs h-9 px-3 rounded-lg shadow-xs gap-1.5 cursor-pointer border-border/70 bg-background hover:bg-muted/50 text-foreground"
          >
            <AppIcon
              name="settings"
              icon={Settings}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Customize</span>
          </Button>

          <Button
            onClick={() => {
              setQuoteToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="plus"
              icon={Plus}
              size={14}
              className="w-3.5 h-3.5 text-white shrink-0"
            />
            <span>Create Quote</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <AppIcon
                  name="search"
                  icon={Search}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors"
                />
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quotes, clients..."
                className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
            {/* Multi-Select Delete Button */}
            {selectedQuoteIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon
                  name="trash"
                  icon={Trash2}
                  size={14}
                  className="w-3.5 h-3.5 text-rose-500 shrink-0"
                />
                <span>Delete ({selectedQuoteIds.length})</span>
              </button>
            )}

            {/* Clear Filters Button */}
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

            {/* Export Button */}
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
          </div>
        </div>

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

        {/* Bottom Pagination */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredQuotations.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredQuotations.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredQuotations.length}</span> Quotes
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="h-8 px-2 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
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

      <QuotationPreview
        quotation={selectedQuote}
        isOpen={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
      />

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
