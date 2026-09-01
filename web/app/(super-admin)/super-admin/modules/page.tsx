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
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  FolderTree,
  Boxes,
  Lock,
  Globe,
  Tag,
  AlertTriangle,
  Check,
  ChevronRight,
  Info,
  MoreHorizontal,
  Loader2,
  Copy,
  ExternalLink,
  Ticket,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  TruncatedText,
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

/* SUPER_ADMIN_NAV_MENUS hardcoded array removed — now loaded from database via API.
 * See: fetchPlatformModules({ navigationScope: 'SUPER_ADMIN' }) below.
 */

/* -------------------------------------------------------------------------- */
/*  Inline table-only skeleton — used when page is mounted but data is loading */
/* -------------------------------------------------------------------------- */
function PlatformModulesTableSkeleton() {
  return (
    <div className="overflow-x-auto w-full rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
          <tr className="h-10 sm:h-11">
            <th className="px-3 sm:px-4 py-2.5 w-16">
              <Skeleton className="h-2.5 w-10 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5">
              <Skeleton className="h-2.5 w-24" />
            </th>
            <th className="px-4 sm:px-6 py-2.5">
              <Skeleton className="h-2.5 w-28" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-center">
              <Skeleton className="h-2.5 w-10 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-center">
              <Skeleton className="h-2.5 w-24 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-center">
              <Skeleton className="h-2.5 w-20 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-right">
              <Skeleton className="h-2.5 w-14 ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="h-16 border-b border-border/50">
              {/* Order: up/number/down */}
              <td className="px-3 py-4 w-16 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Skeleton className="w-5 h-5 rounded-md" />
                  <Skeleton className="w-4 h-3.5" />
                  <Skeleton className="w-5 h-5 rounded-md" />
                </div>
              </td>
              {/* Module & Route: icon + name + badge + route */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </td>
              {/* Category & Access */}
              <td className="px-4 py-4">
                <div className="flex flex-col gap-1 items-start">
                  <Skeleton className="h-5 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              </td>
              {/* Type */}
              <td className="px-4 py-4 text-center">
                <Skeleton className="h-5 w-14 rounded-full mx-auto" />
              </td>
              {/* Global Status */}
              <td className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-5 w-9 rounded-full" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
              </td>
              {/* Sidebar Nav */}
              <td className="px-4 py-4 text-center">
                <Skeleton className="h-6 w-20 rounded-lg mx-auto" />
              </td>
              {/* Actions */}
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
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeScope, setActiveScope] = useState<"tenant" | "platform">("tenant");

  // -------------------------------------------------------
  // Tenant CRM modules state
  // -------------------------------------------------------
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [stats, setStats] = useState({ total: 0, enabled: 0, disabled: 0, system: 0 });
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // Super Admin platform modules state (DB-driven, not hardcoded)
  // -------------------------------------------------------
  const [platformModules, setPlatformModules] = useState<PlatformModule[]>([]);
  const [platformStats, setPlatformStats] = useState({ total: 0, enabled: 0, disabled: 0, system: 0 });
  const [platformLoading, setPlatformLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");

  // Tenant CRM Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Platform (Super Admin) Pagination
  const [platformPage, setPlatformPage] = useState(1);
  const [platformRowsPerPage, setPlatformRowsPerPage] = useState(10);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
    setPlatformPage(1);
  }, [search, groupFilter, statusFilter, activeScope]);

  // Super Admin Navigation Menus State
  const [selectedSuperAdminMenu, setSelectedSuperAdminMenu] = useState<PlatformModule | null>(null);
  const [platformSortConfig, setPlatformSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "order",
    direction: "asc",
  });

  const handlePlatformSort = (key: string, direction: SortDirection) => {
    setPlatformSortConfig({ key, direction });
  };

  const handleCopyRoute = (route: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(route);
      toast.success(`Copied route "${route}" to clipboard.`);
    }
  };

  // Create / Edit Modal State
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
  const [formPermission, setFormPermission] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [formIsVisible, setFormIsVisible] = useState(true);
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  // Delete Modal State
  const [moduleToDelete, setModuleToDelete] = useState<PlatformModule | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Error State & AAL2
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aal2Required, setAal2Required] = useState(false);

  // Reorder State
  const [reordering, setReordering] = useState(false);

  // -------------------------------------------------------
  // Invalidate both navigation caches after any mutation
  // so the tenant CRM sidebar AND super admin sidebar get fresh data
  // -------------------------------------------------------
  const invalidateNavCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["platform-navigation"] });
    queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_NAV_QUERY_KEY });
  }, [queryClient]);

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setAal2Required(false);
      // Tenant CRM scope
      const res = await fetchPlatformModules({ navigationScope: "TENANT_CRM" });
      setModules(res.modules || []);
      setStats(res.stats || { total: 0, enabled: 0, disabled: 0, system: 0 });
    } catch (err: any) {
      const errData = err?.response?.data;
      const isAal =
        errData?.code === "AAL2_REQUIRED" ||
        String(errData?.message || "").includes("AAL2") ||
        (err?.response?.status === 403 && String(errData?.message || "").includes("MFA"));

      if (isAal) {
        setAal2Required(true);
        const aalMsg = "MFA verification required: AAL2 session assurance required for Super Admin platform access.";
        setLoadError(aalMsg);
        toast.error(aalMsg);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("clixpro:aal2-required"));
        }
      } else {
        const msg = errData?.message || err?.message || "Failed to load platform modules.";
        setLoadError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlatformModules = useCallback(async () => {
    try {
      setPlatformLoading(true);
      // Super Admin scope
      const res = await fetchPlatformModules({ navigationScope: "SUPER_ADMIN" });
      setPlatformModules(res.modules || []);
      setPlatformStats(res.stats || { total: 0, enabled: 0, disabled: 0, system: 0 });
    } catch {
      // Silently fail — static fallback is shown in useSuperAdminNavigation hook
    } finally {
      setPlatformLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
    loadPlatformModules();

    const handleAal2Verified = () => {
      setAal2Required(false);
      setLoadError(null);
      loadModules();
      loadPlatformModules();
    };

    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, [loadModules, loadPlatformModules]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Distinct groups available for tenant modules
  const availableGroups = useMemo(() => {
    const set = new Set<string>(["Core", "Insights", "Administration", "HRM & Operations", "Support"]);
    modules.forEach((m) => {
      if (m.group) set.add(m.group);
    });
    return Array.from(set);
  }, [modules]);

  // Distinct groups available for active scope
  const currentAvailableGroups = useMemo(() => {
    if (activeScope === "platform") {
      const groups = Array.from(new Set(platformModules.map((m) => m.group)));
      return groups.length > 0 ? groups : ["Overview", "Platform", "Commerce", "AI Platform", "Insights", "Security & Operations", "Configuration"];
    }
    return availableGroups;
  }, [activeScope, availableGroups, platformModules]);

  // Dynamic KPI Stats based on active scope — now uses live DB data for platform scope
  const displayStats = useMemo(() => {
    if (activeScope === "platform") {
      const activeCount = platformModules.filter((m) => m.isEnabled && m.isVisible).length;
      const groupsCount = new Set(platformModules.map((m) => m.group)).size;
      return {
        card1Title: "Total System Menus",
        card1Value: platformStats.total,
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
      card1Value: stats.total,
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
  }, [activeScope, stats, platformStats, platformModules]);

  // Filtered Super Admin platform menus — now from live DB data
  const filteredPlatformMenus = useMemo(() => {
    return platformModules.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesLabel = m.label.toLowerCase().includes(q);
        const matchesKey = m.key.toLowerCase().includes(q);
        const matchesRoute = m.route.toLowerCase().includes(q);
        const matchesGroup = m.group.toLowerCase().includes(q);
        const matchesDesc = (m.description || "").toLowerCase().includes(q);
        if (!matchesLabel && !matchesKey && !matchesRoute && !matchesGroup && !matchesDesc) {
          return false;
        }
      }
      if (groupFilter !== "ALL" && m.group !== groupFilter) return false;
      if (statusFilter === "ENABLED" && !m.isEnabled) return false;
      if (statusFilter === "DISABLED" && m.isEnabled) return false;
      return true;
    });
  }, [platformModules, search, groupFilter, statusFilter]);

  // Sorted Super Admin platform menus
  const sortedPlatformMenus = useMemo(() => {
    return [...filteredPlatformMenus].sort((a, b) => {
      if (!platformSortConfig.direction) return 0;
      const dir = platformSortConfig.direction === "asc" ? 1 : -1;
      if (platformSortConfig.key === "order") return (a.sortOrder - b.sortOrder) * dir;
      if (platformSortConfig.key === "label") return a.label.localeCompare(b.label) * dir;
      if (platformSortConfig.key === "group") return a.group.localeCompare(b.group) * dir;
      return 0;
    });
  }, [filteredPlatformMenus, platformSortConfig]);

  // Platform tab pagination
  const platformTotalPages = Math.max(1, Math.ceil(sortedPlatformMenus.length / platformRowsPerPage));
  const paginatedPlatformMenus = useMemo(() => {
    const start = (platformPage - 1) * platformRowsPerPage;
    return sortedPlatformMenus.slice(start, start + platformRowsPerPage);
  }, [sortedPlatformMenus, platformPage, platformRowsPerPage]);

  // Filtered tenant modules
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      // Search match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesLabel = m.label.toLowerCase().includes(q);
        const matchesKey = m.key.toLowerCase().includes(q);
        const matchesRoute = m.route.toLowerCase().includes(q);
        const matchesGroup = m.group.toLowerCase().includes(q);
        const matchesDesc = (m.description || "").toLowerCase().includes(q);
        if (!matchesLabel && !matchesKey && !matchesRoute && !matchesGroup && !matchesDesc) {
          return false;
        }
      }

      // Group match
      if (groupFilter !== "ALL" && m.group !== groupFilter) {
        return false;
      }

      // Status match
      if (statusFilter === "ENABLED" && !m.isEnabled) return false;
      if (statusFilter === "DISABLED" && m.isEnabled) return false;

      return true;
    });
  }, [modules, search, groupFilter, statusFilter]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null,
  });

  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

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

  const totalPages = Math.max(1, Math.ceil(sortedModules.length / rowsPerPage));
  const paginatedModules = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedModules.slice(start, start + rowsPerPage);
  }, [sortedModules, currentPage, rowsPerPage]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingModule(null);
    setFormLabel("");
    setFormKey("");
    setFormRoute("");
    setFormIcon("Layers");
    setFormGroup("Core");
    setCustomGroup("");
    setFormPermission("");
    setFormBadge("");
    setFormDescription("");
    setFormIsEnabled(true);
    setFormIsVisible(true);
    setIconSearchQuery("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (mod: PlatformModule) => {
    setEditingModule(mod);
    setFormLabel(mod.label);
    setFormKey(mod.key);
    setFormRoute(mod.route);
    setFormIcon(mod.icon || "Layers");
    if (["Core", "Insights", "Administration", "HRM & Operations", "Support"].includes(mod.group)) {
      setFormGroup(mod.group);
      setCustomGroup("");
    } else {
      setFormGroup("CUSTOM");
      setCustomGroup(mod.group);
    }
    setFormPermission(mod.permission || "");
    setFormBadge(mod.badge || "");
    setFormDescription(mod.description || "");
    setFormIsEnabled(mod.isEnabled);
    setFormIsVisible(mod.isVisible);
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
      setFormKey(slug);
      if (!formRoute || formRoute.startsWith("/")) {
        setFormRoute(`/${slug.replace(/_/g, "-")}`);
      }
      if (!formPermission) {
        setFormPermission(val);
      }
    }
  };

  // Save Module (Create or Update)
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      toast.error("Module label is required.");
      return;
    }
    if (!formRoute.trim()) {
      toast.error("Module route path is required.");
      return;
    }

    const effectiveGroup =
      formGroup === "CUSTOM"
        ? customGroup.trim() || "Custom"
        : formGroup;

    try {
      setSaving(true);
      if (editingModule) {
        const updatePayload: UpdatePlatformModuleDto = {
          label: formLabel.trim(),
          key: formKey.trim() || undefined,
          route: formRoute.trim(),
          icon: formIcon,
          group: effectiveGroup,
          permission: formPermission.trim() || null,
          badge: formBadge.trim() || null,
          description: formDescription.trim() || null,
          isEnabled: formIsEnabled,
          isVisible: formIsVisible,
        };
        const res = await updatePlatformModule(editingModule.id, updatePayload);
        toast.success(`Platform module '${res.data.label}' updated successfully.`);
      } else {
        const createPayload: CreatePlatformModuleDto = {
          label: formLabel.trim(),
          key: formKey.trim() || undefined,
          route: formRoute.trim(),
          icon: formIcon,
          group: effectiveGroup,
          permission: formPermission.trim() || formLabel.trim(),
          badge: formBadge.trim() || null,
          description: formDescription.trim() || null,
          isEnabled: formIsEnabled,
          isVisible: formIsVisible,
        };
        const res = await createPlatformModule(createPayload);
        toast.success(`Platform module '${res.data.label}' created successfully.`);
      }
      setIsModalOpen(false);
      await loadModules();
      await loadPlatformModules();
      invalidateNavCaches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save module.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle isEnabled or isVisible
  const handleToggleStatus = async (
    mod: PlatformModule,
    field: "isEnabled" | "isVisible",
    nextVal: boolean
  ) => {
    // Optimistic UI update
    setModules((prev) =>
      prev.map((m) => (m.id === mod.id ? { ...m, [field]: nextVal } : m))
    );

    try {
      await togglePlatformModuleStatus(mod.id, { [field]: nextVal });
      toast.success(
        `${mod.label} ${field === "isEnabled" ? (nextVal ? "enabled globally" : "disabled globally") : nextVal ? "shown in navigation" : "hidden from navigation"}.`
      );
      // Reload stats for the active scope + invalidate both nav caches
      const res = await fetchPlatformModules({ navigationScope: "TENANT_CRM" });
      setStats(res.stats);
      await loadPlatformModules();
      invalidateNavCaches();
    } catch (err: any) {
      // Revert optimistic update on error
      setModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, [field]: mod[field] } : m))
      );
      setPlatformModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, [field]: mod[field] } : m))
      );
      toast.error(err?.response?.data?.message || "Failed to update module status.");
    }
  };

  // Reorder Item Up or Down
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredModules.length) return;

    const currentItem = filteredModules[index];
    const targetItem = filteredModules[targetIndex];

    // Swap in state
    const newModules = [...modules];
    const itemAIndex = newModules.findIndex((m) => m.id === currentItem.id);
    const itemBIndex = newModules.findIndex((m) => m.id === targetItem.id);

    if (itemAIndex === -1 || itemBIndex === -1) return;

    const tempSort = newModules[itemAIndex].sortOrder;
    newModules[itemAIndex].sortOrder = newModules[itemBIndex].sortOrder;
    newModules[itemBIndex].sortOrder = tempSort;

    // Sort by sortOrder
    newModules.sort((a, b) => a.sortOrder - b.sortOrder);
    setModules(newModules);

    try {
      setReordering(true);
      await reorderPlatformModules(
        newModules.map((m, idx) => ({ id: m.id, sortOrder: idx + 1 }))
      );
      toast.success("Module order updated.");
      invalidateNavCaches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reorder modules.");
      await loadModules();
      await loadPlatformModules();
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
      toast.success(`Platform module '${moduleToDelete.label}' deleted.`);
      setModuleToDelete(null);
      await loadModules();
      await loadPlatformModules();
      invalidateNavCaches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete module.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered icon list for picker
  const filteredIcons = useMemo(() => {
    if (!iconSearchQuery.trim()) return AVAILABLE_ICON_NAMES.slice(0, 32);
    const q = iconSearchQuery.toLowerCase();
    return AVAILABLE_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [iconSearchQuery]);

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header with Title and Actions */}
      <CRMPageHeader
        title="Platform Modules & Navigation"
        subtitle="Manage global modules, menu hierarchy, icon customization, routing, and access visibility across ClixProCRM."
        icon={Layers}
        actions={[
          {
            label: "Refresh",
            icon: RefreshCw,
            onClick: loadModules,
            variant: "outline",
          },
          {
            label: "Add Module",
            icon: Plus,
            onClick: handleOpenCreate,
            variant: "emerald",
          },
        ]}
      />

      {/* AAL2 Security Elevation Alert Banner */}
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
                Elevated session authentication is required to manage platform navigation and CRM modules.
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

      {/* General Error Banner */}
      {loadError && !aal2Required && (
        <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Unable to Load Platform Modules
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loadError}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadModules}
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

      {/* 2.5 Navigation Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
          <button
            onClick={() => {
              setActiveScope("tenant");
              setGroupFilter("ALL");
              setSearch("");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeScope === "tenant"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Tenant CRM Navigation ({modules.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveScope("platform");
              setGroupFilter("ALL");
              setSearch("");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeScope === "platform"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin Platform Menus ({platformModules.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
          <span className="font-semibold">
            {activeScope === "tenant"
              ? "Configuring dynamic workspace navigation visible to CRM roles"
              : "Root platform administration hierarchy & system routes"}
          </span>
        </div>
      </div>

      {activeScope === "platform" ? (
        /* Super Admin Platform Navigation Workspace */
        <div className="crm-table-workspace-sticky space-y-3">
          {/* Platform Search & Group Filter Toolbar */}
          <CRMToolbar
            placeholder="Search Super Admin menus by name, route, key, description..."
            searchQuery={search}
            setSearchQuery={setSearch}
            sticky={false}
          >
            <div className="flex items-center gap-2">
              {/* Group Filter */}
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Domain Groups</option>
                {currentAvailableGroups.map((g) => (
                  <option key={g} value={g}>
                    Group: {g}
                  </option>
                ))}
              </select>
            </div>
          </CRMToolbar>

          <div className="crm-table-wrap crm-table-no-pagination">
            {platformLoading ? (
              <PlatformModulesTableSkeleton />
            ) : sortedPlatformMenus.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Shield}
                  title="No Super Admin menus match your criteria"
                  description="Try clearing your search query or group filter to view all platform navigation controls."
                  action={{
                    label: "Clear Filters",
                    onClick: () => {
                      setSearch("");
                      setGroupFilter("ALL");
                    },
                  }}
                />
              </div>
            ) : (
              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                    <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                      <th className="h-10 sm:h-11 px-3 sm:px-4 py-2.5 w-16 text-center bg-card whitespace-nowrap">
                        <DataTableColumnHeader
                          title="Order"
                          align="center"
                          sortable
                          sortDirection={platformSortConfig.key === "order" ? platformSortConfig.direction : null}
                          onSort={(dir) => handlePlatformSort("order", dir)}
                        />
                      </th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                        <DataTableColumnHeader
                          title="Menu & Route"
                          sortable
                          sortDirection={platformSortConfig.key === "label" ? platformSortConfig.direction : null}
                          onSort={(dir) => handlePlatformSort("label", dir)}
                        />
                      </th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                        <DataTableColumnHeader
                          title="Group & Description"
                          sortable
                          sortDirection={platformSortConfig.key === "group" ? platformSortConfig.direction : null}
                          onSort={(dir) => handlePlatformSort("group", dir)}
                        />
                      </th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Access Level</th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Status</th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">Quick Navigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedPlatformMenus.map((menu) => {
                      const Icon = getDynamicIcon(menu.icon);
                      return (
                        <tr key={menu.key} className="group h-16 hover:bg-muted/[0.03] transition-colors">
                          {/* Order */}
                          <td className="px-3 sm:px-4 py-4 text-center font-mono text-xs font-bold text-foreground">
                            {menu.sortOrder}
                          </td>

                          {/* Menu & Route */}
                          <td className="px-4 sm:px-6 py-4 font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSuperAdminMenu(menu)}
                                  className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors text-left truncate block cursor-pointer"
                                >
                                  {menu.label}
                                </button>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-muted-foreground border border-border/50">
                                    <LinkIcon className="w-2.5 h-2.5" />
                                    {menu.route}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyRoute(menu.route)}
                                    className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                                    title="Copy route path"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Group & Description */}
                          <td className="px-4 sm:px-6 py-4 max-w-md">
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border/60">
                                <FolderTree className="w-3 h-3 text-muted-foreground shrink-0" />
                                {menu.group}
                              </span>
                              <TruncatedText text={menu.description} lines={2} className="text-xs text-muted-foreground mt-1" />
                            </div>
                          </td>

                          {/* Access Level */}
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold text-[10px] gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              Super Admin Only (AAL2)
                            </Badge>
                          </td>

                          {/* Status */}
                          <td className="px-4 sm:px-6 py-4 text-center">
                            {menu.isEnabled && menu.isVisible ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active
                              </span>
                            ) : !menu.isEnabled ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                <XCircle className="w-3.5 h-3.5" />
                                Disabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                <EyeOff className="w-3.5 h-3.5" />
                                Hidden
                              </span>
                            )}
                          </td>

                          {/* Quick Navigation & Actions */}
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs font-bold">
                                <Link href={menu.route}>
                                  Open Section
                                </Link>
                              </Button>

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
                                <DropdownMenuContent align="end" className="rounded-xl w-52 shadow-lg border-border">
                                  <DropdownMenuLabel className="text-xs font-bold">
                                    Menu Controls
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem asChild className="text-xs gap-2 cursor-pointer font-medium">
                                    <Link href={menu.route}>
                                      <LinkIcon className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Open Section</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => window.open(menu.route, "_blank")}
                                    className="text-xs gap-2 cursor-pointer font-medium"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                                    <span>Open in New Tab</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCopyRoute(menu.route)}
                                    className="text-xs gap-2 cursor-pointer font-medium"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Copy Route Path</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setSelectedSuperAdminMenu(menu)}
                                    className="text-xs gap-2 cursor-pointer font-semibold text-foreground"
                                  >
                                    <Info className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>View Security & Metadata</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Platform Tab Pagination */}
          {!platformLoading && sortedPlatformMenus.length > 0 && (
            <CRMPagination
              currentPage={platformPage}
              totalPages={platformTotalPages}
              totalItems={sortedPlatformMenus.length}
              rowsPerPage={platformRowsPerPage}
              onPageChange={setPlatformPage}
              onRowsPerPageChange={(rpp) => {
                setPlatformRowsPerPage(rpp);
                setPlatformPage(1);
              }}
            />
          )}
        </div>
      ) : (
        <div className="crm-table-workspace-sticky">
          {/* 3. Filter Toolbar */}
          <CRMToolbar
            placeholder="Search modules by name, key, route, group..."
            searchQuery={search}
            setSearchQuery={setSearch}
            sticky={false}
          >
            <div className="flex items-center gap-2">
              {/* Group Filter */}
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="ENABLED">Enabled Only</option>
                <option value="DISABLED">Disabled Only</option>
              </select>
            </div>
          </CRMToolbar>

          {/* 4. Modules Data Table */}
          <div className={cn("crm-table-wrap", (loading || filteredModules.length <= rowsPerPage) && "crm-table-no-pagination")}>
            {loading ? (
              <PlatformModulesTableSkeleton />
            ) : filteredModules.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Layers}
                  title="No modules match your criteria"
                  description={
                    search || groupFilter !== "ALL" || statusFilter !== "ALL"
                      ? "Try clearing your search filters or add a new custom platform module."
                      : "No platform modules have been registered yet."
                  }
                  action={{
                    label: "Add Module",
                    onClick: handleOpenCreate,
                  }}
                />
              </div>
            ) : (
              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                    <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                      <th className="h-10 sm:h-11 px-3 sm:px-4 py-2.5 w-16 text-center bg-card whitespace-nowrap">
                        <DataTableColumnHeader
                          title="Order"
                          align="center"
                          sortable
                          sortDirection={sortConfig.key === "order" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("order", dir)}
                        />
                      </th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                        <DataTableColumnHeader
                          title="Module & Route"
                          sortable
                          sortDirection={sortConfig.key === "label" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("label", dir)}
                        />
                      </th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">
                        <DataTableColumnHeader
                          title="Category & Access"
                          sortable
                          sortDirection={sortConfig.key === "group" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("group", dir)}
                        />
                      </th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Type</th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">
                        <DataTableColumnHeader
                          title="Global Status"
                          align="center"
                          sortable
                          sortDirection={sortConfig.key === "isEnabled" ? sortConfig.direction : null}
                          onSort={(dir) => handleSort("isEnabled", dir)}
                        />
                      </th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Sidebar Nav</th>
                      <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedModules.map((mod, pageIndex) => {
                      const Icon = getDynamicIcon(mod.icon);
                      const globalIndex = (currentPage - 1) * rowsPerPage + pageIndex;
                      const isFirst = globalIndex === 0;
                      const isLast = globalIndex === sortedModules.length - 1;

                      return (
                        <tr
                          key={mod.id}
                          className="group h-16 hover:bg-muted/[0.03] transition-colors"
                        >
                          {/* Drag Handle & Order */}
                          <td className="px-3 sm:px-4 py-4 text-center">
                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                              {mod.sortOrder}
                            </span>
                          </td>

                          {/* Label & Route */}
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    onClick={() => handleOpenEdit(mod)}
                                    className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer truncate"
                                  >
                                    {mod.label}
                                  </span>
                                  {mod.badge && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 font-semibold bg-primary/10 text-primary border-primary/20 shrink-0"
                                    >
                                      {mod.badge}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-muted-foreground border border-border/50">
                                    <LinkIcon className="w-2.5 h-2.5" />
                                    {mod.route}
                                  </span>
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    key: {mod.key}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Permission */}
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border/60">
                                <FolderTree className="w-3 h-3 text-muted-foreground shrink-0" />
                                {mod.group}
                              </span>
                              {mod.permission && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                                  {mod.permission}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Core vs Custom */}
                          <td className="px-4 py-4 text-center">
                            {mod.isSystem ? (
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-semibold text-[10px] gap-1"
                              >
                                <Lock className="w-3 h-3 text-slate-500" />
                                Core
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 font-semibold text-[10px] gap-1"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-500" />
                                Custom
                              </Badge>
                            )}
                          </td>

                          {/* Global Status Switch */}
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={mod.isEnabled}
                                onCheckedChange={(checked) =>
                                  handleToggleStatus(mod, "isEnabled", checked)
                                }
                                className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                              />
                              <span
                                className={`text-xs font-bold ${
                                  mod.isEnabled
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {mod.isEnabled ? "Active" : "Off"}
                              </span>
                            </div>
                          </td>

                          {/* Sidebar Visibility Toggle */}
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() =>
                                handleToggleStatus(mod, "isVisible", !mod.isVisible)
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                mod.isVisible
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                              }`}
                              title={mod.isVisible ? "Visible in sidebar navigation" : "Hidden from sidebar navigation"}
                            >
                              {mod.isVisible ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Visible</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions Menu */}
                          <td className="px-4 py-4 text-right">
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
                                <DropdownMenuContent align="end" className="rounded-xl w-52 shadow-lg border-border">
                                  <DropdownMenuLabel className="text-xs font-bold">
                                    Module Actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEdit(mod)}
                                    className="text-xs gap-2 cursor-pointer font-medium"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-primary" />
                                    <span>Edit Module Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(mod, "isVisible", !mod.isVisible)}
                                    className="text-xs gap-2 cursor-pointer font-medium"
                                  >
                                    {mod.isVisible ? (
                                      <>
                                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Hide from Navigation</span>
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Show in Navigation</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(mod, "isEnabled", !mod.isEnabled)}
                                    className="text-xs gap-2 cursor-pointer font-medium"
                                  >
                                    {mod.isEnabled ? (
                                      <>
                                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                        <span>Disable Module Globally</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Enable Module Globally</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={mod.isSystem}
                                    onClick={() => setModuleToDelete(mod)}
                                    className={`text-xs gap-2 cursor-pointer font-semibold ${
                                      mod.isSystem
                                        ? "opacity-40 cursor-not-allowed"
                                        : "text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 dark:text-rose-400 dark:focus:text-rose-400 dark:focus:bg-rose-500/20"
                                    }`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                                    <span>{mod.isSystem ? "Protected System Module" : "Delete Module"}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && sortedModules.length > 0 && (
            <CRMPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedModules.length}
              rowsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={setRowsPerPage}
              itemName="Modules"
            />
          )}
        </div>
      )}

      {/* 5. Add / Edit Module Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <DynamicIcon name={formIcon} className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {editingModule ? "Edit Platform Module" : "Add New Platform Module"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Configure the module label, route path, icon, category grouping, and access controls.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveModule} className="space-y-4 pt-2">
            {/* Label & Key */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="module-label" className="text-xs font-bold text-foreground">
                  Display Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="module-label"
                  placeholder="Enter display label"
                  value={formLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  required
                  className="h-9 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="module-key" className="text-xs font-bold text-foreground">
                  Unique Key Identifier <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="module-key"
                  placeholder="Enter unique key identifier"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  disabled={editingModule?.isSystem}
                  required
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Route & Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="module-route" className="text-xs font-bold text-foreground">
                  Route Path <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="module-route"
                  placeholder="Enter route path (/path)"
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  required
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="module-group" className="text-xs font-bold text-foreground">
                  Navigation Group
                </Label>
                <select
                  id="module-group"
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Core">Core</option>
                  <option value="Insights">Insights</option>
                  <option value="Administration">Administration</option>
                  <option value="HRM & Operations">HRM & Operations</option>
                  <option value="Support">Support</option>
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
            </div>

            {/* Icon Picker Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Module Icon <span className="text-muted-foreground font-normal">({formIcon})</span>
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

              {/* Icon Grid */}
              <div className="grid grid-cols-8 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 max-h-36 overflow-y-auto">
                {filteredIcons.map((iconName) => {
                  const IconComp = getDynamicIcon(iconName);
                  const isSelected = formIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      title={iconName}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permission & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="module-permission" className="text-xs font-bold text-foreground">
                  RBAC Permission Key
                </Label>
                <Input
                  id="module-permission"
                  placeholder="Enter RBAC permission key"
                  value={formPermission}
                  onChange={(e) => setFormPermission(e.target.value)}
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="module-badge" className="text-xs font-bold text-foreground">
                  Badge Label <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="module-badge"
                  placeholder="Enter badge label (New, Beta, Pro, etc.)"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="module-description" className="text-xs font-bold text-foreground">
                Description
              </Label>
              <Input
                id="module-description"
                placeholder="Brief explanation of the module purpose"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Globally Enabled</p>
                  <p className="text-[11px] text-muted-foreground">Available to platform tenants</p>
                </div>
                <Switch
                  checked={formIsEnabled}
                  onCheckedChange={setFormIsEnabled}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Sidebar Visible</p>
                  <p className="text-[11px] text-muted-foreground">Display in main navigation</p>
                </div>
                <Switch
                  checked={formIsVisible}
                  onCheckedChange={setFormIsVisible}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-9 rounded-xl text-xs font-medium"
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
                  "Update Module"
                ) : (
                  "Create Module"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Safe Delete Confirmation Modal */}
      <Dialog
        open={Boolean(moduleToDelete)}
        onOpenChange={(open) => {
          if (!open) setModuleToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px] rounded-2xl border-border bg-card shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  moduleToDelete?.isSystem
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {moduleToDelete?.isSystem ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {moduleToDelete?.isSystem
                    ? "Protected System Module"
                    : "Delete Platform Module"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {moduleToDelete?.isSystem
                    ? "This module is essential to core CRM operations."
                    : "This action will permanently delete this module from platform navigation."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3">
            {moduleToDelete?.isSystem ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Cannot delete core module &quot;{moduleToDelete?.label}&quot;
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  System modules provide vital data models and workflows. Instead of deleting,
                  you can switch off <strong>Global Status</strong> or <strong>In Sidebar</strong> to hide it from tenant users.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 text-xs text-foreground space-y-2">
                <p>
                  Are you sure you want to delete module{" "}
                  <strong>&quot;{moduleToDelete?.label}&quot;</strong> (<code>{moduleToDelete?.route}</code>)?
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Organization users will no longer see this module in their navigation.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModuleToDelete(null)}
              className="h-9 rounded-xl text-xs font-medium"
            >
              {moduleToDelete?.isSystem ? "Understood" : "Cancel"}
            </Button>

            {!moduleToDelete?.isSystem && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="h-9 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Super Admin Navigation Menu Details Modal */}
      <Dialog
        open={Boolean(selectedSuperAdminMenu)}
        onOpenChange={(open) => {
          if (!open) setSelectedSuperAdminMenu(null);
        }}
      >
        <DialogContent className="sm:max-w-[540px] rounded-2xl border-border bg-card shadow-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                <DynamicIcon name={selectedSuperAdminMenu?.icon} className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{selectedSuperAdminMenu?.label}</span>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold text-[10px]"
                  >
                    System Control
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Root Platform Administration Navigation Details & IAM Policy
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Route Endpoint
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-foreground truncate">
                    {selectedSuperAdminMenu?.route}
                  </code>
                  <button
                    type="button"
                    onClick={() => selectedSuperAdminMenu && handleCopyRoute(selectedSuperAdminMenu.route)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    title="Copy route path"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Menu Key & Order
                </span>
                <p className="text-xs font-mono font-bold text-foreground">
                  {selectedSuperAdminMenu?.key} (#{selectedSuperAdminMenu?.sortOrder})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Hierarchy Domain
                </span>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-muted-foreground" />
                  {selectedSuperAdminMenu?.group}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Security Level
                </span>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Super Admin Root IAM (AAL2)
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Functional Scope & Description
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {selectedSuperAdminMenu?.description}
              </p>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedSuperAdminMenu(null)}
              className="h-9 rounded-xl text-xs font-medium"
            >
              Close
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedSuperAdminMenu) {
                    window.open(selectedSuperAdminMenu.route, "_blank");
                  }
                }}
                className="h-9 px-3 rounded-xl text-xs font-medium gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
                <span>New Tab</span>
              </Button>

              {selectedSuperAdminMenu && (
                <Button
                  asChild
                  size="sm"
                  className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Link href={selectedSuperAdminMenu.route}>
                    Open Section
                  </Link>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CRMPageContainer>
  );
}
