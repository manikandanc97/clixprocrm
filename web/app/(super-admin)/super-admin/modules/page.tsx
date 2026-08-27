"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "@/shared/components/crm";
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

const SUPER_ADMIN_NAV_MENUS = [
  {
    key: "overview",
    label: "Overview",
    icon: "LayoutDashboard",
    route: "/super-admin",
    group: "Overview",
    sortOrder: 1,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Multi-tenant health metrics, live platform activity stream, and tenant summary",
  },
  {
    key: "copilot",
    label: "ClixPro AI",
    icon: "Sparkles",
    route: "/super-admin/copilot",
    group: "Platform",
    sortOrder: 2,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Intelligent platform operations copilot and interactive root administrative assistant",
  },
  {
    key: "organizations",
    label: "Organizations",
    icon: "Building2",
    route: "/super-admin/organizations",
    group: "Platform",
    sortOrder: 3,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Manage multi-tenant workspaces, subscription plans, tenant quotas, and lifecycle",
  },
  {
    key: "users",
    label: "Platform Users",
    icon: "Users",
    route: "/super-admin/users",
    group: "Platform",
    sortOrder: 4,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Global user directory, administrative privilege control, and cross-org access",
  },
  {
    key: "modules",
    label: "Platform Modules",
    icon: "Layers",
    route: "/super-admin/modules",
    group: "Platform",
    sortOrder: 5,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Configure global modules, menu hierarchy, icon customization, and navigation visibility",
  },
  {
    key: "plans",
    label: "Plans & Packages",
    icon: "CreditCard",
    route: "/super-admin/plans",
    group: "Commerce",
    sortOrder: 6,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Multi-tenant subscription tiers, pricing models, feature packaging, and MRR metrics",
  },
  {
    key: "billing",
    label: "Billing & Revenue",
    icon: "Receipt",
    route: "/super-admin/billing",
    group: "Commerce",
    sortOrder: 7,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Platform-wide invoice collections, payment processing, transaction logs, and MRR cashflow",
  },
  {
    key: "ai",
    label: "AI Models & Tiers",
    icon: "Brain",
    route: "/super-admin/ai",
    group: "AI Platform",
    sortOrder: 8,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Multi-tenant LLM provider routing, token quotas, tier allocations, and prompt controls",
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: "BarChart3",
    route: "/super-admin/analytics",
    group: "Insights",
    sortOrder: 9,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Cross-tenant SaaS metrics, MRR projections, growth velocity, and system telemetry",
  },
  {
    key: "security",
    label: "Security Center",
    icon: "ShieldCheck",
    route: "/super-admin/security",
    group: "Security & Operations",
    sortOrder: 10,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Root IAM policy enforcement, multi-factor authentication requirements, and IP firewall filters",
  },
  {
    key: "secops",
    label: "SecOps Telemetry",
    icon: "Activity",
    route: "/super-admin/security/operations",
    group: "Security & Operations",
    sortOrder: 11,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Live node health telemetry, cluster metrics, threat detection signals, and real-time alerts",
  },
  {
    key: "audit_logs",
    label: "Audit Logs",
    icon: "FileClock",
    route: "/super-admin/audit-logs",
    group: "Security & Operations",
    sortOrder: 12,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Immutable cross-tenant audit trail, security events, and administrative mutations",
  },
  {
    key: "settings",
    label: "Platform Settings",
    icon: "Settings",
    route: "/super-admin/settings",
    group: "Configuration",
    sortOrder: 13,
    isSystem: true,
    isEnabled: true,
    isVisible: true,
    description: "Global application configuration, environment settings, and multi-tenant feature toggles",
  },
];

/* -------------------------------------------------------------------------- */
/*  Inline table-only skeleton — used when page is mounted but data is loading */
/* -------------------------------------------------------------------------- */
function PlatformModulesTableSkeleton() {
  return (
    <div className="overflow-auto flex-1 min-h-0 rounded-xl border border-border/60 bg-card shadow-sm">
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

  const [activeScope, setActiveScope] = useState<"tenant" | "platform">("tenant");
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    enabled: 0,
    disabled: 0,
    system: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, statusFilter]);

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

  const loadModules = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setAal2Required(false);
      const res = await fetchPlatformModules();
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
  };

  useEffect(() => {
    loadModules();

    const handleAal2Verified = () => {
      setAal2Required(false);
      setLoadError(null);
      loadModules();
    };

    window.addEventListener("clixpro:aal2-verified", handleAal2Verified);
    return () => {
      window.removeEventListener("clixpro:aal2-verified", handleAal2Verified);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      handleOpenCreate();
    }
  }, [searchParams]);

  // Distinct groups available
  const availableGroups = useMemo(() => {
    const set = new Set<string>(["Core", "Insights", "Administration", "HRM & Operations", "Support"]);
    modules.forEach((m) => {
      if (m.group) set.add(m.group);
    });
    return Array.from(set);
  }, [modules]);

  // Filtered modules
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

  const totalPages = Math.max(1, Math.ceil(filteredModules.length / rowsPerPage));
  const paginatedModules = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredModules.slice(start, start + rowsPerPage);
  }, [filteredModules, currentPage, rowsPerPage]);

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
      // Reload stats
      const res = await fetchPlatformModules();
      setStats(res.stats);
    } catch (err: any) {
      // Revert on error
      setModules((prev) =>
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reorder modules.");
      await loadModules();
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
    <CRMPageContainer>
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
          title="Total Modules"
          value={stats.total}
          icon={Boxes}
          color="indigo"
          comparisonText="Registered platform features"
        />
        <CRMMetricCard
          title="Active Modules"
          value={stats.enabled}
          icon={CheckCircle2}
          color="emerald"
          comparisonText="Globally enabled for users"
        />
        <CRMMetricCard
          title="Disabled Modules"
          value={stats.disabled}
          icon={XCircle}
          color="orange"
          comparisonText="Hidden from navigation"
        />
        <CRMMetricCard
          title="Core System"
          value={stats.system}
          icon={Shield}
          color="violet"
          comparisonText="Protected foundations"
        />
      </CRMMetricsGrid>

      {/* 2.5 Navigation Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveScope("tenant")}
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
            onClick={() => setActiveScope("platform")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeScope === "platform"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Super Admin Platform Menus ({SUPER_ADMIN_NAV_MENUS.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
          <span className="font-semibold">
            {activeScope === "tenant"
              ? "Configuring dynamic workspace navigation visible to CRM roles"
              : "Root platform administration menus & system routes"}
          </span>
        </div>
      </div>

      {activeScope === "platform" ? (
        /* Super Admin Platform Navigation Table */
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Platform Control Navigation Hierarchy</h3>
                <p className="text-xs text-muted-foreground">These menus are rendered in the Super Admin left sidebar navigation.</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {SUPER_ADMIN_NAV_MENUS.length} System Controls Active
            </span>
          </div>

          <div className="overflow-auto max-h-[calc(100vh-250px)] min-h-[320px]">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
                <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] leading-tight text-muted-foreground">
                  <th className="h-10 sm:h-11 px-4 py-2.5 w-16 text-center bg-card whitespace-nowrap">Order</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">Menu & Route</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">Group & Description</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Access Level</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Status</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">Quick Navigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {SUPER_ADMIN_NAV_MENUS.map((menu) => {
                  const Icon = getDynamicIcon(menu.icon);
                  return (
                    <tr key={menu.key} className="group h-16 hover:bg-muted/[0.03] transition-colors">
                      <td className="px-4 py-4 text-center font-mono text-xs font-bold text-foreground">
                        {menu.sortOrder}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <Link href={menu.route} className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors">
                              {menu.label}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-muted-foreground border border-border/50">
                                <LinkIcon className="w-2.5 h-2.5" />
                                {menu.route}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border/60">
                            <FolderTree className="w-3 h-3 text-muted-foreground shrink-0" />
                            {menu.group}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1 max-w-md">{menu.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold text-[10px] gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          Super Admin Only
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs font-bold">
                          <Link href={menu.route}>
                            Open Section
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Filter Toolbar */}
          <CRMToolbar
            placeholder="Search modules by name, key, route, group..."
            searchQuery={search}
            setSearchQuery={setSearch}
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
          <div className={cn("crm-table-wrap", (loading || filteredModules.length === 0) && "crm-table-no-pagination")}>
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
                  <th className="h-10 sm:h-11 px-3 sm:px-4 py-2.5 w-16 text-center bg-card whitespace-nowrap">Order</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">Module & Route</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-left bg-card whitespace-nowrap">Category & Access</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Type</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Global Status</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-center bg-card whitespace-nowrap">Sidebar Nav</th>
                  <th className="h-10 sm:h-11 px-4 sm:px-6 py-2.5 text-right bg-card whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedModules.map((mod, pageIndex) => {
                  const Icon = getDynamicIcon(mod.icon);
                  const globalIndex = (currentPage - 1) * rowsPerPage + pageIndex;
                  const isFirst = globalIndex === 0;
                  const isLast = globalIndex === filteredModules.length - 1;

                  return (
                    <tr
                      key={mod.id}
                      className="group h-16 hover:bg-muted/[0.03] transition-colors"
                    >
                      {/* Reorder Buttons */}
                      <td className="px-3 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleMoveOrder(globalIndex, "up")}
                            disabled={isFirst || reordering}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs font-bold text-foreground w-4 text-center">
                            {mod.sortOrder}
                          </span>
                          <button
                            onClick={() => handleMoveOrder(globalIndex, "down")}
                            disabled={isLast || reordering}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:hover:bg-transparent transition-all cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Module Icon, Title, Badge, Route & Key */}
                      <td className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
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
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/40 truncate max-w-[140px]">
                            {mod.permission || "Public (All)"}
                          </span>
                        </div>
                      </td>

                      {/* System vs Custom Type */}
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

                      {/* Global Status Toggle */}
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
      {!loading && filteredModules.length > 0 && (
        <CRMPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredModules.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={setRowsPerPage}
          itemName="Modules"
        />
      )}
      </>
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
    </CRMPageContainer>
  );
}
