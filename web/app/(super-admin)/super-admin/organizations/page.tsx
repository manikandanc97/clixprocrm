"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  Plus,
  ShieldCheck,
  RefreshCw,
  Users,
  Layers,
  X,
  MoreHorizontal,
  Download,
  FileText,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  fetchPlatformOrganizations,
  createPlatformOrganization,
  deletePlatformOrganization,
  fetchPlatformOrganizationDetails,
  PlatformOrganization,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
  CRMToolbar,
  CRMPagination,
  CRMRoleBadge,
} from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { DataTableColumnHeader } from "@/shared/components/DataTableColumnHeader";

export default function SuperAdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgPlan, setNewOrgPlan] = useState("pro");
  const [newOrgCurrency, setNewOrgCurrency] = useState("INR");
  const [creating, setCreating] = useState(false);

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Sort state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  // Delete Confirmation State
  const [orgToDelete, setOrgToDelete] = useState<PlatformOrganization | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformOrganizations({
        limit: 1000,
      });
      setOrganizations(res.organizations || []);
    } catch (err: any) {
      toast.error("Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();

    const handleAal2Verified = () => {
      loadOrganizations();
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, planFilter]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      setCreating(true);
      await createPlatformOrganization({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim() || undefined,
        plan: newOrgPlan,
        currency: newOrgCurrency,
      });
      toast.success(`Organization "${newOrgName}" created successfully.`);
      setCreateModalOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      loadOrganizations();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create organization."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrg = async (org: PlatformOrganization) => {
    try {
      setDeleting(true);
      await deletePlatformOrganization(org.id);
      toast.success(`Workspace "${org.name}" deleted successfully.`);
      setOrgToDelete(null);
      if (selectedOrgDetails?.id === org.id) {
        setDetailsModalOpen(false);
        setSelectedOrgDetails(null);
      }
      await loadOrganizations();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete organization."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenDetails = async (orgId: string) => {
    try {
      setLoadingDetails(true);
      setDetailsModalOpen(true);
      const details = await fetchPlatformOrganizationDetails(orgId);
      setSelectedOrgDetails(details);
    } catch (err: any) {
      toast.error("Failed to fetch organization details.");
      setDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const exportCSV = () => {
    if (organizations.length === 0) {
      toast.error("No organizations available to export.");
      return;
    }
    const headers = ["ID", "Name", "Slug", "Plan", "Status", "Users", "Leads", "Customers", "Created At"];
    const rows = organizations.map((o) => [
      o.id,
      `"${o.name}"`,
      o.slug,
      o.plan,
      o.status,
      o.userCount,
      o.leadCount,
      o.customerCount,
      o.createdAt,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_organizations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Organizations exported successfully.");
  };

  const totalActive = useMemo(
    () => organizations.filter((o) => o.status === "ACTIVE").length,
    [organizations]
  );
  const totalPro = useMemo(
    () =>
      organizations.filter(
        (o) =>
          o.plan?.toLowerCase() === "pro" ||
          o.plan?.toLowerCase() === "enterprise"
      ).length,
    [organizations]
  );

  const filteredOrganizations = useMemo(() => {
    const filtered = organizations.filter((org) => {
      if (planFilter !== "ALL" && org.plan?.toLowerCase() !== planFilter.toLowerCase()) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q);
    });
    if (!sortConfig) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      const aVal = (a as any)[sortConfig.key] ?? "";
      const bVal = (b as any)[sortConfig.key] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [organizations, search, planFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / rowsPerPage));
  const paginatedOrganizations = filteredOrganizations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <CRMPageContainer>
      {/* 1. Standard CRM Page Header */}
      <CRMPageHeader
        title="Organizations"
        subtitle="Manage multi-tenant workspaces, subscription plans, and tenant lifecycle."
        icon={Building2}
        badge="Multi-Tenant Control"
        actions={[
          {
            label: "Export CSV",
            icon: Download,
            onClick: exportCSV,
            variant: "outline",
          },
          {
            label: "Refresh",
            icon: RefreshCw,
            onClick: loadOrganizations,
            variant: "outline",
          },
          {
            label: "Create Organization",
            icon: Plus,
            onClick: () => setCreateModalOpen(true),
            variant: "default",
          },
        ]}
      />

      {/* 2. Standard CRM KPI Metrics Grid */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={3}>
          <CRMMetricCard
            title="Total Workspaces"
            value={organizations.length}
            change={`${organizations.length} Total`}
            trend="neutral"
            icon={Building2}
            color="blue"
            loading={loading}
          />
          <CRMMetricCard
            title="Active Workspaces"
            value={totalActive}
            change={`${totalActive} Active`}
            trend={totalActive > 0 ? "up" : "neutral"}
            icon={ShieldCheck}
            color="emerald"
            loading={loading}
          />
          <CRMMetricCard
            title="Paid Tiers (Pro/Ent)"
            value={totalPro}
            change={`${totalPro} Active`}
            trend="up"
            icon={Layers}
            color="purple"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 3. Standard CRM Toolbar & Table Workspace */}
      <div className="crm-table-workspace">
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search by workspace name or slug..."
          sticky={false}
        >
          <div className="flex items-center gap-2">
            {/* Plan Selector */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </CRMToolbar>

        {/* 4. Standard CRM Data Table */}
        <div className={cn("crm-table-wrap", (loading || filteredOrganizations.length <= rowsPerPage) && "crm-table-no-pagination")}>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                  <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap cursor-pointer select-none" onClick={() => setSort("name", sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}>
                    <DataTableColumnHeader title="Organization" sortable sortDirection={sortConfig?.key === "name" ? sortConfig.direction : null} onSort={(d) => setSort("name", d)} />
                  </th>
                  <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap cursor-pointer select-none">
                    <DataTableColumnHeader title="Plan" sortable sortDirection={sortConfig?.key === "plan" ? sortConfig.direction : null} onSort={(d) => setSort("plan", d)} />
                  </th>
                  <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap cursor-pointer select-none">
                    <DataTableColumnHeader title="Users" align="right" sortable sortDirection={sortConfig?.key === "userCount" ? sortConfig.direction : null} onSort={(d) => setSort("userCount", d)} />
                  </th>
                  <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                    <DataTableColumnHeader title="CRM Activity" />
                  </th>
                  <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                    <DataTableColumnHeader title="Status" />
                  </th>
                  <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap cursor-pointer select-none">
                    <DataTableColumnHeader title="Created Date" sortable sortDirection={sortConfig?.key === "createdAt" ? sortConfig.direction : null} onSort={(d) => setSort("createdAt", d)} />
                  </th>
                  <th className="group h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">
                    <DataTableColumnHeader title="Actions" align="right" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse h-16">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-muted rounded-xl" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 bg-muted rounded" />
                            <div className="h-2.5 w-24 bg-muted/60 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-6 w-16 bg-muted rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-muted rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-16 bg-muted rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-16 bg-muted rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedOrganizations.length > 0 ? (
                  paginatedOrganizations.map((org) => (
                    <tr
                      key={org.id}
                      className="group h-16 hover:bg-muted/[0.03] transition-colors"
                    >
                      {/* Organization Name & Avatar */}
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              onClick={() => handleOpenDetails(org.id)}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate max-w-[240px]"
                              title={org.name}
                            >
                              {org.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              /{org.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-4">
                        <PlanBadge plan={org.plan} />
                      </td>

                      {/* Users */}
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span className="text-foreground font-bold">{org.userCount}</span>
                        </div>
                      </td>

                      {/* CRM Activity */}
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        <span className="text-foreground font-semibold">{org.leadCount}</span> leads • <span className="text-foreground font-semibold">{org.customerCount}</span> customers
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={org.status === "ACTIVE" ? "Active" : "Suspended"}
                          variant={org.status === "ACTIVE" ? "emerald" : "rose"}
                        />
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions Menu */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48 shadow-lg border-border">
                              <DropdownMenuLabel className="text-xs">
                                Workspace Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleOpenDetails(org.id)}
                                className="text-xs gap-2 cursor-pointer font-medium"
                              >
                                <AppIcon name="quotations" size={14} className="text-primary" />
                                <span>View Overview</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setOrgToDelete(org)}
                                className="text-xs gap-2 cursor-pointer font-semibold text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 dark:text-rose-400 dark:focus:text-rose-400 dark:focus:bg-rose-500/20"
                              >
                                <AppIcon name="trash" size={14} className="text-rose-600 dark:text-rose-400" />
                                <span className="text-rose-600 dark:text-rose-400">Delete Workspace</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 border-0">
                      <EmptyState
                        icon={Building2}
                        title="No organizations found"
                        description="No workspaces match your search or filter criteria. Click 'Create Organization' to add one."
                        className="border-none bg-transparent shadow-none p-8 min-h-[220px]"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Pagination */}
        {!loading && filteredOrganizations.length > 0 && (
          <CRMPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrganizations.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            itemName="Organizations"
          />
        )}
      </div>

      {/* 5. Create Organization Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Create Organization
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Provision a new multi-tenant workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="orgName" className="text-xs font-semibold">
                  Organization Name *
                </Label>
                <Input
                  id="orgName"
                  placeholder="Enter organization name"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")
                      );
                    }
                  }}
                  required
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orgSlug" className="text-xs font-semibold">
                  URL Workspace Slug
                </Label>
                <Input
                  id="orgSlug"
                  placeholder="Enter workspace slug"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="rounded-xl h-10 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="orgPlan" className="text-xs font-semibold">
                    Subscription Tier
                  </Label>
                  <select
                    id="orgPlan"
                    value={newOrgPlan}
                    onChange={(e) => setNewOrgPlan(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  >
                    <option value="free">Free Tier</option>
                    <option value="starter">Starter Plan (₹1,999/mo)</option>
                    <option value="pro">Pro Plan (₹4,999/mo)</option>
                    <option value="enterprise">Enterprise (₹14,999/mo)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orgCurrency" className="text-xs font-semibold">
                    Primary Currency
                  </Label>
                  <select
                    id="orgCurrency"
                    value={newOrgCurrency}
                    onChange={(e) => setNewOrgCurrency(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  >
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {creating ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Organization Details Modal */}
      {detailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-extrabold text-base border border-emerald-500/20">
                  {selectedOrgDetails?.name?.charAt(0) || "O"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedOrgDetails?.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">/{selectedOrgDetails?.slug}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <PlanBadge plan={selectedOrgDetails?.plan} size="sm" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const org = organizations.find((o) => o.id === selectedOrgDetails?.id) || {
                      id: selectedOrgDetails?.id,
                      name: selectedOrgDetails?.name || "Organization",
                      slug: selectedOrgDetails?.slug || "",
                      plan: selectedOrgDetails?.plan || "free",
                      status: selectedOrgDetails?.status || "ACTIVE",
                      userCount: selectedOrgDetails?.members?.length || 0,
                      leadCount: selectedOrgDetails?.counts?.leads || 0,
                      customerCount: selectedOrgDetails?.counts?.customers || 0,
                      dealCount: selectedOrgDetails?.counts?.deals || 0,
                      taskCount: selectedOrgDetails?.counts?.tasks || 0,
                      createdAt: selectedOrgDetails?.createdAt || new Date().toISOString(),
                      updatedAt: selectedOrgDetails?.updatedAt || new Date().toISOString(),
                    };
                    setOrgToDelete(org as PlatformOrganization);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-semibold gap-1.5 h-8 px-2.5 rounded-lg"
                >
                  <AppIcon name="trash" size={14} className="text-destructive" />
                  <span>Delete</span>
                </Button>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <AppIcon name="close" size={16} />
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-2">
                    <Skeleton className="h-2.5 w-16 mx-auto" />
                    <Skeleton className="h-6 w-10 mx-auto" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-2">
                    <Skeleton className="h-2.5 w-16 mx-auto" />
                    <Skeleton className="h-6 w-10 mx-auto" />
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-2">
                    <Skeleton className="h-2.5 w-16 mx-auto" />
                    <Skeleton className="h-6 w-10 mx-auto" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Skeleton className="h-3.5 w-36" />
                  <div className="rounded-xl border border-border/60 p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-2.5 w-36" />
                        </div>
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedOrgDetails ? (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">
                      Members
                    </p>
                    <p className="text-xl font-black text-foreground mt-1">
                      {selectedOrgDetails.members?.length || 0}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">
                      Leads
                    </p>
                    <p className="text-xl font-black text-foreground mt-1">
                      {selectedOrgDetails.counts?.leads || 0}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">
                      Deals
                    </p>
                    <p className="text-xl font-black text-foreground mt-1">
                      {selectedOrgDetails.counts?.deals || 0}
                    </p>
                  </div>
                </div>

                {/* Organization Members Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Organization Users ({selectedOrgDetails.members?.length || 0})
                  </h4>
                  <div className="rounded-xl border border-border/60 overflow-auto max-h-60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-card shadow-xs">
                        <tr className="bg-muted/40 text-muted-foreground border-b border-border/40 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4 bg-card">User</th>
                          <th className="py-2.5 px-4 bg-card">Role</th>
                          <th className="py-2.5 px-4 bg-card">Status</th>
                          <th className="py-2.5 px-4 text-right bg-card">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {selectedOrgDetails.members && selectedOrgDetails.members.length > 0 ? (
                          selectedOrgDetails.members.map((m: any) => (
                            <tr key={m.membershipId} className="hover:bg-muted/20 h-12">
                              <td className="py-2.5 px-4">
                                <p className="font-semibold text-foreground">{m.name}</p>
                                <p className="text-[11px] text-muted-foreground">{m.email}</p>
                              </td>
                              <td className="py-2.5 px-4">
                                <CRMRoleBadge role={m.role} size="xs" />
                              </td>
                              <td className="py-2.5 px-4">
                                <StatusBadge
                                  status={m.status || "ACTIVE"}
                                  variant={m.status === "ACTIVE" ? "emerald" : "neutral"}
                                />
                              </td>
                              <td className="py-2.5 px-4 text-right text-muted-foreground">
                                {new Date(m.joinedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-muted-foreground">
                              No members registered in this organization.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 7. Delete Workspace Confirmation Modal */}
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete Workspace
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action is permanent and irreversible.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{orgToDelete.name}</strong>{" "}
              (<span className="font-mono text-[11px]">/{orgToDelete.slug}</span>)? All associated users, CRM leads, deals, quotations, invoices, and activity history will be completely removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOrgToDelete(null)}
                disabled={deleting}
                className="rounded-xl text-xs font-semibold h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteOrg(orgToDelete)}
                disabled={deleting}
                className="rounded-xl text-xs font-bold h-9 px-4 gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Workspace</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </CRMPageContainer>
  );
}
