"use client";

import React, { useState } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
  SettingsField,
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
import { toast } from "sonner";
import {
  Handshake,
  Kanban,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  UserCheck,
  BarChart3,
  ShieldAlert,
} from "lucide-react";

interface Stage {
  id: string;
  name: string;
  probability: number;
  slaDays: number;
  color: string;
}

const DEFAULT_STAGES: Stage[] = [
  { id: "lead_in", name: "Lead In / Discovery", probability: 10, slaDays: 3, color: "bg-blue-500" },
  { id: "qualified", name: "Contact Made / Qualified", probability: 30, slaDays: 5, color: "bg-indigo-500" },
  { id: "proposal", name: "Proposal Sent", probability: 60, slaDays: 7, color: "bg-amber-500" },
  { id: "negotiation", name: "Negotiation", probability: 80, slaDays: 4, color: "bg-purple-500" },
  { id: "won", name: "Closed Won", probability: 100, slaDays: 0, color: "bg-emerald-500" },
  { id: "lost", name: "Closed Lost", probability: 0, slaDays: 0, color: "bg-rose-500" },
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
  // Pipelines & Stages
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [newStageName, setNewStageName] = useState("");
  const [newStageProb, setNewStageProb] = useState("50");

  // Deal Fields
  const [requireExpectedCloseDate, setRequireExpectedCloseDate] = useState(true);
  const [requireDealSource, setRequireDealSource] = useState(true);
  const [enableCompetitorTracking, setEnableCompetitorTracking] = useState(true);
  const [enableLostReasonAnalysis, setEnableLostReasonAnalysis] = useState(true);

  // Probability & Deal Aging (Sales Preferences)
  const [dealRotDays, setDealRotDays] = useState("14");
  const [discountThreshold, setDiscountThreshold] = useState("15");

  // Forecasting
  const [weightedForecast, setWeightedForecast] = useState(true);
  const [includeOmittedInFunnel, setIncludeOmittedInFunnel] = useState(false);
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState("4"); // April

  // Assignment Rules
  const [autoAssignDeals, setAutoAssignDeals] = useState(true);
  const [reassignOnStuckDays, setReassignOnStuckDays] = useState("21");

  // Sales Governance
  const [requireQuotationApproval, setRequireQuotationApproval] = useState(true);
  const [lockClosedDeals, setLockClosedDeals] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdateProbability = (id: string, prob: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, probability: Math.min(100, Math.max(0, prob)) } : s))
    );
    setHasChanges(true);
  };

  const handleUpdateSla = (id: string, days: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, slaDays: Math.max(0, days) } : s))
    );
    setHasChanges(true);
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const newStage: Stage = {
      id: `stage_${Date.now()}`,
      name: newStageName.trim(),
      probability: parseInt(newStageProb) || 50,
      slaDays: 7,
      color: "bg-primary",
    };
    setStages([...stages, newStage]);
    setNewStageName("");
    setHasChanges(true);
    toast.success(`Stage "${newStage.name}" added`);
  };

  const handleDeleteStage = (id: string) => {
    if (stages.length <= 2) {
      toast.error("Pipeline must have at least 2 stages");
      return;
    }
    setStages(stages.filter((s) => s.id !== id));
    setHasChanges(true);
    toast.success("Stage removed");
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Deal and pipeline settings saved successfully");
    onOpenChange(false);
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "pipelines",
      label: "Pipelines & Stages",
      icon: Kanban,
      badge: `${stages.length} Stages`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deal Pipeline & Progression Stages"
            description="Configure pipeline stages, win probability weighting, and stage SLA target durations."
            icon={Kanban}
          >
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border border-border/60 rounded-lg items-center">
                <span className="col-span-6">Stage Name</span>
                <span className="col-span-3 text-center">Probability (%)</span>
                <span className="col-span-2 text-center">SLA (Days)</span>
                <span className="col-span-1 text-right">Action</span>
              </div>

              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="grid grid-cols-12 items-center px-3 py-2.5 border border-border/70 rounded-lg bg-card hover:border-border transition-colors text-xs"
                >
                  <div className="col-span-6 flex items-center gap-2.5">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color} shrink-0`} />
                    <span className="font-semibold text-foreground truncate">{stage.name}</span>
                  </div>

                  <div className="col-span-3 flex justify-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={stage.probability}
                      onChange={(e) => handleUpdateProbability(stage.id, parseInt(e.target.value) || 0)}
                      className="w-20 h-7.5 text-center text-xs font-semibold"
                    />
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={stage.slaDays}
                      onChange={(e) => handleUpdateSla(stage.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-7.5 text-center text-xs"
                    />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStage(stage.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddStage}
              className="mt-3 p-3 rounded-xl border border-dashed border-border/80 flex flex-col sm:flex-row items-center gap-2.5"
            >
              <Input
                placeholder="New stage name (e.g. Contract Review)..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Win %"
                  value={newStageProb}
                  onChange={(e) => setNewStageProb(e.target.value)}
                  className="w-24 text-xs h-9 text-center"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="text-xs font-semibold gap-1.5 h-9 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stage
                </Button>
              </div>
            </form>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "probability",
      label: "Probability & Aging",
      icon: TrendingUp,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deal Aging Rules & Probability Alerts"
            description="Configure deal stagnation triggers, rotting alert thresholds, and discount boundaries."
            icon={TrendingUp}
          >
            <div className="space-y-4">
              <SettingsRow
                label="Deal Rot Alert Threshold"
                description="Highlight deals that remain in the same stage without logged touchpoints for longer than this period."
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
                      setHasChanges(true);
                    }}
                    className="w-20 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">days</span>
                </div>
              </SettingsRow>

              <SettingsRow
                label="Quotation Max Discount Ceiling"
                description="Discounts above this threshold mandate approval by a Sales Manager before quotation release."
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
                      setHasChanges(true);
                    }}
                    className="w-20 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                </div>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "forecast",
      label: "Forecast Configuration",
      icon: BarChart3,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Revenue Forecasting Parameters"
            description="Define probability weighting rules, quota calculations, and fiscal year boundaries."
            icon={BarChart3}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Weighted Revenue Forecasting"
                description="Multiply deal values by stage win probability percentages in reports and pipeline metrics."
                checked={weightedForecast}
                onCheckedChange={(c) => {
                  setWeightedForecast(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Include Omitted Deals in Funnel"
                description="Show deals marked as omitted from forecast in conversion funnel analysis."
                checked={includeOmittedInFunnel}
                onCheckedChange={(c) => {
                  setIncludeOmittedInFunnel(c);
                  setHasChanges(true);
                }}
              />
              <SettingsRow
                label="Fiscal Year Starting Month"
                description="Sets the financial year boundary for target and quota tracking."
              >
                <Select
                  value={fiscalYearStartMonth}
                  onValueChange={(val) => {
                    setFiscalYearStartMonth(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="4">April (India FY)</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "fields",
      label: "Deal Fields",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deal Fields & Required Attributes"
            description="Enforce completeness and configure custom attributes on deals."
            icon={SlidersHorizontal}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Require Target Close Date"
                description="Mandate expected deal closing date on creation."
                checked={requireExpectedCloseDate}
                onCheckedChange={(c) => {
                  setRequireExpectedCloseDate(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Require Inbound / Deal Source"
                description="Mandate attribution channel selection for every new deal."
                checked={requireDealSource}
                onCheckedChange={(c) => {
                  setRequireDealSource(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Competitor Tracking Field"
                description="Allow sales reps to specify key rival vendors competing for the deal."
                checked={enableCompetitorTracking}
                onCheckedChange={(c) => {
                  setEnableCompetitorTracking(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Mandatory Reason for Lost Deals"
                description="Require sales agents to submit a loss reason category before moving deal to Closed Lost."
                checked={enableLostReasonAnalysis}
                onCheckedChange={(c) => {
                  setEnableLostReasonAnalysis(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "governance",
      label: "Sales Governance & Rules",
      icon: ShieldAlert,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Deal Governance & Approval Controls"
            description="Protect data integrity, deal locks, and managerial authorization."
            icon={ShieldAlert}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Strict Quotation Approvals"
                description="Require sales manager approval before reps can send formal client PDF quotations."
                checked={requireQuotationApproval}
                onCheckedChange={(c) => {
                  setRequireQuotationApproval(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Lock Closed Deals"
                description="Prevent editing of deal value and parameters once marked as Closed Won or Closed Lost."
                checked={lockClosedDeals}
                onCheckedChange={(c) => {
                  setLockClosedDeals(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Auto-Assign Deal Owner on Conversion"
                description="Automatically set the creator or lead owner as the primary deal executive."
                checked={autoAssignDeals}
                onCheckedChange={(c) => {
                  setAutoAssignDeals(c);
                  setHasChanges(true);
                }}
              />
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
      subtitle="Customize sales pipelines, stage win probabilities, deal rot thresholds, and forecasting rules."
      icon={Handshake}
      badge="Deals Module"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
