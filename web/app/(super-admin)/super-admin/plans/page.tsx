"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  CreditCard,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import {
  fetchPlatformPlans,
  createPlatformPlan,
  updatePlatformPlan,
  deletePlatformPlan,
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
import { ConfigTab } from "./utils/plan-features.util";
import { PlanCard } from "./components/PlanCard";
import { PlanDeleteDialog } from "./components/PlanDeleteDialog";
import { PlanEditorModal } from "./components/PlanEditorModal";

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
    } catch (err: unknown) {
      console.error("Failed to load subscription plans:", err);
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to load subscription plans.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchPlatformPlans()
      .then((res) => {
        if (!active) return;
        setPlans(Array.isArray(res?.plans) ? res.plans : []);
        setDistribution(res?.distribution || {});
        setFeatureCatalog(Array.isArray(res?.featureCatalog) ? res.featureCatalog : []);
        setAiModels(Array.isArray(res?.aiModels) ? res.aiModels : []);
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error("Failed to load subscription plans:", err);
        const msg =
          (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
          (err as { message?: string })?.message ||
          "Failed to load subscription plans.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to save plan configuration.";
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
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        `Failed to delete plan "${plan.name}".`;
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
    const updated = exists
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
    <CRMPageContainer>
      {/* 1. Header Layout */}
      <CRMPageHeader
        title="Plans & Subscriptions"
        description="Manage canonical subscription tiers, real-time pricing models, resource quotas, AI entitlements, and custom tiers."
        icon={CreditCard}
        primaryAction={{
          label: "Create Plan",
          icon: Plus,
          onClick: handleOpenCreate,
        }}
      />

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

      {/* 2. Subscription Plans Cards Grid */}
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
            const orgCount = planId ? (distribution[planId] || 0) : 0;
            return (
              <PlanCard
                key={plan.id || `plan-${idx}`}
                plan={plan}
                distributionCount={orgCount}
                onConfigure={handleOpenConfigure}
                onDelete={setDeletingPlan}
              />
            );
          })
        )}
      </div>

      {/* 3. Super Admin 5-Section Configuration / Create Modal */}
      <PlanEditorModal
        editingPlan={editingPlan}
        isCreatingNew={isCreatingNew}
        saving={saving}
        deleting={deleting}
        isDirty={isDirty}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        featureSearch={featureSearch}
        setFeatureSearch={setFeatureSearch}
        aiModels={aiModels}
        groupedFeatures={groupedFeatures}
        onClose={handleCloseConfigure}
        onSave={handleSavePlan}
        onDelete={setDeletingPlan}
        onPlanChange={setEditingPlan}
        toggleFeature={toggleFeature}
        toggleAllowedModel={toggleAllowedModel}
      />

      {/* 4. CRM Delete Plan Confirmation Modal */}
      <PlanDeleteDialog
        deletingPlan={deletingPlan}
        distributionCount={(distribution[(deletingPlan?.id || "").toLowerCase()] || 0)}
        deleting={deleting}
        onCancel={() => setDeletingPlan(null)}
        onConfirm={handleDeletePlan}
      />

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
