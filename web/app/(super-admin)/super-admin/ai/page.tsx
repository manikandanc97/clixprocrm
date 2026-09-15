"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Power,
} from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { toast } from "sonner";
import {
  fetchPlanAiOverview,
  setPlanDefaultAiModel,
  updatePlanAiConfiguration,
  togglePlatformAiModelAvailability,
  toggleGlobalAiKillswitch,
  PlanAiConfigItem,
  PlatformAiModelItem,
} from "@/shared/lib/api/super-admin.api";
import { CRMPageContainer, CRMPageHeader } from "@/shared/components/crm";
import { PlanAiTable } from "./components/PlanAiTable";
import { AiProviderTable, ProviderGroup } from "./components/AiProviderTable";
import { EditPlanAiModal } from "./components/EditPlanAiModal";
import { ProviderModelsModal } from "./components/ProviderModelsModal";

export default function SuperAdminAiPage() {
  const [loading, setLoading] = useState(true);
  const [globalAiEnabled, setGlobalAiEnabled] = useState(true);
  const [plans, setPlans] = useState<PlanAiConfigItem[]>([]);
  const [activeChatModels, setActiveChatModels] = useState<PlatformAiModelItem[]>([]);
  const [allModels, setAllModels] = useState<PlatformAiModelItem[]>([]);

  // Modal 1: Edit Plan AI Entitlements
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<PlanAiConfigItem | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<{
    aiEnabled: boolean;
    aiLevel: string;
    dailyTokenLimit: number;
    allowedModelIds: string[];
    defaultModelId: string;
  }>({
    aiEnabled: true,
    aiLevel: "Basic AI",
    dailyTokenLimit: 10000,
    allowedModelIds: [],
    defaultModelId: "",
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // Modal 2: Manage Provider Models
  const [selectedProviderKey, setSelectedProviderKey] = useState<string | null>(null);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [togglingModelId, setTogglingModelId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchPlanAiOverview();
      setGlobalAiEnabled(res.globalAiEnabled);
      setPlans(res.plans);
      setActiveChatModels(res.activeChatModels);
      setAllModels(res.allModels);
    } catch {
      toast.error("Failed to load AI platform configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchPlanAiOverview()
      .then((res) => {
        if (!active) return;
        setGlobalAiEnabled(res.globalAiEnabled);
        setPlans(res.plans);
        setActiveChatModels(res.activeChatModels);
        setAllModels(res.allModels);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Failed to load AI platform configuration.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter and order actual CRM subscription plans (Free, Growth, Business)
  const canonicalPlans = useMemo(() => {
    const allowedPlanNames = ["Free", "Growth", "Business"];
    const filtered = plans.filter((p) =>
      allowedPlanNames.some((name) => name.toLowerCase() === p.name.toLowerCase())
    );
    if (filtered.length > 0) {
      return filtered.sort((a, b) => (a.priceNum || 0) - (b.priceNum || 0));
    }
    return plans;
  }, [plans]);

  // Group models by provider dynamically from real data
  const providerGroups: ProviderGroup[] = useMemo(() => {
    const map: Record<string, PlatformAiModelItem[]> = {};
    allModels.forEach((m) => {
      const p = (m.provider || "other").toLowerCase();
      if (!map[p]) map[p] = [];
      map[p].push(m);
    });

    return Object.entries(map).map(([key, models]) => {
      const displayName =
        key === "google"
          ? "Google"
          : key === "openai"
          ? "OpenAI"
          : key === "anthropic"
          ? "Anthropic"
          : key.charAt(0).toUpperCase() + key.slice(1);

      const enabledCount = models.filter(
        (m) => m.isAvailable && m.status === "ENABLED"
      ).length;

      return {
        providerKey: key,
        providerName: displayName,
        models,
        totalCount: models.length,
        enabledCount,
        isEnabled: enabledCount > 0,
      };
    });
  }, [allModels]);

  const totalEnabledModelsCount = useMemo(() => {
    return allModels.filter((m) => m.isAvailable && m.status === "ENABLED").length;
  }, [allModels]);

  // Global Killswitch Toggle
  const handleToggleGlobalKillswitch = async () => {
    const nextState = !globalAiEnabled;
    try {
      const res = await toggleGlobalAiKillswitch(nextState);
      setGlobalAiEnabled(res.globalAiEnabled);
      toast.success(
        nextState
          ? "Platform AI services enabled."
          : "Platform AI services globally disabled."
      );
    } catch {
      toast.error("Failed to toggle global AI state.");
    }
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = (plan: PlanAiConfigItem) => {
    setSelectedPlanForEdit(plan);
    const allowedIds = plan.allowedModels.map((m) => m.id);
    const defaultId =
      plan.defaultModel?.id ||
      (allowedIds.length > 0 ? allowedIds[0] : activeChatModels[0]?.id || "");

    setPlanForm({
      aiEnabled: plan.aiEnabled,
      aiLevel: plan.aiLevel || "Basic AI",
      dailyTokenLimit: plan.dailyTokenLimit || 10000,
      allowedModelIds: allowedIds,
      defaultModelId: defaultId,
    });
    setIsPlanModalOpen(true);
  };

  // Save Plan Configuration & Default Model
  const handleSavePlan = async () => {
    if (!selectedPlanForEdit) return;

    try {
      setSavingPlan(true);

      const resConfig = await updatePlanAiConfiguration(selectedPlanForEdit.id, {
        aiEnabled: planForm.aiEnabled,
        aiLevel: planForm.aiLevel,
        dailyTokenLimit: Number(planForm.dailyTokenLimit),
        allowedModelIds: planForm.allowedModelIds,
      });

      if (
        planForm.defaultModelId &&
        planForm.defaultModelId !== selectedPlanForEdit.defaultModel?.id
      ) {
        await setPlanDefaultAiModel(selectedPlanForEdit.id, planForm.defaultModelId);
      }

      if (resConfig.success) {
        toast.success(`Entitlements updated for ${selectedPlanForEdit.name} plan.`);
        setIsPlanModalOpen(false);
        await loadData();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to update plan configuration.";
      toast.error(msg);
    } finally {
      setSavingPlan(false);
    }
  };

  // Open Manage Provider Modal
  const handleOpenManageProvider = (providerKey: string) => {
    setSelectedProviderKey(providerKey);
    setIsProviderModalOpen(true);
  };

  const selectedProvider = useMemo(() => {
    if (!selectedProviderKey) return null;
    return providerGroups.find((p) => p.providerKey === selectedProviderKey) || null;
  }, [selectedProviderKey, providerGroups]);

  // Toggle Model Status inside Modal
  const handleToggleModelStatus = async (model: PlatformAiModelItem) => {
    try {
      setTogglingModelId(model.id);
      const nextState = !(model.isAvailable && model.status === "ENABLED");
      const res = await togglePlatformAiModelAvailability(model.id, nextState);
      if (res.success) {
        toast.success(`Model "${model.displayName}" ${nextState ? "enabled" : "disabled"}.`);
        await loadData();
      }
    } catch {
      toast.error("Failed to toggle model availability.");
    } finally {
      setTogglingModelId(null);
    }
  };

  return (
    <CRMPageContainer>
      {/* PAGE HEADER WITH COMPACT AI SERVICES TOGGLE */}
      <CRMPageHeader
        title="AI & Subscription Entitlements"
        subtitle="Manage AI availability, plan entitlements, and available models."
        icon={Sparkles}
      >
        <div className="flex items-center gap-2.5 bg-card border border-border/80 px-3.5 py-1.5 rounded-xl shadow-xs">
          <div
            className={`p-1 rounded-md transition-colors ${
              globalAiEnabled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground">AI Services</span>
            <span
              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md tracking-wide ${
                globalAiEnabled
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {globalAiEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <Switch
            checked={globalAiEnabled}
            onCheckedChange={handleToggleGlobalKillswitch}
            className="data-[state=checked]:bg-emerald-600 ml-1 cursor-pointer"
          />
        </div>
      </CRMPageHeader>

      {/* SECTION 1 — AI ACCESS BY PLAN */}
      <PlanAiTable
        loading={loading}
        canonicalPlans={canonicalPlans}
        globalAiEnabled={globalAiEnabled}
        handleOpenEditPlan={handleOpenEditPlan}
      />

      {/* SECTION 2 — AI MODEL CATALOG */}
      <AiProviderTable
        loading={loading}
        providerGroups={providerGroups}
        totalEnabledModelsCount={totalEnabledModelsCount}
        handleOpenManageProvider={handleOpenManageProvider}
      />

      {/* MODAL 1: EDIT PLAN ENTITLEMENTS */}
      <EditPlanAiModal
        isPlanModalOpen={isPlanModalOpen}
        setIsPlanModalOpen={setIsPlanModalOpen}
        selectedPlanForEdit={selectedPlanForEdit}
        planForm={planForm}
        setPlanForm={setPlanForm}
        allModels={allModels}
        savingPlan={savingPlan}
        handleSavePlan={handleSavePlan}
      />

      {/* MODAL 2: MANAGE PROVIDER MODELS */}
      <ProviderModelsModal
        isProviderModalOpen={isProviderModalOpen}
        setIsProviderModalOpen={setIsProviderModalOpen}
        selectedProvider={selectedProvider}
        togglingModelId={togglingModelId}
        handleToggleModelStatus={handleToggleModelStatus}
      />
    </CRMPageContainer>
  );
}
