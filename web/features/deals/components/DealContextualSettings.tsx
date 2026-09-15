"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import { toast } from "sonner";
import { Handshake, Kanban, Clock, BarChart3, SlidersHorizontal, ShieldAlert } from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCRMStore } from "@/shared/store/useCRMStore";

import {
  Stage,
  CustomDealField,
  StandardFieldConfig,
  DEFAULT_STAGES,
  DEFAULT_STANDARD_FIELDS,
  DEFAULT_CUSTOM_FIELDS,
  COLOR_PRESETS,
} from "../constants/deal-settings.constants";
import { DealPipelineSection } from "./deal-sections/DealPipelineSection";
import { DealAgingSection } from "./deal-sections/DealAgingSection";
import { DealForecastSection } from "./deal-sections/DealForecastSection";
import { DealFieldsSection } from "./deal-sections/DealFieldsSection";
import { DealGovernanceSection } from "./deal-sections/DealGovernanceSection";

export type { Stage, CustomDealField, StandardFieldConfig };
export { DEFAULT_STAGES, DEFAULT_STANDARD_FIELDS, DEFAULT_CUSTOM_FIELDS, COLOR_PRESETS };

export interface DealContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

export function DealContextualSettings({
  open,
  onOpenChange,
  defaultSection = "pipelines",
}: DealContextualSettingsProps) {
  const { user } = useAuth();
  const currency = useCRMStore((state) => state.currency);
  const tenantId = user?.tenantId || (user as { activeTenantId?: string })?.activeTenantId || "default";
  const storageKey = `clixprocrm_deal_settings_${tenantId}`;

  // 1. Pipelines & Stages
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [newStageName, setNewStageName] = useState("");
  const [newStageProb, setNewStageProb] = useState("50");
  const [newStageSla, setNewStageSla] = useState("5");
  const [newStageColor, setNewStageColor] = useState("bg-blue-500");

  // 2. Deal Aging & Alerts
  const [dealRotDays, setDealRotDays] = useState("14");
  const [stageAgingAlertEnabled, setStageAgingAlertEnabled] = useState(true);
  const [closeDateRiskAlertEnabled, setCloseDateRiskAlertEnabled] = useState(true);
  const [closeDateRiskDays, setCloseDateRiskDays] = useState("5");
  const [staleDealNotificationEnabled, setStaleDealNotificationEnabled] = useState(true);
  const [overdueDealEscalationEnabled, setOverdueDealEscalationEnabled] = useState(true);

  // 3. Forecast Configuration
  const [weightedForecast, setWeightedForecast] = useState(true);
  const [includeOmittedInFunnel, setIncludeOmittedInFunnel] = useState(false);
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState("4");

  // 4. Deal Fields & Layout
  const [standardFields, setStandardFields] = useState<StandardFieldConfig[]>(DEFAULT_STANDARD_FIELDS);
  const [customFields, setCustomFields] = useState<CustomDealField[]>(DEFAULT_CUSTOM_FIELDS);
  const [requireExpectedCloseDate, setRequireExpectedCloseDate] = useState(true);
  const [requireDealSource, setRequireDealSource] = useState(true);
  const [enableCompetitorTracking, setEnableCompetitorTracking] = useState(true);
  const [enableLostReasonAnalysis, setEnableLostReasonAnalysis] = useState(true);
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomDealField["type"]>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // 5. Sales Governance & Approvals
  const [requireQuotationApproval, setRequireQuotationApproval] = useState(true);
  const [discountThreshold, setDiscountThreshold] = useState("15");
  const [requireDealValueApproval, setRequireDealValueApproval] = useState(true);
  const [dealValueThreshold, setDealValueThreshold] = useState("500000");
  const [lockClosedDeals, setLockClosedDeals] = useState(true);
  const [allowReopenClosed, setAllowReopenClosed] = useState(true);
  const [autoAssignDeals, setAutoAssignDeals] = useState(true);
  const [enableStagnantReassignment, setEnableStagnantReassignment] = useState(false);
  const [reassignOnStuckDays, setReassignOnStuckDays] = useState("21");

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on open
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);

  if (typeof window !== "undefined" && open && (!prevOpen || storageKey !== prevStorageKey)) {
    setPrevOpen(open);
    setPrevStorageKey(storageKey);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.stages && Array.isArray(parsed.stages)) setStages(parsed.stages);
        if (parsed.dealRotDays !== undefined) setDealRotDays(String(parsed.dealRotDays));
        if (parsed.stageAgingAlertEnabled !== undefined) setStageAgingAlertEnabled(parsed.stageAgingAlertEnabled);
        if (parsed.closeDateRiskAlertEnabled !== undefined) setCloseDateRiskAlertEnabled(parsed.closeDateRiskAlertEnabled);
        if (parsed.closeDateRiskDays !== undefined) setCloseDateRiskDays(String(parsed.closeDateRiskDays));
        if (parsed.staleDealNotificationEnabled !== undefined) setStaleDealNotificationEnabled(parsed.staleDealNotificationEnabled);
        if (parsed.overdueDealEscalationEnabled !== undefined) setOverdueDealEscalationEnabled(parsed.overdueDealEscalationEnabled);
        if (parsed.weightedForecast !== undefined) setWeightedForecast(parsed.weightedForecast);
        if (parsed.includeOmittedInFunnel !== undefined) setIncludeOmittedInFunnel(parsed.includeOmittedInFunnel);
        if (parsed.fiscalYearStartMonth !== undefined) setFiscalYearStartMonth(String(parsed.fiscalYearStartMonth));
        if (parsed.standardFields && Array.isArray(parsed.standardFields)) setStandardFields(parsed.standardFields);
        if (parsed.customFields && Array.isArray(parsed.customFields)) setCustomFields(parsed.customFields);
        if (parsed.requireExpectedCloseDate !== undefined) setRequireExpectedCloseDate(parsed.requireExpectedCloseDate);
        if (parsed.requireDealSource !== undefined) setRequireDealSource(parsed.requireDealSource);
        if (parsed.enableCompetitorTracking !== undefined) setEnableCompetitorTracking(parsed.enableCompetitorTracking);
        if (parsed.enableLostReasonAnalysis !== undefined) setEnableLostReasonAnalysis(parsed.enableLostReasonAnalysis);
        if (parsed.requireQuotationApproval !== undefined) setRequireQuotationApproval(parsed.requireQuotationApproval);
        if (parsed.discountThreshold !== undefined) setDiscountThreshold(String(parsed.discountThreshold));
        if (parsed.requireDealValueApproval !== undefined) setRequireDealValueApproval(parsed.requireDealValueApproval);
        if (parsed.dealValueThreshold !== undefined) setDealValueThreshold(String(parsed.dealValueThreshold));
        if (parsed.lockClosedDeals !== undefined) setLockClosedDeals(parsed.lockClosedDeals);
        if (parsed.allowReopenClosed !== undefined) setAllowReopenClosed(parsed.allowReopenClosed);
        if (parsed.autoAssignDeals !== undefined) setAutoAssignDeals(parsed.autoAssignDeals);
        if (parsed.enableStagnantReassignment !== undefined) setEnableStagnantReassignment(parsed.enableStagnantReassignment);
        if (parsed.reassignOnStuckDays !== undefined) setReassignOnStuckDays(String(parsed.reassignOnStuckDays));
      }
    } catch {
      // Keep defaults on parse failure
    } finally {
      isLoadedRef.current = true;
    }
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const triggerAutoSave = useCallback(() => {
    if (!isLoadedRef.current || typeof window === "undefined") return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setAutoSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          stages, dealRotDays, stageAgingAlertEnabled, closeDateRiskAlertEnabled, closeDateRiskDays,
          staleDealNotificationEnabled, overdueDealEscalationEnabled, weightedForecast, includeOmittedInFunnel,
          fiscalYearStartMonth, standardFields, customFields, requireExpectedCloseDate, requireDealSource,
          enableCompetitorTracking, enableLostReasonAnalysis, requireQuotationApproval, discountThreshold,
          requireDealValueApproval, dealValueThreshold, lockClosedDeals, allowReopenClosed, autoAssignDeals,
          enableStagnantReassignment, reassignOnStuckDays, updatedAt: new Date().toISOString(),
        }));
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 1800);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 300);
  }, [
    storageKey, stages, dealRotDays, stageAgingAlertEnabled, closeDateRiskAlertEnabled, closeDateRiskDays,
    staleDealNotificationEnabled, overdueDealEscalationEnabled, weightedForecast, includeOmittedInFunnel,
    fiscalYearStartMonth, standardFields, customFields, requireExpectedCloseDate, requireDealSource,
    enableCompetitorTracking, enableLostReasonAnalysis, requireQuotationApproval, discountThreshold,
    requireDealValueApproval, dealValueThreshold, lockClosedDeals, allowReopenClosed, autoAssignDeals,
    enableStagnantReassignment, reassignOnStuckDays,
  ]);

  // Stage Handlers
  const handleUpdateProbability = (id: string, prob: number) => {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, probability: Math.min(100, Math.max(0, prob)) } : s)));
    triggerAutoSave();
  };
  const handleUpdateSla = (id: string, days: number) => {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, slaDays: Math.max(0, days) } : s)));
    triggerAutoSave();
  };
  const handleMoveStage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    const updated = [...stages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setStages(updated);
    triggerAutoSave();
  };
  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const newStage: Stage = {
      id: `stage_${Date.now()}`, name: newStageName.trim(),
      probability: Math.min(100, Math.max(0, parseInt(newStageProb) || 50)),
      slaDays: Math.max(0, parseInt(newStageSla) || 5),
      color: newStageColor, type: "OPEN",
    };
    const terminalIndex = stages.findIndex((s) => s.type === "WON" || s.type === "LOST");
    const updated = terminalIndex !== -1
      ? [...stages.slice(0, terminalIndex), newStage, ...stages.slice(terminalIndex)]
      : [...stages, newStage];
    setStages(updated);
    setNewStageName(""); setNewStageProb("50"); setNewStageSla("5");
    toast.success(`Stage "${newStage.name}" added to pipeline`);
    triggerAutoSave();
  };
  const handleDeleteStage = (id: string) => {
    const stageToDelete = stages.find((s) => s.id === id);
    if (!stageToDelete) return;
    if (stageToDelete.isSystem || stageToDelete.type === "WON" || stageToDelete.type === "LOST") {
      toast.error("System terminal stages (Closed Won / Closed Lost) cannot be deleted"); return;
    }
    if (stages.filter((s) => s.type === "OPEN").length <= 1) {
      toast.error("Pipeline must have at least one active open progression stage"); return;
    }
    setStages(stages.filter((s) => s.id !== id));
    toast.success(`Stage "${stageToDelete.name}" removed`);
    triggerAutoSave();
  };

  // Field Handlers
  const handleToggleStandardFieldVisibility = (fieldId: string) => {
    setStandardFields((prev) => prev.map((f) => f.id === fieldId && !f.isSystemRequired ? { ...f, visible: !f.visible } : f));
    triggerAutoSave();
  };
  const handleToggleStandardFieldRequired = (fieldId: string) => {
    setStandardFields((prev) => prev.map((f) => {
      if (f.id !== fieldId || f.isSystemRequired) return f;
      const nextReq = !f.required;
      if (f.id === "expectedCloseDate") setRequireExpectedCloseDate(nextReq);
      if (f.id === "source") setRequireDealSource(nextReq);
      if (f.id === "lostReason") setEnableLostReasonAnalysis(nextReq);
      return { ...f, required: nextReq };
    }));
    triggerAutoSave();
  };
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    const key = newFieldName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    setCustomFields((prev) => [...prev, { id: `cf_${Date.now()}`, name: newFieldName.trim(), key, type: newFieldType, required: newFieldRequired }]);
    setNewFieldName(""); setNewFieldType("text"); setNewFieldRequired(false); setShowAddCustomField(false);
    toast.success(`Custom field "${newFieldName.trim()}" created`);
    triggerAutoSave();
  };
  const handleDeleteCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    toast.success("Custom field removed");
    triggerAutoSave();
  };

  // Sync helpers for DealFieldsSection (bi-directional field state sync)
  const syncRequireExpectedCloseDate = (v: boolean) =>
    setStandardFields((prev) => prev.map((f) => f.id === "expectedCloseDate" ? { ...f, required: v } : f));
  const syncRequireDealSource = (v: boolean) =>
    setStandardFields((prev) => prev.map((f) => f.id === "source" ? { ...f, required: v } : f));
  const syncEnableLostReasonAnalysis = (v: boolean) =>
    setStandardFields((prev) => prev.map((f) => f.id === "lostReason" ? { ...f, required: v } : f));

  const totalOpenSlaDays = stages.filter((s) => s.type === "OPEN").reduce((acc, s) => acc + (s.slaDays || 0), 0);

  const sections: ContextualSettingSection[] = [
    {
      id: "pipelines",
      label: "Pipelines & Stages",
      icon: Kanban,
      badge: `${stages.length} Stages`,
      component: (
        <DealPipelineSection
          stages={stages}
          newStageName={newStageName} setNewStageName={setNewStageName}
          newStageProb={newStageProb} setNewStageProb={setNewStageProb}
          newStageSla={newStageSla} setNewStageSla={setNewStageSla}
          newStageColor={newStageColor} setNewStageColor={setNewStageColor}
          totalOpenSlaDays={totalOpenSlaDays}
          onUpdateProbability={handleUpdateProbability}
          onUpdateSla={handleUpdateSla}
          onMoveStage={handleMoveStage}
          onAddStage={handleAddStage}
          onDeleteStage={handleDeleteStage}
        />
      ),
    },
    {
      id: "aging",
      label: "Deal Aging & Alerts",
      icon: Clock,
      component: (
        <DealAgingSection
          dealRotDays={dealRotDays} setDealRotDays={setDealRotDays}
          stageAgingAlertEnabled={stageAgingAlertEnabled} setStageAgingAlertEnabled={setStageAgingAlertEnabled}
          closeDateRiskAlertEnabled={closeDateRiskAlertEnabled} setCloseDateRiskAlertEnabled={setCloseDateRiskAlertEnabled}
          closeDateRiskDays={closeDateRiskDays} setCloseDateRiskDays={setCloseDateRiskDays}
          staleDealNotificationEnabled={staleDealNotificationEnabled} setStaleDealNotificationEnabled={setStaleDealNotificationEnabled}
          overdueDealEscalationEnabled={overdueDealEscalationEnabled} setOverdueDealEscalationEnabled={setOverdueDealEscalationEnabled}
          triggerAutoSave={triggerAutoSave}
        />
      ),
    },
    {
      id: "forecast",
      label: "Forecast Configuration",
      icon: BarChart3,
      component: (
        <DealForecastSection
          weightedForecast={weightedForecast} setWeightedForecast={setWeightedForecast}
          includeOmittedInFunnel={includeOmittedInFunnel} setIncludeOmittedInFunnel={setIncludeOmittedInFunnel}
          fiscalYearStartMonth={fiscalYearStartMonth} setFiscalYearStartMonth={setFiscalYearStartMonth}
          triggerAutoSave={triggerAutoSave}
        />
      ),
    },
    {
      id: "fields",
      label: "Deal Fields & Layout",
      icon: SlidersHorizontal,
      component: (
        <DealFieldsSection
          standardFields={standardFields}
          customFields={customFields}
          requireExpectedCloseDate={requireExpectedCloseDate} setRequireExpectedCloseDate={setRequireExpectedCloseDate}
          requireDealSource={requireDealSource} setRequireDealSource={setRequireDealSource}
          enableCompetitorTracking={enableCompetitorTracking} setEnableCompetitorTracking={setEnableCompetitorTracking}
          enableLostReasonAnalysis={enableLostReasonAnalysis} setEnableLostReasonAnalysis={setEnableLostReasonAnalysis}
          showAddCustomField={showAddCustomField} setShowAddCustomField={setShowAddCustomField}
          newFieldName={newFieldName} setNewFieldName={setNewFieldName}
          newFieldType={newFieldType} setNewFieldType={setNewFieldType}
          newFieldRequired={newFieldRequired} setNewFieldRequired={setNewFieldRequired}
          onToggleStandardFieldVisibility={handleToggleStandardFieldVisibility}
          onToggleStandardFieldRequired={handleToggleStandardFieldRequired}
          onAddCustomField={handleAddCustomField}
          onDeleteCustomField={handleDeleteCustomField}
          onSyncRequireExpectedCloseDate={syncRequireExpectedCloseDate}
          onSyncRequireDealSource={syncRequireDealSource}
          onSyncEnableLostReasonAnalysis={syncEnableLostReasonAnalysis}
          triggerAutoSave={triggerAutoSave}
        />
      ),
    },
    {
      id: "governance",
      label: "Sales Governance & Approvals",
      icon: ShieldAlert,
      component: (
        <DealGovernanceSection
          currency={currency}
          requireQuotationApproval={requireQuotationApproval} setRequireQuotationApproval={setRequireQuotationApproval}
          discountThreshold={discountThreshold} setDiscountThreshold={setDiscountThreshold}
          requireDealValueApproval={requireDealValueApproval} setRequireDealValueApproval={setRequireDealValueApproval}
          dealValueThreshold={dealValueThreshold} setDealValueThreshold={setDealValueThreshold}
          lockClosedDeals={lockClosedDeals} setLockClosedDeals={setLockClosedDeals}
          allowReopenClosed={allowReopenClosed} setAllowReopenClosed={setAllowReopenClosed}
          autoAssignDeals={autoAssignDeals} setAutoAssignDeals={setAutoAssignDeals}
          enableStagnantReassignment={enableStagnantReassignment} setEnableStagnantReassignment={setEnableStagnantReassignment}
          reassignOnStuckDays={reassignOnStuckDays} setReassignOnStuckDays={setReassignOnStuckDays}
          triggerAutoSave={triggerAutoSave}
        />
      ),
    },
  ];

  return (
    <ContextualSettingsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Deal Settings"
      subtitle="Customize sales pipelines, stage win probabilities, deal rot thresholds, and governance rules."
      icon={Handshake}
      sections={sections}
      defaultSection={defaultSection}
      autoSave={true}
      autoSaveStatus={autoSaveStatus}
    />
  );
}
