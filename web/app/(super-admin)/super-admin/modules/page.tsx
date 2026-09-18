"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SUPER_ADMIN_NAV_QUERY_KEY } from "@/shared/hooks/use-super-admin-navigation";
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Shield,
  ShieldAlert,
  Boxes,
  AlertTriangle,
  X,
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  fetchPlatformModules,
  createPlatformModule,
  updatePlatformModule,
  togglePlatformModuleStatus,
  reorderPlatformModules,
  deletePlatformModule,
  PlatformModule,
  CreatePlatformModuleDto,
  UpdatePlatformModuleDto,
} from "@/shared/lib/api/super-admin.api";
import {
  CRMPageContainer,
  CRMPagination,
} from "@/shared/components/crm";
import { SortDirection } from "@/shared/components/DataTableColumnHeader";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { AVAILABLE_ICON_NAMES } from "@/shared/lib/icons/dynamic-icon";

import { ModulesDataTable } from "./components/ModulesDataTable";
import { ModuleEditorModal } from "./components/ModuleEditorModal";
import { ModuleDeleteDialog } from "./components/ModuleDeleteDialog";

export default function SuperAdminModulesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Navigation Scope Tabs: "tenant" (Tenant CRM) vs "platform" (Super Admin)
  const [activeScope, setActiveScope] = useState<"tenant" | "platform">("tenant");

  // Modules State
  const [tenantModules, setTenantModules] = useState<PlatformModule[]>([]);
  const [platformModules, setPlatformModules] = useState<PlatformModule[]>([]);

  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "order",
    direction: "asc",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<PlatformModule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formLabel, setFormLabel] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formIcon, setFormIcon] = useState("Layers");
  const [formGroup, setFormGroup] = useState("Core");
  const [customGroup, setCustomGroup] = useState("");
  const [formAccessPreset, setFormAccessPreset] = useState<"ALL" | "ADMIN_ONLY" | "MANAGER_ADMIN" | "CUSTOM">("ALL");
  const [formPermission, setFormPermission] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formDescription, setFormDescription] = useState("");
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  // Delete Modal State
  const [moduleToDelete, setModuleToDelete] = useState<PlatformModule | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Error & AAL2
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aal2Required, setAal2Required] = useState(false);

  // Reorder State
  const [reordering, setReordering] = useState(false);

  // Invalidate both navigation caches after mutations
  const invalidateNavCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["platform-navigation"] });
    queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_NAV_QUERY_KEY });
  }, [queryClient]);

  // Load Tenant CRM Modules
  const loadTenantModules = useCallback(async () => {
    try {
      const res = await fetchPlatformModules({ navigationScope: "TENANT_CRM" });
      setTenantModules(res.modules || []);
    } catch (err: unknown) {
      const errResponse = (err as { response?: { data?: { code?: string; message?: string }; status?: number } })?.response;
      const errData = errResponse?.data;
      const isAal =
        errData?.code === "AAL2_REQUIRED" ||
        String(errData?.message || "").includes("AAL2") ||
        (errResponse?.status === 403 && String(errData?.message || "").includes("MFA"));

      if (isAal) {
        setAal2Required(true);
        setLoadError("MFA verification required (AAL2 Assurance).");
      } else {
        setLoadError(errData?.message || (err as { message?: string })?.message || "Failed to load Tenant CRM navigation.");
      }
    }
  }, []);

  // Load Super Admin Platform Modules
  const loadPlatformModules = useCallback(async () => {
    try {
      const res = await fetchPlatformModules({ navigationScope: "SUPER_ADMIN" });
      setPlatformModules(res.modules || []);
    } catch {
      // Silently handle error
    }
  }, []);

  // Load All Data
  const loadAllModules = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setAal2Required(false);
    try {
      await Promise.all([loadTenantModules(), loadPlatformModules()]);
    } finally {
      setLoading(false);
    }
  }, [loadTenantModules, loadPlatformModules]);

  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      try {
        await loadAllModules();
      } catch {
        // Errors handled within loadAllModules
      }
    };
    run();

    const handleAal2Verified = () => {
      if (isCancelled) return;
      setAal2Required(false);
      setLoadError(null);
      loadAllModules();
    };

    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      isCancelled = true;
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, [loadAllModules]);

  // Current active raw list based on tab
  const rawCurrentList = useMemo(() => {
    return activeScope === "tenant" ? tenantModules : platformModules;
  }, [activeScope, tenantModules, platformModules]);

  // Helper: Open Create Modal
  const handleOpenCreate = useCallback(() => {
    setEditingModule(null);
    setFormLabel("");
    setFormKey("");
    setFormRoute("");
    setFormIcon("Layers");
    setFormGroup(activeScope === "tenant" ? "Core" : "Platform");
    setCustomGroup("");
    setFormAccessPreset("ALL");
    setFormPermission("");
    setFormBadge("");
    setFormOrder((rawCurrentList.length || 0) + 1);
    setFormDescription("");
    setFormIsEnabled(true);
    setIconSearchQuery("");
    setIsModalOpen(true);
  }, [activeScope, rawCurrentList.length]);

  // Handle "+ Add" query param from deep link
  const addParamHandledRef = useRef(false);
  useEffect(() => {
    if (searchParams.get("add") === "true" && !addParamHandledRef.current) {
      addParamHandledRef.current = true;
      handleOpenCreate();
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("add");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, [searchParams, handleOpenCreate]);

  // Available groups for active tab
  const availableGroups = useMemo(() => {
    const defaultGroups =
      activeScope === "tenant"
        ? ["Core", "CRM", "AI", "Insights", "Administration", "HRM & Operations", "Support"]
        : ["Overview", "Platform", "Commerce", "AI Platform", "Insights", "Security & Operations", "Configuration"];

    const set = new Set<string>(defaultGroups);
    rawCurrentList.forEach((m) => {
      if (m.group) set.add(m.group);
    });
    return Array.from(set);
  }, [activeScope, rawCurrentList]);

  // Filtered Modules
  const filteredModules = useMemo(() => {
    return rawCurrentList.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesLabel = m.label.toLowerCase().includes(q);
        const matchesKey = m.key.toLowerCase().includes(q);
        const matchesRoute = m.route.toLowerCase().includes(q);
        const matchesGroup = m.group.toLowerCase().includes(q);
        if (!matchesLabel && !matchesKey && !matchesRoute && !matchesGroup) {
          return false;
        }
      }

      if (groupFilter !== "ALL" && m.group !== groupFilter) return false;
      if (statusFilter === "ENABLED" && !m.isEnabled) return false;
      if (statusFilter === "DISABLED" && m.isEnabled) return false;

      return true;
    });
  }, [rawCurrentList, search, groupFilter, statusFilter]);

  // Sorted Modules
  const sortedModules = useMemo(() => {
    return [...filteredModules].sort((a, b) => {
      if (!sortConfig.direction) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.key === "order") {
        return ((a.sortOrder ?? 0) - (b.sortOrder ?? 0)) * dir;
      }
      if (sortConfig.key === "label") {
        return (a.label || "").localeCompare(b.label || "") * dir;
      }
      if (sortConfig.key === "group") {
        return (a.group || "").localeCompare(b.group || "") * dir;
      }
      if (sortConfig.key === "isEnabled") {
        return ((a.isEnabled ? 1 : 0) - (b.isEnabled ? 1 : 0)) * dir;
      }
      return 0;
    });
  }, [filteredModules, sortConfig]);

  // Paginated Modules
  const totalPages = Math.max(1, Math.ceil(sortedModules.length / rowsPerPage));
  const paginatedModules = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedModules.slice(start, start + rowsPerPage);
  }, [sortedModules, currentPage, rowsPerPage]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  // Helper: Open Edit Modal
  const handleOpenEdit = (mod: PlatformModule) => {
    setEditingModule(mod);
    setFormLabel(mod.label);
    setFormKey(mod.key);
    setFormRoute(mod.route);
    setFormIcon(mod.icon || "Layers");

    const defaultPresetGroups =
      activeScope === "tenant"
        ? ["Core", "CRM", "AI", "Insights", "Administration", "HRM & Operations", "Support"]
        : ["Overview", "Platform", "Commerce", "AI Platform", "Insights", "Security & Operations", "Configuration"];

    if (defaultPresetGroups.includes(mod.group)) {
      setFormGroup(mod.group);
      setCustomGroup("");
    } else {
      setFormGroup("CUSTOM");
      setCustomGroup(mod.group);
    }

    // Access preset mapping
    if (!mod.permission || mod.permission === "Dashboard" || mod.permission === "Help Center") {
      setFormAccessPreset("ALL");
      setFormPermission("");
    } else if (mod.permission === "Settings" || mod.permission === "Role Management" || mod.permission === "Employees") {
      setFormAccessPreset("ADMIN_ONLY");
      setFormPermission(mod.permission);
    } else if (mod.permission === "Reports & Analytics" || mod.permission === "Team Performance") {
      setFormAccessPreset("MANAGER_ADMIN");
      setFormPermission(mod.permission);
    } else {
      setFormAccessPreset("CUSTOM");
      setFormPermission(mod.permission);
    }

    setFormBadge(mod.badge || "");
    setFormOrder(mod.sortOrder ?? 1);
    setFormDescription(mod.description || "");
    setFormIsEnabled(mod.isEnabled);
    setIconSearchQuery("");
    setIsModalOpen(true);
  };

  // Auto-generate key and route on label change when creating
  const handleLabelChange = (val: string) => {
    setFormLabel(val);
    if (!editingModule) {
      const slug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      
      const keyPrefix = activeScope === "platform" ? "sa_" : "";
      setFormKey(`${keyPrefix}${slug}`);
      
      if (!formRoute || formRoute.startsWith("/")) {
        const routePrefix = activeScope === "platform" ? "/super-admin/" : "/";
        setFormRoute(`${routePrefix}${slug.replace(/_/g, "-")}`);
      }
    }
  };

  // Save Module (Create or Update)
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      toast.error("Menu label is required.");
      return;
    }
    if (!formRoute.trim()) {
      toast.error("Route path is required.");
      return;
    }

    const effectiveGroup = formGroup === "CUSTOM" ? customGroup.trim() : formGroup;
    if (!effectiveGroup) {
      toast.error("Navigation group is required.");
      return;
    }

    let effectivePermission: string | null = null;
    if (activeScope === "tenant") {
      if (formAccessPreset === "ADMIN_ONLY") {
        effectivePermission = "Settings";
      } else if (formAccessPreset === "MANAGER_ADMIN") {
        effectivePermission = "Reports & Analytics";
      } else if (formAccessPreset === "CUSTOM") {
        effectivePermission = formPermission.trim() || null;
      }
    }

    const targetScope = activeScope === "platform" ? "SUPER_ADMIN" : "TENANT_CRM";

    try {
      setSaving(true);
      if (editingModule) {
        const updatePayload: UpdatePlatformModuleDto = {
          label: formLabel.trim(),
          route: formRoute.trim(),
          icon: formIcon,
          group: effectiveGroup,
          sortOrder: Number(formOrder) || editingModule.sortOrder,
          permission: effectivePermission,
          badge: formBadge.trim() || null,
          description: formDescription.trim() || null,
          isEnabled: formIsEnabled,
          isVisible: formIsEnabled,
        };
        const res = await updatePlatformModule(editingModule.id, updatePayload);
        toast.success(`Menu '${res.data.label}' updated.`);
      } else {
        const autoKey = formKey.trim() || formLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const createPayload: CreatePlatformModuleDto = {
          key: autoKey,
          label: formLabel.trim(),
          route: formRoute.trim(),
          icon: formIcon,
          group: effectiveGroup,
          navigationScope: targetScope,
          sortOrder: Number(formOrder) || (rawCurrentList.length + 1),
          permission: effectivePermission,
          badge: formBadge.trim() || null,
          description: formDescription.trim() || null,
          isEnabled: formIsEnabled,
          isVisible: formIsEnabled,
        };
        const res = await createPlatformModule(createPayload);
        toast.success(`Menu '${res.data.label}' created.`);
      }
      setIsModalOpen(false);
      await loadAllModules();
      invalidateNavCaches();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save menu.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Single Unified Status Toggle
  const handleToggleStatus = async (
    mod: PlatformModule,
    nextVal: boolean
  ) => {
    // Optimistic UI update
    if (activeScope === "tenant") {
      setTenantModules((prev) =>
        prev.map((m) =>
          m.id === mod.id ? { ...m, isEnabled: nextVal, isVisible: nextVal } : m
        )
      );
    } else {
      setPlatformModules((prev) =>
        prev.map((m) =>
          m.id === mod.id ? { ...m, isEnabled: nextVal, isVisible: nextVal } : m
        )
      );
    }

    try {
      await togglePlatformModuleStatus(mod.id, { isEnabled: nextVal, isVisible: nextVal });
      toast.success(
        `${mod.label} ${nextVal ? "activated" : "disabled"}.`
      );
      await loadAllModules();
      invalidateNavCaches();
    } catch (err: unknown) {
      await loadAllModules();
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update status.";
      toast.error(msg);
    }
  };

  // Persistent Reordering
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredModules.length) return;

    const currentItem = filteredModules[index];
    const targetItem = filteredModules[targetIndex];

    const currentList = activeScope === "tenant" ? [...tenantModules] : [...platformModules];
    const itemAIndex = currentList.findIndex((m) => m.id === currentItem.id);
    const itemBIndex = currentList.findIndex((m) => m.id === targetItem.id);

    if (itemAIndex === -1 || itemBIndex === -1) return;

    const tempSort = currentList[itemAIndex].sortOrder;
    currentList[itemAIndex].sortOrder = currentList[itemBIndex].sortOrder;
    currentList[itemBIndex].sortOrder = tempSort;

    currentList.sort((a, b) => a.sortOrder - b.sortOrder);

    if (activeScope === "tenant") {
      setTenantModules(currentList);
    } else {
      setPlatformModules(currentList);
    }

    try {
      setReordering(true);
      await reorderPlatformModules(
        currentList.map((m, idx) => ({ id: m.id, sortOrder: idx + 1 }))
      );
      toast.success("Menu order updated.");
      invalidateNavCaches();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to reorder menus.";
      toast.error(msg);
      await loadAllModules();
    } finally {
      setReordering(false);
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!moduleToDelete) return;
    try {
      setDeleting(true);
      await deletePlatformModule(moduleToDelete.id);
      toast.success(`Menu '${moduleToDelete.label}' deleted.`);
      setModuleToDelete(null);
      await loadAllModules();
      invalidateNavCaches();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete menu.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered icons for picker
  const filteredIcons = useMemo(() => {
    if (!iconSearchQuery.trim()) return AVAILABLE_ICON_NAMES.slice(0, 32);
    const q = iconSearchQuery.toLowerCase();
    return AVAILABLE_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [iconSearchQuery]);

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
              name="modules"
              icon={Layers}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Platform Modules
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage CRM and Super Admin navigation, access, and visibility.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon name="plus" icon={Plus} size={14} className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Add Menu</span>
          </Button>
        </div>
      </div>

      {/* AAL2 Elevated MFA Banner */}
      {aal2Required && (
        <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                MFA Verification Required (AAL2 Assurance)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Elevated session authentication is required to manage platform navigation.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("clixpro:aal2-required"));
              }
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
          >
            Verify MFA Now
          </Button>
        </div>
      )}

      {/* Error Banner */}
      {loadError && !aal2Required && (
        <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Unable to Load Modules</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{loadError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadAllModules}
            className="font-semibold text-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Navigation Scope Tabs */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
          <button
            onClick={() => {
              setActiveScope("tenant");
              setGroupFilter("ALL");
              setStatusFilter("ALL");
              setSearch("");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeScope === "tenant"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Tenant CRM Navigation ({tenantModules.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveScope("platform");
              setGroupFilter("ALL");
              setStatusFilter("ALL");
              setSearch("");
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              activeScope === "platform"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin Platform Menus ({platformModules.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 text-xs text-muted-foreground">
          <span className="font-medium">
            {activeScope === "tenant"
              ? "Tenant CRM workspace sidebar navigation"
              : "Root platform administration menus"}
          </span>
        </div>
      </div>

      {/* 4. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Group Filter */}
            <Select 
              value={groupFilter} 
              onValueChange={(val) => {
                setGroupFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[160px] text-xs font-semibold bg-background border-border/70 shadow-xs focus:ring-primary/20">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Groups</SelectItem>
                {availableGroups.map((g) => (
                  <SelectItem key={g} value={g}>
                    Group: {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select 
              value={statusFilter} 
              onValueChange={(val) => {
                setStatusFilter(val as "ALL" | "ENABLED" | "DISABLED");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs font-semibold bg-background border-border/70 shadow-xs focus:ring-primary/20">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ENABLED">Active Only</SelectItem>
                <SelectItem value="DISABLED">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  activeScope === "tenant"
                    ? "Search modules by name, route..."
                    : "Search admin menus..."
                }
                className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
            {(groupFilter !== "ALL" || statusFilter !== "ALL" || search.trim()) && (
              <button
                onClick={() => {
                  setSearch("");
                  setGroupFilter("ALL");
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 5. Unified Data Table */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <ModulesDataTable
            loading={loading}
            activeScope={activeScope}
            search={search}
            groupFilter={groupFilter}
            statusFilter={statusFilter}
            filteredModules={filteredModules}
            sortedModules={sortedModules}
            paginatedModules={paginatedModules}
            sortConfig={sortConfig}
            handleSort={handleSort}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            reordering={reordering}
            handleMoveOrder={handleMoveOrder}
            handleOpenEdit={handleOpenEdit}
            handleToggleStatus={handleToggleStatus}
            setModuleToDelete={setModuleToDelete}
          />
        </div>

        {/* 6. Bottom Pagination */}
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedModules.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
          itemName="Menus"
        />
      </div>

      {/* 7. Add / Edit Modal */}
      <ModuleEditorModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingModule={editingModule}
        activeScope={activeScope}
        formLabel={formLabel}
        handleLabelChange={handleLabelChange}
        formRoute={formRoute}
        setFormRoute={setFormRoute}
        formGroup={formGroup}
        setFormGroup={setFormGroup}
        customGroup={customGroup}
        setCustomGroup={setCustomGroup}
        availableGroups={availableGroups}
        formOrder={formOrder}
        setFormOrder={setFormOrder}
        formAccessPreset={formAccessPreset}
        setFormAccessPreset={setFormAccessPreset}
        formPermission={formPermission}
        setFormPermission={setFormPermission}
        formIcon={formIcon}
        setFormIcon={setFormIcon}
        iconSearchQuery={iconSearchQuery}
        setIconSearchQuery={setIconSearchQuery}
        filteredIcons={filteredIcons}
        formIsEnabled={formIsEnabled}
        setFormIsEnabled={setFormIsEnabled}
        formBadge={formBadge}
        setFormBadge={setFormBadge}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        saving={saving}
        handleSaveModule={handleSaveModule}
      />

      {/* 8. Delete Confirmation Modal */}
      <ModuleDeleteDialog
        moduleToDelete={moduleToDelete}
        onClose={() => setModuleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </CRMPageContainer>
  );
}
