"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  Brain,
  Layers,
  Check,
  X,
  RefreshCw,
  Edit2,
  ChevronDown,
  ChevronUp,
  Power,
  Sliders,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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

export default function SuperAdminAiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [globalAiEnabled, setGlobalAiEnabled] = useState(true);
  const [plans, setPlans] = useState<PlanAiConfigItem[]>([]);
  const [activeChatModels, setActiveChatModels] = useState<PlatformAiModelItem[]>([]);
  const [allModels, setAllModels] = useState<PlatformAiModelItem[]>([]);

  // Modal: Change Default Model
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<PlanAiConfigItem | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [savingDefault, setSavingDefault] = useState(false);

  // Accordion: Expanded Plan for Detailed Configuration
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<{
    aiEnabled: boolean;
    aiLevel: string;
    dailyTokenLimit: number;
    allowedModelIds: string[];
  } | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchPlanAiOverview();
      setGlobalAiEnabled(res.globalAiEnabled);
      setPlans(res.plans);
      setActiveChatModels(res.activeChatModels);
      setAllModels(res.allModels);
    } catch (err: any) {
      toast.error("Failed to load AI platform configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Open Modal to Change Default Model
  const handleOpenChangeModal = (plan: PlanAiConfigItem) => {
    setSelectedPlanForChange(plan);
    setSelectedModelId(plan.defaultModel?.id || activeChatModels[0]?.id || "");
    setIsChangeModalOpen(true);
  };

  // Save Default Model
  const handleSaveDefaultModel = async () => {
    if (!selectedPlanForChange || !selectedModelId) return;

    try {
      setSavingDefault(true);
      const res = await setPlanDefaultAiModel(selectedPlanForChange.id, selectedModelId);
      if (res.success) {
        toast.success(res.message);
        setIsChangeModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to update default model.");
    } finally {
      setSavingDefault(false);
    }
  };

  // Toggle Plan Configuration Accordion
  const handleToggleExpandPlan = (plan: PlanAiConfigItem) => {
    if (expandedPlanId === plan.id) {
      setExpandedPlanId(null);
      setEditingConfig(null);
    } else {
      setExpandedPlanId(plan.id);
      setEditingConfig({
        aiEnabled: plan.aiEnabled,
        aiLevel: plan.aiLevel,
        dailyTokenLimit: plan.dailyTokenLimit,
        allowedModelIds: plan.allowedModels.map((m) => m.id),
      });
    }
  };

  const isPlanConfigDirty = (plan: PlanAiConfigItem) => {
    if (!editingConfig || expandedPlanId !== plan.id) return false;
    const origAllowed = [...plan.allowedModels.map((m) => m.id)].sort().join(",");
    const currAllowed = [...editingConfig.allowedModelIds].sort().join(",");
    return (
      editingConfig.aiEnabled !== plan.aiEnabled ||
      editingConfig.aiLevel !== plan.aiLevel ||
      Number(editingConfig.dailyTokenLimit) !== Number(plan.dailyTokenLimit) ||
      origAllowed !== currAllowed
    );
  };

  // Save Plan Configuration
  const handleSavePlanConfiguration = async (planId: string) => {
    if (!editingConfig) return;

    try {
      setSavingConfig(true);
      const res = await updatePlanAiConfiguration(planId, editingConfig);
      if (res.success) {
        toast.success(res.message);
        setExpandedPlanId(null);
        await loadData();
      }
    } catch (err: any) {
      toast.error("Failed to save plan configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  // Toggle Individual Model Availability
  const handleToggleModelStatus = async (model: PlatformAiModelItem) => {
    try {
      const res = await togglePlatformAiModelAvailability(model.id, !model.isAvailable);
      if (res.success) {
        toast.success(`Model "${model.displayName}" updated.`);
        await loadData();
      }
    } catch {
      toast.error("Failed to toggle model availability.");
    }
  };

  // Group models by provider for Section 2
  const groupedModels = React.useMemo(() => {
    const map: Record<string, PlatformAiModelItem[]> = {};
    allModels.forEach((m) => {
      const p = (m.provider || "other").toUpperCase();
      if (!map[p]) map[p] = [];
      map[p].push(m);
    });
    return map;
  }, [allModels]);

  return (
    <CRMPageContainer>
      {/* 1. Header with Global AI Kill Switch */}
      <CRMPageHeader
        title="AI & Subscription Entitlements"
        subtitle="Manage AI access levels, default models, and allowed models for each subscription plan."
        icon={Sparkles}
        badge="Enterprise AI Governance"
        actions={[
          {
            label: "Open ClixPro AI",
            icon: Sparkles,
            onClick: () => router.push("/super-admin/copilot"),
            variant: "default",
          },
          {
            label: "Refresh",
            icon: RefreshCw,
            onClick: loadData,
            variant: "outline",
          },
        ]}
      />

      {/* Global AI Status Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          globalAiEnabled
            ? "bg-card border-border/80 shadow-xs"
            : "bg-destructive/10 border-destructive/30 text-destructive shadow-xs"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              globalAiEnabled
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-destructive/20 text-destructive border border-destructive/30"
            }`}
          >
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Platform AI Services
              </h3>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  globalAiEnabled
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                {globalAiEnabled ? "Online / Enabled" : "Globally Disabled"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {globalAiEnabled
                ? "All subscribed organizations can access their entitled AI models."
                : "All AI requests across the entire platform are paused server-side."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs font-semibold text-foreground">
            {globalAiEnabled ? "AI Services ON" : "AI Services OFF"}
          </span>
          <Switch
            checked={globalAiEnabled}
            onCheckedChange={handleToggleGlobalKillswitch}
            className="data-[state=checked]:bg-emerald-600"
          />
        </div>
      </div>

      {/* ClixPro AI Quick Launch Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-600/15 via-primary/10 to-indigo-600/15 border border-primary/25 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              ClixPro AI Platform Intelligence
            </h4>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Gemini Deep Reasoning
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Run automated cross-tenant audits, SecOps threat triage, MRR forecasts, and system telemetry diagnosis.
          </p>
        </div>
        <Link href="/super-admin/copilot">
          <Button size="sm" className="bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 rounded-xl shadow-xs whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch ClixPro AI</span>
          </Button>
        </Link>
      </div>

      {/* SECTION 1: AI & PLANS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              AI & Plans Access
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure which AI access level and default model powers each CRM subscription plan.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border">
            Loading AI plan entitlements...
          </div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border">
            No subscription plans found.
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden transition-all duration-200"
                >
                  {/* Compact Plan Summary Row */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground">
                          {plan.name}
                        </h4>
                        <span className="text-xs font-semibold text-muted-foreground">
                          ({plan.price})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {plan.aiLevel}
                        </span>
                        {!plan.aiEnabled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-destructive/10 text-destructive">
                            AI Disabled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>Current Default Model:</span>
                        <span className="font-bold text-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                          {plan.defaultModel?.displayName || "No Model Assigned"}
                        </span>
                        <span className="text-border">•</span>
                        <span>
                          Allowed:{" "}
                          <strong className="text-foreground">
                            {plan.allowedModels.length} models
                          </strong>
                        </span>
                        <span className="text-border">•</span>
                        <span>
                          Daily Limit:{" "}
                          <strong className="text-foreground">
                            {plan.dailyTokenLimit.toLocaleString()} tokens
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenChangeModal(plan)}
                        className="text-xs font-bold h-9 rounded-xl border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Change Model
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleExpandPlan(plan)}
                        className="text-xs font-semibold h-9 px-3 rounded-xl text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <>
                            <span>Close</span>
                            <ChevronUp className="w-3.5 h-3.5 ml-1" />
                          </>
                        ) : (
                          <>
                            <span>Configure</span>
                            <ChevronDown className="w-3.5 h-3.5 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Advanced Plan Details */}
                  {isExpanded && editingConfig && (
                    <div className="border-t border-border bg-muted/20 p-5 space-y-5 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* AI Enabled Toggle */}
                        <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                          <Label className="text-xs font-semibold">AI Services</Label>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {editingConfig.aiEnabled ? "Enabled for Plan" : "Disabled for Plan"}
                            </span>
                            <Switch
                              checked={editingConfig.aiEnabled}
                              onCheckedChange={(c) =>
                                setEditingConfig({ ...editingConfig, aiEnabled: c })
                              }
                            />
                          </div>
                        </div>

                        {/* AI Access Level Label */}
                        <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                          <Label className="text-xs font-semibold">AI Access Level</Label>
                          <Input
                            value={editingConfig.aiLevel}
                            onChange={(e) =>
                              setEditingConfig({ ...editingConfig, aiLevel: e.target.value })
                            }
                            className="h-8 text-xs font-medium rounded-lg"
                            placeholder="Enter AI access level"
                          />
                        </div>

                        {/* Daily Token Limit */}
                        <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                          <Label className="text-xs font-semibold">Daily Token Quota / Org</Label>
                          <Input
                            type="number"
                            value={editingConfig.dailyTokenLimit}
                            onChange={(e) =>
                              setEditingConfig({
                                ...editingConfig,
                                dailyTokenLimit: Number(e.target.value),
                              })
                            }
                            className="h-8 text-xs font-mono rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Allowed Models Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">
                          Allowed Models for {plan.name} Tier
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Select which enabled models users belonging to this plan tier can utilize.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                          {activeChatModels.map((model) => {
                            const isAllowed = editingConfig.allowedModelIds.includes(model.id);

                            return (
                              <label
                                key={model.id}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                  isAllowed
                                    ? "bg-primary/5 border-primary text-foreground"
                                    : "bg-card border-border text-muted-foreground hover:border-border/80"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...editingConfig.allowedModelIds, model.id]
                                      : editingConfig.allowedModelIds.filter((id) => id !== model.id);
                                    setEditingConfig({
                                      ...editingConfig,
                                      allowedModelIds: next,
                                    });
                                  }}
                                  className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                />
                                <div className="space-y-0.5 overflow-hidden">
                                  <span className="text-xs font-bold block text-foreground truncate">
                                    {model.displayName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block font-mono">
                                    {model.provider.toUpperCase()} • {model.modelKey}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Save Plan Config Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedPlanId(null)}
                          className="text-xs h-8 rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={!isPlanConfigDirty(plan) || savingConfig}
                          onClick={() => handleSavePlanConfiguration(plan.id)}
                          className="bg-primary text-primary-foreground text-xs font-bold h-8 px-4 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {savingConfig ? "Saving..." : "Save Configuration"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: AI MODELS CATALOG */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            AI Models Catalog
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized platform LLM catalog. Enable or disable models platform-wide.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedModels).map(([providerName, providerModels]) => (
            <div
              key={providerName}
              className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden"
            >
              <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {providerName}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {providerModels.length} models
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {providerModels.map((model) => (
                  <div
                    key={model.id}
                    className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          {model.displayName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {model.modelKey}
                        </span>
                        {model.isChatModel && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            Chat Ready
                          </span>
                        )}
                        {model.isDefault && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Core Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {model.description || "Foundation CRM LLM."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          model.isAvailable && model.status === "ENABLED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {model.isAvailable && model.status === "ENABLED"
                          ? "Enabled"
                          : "Disabled"}
                      </span>

                      <Button
                        size="sm"
                        variant={
                          model.isAvailable && model.status === "ENABLED"
                            ? "outline"
                            : "secondary"
                        }
                        onClick={() => handleToggleModelStatus(model)}
                        className="text-xs font-semibold h-7 px-2.5 rounded-lg"
                      >
                        {model.isAvailable && model.status === "ENABLED"
                          ? "Disable"
                          : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POPUP MODAL: CHANGE DEFAULT MODEL */}
      {isChangeModalOpen && selectedPlanForChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Select Default Model
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose the active default model for {selectedPlanForChange.name} tier.
                </p>
              </div>
              <button
                onClick={() => setIsChangeModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeChatModels.map((model) => {
                const isSelected = selectedModelId === model.id;

                return (
                  <label
                    key={model.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input
                        type="radio"
                        name="default_model_choice"
                        checked={isSelected}
                        onChange={() => setSelectedModelId(model.id)}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="space-y-0.5 overflow-hidden">
                        <span className="text-xs font-bold block text-foreground truncate">
                          {model.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          {model.provider.toUpperCase()} • {model.modelKey}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsChangeModalOpen(false)}
                className="text-xs h-9 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={savingDefault || !selectedModelId || selectedModelId === selectedPlanForChange?.defaultModel?.id}
                onClick={handleSaveDefaultModel}
                className="bg-primary text-primary-foreground text-xs font-bold h-9 px-5 rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingDefault ? "Saving..." : "Save Default Model"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </CRMPageContainer>
  );
}

