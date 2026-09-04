"use client";

import { useState } from "react";
import {
  Receipt,
  Plus,
  Download,
  Trash2,
  AlertTriangle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMToolbar,
  CRMPagination,
} from "@/shared/components/crm";
import { useDeleteInvoice } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { CreateInvoiceModal } from "@/features/invoices/components/CreateInvoiceModal";
import { InvoiceDetailModal } from "@/features/invoices/components/InvoiceDetailModal";
import { RecordPaymentModal } from "@/features/invoices/components/RecordPaymentModal";
import { InvoiceContextualSettings } from "@/features/invoices/components/InvoiceContextualSettings";
import { InvoicesDataTable } from "@/features/invoices/components/InvoicesDataTable";
import { useInvoicesUrlState } from "@/features/invoices/hooks/use-invoices-url-state";
import { useInvoicesData } from "@/features/invoices/hooks/use-invoices-data";

export default function InvoicesPage() {
  const { formatCurrency } = useCurrency();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Delete modal state
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
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

  const handleOpenPayment = (inv: any) => {
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
          pageSizeOptions={[10, 25, 50, 100]}
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
      <AlertDialog open={Boolean(invoiceToDelete)} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete Invoice?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice{" "}
              <strong className="text-foreground">{invoiceToDelete?.invoiceNumber}</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteSingle}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete {selectedInvoiceIds.length} Selected Invoices?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all selected invoices. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "numbering"}
      />
    </CRMPageContainer>
  );
}
