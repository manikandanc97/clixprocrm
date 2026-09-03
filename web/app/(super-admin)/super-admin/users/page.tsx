"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  Ban,
  Crown,
  RefreshCw,
  MoreHorizontal,
  Building2,
  Download,
  FileText,
  Trash2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  fetchPlatformUsers,
  updatePlatformUserStatus,
  transferSuperAdminRole,
  deletePlatformUser,
  PlatformUser,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
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
  CRMToolbar,
  CRMPagination,
  CRMRoleBadge,
  TruncatedText,
  CRMActionMenu,
} from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { getUserAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [superAdminOnly, setSuperAdminOnly] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [transferTargetUser, setTransferTargetUser] = useState<PlatformUser | null>(null);
  const [transferConfirmText, setTransferConfirmText] = useState("");
  const [deleteTargetUser, setDeleteTargetUser] = useState<PlatformUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformUsers({
        limit: 1000,
      });
      setUsers(res.users || []);
    } catch (err: any) {
      toast.error("Failed to load platform users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();

    const handleAal2Verified = () => {
      loadUsers();
    };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, superAdminOnly]);

  const handleExecuteTransfer = async () => {
    if (!transferTargetUser) return;
    if (transferConfirmText.trim().toUpperCase() !== "TRANSFER") {
      toast.error('Please type "TRANSFER" to confirm the platform ownership transfer.');
      return;
    }

    try {
      setIsTransferring(true);
      const res = await transferSuperAdminRole(transferTargetUser.id);
      toast.success(res.message || `Platform Super Admin ownership transferred successfully.`);
      setTransferTargetUser(null);
      setTransferConfirmText("");
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to transfer Super Admin ownership."
      );
    } finally {
      setIsTransferring(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetUser) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Please type "DELETE" to confirm permanent account deletion.');
      return;
    }

    try {
      setIsDeleting(true);
      const res = await deletePlatformUser(deleteTargetUser.id);
      toast.success(res.message || `User account deleted successfully.`);
      setDeleteTargetUser(null);
      setDeleteConfirmText("");
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to delete user account."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: PlatformUser) => {
    if (user.isSuperAdmin) {
      toast.error("Cannot deactivate or suspend the sole active Platform Super Admin.");
      return;
    }

    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg = `Are you sure you want to ${
      nextStatus === "SUSPENDED" ? "suspend" : "activate"
    } user "${user.name || user.email}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      await updatePlatformUserStatus(user.id, nextStatus as any);
      toast.success(`User status updated to ${nextStatus}.`);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update user status.");
    }
  };

  const exportCSV = () => {
    if (users.length === 0) {
      toast.error("No users available to export.");
      return;
    }
    const headers = ["ID", "Name", "Email", "Role", "Status", "Created At"];
    const rows = users.map((u) => [
      u.id,
      `"${u.name || ""}"`,
      u.email,
      u.isSuperAdmin ? "SUPER_ADMIN" : "USER",
      u.status,
      u.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_platform_users_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users exported successfully.");
  };

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null,
  });

  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Super Admin Filter
      if (superAdminOnly && !u.isSuperAdmin) {
        return false;
      }
      // 2. Status Filter
      if (statusFilter !== "ALL" && u.status !== statusFilter) {
        return false;
      }
      // 3. Search Query Filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, statusFilter, superAdminOnly]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (!sortConfig.direction) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.key === "name") {
        const nameA = a.name || a.email || "";
        const nameB = b.name || b.email || "";
        return nameA.localeCompare(nameB) * dir;
      }
      if (sortConfig.key === "role") {
        const roleA = a.isSuperAdmin ? "SUPER_ADMIN" : "USER";
        const roleB = b.isSuperAdmin ? "SUPER_ADMIN" : "USER";
        return roleA.localeCompare(roleB) * dir;
      }
      if (sortConfig.key === "status") {
        return (a.status || "").localeCompare(b.status || "") * dir;
      }
      if (sortConfig.key === "createdAt") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (dateA - dateB) * dir;
      }
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const hasActiveFilters = statusFilter !== "ALL" || superAdminOnly || search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setSuperAdminOnly(false);
    setSearch("");
    setCurrentPage(1);
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedUserIds.length} user(s)?`)) return;
    try {
      await Promise.all(selectedUserIds.map((id) => deletePlatformUser(id)));
      toast.success(`${selectedUserIds.length} user(s) deleted successfully.`);
      setSelectedUserIds([]);
      loadUsers();
    } catch (err: any) {
      toast.error("Failed to delete selected users.");
    }
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon name="users" icon={Users} size={18} className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Platform Users
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage platform authentication, global roles, and user lifecycle.
            </p>
          </div>
        </div>
      </div>

      {/* Main Card Container matching Organizations Page */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <select
              value={superAdminOnly ? "SUPER_ADMIN" : "ALL"}
              onChange={(e) => setSuperAdminOnly(e.target.value === "SUPER_ADMIN")}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admins Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <AppIcon name="search" icon={Search} size={14} className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email..."
                className="h-9 w-full pl-8 pr-8 rounded-lg bg-background border border-border/70 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
            {/* Multi-Select Delete Button */}
            {selectedUserIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon name="trash" icon={Trash2} size={14} className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Delete ({selectedUserIds.length})</span>
              </button>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon name="reset" icon={RefreshCw} size={14} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
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

        {/* Table Content */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "280px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "240px" }} />
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
                      paginatedUsers.length > 0 &&
                      paginatedUsers.every((u) => selectedUserIds.includes(u.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...paginatedUsers.map((u) => u.id)])));
                      } else {
                        const pageIds = new Set(paginatedUsers.map((u) => u.id));
                        setSelectedUserIds(selectedUserIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("name", sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>User</span>
                    {sortConfig.key === "name" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("role", sortConfig.key === "role" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Platform Role</span>
                    {sortConfig.key === "role" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Organizations &amp; Role</span>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("status", sortConfig.key === "status" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortConfig.key === "status" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() => handleSort("createdAt", sortConfig.key === "createdAt" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Created Date</span>
                    {sortConfig.key === "createdAt" && (
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
                    <td className="px-4 py-4"><div className="h-6 w-24 bg-muted rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-16 bg-muted rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-6 w-6 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => {
                  const color = getUserAvatarColor(u.name || u.email);
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <tr
                      key={u.id}
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
                            setSelectedUserIds((prev) =>
                              prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* User Name & Avatar */}
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
                            {u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => setSelectedUser(u)}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate"
                            >
                              {u.name || "No name registered"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Platform Role */}
                      <td className="px-4 py-3.5">
                        {u.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-[10.5px] px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-xs whitespace-nowrap uppercase tracking-wider">
                            <Crown className="h-3 w-3 shrink-0" />
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                            Standard User
                          </span>
                        )}
                      </td>

                      {/* Organizations */}
                      <td className="px-4 py-3.5">
                        {u.organizations && u.organizations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                            {u.organizations.map((org: any) => (
                              <div
                                key={org.tenantId}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/60 border border-border/70 text-[11px] max-w-[200px]"
                              >
                                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="font-semibold text-foreground truncate">{org.name}</span>
                                <CRMRoleBadge role={org.role} size="xs" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Platform Only (No Tenant)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold tracking-wider uppercase border shadow-xs",
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : u.status === "SUSPENDED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {u.status === "ACTIVE" ? "Active" : u.status === "SUSPENDED" ? "Suspended" : "Inactive"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-foreground">
                          {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(u.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end">
                          <CRMActionMenu
                            triggerOrientation="vertical"
                            width="w-56"
                            items={[
                              {
                                label: "View User Profile",
                                icon: "quotations",
                                variant: "primary" as const,
                                onClick: () => setSelectedUser(u),
                              },
                              ...(!u.isSuperAdmin
                                ? [
                                    {
                                      label: "Transfer Super Admin",
                                      icon: "security",
                                      separatorBefore: true,
                                      className: "text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-500/10 hover:text-amber-600",
                                      iconColor: "text-amber-500",
                                      onClick: () => setTransferTargetUser(u),
                                    },
                                    {
                                      label: u.status === "ACTIVE" ? "Suspend Account" : "Re-activate Account",
                                      icon: u.status === "ACTIVE" ? "security" : "checkCircle",
                                      variant: u.status === "ACTIVE" ? ("destructive" as const) : ("default" as const),
                                      separatorBefore: true,
                                      className: u.status !== "ACTIVE" ? "text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-500/10 hover:text-emerald-600" : undefined,
                                      iconColor: u.status !== "ACTIVE" ? "text-emerald-500" : undefined,
                                      onClick: () => handleToggleStatus(u),
                                    },
                                    {
                                      label: "Delete User",
                                      icon: "trash",
                                      variant: "destructive" as const,
                                      separatorBefore: true,
                                      onClick: () => setDeleteTargetUser(u),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={Users}
                        title="No users found"
                        description="No platform users match your search query or filter criteria."
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
              {filteredUsers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredUsers.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredUsers.length}</span> Users
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

      {/* 6. User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
                  {selectedUser.name?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {selectedUser.name || "User Profile"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/40">
                <div>
                  <span className="text-muted-foreground font-semibold">Status</span>
                  <div className="mt-1">
                    <StatusBadge
                      status={selectedUser.status === "ACTIVE" ? "Active" : selectedUser.status === "SUSPENDED" ? "Suspended" : "Inactive"}
                      variant={selectedUser.status === "ACTIVE" ? "emerald" : selectedUser.status === "SUSPENDED" ? "rose" : "neutral"}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Platform Role</span>
                  <p className="font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    {selectedUser.isSuperAdmin ? (
                      <>
                        <Crown className="h-3.5 w-3.5" />
                        SUPER ADMIN (Root)
                      </>
                    ) : (
                      "Standard User"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Member Since</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Organizations</span>
                  <p className="font-bold text-foreground mt-0.5">
                    {selectedUser.organizations?.length || 0} workspaces
                  </p>
                </div>
              </div>

              {/* Memberships */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Workspace Memberships
                </h4>
                <div className="space-y-2">
                  {selectedUser.organizations && selectedUser.organizations.length > 0 ? (
                    selectedUser.organizations.map((org) => (
                      <div
                        key={org.tenantId}
                        className="p-3 rounded-xl bg-card border border-border flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-foreground">{org.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            /{org.slug}
                          </p>
                        </div>
                        <div className="text-right">
                          <CRMRoleBadge role={org.role} size="xs" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4 text-xs">
                      No tenant organization memberships.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/60">
                {selectedUser.isSuperAdmin ? (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" />
                    Protected Platform Root Admin
                  </span>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        const target = selectedUser;
                        setSelectedUser(null);
                        setTransferTargetUser(target);
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <Crown className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      Transfer Super Admin
                    </Button>
                    <Button
                      onClick={() => {
                        const target = selectedUser;
                        setSelectedUser(null);
                        setDeleteTargetUser(target);
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-500" />
                      Delete Account
                    </Button>
                    <Button
                      onClick={() => {
                        handleToggleStatus(selectedUser);
                        setSelectedUser(null);
                      }}
                      size="sm"
                      className={`rounded-xl text-xs font-bold ${
                        selectedUser.status === "ACTIVE"
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {selectedUser.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Atomic Super Admin Transfer Confirmation Modal */}
      {transferTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5 text-amber-600">
                <Crown className="h-6 w-6" />
                <h3 className="text-base font-bold text-foreground">
                  Transfer Platform Ownership
                </h3>
              </div>
              <button
                onClick={() => {
                  setTransferTargetUser(null);
                  setTransferConfirmText("");
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted-foreground">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-2">
                <p className="font-bold text-amber-600 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Strict Single Super Admin Invariant
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The platform strictly maintains <strong className="text-foreground">exactly ONE active Super Admin</strong>.
                  Transferring Super Admin status will atomically grant root platform privileges to:
                </p>
                <div className="p-2.5 rounded-lg bg-card border border-border text-foreground font-semibold">
                  <p>{transferTargetUser.name || "No name"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{transferTargetUser.email}</p>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  ⚠️ Your current account will be safely demoted to Standard User. This transaction is atomic and irreversible without the new Super Admin transferring it back.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground block">
                  Type <span className="font-mono text-rose-500 font-bold">TRANSFER</span> to confirm:
                </label>
                <input
                  type="text"
                  value={transferConfirmText}
                  onChange={(e) => setTransferConfirmText(e.target.value)}
                  placeholder="TRANSFER"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/60">
                <Button
                  onClick={() => {
                    setTransferTargetUser(null);
                    setTransferConfirmText("");
                  }}
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteTransfer}
                  disabled={transferConfirmText.trim().toUpperCase() !== "TRANSFER" || isTransferring}
                  size="sm"
                  className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isTransferring ? "Transferring..." : "Confirm & Transfer Ownership"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 8. User Account Deletion Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5 text-rose-600">
                <Trash2 className="h-6 w-6" />
                <h3 className="text-base font-bold text-foreground">
                  Delete User Account
                </h3>
              </div>
              <button
                onClick={() => {
                  setDeleteTargetUser(null);
                  setDeleteConfirmText("");
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted-foreground">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-foreground space-y-2">
                <p className="font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Permanent Account Deletion
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are about to permanently delete the user account:
                </p>
                <div className="p-2.5 rounded-lg bg-card border border-border text-foreground font-semibold">
                  <p>{deleteTargetUser.name || "No name"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{deleteTargetUser.email}</p>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                  ⚠️ This action will remove all organization memberships, revoke active sessions, and dissociate assigned CRM records. This action cannot be undone.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground block">
                  Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/60">
                <Button
                  onClick={() => {
                    setDeleteTargetUser(null);
                    setDeleteConfirmText("");
                  }}
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteDelete}
                  disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                  size="sm"
                  className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete User"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CRMPageContainer>
  );
}
