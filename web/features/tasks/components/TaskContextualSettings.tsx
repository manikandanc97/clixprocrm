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
  CheckSquare,
  ListTodo,
  AlertTriangle,
  Calendar,
  Bell,
  UserCheck,
  Plus,
  Trash2,
} from "lucide-react";

export interface TaskContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

const DEFAULT_TYPES = [
  "Client Follow-up Call",
  "Product Demonstration",
  "Quotation Review",
  "Discovery Meeting",
  "Contract Signing",
  "Email Outreach",
  "Customer Support Request",
];

const DEFAULT_STATUSES = [
  { id: "1", name: "Pending", key: "PENDING", color: "bg-amber-500" },
  { id: "2", name: "In Progress", key: "IN_PROGRESS", color: "bg-blue-500" },
  { id: "3", name: "Blocked", key: "BLOCKED", color: "bg-rose-500" },
  { id: "4", name: "Completed", key: "COMPLETED", color: "bg-emerald-500" },
  { id: "5", name: "Cancelled", key: "CANCELLED", color: "bg-muted-foreground" },
];

export function TaskContextualSettings({
  open,
  onOpenChange,
  defaultSection = "types",
}: TaskContextualSettingsProps) {
  // Types list
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES);
  const [newType, setNewType] = useState("");

  // Statuses list
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [newStatusName, setNewStatusName] = useState("");

  // Priorities & SLA
  const [urgentSlaHours, setUrgentSlaHours] = useState("4");
  const [highSlaHours, setHighSlaHours] = useState("24");
  const [mediumSlaHours, setMediumSlaHours] = useState("72");

  // Default Due Dates
  const [defaultDueOffsetDays, setDefaultDueOffsetDays] = useState("3");
  const [defaultWorkingDaysOnly, setDefaultWorkingDaysOnly] = useState(true);

  // Reminders
  const [enableEmailReminders, setEnableEmailReminders] = useState(true);
  const [enableInAppReminders, setEnableInAppReminders] = useState(true);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState("15");

  // Assignment
  const [autoAssignToCreator, setAutoAssignToCreator] = useState(true);
  const [notifyAssigneeOnTaskCreate, setNotifyAssigneeOnTaskCreate] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim() || types.includes(newType.trim())) return;
    setTypes([...types, newType.trim()]);
    setNewType("");
    setHasChanges(true);
    toast.success(`Task type "${newType.trim()}" added`);
  };

  const handleRemoveType = (t: string) => {
    if (types.length <= 1) return;
    setTypes(types.filter((item) => item !== t));
    setHasChanges(true);
  };

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    const newStatus = {
      id: Date.now().toString(),
      name: newStatusName.trim(),
      key: newStatusName.trim().toUpperCase().replace(/\s+/g, "_"),
      color: "bg-primary",
    };
    setStatuses([...statuses, newStatus]);
    setNewStatusName("");
    setHasChanges(true);
    toast.success(`Status "${newStatus.name}" added`);
  };

  const handleRemoveStatus = (id: string) => {
    if (statuses.length <= 2) return;
    setStatuses(statuses.filter((s) => s.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Task configuration saved successfully");
    onOpenChange(false);
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "types",
      label: "Task Types",
      icon: ListTodo,
      badge: `${types.length} Types`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Activity & Task Classifications"
            description="Manage predefined task categories for scheduled touchpoints and action items."
            icon={ListTodo}
          >
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border/70 bg-card">
              {types.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-xs py-1 px-2.5 gap-1.5 bg-muted hover:bg-muted/80 text-foreground"
                >
                  <span>{type}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveType(type)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <form onSubmit={handleAddType} className="mt-3 flex items-center gap-2">
              <Input
                placeholder="New task type (e.g. Onsite Assessment)..."
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold h-9 shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Type
              </Button>
            </form>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "statuses",
      label: "Task Statuses",
      icon: CheckSquare,
      badge: `${statuses.length} Statuses`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Execution Statuses"
            description="Configure the workflow states tasks progress through from pending to complete."
            icon={CheckSquare}
          >
            <div className="space-y-2">
              {statuses.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:border-border transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${st.color} shrink-0`} />
                    <span className="font-semibold text-foreground">{st.name}</span>
                    <span className="text-[10.5px] text-muted-foreground font-mono">({st.key})</span>
                  </div>
                  {statuses.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStatus(st.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddStatus} className="mt-3 flex items-center gap-2">
              <Input
                placeholder="New status name..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold h-9 shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Status
              </Button>
            </form>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "priorities",
      label: "Priorities & SLA",
      icon: AlertTriangle,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Priority Levels & Completion SLA Hours"
            description="Define expected turnaround time for urgent, high, and medium priority tasks."
            icon={AlertTriangle}
          >
            <div className="space-y-3">
              <SettingsRow
                label="Urgent Priority SLA"
                description="Target completion turnaround for mission-critical tasks."
                badge="URGENT"
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="48"
                    value={urgentSlaHours}
                    onChange={(e) => {
                      setUrgentSlaHours(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">hours</span>
                </div>
              </SettingsRow>
              <SettingsRow
                label="High Priority SLA"
                description="Target completion turnaround for high importance tasks."
                badge="HIGH"
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={highSlaHours}
                    onChange={(e) => {
                      setHighSlaHours(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">hours</span>
                </div>
              </SettingsRow>
              <SettingsRow
                label="Medium Priority SLA"
                description="Standard expected turnaround for everyday tasks."
                badge="MEDIUM"
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="360"
                    value={mediumSlaHours}
                    onChange={(e) => {
                      setMediumSlaHours(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">hours</span>
                </div>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "due-dates",
      label: "Default Due Dates",
      icon: Calendar,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Schedule & Due Date Automation"
            description="Set default target dates when creating tasks from lead and deal quick actions."
            icon={Calendar}
          >
            <div className="divide-y divide-border/40">
              <SettingsRow
                label="Default Due Date Offset"
                description="Pre-fill due date by adding this many days from current date."
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={defaultDueOffsetDays}
                    onChange={(e) => {
                      setDefaultDueOffsetDays(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">days</span>
                </div>
              </SettingsRow>
              <SettingsToggleRow
                label="Count Working Days Only (Mon-Fri)"
                description="Skip weekends when calculating automated task due dates."
                checked={defaultWorkingDaysOnly}
                onCheckedChange={(c) => {
                  setDefaultWorkingDaysOnly(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "reminders",
      label: "Reminders & Alerts",
      icon: Bell,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Notification Triggers & Reminders"
            description="Manage alerts before tasks become due or when tasks become overdue."
            icon={Bell}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="In-App Notification Alerts"
                description="Display notification banner when task due time approaches."
                checked={enableInAppReminders}
                onCheckedChange={(c) => {
                  setEnableInAppReminders(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Email Notification Reminders"
                description="Send an email reminder to assignee before deadline."
                checked={enableEmailReminders}
                onCheckedChange={(c) => {
                  setEnableEmailReminders(c);
                  setHasChanges(true);
                }}
              />
              <SettingsRow
                label="Reminder Timing"
                description="Send reminder ahead of due time."
              >
                <Select
                  value={reminderOffsetMinutes}
                  onValueChange={(val) => {
                    setReminderOffsetMinutes(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
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
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "assignment",
      label: "Task Assignment",
      icon: UserCheck,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Ownership & Delegation Rules"
            description="Define default assignees and notification workflows for task management."
            icon={UserCheck}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Assign to Record Creator by Default"
                description="Set the logged in user as initial task owner if unassigned."
                checked={autoAssignToCreator}
                onCheckedChange={(c) => {
                  setAutoAssignToCreator(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Notify Assignee on Task Assignment"
                description="Send email notification immediately when a task is delegated."
                checked={notifyAssigneeOnTaskCreate}
                onCheckedChange={(c) => {
                  setNotifyAssigneeOnTaskCreate(c);
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
      title="Task Settings"
      subtitle="Configure task classifications, completion SLAs, default due dates, reminders, and assignment rules."
      icon={CheckSquare}
      badge="Tasks Module"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
