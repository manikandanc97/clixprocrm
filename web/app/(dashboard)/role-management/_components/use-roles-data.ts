"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/components/auth-provider";
import client from "@/shared/lib/api/client";
import { toast } from "sonner";
import { Role, RoleFormData, RoleSortConfig } from "@/shared/types/role";
import { getRoleColor } from "./role-utils";

export interface UseRolesDataReturn {
  // Roles Data
  roles: Role[];
  filteredRoles: Role[];
  paginatedRoles: Role[];
  isInitialLoading: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;

  // Permissions & Auth
  canManageRoles: boolean;
  canEditRole: (role: Role) => boolean;

  // Search & Filters
  search: string;
  setSearch: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;

  // Sorting
  sortConfig: RoleSortConfig | null;
  setSort: (key: string, direction: "asc" | "desc" | null) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  totalRoles: number;

  // Editor Modal State & Handlers
  editorOpen: boolean;
  setEditorOpen: (open: boolean) => void;
  editingRole: Role | null;
  formData: RoleFormData;
  setFormData: React.Dispatch<React.SetStateAction<RoleFormData>>;
  isFormDirty: boolean;
  isSaving: boolean;
  handleOpenCreate: () => void;
  handleOpenEdit: (role: Role) => void;
  handleSaveEditor: () => void;

  // View Details State & Handlers
  viewDialogOpen: boolean;
  setViewDialogOpen: (open: boolean) => void;
  viewingRole: Role | null;
  handleOpenView: (role: Role) => void;

  // Delete Dialog State & Handlers
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  deletingRole: Role | null;
  replacementRoleId: string;
  setReplacementRoleId: (id: string) => void;
  availableReplacementRoles: Role[];
  isDeleting: boolean;
  handleOpenDelete: (role: Role) => void;
  handleDeleteConfirm: () => void;

  // Export
  exportCSV: () => void;
}

export function useRolesData(): UseRolesDataReturn {
  const queryClient = useQueryClient();
  const { user, isHydrated, isAuthenticated, isInitializing } = useAuth();

  const userRoleRaw = useMemo(() => {
    const raw =
      typeof user?.role === "string"
        ? user.role
        : (user?.role as unknown as { name?: string })?.name ||
          (user as unknown as { roleName?: string })?.roleName ||
          "ADMIN";
    return raw.toUpperCase().replace(/[\s_-]+/g, "");
  }, [user]);

  const canManageRoles = useMemo(() => {
    return (
      !isHydrated ||
      userRoleRaw.includes("SUPERADMIN") ||
      userRoleRaw.includes("ADMIN") ||
      userRoleRaw.includes("OWNER") ||
      userRoleRaw.includes("MANAGER") ||
      userRoleRaw === ""
    );
  }, [isHydrated, userRoleRaw]);

  const canEditRole = useCallback(
    (role: Role) => {
      const isSuperAdmin = role.name.toUpperCase() === "SUPER ADMIN";
      return (
        canManageRoles &&
        !(
          userRoleRaw.includes("ADMIN") &&
          !userRoleRaw.includes("SUPERADMIN") &&
          isSuperAdmin
        )
      );
    },
    [canManageRoles, userRoleRaw]
  );

  // Filter & Search states
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<RoleSortConfig | null>(null);

  const setSort = useCallback((key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  }, []);

  // Modal states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [replacementRoleId, setReplacementRoleId] = useState<string>("");

  // Editor Form State
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    color: "#3b82f6",
    permissions: [],
  });

  // Queries
  const {
    data: rolesData,
    isLoading: isRolesLoading,
    isPending: isRolesPending,
    isError,
    error,
    refetch,
  } = useQuery<{
    success: boolean;
    data: Role[];
  }>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await client.get("/crm/roles");
      return res.data;
    },
  });

  const roles = useMemo(() => (Array.isArray(rolesData?.data) ? rolesData.data : []), [rolesData]);

  // Mutations
  const saveRoleMutation = useMutation({
    mutationFn: async ({
      roleId,
      isNew,
      payload,
    }: {
      roleId?: string;
      isNew: boolean;
      payload: {
        name: string;
        description: string | null;
        color: string;
        permissions: string[];
      };
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
        variables.isNew ? "Role created successfully!" : "Role updated successfully!"
      );
      setEditorOpen(false);
      setEditingRole(null);
    },
    onError: (err: unknown) => {
      const errResponse = (err as { response?: { data?: { message?: string | object } } })?.response?.data;
      const msg = errResponse?.message || "Failed to save role";
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
    onError: (err: unknown) => {
      const errResponse = (err as { response?: { data?: { message?: string | object } } })?.response?.data;
      const msg = errResponse?.message || "Failed to delete role";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  // Action handlers
  const handleOpenCreate = useCallback(() => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      permissions: [],
    });
    setEditorOpen(true);
  }, []);

  const handleOpenEdit = useCallback((role: Role) => {
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
  }, []);

  const handleOpenView = useCallback((role: Role) => {
    setViewingRole(role);
    setViewDialogOpen(true);
  }, []);

  const handleOpenDelete = useCallback((role: Role) => {
    if (role.isSystem) {
      toast.error(`System default role "${role.name}" cannot be deleted.`);
      return;
    }
    setDeletingRole(role);
    setReplacementRoleId("");
    setDeleteDialogOpen(true);
  }, []);

  const handleSaveEditor = useCallback(() => {
    if (!formData.name.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      color: formData.color,
      permissions: formData.permissions,
    };

    saveRoleMutation.mutate({
      roleId: editingRole?.id,
      isNew: !editingRole,
      payload,
    });
  }, [formData, editingRole, saveRoleMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingRole) return;
    deleteRoleMutation.mutate({
      roleId: deletingRole.id,
      replacementId: replacementRoleId || undefined,
    });
  }, [deletingRole, replacementRoleId, deleteRoleMutation]);

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

  const availableReplacementRoles = useMemo(() => {
    if (!deletingRole) return [];
    return roles.filter((r) => r.id !== deletingRole.id);
  }, [roles, deletingRole]);

  const hasActiveFilters = typeFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setTypeFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  }, []);

  const exportCSV = useCallback(() => {
    if (roles.length === 0) {
      toast.error("No roles available to export.");
      return;
    }
    const headers = ["Role Name", "Type", "Assigned Users", "Description"];
    const rows = roles.map((r: Role) => [
      `"${r.name.replace(/"/g, '""')}"`,
      r.isSystem ? "System" : "Custom",
      r._count?.users || 0,
      `"${(r.description || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_roles_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [roles]);

  // Filter and sort logic
  const filteredRoles = useMemo(() => {
    return roles
      .filter((role: Role) => {
        const q = search.trim().toLowerCase();
        const matchSearch =
          q === "" ||
          role.name.toLowerCase().includes(q) ||
          (role.description && role.description.toLowerCase().includes(q));

        const matchType =
          typeFilter === "ALL" ||
          (typeFilter === "SYSTEM" && role.isSystem) ||
          (typeFilter === "CUSTOM" && !role.isSystem);

        return matchSearch && matchType;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        const dir = sortConfig.direction === "asc" ? 1 : -1;

        if (sortConfig.key === "name") {
          return a.name.localeCompare(b.name) * dir;
        }
        if (sortConfig.key === "users") {
          return ((a._count?.users || 0) - (b._count?.users || 0)) * dir;
        }
        return 0;
      });
  }, [roles, search, typeFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / rowsPerPage));
  const paginatedRoles = useMemo(() => {
    return filteredRoles.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredRoles, currentPage, rowsPerPage]);

  const isInitialLoading =
    !rolesData &&
    (isRolesLoading || isRolesPending || !isHydrated || !isAuthenticated || isInitializing);

  return {
    roles,
    filteredRoles,
    paginatedRoles,
    isInitialLoading,
    isLoading: isRolesLoading,
    isError,
    error,
    refetch,
    canManageRoles,
    canEditRole,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    hasActiveFilters,
    handleClearFilters,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    totalRoles: filteredRoles.length,
    editorOpen,
    setEditorOpen,
    editingRole,
    formData,
    setFormData,
    isFormDirty,
    isSaving: saveRoleMutation.isPending,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveEditor,
    viewDialogOpen,
    setViewDialogOpen,
    viewingRole,
    handleOpenView,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deletingRole,
    replacementRoleId,
    setReplacementRoleId,
    availableReplacementRoles,
    isDeleting: deleteRoleMutation.isPending,
    handleOpenDelete,
    handleDeleteConfirm,
    exportCSV,
  };
}
