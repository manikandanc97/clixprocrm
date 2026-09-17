"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Receipt,
  Plus,
  Download,
  Trash2,
  RotateCcw,
  Settings,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import type { InvoiceType } from "@/shared/types/invoice";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMToolbar,
  CRMPagination,
  CRMDeleteDialog,
} from "@/shared/components/crm";
import { PageErrorState } from "@/shared/components/crm/PageFeedbackStates";
import { useDeleteInvoice } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { InvoicesDataTable } from "@/features/invoices/components/InvoicesDataTable";
import { useInvoicesUrlState } from "@/features/invoices/hooks/use-invoices-url-state";
import { useInvoicesData } from "@/features/invoices/hooks/use-invoices-data";

const CreateInvoiceModal = dynamic(
  () => import("@/features/invoices/components/CreateInvoiceModal").then((mod) => mod.CreateInvoiceModal),
  { ssr: false }
);

const InvoiceDetailModal = dynamic(
  () => import("@/features/invoices/components/InvoiceDetailModal").then((mod) => mod.InvoiceDetailModal),
  { ssr: false }
);

const RecordPaymentModal = dynamic(
  () => import("@/features/invoices/components/RecordPaymentModal").then((mod) => mod.RecordPaymentModal),
  { ssr: false }
);

const InvoiceContextualSettings = dynamic(
  () => import("@/features/invoices/components/InvoiceContextualSettings").then((mod) => mod.InvoiceContextualSettings),
  { ssr: false }
);

export default function InvoicesPage() {
  const { formatCurrency } = useCurrency();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<InvoiceType | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Delete modal state
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // URL state hook
  const {
    isCustomizeOpen,
    setIsCustomizeOpen,
    customizeDefaultSection,
  } = useInvoicesUrlState({
    setIsCreateModalOpen,
  });

  // Data & list derivation hook
  const {
    refetch,
    isInitialLoading,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    handleClearFilters,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    isAllCurrentPageSelected,
    toggleSelectAllCurrentPage,
    toggleSelectInvoice,
    filteredInvoices,
    paginatedInvoices,
    exportCSV,
    getInvoiceColor,
  } = useInvoicesData();

  const { mutateAsync: deleteInvoiceMutate } = useDeleteInvoice();

  const handleOpenDetail = (id: string) => {
    setSelectedInvoiceId(id);
    setIsDetailModalOpen(true);
  };

  const handleOpenPayment = (inv: InvoiceType) => {
    setPaymentTargetInvoice(inv);
    setIsPaymentModalOpen(true);
  };

  const handlePrintPdf = (id: string) => {
    window.open(`/api/crm/invoices/${id}/pdf`, "_blank");
  };

  const handleDeleteSingle = async () => {
    if (!invoiceToDelete) return;
    try {
      setDeleting(true);
      await deleteInvoiceMutate(invoiceToDelete.id);
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceToDelete.id));
      setInvoiceToDelete(null);
      refetch();
    } catch {
      // Handled by mutation toast
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      setBulkDeleting(true);
      for (const id of selectedInvoiceIds) {
        await deleteInvoiceMutate(id);
      }
      setSelectedInvoiceIds([]);
      setBulkDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error("An error occurred during bulk deletion");
    } finally {
      setBulkDeleting(false);
    }
  };

  if (isError) {
    return (
      <CRMPageContainer twoStageScroll>
        <PageErrorState
          title="Failed to load invoices"
          description="An error occurred while loading your invoices list. Please check your connection and try again."
          onRetry={() => { refetch(); }}
        />
      </CRMPageContainer>
    );
  }

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Page Header */}
      <CRMPageHeader
        title="Invoices"
        description="Manage billing, tax breakdowns, track payments, and download PDF receipts."
        icon={Receipt}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Create Invoice",
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true),
        }}
      />

      {/* 2. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Canonical Toolbar */}
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search invoices by number, client..."
          selectedCount={selectedInvoiceIds.length}
          filters={
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="h-9 w-[140px] px-3 rounded-lg bg-background border-border/70 text-xs font-semibold text-foreground shadow-xs focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-medium cursor-pointer">
                  All Status
                </SelectItem>
                <SelectItem value="DRAFT" className="text-xs font-medium cursor-pointer">
                  Draft
                </SelectItem>
                <SelectItem value="SENT" className="text-xs font-medium cursor-pointer">
                  Sent
                </SelectItem>
                <SelectItem value="PARTIALLY_PAID" className="text-xs font-medium cursor-pointer">
                  Partially Paid
                </SelectItem>
                <SelectItem value="PAID" className="text-xs font-medium cursor-pointer">
                  Paid
                </SelectItem>
                <SelectItem value="OVERDUE" className="text-xs font-medium cursor-pointer">
                  Overdue
                </SelectItem>
                <SelectItem value="CANCELLED" className="text-xs font-medium cursor-pointer">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          }
          bulkActions={
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="h-8 text-xs font-semibold px-2.5 gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete ({selectedInvoiceIds.length})</span>
            </Button>
          }
          actions={
            <>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 gap-1.5 text-xs font-semibold cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Reset Filters</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Export</span>
              </Button>
            </>
          }
        />

        {/* Table Content */}
        <InvoicesDataTable
          paginatedInvoices={paginatedInvoices}
          isInitialLoading={isInitialLoading}
          selectedInvoiceIds={selectedInvoiceIds}
          setSelectedInvoiceIds={setSelectedInvoiceIds}
          isAllCurrentPageSelected={isAllCurrentPageSelected}
          toggleSelectAllCurrentPage={toggleSelectAllCurrentPage}
          toggleSelectInvoice={toggleSelectInvoice}
          sortConfig={sortConfig}
          setSort={setSort}
          hasActiveFilters={hasActiveFilters}
          handleClearFilters={handleClearFilters}
          formatCurrency={formatCurrency}
          getInvoiceColor={getInvoiceColor}
          onOpenDetail={handleOpenDetail}
          onOpenPayment={handleOpenPayment}
          onPrintPdf={handlePrintPdf}
          onDeleteInvoice={(inv) => setInvoiceToDelete(inv)}
          onCreateInvoice={() => setIsCreateModalOpen(true)}
        />

        {/* Bottom Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
          itemName="Invoices"
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />

      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInvoiceId(null);
          refetch();
        }}
      />

      {paymentTargetInvoice && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentTargetInvoice(null);
            refetch();
          }}
          invoice={paymentTargetInvoice}
        />
      )}

      {/* Single Delete Dialog */}
      <CRMDeleteDialog
        mode="single"
        isOpen={Boolean(invoiceToDelete)}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
        title="Delete Invoice?"
        itemName="Invoice"
        description={
          <>
            Are you sure you want to delete invoice{" "}
            <strong className="text-foreground">{invoiceToDelete?.invoiceNumber}</strong>? This action cannot
            be undone.
          </>
        }
        confirmLabel="Delete Invoice"
        onConfirm={handleDeleteSingle}
        isDeleting={deleting}
      />

      {/* Bulk Delete Dialog */}
      <CRMDeleteDialog
        mode="bulk"
        isOpen={bulkDeleteModalOpen}
        onOpenChange={setBulkDeleteModalOpen}
        title={`Delete ${selectedInvoiceIds.length} Selected Invoices?`}
        itemName="Invoice"
        selectedCount={selectedInvoiceIds.length}
        description="This will permanently delete all selected invoices. This action cannot be undone."
        confirmLabel="Delete Selected"
        onConfirm={handleBulkDelete}
        isDeleting={bulkDeleting}
      />

      <InvoiceContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "numbering"}
      />
    </CRMPageContainer>
  );
}
