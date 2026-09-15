"use client";

import React from "react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Clock, AlertCircle, CalendarClock, Mail, ShieldAlert } from "lucide-react";

export interface DealAgingSectionProps {
  dealRotDays: string;
  setDealRotDays: (v: string) => void;
  stageAgingAlertEnabled: boolean;
  setStageAgingAlertEnabled: (v: boolean) => void;
  closeDateRiskAlertEnabled: boolean;
  setCloseDateRiskAlertEnabled: (v: boolean) => void;
  closeDateRiskDays: string;
  setCloseDateRiskDays: (v: string) => void;
  staleDealNotificationEnabled: boolean;
  setStaleDealNotificationEnabled: (v: boolean) => void;
  overdueDealEscalationEnabled: boolean;
  setOverdueDealEscalationEnabled: (v: boolean) => void;
  triggerAutoSave: () => void;
}

export function DealAgingSection({
  dealRotDays,
  setDealRotDays,
  stageAgingAlertEnabled,
  setStageAgingAlertEnabled,
  closeDateRiskAlertEnabled,
  setCloseDateRiskAlertEnabled,
  closeDateRiskDays,
  setCloseDateRiskDays,
  staleDealNotificationEnabled,
  setStaleDealNotificationEnabled,
  overdueDealEscalationEnabled,
  setOverdueDealEscalationEnabled,
  triggerAutoSave,
}: DealAgingSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Deal Aging Rules & Stagnation Alerts"
        description="Configure inactivity thresholds, rotting notifications, stage duration alerts, and manager escalation triggers."
        icon={Clock}
      >
        <div className="divide-y divide-border/40">
          <SettingsRow
            label="Deal Rot / Inactivity Alert Threshold"
            description="Highlight deals in pipeline views that remain without touchpoints or stage progression longer than this threshold."
            icon={Clock}
          >
            <div className="flex items-center gap-1.5">
              <Input type="number" min="1" max="90" value={dealRotDays} onChange={(e) => { setDealRotDays(e.target.value); triggerAutoSave(); }} className="w-20 h-8 text-xs text-center" />
              <span className="text-muted-foreground text-xs font-medium">days</span>
            </div>
          </SettingsRow>

          <SettingsToggleRow
            label="Stage Aging SLA Alerts"
            description="Flag opportunities that exceed the target SLA duration configured for their current pipeline stage."
            icon={AlertCircle}
            checked={stageAgingAlertEnabled}
            onCheckedChange={(c) => { setStageAgingAlertEnabled(c); triggerAutoSave(); }}
          />

          <SettingsRow
            label="Close Date Risk Alert"
            description="Highlight deals nearing their target close date without confirmed quotation or contract agreement."
            icon={CalendarClock}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Input
                  type="number" min="1" max="30"
                  disabled={!closeDateRiskAlertEnabled}
                  value={closeDateRiskDays}
                  onChange={(e) => { setCloseDateRiskDays(e.target.value); triggerAutoSave(); }}
                  className="w-18 h-8 text-xs text-center disabled:opacity-50"
                />
                <span className="text-muted-foreground text-xs font-medium">days prior</span>
              </div>
              <Switch
                checked={closeDateRiskAlertEnabled}
                onCheckedChange={(c) => { setCloseDateRiskAlertEnabled(c); triggerAutoSave(); }}
                className="data-[state=checked]:bg-emerald-600 cursor-pointer"
              />
            </div>
          </SettingsRow>

          <SettingsToggleRow
            label="Stale Deal Notification Digest"
            description="Send automated in-app and email notification digests to deal owners for stale opportunities."
            icon={Mail}
            checked={staleDealNotificationEnabled}
            onCheckedChange={(c) => { setStaleDealNotificationEnabled(c); triggerAutoSave(); }}
          />

          <SettingsToggleRow
            label="Overdue Deal Escalation"
            description="Escalate neglected deals past their target closing date directly to the sales manager or team lead."
            icon={ShieldAlert}
            checked={overdueDealEscalationEnabled}
            onCheckedChange={(c) => { setOverdueDealEscalationEnabled(c); triggerAutoSave(); }}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
