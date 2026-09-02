"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Bot,
  Layers,
  Edit3,
  Power,
  Check,
  Loader2,
  Cpu,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
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

interface ProviderGroup {
  providerKey: string;
  providerName: string;
  models: PlatformAiModelItem[];
  totalCount: number;
  enabledCount: number;
  isEnabled: boolean;
}

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
    loadData();
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

      // 1. Update Plan configuration (AI enabled, tier level, limits, allowed models)
      const resConfig = await updatePlanAiConfiguration(selectedPlanForEdit.id, {
        aiEnabled: planForm.aiEnabled,
        aiLevel: planForm.aiLevel,
        dailyTokenLimit: Number(planForm.dailyTokenLimit),
        allowedModelIds: planForm.allowedModelIds,
      });

      // 2. If default model changed and is valid, update default model
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
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to update plan configuration."
      );
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
            className="data-[state=checked]:bg-emerald-600 ml-1"
          />
        </div>
      </CRMPageHeader>

      {/* SECTION 1 — AI ACCESS BY PLAN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              AI Access by Plan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure AI availability, model tiers, and token limits per subscription plan.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span>Loading plan entitlements...</span>
          </div>
        ) : canonicalPlans.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border">
            No subscription plans found.
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-10 hover:bg-transparent">
                    <TableHead className="w-[22%]">Plan</TableHead>
                    <TableHead className="w-[18%]">AI Access</TableHead>
                    <TableHead className="w-[24%]">Default Model</TableHead>
                    <TableHead className="w-[14%]">Models Allowed</TableHead>
                    <TableHead className="w-[14%]">Usage Limit</TableHead>
                    <TableHead className="w-[8%] text-right pr-5">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canonicalPlans.map((plan) => {
                    const isAiActive = plan.aiEnabled && globalAiEnabled;

                    return (
                      <TableRow key={plan.id} className="h-14 hover:bg-muted/30">
                        {/* Plan Name & Price */}
                        <TableCell className="h-14">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-xs">
                              {plan.name}
                            </span>
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              ({plan.price})
                            </span>
                          </div>
                        </TableCell>

                        {/* AI Access Tier */}
                        <TableCell className="h-14">
                          <span
                            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                              plan.aiEnabled
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {plan.aiEnabled ? plan.aiLevel || "Basic AI" : "Disabled"}
                          </span>
                        </TableCell>

                        {/* Default Model */}
                        <TableCell className="h-14">
                          {isAiActive && plan.defaultModel ? (
                            <span className="font-mono text-xs font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                              {plan.defaultModel.displayName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              {plan.aiEnabled ? "None Selected" : "AI Inactive"}
                            </span>
                          )}
                        </TableCell>

                        {/* Models Allowed */}
                        <TableCell className="h-14">
                          <span className="text-xs font-medium text-foreground">
                            {plan.aiEnabled
                              ? `${plan.allowedModels.length} ${
                                  plan.allowedModels.length === 1 ? "model" : "models"
                                }`
                              : "0 models"}
                          </span>
                        </TableCell>

                        {/* Usage Limit */}
                        <TableCell className="h-14">
                          <span className="text-xs font-medium text-muted-foreground">
                            {plan.dailyTokenLimit
                              ? `${plan.dailyTokenLimit.toLocaleString()} tokens/day`
                              : "Standard"}
                          </span>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="h-14 text-right pr-5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditPlan(plan)}
                            className="h-7 text-xs font-bold px-3 rounded-lg border-primary/30 text-primary hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2 — AI MODEL CATALOG */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                AI Model Catalog
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {totalEnabledModelsCount} enabled
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Provider-level AI catalog and platform-wide model availability.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span>Loading model catalog...</span>
          </div>
        ) : providerGroups.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border">
            No AI providers configured in catalog.
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-10 hover:bg-transparent">
                    <TableHead className="w-[35%]">Provider</TableHead>
                    <TableHead className="w-[30%]">Models</TableHead>
                    <TableHead className="w-[20%]">Status</TableHead>
                    <TableHead className="w-[15%] text-right pr-5">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerGroups.map((group) => (
                    <TableRow key={group.providerKey} className="h-14 hover:bg-muted/30">
                      {/* Provider Name */}
                      <TableCell className="h-14">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            <Cpu className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-foreground text-xs">
                            {group.providerName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Models Summary */}
                      <TableCell className="h-14">
                        <span className="text-xs font-medium text-foreground">
                          {group.totalCount} {group.totalCount === 1 ? "model" : "models"}{" "}
                          <span className="text-muted-foreground">
                            ({group.enabledCount} enabled)
                          </span>
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="h-14">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            group.isEnabled
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {group.isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="h-14 text-right pr-5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenManageProvider(group.providerKey)}
                          className="h-7 text-xs font-bold px-3 rounded-lg border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: EDIT PLAN ENTITLEMENTS */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border/80 shrink-0">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              Edit {selectedPlanForEdit?.name} Plan Entitlements
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure AI availability, access tier, token quotas, and permitted models.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[calc(88vh-130px)]">
            {/* AI Access Toggle */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">AI Services</Label>
                <p className="text-[11px] text-muted-foreground">
                  {planForm.aiEnabled
                    ? "Subscribed organizations can utilize entitled AI features."
                    : "AI access is turned off for this plan tier."}
                </p>
              </div>
              <Switch
                checked={planForm.aiEnabled}
                onCheckedChange={(checked) =>
                  setPlanForm((prev) => ({ ...prev, aiEnabled: checked }))
                }
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            {/* AI Access Level Label */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">AI Access Level</Label>
              <Input
                value={planForm.aiLevel}
                onChange={(e) =>
                  setPlanForm((prev) => ({ ...prev, aiLevel: e.target.value }))
                }
                placeholder="e.g. Basic AI, Advanced AI, Premium AI"
                className="h-9 text-xs rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Display badge shown to users on this subscription tier.
              </p>
            </div>

            {/* Daily Token Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Daily Token Limit / Workspace
              </Label>
              <Input
                type="number"
                value={planForm.dailyTokenLimit}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    dailyTokenLimit: Number(e.target.value),
                  }))
                }
                className="h-9 text-xs font-mono rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Maximum token capacity consumed per 24-hour cycle.
              </p>
            </div>

            {/* Allowed Models Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Allowed Models</Label>
                <span className="text-[11px] text-muted-foreground">
                  {planForm.allowedModelIds.length} selected
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Select which models this plan tier is permitted to execute.
              </p>

              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                {allModels.map((model) => {
                  const isAllowed = planForm.allowedModelIds.includes(model.id);

                  return (
                    <label
                      key={model.id}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isAllowed
                          ? "bg-primary/5 border-primary/40 text-foreground"
                          : "bg-card border-border/70 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllowed}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...planForm.allowedModelIds, model.id]
                            : planForm.allowedModelIds.filter((id) => id !== model.id);

                          let nextDefault = planForm.defaultModelId;
                          if (!e.target.checked && planForm.defaultModelId === model.id) {
                            nextDefault = next.length > 0 ? next[0] : "";
                          }

                          setPlanForm((prev) => ({
                            ...prev,
                            allowedModelIds: next,
                            defaultModelId: nextDefault,
                          }));
                        }}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="space-y-0.5 overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground truncate">
                            {model.displayName}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground shrink-0">
                            {model.provider}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground block truncate">
                          {model.modelKey}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Default Model Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Default Model</Label>
              <p className="text-[11px] text-muted-foreground">
                Primary model assigned out-of-the-box for this plan. Must be one of the
                allowed models.
              </p>

              {planForm.allowedModelIds.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground rounded-xl bg-muted/40 border border-border">
                  Select at least one allowed model first.
                </div>
              ) : (
                <div className="space-y-2 pt-1 max-h-40 overflow-y-auto pr-1">
                  {allModels
                    .filter((m) => planForm.allowedModelIds.includes(m.id))
                    .map((model) => {
                      const isDefault = planForm.defaultModelId === model.id;

                      return (
                        <label
                          key={model.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isDefault
                              ? "bg-primary/10 border-primary text-foreground font-semibold"
                              : "bg-card border-border/70 text-muted-foreground hover:border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <input
                              type="radio"
                              name="plan_default_model"
                              checked={isDefault}
                              onChange={() =>
                                setPlanForm((prev) => ({
                                  ...prev,
                                  defaultModelId: model.id,
                                }))
                              }
                              className="text-primary focus:ring-primary h-4 w-4"
                            />
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-foreground block truncate">
                                {model.displayName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground block">
                                {model.provider.toUpperCase()} • {model.modelKey}
                              </span>
                            </div>
                          </div>
                          {isDefault && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                          )}
                        </label>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPlanModalOpen(false)}
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingPlan}
              onClick={handleSavePlan}
              className="bg-primary text-primary-foreground text-xs font-bold h-9 px-5 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {savingPlan ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Entitlements"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: MANAGE PROVIDER MODELS */}
      <Dialog open={isProviderModalOpen} onOpenChange={setIsProviderModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border/80 shrink-0">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Manage {selectedProvider?.providerName} Models
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enable or disable models across the entire CRM platform.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 max-h-[calc(85vh-130px)]">
            {!selectedProvider || selectedProvider.models.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No models registered for this provider.
              </div>
            ) : (
              selectedProvider.models.map((model) => {
                const isEnabled = model.isAvailable && model.status === "ENABLED";
                const isToggling = togglingModelId === model.id;

                return (
                  <div
                    key={model.id}
                    className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex items-center justify-between gap-3 hover:border-border transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {model.displayName}
                        </span>
                        {model.isDefault && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground block truncate">
                        {model.modelKey}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isEnabled
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isEnabled ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        checked={isEnabled}
                        disabled={isToggling}
                        onCheckedChange={() => handleToggleModelStatus(model)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProviderModalOpen(false)}
              className="text-xs h-9 rounded-xl"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CRMPageContainer>
  );
}
