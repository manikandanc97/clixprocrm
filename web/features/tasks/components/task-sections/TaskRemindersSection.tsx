"use client";

import React from "react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Bell, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { AdminPermissionBanner } from "./AdminPermissionBanner";

export interface TaskRemindersSectionProps {
  isAdmin: boolean;
  enableDueSoonReminder: boolean;
  setEnableDueSoonReminder: (v: boolean) => void;
  dueSoonOffsetMinutes: string;
  setDueSoonOffsetMinutes: (v: string) => void;
  enableOverdueReminder: boolean;
  setEnableOverdueReminder: (v: boolean) => void;
  enableRepeatOverdueReminder: boolean;
  setEnableRepeatOverdueReminder: (v: boolean) => void;
  repeatOverdueIntervalDays: string;
  setRepeatOverdueIntervalDays: (v: string) => void;
  enableInAppReminders: boolean;
  setEnableInAppReminders: (v: boolean) => void;
  enableEmailReminders: boolean;
  setEnableEmailReminders: (v: boolean) => void;
  enableManagerEscalation: boolean;
  setEnableManagerEscalation: (v: boolean) => void;
  escalationTriggerDelayHours: string;
  setEscalationTriggerDelayHours: (v: string) => void;
  triggerAutoSave: () => void;
}

export function TaskRemindersSection({
  isAdmin,
  enableDueSoonReminder,
  setEnableDueSoonReminder,
  dueSoonOffsetMinutes,
  setDueSoonOffsetMinutes,
  enableOverdueReminder,
  setEnableOverdueReminder,
  enableRepeatOverdueReminder,
  setEnableRepeatOverdueReminder,
  repeatOverdueIntervalDays,
  setRepeatOverdueIntervalDays,
  enableInAppReminders,
  setEnableInAppReminders,
  enableEmailReminders,
  setEnableEmailReminders,
  enableManagerEscalation,
  setEnableManagerEscalation,
  escalationTriggerDelayHours,
  setEscalationTriggerDelayHours,
  triggerAutoSave,
}: TaskRemindersSectionProps) {
  return (
    <div className="space-y-5">
      <AdminPermissionBanner isAdmin={isAdmin} />

      <SettingsSection
        title="Notification Triggers & Alerts"
        description="Manage proactive reminder prompts ahead of deadlines and repeat alerts for overdue items."
        icon={Bell}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Due Soon Reminders"
            description="Notify the task assignee ahead of time before deadline expiration."
            checked={enableDueSoonReminder}
            disabled={!isAdmin}
            onCheckedChange={(c) => { setEnableDueSoonReminder(c); triggerAutoSave(); }}
          />
          {enableDueSoonReminder && (
            <SettingsRow label="Advance Notice Window" description="Timing offset to trigger the upcoming task alert.">
              <Select value={dueSoonOffsetMinutes} disabled={!isAdmin} onValueChange={(val) => { setDueSoonOffsetMinutes(val); triggerAutoSave(); }}>
                <SelectTrigger className="w-38 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          )}
          <SettingsToggleRow
            label="Overdue Task Alert"
            description="Immediately dispatch a notification when a task passes its due date without completion."
            checked={enableOverdueReminder}
            disabled={!isAdmin}
            onCheckedChange={(c) => { setEnableOverdueReminder(c); triggerAutoSave(); }}
          />
          <SettingsToggleRow
            label="Recurring Overdue Reminders"
            description="Repeat notification prompts on overdue tasks until they are resolved."
            checked={enableRepeatOverdueReminder}
            disabled={!isAdmin}
            onCheckedChange={(c) => { setEnableRepeatOverdueReminder(c); triggerAutoSave(); }}
          />
          {enableRepeatOverdueReminder && (
            <SettingsRow label="Recurrence Frequency" description="How frequently to remind assignees on unresolved overdue tasks.">
              <Select value={repeatOverdueIntervalDays} disabled={!isAdmin} onValueChange={(val) => { setRepeatOverdueIntervalDays(val); triggerAutoSave(); }}>
                <SelectTrigger className="w-38 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every day (Daily)</SelectItem>
                  <SelectItem value="2">Every 2 days</SelectItem>
                  <SelectItem value="3">Every 3 days</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notification Delivery Channels"
        description="Configure where reminders and task updates are broadcast across workspace accounts."
        icon={SlidersHorizontal}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="In-App Notification Center"
            description="Display bell notifications and banner toasts in the CRM navbar."
            checked={enableInAppReminders}
            disabled={!isAdmin}
            onCheckedChange={(c) => { setEnableInAppReminders(c); triggerAutoSave(); }}
          />
          <SettingsToggleRow
            label="Email Notifications"
            description="Deliver formatted task digest notifications directly to the assignee's corporate inbox."
            checked={enableEmailReminders}
            disabled={!isAdmin}
            onCheckedChange={(c) => { setEnableEmailReminders(c); triggerAutoSave(); }}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Manager Escalation Policy"
        description="Automatically escalate critical overdue tasks to workspace managers and team leads."
        icon={ShieldCheck}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Escalate Overdue Tasks to Managers"
            description="Send escalation alerts to the team lead or creator if an urgent or high priority task breaches SLA."
            checked={enableManagerEscalation}
            disabled={!isAdmin}
            onCheckedChange={(c) => { setEnableManagerEscalation(c); triggerAutoSave(); }}
          />
          {enableManagerEscalation && (
            <SettingsRow label="Escalation Grace Period" description="Trigger manager notice after task remains overdue for this duration.">
              <Select value={escalationTriggerDelayHours} disabled={!isAdmin} onValueChange={(val) => { setEscalationTriggerDelayHours(val); triggerAutoSave(); }}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Immediately on breach</SelectItem>
                  <SelectItem value="12">12 hours overdue</SelectItem>
                  <SelectItem value="24">24 hours overdue (1 day)</SelectItem>
                  <SelectItem value="48">48 hours overdue (2 days)</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
