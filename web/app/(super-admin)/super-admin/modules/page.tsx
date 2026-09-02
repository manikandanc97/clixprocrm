"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SUPER_ADMIN_NAV_QUERY_KEY } from "@/shared/hooks/use-super-admin-navigation";
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  FolderTree,
  Boxes,
  Lock,
  Link as LinkIcon,
  AlertTriangle,
  MoreHorizontal,
  Loader2,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
  CRMPageHeader,
  CRMMetricsGrid,
  CRMMetricCard,
  CRMToolbar,
  CRMPagination,
  CRMActionMenu,
} from "@/shared/components/crm";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AVAILABLE_ICON_NAMES,
  getDynamicIcon,
  DynamicIcon,
} from "@/shared/lib/icons/dynamic-icon";
import { EmptyState } from "@/shared/components/EmptyState";
import { Skeleton } from "@/shared/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  Table Loading Skeleton                                                    */
/* -------------------------------------------------------------------------- */
function ModulesTableSkeleton() {
  return (
    <div className="overflow-x-auto w-full rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
          <tr className="h-10 sm:h-11">
            <th className="px-3 sm:px-4 py-2.5 w-20 text-center">
              <Skeleton className="h-2.5 w-10 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5">
              <Skeleton className="h-2.5 w-28" />
            </th>
            <th className="px-4 sm:px-6 py-2.5">
              <Skeleton className="h-2.5 w-24" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-center">
              <Skeleton className="h-2.5 w-20 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-center">
              <Skeleton className="h-2.5 w-20 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-right">
              <Skeleton className="h-2.5 w-12 ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="h-16">
              <td className="px-3 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Skeleton className="w-6 h-6 rounded-md" />
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="w-6 h-6 rounded-md" />
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <Skeleton className="h-5 w-24 rounded-lg" />
              </td>
              <td className="px-4 py-4 text-center">
                <Skeleton className="h-5 w-24 rounded-full mx-auto" />
              </td>
              <td className="px-4 py-4 text-center">
                <Skeleton className="h-5 w-16 rounded-full mx-auto" />
              </td>
              <td className="px-4 py-4 text-right">
                <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperAdminModulesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Navigation Scope Tabs: "tenant" (Tenant CRM) vs "platform" (Super Admin)
  const [activeScope, setActiveScope] = useState<"tenant" | "platform">("tenant");

  // Modules State & Stats
  const [tenantModules, setTenantModules] = useState<PlatformModule[]>([]);
  const [stats, setStats] = useState({ total: 0, enabled: 0, disabled: 0, system: 0 });

  const [platformModules, setPlatformModules] = useState<PlatformModule[]>([]);
  const [platformStats, setPlatformStats] = useState({ total: 0, enabled: 0, disabled: 0, system: 0 });

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
      if (res.stats) setStats(res.stats);
    } catch (err: any) {
      const errData = err?.response?.data;
      const isAal =
        errData?.code === "AAL2_REQUIRED" ||
        String(errData?.message || "").includes("AAL2") ||
        (err?.response?.status === 403 && String(errData?.message || "").includes("MFA"));

      if (isAal) {
        setAal2Required(true);
        setLoadError("MFA verification required (AAL2 Assurance).");
      } else {
        setLoadError(errData?.message || err?.message || "Failed to load Tenant CRM navigation.");
      }
    }
  }, []);

  // Load Super Admin Platform Modules
  const loadPlatformModules = useCallback(async () => {
    try {
      const res = await fetchPlatformModules({ navigationScope: "SUPER_ADMIN" });
      setPlatformModules(res.modules || []);
      if (res.stats) setPlatformStats(res.stats);
    } catch (err: any) {
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
    loadAllModules();

    const handleAal2Verified = () => {
      setAal2Required(false);
      setLoadError(null);
      loadAllModules();
    };

    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, [loadAllModules]);

  // Dynamic KPI Stats based on active scope
  const displayStats = useMemo(() => {
    if (activeScope === "platform") {
      const activeCount = platformModules.filter((m) => m.isEnabled).length;
      const groupsCount = new Set(platformModules.map((m) => m.group)).size;
      return {
        card1Title: "Total System Menus",
        card1Value: platformStats.total || platformModules.length,
        card1Icon: Shield,
        card1Color: "indigo" as const,
        card1Text: "Root administration controls",

        card2Title: "Active Routes",
        card2Value: activeCount,
        card2Icon: CheckCircle2,
        card2Color: "emerald" as const,
        card2Text: "Active in Super Admin sidebar",

        card3Title: "Platform Domains",
        card3Value: groupsCount,
        card3Icon: FolderTree,
        card3Color: "orange" as const,
        card3Text: "System domain hierarchies",

        card4Title: "Access Privilege",
        card4Value: "Root IAM",
        card4Icon: Lock,
        card4Color: "violet" as const,
        card4Text: "Super Admin & AAL2 protected",
      };
    }

    return {
      card1Title: "Total Modules",
      card1Value: stats.total || tenantModules.length,
      card1Icon: Boxes,
      card1Color: "indigo" as const,
      card1Text: "Registered platform features",

      card2Title: "Active Modules",
      card2Value: stats.enabled,
      card2Icon: CheckCircle2,
      card2Color: "emerald" as const,
      card2Text: "Globally enabled for users",

      card3Title: "Disabled Modules",
      card3Value: stats.disabled,
      card3Icon: XCircle,
      card3Color: "orange" as const,
      card3Text: "Hidden from navigation",

      card4Title: "Core System",
      card4Value: stats.system,
      card4Icon: Shield,
      card4Color: "violet" as const,
      card4Text: "Protected foundations",
    };
  }, [activeScope, stats, platformStats, tenantModules, platformModules]);

  // Handle "+ Add" query param from deep link
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Reset pagination on filter, search, or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, statusFilter, activeScope]);

  // Current active raw list based on tab
  const rawCurrentList = useMemo(() => {
    return activeScope === "tenant" ? tenantModules : platformModules;
  }, [activeScope, tenantModules, platformModules]);

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

  // Helper: Open Create Modal
  const handleOpenCreate = () => {
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

    const effectiveGroup =
      formGroup === "CUSTOM"
        ? customGroup.trim() || "Custom"
        : formGroup;

    let effectivePermission: string | null = null;
    if (activeScope === "tenant") {
      if (formAccessPreset === "ALL") {
        effectivePermission = null;
      } else if (formAccessPreset === "ADMIN_ONLY") {
        effectivePermission = "Settings";
      } else if (formAccessPreset === "MANAGER_ADMIN") {
        effectivePermission = "Reports & Analytics";
      } else {
        effectivePermission = formPermission.trim() || formLabel.trim();
      }
    }

    const targetScope = activeScope === "tenant" ? "TENANT_CRM" : "SUPER_ADMIN";

    try {
      setSaving(true);
      if (editingModule) {
        const updatePayload: UpdatePlatformModuleDto = {
          label: formLabel.trim(),
          key: formKey.trim() || undefined,
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
        const createPayload: CreatePlatformModuleDto = {
          label: formLabel.trim(),
          key: formKey.trim() || undefined,
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save menu.");
    } finally {
      setSaving(false);
    }
  };

  // Single Unified Status Toggle (Enables/Disables module & navigation visibility in one step)
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
    } catch (err: any) {
      await loadAllModules();
      toast.error(err?.response?.data?.message || "Failed to update status.");
    }
  };

  // Persistent Reordering (Works for BOTH Tenant CRM & Super Admin)
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reorder menus.");
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete menu.");
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

  // Helper to format access badge
  const renderAccessBadge = (mod: PlatformModule) => {
    if (activeScope === "platform") {
      return (
        <Badge
          variant="secondary"
          className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold text-[10px] gap-1 mx-auto"
        >
          <Lock className="w-3 h-3" />
          Super Admin
        </Badge>
      );
    }

    if (!mod.permission || mod.permission === "Dashboard" || mod.permission === "Help Center") {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 font-semibold text-[10px] gap-1 mx-auto"
        >
          <Users className="w-3 h-3" />
          All CRM Users
        </Badge>
      );
    }

    if (mod.permission === "Settings" || mod.permission === "Role Management" || mod.permission === "Employees") {
      return (
        <Badge
          variant="secondary"
          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-semibold text-[10px] gap-1 mx-auto"
        >
          <Shield className="w-3 h-3 text-slate-500" />
          Admin Only
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-muted text-foreground border-border/70 font-mono text-[10px] gap-1 max-w-[140px] truncate mx-auto"
      >
        <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="truncate">{mod.permission}</span>
      </Badge>
    );
  };

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Page Header */}
      <CRMPageHeader
        title="Platform Modules"
        subtitle="Manage CRM and Super Admin navigation, access, and visibility."
        icon={Layers}
        actions={[
          {
            label: "Add Menu",
            icon: Plus,
            onClick: handleOpenCreate,
            variant: "emerald",
          },
        ]}
      />

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

      {/* 2. KPI Metrics Grid */}
      <CRMMetricsGrid cols={4}>
        <CRMMetricCard
          title={displayStats.card1Title}
          value={displayStats.card1Value}
          icon={displayStats.card1Icon}
          color={displayStats.card1Color}
          comparisonText={displayStats.card1Text}
        />
        <CRMMetricCard
          title={displayStats.card2Title}
          value={displayStats.card2Value}
          icon={displayStats.card2Icon}
          color={displayStats.card2Color}
          comparisonText={displayStats.card2Text}
        />
        <CRMMetricCard
          title={displayStats.card3Title}
          value={displayStats.card3Value}
          icon={displayStats.card3Icon}
          color={displayStats.card3Color}
          comparisonText={displayStats.card3Text}
        />
        <CRMMetricCard
          title={displayStats.card4Title}
          value={displayStats.card4Value}
          icon={displayStats.card4Icon}
          color={displayStats.card4Color}
          comparisonText={displayStats.card4Text}
        />
      </CRMMetricsGrid>

      {/* 3. Navigation Scope Tabs */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
          <button
            onClick={() => {
              setActiveScope("tenant");
              setGroupFilter("ALL");
              setStatusFilter("ALL");
              setSearch("");
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

      {/* 4. Main Card Container matching Organizations Page */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Group Filter */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Groups</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>
                  Group: {g}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ENABLED">Active Only</option>
              <option value="DISABLED">Inactive Only</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeScope === "tenant"
                    ? "Search modules by name, route..."
                    : "Search admin menus..."
                }
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
          {loading ? (
            <ModulesTableSkeleton />
          ) : filteredModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <EmptyState
                icon={activeScope === "tenant" ? Boxes : Shield}
                title={
                  search || groupFilter !== "ALL" || statusFilter !== "ALL"
                    ? "No menus match your filters"
                    : "No navigation menus registered"
                }
                description={
                  search || groupFilter !== "ALL" || statusFilter !== "ALL"
                    ? "Try clearing your search query or group filter to view all navigation menus."
                    : "Click '+ Add Menu' to register your first navigation item."
                }
                className="border-none bg-transparent shadow-none p-0 min-h-0"
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse min-w-[950px] table-fixed">
              <colgroup>
                <col style={{ width: "90px" }} />
                <col style={{ width: "280px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "80px" }} />
              </colgroup>
              <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
                <tr className="text-xs font-bold text-foreground">
                  <th className="px-3 py-3.5 text-center border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                    <DataTableColumnHeader
                      title="Order"
                      align="center"
                      sortable
                      sortDirection={sortConfig.key === "order" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("order", dir)}
                    />
                  </th>
                  <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                    <DataTableColumnHeader
                      title="Menu"
                      sortable
                      sortDirection={sortConfig.key === "label" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("label", dir)}
                    />
                  </th>
                  <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                    <DataTableColumnHeader
                      title="Group"
                      sortable
                      sortDirection={sortConfig.key === "group" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("group", dir)}
                    />
                  </th>
                  <th className="px-4 py-3.5 text-center border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                    <span>Access</span>
                  </th>
                  <th className="px-4 py-3.5 text-center border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                    <DataTableColumnHeader
                      title="Status"
                      align="center"
                      sortable
                      sortDirection={sortConfig.key === "isEnabled" ? sortConfig.direction : null}
                      onSort={(dir) => handleSort("isEnabled", dir)}
                    />
                  </th>
                  <th className="w-20 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {paginatedModules.map((mod, pageIndex) => {
                  const Icon = getDynamicIcon(mod.icon);
                  const globalIndex = (currentPage - 1) * rowsPerPage + pageIndex;
                  const isFirst = globalIndex === 0;
                  const isLast = globalIndex === sortedModules.length - 1;

                  return (
                    <tr
                      key={mod.id}
                      className="group h-16 hover:bg-muted/30 transition-colors"
                    >
                      {/* ORDER */}
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={isFirst || reordering}
                            onClick={() => handleMoveOrder(globalIndex, "up")}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs font-bold text-foreground w-5 text-center">
                            {mod.sortOrder}
                          </span>
                          <button
                            type="button"
                            disabled={isLast || reordering}
                            onClick={() => handleMoveOrder(globalIndex, "down")}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* MENU */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(mod)}
                                className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate text-left"
                              >
                                {mod.label}
                              </button>
                              {mod.badge && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 font-semibold bg-primary/10 text-primary border-primary/20 shrink-0"
                                >
                                  {mod.badge}
                                </Badge>
                              )}
                              {mod.isSystem && (
                                <span
                                  title="Core system module (Protected)"
                                  className="inline-flex items-center text-[10px] text-muted-foreground"
                                >
                                  <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 font-mono text-[11px] text-muted-foreground border border-border/50">
                                <LinkIcon className="w-2.5 h-2.5" />
                                {mod.route}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* GROUP */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-muted text-foreground border border-border/60">
                          <FolderTree className="w-3 h-3 text-muted-foreground shrink-0" />
                          {mod.group}
                        </span>
                      </td>

                      {/* ACCESS */}
                      <td className="px-4 py-3.5 text-center">
                        {renderAccessBadge(mod)}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={mod.isEnabled}
                            onCheckedChange={(checked) =>
                              handleToggleStatus(mod, checked)
                            }
                            className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                          />
                          <span
                            className={cn(
                              "text-xs font-bold w-14 text-left",
                              mod.isEnabled
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {mod.isEnabled ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3.5 text-right">
                        <CRMActionMenu
                          triggerOrientation="vertical"
                          items={[
                            {
                              label: "Edit Menu",
                              icon: Edit2,
                              variant: "primary" as const,
                              onClick: () => handleOpenEdit(mod),
                            },
                            {
                              label: mod.isEnabled ? "Disable Menu" : "Enable Menu",
                              icon: mod.isEnabled ? XCircle : CheckCircle2,
                              variant: mod.isEnabled ? ("destructive" as const) : ("default" as const),
                              className: !mod.isEnabled ? "text-emerald-600 dark:text-emerald-400 font-medium" : undefined,
                              onClick: () => handleToggleStatus(mod, !mod.isEnabled),
                            },
                            {
                              label: mod.isSystem ? "System Menu (Protected)" : "Delete Menu",
                              icon: Trash2,
                              variant: mod.isSystem ? ("default" as const) : ("destructive" as const),
                              disabled: mod.isSystem,
                              separatorBefore: true,
                              onClick: () => !mod.isSystem && setModuleToDelete(mod),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 6. Bottom Pagination */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {sortedModules.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            -
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, sortedModules.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{sortedModules.length}</span> Menus
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
                  <ChevronsLeft className="h-4 w-4" />
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
                  <ChevronLeft className="h-4 w-4" />
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
                  <ChevronRight className="h-4 w-4" />
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
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <DynamicIcon name={formIcon} className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {editingModule ? "Edit Navigation Menu" : "Add Navigation Menu"}
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {activeScope === "tenant" ? "Tenant CRM" : "Super Admin"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Configure menu details, route path, icon, group, access level, and status.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveModule} className="space-y-4 pt-2">
            {/* BASIC: Display Name & Route */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="menu-label" className="text-xs font-bold text-foreground">
                  Menu Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="menu-label"
                  placeholder="e.g. Contacts"
                  value={formLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  required
                  className="h-9 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="menu-route" className="text-xs font-bold text-foreground">
                  Route Path <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="menu-route"
                  placeholder={activeScope === "platform" ? "/super-admin/section" : "/section"}
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  required
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* ORGANIZATION: Group & Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="menu-group" className="text-xs font-bold text-foreground">
                  Navigation Group
                </Label>
                <select
                  id="menu-group"
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  {availableGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom Group...</option>
                </select>
                {formGroup === "CUSTOM" && (
                  <Input
                    placeholder="Enter custom group name"
                    value={customGroup}
                    onChange={(e) => setCustomGroup(e.target.value)}
                    className="h-8 mt-1.5 rounded-xl text-xs"
                    autoFocus
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="menu-order" className="text-xs font-bold text-foreground">
                  Order Index
                </Label>
                <Input
                  id="menu-order"
                  type="number"
                  min="1"
                  value={formOrder}
                  onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* ACCESS CONTROL */}
            {activeScope === "tenant" ? (
              <div className="space-y-1.5">
                <Label htmlFor="access-preset" className="text-xs font-bold text-foreground">
                  Access Level
                </Label>
                <select
                  id="access-preset"
                  value={formAccessPreset}
                  onChange={(e) => setFormAccessPreset(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="ALL">All CRM Users (Standard Access)</option>
                  <option value="ADMIN_ONLY">Admin Only</option>
                  <option value="MANAGER_ADMIN">Manager & Admin</option>
                  <option value="CUSTOM">Custom RBAC Permission...</option>
                </select>
                {formAccessPreset === "CUSTOM" && (
                  <Input
                    placeholder="Enter custom permission key (e.g. Invoices, Reports)"
                    value={formPermission}
                    onChange={(e) => setFormPermission(e.target.value)}
                    className="h-8 mt-1.5 rounded-xl text-xs font-mono"
                    autoFocus
                  />
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <span>Super Admin Root Access (AAL2 MFA assurance required)</span>
              </div>
            )}

            {/* ICON PICKER */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Icon <span className="text-muted-foreground font-normal">({formIcon})</span>
                </Label>
                <div className="relative w-36">
                  <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search icons..."
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    className="h-7 pl-7 text-[11px] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-8 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 max-h-32 overflow-y-auto">
                {filteredIcons.map((iconName) => {
                  const IconComp = getDynamicIcon(iconName);
                  const isSelected = formIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg transition-all cursor-pointer",
                        isSelected
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                      title={iconName}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SINGLE UNIFIED STATUS TOGGLE */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60">
              <div>
                <p className="text-xs font-bold text-foreground">Menu Status</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formIsEnabled
                    ? "Active — Enabled and visible in sidebar navigation"
                    : "Inactive — Disabled and hidden from sidebar navigation"}
                </p>
              </div>
              <Switch
                checked={formIsEnabled}
                onCheckedChange={setFormIsEnabled}
                className="data-[state=checked]:bg-emerald-600 cursor-pointer"
              />
            </div>

            {/* Optional Description / Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="menu-badge" className="text-xs font-bold text-foreground">
                  Badge Text <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="menu-badge"
                  placeholder="e.g. Beta, New, Pro"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="menu-description" className="text-xs font-bold text-foreground">
                  Description <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="menu-description"
                  placeholder="Brief menu purpose"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : editingModule ? (
                  "Update Menu"
                ) : (
                  "Create Menu"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 8. Delete Confirmation Modal */}
      <Dialog
        open={Boolean(moduleToDelete)}
        onOpenChange={(open) => {
          if (!open) setModuleToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[440px] rounded-2xl border-border bg-card shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  moduleToDelete?.isSystem
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {moduleToDelete?.isSystem ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {moduleToDelete?.isSystem ? "Protected System Menu" : "Delete Navigation Menu"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {moduleToDelete?.isSystem
                    ? "System menus provide core CRM workflows and cannot be deleted."
                    : `Are you sure you want to delete "${moduleToDelete?.label}"?`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3">
            {moduleToDelete?.isSystem ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                <p className="font-semibold">
                  Cannot delete core module &quot;{moduleToDelete?.label}&quot;
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Instead of deleting, you can switch <strong>Status</strong> to Inactive to disable it and remove it from sidebar navigation.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will permanently remove <strong>&quot;{moduleToDelete?.label}&quot;</strong> (
                <code>{moduleToDelete?.route}</code>) from navigation. This action cannot be
                undone.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModuleToDelete(null)}
              className="text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            {!moduleToDelete?.isSystem && (
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="text-xs font-semibold cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  "Delete Menu"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CRMPageContainer>
  );
}
