"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  X,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Settings,
  Upload,
  Mail,
  Phone,
  Edit,
  ChevronDown,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { CRMPageContainer } from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { formatCurrency } from "@/lib/crm-formatters";
import { useCurrency } from "@/shared/hooks/use-currency";
import {
  useLeads,
  useCustomers,
  useDeleteLead,
  useDeleteCustomer,
  useBulkDeleteLeads,
} from "@/shared/hooks/use-crm";
import { FormModal } from "@/shared/components/form-modal";
import { FormSkeleton } from "@/shared/components/skeletons";
import { LeadContextualSettings } from "@/features/leads/components/LeadContextualSettings";
import { ContactContextualSettings } from "@/features/contacts/components/ContactContextualSettings";
import { BulkImportModal } from "@/features/leads/components/BulkImportModal";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useContactSettings } from "@/features/contacts/hooks/use-contact-settings";

const LeadForm = dynamic(
  () => import("@/features/forms/LeadForm").then((mod) => ({ default: mod.LeadForm })),
  {
    loading: () => <FormSkeleton />,
  }
);
const CustomerForm = dynamic(
  () => import("@/features/forms/CustomerForm").then((mod) => ({ default: mod.CustomerForm })),
  {
    loading: () => <FormSkeleton />,
  }
);

export default function ContactsPage() {
  const searchParams = useSearchParams();
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { currency } = useCurrency();
  const { settings: contactSettings } = useContactSettings();

  // URL State Sync
  const initialType = searchParams.get("type") || searchParams.get("status") || "ALL";
  const [typeFilter, setTypeFilter] = useState(
    initialType === "lead" ? "lead" : initialType === "customer" ? "customer" : initialType === "inactive" ? "inactive" : "ALL"
  );
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  const {
    data: leadsData,
    isLoading: leadsLoading,
    isPending: leadsPending,
    refetch: refetchLeads,
  } = useLeads();
  const {
    data: customersData,
    isLoading: customersLoading,
    isPending: customersPending,
    refetch: refetchCustomers,
  } = useCustomers();

  const { mutateAsync: deleteLeadMutate } = useDeleteLead();
  const { mutateAsync: deleteCustomerMutate } = useDeleteCustomer();
  const { mutateAsync: bulkDeleteLeadsMutate } = useBulkDeleteLeads();

  const safeLeads = useMemo(
    () => (Array.isArray(leadsData?.leads) ? leadsData.leads : []),
    [leadsData]
  );
  const safeCustomers = useMemo(
    () => (Array.isArray(customersData?.customers) ? customersData.customers : []),
    [customersData]
  );

  // Combined Data Mapping
  const combinedContacts = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedLeads = safeLeads.map((lead: any) => ({
      ...lead,
      type: "Lead" as const,
      raw: lead,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedCustomers = safeCustomers.map((customer: any) => ({
      ...customer,
      type: "Customer" as const,
      raw: customer,
    }));
    return [...mappedLeads, ...mappedCustomers].sort(
      (a, b) =>
        new Date(b.createdAt || b.lastContact || 0).getTime() -
        new Date(a.createdAt || a.lastContact || 0).getTime()
    );
  }, [safeLeads, safeCustomers]);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedLead, setSelectedLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Delete modal state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Sync customize query param
  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter]);

  const getContactColor = (name: string) => {
    return getOrgAvatarColor(name);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return { date: "—", time: "" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: "" };
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    try {
      setDeleting(true);
      if (contactToDelete.type === "Lead") {
        await deleteLeadMutate(contactToDelete.id);
      } else {
        await deleteCustomerMutate(contactToDelete.id);
      }
      toast.success(`${contactToDelete.type} "${contactToDelete.name}" deleted successfully.`);
      setSelectedContactIds((prev) => prev.filter((id) => id !== contactToDelete.id));
      setContactToDelete(null);
      refetchLeads();
      refetchCustomers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete contact.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContactIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const selectedContacts = combinedContacts.filter((c) => selectedContactIds.includes(c.id));
      const leadIds = selectedContacts.filter((c) => c.type === "Lead").map((c) => c.id);
      const customerIds = selectedContacts.filter((c) => c.type === "Customer").map((c) => c.id);

      const promises: Promise<any>[] = [];
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
      refetchLeads();
      refetchCustomers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete selected contacts.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const hasActiveFilters =
    typeFilter !== "ALL" || statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (combinedContacts.length === 0) {
      toast.error("No contacts available to export.");
      return;
    }
    const headers = ["ID", "Name", "Type", "Company", "Email", "Phone", "Status", "Revenue", "Created At"];
    const rows = combinedContacts.map((c: any) => [
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
    link.setAttribute("download", `clixpro_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Contacts exported successfully.");
  };

  const filteredContacts = useMemo(() => {
    const filtered = combinedContacts.filter((contact: any) => {
      if (typeFilter === "lead" && contact.type !== "Lead") return false;
      if (typeFilter === "customer" && contact.type !== "Customer") return false;
      if (typeFilter === "inactive") {
        const isInactive =
          (contact.type === "Customer" && contact.status === "INACTIVE") ||
          (contact.type === "Lead" && contact.stage === "LOST");
        if (!isInactive) return false;
      }

      if (statusFilter !== "ALL") {
        const curStatus = (contact.status || contact.stage || "").toLowerCase();
        if (!curStatus.includes(statusFilter.toLowerCase())) return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (contact.name && contact.name.toLowerCase().includes(q)) ||
        (contact.company && contact.company.toLowerCase().includes(q)) ||
        (contact.email && contact.email.toLowerCase().includes(q)) ||
        (contact.phone && contact.phone.toLowerCase().includes(q))
      );
    });

    if (!sortConfig) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "revenue") {
        aVal = a.valueAmount ?? a.revenueValue ?? 0;
        bVal = b.valueAmount ?? b.revenueValue ?? 0;
      } else if (sortConfig.key === "date") {
        aVal = new Date(a.createdAt || a.lastContact || 0).getTime();
        bVal = new Date(b.createdAt || b.lastContact || 0).getTime();
      } else {
        aVal = aVal ?? "";
        bVal = bVal ?? "";
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [combinedContacts, search, typeFilter, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / rowsPerPage));
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isLoading =
    (!leadsData || !customersData) &&
    (leadsLoading || customersLoading || leadsPending || customersPending || !isHydrated || !isAuthenticated || isInitializing);

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
              name="contacts"
              icon={Users}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Contacts
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage leads and customers in one unified view with AI-powered insights.
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
            variant="outline"
            onClick={() => setIsBulkImportModalOpen(true)}
            className="group font-semibold text-xs h-9 px-3 rounded-lg shadow-xs gap-1.5 cursor-pointer border-border/70 bg-background hover:bg-muted/50 text-foreground"
          >
            <AppIcon
              name="upload"
              icon={Upload}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Bulk Upload</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors">
                <AppIcon
                  name="plus"
                  icon={UserPlus}
                  size={14}
                  className="w-3.5 h-3.5 text-white shrink-0"
                />
                <span>Add Contact</span>
                <ChevronDown className="w-3 h-3 text-white/80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
            >
              <DropdownMenuItem
                onClick={() => {
                  setSelectedLead(null);
                  setIsLeadModalOpen(true);
                }}
                className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
              >
                <AppIcon
                  name="leads"
                  icon={UserPlus}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                />
                <span>Create Lead</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCustomer(null);
                  setIsCustomerModalOpen(true);
                }}
                className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
              >
                <AppIcon
                  name="customers"
                  icon={Users}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                />
                <span>Register Customer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Main Card Container matching Organizations Page */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="lead">Leads</option>
              <option value="customer">Customers</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="won">Won / Converted</option>
              <option value="proposal">Proposal</option>
              <option value="contacted">Contacted</option>
              <option value="new">New</option>
              <option value="lost">Lost / Inactive</option>
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
                placeholder="Search contacts..."
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
            {/* Multi-Select Delete Button with count */}
            {selectedContactIds.length > 0 && (
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
                <span>Delete ({selectedContactIds.length})</span>
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

        {/* Table Content - Vertical & Horizontal Scroll Owner with Sticky Header */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "280px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
                  <input
                    type="checkbox"
                    checked={
                      paginatedContacts.length > 0 &&
                      paginatedContacts.every((c) => selectedContactIds.includes(c.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContactIds(
                          Array.from(new Set([...selectedContactIds, ...paginatedContacts.map((c) => c.id)]))
                        );
                      } else {
                        const pageIds = new Set(paginatedContacts.map((c) => c.id));
                        setSelectedContactIds(selectedContactIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "name",
                      sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Contact</span>
                    {sortConfig?.key === "name" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "type",
                      sortConfig?.key === "type" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    {sortConfig?.key === "type" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Status</span>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Contact Info</span>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "revenue",
                      sortConfig?.key === "revenue"
                        ? sortConfig.direction === "asc"
                          ? "desc"
                          : null
                        : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Revenue</span>
                    {sortConfig?.key === "revenue" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "date",
                      sortConfig?.key === "date"
                        ? sortConfig.direction === "asc"
                          ? "desc"
                          : null
                        : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Created Date</span>
                    {sortConfig?.key === "date" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 w-4 bg-muted rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                        <div className="space-y-1.5 min-w-0">
                          <div className="h-3.5 w-32 bg-muted rounded" />
                          <div className="h-2.5 w-20 bg-muted/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="h-3 w-28 bg-muted rounded" />
                        <div className="h-2.5 w-20 bg-muted/60 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-6 w-6 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedContacts.length > 0 ? (
                paginatedContacts.map((contact: any) => {
                  const color = getContactColor(contact.name || "Contact");
                  const { date, time } = formatDate(contact.createdAt || contact.lastContact);
                  const isSelected = selectedContactIds.includes(contact.id);
                  const revenueVal = contact.valueAmount ?? contact.revenueValue ?? 0;

                  // Status badge mapping
                  let statusVariant: any = "slate";
                  if (contact.type === "Customer") {
                    statusVariant =
                      contact.status === "ACTIVE"
                        ? "emerald"
                        : contact.status === "PREMIUM"
                        ? "indigo"
                        : "neutral";
                  } else {
                    const s = (contact.status || contact.stage || "").toLowerCase();
                    if (s.includes("won")) statusVariant = "emerald";
                    else if (s.includes("lost")) statusVariant = "rose";
                    else if (s.includes("proposal")) statusVariant = "indigo";
                    else if (s.includes("contacted")) statusVariant = "amber";
                    else if (s.includes("new")) statusVariant = "blue";
                  }

                  return (
                    <tr
                      key={contact.id}
                      className={cn(
                        "group h-16 hover:bg-muted/30 transition-colors",
                        isSelected && "bg-primary/[0.03]"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedContactIds((prev) =>
                              prev.includes(contact.id)
                                ? prev.filter((id) => id !== contact.id)
                                : [...prev, contact.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Contact Name & Avatar */}
                      <td className="px-4 py-3.5 font-medium overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs border shrink-0",
                              color.bg,
                              color.text,
                              color.border
                            )}
                          >
                            {contact.name ? contact.name.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => {
                                if (contact.type === "Lead") {
                                  setSelectedLead(contact.raw);
                                  setIsLeadModalOpen(true);
                                } else {
                                  setSelectedCustomer(contact.raw);
                                  setIsCustomerModalOpen(true);
                                }
                              }}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate"
                            >
                              {contact.name || "Unnamed Contact"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.company || "No Company"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider border shadow-xs",
                            contact.type === "Customer"
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          )}
                        >
                          {contact.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge
                          status={
                            contact.type === "Customer"
                              ? contact.status || "ACTIVE"
                              : contact.status || contact.stage || "NEW"
                          }
                          variant={statusVariant}
                        />
                      </td>

                      {/* Contact Info (Email & Phone) */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium overflow-hidden">
                        <div className="flex flex-col gap-1 min-w-0">
                          {contact.email ? (
                            <span className="flex items-center gap-1.5 font-medium text-foreground truncate">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">—</span>
                          )}
                          {contactSettings.showPhone !== false && contact.phone && (
                            <span className="flex items-center gap-1.5 font-medium text-muted-foreground truncate">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{contact.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3.5 font-bold text-foreground">
                        {revenueVal > 0 ? formatCurrency(revenueVal, currency) : "—"}
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-foreground">{date}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                          >
                            <DropdownMenuItem
                              onClick={() => {
                                if (contact.type === "Lead") {
                                  setSelectedLead(contact.raw);
                                  setIsLeadModalOpen(true);
                                } else {
                                  setSelectedCustomer(contact.raw);
                                  setIsCustomerModalOpen(true);
                                }
                              }}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="edit"
                                icon={Edit}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Edit {contact.type}</span>
                            </DropdownMenuItem>
                            {contact.email && (
                              <DropdownMenuItem
                                onClick={() => window.open(`mailto:${contact.email}`)}
                                className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                              >
                                <AppIcon
                                  name="mail"
                                  icon={Mail}
                                  size={14}
                                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                                />
                                <span>Send Email</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={() => setContactToDelete(contact)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon
                                name="trash"
                                icon={Trash2}
                                size={14}
                                className="w-3.5 h-3.5 text-destructive shrink-0"
                              />
                              <span>Delete {contact.type}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={Users}
                        title="No contacts found"
                        description="No contacts match your current search or filter criteria."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
                        action={
                          hasActiveFilters
                            ? {
                                label: "Clear Filters",
                                onClick: handleClearFilters,
                                icon: RotateCcw,
                              }
                            : {
                                label: "Add Contact",
                                onClick: () => setIsLeadModalOpen(true),
                                icon: UserPlus,
                              }
                        }
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredContacts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredContacts.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredContacts.length}</span> Contacts
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-lg border border-border/60 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="First page"
                  aria-label="First page"
                >
                  <AppIcon name="chevronsLeft" icon={ChevronsLeft} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <AppIcon name="chevronLeft" icon={ChevronLeft} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Next page"
                  aria-label="Next page"
                >
                  <AppIcon name="chevronRight" icon={ChevronRight} size={14} className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="group h-8 w-8 rounded-lg border-border/60 cursor-pointer disabled:opacity-40"
                  title="Last page"
                  aria-label="Last page"
                >
                  <AppIcon name="chevronsRight" icon={ChevronsRight} size={14} className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Single Contact Confirmation Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete {contactToDelete.type}?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">{contactToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40">
              This action will permanently delete this record and its associated history.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setContactToDelete(null)}
                disabled={deleting}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteContact}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl text-xs h-9 px-4 shadow-sm cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Record"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Multiple Contacts Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete Selected Contacts?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You are about to delete{" "}
                  <strong className="text-foreground">{selectedContactIds.length}</strong> selected
                  contact records.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40">
              This action cannot be undone. All selected leads and customers will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={bulkDeleting}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl text-xs h-9 px-4 shadow-sm cursor-pointer"
              >
                {bulkDeleting ? "Deleting..." : `Delete ${selectedContactIds.length} Records`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Form Modal */}
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
          initialData={selectedLead || undefined}
          onSuccess={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
            refetchLeads();
          }}
          onCancel={() => {
            setIsLeadModalOpen(false);
            setSelectedLead(null);
          }}
        />
      </FormModal>

      {/* Customer Form Modal */}
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
          initialData={selectedCustomer || undefined}
          onSuccess={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomer(null);
            refetchCustomers();
          }}
          onCancel={() => {
            setIsCustomerModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      </FormModal>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onOpenChange={setIsBulkImportModalOpen}
        onSuccess={() => {
          setIsBulkImportModalOpen(false);
          refetchLeads();
          refetchCustomers();
        }}
      />

      {/* Settings Drawer */}
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
