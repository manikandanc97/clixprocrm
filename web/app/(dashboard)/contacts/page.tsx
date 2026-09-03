"use client";

import React, { useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  RotateCcw,
  Download,
  Settings,
  Upload,
  ChevronDown,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
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
  PageErrorState,
} from "@/shared/components/crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import {
  useDeleteLead,
  useDeleteCustomer,
  useBulkDeleteLeads,
} from "@/shared/hooks/use-crm";
import { FormModal } from "@/shared/components/crm/FormModal";
import { FormSkeleton } from "@/shared/components/skeletons";
import { LeadContextualSettings } from "@/features/leads/components/LeadContextualSettings";
import { ContactContextualSettings } from "@/features/contacts/components/ContactContextualSettings";
import { useContactSettings } from "@/features/contacts/hooks/use-contact-settings";
import {
  useContactsUrlState,
  type ContactTypeFilter,
} from "@/features/contacts/hooks/use-contacts-url-state";
import {
  useContactsData,
  type ContactItem,
} from "@/features/contacts/hooks/use-contacts-data";
import { ContactsDataTable } from "@/features/contacts/components/ContactsDataTable";
import { ContactsDeleteDialog } from "@/features/contacts/components/ContactsDeleteDialog";
import type { SortDirection } from "@/shared/components/DataTableColumnHeader";

const BulkImportModal = dynamic(
  () =>
    import("@/features/leads/components/BulkImportModal").then((mod) => ({
      default: mod.BulkImportModal,
    })),
  { ssr: false }
);

const LeadForm = dynamic(
  () => import("@/features/forms/LeadForm").then((mod) => ({ default: mod.LeadForm })),
  { loading: () => <FormSkeleton /> }
);

const CustomerForm = dynamic(
  () =>
    import("@/features/forms/CustomerForm").then((mod) => ({
      default: mod.CustomerForm,
    })),
  { loading: () => <FormSkeleton /> }
);

export default function ContactsPage() {
  const { currency } = useCurrency();
  const { settings: contactSettings } = useContactSettings();
  const { typeFilter, setTypeFilter, customizeParam } = useContactsUrlState();

  // Local Filter & Pagination State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Modals & Drawers State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(() => Boolean(customizeParam));
  const customizeDefaultSection = customizeParam && customizeParam !== "true" ? customizeParam : undefined;
  const [selectedLead, setSelectedLead] = useState<unknown | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<unknown | null>(null);

  // Deletion State
  const [contactToDelete, setContactToDelete] = useState<ContactItem | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Mutations
  const { mutateAsync: deleteLeadMutate } = useDeleteLead();
  const { mutateAsync: deleteCustomerMutate } = useDeleteCustomer();
  const { mutateAsync: bulkDeleteLeadsMutate } = useBulkDeleteLeads();

  // Contacts Data Orchestration
  const {
    combinedContacts,
    paginatedContacts,
    totalPages,
    totalCount,
    isLoading,
    isError,
    error,
    handleRetry,
  } = useContactsData({
    typeFilter,
    statusFilter,
    search,
    sortConfig,
    currentPage,
    rowsPerPage,
  });

  const handleTypeChange = useCallback(
    (newType: ContactTypeFilter) => {
      setTypeFilter(newType);
      setCurrentPage(1);
    },
    [setTypeFilter]
  );

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  }, []);

  const setSort = useCallback((key: string, dir: SortDirection) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  }, []);

  const hasActiveFilters =
    typeFilter !== "ALL" || statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  }, [setTypeFilter]);

  // Row Selection Handlers
  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedContactIds(
          Array.from(new Set([...selectedContactIds, ...paginatedContacts.map((c) => c.id)]))
        );
      } else {
        const pageIds = new Set(paginatedContacts.map((c) => c.id));
        setSelectedContactIds(selectedContactIds.filter((id) => !pageIds.has(id)));
      }
    },
    [selectedContactIds, paginatedContacts]
  );

  const handleToggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedContactIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  }, []);

  // Single Contact Delete
  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    try {
      setIsDeletingContact(true);
      if (contactToDelete.type === "Lead") {
        await deleteLeadMutate(contactToDelete.id);
      } else {
        await deleteCustomerMutate(contactToDelete.id);
      }
      toast.success(`${contactToDelete.type} "${contactToDelete.name}" deleted successfully.`);
      setSelectedContactIds((prev) => prev.filter((id) => id !== contactToDelete.id));
      setContactToDelete(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete contact.";
      toast.error(errorMsg);
    } finally {
      setIsDeletingContact(false);
    }
  };

  // Bulk Delete Contacts
  const handleBulkDelete = async () => {
    if (selectedContactIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      const selectedContacts = combinedContacts.filter((c) =>
        selectedContactIds.includes(c.id)
      );
      const leadIds = selectedContacts.filter((c) => c.type === "Lead").map((c) => c.id);
      const customerIds = selectedContacts.filter((c) => c.type === "Customer").map((c) => c.id);

      const promises: Promise<unknown>[] = [];
      if (leadIds.length > 0) {
        promises.push(bulkDeleteLeadsMutate(leadIds));
      }
      if (customerIds.length > 0) {
        customerIds.forEach((id) => promises.push(deleteCustomerMutate(id)));
      }

      await Promise.all(promises);
      toast.success(`${selectedContactIds.length} contact(s) deleted successfully.`);
      setSelectedContactIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete selected contacts.";
      toast.error(errorMsg);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // CSV Export
  const exportCSV = useCallback(() => {
    if (combinedContacts.length === 0) {
      toast.error("No contacts available to export.");
      return;
    }
    const headers = [
      "ID",
      "Name",
      "Type",
      "Company",
      "Email",
      "Phone",
      "Status",
      "Revenue",
      "Created At",
    ];
    const rows = combinedContacts.map((c) => [
      c.id,
      `"${c.name || ""}"`,
      c.type,
      `"${c.company || ""}"`,
      c.email || "",
      c.phone || "",
      c.status || c.stage || "",
      c.valueAmount || c.revenueValue || 0,
      c.createdAt || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_contacts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Contacts exported successfully.");
  }, [combinedContacts]);

  const handleEditContact = useCallback((contact: ContactItem) => {
    if (contact.type === "Lead") {
      setSelectedLead(contact.raw);
      setIsLeadModalOpen(true);
    } else {
      setSelectedCustomer(contact.raw);
      setIsCustomerModalOpen(true);
    }
  }, []);

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Page Header */}
      <CRMPageHeader
        title="Contacts"
        description="Manage leads and customers in one unified view with AI-powered insights."
        icon={Users}
        secondaryActions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
          },
          {
            label: "Bulk Upload",
            icon: Upload,
            onClick: () => setIsBulkImportModalOpen(true),
          },
        ]}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="text-xs font-semibold h-9 px-3.5 gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Contact</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl p-1.5 shadow-lg border-border"
          >
            <DropdownMenuItem
              onClick={() => {
                setSelectedLead(null);
                setIsLeadModalOpen(true);
              }}
              className="cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Create Lead</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              className="cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2"
            >
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Register Customer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CRMPageHeader>

      {/* 2. Main Data Card with Toolbar & Table */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={handleSearchChange}
          placeholder="Search contacts..."
          selectedCount={selectedContactIds.length}
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
              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={(val) => handleTypeChange(val as ContactTypeFilter)}
              >
                <SelectTrigger
                  aria-label="Filter by contact type"
                  className="h-9 w-[130px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-9 w-[140px] text-xs font-semibold bg-background"
                >
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="won">Won / Converted</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="lost">Lost / Inactive</SelectItem>
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
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Reset Filters</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Export</span>
              </Button>
            </div>
          }
        />

        {/* 4. Table / Error State */}
        {isError ? (
          <PageErrorState
            title="Failed to load contacts"
            message={
              error instanceof Error
                ? error.message
                : "Unable to retrieve contacts. Please check your connection and retry."
            }
            onRetry={handleRetry}
            className="flex-1"
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto flex flex-col">
            <ContactsDataTable
              contacts={paginatedContacts}
              selectedContactIds={selectedContactIds}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleSelect={handleToggleSelect}
              sortConfig={sortConfig}
              onSort={setSort}
              currency={currency}
              contactSettings={contactSettings}
              isLoading={isLoading}
              isError={false}
              onRetry={handleRetry}
              onEditContact={handleEditContact}
              onDeleteContact={setContactToDelete}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              onAddContact={() => setIsLeadModalOpen(true)}
            />
          </div>
        )}

        {/* 5. Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
          itemName="Contacts"
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* 6. Delete Dialogs */}
      <ContactsDeleteDialog
        contactToDelete={contactToDelete}
        onCloseSingle={() => setContactToDelete(null)}
        onConfirmSingle={handleDeleteContact}
        isDeletingSingle={isDeletingContact}
        isBulkOpen={bulkDeleteModalOpen}
        bulkCount={selectedContactIds.length}
        onCloseBulk={() => setBulkDeleteModalOpen(false)}
        onConfirmBulk={handleBulkDelete}
        isDeletingBulk={isBulkDeleting}
      />

      {/* 7. Lead Form Modal */}
      <FormModal
        title={selectedLead ? "Edit Lead" : "Create New Lead"}
        description="Manage your prospect details."
        isOpen={isLeadModalOpen}
        onOpenChange={(open) => {
          setIsLeadModalOpen(open);
          if (!open) setSelectedLead(null);
        }}
        size="lg"
      >
        <LeadForm
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialData={(selectedLead as any) || undefined}
          onSuccess={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
          }}
          onCancel={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
          }}
        />
      </FormModal>

      {/* 8. Customer Form Modal */}
      <FormModal
        title={selectedCustomer ? "Edit Customer" : "Register New Customer"}
        description="Manage your client details."
        isOpen={isCustomerModalOpen}
        onOpenChange={(open) => {
          setIsCustomerModalOpen(open);
          if (!open) setSelectedCustomer(null);
        }}
        size="lg"
      >
        <CustomerForm
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialData={(selectedCustomer as any) || undefined}
          onSuccess={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomer(null);
          }}
          onCancel={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      </FormModal>

      {/* 9. Bulk Import Modal */}
      {isBulkImportModalOpen && (
        <BulkImportModal
          isOpen={isBulkImportModalOpen}
          onOpenChange={setIsBulkImportModalOpen}
          onSuccess={() => {
            setIsBulkImportModalOpen(false);
          }}
        />
      )}

      {/* 10. Settings Drawer */}
      {typeFilter === "lead" ? (
        <LeadContextualSettings
          open={isCustomizeOpen}
          onOpenChange={setIsCustomizeOpen}
          defaultSection={customizeDefaultSection || "sources"}
        />
      ) : (
        <ContactContextualSettings
          open={isCustomizeOpen}
          onOpenChange={setIsCustomizeOpen}
          defaultSection={customizeDefaultSection || "fields"}
        />
      )}
    </CRMPageContainer>
  );
}
