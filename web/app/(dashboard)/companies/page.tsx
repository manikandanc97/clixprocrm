"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Settings,
  RotateCcw,
  Download,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
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
  useDeleteCompany,
  useBulkDeleteCompanies,
} from "@/shared/hooks/use-crm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { FormSkeleton } from "@/shared/components/skeletons";
import { CompanyContextualSettings } from "@/features/companies/components/CompanyContextualSettings";
import { useCompaniesUrlState } from "@/features/companies/hooks/use-companies-url-state";
import {
  useCompaniesData,
  type CompanyItem,
} from "@/features/companies/hooks/use-companies-data";
import { CompaniesDataTable } from "@/features/companies/components/CompaniesDataTable";
import { CompaniesDeleteDialog } from "@/features/companies/components/CompaniesDeleteDialog";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";

const CompanyForm = dynamic(
  () => import("@/features/forms/CompanyForm").then((mod) => ({ default: mod.CompanyForm })),
  { loading: () => <FormSkeleton /> }
);

export default function CompaniesPage() {
  const {
    isCustomizeOpen: initialCustomizeOpen,
    customizeDefaultSection,
    newParam,
    clearNewParam,
  } = useCompaniesUrlState();

  // Local Filter & Pagination State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Modals & Drawers State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(initialCustomizeOpen);

  // Delete State
  const [companyToDelete, setCompanyToDelete] = useState<CompanyItem | null>(null);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Mutations
  const { mutateAsync: deleteCompanyMutate } = useDeleteCompany();
  const { mutateAsync: bulkDeleteCompaniesMutate } = useBulkDeleteCompanies();

  // Data fetching and derived state
  const {
    paginatedCompanies,
    uniqueIndustries,
    totalItems,
    totalPages,
    isLoading,
    isError,
    error,
    refetch,
    exportCSV,
  } = useCompaniesData({
    statusFilter,
    industryFilter,
    search,
    sortConfig,
    currentPage,
    rowsPerPage,
  });

  // Handle deep-link ?new=true to open creation modal
  useEffect(() => {
    if (newParam === "true") {
      setSelectedCompany(null);
      setIsAddModalOpen(true);
      clearNewParam();
    }
  }, [newParam, clearNewParam]);

  // Sync customize URL parameter if opened via query parameter
  useEffect(() => {
    if (initialCustomizeOpen) {
      setIsCustomizeOpen(true);
    }
  }, [initialCustomizeOpen]);

  // Reset pagination on filter or search changes
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  }, []);

  const handleIndustryChange = useCallback((val: string) => {
    setIndustryFilter(val);
    setCurrentPage(1);
  }, []);

  const handleRowsPerPageChange = useCallback((size: number) => {
    setRowsPerPage(size);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((key: string, direction: SortDirection) => {
    if (direction === null) {
      setSortConfig(null);
    } else {
      setSortConfig({ key, direction });
    }
  }, []);

  const hasActiveFilters =
    statusFilter !== "ALL" || industryFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setStatusFilter("ALL");
    setIndustryFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  }, []);

  // Selection handlers (select-all operates on current visible page)
  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedCompanyIds((prev) =>
          Array.from(new Set([...prev, ...paginatedCompanies.map((c) => c.id)]))
        );
      } else {
        const pageIds = new Set(paginatedCompanies.map((c) => c.id));
        setSelectedCompanyIds((prev) => prev.filter((id) => !pageIds.has(id)));
      }
    },
    [paginatedCompanies]
  );

  const handleToggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedCompanyIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  }, []);

  // Single Company Delete
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      setIsDeletingCompany(true);
      await deleteCompanyMutate(companyToDelete.id);
      toast.success(`Company "${companyToDelete.name}" deleted successfully.`);
      setSelectedCompanyIds((prev) => prev.filter((id) => id !== companyToDelete.id));
      setCompanyToDelete(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete company.";
      toast.error(errorMsg);
    } finally {
      setIsDeletingCompany(false);
    }
  };

  // Bulk Delete Companies
  const handleBulkDelete = async () => {
    if (selectedCompanyIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      await bulkDeleteCompaniesMutate(selectedCompanyIds);
      toast.success(`${selectedCompanyIds.length} company account(s) deleted successfully.`);
      setSelectedCompanyIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete selected companies.";
      toast.error(errorMsg);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <CRMPageHeader
        title="Companies"
        description="Manage B2B accounts, track pipeline value, and view customer health at the company level."
        icon={Building2}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
          },
        ]}
        primaryAction={{
          label: "Create Company",
          icon: Plus,
          onClick: () => {
            setSelectedCompany(null);
            setIsAddModalOpen(true);
          },
        }}
      />

      {/* 2. Main Data Card with Toolbar & Table */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={handleSearchChange}
          placeholder="Search companies..."
          selectedCount={selectedCompanyIds.length}
          bulkActions={
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="h-7 text-xs font-semibold px-2.5 gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete Selected</span>
            </Button>
          }
          filters={
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-9 w-[130px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                </SelectContent>
              </Select>

              {/* Industry Filter */}
              <Select value={industryFilter} onValueChange={handleIndustryChange}>
                <SelectTrigger
                  aria-label="Filter by industry"
                  className="h-9 w-[150px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Industries</SelectItem>
                  {uniqueIndustries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          actions={
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Reset</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Export</span>
              </Button>
            </div>
          }
        />

        {/* Declarative CRM Data Table */}
        <CompaniesDataTable
          companies={paginatedCompanies}
          selectedCompanyIds={selectedCompanyIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelect={handleToggleSelect}
          sortConfig={sortConfig}
          onSort={handleSort}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          onEditCompany={(company) => {
            setSelectedCompany(company);
            setIsAddModalOpen(true);
          }}
          onDeleteCompany={(company) => setCompanyToDelete(company)}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          onAddCompany={() => {
            setSelectedCompany(null);
            setIsAddModalOpen(true);
          }}
        />

        {/* Canonical CRM Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          itemName="Companies"
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* 4. Delete Confirmation Dialogs */}
      <CompaniesDeleteDialog
        companyToDelete={companyToDelete}
        onCloseSingle={() => setCompanyToDelete(null)}
        onConfirmSingle={handleDeleteCompany}
        isDeletingSingle={isDeletingCompany}
        isBulkOpen={bulkDeleteModalOpen}
        bulkCount={selectedCompanyIds.length}
        onCloseBulk={() => setBulkDeleteModalOpen(false)}
        onConfirmBulk={handleBulkDelete}
        isDeletingBulk={isBulkDeleting}
      />

      {/* 5. Company Form Modal (Create & Edit) */}
      <FormModal
        title={selectedCompany ? "Edit Company" : "Create New Company"}
        description={
          selectedCompany
            ? "Update company details."
            : "Add a new company account to your CRM database."
        }
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setSelectedCompany(null);
        }}
        size="lg"
      >
        <CompanyForm
          initialData={selectedCompany || undefined}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setSelectedCompany(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddModalOpen(false);
            setSelectedCompany(null);
          }}
        />
      </FormModal>

      {/* 6. Contextual Settings Drawer */}
      <CompanyContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "industries"}
      />
    </CRMPageContainer>
  );
}
