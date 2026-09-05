"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Search,
  X,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Trash2,
  AlertTriangle,
  Users,
  Eye,
  RotateCcw,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  CRMPageContainer,
  CRMRoleBadge,
} from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { EmptyState } from "@/shared/components/EmptyState";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";


import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";

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
  const [selectedOrgDetails, setSelectedOrgDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const getOrgColor = (name: string) => {
    return getOrgAvatarColor(name);
  };

  const formatDate = (dateStr: string) => {
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
  }, [search, planFilter, statusFilter]);

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

  const handleBulkDelete = async () => {
    if (selectedOrgIds.length === 0) return;
    try {
      setBulkDeleting(true);
      await Promise.all(selectedOrgIds.map((id) => deletePlatformOrganization(id)));
      toast.success(`${selectedOrgIds.length} workspace(s) deleted successfully.`);
      setSelectedOrgIds([]);
      setBulkDeleteModalOpen(false);
      await loadOrganizations();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete selected workspaces."
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  const hasActiveFilters = planFilter !== "ALL" || statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setPlanFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const handleOpenDetails = async (orgId: string) => {
    try {
      setLoadingDetails(true);
      setDetailsModalOpen(true);
      const details = await fetchPlatformOrganizationDetails(orgId);
      setSelectedOrgDetails(details);
    } catch {
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


  const filteredOrganizations = useMemo(() => {
    const filtered = organizations.filter((org) => {
      if (planFilter !== "ALL" && org.plan?.toLowerCase() !== planFilter.toLowerCase()) return false;
      if (statusFilter !== "ALL" && org.status?.toUpperCase() !== statusFilter.toUpperCase()) return false;
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
  }, [organizations, search, planFilter, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / rowsPerPage));
  const paginatedOrganizations = filteredOrganizations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon name="companies" icon={Building2} size={18} className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Organizations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage multi-tenant workspaces, subscription plans, and tenant lifecycle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon name="plus" icon={Plus} size={14} className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Create Organization</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Card Container matching Image 2 */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Stock / Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>

            {/* Publish / Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Published (Active)</option>
              <option value="SUSPENDED">Draft (Suspended)</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <AppIcon name="search" icon={Search} size={14} className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
            {/* Multi-Select Delete Button with count */}
            {selectedOrgIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon name="trash" icon={Trash2} size={14} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete ({selectedOrgIds.length})</span>
              </button>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon name="reset" icon={RotateCcw} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                <span>Reset Filters</span>
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={exportCSV}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <AppIcon name="export" icon={Download} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table Content - Vertical & Horizontal Scroll Owner with Sticky Header */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "280px" }} />
              <col style={{ width: "130px" }} />
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
                      paginatedOrganizations.length > 0 &&
                      paginatedOrganizations.every((o) => selectedOrgIds.includes(o.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrgIds(Array.from(new Set([...selectedOrgIds, ...paginatedOrganizations.map((o) => o.id)])));
                      } else {
                        const pageIds = new Set(paginatedOrganizations.map((o) => o.id));
                        setSelectedOrgIds(selectedOrgIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("name", sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Organization</span>
                    {sortConfig?.key === "name" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("plan", sortConfig?.key === "plan" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Plan</span>
                    {sortConfig?.key === "plan" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("userCount", sortConfig?.key === "userCount" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Users</span>
                    {sortConfig?.key === "userCount" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>CRM Activity</span>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Status</span>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => setSort("createdAt", sortConfig?.key === "createdAt" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Created Date</span>
                    {sortConfig?.key === "createdAt" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {loading ? (
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
                    <td className="px-4 py-4"><div className="h-6 w-16 bg-muted rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-12 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-3.5 w-28 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-16 bg-muted rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-6 w-6 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedOrganizations.length > 0 ? (
                paginatedOrganizations.map((org) => {
                  const color = getOrgColor(org.name);
                  const { date, time } = formatDate(org.createdAt);
                  const isSelected = selectedOrgIds.includes(org.id);

                  return (
                    <tr
                      key={org.id}
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
                            setSelectedOrgIds((prev) =>
                              prev.includes(org.id) ? prev.filter((id) => id !== org.id) : [...prev, org.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Organization Name & Avatar */}
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
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => handleOpenDetails(org.id)}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate"
                            >
                              {org.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              /{org.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5">
                        <PlanBadge plan={org.plan} size="sm" className="rounded-md font-bold text-[10.5px] px-2 py-0.5" />
                      </td>

                      {/* Users */}
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-foreground font-bold">{org.userCount}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            {org.userCount === 1 ? "user" : "users"}
                          </span>
                        </div>
                      </td>

                      {/* CRM Activity */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium truncate">
                        <span className="text-foreground font-semibold">{org.leadCount}</span> leads • <span className="text-foreground font-semibold">{org.customerCount}</span> customers
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
                            org.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          )}
                        >
                          {org.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
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
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground">
                            <DropdownMenuItem
                              onClick={() => handleOpenDetails(org.id)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon name="overview" icon={Eye} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                              <span>View Overview</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                              onClick={() => setOrgToDelete(org)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon name="trash" icon={Trash2} size={14} className="w-3.5 h-3.5 text-destructive shrink-0" />
                              <span>Delete Workspace</span>
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
                        icon={Building2}
                        title="No organizations found"
                        description="No workspaces match your search or filter criteria."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
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
              {filteredOrganizations.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredOrganizations.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredOrganizations.length}</span> Organizations
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
                {/* First Page */}
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

                {/* Previous Page */}
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

                {/* Next Page */}
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

                {/* Last Page */}
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
                {(() => {
                  const modalColor = getOrgColor(selectedOrgDetails?.name || "O");
                  return (
                    <div
                      className={cn(
                        "h-11 w-11 rounded-2xl flex items-center justify-center font-extrabold text-base border shadow-xs",
                        modalColor.bg,
                        modalColor.text,
                        modalColor.border
                      )}
                    >
                      {selectedOrgDetails?.name?.charAt(0)?.toUpperCase() || "O"}
                    </div>
                  );
                })()}
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

      {/* 8. Bulk Delete Workspaces Confirmation Modal */}
      {bulkDeleteModalOpen && selectedOrgIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete {selectedOrgIds.length} Selected Workspaces
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action is permanent and irreversible.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{selectedOrgIds.length} workspace(s)</strong>? All associated users, CRM leads, deals, quotations, invoices, and activity history across these workspaces will be completely removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={bulkDeleting}
                className="rounded-xl text-xs font-semibold h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="rounded-xl text-xs font-bold h-9 px-4 gap-1.5"
              >
                {bulkDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting {selectedOrgIds.length}...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete {selectedOrgIds.length} Workspaces</span>
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
