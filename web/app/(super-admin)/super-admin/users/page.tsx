"use client";

import { useEffect, useState, useMemo } from "react";
import { Users } from "lucide-react";
import {
  fetchPlatformUsers,
  updatePlatformUserStatus,
  transferSuperAdminRole,
  deletePlatformUser,
  PlatformUser,
} from "@/shared/lib/api/super-admin.api";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
  CRMDeleteDialog,
  CRMPagination,
} from "@/shared/components/crm";
import { SortDirection } from "@/shared/components/DataTableColumnHeader";
import { UsersTableToolbar } from "./components/UsersTableToolbar";
import { UsersTable } from "./components/UsersTable";
import {
  UserDetailModal,
  UserTransferDialog,
  UserDeleteDialog,
} from "./components/UserModals";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [superAdminOnly, setSuperAdminOnly] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
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
      const res = await fetchPlatformUsers({ limit: 1000 });
      setUsers(res.users || []);
    } catch {
      toast.error("Failed to load platform users.");
    } finally {
      setLoading(false);
    }
  };

  const [prevFilterKey, setPrevFilterKey] = useState(`${search}::${statusFilter}::${superAdminOnly}`);
  const currentFilterKey = `${search}::${statusFilter}::${superAdminOnly}`;
  if (currentFilterKey !== prevFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  useEffect(() => {
    let active = true;
    fetchPlatformUsers({ limit: 1000 })
      .then((res) => {
        if (!active) return;
        setUsers(res.users || []);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Failed to load platform users.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleAal2Verified = () => { loadUsers(); };
    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      active = false;
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

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
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to transfer Super Admin ownership.";
      toast.error(errorMsg);
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
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to delete user account.";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: PlatformUser) => {
    if (user.isSuperAdmin) {
      toast.error("Cannot deactivate or suspend the sole active Platform Super Admin.");
      return;
    }
    const nextStatus: "ACTIVE" | "SUSPENDED" = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg = `Are you sure you want to ${
      nextStatus === "SUSPENDED" ? "suspend" : "activate"
    } user "${user.name || user.email}"?`;
    if (!confirm(confirmMsg)) return;
    try {
      await updatePlatformUserStatus(user.id, nextStatus);
      toast.success(`User status updated to ${nextStatus}.`);
      loadUsers();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update user status.";
      toast.error(errorMsg);
    }
  };

  const exportCSV = () => {
    if (users.length === 0) { toast.error("No users available to export."); return; }
    const headers = ["ID", "Name", "Email", "Role", "Status", "Created At"];
    const rows = users.map((u) => [
      u.id, `"${u.name || ""}"`, u.email,
      u.isSuperAdmin ? "SUPER_ADMIN" : "USER", u.status, u.createdAt,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_platform_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users exported successfully.");
  };

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null,
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (superAdminOnly && !u.isSuperAdmin) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (u.name && u.name.toLowerCase().includes(q)) || u.email.toLowerCase().includes(q);
    });
  }, [users, search, statusFilter, superAdminOnly]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (!sortConfig.direction) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      if (sortConfig.key === "name") {
        return (a.name || a.email || "").localeCompare(b.name || b.email || "") * dir;
      }
      if (sortConfig.key === "role") {
        const roleA = a.isSuperAdmin ? "SUPER_ADMIN" : "USER";
        const roleB = b.isSuperAdmin ? "SUPER_ADMIN" : "USER";
        return roleA.localeCompare(roleB) * dir;
      }
      if (sortConfig.key === "status") return (a.status || "").localeCompare(b.status || "") * dir;
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

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...paginatedUsers.map((u) => u.id)])));
    } else {
      const pageIds = new Set(paginatedUsers.map((u) => u.id));
      setSelectedUserIds(selectedUserIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      await Promise.all(selectedUserIds.map((id) => deletePlatformUser(id)));
      toast.success(`${selectedUserIds.length} user(s) deleted successfully.`);
      setSelectedUserIds([]);
      setIsBulkDeleteOpen(false);
      loadUsers();
    } catch {
      toast.error("Failed to delete selected users.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* Header */}
      <CRMPageHeader
        title="Platform Users"
        description="Manage platform authentication, global roles, and user lifecycle."
        icon={Users}
      />

      {/* Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <UsersTableToolbar
          superAdminOnly={superAdminOnly}
          setSuperAdminOnly={setSuperAdminOnly}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          search={search}
          setSearch={setSearch}
          selectedCount={selectedUserIds.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setStatusFilter("ALL");
            setSuperAdminOnly(false);
            setSearch("");
            setCurrentPage(1);
          }}
          onBulkDelete={() => setIsBulkDeleteOpen(true)}
          onExport={exportCSV}
        />

        <UsersTable
          users={paginatedUsers}
          loading={loading}
          selectedUserIds={selectedUserIds}
          onToggleSelectUser={handleToggleSelectUser}
          onToggleSelectAll={handleToggleSelectAll}
          sortConfig={sortConfig}
          onSort={(key, direction) => setSortConfig({ key, direction })}
          onViewUser={setSelectedUser}
          onTransferUser={setTransferTargetUser}
          onDeleteUser={setDeleteTargetUser}
          onToggleStatus={handleToggleStatus}
        />

        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
          itemName="Users"
        />
      </div>

      {/* Modals */}
      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onTransfer={setTransferTargetUser}
        onDelete={setDeleteTargetUser}
        onToggleStatus={handleToggleStatus}
      />

      <UserTransferDialog
        user={transferTargetUser}
        confirmText={transferConfirmText}
        setConfirmText={setTransferConfirmText}
        isTransferring={isTransferring}
        onConfirm={handleExecuteTransfer}
        onClose={() => {
          setTransferTargetUser(null);
          setTransferConfirmText("");
        }}
      />

      <UserDeleteDialog
        user={deleteTargetUser}
        confirmText={deleteConfirmText}
        setConfirmText={setDeleteConfirmText}
        isDeleting={isDeleting}
        onConfirm={handleExecuteDelete}
        onClose={() => {
          setDeleteTargetUser(null);
          setDeleteConfirmText("");
        }}
      />

      <CRMDeleteDialog
        mode="bulk"
        isOpen={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title={`Delete ${selectedUserIds.length} Selected Users?`}
        itemName="User"
        selectedCount={selectedUserIds.length}
        description="This will permanently delete all selected users. This action cannot be undone."
        warningText="All sessions, permissions, and associated platform records for these users will be permanently removed."
        confirmLabel="Delete Selected"
        onConfirm={handleConfirmBulkDelete}
        isDeleting={isBulkDeleting}
      />
    </CRMPageContainer>
  );
}
