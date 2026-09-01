"use client";

import React, { useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  Users,
  Plus,
} from "lucide-react";
import {
  CRMMetricsGrid,
  CRMMetricCard,
  CRMToolbar,
  DataTable,
  CRMTableHeader,
  CRMTableBody,
  CRMTableRow,
  CRMTableHeaderCell,
  CRMPagination,
} from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { RoleManagementSkeleton } from "../RoleManagementSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/features/auth/components/auth-provider";
import client from "@/shared/lib/api/client";
import { RoleEditorModal } from "./RoleEditorModal";
import { RoleDetailsDialog } from "./RoleDetailsDialog";
import { RoleDeleteDialog } from "./RoleDeleteDialog";
import { RoleTableRows } from "./RoleTableRows";

interface RolePermission {
  module: string;
  hasAccess: boolean;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  color?: string | null;
  priority?: number;
  permissions: RolePermission[];
  _count?: { users: number; permissions: number; invitations?: number };
}

const ROLE_SYSTEM_COLORS: Record<string, string> = {
  "SUPER ADMIN": "#6366f1", // Indigo
  ADMIN: "#3b82f6",         // Royal Blue
  MANAGER: "#8b5cf6",       // Violet / Purple
  SALES: "#f59e0b",         // Amber / Orange
  EMPLOYEE: "#10b981",      // Emerald Green
  SUPPORT: "#ec4899",       // Pink
  FINANCE: "#06b6d4",       // Cyan
  MARKETING: "#f43f5e",     // Rose
};

export const getRoleColor = (role?: Role | null): string => {
  if (!role) return "#10b981";
  const upper = (role.name || "").trim().toUpperCase();
  if (role.isSystem && ROLE_SYSTEM_COLORS[upper]) {
    return ROLE_SYSTEM_COLORS[upper];
  }
  if (role.color && role.color !== "#10b981") {
    return role.color;
  }
  if (ROLE_SYSTEM_COLORS[upper]) {
    return ROLE_SYSTEM_COLORS[upper];
  }
  const customPalette = [
    "#8b5cf6",
    "#3b82f6",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#06b6d4",
    "#f43f5e",
    "#6366f1",
  ];
  let hash = 0;
  for (let i = 0; i < role.name.length; i++) {
    hash = role.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return customPalette[Math.abs(hash) % customPalette.length];
};

export function RoleList({ onCreateRoleTrigger }: { onCreateRoleTrigger?: () => void }) {
  const queryClient = useQueryClient();
  const { user, isHydrated, isAuthenticated, isInitializing } = useAuth();
  const currentUserRole = (user?.role || "EMPLOYEE").toUpperCase();
  const canManageRoles =
    currentUserRole === "SUPER ADMIN" ||
    currentUserRole === "ADMIN" ||
    currentUserRole === "OWNER";

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300) || "";

  // Modal states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [replacementRoleId, setReplacementRoleId] = useState<string>("");

  // Editor Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    permissions: [] as string[],
  });

  // Queries
  const { data: rolesData, isLoading: isRolesLoading, isPending: isRolesPending } = useQuery<{
    success: boolean;
    data: Role[];
  }>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await client.get("/crm/roles");
      return res.data;
    },
  });

  const { data: statsData, isLoading: isStatsLoading } = useQuery<{
    success: boolean;
    data: any;
  }>({
    queryKey: ["roles-stats"],
    queryFn: async () => {
      try {
        const res = await client.get("/crm/role-management/stats");
        return res.data;
      } catch {
        return null;
      }
    },
  });

  const roles = Array.isArray(rolesData?.data) ? rolesData.data : [];
  const stats = useMemo(() => {
    const rawStats = statsData?.data;
    if (rawStats) {
      const totalRoles = rawStats.roles?.total ?? rawStats.total ?? roles.length;
      const customRoles = rawStats.roles?.custom ?? rawStats.custom ?? roles.filter((r) => !r.isSystem).length;
      const totalUsers = rawStats.users?.total ?? rawStats.totalAssignedUsers ?? roles.reduce((acc, r) => acc + (r._count?.users || 0), 0);
      return {
        total: totalRoles,
        custom: customRoles,
        totalAssignedUsers: totalUsers,
      };
    }
    return {
      total: roles.length,
      system: roles.filter((r) => r.isSystem).length,
      custom: roles.filter((r) => !r.isSystem).length,
      totalAssignedUsers: roles.reduce(
        (acc, r) => acc + (r._count?.users || 0),
        0,
      ),
    };
  }, [roles, statsData]);

  const isLoading = !rolesData && (isRolesLoading || isRolesPending || !isHydrated || !isAuthenticated || isInitializing);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    if (!debouncedSearch.trim()) return roles;
    const q = debouncedSearch.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }, [roles, debouncedSearch]);

  const totalPages = Math.ceil(filteredRoles.length / rowsPerPage) || 1;
  const paginatedRoles = useMemo(() => {
    return filteredRoles.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredRoles, currentPage, rowsPerPage]);

  const availableReplacementRoles = useMemo(() => {
    if (!deletingRole) return [];
    return roles.filter((r) => r.id !== deletingRole.id);
  }, [roles, deletingRole]);

  // Check form dirty
  const isFormDirty = useMemo(() => {
    if (!editingRole) return true;
    if (formData.name !== editingRole.name) return true;
    if ((formData.color || "") !== (editingRole.color || "#3b82f6")) return true;
    const initialPerms = (editingRole.permissions || [])
      .filter((p) => p.hasAccess)
      .map((p) => p.module);
    if (formData.permissions.length !== initialPerms.length) return true;
    const currentSet = new Set(formData.permissions);
    return !initialPerms.every((p) => currentSet.has(p));
  }, [formData, editingRole]);

  // Mutations
  const saveRoleMutation = useMutation({
    mutationFn: async ({
      roleId,
      isNew,
      payload,
    }: {
      roleId?: string;
      isNew: boolean;
      payload: any;
    }) => {
      if (isNew) {
        const res = await client.post("/crm/roles", payload);
        return res.data;
      } else {
        const res = await client.put(`/crm/roles/${roleId}`, payload);
        return res.data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles-stats"] });
      toast.success(
        variables.isNew
          ? "Role created successfully!"
          : "Role updated successfully!",
      );
      setEditorOpen(false);
      setEditingRole(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to save role";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async ({
      roleId,
      replacementId,
    }: {
      roleId: string;
      replacementId?: string;
    }) => {
      const query = replacementId ? `?replacementRoleId=${replacementId}` : "";
      const res = await client.delete(`/crm/roles/${roleId}${query}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles-stats"] });
      toast.success("Role deleted successfully!");
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      setReplacementRoleId("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to delete role";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    if (onCreateRoleTrigger) {
      onCreateRoleTrigger();
      return;
    }
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      permissions: [],
    });
    setEditorOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    const activePerms = (role.permissions || [])
      .filter((p) => p.hasAccess)
      .map((p) => p.module);
    setFormData({
      name: role.name,
      description: role.description || "",
      color: role.color || getRoleColor(role),
      permissions: activePerms,
    });
    setEditorOpen(true);
  };

  const handleOpenView = (role: Role) => {
    setViewingRole(role);
    setViewDialogOpen(true);
  };

  const handleOpenDelete = (role: Role) => {
    setDeletingRole(role);
    setReplacementRoleId("");
    setDeleteDialogOpen(true);
  };

  const handleSaveEditor = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      color: formData.color,
      permissions: formData.permissions.map((module) => ({
        module,
        hasAccess: true,
      })),
    };

    saveRoleMutation.mutate({
      roleId: editingRole?.id,
      isNew: !editingRole,
      payload,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingRole) return;
    deleteRoleMutation.mutate({
      roleId: deletingRole.id,
      replacementId: replacementRoleId || undefined,
    });
  };

  if (isLoading) return <RoleManagementSkeleton />;

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3.5 sm:gap-4">
      {/* ── Standard CRMMetricsGrid matching Contacts & Employees ── */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={3}>
          <CRMMetricCard
            title="Total Roles"
            value={stats.total}
            change="0%"
            trend="up"
            icon={Shield}
            color="indigo"
            delay={0.1}
          />
          <CRMMetricCard
            title="Custom Roles"
            value={stats.custom}
            change="Custom"
            trend="up"
            icon={ShieldCheck}
            color="emerald"
            delay={0.2}
          />
          <CRMMetricCard
            title="Assigned Users"
            value={stats.totalAssignedUsers}
            change="Members"
            trend="up"
            icon={Users}
            color="orange"
            delay={0.3}
          />
        </CRMMetricsGrid>
      </div>

      {/* ── Two-Stage Scroll Workspace ── */}
      <div className="crm-table-workspace-sticky">
        {/* ── Standard CRMToolbar with Search & Action ── */}
        <CRMToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search roles by name or description..."
          sticky={false}
        >
          {canManageRoles && (
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          )}
        </CRMToolbar>

        {/* ── Standard DataTable ── */}
        <div className="flex-1 min-h-0 flex flex-col">
          <DataTable hasPagination={filteredRoles.length > rowsPerPage}>
            <CRMTableHeader>
              <CRMTableRow>
                <CRMTableHeaderCell className="w-[32%]">Role Name</CRMTableHeaderCell>
                <CRMTableHeaderCell className="w-[18%]">Assigned Users</CRMTableHeaderCell>
                <CRMTableHeaderCell className="w-[45%]">Permission Modules</CRMTableHeaderCell>
                <CRMTableHeaderCell className="w-[5%] text-right">Actions</CRMTableHeaderCell>
              </CRMTableRow>
            </CRMTableHeader>
            <CRMTableBody>
              <RoleTableRows
                roles={paginatedRoles}
                canManageRoles={canManageRoles}
                currentUserRole={currentUserRole}
                getRoleColor={getRoleColor}
                onViewRole={handleOpenView}
                onEditRole={handleOpenEdit}
                onDeleteRole={handleOpenDelete}
              />
            </CRMTableBody>
          </DataTable>
        </div>

        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRoles.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setCurrentPage(1);
          }}
          itemName="Roles"
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* ── Create / Edit Role Modal ── */}
      <RoleEditorModal
        isOpen={editorOpen}
        onOpenChange={setEditorOpen}
        editingRole={editingRole}
        formData={formData}
        setFormData={setFormData}
        isFormDirty={isFormDirty}
        isPending={saveRoleMutation.isPending}
        onSave={handleSaveEditor}
      />

      {/* ── View Role Details Modal ── */}
      <RoleDetailsDialog
        isOpen={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        role={viewingRole}
        roleColor={getRoleColor(viewingRole)}
      />

      {/* ── Safe Delete & Reassignment Modal ── */}
      <RoleDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deletingRole={deletingRole}
        replacementRoleId={replacementRoleId}
        setReplacementRoleId={setReplacementRoleId}
        availableReplacementRoles={availableReplacementRoles}
        isPending={deleteRoleMutation.isPending}
        onConfirmDelete={handleDeleteConfirm}
      />
    </div>
  );
}
