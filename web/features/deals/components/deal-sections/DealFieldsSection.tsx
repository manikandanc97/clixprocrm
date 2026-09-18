"use client";

import React from "react";
import {
  SettingsSection,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { SlidersHorizontal, Briefcase, Tag, Plus, Trash2 } from "lucide-react";
import type { StandardFieldConfig, CustomDealField } from "../../constants/deal-settings.constants";

export interface DealFieldsSectionProps {
  standardFields: StandardFieldConfig[];
  customFields: CustomDealField[];
  requireExpectedCloseDate: boolean;
  setRequireExpectedCloseDate: (v: boolean) => void;
  requireDealSource: boolean;
  setRequireDealSource: (v: boolean) => void;
  enableCompetitorTracking: boolean;
  setEnableCompetitorTracking: (v: boolean) => void;
  enableLostReasonAnalysis: boolean;
  setEnableLostReasonAnalysis: (v: boolean) => void;
  showAddCustomField: boolean;
  setShowAddCustomField: (v: boolean) => void;
  newFieldName: string;
  setNewFieldName: (v: string) => void;
  newFieldType: CustomDealField["type"];
  setNewFieldType: (v: CustomDealField["type"]) => void;
  newFieldRequired: boolean;
  setNewFieldRequired: (v: boolean) => void;
  onToggleStandardFieldVisibility: (id: string) => void;
  onToggleStandardFieldRequired: (id: string) => void;
  onAddCustomField: (e: React.FormEvent) => void;
  onDeleteCustomField: (id: string) => void;
  onSyncRequireExpectedCloseDate: (v: boolean) => void;
  onSyncRequireDealSource: (v: boolean) => void;
  onSyncEnableLostReasonAnalysis: (v: boolean) => void;
  triggerAutoSave: () => void;
}

export function DealFieldsSection({
  standardFields,
  customFields,
  requireExpectedCloseDate,
  setRequireExpectedCloseDate,
  requireDealSource,
  setRequireDealSource,
  enableCompetitorTracking,
  setEnableCompetitorTracking,
  enableLostReasonAnalysis,
  setEnableLostReasonAnalysis,
  showAddCustomField,
  setShowAddCustomField,
  newFieldName,
  setNewFieldName,
  newFieldType,
  setNewFieldType,
  newFieldRequired,
  setNewFieldRequired,
  onToggleStandardFieldVisibility,
  onToggleStandardFieldRequired,
  onAddCustomField,
  onDeleteCustomField,
  onSyncRequireExpectedCloseDate,
  onSyncRequireDealSource,
  onSyncEnableLostReasonAnalysis,
  triggerAutoSave,
}: DealFieldsSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection title="Required Field Rules & Validation" description="Enforce completeness on deal creation and stage movement." icon={SlidersHorizontal}>
        <div className="divide-y divide-border/40">
          <SettingsToggleRow label="Require Target Close Date" description="Mandate expected deal closing date on opportunity creation." checked={requireExpectedCloseDate} onCheckedChange={(c) => { setRequireExpectedCloseDate(c); onSyncRequireExpectedCloseDate(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Require Deal Source Attribution" description="Mandate marketing/inbound attribution channel selection for every new deal." checked={requireDealSource} onCheckedChange={(c) => { setRequireDealSource(c); onSyncRequireDealSource(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Mandatory Reason for Lost Deals" description="Require sales agents to specify a loss reason category before moving deal to Closed Lost." checked={enableLostReasonAnalysis} onCheckedChange={(c) => { setEnableLostReasonAnalysis(c); onSyncEnableLostReasonAnalysis(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Competitor Tracking Field" description="Allow sales reps to specify key rival vendors competing for the deal." checked={enableCompetitorTracking} onCheckedChange={(c) => { setEnableCompetitorTracking(c); triggerAutoSave(); }} />
        </div>
      </SettingsSection>

      <SettingsSection title="Standard Deal Fields" description="Configure field visibility and requirement attributes across deal forms and views." icon={Briefcase}>
        <div className="space-y-2">
          <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border border-border/60 rounded-lg items-center">
            <span className="col-span-5">Field Name</span>
            <span className="col-span-3 text-center">Data Type</span>
            <span className="col-span-2 text-center">Required</span>
            <span className="col-span-2 text-center">Visible</span>
          </div>
          <div className="space-y-1">
            {standardFields.map((field) => (
              <div key={field.id} className="grid grid-cols-12 items-center px-3 py-2 border border-border/60 rounded-lg bg-card text-xs hover:border-border transition-colors">
                <div className="col-span-5 min-w-0 pr-2">
                  <span className="font-semibold text-foreground truncate block">{field.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate block">{field.description}</span>
                </div>
                <div className="col-span-3 text-center">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">{field.type}</Badge>
                </div>
                <div className="col-span-2 flex justify-center">
                  {field.isSystemRequired ? (
                    <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground">System</Badge>
                  ) : (
                    <Switch checked={field.required} onCheckedChange={() => onToggleStandardFieldRequired(field.id)} className="data-[state=checked]:bg-emerald-600 scale-75 cursor-pointer" />
                  )}
                </div>
                <div className="col-span-2 flex justify-center">
                  {field.isSystemRequired ? (
                    <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground">Always</Badge>
                  ) : (
                    <Switch checked={field.visible} onCheckedChange={() => onToggleStandardFieldVisibility(field.id)} className="data-[state=checked]:bg-emerald-600 scale-75 cursor-pointer" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Custom Deal Fields"
        description="Extend deal records with organization-specific attributes and custom properties."
        icon={Tag}
        headerAction={
          <Button variant="outline" size="sm" onClick={() => setShowAddCustomField(!showAddCustomField)} className="h-7 text-xs font-semibold gap-1.5 border-border/70">
            <Plus className="w-3.5 h-3.5" /> Add Custom Field
          </Button>
        }
      >
        {showAddCustomField && (
          <form onSubmit={onAddCustomField} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3 mb-3 animate-in fade-in duration-150">
            <div className="text-xs font-bold text-foreground">New Custom Field Definition</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Field Label</label>
                <Input placeholder="Enter field name..." value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="text-xs h-8" required />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Type</label>
                <Select value={newFieldType} onValueChange={(val) => setNewFieldType(val as CustomDealField["type"])}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                  <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} className="data-[state=checked]:bg-emerald-600 scale-75 cursor-pointer" />
                  <span>Required</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCustomField(false)} className="h-7 text-xs">Cancel</Button>
              <Button type="submit" size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Save Field</Button>
            </div>
          </form>
        )}

        {customFields.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg">
            No custom deal fields defined yet. Click &quot;Add Custom Field&quot; to create one.
          </div>
        ) : (
          <div className="space-y-1.5">
            {customFields.map((cf) => (
              <div key={cf.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/60 bg-card text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{cf.name}</span>
                  <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{cf.key}</code>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">{cf.type}</Badge>
                  {cf.required && <Badge variant="outline" className="text-[9px] border-amber-500/30 bg-amber-500/10 text-amber-600">Required</Badge>}
                  <Button variant="ghost" size="icon-xs" onClick={() => onDeleteCustomField(cf.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
