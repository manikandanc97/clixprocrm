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
  CRMMetricsGrid,
  CRMMetricCard,
  CRMToolbar,
  CRMPagination,
  CRMRoleBadge,
} from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [superAdminOnly, setSuperAdminOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [transferTargetUser, setTransferTargetUser] = useState<PlatformUser | null>(null);
  const [transferConfirmText, setTransferConfirmText] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<PlatformUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination State
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

  const totalSuperAdmins = useMemo(
    () => users.filter((u) => u.isSuperAdmin).length,
    [users]
  );
  const totalActiveUsers = useMemo(
    () => users.filter((u) => u.status === "ACTIVE").length,
    [users]
  );

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

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / rowsPerPage));
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Standard CRM Page Header */}
      <CRMPageHeader
        title="Platform Users"
        subtitle="Global user directory, administrative privilege control, and cross-organization access."
        icon={Users}
        badge="Platform Directory"
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
            onClick: loadUsers,
            variant: "outline",
          },
        ]}
      />

      {/* 2. Standard CRM KPI Metrics Grid */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={3}>
          <CRMMetricCard
            title="Total Accounts"
            value={users.length}
            change={`${users.length} Registered`}
            trend="neutral"
            icon={Users}
            color="blue"
            loading={loading}
          />
          <CRMMetricCard
            title="Super Admins"
            value={totalSuperAdmins}
            change="Platform Root Admins"
            trend="up"
            icon={Crown}
            color="purple"
            loading={loading}
          />
          <CRMMetricCard
            title="Active Accounts"
            value={totalActiveUsers}
            change={`${users.length - totalActiveUsers} Inactive/Suspended`}
            trend="up"
            icon={ShieldCheck}
            color="emerald"
            loading={loading}
          />
        </CRMMetricsGrid>
      </div>

      {/* 3. Two-Stage Scroll Workspace */}
      <div className="crm-table-workspace-sticky">
        <CRMToolbar
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Search by name, email, or role..."
          sticky={false}
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* Super Admin filter chip */}
            <button
              onClick={() => setSuperAdminOnly(!superAdminOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                superAdminOnly
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Super Admins</span>
            </button>

            {/* Status Tabs */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 shadow-sm">
              {(["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </CRMToolbar>

        {/* 4. Standard CRM Data Table */}
        <div className={cn("crm-table-wrap", (loading || sortedUsers.length <= rowsPerPage) && "crm-table-no-pagination")}>
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                    <DataTableColumnHeader
                      title="User"
                      sortable
                      sortDirection={sortConfig.key === "name" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("name", dir)}
                    />
                  </th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                    <DataTableColumnHeader
                      title="Platform Role"
                      sortable
                      sortDirection={sortConfig.key === "role" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("role", dir)}
                    />
                  </th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card">Organizations &amp; Role</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                    <DataTableColumnHeader
                      title="Status"
                      sortable
                      sortDirection={sortConfig.key === "status" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("status", dir)}
                    />
                  </th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                    <DataTableColumnHeader
                      title="Created Date"
                      sortable
                      sortDirection={sortConfig.key === "createdAt" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("createdAt", dir)}
                    />
                  </th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">Actions</th>
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
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-muted rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-3.5 w-28 bg-muted rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-muted rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-3.5 w-20 bg-muted rounded" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-16 bg-muted rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="group h-16 hover:bg-muted/[0.03] transition-colors"
                    >
                      {/* User Avatar & Info */}
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                            {u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              onClick={() => setSelectedUser(u)}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate max-w-[200px]"
                              title={u.name || u.email}
                            >
                              {u.name || "No name registered"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Platform Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-sm whitespace-nowrap">
                            <Crown className="h-3.5 w-3.5 shrink-0" />
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                            Standard User
                          </span>
                        )}
                      </td>

                      {/* Organizations */}
                      <td className="px-6 py-4">
                        {u.organizations && u.organizations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {u.organizations.map((org: any) => (
                              <div
                                key={org.tenantId}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/60 border border-border text-xs"
                              >
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold text-foreground">{org.name}</span>
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
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={u.status === "ACTIVE" ? "Active" : u.status === "SUSPENDED" ? "Suspended" : "Inactive"}
                          variant={u.status === "ACTIVE" ? "emerald" : u.status === "SUSPENDED" ? "rose" : "neutral"}
                        />
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
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
                            <DropdownMenuContent
                              align="end"
                              className="rounded-xl w-56 shadow-lg border-border"
                            >
                              <DropdownMenuLabel className="text-xs">
                                Manage Account
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setSelectedUser(u)}
                                className="text-xs gap-2 cursor-pointer font-medium"
                              >
                                <AppIcon name="quotations" size={14} className="text-primary" />
                                <span>View User Profile</span>
                              </DropdownMenuItem>

                              {!u.isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setTransferTargetUser(u)}
                                    className="text-xs gap-2 cursor-pointer font-medium text-amber-600 focus:text-amber-600 focus:bg-amber-500/10 hover:text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 dark:focus:text-amber-400 dark:focus:bg-amber-500/20 not-data-[variant=destructive]:focus:**:!text-amber-600 not-data-[variant=destructive]:hover:**:!text-amber-600"
                                  >
                                    <AppIcon name="security" size={14} className="text-amber-500" />
                                    <span>Transfer Super Admin</span>
                                  </DropdownMenuItem>
                                </>
                              )}

                              {!u.isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  {u.status === "ACTIVE" ? (
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => handleToggleStatus(u)}
                                      className="text-xs gap-2 cursor-pointer font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 hover:text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:focus:text-rose-400 dark:focus:bg-rose-500/20"
                                    >
                                      <AppIcon name="security" size={14} className="text-rose-500 dark:text-rose-400" />
                                      <span>Suspend Account</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleToggleStatus(u)}
                                      className="text-xs gap-2 cursor-pointer font-medium text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10 hover:text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:focus:text-emerald-400 dark:focus:bg-emerald-500/20"
                                    >
                                      <AppIcon name="checkCircle" size={14} className="text-emerald-500" />
                                      <span>Re-activate Account</span>
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}

                              {!u.isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteTargetUser(u)}
                                    className="text-xs gap-2 cursor-pointer font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 hover:text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:focus:text-rose-400 dark:focus:bg-rose-500/20"
                                  >
                                    <AppIcon name="trash" size={14} className="text-rose-500 dark:text-rose-400" />
                                    <span>Delete User</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 border-0">
                      <EmptyState
                        icon={Users}
                        title="No users found"
                        description="No platform users match your search query or filter criteria."
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
        {!loading && filteredUsers.length > 0 && (
          <CRMPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            itemName="Platform Users"
          />
        )}
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
