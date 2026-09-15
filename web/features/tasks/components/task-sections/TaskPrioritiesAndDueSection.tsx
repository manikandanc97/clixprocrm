"use client";

import React from "react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { AlertTriangle, Clock, Info } from "lucide-react";
import type { PriorityDef, TaskTypeDef } from "../../constants/task-settings.constants";
import { AdminPermissionBanner } from "./AdminPermissionBanner";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export interface TaskPrioritiesAndDueSectionProps {
  isAdmin: boolean;
  priorities: PriorityDef[];
  taskTypes: TaskTypeDef[];
  defaultDueOffsetDays: string;
  setDefaultDueOffsetDays: (v: string) => void;
  defaultWorkingDaysOnly: boolean;
  setDefaultWorkingDaysOnly: (v: boolean) => void;
  onUpdatePrioritySla: (id: string, hours: number) => void;
  onTogglePriorityActive: (id: string) => void;
  onUpdateTypeDueDays: (id: string, days: number) => void;
  triggerAutoSave: () => void;
}

export function TaskPrioritiesSection({
  isAdmin,
  priorities,
  onUpdatePrioritySla,
  onTogglePriorityActive,
}: {
  isAdmin: boolean;
  priorities: PriorityDef[];
  onUpdatePrioritySla: (id: string, hours: number) => void;
  onTogglePriorityActive: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <AdminPermissionBanner isAdmin={isAdmin} />

      <SettingsSection
        title="Priority Levels & Turnaround SLA"
        description="Define expected completion turnaround times in hours for task priority tiers."
        icon={AlertTriangle}
      >
        <div className="space-y-2.5">
          {priorities.map((p) => (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/70 bg-card gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-3 h-3 rounded-full ${p.color} shrink-0 ring-2 ring-background`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{p.label}</span>
                    <Badge variant="secondary" className="text-[9.5px] uppercase font-mono px-1.5 py-0">
                      {p.key}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {p.key === "URGENT" && "Mission-critical touchpoints requiring expedited resolution."}
                    {p.key === "HIGH" && "High importance action items impacting sales or support commitments."}
                    {p.key === "MEDIUM" && "Standard expected turnaround for daily operational tasks."}
                    {p.key === "LOW" && "Non-blocking backlog tasks or long-range touchpoints."}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-border/50">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    max="720"
                    disabled={!isAdmin || !p.active}
                    value={p.slaHours}
                    onChange={(e) => onUpdatePrioritySla(p.id, parseInt(e.target.value, 10) || 1)}
                    className="w-16 h-7 text-xs text-center font-semibold disabled:opacity-50"
                  />
                  <span className="text-muted-foreground text-[11px] font-medium">hours</span>
                </div>
                <Switch
                  checked={p.active}
                  disabled={!isAdmin || p.key === "MEDIUM"}
                  onCheckedChange={() => onTogglePriorityActive(p.id)}
                  className="data-[state=checked]:bg-emerald-600 scale-90"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 p-3 rounded-xl border border-border/50 bg-muted/20 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            SLA hours determine automatic timeline calculations, overdue flags, and escalation triggers across task views and team queues.
          </span>
        </div>
      </SettingsSection>
    </div>
  );
}

export function TaskDueDatesSection({
  isAdmin,
  taskTypes,
  defaultDueOffsetDays,
  setDefaultDueOffsetDays,
  defaultWorkingDaysOnly,
  setDefaultWorkingDaysOnly,
  onUpdateTypeDueDays,
  triggerAutoSave,
}: Omit<TaskPrioritiesAndDueSectionProps, "priorities" | "onUpdatePrioritySla" | "onTogglePriorityActive">) {
  return (
    <div className="space-y-5">
      <AdminPermissionBanner isAdmin={isAdmin} />

      <SettingsSection
        title="Schedule & Due Date Automation"
        description="Configure workspace baseline deadlines and task-type specific turnaround schedules."
        icon={AlertTriangle}
      >
        <div className="divide-y divide-border/40">
          <SettingsRow
            label="Workspace Default Due Date Offset"
            description="Default scheduled deadline calculated when creating tasks from lead, contact, and deal quick actions."
          >
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="0"
                max="60"
                disabled={!isAdmin}
                value={defaultDueOffsetDays}
                onChange={(e) => {
                  setDefaultDueOffsetDays(e.target.value);
                  triggerAutoSave();
                }}
                className="w-18 h-8 text-xs text-center font-semibold disabled:opacity-50"
              />
              <span className="text-muted-foreground text-xs font-medium">days</span>
            </div>
          </SettingsRow>

          <SettingsToggleRow
            label="Count Working Days Only (Mon–Fri)"
            description="Automatically skip Saturday and Sunday when computing scheduled task deadlines."
            checked={defaultWorkingDaysOnly}
            disabled={!isAdmin}
            onCheckedChange={(c) => {
              setDefaultWorkingDaysOnly(c);
              triggerAutoSave();
            }}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Task-Type Specific Due Date Overrides"
        description="Fine-tune expected default days per task classification to optimize pipeline velocity."
        icon={SlidersHorizontal}
      >
        <div className="space-y-2">
          {taskTypes
            .filter((t) => t.active)
            .map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card text-xs"
              >
                <span className="font-semibold text-foreground">{type.name}</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    disabled={!isAdmin}
                    value={type.defaultDueDays ?? 1}
                    onChange={(e) => onUpdateTypeDueDays(type.id, parseInt(e.target.value, 10) || 0)}
                    className="w-16 h-7 text-xs text-center font-semibold disabled:opacity-50"
                  />
                  <span className="text-muted-foreground text-xs">
                    {(type.defaultDueDays ?? 1) === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </SettingsSection>
    </div>
  );
}
