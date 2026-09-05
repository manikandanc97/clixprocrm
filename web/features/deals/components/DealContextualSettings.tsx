"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { toast } from "sonner";
import {
  Handshake,
  Kanban,
  Clock,
  BarChart3,
  SlidersHorizontal,
  ShieldAlert,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CalendarClock,
  Mail,
  TrendingUp,
  Filter,
  Calendar,
  Percent,
  Lock,
  UserCheck,
  Layers,
  Tag,
  Sparkles,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCRMStore } from "@/shared/store/useCRMStore";

export interface Stage {
  id: string;
  name: string;
  probability: number;
  slaDays: number;
  color: string;
  type: "OPEN" | "WON" | "LOST";
  isSystem?: boolean;
}

export interface CustomDealField {
  id: string;
  name: string;
  key: string;
  type: "text" | "number" | "date" | "select" | "currency";
  required: boolean;
  options?: string[];
}

export interface StandardFieldConfig {
  id: string;
  name: string;
  type: string;
  required: boolean;
  isSystemRequired: boolean;
  visible: boolean;
  description: string;
}

const DEFAULT_STAGES: Stage[] = [
  { id: "lead_in", name: "Lead In / Discovery", probability: 10, slaDays: 3, color: "bg-blue-500", type: "OPEN" },
  { id: "qualified", name: "Contact Made / Qualified", probability: 30, slaDays: 5, color: "bg-indigo-500", type: "OPEN" },
  { id: "proposal", name: "Proposal Sent", probability: 60, slaDays: 7, color: "bg-amber-500", type: "OPEN" },
  { id: "negotiation", name: "Negotiation", probability: 80, slaDays: 4, color: "bg-purple-500", type: "OPEN" },
  { id: "won", name: "Closed Won", probability: 100, slaDays: 0, color: "bg-emerald-500", type: "WON", isSystem: true },
  { id: "lost", name: "Closed Lost", probability: 0, slaDays: 0, color: "bg-rose-500", type: "LOST", isSystem: true },
];

const DEFAULT_STANDARD_FIELDS: StandardFieldConfig[] = [
  { id: "name", name: "Deal Name", type: "Text", required: true, isSystemRequired: true, visible: true, description: "Primary title of the opportunity." },
  { id: "value", name: "Deal Amount", type: "Currency", required: true, isSystemRequired: false, visible: true, description: "Estimated total contract or revenue value." },
  { id: "expectedCloseDate", name: "Target Close Date", type: "Date", required: true, isSystemRequired: false, visible: true, description: "Expected closure date for forecasting." },
  { id: "source", name: "Deal Source", type: "Dropdown", required: true, isSystemRequired: false, visible: true, description: "Channel or campaign attribution." },
  { id: "company", name: "Associated Company", type: "Relation", required: false, isSystemRequired: false, visible: true, description: "Organization linked to the opportunity." },
  { id: "customer", name: "Primary Contact", type: "Relation", required: false, isSystemRequired: false, visible: true, description: "Primary decision-maker or contact person." },
  { id: "owner", name: "Deal Owner", type: "User", required: true, isSystemRequired: true, visible: true, description: "Assigned sales executive or representative." },
  { id: "stage", name: "Pipeline Stage", type: "Stage", required: true, isSystemRequired: true, visible: true, description: "Current progression phase in sales pipeline." },
  { id: "probability", name: "Win Probability", type: "Percentage", required: false, isSystemRequired: false, visible: true, description: "Estimated percentage likelihood of winning." },
  { id: "competitor", name: "Competitor", type: "Text", required: false, isSystemRequired: false, visible: true, description: "Key rival vendor competing for the account." },
  { id: "lostReason", name: "Lost Reason", type: "Dropdown", required: true, isSystemRequired: false, visible: true, description: "Classification category when deal is lost." },
];

const DEFAULT_CUSTOM_FIELDS: CustomDealField[] = [
  { id: "cf_deal_type", name: "Deal Type", key: "deal_type", type: "select", required: false, options: ["New Business", "Renewal", "Upsell / Expansion"] },
  { id: "cf_contract_term", name: "Contract Term (Months)", key: "contract_term", type: "number", required: false },
  { id: "cf_region", name: "Sales Region", key: "sales_region", type: "select", required: false, options: ["North America", "EMEA", "APAC", "Domestic"] },
];

const COLOR_PRESETS = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Rose", value: "bg-rose-500" },
];

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
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState("4"); // April

  // 4. Deal Fields & Layout
  const [standardFields, setStandardFields] = useState<StandardFieldConfig[]>(DEFAULT_STANDARD_FIELDS);
  const [customFields, setCustomFields] = useState<CustomDealField[]>(DEFAULT_CUSTOM_FIELDS);
  const [requireExpectedCloseDate, setRequireExpectedCloseDate] = useState(true);
  const [requireDealSource, setRequireDealSource] = useState(true);
  const [enableCompetitorTracking, setEnableCompetitorTracking] = useState(true);
  const [enableLostReasonAnalysis, setEnableLostReasonAnalysis] = useState(true);

  // New custom field form
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "date" | "select" | "currency">("text");
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

  // Persistence & Auto-Save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load persistent configuration from storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
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
  }, [storageKey]);

  // Auto-save mutation trigger
  const triggerAutoSave = useCallback(() => {
    if (!isLoadedRef.current || typeof window === "undefined") return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setAutoSaveStatus("saving");

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const payload = {
          stages,
          dealRotDays,
          stageAgingAlertEnabled,
          closeDateRiskAlertEnabled,
          closeDateRiskDays,
          staleDealNotificationEnabled,
          overdueDealEscalationEnabled,
          weightedForecast,
          includeOmittedInFunnel,
          fiscalYearStartMonth,
          standardFields,
          customFields,
          requireExpectedCloseDate,
          requireDealSource,
          enableCompetitorTracking,
          enableLostReasonAnalysis,
          requireQuotationApproval,
          discountThreshold,
          requireDealValueApproval,
          dealValueThreshold,
          lockClosedDeals,
          allowReopenClosed,
          autoAssignDeals,
          enableStagnantReassignment,
          reassignOnStuckDays,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setAutoSaveStatus("saved");

        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 1800);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 300);
  }, [
    storageKey,
    stages,
    dealRotDays,
    stageAgingAlertEnabled,
    closeDateRiskAlertEnabled,
    closeDateRiskDays,
    staleDealNotificationEnabled,
    overdueDealEscalationEnabled,
    weightedForecast,
    includeOmittedInFunnel,
    fiscalYearStartMonth,
    standardFields,
    customFields,
    requireExpectedCloseDate,
    requireDealSource,
    enableCompetitorTracking,
    enableLostReasonAnalysis,
    requireQuotationApproval,
    discountThreshold,
    requireDealValueApproval,
    dealValueThreshold,
    lockClosedDeals,
    allowReopenClosed,
    autoAssignDeals,
    enableStagnantReassignment,
    reassignOnStuckDays,
  ]);

  // Stage Handlers
  const handleUpdateProbability = (id: string, prob: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, probability: Math.min(100, Math.max(0, prob)) } : s))
    );
    triggerAutoSave();
  };

  const handleUpdateSla = (id: string, days: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, slaDays: Math.max(0, days) } : s))
    );
    triggerAutoSave();
  };

  const handleMoveStage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    // Prevent reordering terminal stages past open ones or vice versa if user prefers,
    // but keep flexible stage positioning
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
      id: `stage_${Date.now()}`,
      name: newStageName.trim(),
      probability: Math.min(100, Math.max(0, parseInt(newStageProb) || 50)),
      slaDays: Math.max(0, parseInt(newStageSla) || 5),
      color: newStageColor,
      type: "OPEN",
    };

    // Insert before terminal stages (Won / Lost)
    const terminalIndex = stages.findIndex((s) => s.type === "WON" || s.type === "LOST");
    let updated: Stage[];
    if (terminalIndex !== -1) {
      updated = [...stages.slice(0, terminalIndex), newStage, ...stages.slice(terminalIndex)];
    } else {
      updated = [...stages, newStage];
    }

    setStages(updated);
    setNewStageName("");
    setNewStageProb("50");
    setNewStageSla("5");
    toast.success(`Stage "${newStage.name}" added to pipeline`);
    triggerAutoSave();
  };

  const handleDeleteStage = (id: string) => {
    const stageToDelete = stages.find((s) => s.id === id);
    if (!stageToDelete) return;

    if (stageToDelete.isSystem || stageToDelete.type === "WON" || stageToDelete.type === "LOST") {
      toast.error("System terminal stages (Closed Won / Closed Lost) cannot be deleted");
      return;
    }

    const openStages = stages.filter((s) => s.type === "OPEN");
    if (openStages.length <= 1) {
      toast.error("Pipeline must have at least one active open progression stage");
      return;
    }

    setStages(stages.filter((s) => s.id !== id));
    toast.success(`Stage "${stageToDelete.name}" removed`);
    triggerAutoSave();
  };

  // Field Handlers
  const handleToggleStandardFieldVisibility = (fieldId: string) => {
    setStandardFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          if (f.isSystemRequired) return f;
          return { ...f, visible: !f.visible };
        }
        return f;
      })
    );
    triggerAutoSave();
  };

  const handleToggleStandardFieldRequired = (fieldId: string) => {
    setStandardFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          if (f.isSystemRequired) return f;
          const nextReq = !f.required;
          // Sync with related convenience switches
          if (f.id === "expectedCloseDate") setRequireExpectedCloseDate(nextReq);
          if (f.id === "source") setRequireDealSource(nextReq);
          if (f.id === "lostReason") setEnableLostReasonAnalysis(nextReq);
          return { ...f, required: nextReq };
        }
        return f;
      })
    );
    triggerAutoSave();
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const key = newFieldName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    const newField: CustomDealField = {
      id: `cf_${Date.now()}`,
      name: newFieldName.trim(),
      key,
      type: newFieldType,
      required: newFieldRequired,
    };

    setCustomFields((prev) => [...prev, newField]);
    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setShowAddCustomField(false);
    toast.success(`Custom field "${newField.name}" created`);
    triggerAutoSave();
  };

  const handleDeleteCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    toast.success("Custom field removed");
    triggerAutoSave();
  };

  // Pipeline SLA calculation
  const totalOpenSlaDays = stages
    .filter((s) => s.type === "OPEN")
    .reduce((acc, s) => acc + (s.slaDays || 0), 0);

  // 5 Canonical Sections
  const sections: ContextualSettingSection[] = [
    // 1. Pipelines & Stages
    {
      id: "pipelines",
      label: "Pipelines & Stages",
      icon: Kanban,
      badge: `${stages.length} Stages`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deal Pipeline & Progression Stages"
            description="Configure sales pipeline stages, probability weighting, target SLA cycle duration, and terminal milestones."
            icon={Kanban}
            headerAction={
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
                  Default Sales Pipeline
                </Badge>
              </div>
            }
          >
            {/* Stage Table Header */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border border-border/60 rounded-lg items-center">
                <span className="col-span-5">Stage Name & Type</span>
                <span className="col-span-3 text-center">Probability (%)</span>
                <span className="col-span-2 text-center">SLA (Days)</span>
                <span className="col-span-2 text-right pr-1">Order / Actions</span>
              </div>

              {/* Stage Items */}
              <div className="space-y-1.5">
                {stages.map((stage, idx) => {
                  const isTerminalWon = stage.type === "WON" || stage.id === "won";
                  const isTerminalLost = stage.type === "LOST" || stage.id === "lost";
                  const isTerminal = isTerminalWon || isTerminalLost;

                  return (
                    <div
                      key={stage.id}
                      className="grid grid-cols-12 items-center px-3 py-2.5 border border-border/70 rounded-lg bg-card hover:border-border transition-colors text-xs gap-2"
                    >
                      {/* Name & Badge */}
                      <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        <div className={`w-2.5 h-2.5 rounded-full ${stage.color} shrink-0`} />
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground truncate">{stage.name}</span>
                          {isTerminalWon ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0"
                            >
                              Closed Won
                            </Badge>
                          ) : isTerminalLost ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 font-semibold border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0"
                            >
                              Closed Lost
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[9px] py-0 px-1 font-normal bg-muted text-muted-foreground shrink-0"
                            >
                              Open
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Probability */}
                      <div className="col-span-3 flex justify-center">
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={stage.probability}
                            disabled={isTerminalWon || isTerminalLost}
                            onChange={(e) => handleUpdateProbability(stage.id, parseInt(e.target.value) || 0)}
                            className="w-18 h-7.5 text-center text-xs font-semibold pr-4"
                          />
                          <span className="absolute right-2 text-[10px] text-muted-foreground pointer-events-none">%</span>
                        </div>
                      </div>

                      {/* SLA Days */}
                      <div className="col-span-2 flex justify-center">
                        {isTerminal ? (
                          <span className="text-[11px] text-muted-foreground/60 italic">—</span>
                        ) : (
                          <div className="relative flex items-center">
                            <Input
                              type="number"
                              min="0"
                              max="90"
                              value={stage.slaDays}
                              onChange={(e) => handleUpdateSla(stage.id, parseInt(e.target.value) || 0)}
                              className="w-16 h-7.5 text-center text-xs pr-4"
                            />
                            <span className="absolute right-1.5 text-[9px] text-muted-foreground pointer-events-none">d</span>
                          </div>
                        )}
                      </div>

                      {/* Reorder and Delete */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={idx === 0}
                          onClick={() => handleMoveStage(idx, "up")}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={idx === stages.length - 1}
                          onClick={() => handleMoveStage(idx, "down")}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>

                        {isTerminal ? (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    disabled
                                    className="h-6 w-6 text-muted-foreground/30 cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="text-[11px] max-w-xs">
                                System terminal stages cannot be removed
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteStage(stage.id)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete stage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Stage Form */}
            <form
              onSubmit={handleAddStage}
              className="mt-3 p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 flex flex-col sm:flex-row items-center gap-2.5"
            >
              <Input
                placeholder="New stage name (e.g. Technical Evaluation)..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="text-xs h-8.5 flex-1"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Win %"
                    value={newStageProb}
                    onChange={(e) => setNewStageProb(e.target.value)}
                    className="w-20 text-xs h-8.5 text-center pr-4"
                  />
                  <span className="absolute right-2 text-[10px] text-muted-foreground pointer-events-none">%</span>
                </div>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="SLA"
                    value={newStageSla}
                    onChange={(e) => setNewStageSla(e.target.value)}
                    className="w-18 text-xs h-8.5 text-center pr-4"
                  />
                  <span className="absolute right-1.5 text-[10px] text-muted-foreground pointer-events-none">d</span>
                </div>

                <Select value={newStageColor} onValueChange={setNewStageColor}>
                  <SelectTrigger className="w-24 h-8.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${newStageColor}`} />
                      <span className="text-[11px] capitalize">Color</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${p.value}`} />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="text-xs font-semibold gap-1.5 h-8.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stage
                </Button>
              </div>
            </form>

            {/* Pipeline Velocity & SLA Summary */}
            <div className="mt-3 p-3 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  Estimated Total Pipeline Cycle SLA: <strong className="text-foreground">{totalOpenSlaDays} days</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  {stages.filter((s) => s.type === "OPEN").length} Open Stages
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  2 Terminal Stages
                </span>
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 2. Deal Aging & Alerts
    {
      id: "aging",
      label: "Deal Aging & Alerts",
      icon: Clock,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deal Aging Rules & Stagnation Alerts"
            description="Configure inactivity thresholds, rotting notifications, stage duration alerts, and manager escalation triggers."
            icon={Clock}
          >
            <div className="divide-y divide-border/40">
              {/* Deal Rot / Inactivity Threshold */}
              <SettingsRow
                label="Deal Rot / Inactivity Alert Threshold"
                description="Highlight deals in pipeline views that remain without touchpoints or stage progression longer than this threshold."
                icon={Clock}
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={dealRotDays}
                    onChange={(e) => {
                      setDealRotDays(e.target.value);
                      triggerAutoSave();
                    }}
                    className="w-20 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs font-medium">days</span>
                </div>
              </SettingsRow>

              {/* Stage Aging Alert */}
              <SettingsToggleRow
                label="Stage Aging SLA Alerts"
                description="Flag opportunities that exceed the target SLA duration configured for their current pipeline stage."
                icon={AlertCircle}
                checked={stageAgingAlertEnabled}
                onCheckedChange={(c) => {
                  setStageAgingAlertEnabled(c);
                  triggerAutoSave();
                }}
              />

              {/* Close Date Risk Warning */}
              <SettingsRow
                label="Close Date Risk Alert"
                description="Highlight deals nearing their target close date without confirmed quotation or contract agreement."
                icon={CalendarClock}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      disabled={!closeDateRiskAlertEnabled}
                      value={closeDateRiskDays}
                      onChange={(e) => {
                        setCloseDateRiskDays(e.target.value);
                        triggerAutoSave();
                      }}
                      className="w-18 h-8 text-xs text-center disabled:opacity-50"
                    />
                    <span className="text-muted-foreground text-xs font-medium">days prior</span>
                  </div>
                  <Switch
                    checked={closeDateRiskAlertEnabled}
                    onCheckedChange={(c) => {
                      setCloseDateRiskAlertEnabled(c);
                      triggerAutoSave();
                    }}
                    className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                  />
                </div>
              </SettingsRow>

              {/* Stale Deal Notification */}
              <SettingsToggleRow
                label="Stale Deal Notification Digest"
                description="Send automated in-app and email notification digests to deal owners for stale opportunities."
                icon={Mail}
                checked={staleDealNotificationEnabled}
                onCheckedChange={(c) => {
                  setStaleDealNotificationEnabled(c);
                  triggerAutoSave();
                }}
              />

              {/* Overdue Deal Escalation */}
              <SettingsToggleRow
                label="Overdue Deal Escalation"
                description="Escalate neglected deals past their target closing date directly to the sales manager or team lead."
                icon={ShieldAlert}
                checked={overdueDealEscalationEnabled}
                onCheckedChange={(c) => {
                  setOverdueDealEscalationEnabled(c);
                  triggerAutoSave();
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 3. Forecast Configuration
    {
      id: "forecast",
      label: "Forecast Configuration",
      icon: BarChart3,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Revenue Forecasting Parameters"
            description="Configure probability weighting calculations, quota definitions, and fiscal year boundaries."
            icon={BarChart3}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Weighted Revenue Forecasting"
                description="Multiply deal values by stage win probability percentages in reports, executive dashboards, and pipeline analytics."
                icon={TrendingUp}
                checked={weightedForecast}
                onCheckedChange={(c) => {
                  setWeightedForecast(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Include Omitted Deals in Funnel"
                description="Show deals marked as omitted from forecast in high-level conversion funnel and pipeline velocity analysis."
                icon={Filter}
                checked={includeOmittedInFunnel}
                onCheckedChange={(c) => {
                  setIncludeOmittedInFunnel(c);
                  triggerAutoSave();
                }}
              />

              <SettingsRow
                label="Fiscal Year Starting Month"
                description="Sets the financial year boundary for target and quota tracking across the workspace."
                icon={Calendar}
              >
                <Select
                  value={fiscalYearStartMonth}
                  onValueChange={(val) => {
                    setFiscalYearStartMonth(val);
                    triggerAutoSave();
                  }}
                >
                  <SelectTrigger className="w-44 h-8 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January (Calendar FY)</SelectItem>
                    <SelectItem value="4">April (India FY)</SelectItem>
                    <SelectItem value="7">July (Mid-Year FY)</SelectItem>
                    <SelectItem value="10">October (Q4 FY)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
            </div>
          </SettingsSection>

          {/* Forecast Categories Overview Card */}
          <SettingsSection
            title="Forecast Categories Mapping"
            description="Standard deal progression tiers used in quarterly commit and revenue projection models."
            icon={Layers}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">Pipeline</span>
                  <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400">10% - 40%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Early stage exploration, discovery calls, and qualified opportunities with active engagement.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">Best Case</span>
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400">50% - 75%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Proposals submitted and active budget evaluation with high likelihood of closing within cycle.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">Commit</span>
                  <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400">80% - 99%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Final terms agreed and contract in legal or signatory sign-off; guaranteed for quarterly quota.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">Closed</span>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">100% / 0%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Terminal state deals formally booked as Won Revenue or marked as Closed Lost.
                </p>
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 4. Deal Fields & Layout
    {
      id: "fields",
      label: "Deal Fields & Layout",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          {/* Validation Rules */}
          <SettingsSection
            title="Required Field Rules & Validation"
            description="Enforce completeness on deal creation and stage movement."
            icon={SlidersHorizontal}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Require Target Close Date"
                description="Mandate expected deal closing date on opportunity creation."
                checked={requireExpectedCloseDate}
                onCheckedChange={(c) => {
                  setRequireExpectedCloseDate(c);
                  setStandardFields((prev) =>
                    prev.map((f) => (f.id === "expectedCloseDate" ? { ...f, required: c } : f))
                  );
                  triggerAutoSave();
                }}
              />
              <SettingsToggleRow
                label="Require Deal Source Attribution"
                description="Mandate marketing/inbound attribution channel selection for every new deal."
                checked={requireDealSource}
                onCheckedChange={(c) => {
                  setRequireDealSource(c);
                  setStandardFields((prev) =>
                    prev.map((f) => (f.id === "source" ? { ...f, required: c } : f))
                  );
                  triggerAutoSave();
                }}
              />
              <SettingsToggleRow
                label="Mandatory Reason for Lost Deals"
                description="Require sales agents to specify a loss reason category before moving deal to Closed Lost."
                checked={enableLostReasonAnalysis}
                onCheckedChange={(c) => {
                  setEnableLostReasonAnalysis(c);
                  setStandardFields((prev) =>
                    prev.map((f) => (f.id === "lostReason" ? { ...f, required: c } : f))
                  );
                  triggerAutoSave();
                }}
              />
              <SettingsToggleRow
                label="Competitor Tracking Field"
                description="Allow sales reps to specify key rival vendors competing for the deal."
                checked={enableCompetitorTracking}
                onCheckedChange={(c) => {
                  setEnableCompetitorTracking(c);
                  triggerAutoSave();
                }}
              />
            </div>
          </SettingsSection>

          {/* Standard Fields Table */}
          <SettingsSection
            title="Standard Deal Fields"
            description="Configure field visibility and requirement attributes across deal forms and views."
            icon={Briefcase}
          >
            <div className="space-y-2">
              <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border border-border/60 rounded-lg items-center">
                <span className="col-span-5">Field Name</span>
                <span className="col-span-3 text-center">Data Type</span>
                <span className="col-span-2 text-center">Required</span>
                <span className="col-span-2 text-center">Visible</span>
              </div>

              <div className="space-y-1">
                {standardFields.map((field) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 items-center px-3 py-2 border border-border/60 rounded-lg bg-card text-xs hover:border-border transition-colors"
                  >
                    <div className="col-span-5 min-w-0 pr-2">
                      <span className="font-semibold text-foreground truncate block">{field.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate block">{field.description}</span>
                    </div>

                    <div className="col-span-3 text-center">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                        {field.type}
                      </Badge>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {field.isSystemRequired ? (
                        <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground">
                          System
                        </Badge>
                      ) : (
                        <Switch
                          checked={field.required}
                          onCheckedChange={() => handleToggleStandardFieldRequired(field.id)}
                          className="data-[state=checked]:bg-emerald-600 scale-75 cursor-pointer"
                        />
                      )}
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {field.isSystemRequired ? (
                        <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground">
                          Always
                        </Badge>
                      ) : (
                        <Switch
                          checked={field.visible}
                          onCheckedChange={() => handleToggleStandardFieldVisibility(field.id)}
                          className="data-[state=checked]:bg-emerald-600 scale-75 cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SettingsSection>

          {/* Custom Deal Attributes */}
          <SettingsSection
            title="Custom Deal Fields"
            description="Extend deal records with organization-specific attributes and custom properties."
            icon={Tag}
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCustomField(!showAddCustomField)}
                className="h-7 text-xs font-semibold gap-1.5 border-border/70"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Field
              </Button>
            }
          >
            {/* Add Custom Field Form */}
            {showAddCustomField && (
              <form
                onSubmit={handleAddCustomField}
                className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3 mb-3 animate-in fade-in duration-150"
              >
                <div className="text-xs font-bold text-foreground">New Custom Field Definition</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Field Label</label>
                    <Input
                      placeholder="e.g. Budget Approved..."
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Type</label>
                    <Select value={newFieldType} onValueChange={(val: string) => setNewFieldType(val as CustomDealField["type"])}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Single Line Text</SelectItem>
                        <SelectItem value="number">Numeric Value</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="date">Date Picker</SelectItem>
                        <SelectItem value="select">Dropdown Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground pb-1.5 cursor-pointer">
                      <Switch
                        checked={newFieldRequired}
                        onCheckedChange={setNewFieldRequired}
                        className="data-[state=checked]:bg-emerald-600 scale-75 cursor-pointer"
                      />
                      <span>Required</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCustomField(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Save Field
                  </Button>
                </div>
              </form>
            )}

            {/* Custom Field List */}
            {customFields.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg">
                No custom deal fields defined yet. Click &quot;Add Custom Field&quot; to create one.
              </div>
            ) : (
              <div className="space-y-1.5">
                {customFields.map((cf) => (
                  <div
                    key={cf.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 bg-card text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{cf.name}</span>
                      <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                        {cf.key}
                      </code>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {cf.type}
                      </Badge>
                      {cf.required && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 bg-amber-500/10 text-amber-600">
                          Required
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDeleteCustomField(cf.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SettingsSection>
        </div>
      ),
    },

    // 5. Sales Governance & Approvals
    {
      id: "governance",
      label: "Sales Governance & Approvals",
      icon: ShieldAlert,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deal Governance & Approval Controls"
            description="Protect deal data integrity, quotation discounting limits, and managerial approval workflows."
            icon={ShieldAlert}
          >
            <div className="divide-y divide-border/40">
              {/* Strict Quotation Approvals */}
              <SettingsToggleRow
                label="Strict Quotation Approvals"
                description="Require sales manager approval before sales reps can issue or send formal client PDF quotations."
                checked={requireQuotationApproval}
                onCheckedChange={(c) => {
                  setRequireQuotationApproval(c);
                  triggerAutoSave();
                }}
              />

              {/* Quotation Max Discount Ceiling (Moved from Aging) */}
              <SettingsRow
                label="Quotation Max Discount Ceiling"
                description="Quotation discounts exceeding this percentage mandate managerial approval before quotation generation."
                icon={Percent}
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountThreshold}
                    onChange={(e) => {
                      setDiscountThreshold(e.target.value);
                      triggerAutoSave();
                    }}
                    className="w-20 h-8 text-xs text-center font-semibold"
                  />
                  <span className="text-muted-foreground text-xs font-semibold">%</span>
                </div>
              </SettingsRow>

              {/* Deal Value Approval Threshold */}
              <SettingsRow
                label="High-Value Deal Approval Threshold"
                description="Require sales director authorization for deals exceeding this contract value threshold."
                icon={DollarSign}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="0"
                      step="10000"
                      disabled={!requireDealValueApproval}
                      value={dealValueThreshold}
                      onChange={(e) => {
                        setDealValueThreshold(e.target.value);
                        triggerAutoSave();
                      }}
                      className="w-28 h-8 text-xs text-center font-semibold disabled:opacity-50"
                    />
                    <span className="text-muted-foreground text-xs font-medium">{currency}</span>
                  </div>
                  <Switch
                    checked={requireDealValueApproval}
                    onCheckedChange={(c) => {
                      setRequireDealValueApproval(c);
                      triggerAutoSave();
                    }}
                    className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                  />
                </div>
              </SettingsRow>

              {/* Lock Closed Deals */}
              <SettingsToggleRow
                label="Lock Closed Deals"
                description="Prevent editing of deal value, products, and parameters once marked as Closed Won or Closed Lost."
                icon={Lock}
                checked={lockClosedDeals}
                onCheckedChange={(c) => {
                  setLockClosedDeals(c);
                  triggerAutoSave();
                }}
              />

              {/* Allow Authorized Reopening */}
              <SettingsToggleRow
                label="Allow Authorized Reopening of Closed Deals"
                description="Permit workspace administrators and sales managers to reopen closed deals with audit logging."
                icon={UserCheck}
                checked={allowReopenClosed}
                onCheckedChange={(c) => {
                  setAllowReopenClosed(c);
                  triggerAutoSave();
                }}
              />

              {/* Auto-Assign Deal Owner on Conversion */}
              <SettingsToggleRow
                label="Auto-Assign Deal Owner on Conversion"
                description="Automatically assign the lead owner or creator as the primary deal executive upon lead conversion."
                icon={Sparkles}
                checked={autoAssignDeals}
                onCheckedChange={(c) => {
                  setAutoAssignDeals(c);
                  triggerAutoSave();
                }}
              />

              {/* Reassign Stagnant Deals */}
              <SettingsRow
                label="Auto-Reassign Stagnant Deals"
                description="Automatically reassign deals with no stage movement or logged touchpoints after this duration."
                icon={Clock}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="1"
                      max="180"
                      disabled={!enableStagnantReassignment}
                      value={reassignOnStuckDays}
                      onChange={(e) => {
                        setReassignOnStuckDays(e.target.value);
                        triggerAutoSave();
                      }}
                      className="w-18 h-8 text-xs text-center disabled:opacity-50"
                    />
                    <span className="text-muted-foreground text-xs font-medium">days</span>
                  </div>
                  <Switch
                    checked={enableStagnantReassignment}
                    onCheckedChange={(c) => {
                      setEnableStagnantReassignment(c);
                      triggerAutoSave();
                    }}
                    className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                  />
                </div>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
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
