"use client";

import React, { useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  Users,
  Plus,
  Search,
  X,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  RotateCcw,
  User,
  Edit2,
  Lock,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { CRMPageContainer } from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/components/auth-provider";
import client from "@/shared/lib/api/client";
import { normalizeToModuleTitle } from "@/shared/lib/auth/rbac";
import { RoleEditorModal } from "./_components/RoleEditorModal";
import { RoleDetailsDialog } from "./_components/RoleDetailsDialog";
import { RoleDeleteDialog } from "./_components/RoleDeleteDialog";
import { getRoleColor } from "./_components/RoleList";

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

export default function RoleManagementPage() {
  const queryClient = useQueryClient();
  const { user, isHydrated, isAuthenticated, isInitializing } = useAuth();
  const userRoleRaw = (
    typeof user?.role === "string"
      ? user.role
      : (user?.role as any)?.name || (user as any)?.roleName || "ADMIN"
  )
    .toUpperCase()
    .replace(/[\s_-]+/g, "");

  const canManageRoles =
    !isHydrated ||
    userRoleRaw.includes("SUPERADMIN") ||
    userRoleRaw.includes("ADMIN") ||
    userRoleRaw.includes("OWNER") ||
    userRoleRaw.includes("MANAGER") ||
    userRoleRaw === "";

  // Filter & Search states
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  // Modals state
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
        variables.isNew ? "Role created successfully!" : "Role updated successfully!"
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
    if (role.isSystem) {
      toast.error(`System default role "${role.name}" cannot be deleted.`);
      return;
    }
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
      permissions: formData.permissions,
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

  const handleClearFilters = () => {
    setTypeFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const exportCSV = () => {
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
      [headers.join(","), ...rows.map((row: (string | number)[]) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_roles_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort logic
  const filteredRoles = useMemo(() => {
    return roles.filter((role: Role) => {
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
    }).sort((a, b) => {
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
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isInitialLoading =
    !rolesData && (isRolesLoading || isRolesPending || !isHydrated || !isAuthenticated || isInitializing);

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
              name="shield"
              icon={Shield}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Role Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure access control, module permissions, and manage user roles across your organization.
            </p>
          </div>
        </div>

        {canManageRoles && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenCreate}
              className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
            >
              <AppIcon
                name="plus"
                icon={Plus}
                size={14}
                className="w-3.5 h-3.5 text-white shrink-0"
              />
              <span>Add Role</span>
            </Button>
          </div>
        )}
      </div>

      {/* 2. Main Card Container */}
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
              <option value="SYSTEM">System Roles</option>
              <option value="CUSTOM">Custom Roles</option>
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
                placeholder="Search roles by name..."
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

        {/* Table Content */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
            <colgroup>
              <col style={{ width: "260px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "360px" }} />
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
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
                    <span>Role Name</span>
                    {sortConfig?.key === "name" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Type</span>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "users",
                      sortConfig?.key === "users" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Assigned Users</span>
                    {sortConfig?.key === "users" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Permission Modules</span>
                </th>
                <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-muted rounded-lg shrink-0" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="h-3.5 w-28 bg-muted rounded" />
                          <div className="h-2.5 w-20 bg-muted/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-48 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-6 w-6 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedRoles.length > 0 ? (
                paginatedRoles.map((role: Role) => {
                  const isSuperAdmin = role.name.toUpperCase() === "SUPER ADMIN";
                  const isAdmin = role.name.toUpperCase() === "ADMIN";
                  const canEditThis =
                    canManageRoles &&
                    !(
                      userRoleRaw.includes("ADMIN") &&
                      !userRoleRaw.includes("SUPERADMIN") &&
                      isSuperAdmin
                    );

                  const rawPermissions = role.permissions || [];
                  const activePermModules: string[] =
                    isAdmin || isSuperAdmin
                      ? ["Full Workspace Access"]
                      : Array.from(
                          new Set(
                            rawPermissions
                              .filter((p: any) => p.hasAccess)
                              .map(
                                (p: any) =>
                                  (normalizeToModuleTitle(p.module) || p.module) as string
                              )
                          )
                        );

                  const color = getRoleColor(role);

                  return (
                    <tr
                      key={role.id}
                      className="group h-16 hover:bg-muted/30 transition-colors"
                    >
                      {/* Role Name */}
                      <td className="px-4 py-3.5 font-medium overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs border shrink-0"
                            style={{
                              backgroundColor: `${color}15`,
                              borderColor: `${color}30`,
                              color: color,
                            }}
                          >
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => handleOpenView(role)}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate"
                            >
                              {role.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {role.description || (role.isSystem ? "Built-in system role" : "Custom role")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                            role.isSystem
                              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                          )}
                        >
                          {role.isSystem ? (
                            <>
                              <Lock className="w-3 h-3" />
                              System
                            </>
                          ) : (
                            "Custom"
                          )}
                        </span>
                      </td>

                      {/* Assigned Users */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-bold">{role._count?.users || 0}</span>
                          <span className="text-muted-foreground">users</span>
                        </div>
                      </td>

                      {/* Permission Modules */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {activePermModules.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">
                              No permissions assigned
                            </span>
                          ) : (
                            <>
                              {activePermModules.slice(0, 3).map((mod) => (
                                <Badge
                                  key={mod}
                                  variant="secondary"
                                  className="font-normal text-[11px] bg-muted/60 text-muted-foreground hover:bg-muted"
                                >
                                  {mod}
                                </Badge>
                              ))}
                              {activePermModules.length > 3 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="font-normal text-[11px] border-dashed text-muted-foreground cursor-help"
                                      >
                                        +{activePermModules.length - 3} More
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="p-3 max-w-xs rounded-xl shadow-2xl">
                                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                                        Additional Modules ({activePermModules.length - 3})
                                      </p>
                                      <p className="text-xs font-medium leading-relaxed">
                                        {activePermModules.slice(3).join(", ")}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Row actions menu"
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
                              onClick={() => handleOpenView(role)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="eye"
                                icon={User}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>View Details</span>
                            </DropdownMenuItem>

                            {canEditThis && (
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(role)}
                                className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                              >
                                <AppIcon
                                  name="edit"
                                  icon={Edit2}
                                  size={14}
                                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                                />
                                <span>Edit Permissions</span>
                              </DropdownMenuItem>
                            )}

                            {canManageRoles && !role.isSystem && (
                              <>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  onClick={() => handleOpenDelete(role)}
                                  className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <AppIcon
                                    name="trash"
                                    icon={Trash2}
                                    size={14}
                                    className="w-3.5 h-3.5 text-destructive shrink-0"
                                  />
                                  <span>Delete Role</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={Shield}
                        title="No roles found"
                        description="No roles match your current search or filter criteria."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
                        action={
                          hasActiveFilters
                            ? {
                                label: "Clear Filters",
                                onClick: handleClearFilters,
                                icon: RotateCcw,
                              }
                            : canManageRoles
                            ? {
                                label: "Add Role",
                                onClick: handleOpenCreate,
                                icon: Plus,
                              }
                            : undefined
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
              {filteredRoles.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredRoles.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredRoles.length}</span> Roles
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
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
    </CRMPageContainer>
  );
}
