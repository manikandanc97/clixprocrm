"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  fetchPlatformOrganizations,
  createPlatformOrganization,
  deletePlatformOrganization,
  fetchPlatformOrganizationDetails,
  PlatformOrganization,
  PlatformOrganizationDetail,
} from "@/shared/lib/api/super-admin.api";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPagination,
} from "@/shared/components/crm";
import { OrganizationsToolbar } from "./components/OrganizationsToolbar";
import { OrganizationsTable } from "./components/OrganizationsTable";
import { OrganizationDetailsModal } from "./components/OrganizationDetailsModal";
import { CreateOrganizationModal } from "./components/CreateOrganizationModal";
import { OrganizationDeleteDialogs } from "./components/OrganizationDeleteDialogs";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  // Delete Confirmation State
  const [orgToDelete, setOrgToDelete] = useState<PlatformOrganization | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState("pro");
  const [newOrgCurrency, setNewOrgCurrency] = useState("INR");
  const [creating, setCreating] = useState(false);

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<PlatformOrganizationDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformOrganizations({
        limit: 1000,
      });
      setOrganizations(res.organizations || []);
    } catch {
      toast.error("Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  };

  const [prevFilterKey, setPrevFilterKey] = useState(`${search}::${planFilter}::${statusFilter}`);
  const currentFilterKey = `${search}::${planFilter}::${statusFilter}`;
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  useEffect(() => {
    let active = true;
    fetchPlatformOrganizations()
      .then((res) => {
        if (!active) return;
        setOrganizations(res.organizations || []);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Failed to load organizations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleAal2Verified = () => {
      loadOrganizations();
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      active = false;
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

  const handleOpenDetails = async (orgId: string) => {
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    setSelectedOrgDetails(null);
    try {
      const res = await fetchPlatformOrganizationDetails(orgId);
      setSelectedOrgDetails(res);
    } catch {
      toast.error("Failed to load organization details.");
      setDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName) {
      toast.error("Organization name is required.");
      return;
    }

    try {
      setCreating(true);
      const res = await createPlatformOrganization({
        name: newOrgName,
        slug: newOrgSlug || undefined,
        plan: newOrgPlan,
        currency: newOrgCurrency,
      });
      toast.success(`Organization ${res.data?.name || newOrgName} created.`);
      setCreateModalOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      setNewOrgPlan("pro");
      loadOrganizations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create organization.";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrg = async (org: PlatformOrganization) => {
    try {
      setDeleting(true);
      await deletePlatformOrganization(org.id);
      toast.success(`Organization ${org.name} deleted.`);
      setOrgToDelete(null);
      setDetailsModalOpen(false);
      setSelectedOrgIds((prev) => prev.filter((id) => id !== org.id));
      loadOrganizations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete organization.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrgIds.length === 0) return;
    try {
      setBulkDeleting(true);
      let successCount = 0;
      for (const orgId of selectedOrgIds) {
        try {
          await deletePlatformOrganization(orgId);
          successCount++;
        } catch (err) {
          console.error(`Failed to delete org ${orgId}:`, err);
        }
      }
      toast.success(`${successCount} workspace(s) deleted successfully.`);
      setSelectedOrgIds([]);
      setBulkDeleteModalOpen(false);
      loadOrganizations();
    } catch {
      toast.error("Bulk delete operation encountered an error.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setPlanFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const exportCSV = () => {
    if (organizations.length === 0) {
      toast.error("No organizations available to export.");
      return;
    }
    const headers = [
      "Organization Name",
      "Slug",
      "Plan",
      "Users Count",
      "Leads Count",
      "Deals Count",
      "Customers Count",
      "Status",
      "Created At",
    ];
    const rows = filteredOrganizations.map((o) => [
      `"${(o.name || "").replace(/"/g, '""')}"`,
      `"${o.slug || ""}"`,
      o.plan || "free",
      o.userCount || 0,
      o.leadCount || 0,
      o.dealCount || 0,
      o.customerCount || 0,
      o.status || "ACTIVE",
      o.createdAt || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_organizations_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Organizations exported successfully.");
  };

  const hasActiveFilters =
    planFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    search.trim().length > 0;

  // Filter & Sort Logic
  const filteredOrganizations = useMemo(() => {
    const list = organizations.filter((org) => {
      const matchesSearch =
        search === "" ||
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase());
      const matchesPlan =
        planFilter === "ALL" ||
        org.plan.toLowerCase() === planFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        (org.status || "ACTIVE").toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesPlan && matchesStatus;
    });

    if (!sortConfig) return list;

    return [...list].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof PlatformOrganization];
      let bVal: any = b[sortConfig.key as keyof PlatformOrganization];

      if (sortConfig.key === "createdAt") {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [organizations, search, planFilter, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / rowsPerPage));
  const paginatedOrganizations = filteredOrganizations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Metric KPI Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Workspaces</p>
            <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">{organizations.length}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Tenants</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {organizations.filter((o) => o.status !== "SUSPENDED").length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Members</p>
            <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
              {organizations.reduce((acc, o) => acc + (o.userCount || 0), 0)}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Paid Tiers</p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {organizations.filter((o) => o.plan && o.plan !== "free").length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Main Table & Toolbar Card */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <OrganizationsToolbar
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          search={search}
          setSearch={setSearch}
          selectedCount={selectedOrgIds.length}
          onBulkDeleteClick={() => setBulkDeleteModalOpen(true)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onExportClick={exportCSV}
          onCreateClick={() => setCreateModalOpen(true)}
        />

        <OrganizationsTable
          loading={loading}
          paginatedOrganizations={paginatedOrganizations}
          selectedOrgIds={selectedOrgIds}
          setSelectedOrgIds={setSelectedOrgIds}
          sortConfig={sortConfig}
          setSort={setSort}
          handleOpenDetails={handleOpenDetails}
          setOrgToDelete={setOrgToDelete}
          hasActiveFilters={hasActiveFilters}
          handleClearFilters={handleClearFilters}
          onCreateClick={() => setCreateModalOpen(true)}
        />

        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrganizations.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
          itemName="Organizations"
        />
      </div>

      {/* 3. Modals and Dialogs */}
      <CreateOrganizationModal
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
        newOrgName={newOrgName}
        setNewOrgName={setNewOrgName}
        newOrgSlug={newOrgSlug}
        setNewOrgSlug={setNewOrgSlug}
        newOrgPlan={newOrgPlan}
        setNewOrgPlan={setNewOrgPlan}
        newOrgCurrency={newOrgCurrency}
        setNewOrgCurrency={setNewOrgCurrency}
        creating={creating}
        handleCreateOrg={handleCreateOrg}
      />

      <OrganizationDetailsModal
        detailsModalOpen={detailsModalOpen}
        setDetailsModalOpen={setDetailsModalOpen}
        selectedOrgDetails={selectedOrgDetails}
        loadingDetails={loadingDetails}
        organizations={organizations}
        setOrgToDelete={setOrgToDelete}
      />

      <OrganizationDeleteDialogs
        orgToDelete={orgToDelete}
        setOrgToDelete={setOrgToDelete}
        deleting={deleting}
        handleDeleteOrg={handleDeleteOrg}
        bulkDeleteModalOpen={bulkDeleteModalOpen}
        setBulkDeleteModalOpen={setBulkDeleteModalOpen}
        selectedOrgCount={selectedOrgIds.length}
        bulkDeleting={bulkDeleting}
        handleBulkDelete={handleBulkDelete}
      />
    </CRMPageContainer>
  );
}
