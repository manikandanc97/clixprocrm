"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CreditCard,
  Check,
  Building2,
  Sparkles,
  Edit,
  X,
  Sliders,
  CheckCircle2,
  Search,
  Bot,
  HardDrive,
  Users,
  Target,
  AlertCircle,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Shield,
  TrendingUp,
  Zap,
  ChevronRight,
  Crown,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { toast } from "sonner";
import {
  fetchPlatformPlans,
  createPlatformPlan,
  updatePlatformPlan,
  deletePlatformPlan,
  formatPlanPrice,
  PlatformPlanItem,
  FeatureCatalogItem,
} from "@/shared/lib/api/super-admin.api";
import {
  CRMPageContainer,
  CRMPageHeader,
} from "@/shared/components/crm";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { compareFormValues } from "@/shared/hooks/use-dirty-form";
import { UnsavedWarning } from "@/shared/components/unsaved-warning";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

type ConfigTab = "basic" | "pricing" | "limits" | "ai" | "features";

export function filterPureFeatures(features: string[]): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((feat) => {
    if (!feat || typeof feat !== "string") return false;
    const f = feat.trim();
    // Exclude quota repetitions matching top tiles (team members/seats, leads, contacts, storage)
    if (/^\s*(up to \d+|\d+[\d,]*|unlimited)\s*(team members|users|members|seats)/i.test(f)) return false;
    if (/\b\d+[\d,]*\s*contacts\b/i.test(f) && /\b\d+[\d,]*\s*leads\b/i.test(f)) return false;
    if (/^\s*(unlimited\s*)?(contacts|leads)\s*(&|and)?\s*(contacts|leads)?/i.test(f) && /\b(contacts|leads)\b/i.test(f)) return false;
    if (/^\s*\d+[\d,]*\s*GB\s*(cloud\s*)?storage/i.test(f)) return false;
    return true;
  });
}

function PlanEntitlementsList({ features }: { features: string[] }) {
  const cleanFeatures = filterPureFeatures(features);
  const MAX_INITIAL_VISIBLE = 8;
  const shouldTruncate = cleanFeatures.length > MAX_INITIAL_VISIBLE;
  const visibleFeatures = shouldTruncate ? cleanFeatures.slice(0, MAX_INITIAL_VISIBLE) : cleanFeatures;
  const remainingFeatures = shouldTruncate ? cleanFeatures.slice(MAX_INITIAL_VISIBLE) : [];

  return (
    <div className="pt-3 border-t border-border/50 flex flex-col space-y-2.5">
      <div>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            Included Entitlements
          </p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40">
            {cleanFeatures.length}
          </span>
        </div>

        <div className="space-y-1.5">
          {visibleFeatures.map((feat, fIdx) => (
            <div key={fIdx} className="flex items-center gap-2 text-xs py-0.5">
              <div className="h-4 w-4 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span className="text-foreground/90 font-medium leading-tight line-clamp-1">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {remainingFeatures.length > 0 && (
        <div className="pt-1 shrink-0">
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <span>+ {remainingFeatures.length} more features included</span>
                <ChevronRight className="h-3 w-3 opacity-70" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              sideOffset={6}
              className="bg-zinc-950/95 backdrop-blur-md text-zinc-100 dark:bg-zinc-900/95 dark:text-zinc-100 border border-zinc-800 shadow-2xl p-3.5 rounded-xl w-72 max-w-xs space-y-2.5 z-50 animate-in fade-in-0 zoom-in-95"
            >
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-2">
                <span className="font-bold text-xs text-white">
                  Additional Entitlements
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold tracking-wide border border-emerald-500/30">
                  +{remainingFeatures.length} more
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {remainingFeatures.map((feat, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2 text-xs py-0.5">
                    <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span className="text-zinc-200 font-medium leading-tight">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<PlatformPlanItem[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [featureCatalog, setFeatureCatalog] = useState<FeatureCatalogItem[]>([]);
  const [aiModels, setAiModels] = useState<Array<{ id: string; modelKey: string; displayName: string; provider: string }>>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Configuration Modal State (Edit / Create)
  const [editingPlan, setEditingPlan] = useState<PlatformPlanItem | null>(null);
  const [originalPlan, setOriginalPlan] = useState<PlatformPlanItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<ConfigTab>("basic");
  const [featureSearch, setFeatureSearch] = useState("");

  // Deletion Confirmation Modal State
  const [deletingPlan, setDeletingPlan] = useState<PlatformPlanItem | null>(null);

  const isDirty = useMemo(() => {
    if (isCreatingNew) return Boolean(editingPlan?.name?.trim());
    if (!editingPlan || !originalPlan) return false;
    return !compareFormValues(originalPlan, editingPlan);
  }, [editingPlan, originalPlan, isCreatingNew]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPlatformPlans();
      setPlans(Array.isArray(res?.plans) ? res.plans : []);
      setDistribution(res?.distribution || {});
      setFeatureCatalog(Array.isArray(res?.featureCatalog) ? res.featureCatalog : []);
      setAiModels(Array.isArray(res?.aiModels) ? res.aiModels : []);
    } catch (err: any) {
      console.error("Failed to load subscription plans:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load subscription plans.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Catalog for modal search
  const filteredCatalog = useMemo(() => {
    if (!featureCatalog || !Array.isArray(featureCatalog)) return [];
    if (!featureSearch.trim()) return featureCatalog;
    const q = featureSearch.toLowerCase();
    return featureCatalog.filter(
      (f) =>
        (f?.name || "").toLowerCase().includes(q) ||
        (f?.category || "").toLowerCase().includes(q) ||
        (f?.description || "").toLowerCase().includes(q)
    );
  }, [featureCatalog, featureSearch]);

  // Group features by category
  const groupedFeatures = useMemo(() => {
    const map: Record<string, FeatureCatalogItem[]> = {};
    (filteredCatalog || []).forEach((item) => {
      const cat = item?.category || "Core CRM";
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [filteredCatalog]);

  const handleOpenCreate = () => {
    const defaultModel = aiModels.length > 0 ? aiModels[0].id : null;
    const newPlanDraft: PlatformPlanItem = {
      id: "",
      name: "",
      description: "",
      price: "₹1,999",
      priceNum: 1999,
      annualPriceNum: 19990,
      currency: "INR",
      billing: "month",
      pricingMode: "FIXED",
      features: [
        "Lead & Contact Management",
        "Visual Sales Pipelines",
        "Tasks & Calendar Reminders",
        "Standard Reports & Analytics",
      ],
      maxUsers: 5,
      maxLeads: 2500,
      maxContacts: 5000,
      storageGb: 10,
      maxApiRequests: 25000,
      trialDays: 14,
      billingCycleMonthly: true,
      billingCycleAnnual: true,
      highlight: false,
      isActive: true,
      status: "ACTIVE",
      sortOrder: (plans.length || 0) + 1,
      tenantCount: 0,
      aiEnabled: true,
      aiLevel: "Standard AI",
      dailyTokenLimit: 50000,
      defaultModelId: defaultModel,
      defaultModel: null,
      allowedModelIds: defaultModel ? [defaultModel] : [],
      allowedModels: [],
    };

    setIsCreatingNew(true);
    setEditingPlan(newPlanDraft);
    setOriginalPlan(JSON.parse(JSON.stringify(newPlanDraft)));
    setActiveTab("basic");
    setFeatureSearch("");
  };

  const handleOpenConfigure = (plan: PlatformPlanItem) => {
    const cloned: PlatformPlanItem = {
      ...plan,
      features: Array.isArray(plan.features) ? [...plan.features] : [],
      allowedModelIds: Array.isArray(plan.allowedModelIds) ? [...plan.allowedModelIds] : [],
    };
    setIsCreatingNew(false);
    setEditingPlan(cloned);
    setOriginalPlan(JSON.parse(JSON.stringify(cloned)));
    setActiveTab("basic");
    setFeatureSearch("");
  };

  const handleCloseConfigure = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      setEditingPlan(null);
      setOriginalPlan(null);
      setIsCreatingNew(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !isDirty) return;

    if (!editingPlan.name || !editingPlan.name.trim()) {
      toast.error("Plan name is required.");
      return;
    }

    try {
      setSaving(true);
      if (isCreatingNew) {
        const res = await createPlatformPlan({
          id: editingPlan.id?.trim() || undefined,
          name: editingPlan.name.trim(),
          description: editingPlan.description,
          priceNum: Number(editingPlan.priceNum),
          annualPriceNum: Number(editingPlan.annualPriceNum),
          currency: editingPlan.currency,
          billing: editingPlan.billing,
          pricingMode: editingPlan.pricingMode,
          features: editingPlan.features,
          maxUsers: editingPlan.maxUsers,
          maxLeads: editingPlan.maxLeads,
          maxContacts: editingPlan.maxContacts,
          storageGb: Number(editingPlan.storageGb),
          maxApiRequests: editingPlan.maxApiRequests,
          trialDays: Number(editingPlan.trialDays),
          billingCycleMonthly: editingPlan.billingCycleMonthly,
          billingCycleAnnual: editingPlan.billingCycleAnnual,
          highlight: editingPlan.highlight,
          status: editingPlan.status,
          isActive: editingPlan.status === "ACTIVE",
          sortOrder: Number(editingPlan.sortOrder),
          aiEnabled: editingPlan.aiEnabled,
          aiLevel: editingPlan.aiLevel,
          dailyTokenLimit: Number(editingPlan.dailyTokenLimit),
          defaultModelId: editingPlan.defaultModelId,
          allowedModelIds: editingPlan.allowedModelIds,
        });

        if (res.success) {
          toast.success(`Plan "${editingPlan.name}" created successfully.`);
          setEditingPlan(null);
          setIsCreatingNew(false);
          await loadData();
        }
      } else {
        const res = await updatePlatformPlan(editingPlan.id, {
          name: editingPlan.name,
          description: editingPlan.description,
          priceNum: Number(editingPlan.priceNum),
          annualPriceNum: Number(editingPlan.annualPriceNum),
          currency: editingPlan.currency,
          billing: editingPlan.billing,
          pricingMode: editingPlan.pricingMode,
          features: editingPlan.features,
          maxUsers: editingPlan.maxUsers,
          maxLeads: editingPlan.maxLeads,
          maxContacts: editingPlan.maxContacts,
          storageGb: Number(editingPlan.storageGb),
          maxApiRequests: editingPlan.maxApiRequests,
          trialDays: Number(editingPlan.trialDays),
          billingCycleMonthly: editingPlan.billingCycleMonthly,
          billingCycleAnnual: editingPlan.billingCycleAnnual,
          highlight: editingPlan.highlight,
          status: editingPlan.status,
          isActive: editingPlan.status === "ACTIVE",
          sortOrder: Number(editingPlan.sortOrder),
          aiEnabled: editingPlan.aiEnabled,
          aiLevel: editingPlan.aiLevel,
          dailyTokenLimit: Number(editingPlan.dailyTokenLimit),
          defaultModelId: editingPlan.defaultModelId,
          allowedModelIds: editingPlan.allowedModelIds,
        });

        if (res.success) {
          toast.success(`Plan "${editingPlan.name}" updated successfully.`);
          setEditingPlan(null);
          await loadData();
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save plan configuration.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (plan: PlatformPlanItem) => {
    try {
      setDeleting(true);
      const res = await deletePlatformPlan(plan.id);
      if (res.success) {
        toast.success(`Plan "${plan.name}" deleted successfully.`);
        setDeletingPlan(null);
        if (editingPlan?.id === plan.id) {
          setEditingPlan(null);
        }
        await loadData();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || `Failed to delete plan "${plan.name}".`;
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const toggleFeature = (featureName: string) => {
    if (!editingPlan) return;
    const currentFeatures = Array.isArray(editingPlan.features) ? editingPlan.features : [];
    const exists = currentFeatures.includes(featureName);
    const updatedFeatures = exists
      ? currentFeatures.filter((f) => f !== featureName)
      : [...currentFeatures, featureName];
    setEditingPlan({ ...editingPlan, features: updatedFeatures });
  };

  const toggleAllowedModel = (modelId: string) => {
    if (!editingPlan) return;
    const currentAllowed = Array.isArray(editingPlan.allowedModelIds) ? editingPlan.allowedModelIds : [];
    const exists = currentAllowed.includes(modelId);
    let updated = exists
      ? currentAllowed.filter((id) => id !== modelId)
      : [...currentAllowed, modelId];

    let newDefaultId = editingPlan.defaultModelId;
    if (exists && editingPlan.defaultModelId === modelId) {
      newDefaultId = updated.length > 0 ? updated[0] : null;
    }

    setEditingPlan({
      ...editingPlan,
      allowedModelIds: updated,
      defaultModelId: newDefaultId,
    });
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
            <AppIcon
              name="plans"
              icon={CreditCard}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Plans &amp; Subscriptions
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage canonical subscription tiers, real-time pricing models, resource quotas, AI entitlements, and custom tiers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon name="plus" icon={Plus} size={14} className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Create Plan</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <Button size="sm" variant="outline" onClick={loadData} className="rounded-xl">
            Retry
          </Button>
        </div>
      )}

      {/* 2. Subscription Plans Cards Grid - Consistent header spacing matching all super admin screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-card border border-border p-5 flex flex-col justify-between shadow-xs animate-pulse space-y-4 min-h-[440px]"
            >
              <div className="space-y-3">
                <div className="h-5 bg-muted rounded-lg w-1/3" />
                <div className="h-3.5 bg-muted/60 rounded-md w-3/4" />
                <div className="h-8 bg-muted rounded-lg w-1/2 mt-2" />
                <div className="space-y-2 pt-3">
                  <div className="h-3 bg-muted/50 rounded w-full" />
                  <div className="h-3 bg-muted/50 rounded w-4/5" />
                  <div className="h-3 bg-muted/50 rounded w-3/4" />
                </div>
              </div>
              <div className="h-9 bg-muted rounded-xl w-full" />
            </div>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-full py-16 px-6 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-4">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No Subscription Plans Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active subscription tiers are currently configured for this platform.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="rounded-xl gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Create First Plan
            </Button>
          </div>
        ) : (
          plans.map((plan, idx) => {
            const planId = (plan.id || "").toLowerCase();
            const planName = (plan.name || "").toLowerCase();
            const orgCount = planId ? (distribution[planId] || 0) : 0;

            // Starter is prominently designated as the Most Popular tier
            const isPopular = Boolean(plan.highlight || planId === "starter" || planName === "starter");
            const isCustom = plan.pricingMode === "CUSTOM";
            const planFeatures = Array.isArray(plan.features) ? plan.features : [];

            // Distinctive theme styling per tier matching Orbit design system
            const getTierTheme = () => {
              if (planName.includes("free") || planId.includes("free")) {
                return {
                  icon: Shield,
                  iconBackdrop: "bg-blue-500/20",
                  iconFront: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/25",
                  cardBorder: "border-border/80",
                  gradientBg: "from-blue-500/[0.03] via-card to-card",
                  watermarkIcon: Shield,
                };
              }
              if (planName.includes("starter") || planId.includes("starter") || isPopular) {
                return {
                  icon: Sparkles,
                  iconBackdrop: "bg-emerald-500/25",
                  iconFront: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/30",
                  cardBorder: "border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/5",
                  gradientBg: "from-emerald-500/[0.08] via-emerald-500/[0.015] to-card",
                  watermarkIcon: Sparkles,
                };
              }
              if (planName.includes("growth") || planName.includes("pro") || planId.includes("growth")) {
                return {
                  icon: TrendingUp,
                  iconBackdrop: "bg-purple-500/20",
                  iconFront: "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-sm shadow-purple-500/25",
                  cardBorder: "border-border/80",
                  gradientBg: "from-purple-500/[0.03] via-card to-card",
                  watermarkIcon: TrendingUp,
                };
              }
              return {
                icon: Crown,
                iconBackdrop: "bg-amber-500/20",
                iconFront: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm shadow-amber-500/25",
                cardBorder: "border-border/80",
                gradientBg: "from-amber-500/[0.03] via-card to-card",
                watermarkIcon: Crown,
              };
            };

            const tierTheme = getTierTheme();
            const HeaderIcon = tierTheme.icon;
            const WatermarkIcon = tierTheme.watermarkIcon;

            return (
              <div
                key={plan.id || `plan-${idx}`}
                className={`rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden ${
                  isPopular
                    ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/[0.08] via-card to-card ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/10"
                    : `${tierTheme.cardBorder} bg-gradient-to-b ${tierTheme.gradientBg} shadow-xs`
                }`}
              >
                {/* Subtle Decorative Background Watermark Icon */}
                <div className="pointer-events-none absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.03] dark:opacity-[0.05] select-none flex items-center justify-center">
                  <WatermarkIcon className="w-full h-full text-foreground" strokeWidth={1} />
                </div>

                {/* Most Popular Floating Pill */}
                {isPopular && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="px-3.5 py-1 rounded-b-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md shadow-emerald-600/30 flex items-center gap-1.5 border-x border-b border-emerald-400/30">
                      <Sparkles className="h-3 w-3 animate-pulse text-amber-300" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="space-y-3.5 flex flex-col z-10">
                  {/* Card Header: 3D Layered Icon Box + Title & ACTIVE badge */}
                  <div className="shrink-0 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* 3D Layered Icon */}
                        <div className="relative flex items-center justify-center shrink-0">
                          <div
                            className={`absolute -left-0.5 -top-0.5 w-10 h-10 rounded-xl ${tierTheme.iconBackdrop}`}
                          />
                          <div
                            className={`relative z-10 flex size-10 items-center justify-center rounded-xl text-white ${tierTheme.iconFront}`}
                          >
                            <HeaderIcon className="h-5 w-5" />
                          </div>
                        </div>

                        <div>
                          <h3 className="font-extrabold text-lg text-foreground tracking-tight leading-none">
                            {plan.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-1">
                            {plan.description || "Platform SaaS subscription tier."}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {plan.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border uppercase tracking-wider">
                            {plan.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Workspaces Section */}
                  <div className="pt-2.5 border-t border-border/50 shrink-0 flex items-center justify-between gap-2.5">
                    {isCustom ? (
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-2xl font-black text-foreground tracking-tight">
                          Custom
                        </span>
                        <p className="text-[11px] text-muted-foreground font-medium truncate">
                          Contact Sales
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                          {formatPlanPrice(plan.priceNum, plan.currency)}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground shrink-0">
                          / month
                        </span>
                      </div>
                    )}

                    {/* Small Workspaces Card on Right */}
                    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-muted/40 border border-border/50 shadow-2xs shrink-0">
                      <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center text-muted-foreground border border-border/40 shadow-2xs shrink-0">
                        <Building2 className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">
                          Workspaces
                        </span>
                        <span className="font-extrabold text-foreground text-xs block leading-tight mt-0.5">
                          {orgCount} {orgCount === 1 ? "org" : "orgs"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resource Limits: 2x2 Clean Micro-Tiles Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 shrink-0">
                    {/* Users */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">Users</span>
                        <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                          {plan.maxUsers === -1 ? "Unlimited" : `${plan.maxUsers} Users`}
                        </span>
                      </div>
                    </div>

                    {/* Leads & Contacts */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Target className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">Leads</span>
                        <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                          {plan.maxLeads === -1 ? "Unlimited" : `${(plan.maxLeads || 0).toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    {/* Storage */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <HardDrive className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">Storage</span>
                        <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                          {plan.storageGb || 1} GB Cloud
                        </span>
                      </div>
                    </div>

                    {/* AI Quota */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40">
                      <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block leading-none tracking-wider">AI Daily</span>
                        <span className="font-extrabold text-foreground text-xs truncate block mt-0.5">
                          {plan.aiEnabled ? `${((plan.dailyTokenLimit || 0) / 1000).toFixed(0)}k tokens` : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Included Entitlements */}
                  <PlanEntitlementsList features={planFeatures} />
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 mt-3.5 border-t border-border/40 shrink-0 flex items-center gap-2 z-10">
                  <Button
                    variant={isPopular ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 rounded-xl text-xs font-bold h-9.5 transition-all shadow-2xs cursor-pointer ${
                      isPopular
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 border-none"
                        : "bg-background hover:bg-muted text-foreground border-border/80 hover:border-border"
                    }`}
                    onClick={() => handleOpenConfigure(plan)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit Plan
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9.5 w-9.5 shrink-0 transition-colors cursor-pointer"
                    title={`Delete Plan ${plan.name}`}
                    onClick={() => setDeletingPlan(plan)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Super Admin 5-Section Configuration / Create Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {isCreatingNew ? <Plus className="h-5 w-5" /> : <Sliders className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-foreground">
                      {isCreatingNew ? "Create New Subscription Plan" : `Edit Tier: ${editingPlan.name}`}
                    </h3>
                    {!isCreatingNew && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase border">
                        {editingPlan.id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isCreatingNew
                      ? "Define pricing, resource limits, AI model entitlements, and features"
                      : "Update production tier pricing, limits, AI entitlements & features"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseConfigure}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 5-Tab Navigation Header */}
            <div className="flex items-center border-b border-border bg-muted/40 px-5 overflow-x-auto gap-1">
              {[
                { id: "basic", label: "1. Basic", icon: Building2 },
                { id: "pricing", label: "2. Pricing", icon: CreditCard },
                { id: "limits", label: "3. Limits", icon: HardDrive },
                { id: "ai", label: "4. AI Config", icon: Bot },
                { id: "features", label: "5. Features", icon: CheckCircle2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as ConfigTab)}
                    className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "border-emerald-600 text-emerald-600 bg-background/80 rounded-t-lg"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/30"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body: Tab Content */}
            <form onSubmit={handleSavePlan} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* SECTION 1: BASIC */}
                {activeTab === "basic" && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Plan Name *</Label>
                        <Input
                          value={editingPlan.name}
                          onChange={(e) =>
                            setEditingPlan({ ...editingPlan, name: e.target.value })
                          }
                          className="rounded-xl h-10 font-semibold"
                          placeholder="Enter plan name"
                          required
                        />
                      </div>

                      {isCreatingNew ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Plan Slug / ID (Optional)</Label>
                          <Input
                            value={editingPlan.id}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                id: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
                              })
                            }
                            className="rounded-xl h-10 font-mono text-xs"
                            placeholder="Enter plan slug"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Plan Identifier</Label>
                          <Input
                            value={editingPlan.id}
                            disabled
                            className="rounded-xl h-10 font-mono text-xs bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Short Description</Label>
                      <Input
                        value={editingPlan.description}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            description: e.target.value,
                          })
                        }
                        className="rounded-xl h-10"
                        placeholder="Enter plan description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Plan Status</Label>
                        <select
                          value={editingPlan.status}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              status: e.target.value as any,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                        >
                          <option value="ACTIVE">ACTIVE (Available for subscriptions)</option>
                          <option value="INACTIVE">INACTIVE (Disabled / Hidden)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Display Sort Order</Label>
                        <Input
                          type="number"
                          value={editingPlan.sortOrder}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              sortOrder: Number(e.target.value),
                            })
                          }
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between mt-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground">
                            Most Popular Tier Badge
                          </p>
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Highlight this tier as the recommended / most popular choice across tenant pricing views.
                        </p>
                      </div>
                      <Switch
                        checked={editingPlan.highlight}
                        onCheckedChange={(checked) =>
                          setEditingPlan({ ...editingPlan, highlight: checked })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 2: PRICING */}
                {activeTab === "pricing" && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Currency</Label>
                        <select
                          value={editingPlan.currency}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              currency: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                        >
                          <option value="INR">INR (₹) - Indian Rupee</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Pricing Mode</Label>
                        <select
                          value={editingPlan.pricingMode}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              pricingMode: e.target.value as any,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                        >
                          <option value="FIXED">Fixed Subscription Price</option>
                          <option value="CUSTOM">Custom Enterprise (Contact Sales)</option>
                        </select>
                      </div>
                    </div>

                    {editingPlan.pricingMode === "FIXED" ? (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">
                            Monthly Price ({editingPlan.currency})
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={editingPlan.priceNum}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                priceNum: Number(e.target.value),
                              })
                            }
                            className="rounded-xl h-10 font-bold"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">
                            Annual Price ({editingPlan.currency}/year)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={editingPlan.annualPriceNum}
                            onChange={(e) =>
                              setEditingPlan({
                                ...editingPlan,
                                annualPriceNum: Number(e.target.value),
                              })
                            }
                            className="rounded-xl h-10 font-bold"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                        Enterprise custom pricing will display as <strong>"Contact Sales"</strong> on customer pricing pages. Subscriptions will be provisioned manually or via sales contracts.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Free Trial Period (Days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editingPlan.trialDays}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              trialDays: Number(e.target.value),
                            })
                          }
                          className="rounded-xl h-10"
                          placeholder="e.g. 14"
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        <Label className="text-xs font-semibold">Supported Billing Cycles</Label>
                        <div className="flex items-center gap-4 pt-1">
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingPlan.billingCycleMonthly}
                              onChange={(e) =>
                                setEditingPlan({
                                  ...editingPlan,
                                  billingCycleMonthly: e.target.checked,
                                })
                              }
                              className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                            />
                            Monthly
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingPlan.billingCycleAnnual}
                              onChange={(e) =>
                                setEditingPlan({
                                  ...editingPlan,
                                  billingCycleAnnual: e.target.checked,
                                })
                              }
                              className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                            />
                            Annual
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: LIMITS */}
                {activeTab === "limits" && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <p className="text-xs text-muted-foreground">
                      Configure operational resource quotas for organizations subscribed to this tier. Use <strong>-1</strong> for Unlimited.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Max Users</Label>
                          <span className="text-[10px] text-muted-foreground">
                            {editingPlan.maxUsers === -1 ? "Unlimited" : `${editingPlan.maxUsers} users`}
                          </span>
                        </div>
                        <Input
                          type="number"
                          value={editingPlan.maxUsers}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              maxUsers: Number(e.target.value),
                            })
                          }
                          className="rounded-xl h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Max Leads</Label>
                          <span className="text-[10px] text-muted-foreground">
                            {editingPlan.maxLeads === -1 ? "Unlimited" : `${editingPlan.maxLeads} leads`}
                          </span>
                        </div>
                        <Input
                          type="number"
                          value={editingPlan.maxLeads}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              maxLeads: Number(e.target.value),
                            })
                          }
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Max Contacts</Label>
                          <span className="text-[10px] text-muted-foreground">
                            {editingPlan.maxContacts === -1 ? "Unlimited" : `${editingPlan.maxContacts} contacts`}
                          </span>
                        </div>
                        <Input
                          type="number"
                          value={editingPlan.maxContacts}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              maxContacts: Number(e.target.value),
                            })
                          }
                          className="rounded-xl h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Storage Quota (GB)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editingPlan.storageGb}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              storageGb: Number(e.target.value),
                            })
                          }
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Max Monthly API Requests</Label>
                        <span className="text-[10px] text-muted-foreground">
                          {editingPlan.maxApiRequests === -1 ? "Unlimited" : `${(Number(editingPlan.maxApiRequests) || 0).toLocaleString()} req/mo`}
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={editingPlan.maxApiRequests}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            maxApiRequests: Number(e.target.value),
                          })
                        }
                        className="rounded-xl h-10"
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 4: AI ENTITLEMENTS */}
                {activeTab === "ai" && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          AI Features Enabled
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Enables AI Copilot, summary, RAG, and predictive lead scoring for this tier.
                        </p>
                      </div>
                      <Switch
                        checked={editingPlan.aiEnabled}
                        onCheckedChange={(checked) =>
                          setEditingPlan({ ...editingPlan, aiEnabled: checked })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">AI Tier Level</Label>
                        <select
                          value={editingPlan.aiLevel}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              aiLevel: e.target.value,
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                        >
                          <option value="Basic AI">Basic AI</option>
                          <option value="Standard AI">Standard AI</option>
                          <option value="Advanced AI">Advanced AI</option>
                          <option value="Premium AI">Premium AI</option>
                          <option value="Full AI">Full AI</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Daily Token Quota</Label>
                        <Input
                          type="number"
                          min="1000"
                          step="5000"
                          value={editingPlan.dailyTokenLimit}
                          onChange={(e) =>
                            setEditingPlan({
                              ...editingPlan,
                              dailyTokenLimit: Number(e.target.value),
                            })
                          }
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-semibold">Authoritative Default Model</Label>
                      <select
                        value={editingPlan.defaultModelId || ""}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            defaultModelId: e.target.value,
                          })
                        }
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-bold text-foreground"
                      >
                        <option value="" disabled>Select default AI model</option>
                        {aiModels.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.displayName} ({m.provider}) - {m.modelKey}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label className="text-xs font-semibold">Allowed AI Models Catalog</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 rounded-xl border border-border bg-muted/20">
                        {aiModels.map((model) => {
                          const isChecked = Array.isArray(editingPlan.allowedModelIds) && editingPlan.allowedModelIds.includes(model.id);
                          return (
                            <label
                              key={model.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-foreground font-semibold"
                                  : "border-border/60 text-muted-foreground hover:bg-background/60"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleAllowedModel(model.id)}
                                className="rounded border-input text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="truncate">
                                <p className="leading-tight truncate">{model.displayName}</p>
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  {model.provider}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 5: FEATURES */}
                {activeTab === "features" && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={featureSearch}
                        onChange={(e) => setFeatureSearch(e.target.value)}
                        placeholder="Search CRM feature catalog..."
                        className="pl-9 h-10 rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                      {Object.keys(groupedFeatures).map((cat) => (
                        <div key={cat} className="space-y-2">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            {cat}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {groupedFeatures[cat].map((feat) => {
                              const isIncluded = Array.isArray(editingPlan.features) && editingPlan.features.includes(feat.name);
                              return (
                                <div
                                  key={feat.key}
                                  onClick={() => toggleFeature(feat.name)}
                                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                                    isIncluded
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-foreground font-semibold shadow-xs"
                                      : "border-border/60 text-muted-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  <div>
                                    <p className="text-xs font-semibold leading-tight text-foreground">
                                      {feat.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                      {feat.description}
                                    </p>
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                                      isIncluded
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : "border-muted-foreground/40 bg-background"
                                    }`}
                                  >
                                    {isIncluded && <Check className="h-3 w-3" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
                <div>
                  {!isCreatingNew && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={saving || deleting}
                      onClick={() => {
                        setDeletingPlan(editingPlan);
                      }}
                      className="text-xs text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete Plan
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseConfigure}
                    className="rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isDirty || saving}
                    className={`font-bold rounded-xl text-xs shadow-md transition-all ${
                      !isDirty || saving
                        ? "opacity-50 cursor-not-allowed bg-emerald-600/50 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    }`}
                  >
                    {saving
                      ? "Saving..."
                      : isCreatingNew
                      ? "Create Plan Tier"
                      : "Save Configuration"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Standard Uniform CRM Delete Plan Confirmation Modal */}
      {deletingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Delete Subscription Plan
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{deletingPlan.name}</strong> (<span className="font-mono text-[11px]">{deletingPlan.id}</span>)?
            </p>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 text-xs text-muted-foreground leading-relaxed">
              {(distribution[(deletingPlan?.id || "").toLowerCase()] || 0) > 0 ? (
                <>
                  This plan currently has <strong className="text-foreground">{distribution[(deletingPlan?.id || "").toLowerCase()]} active organization(s)</strong>. Deleting this tier will permanently remove the plan and automatically reassign all subscribed organizations to the <strong className="text-foreground">Free tier</strong>.
                </>
              ) : (
                <>
                  This plan has <strong className="text-foreground">0 active workspaces</strong>. All AI entitlements and configuration for this tier will be permanently removed.
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingPlan(null)}
                disabled={deleting}
                className="rounded-xl text-xs font-semibold h-9 px-4"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => handleDeletePlan(deletingPlan)}
                className="rounded-xl text-xs font-bold h-9 px-4 gap-1.5 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Plan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Warning Dialog */}
      <UnsavedWarning
        open={showUnsavedWarning}
        onOpenChange={setShowUnsavedWarning}
        onConfirm={() => {
          setShowUnsavedWarning(false);
          setEditingPlan(null);
          setOriginalPlan(null);
          setIsCreatingNew(false);
        }}
        onCancel={() => setShowUnsavedWarning(false)}
      />
    </CRMPageContainer>
  );
}
