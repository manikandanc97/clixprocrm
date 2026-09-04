"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { toast } from "sonner";
import {
  CheckSquare,
  ListTodo,
  AlertTriangle,
  Calendar,
  Bell,
  UserCheck,
  FileCheck,
  Plus,
  Trash2,
  Edit2,
  Lock,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Clock,
  ShieldCheck,
  Info,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useTasks } from "@/shared/hooks/use-crm";
import { TaskType } from "@/shared/types/task";

// ─── Data Definitions & Types ───

export interface TaskTypeDef {
  id: string;
  name: string;
  active: boolean;
  isSystem?: boolean;
  defaultDueDays?: number;
}

export interface TaskStatusDef {
  id: string;
  name: string;
  key: string;
  color: string;
  isSystem?: boolean;
  isTerminal?: boolean;
  active: boolean;
}

export interface PriorityDef {
  id: string;
  key: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  label: string;
  slaHours: number;
  color: string;
  active: boolean;
}

export interface TaskContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

// ─── Preset Defaults ───

const DEFAULT_TYPES: TaskTypeDef[] = [
  { id: "type_1", name: "Client Follow-up Call", active: true, isSystem: true, defaultDueDays: 1 },
  { id: "type_2", name: "Product Demonstration", active: true, isSystem: true, defaultDueDays: 2 },
  { id: "type_3", name: "Quotation Review", active: true, isSystem: true, defaultDueDays: 2 },
  { id: "type_4", name: "Discovery Meeting", active: true, isSystem: true, defaultDueDays: 3 },
  { id: "type_5", name: "Contract Signing", active: true, isSystem: true, defaultDueDays: 5 },
  { id: "type_6", name: "Email Outreach", active: true, isSystem: false, defaultDueDays: 1 },
  { id: "type_7", name: "Customer Support Request", active: true, isSystem: false, defaultDueDays: 1 },
];

const DEFAULT_STATUSES: TaskStatusDef[] = [
  { id: "st_1", name: "Pending", key: "PENDING", color: "bg-amber-500", isSystem: true, isTerminal: false, active: true },
  { id: "st_2", name: "In Progress", key: "IN_PROGRESS", color: "bg-blue-500", isSystem: true, isTerminal: false, active: true },
  { id: "st_3", name: "Blocked", key: "BLOCKED", color: "bg-rose-500", isSystem: true, isTerminal: false, active: true },
  { id: "st_4", name: "Completed", key: "COMPLETED", color: "bg-emerald-500", isSystem: true, isTerminal: true, active: true },
  { id: "st_5", name: "Cancelled", key: "CANCELLED", color: "bg-slate-500", isSystem: true, isTerminal: true, active: true },
  { id: "st_6", name: "Overdue", key: "OVERDUE", color: "bg-red-600", isSystem: true, isTerminal: false, active: true },
];

const DEFAULT_PRIORITIES: PriorityDef[] = [
  { id: "p_urgent", key: "URGENT", label: "Urgent", slaHours: 4, color: "bg-rose-600", active: true },
  { id: "p_high", key: "HIGH", label: "High", slaHours: 24, color: "bg-amber-500", active: true },
  { id: "p_medium", key: "MEDIUM", label: "Medium", slaHours: 72, color: "bg-blue-500", active: true },
  { id: "p_low", key: "LOW", label: "Low", slaHours: 168, color: "bg-slate-400", active: true },
];

const COLOR_PRESETS = [
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Rose", value: "bg-rose-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Slate", value: "bg-slate-500" },
];

// ─── Main Component ───

export function TaskContextualSettings({
  open,
  onOpenChange,
  defaultSection = "types",
}: TaskContextualSettingsProps) {
  const { user } = useAuth();
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "ADMIN" ||
    user?.role === "super_admin" ||
    user?.role === "SUPER_ADMIN";

  const tenantId = user?.tenantId || (user as { activeTenantId?: string })?.activeTenantId || "default";
  const storageKey = `clixprocrm_task_settings_${tenantId}`;

  // Fetch tasks to calculate reference counts and ensure safe deletion
  const { data: tasksData } = useTasks();
  const activeTasks: TaskType[] = useMemo(() => {
    if (!tasksData) return [];
    if (Array.isArray((tasksData as any)?.tasks)) return (tasksData as any).tasks;
    if (Array.isArray(tasksData)) return tasksData as unknown as TaskType[];
    return [];
  }, [tasksData]);

  // 1. Task Types State
  const [taskTypes, setTaskTypes] = useState<TaskTypeDef[]>(DEFAULT_TYPES);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");
  const [typeToDelete, setTypeToDelete] = useState<TaskTypeDef | null>(null);

  // 2. Task Statuses State
  const [statuses, setStatuses] = useState<TaskStatusDef[]>(DEFAULT_STATUSES);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("bg-blue-500");
  const [newStatusIsTerminal, setNewStatusIsTerminal] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState("");
  const [editingStatusColor, setEditingStatusColor] = useState("");
  const [statusToDelete, setStatusToDelete] = useState<TaskStatusDef | null>(null);

  // 3. Priorities & SLA State
  const [priorities, setPriorities] = useState<PriorityDef[]>(DEFAULT_PRIORITIES);

  // 4. Default Due Dates State
  const [defaultDueOffsetDays, setDefaultDueOffsetDays] = useState("3");
  const [defaultWorkingDaysOnly, setDefaultWorkingDaysOnly] = useState(true);

  // 5. Reminders & Escalation State
  const [enableDueSoonReminder, setEnableDueSoonReminder] = useState(true);
  const [dueSoonOffsetMinutes, setDueSoonOffsetMinutes] = useState("30");
  const [enableOverdueReminder, setEnableOverdueReminder] = useState(true);
  const [enableRepeatOverdueReminder, setEnableRepeatOverdueReminder] = useState(true);
  const [repeatOverdueIntervalDays, setRepeatOverdueIntervalDays] = useState("1");
  const [enableInAppReminders, setEnableInAppReminders] = useState(true);
  const [enableEmailReminders, setEnableEmailReminders] = useState(true);
  const [enableManagerEscalation, setEnableManagerEscalation] = useState(true);
  const [escalationTriggerDelayHours, setEscalationTriggerDelayHours] = useState("24");

  // 6. Assignment & Ownership State
  const [defaultTaskOwner, setDefaultTaskOwner] = useState("creator");
  const [notifyAssigneeOnTaskCreate, setNotifyAssigneeOnTaskCreate] = useState(true);
  const [reassignmentPolicy, setReassignmentPolicy] = useState<"all" | "admin_only">("all");
  const [enableRoundRobin, setEnableRoundRobin] = useState(false);

  // 7. Task Fields & Completion Rules State
  const [reqFieldType, setReqFieldType] = useState(true);
  const [reqFieldPriority, setReqFieldPriority] = useState(true);
  const [reqFieldDueDate, setReqFieldDueDate] = useState(true);
  const [reqFieldAssignee, setReqFieldAssignee] = useState(true);
  const [reqFieldRelatedRecord, setReqFieldRelatedRecord] = useState(false);

  const [requireCompletionNote, setRequireCompletionNote] = useState(true);
  const [requireChecklistComplete, setRequireChecklistComplete] = useState(false);
  const [requireOutcomeCategorization, setRequireOutcomeCategorization] = useState(false);

  // Auto-Save & Persistence
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reference Count Helpers
  const getTypeUsageCount = useCallback(
    (typeName: string) => {
      return activeTasks.filter(
        (t) =>
          (t.tags && t.tags.includes(typeName)) ||
          t.category === typeName ||
          (t.title && t.title.toLowerCase().includes(typeName.toLowerCase()))
      ).length;
    },
    [activeTasks]
  );

  const getStatusUsageCount = useCallback(
    (statusKey: string) => {
      return activeTasks.filter((t) => t.status === statusKey).length;
    },
    [activeTasks]
  );

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.taskTypes && Array.isArray(parsed.taskTypes)) setTaskTypes(parsed.taskTypes);
        if (parsed.statuses && Array.isArray(parsed.statuses)) setStatuses(parsed.statuses);
        if (parsed.priorities && Array.isArray(parsed.priorities)) setPriorities(parsed.priorities);
        if (parsed.defaultDueOffsetDays !== undefined) setDefaultDueOffsetDays(String(parsed.defaultDueOffsetDays));
        if (parsed.defaultWorkingDaysOnly !== undefined) setDefaultWorkingDaysOnly(parsed.defaultWorkingDaysOnly);
        if (parsed.enableDueSoonReminder !== undefined) setEnableDueSoonReminder(parsed.enableDueSoonReminder);
        if (parsed.dueSoonOffsetMinutes !== undefined) setDueSoonOffsetMinutes(String(parsed.dueSoonOffsetMinutes));
        if (parsed.enableOverdueReminder !== undefined) setEnableOverdueReminder(parsed.enableOverdueReminder);
        if (parsed.enableRepeatOverdueReminder !== undefined) setEnableRepeatOverdueReminder(parsed.enableRepeatOverdueReminder);
        if (parsed.repeatOverdueIntervalDays !== undefined) setRepeatOverdueIntervalDays(String(parsed.repeatOverdueIntervalDays));
        if (parsed.enableInAppReminders !== undefined) setEnableInAppReminders(parsed.enableInAppReminders);
        if (parsed.enableEmailReminders !== undefined) setEnableEmailReminders(parsed.enableEmailReminders);
        if (parsed.enableManagerEscalation !== undefined) setEnableManagerEscalation(parsed.enableManagerEscalation);
        if (parsed.escalationTriggerDelayHours !== undefined) setEscalationTriggerDelayHours(String(parsed.escalationTriggerDelayHours));
        if (parsed.defaultTaskOwner !== undefined) setDefaultTaskOwner(parsed.defaultTaskOwner);
        if (parsed.notifyAssigneeOnTaskCreate !== undefined) setNotifyAssigneeOnTaskCreate(parsed.notifyAssigneeOnTaskCreate);
        if (parsed.reassignmentPolicy !== undefined) setReassignmentPolicy(parsed.reassignmentPolicy);
        if (parsed.enableRoundRobin !== undefined) setEnableRoundRobin(parsed.enableRoundRobin);
        if (parsed.reqFieldType !== undefined) setReqFieldType(parsed.reqFieldType);
        if (parsed.reqFieldPriority !== undefined) setReqFieldPriority(parsed.reqFieldPriority);
        if (parsed.reqFieldDueDate !== undefined) setReqFieldDueDate(parsed.reqFieldDueDate);
        if (parsed.reqFieldAssignee !== undefined) setReqFieldAssignee(parsed.reqFieldAssignee);
        if (parsed.reqFieldRelatedRecord !== undefined) setReqFieldRelatedRecord(parsed.reqFieldRelatedRecord);
        if (parsed.requireCompletionNote !== undefined) setRequireCompletionNote(parsed.requireCompletionNote);
        if (parsed.requireChecklistComplete !== undefined) setRequireChecklistComplete(parsed.requireChecklistComplete);
        if (parsed.requireOutcomeCategorization !== undefined) setRequireOutcomeCategorization(parsed.requireOutcomeCategorization);
      }
    } catch {
      // Retain defaults on parse failure
    } finally {
      isLoadedRef.current = true;
    }
  }, [storageKey]);

  // Auto-Save Trigger
  const triggerAutoSave = useCallback(() => {
    if (!isAdmin || !isLoadedRef.current || typeof window === "undefined") return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setAutoSaveStatus("saving");

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const payload = {
          taskTypes,
          statuses,
          priorities,
          defaultDueOffsetDays,
          defaultWorkingDaysOnly,
          enableDueSoonReminder,
          dueSoonOffsetMinutes,
          enableOverdueReminder,
          enableRepeatOverdueReminder,
          repeatOverdueIntervalDays,
          enableInAppReminders,
          enableEmailReminders,
          enableManagerEscalation,
          escalationTriggerDelayHours,
          defaultTaskOwner,
          notifyAssigneeOnTaskCreate,
          reassignmentPolicy,
          enableRoundRobin,
          reqFieldType,
          reqFieldPriority,
          reqFieldDueDate,
          reqFieldAssignee,
          reqFieldRelatedRecord,
          requireCompletionNote,
          requireChecklistComplete,
          requireOutcomeCategorization,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setAutoSaveStatus("saved");

        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 1600);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 300);
  }, [
    isAdmin,
    storageKey,
    taskTypes,
    statuses,
    priorities,
    defaultDueOffsetDays,
    defaultWorkingDaysOnly,
    enableDueSoonReminder,
    dueSoonOffsetMinutes,
    enableOverdueReminder,
    enableRepeatOverdueReminder,
    repeatOverdueIntervalDays,
    enableInAppReminders,
    enableEmailReminders,
    enableManagerEscalation,
    escalationTriggerDelayHours,
    defaultTaskOwner,
    notifyAssigneeOnTaskCreate,
    reassignmentPolicy,
    enableRoundRobin,
    reqFieldType,
    reqFieldPriority,
    reqFieldDueDate,
    reqFieldAssignee,
    reqFieldRelatedRecord,
    requireCompletionNote,
    requireChecklistComplete,
    requireOutcomeCategorization,
  ]);

  // ─── Handlers: Task Types ───

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Admin permission required to add task types");
      return;
    }
    const clean = newTypeName.trim();
    if (!clean) return;
    if (taskTypes.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Task type "${clean}" already exists`);
      return;
    }

    const newType: TaskTypeDef = {
      id: `type_custom_${Date.now()}`,
      name: clean,
      active: true,
      isSystem: false,
      defaultDueDays: 1,
    };

    setTaskTypes((prev) => [...prev, newType]);
    setNewTypeName("");
    triggerAutoSave();
    toast.success(`Task type "${clean}" added`);
  };

  const handleToggleTypeActive = (id: string) => {
    if (!isAdmin) return;
    setTaskTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
    triggerAutoSave();
  };

  const handleMoveType = (index: number, direction: "up" | "down") => {
    if (!isAdmin) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= taskTypes.length) return;
    const updated = [...taskTypes];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setTaskTypes(updated);
    triggerAutoSave();
  };

  const handleStartRenameType = (t: TaskTypeDef) => {
    if (!isAdmin) return;
    setEditingTypeId(t.id);
    setEditingTypeName(t.name);
  };

  const handleSaveRenameType = () => {
    if (!editingTypeId || !editingTypeName.trim() || !isAdmin) return;
    const clean = editingTypeName.trim();
    setTaskTypes((prev) =>
      prev.map((t) => (t.id === editingTypeId ? { ...t, name: clean } : t))
    );
    setEditingTypeId(null);
    setEditingTypeName("");
    triggerAutoSave();
    toast.success("Task type renamed");
  };

  const handleConfirmDeleteType = () => {
    if (!typeToDelete || !isAdmin) return;
    if (typeToDelete.isSystem) {
      toast.error("System-defined task types cannot be deleted");
      setTypeToDelete(null);
      return;
    }

    const usageCount = getTypeUsageCount(typeToDelete.name);
    if (usageCount > 0) {
      toast.error(
        `Cannot delete: "${typeToDelete.name}" is used by ${usageCount} task(s). Deactivate it instead.`
      );
      setTypeToDelete(null);
      return;
    }

    setTaskTypes((prev) => prev.filter((t) => t.id !== typeToDelete.id));
    toast.success(`Task type "${typeToDelete.name}" removed`);
    setTypeToDelete(null);
    triggerAutoSave();
  };

  const handleUpdateTypeDueDays = (id: string, days: number) => {
    if (!isAdmin) return;
    setTaskTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, defaultDueDays: Math.max(0, Math.min(90, days)) } : t))
    );
    triggerAutoSave();
  };

  // ─── Handlers: Task Statuses ───

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Admin permission required to add statuses");
      return;
    }
    const clean = newStatusName.trim();
    if (!clean) return;
    const generatedKey = clean.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

    if (statuses.some((s) => s.key === generatedKey || s.name.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Status "${clean}" or key "${generatedKey}" already exists`);
      return;
    }

    const newStatus: TaskStatusDef = {
      id: `st_custom_${Date.now()}`,
      name: clean,
      key: generatedKey,
      color: newStatusColor,
      isSystem: false,
      isTerminal: newStatusIsTerminal,
      active: true,
    };

    setStatuses((prev) => [...prev, newStatus]);
    setNewStatusName("");
    setNewStatusIsTerminal(false);
    triggerAutoSave();
    toast.success(`Status "${clean}" added`);
  };

  const handleMoveStatus = (index: number, direction: "up" | "down") => {
    if (!isAdmin) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= statuses.length) return;
    const updated = [...statuses];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setStatuses(updated);
    triggerAutoSave();
  };

  const handleToggleStatusActive = (id: string) => {
    if (!isAdmin) return;
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
    triggerAutoSave();
  };

  const handleStartRenameStatus = (st: TaskStatusDef) => {
    if (!isAdmin) return;
    setEditingStatusId(st.id);
    setEditingStatusName(st.name);
    setEditingStatusColor(st.color);
  };

  const handleSaveRenameStatus = () => {
    if (!editingStatusId || !editingStatusName.trim() || !isAdmin) return;
    const clean = editingStatusName.trim();
    setStatuses((prev) =>
      prev.map((s) =>
        s.id === editingStatusId
          ? { ...s, name: clean, color: editingStatusColor || s.color }
          : s
      )
    );
    setEditingStatusId(null);
    setEditingStatusName("");
    triggerAutoSave();
    toast.success("Status updated");
  };

  const handleConfirmDeleteStatus = () => {
    if (!statusToDelete || !isAdmin) return;
    if (statusToDelete.isSystem) {
      toast.error("System statuses are core to workflow execution and cannot be deleted");
      setStatusToDelete(null);
      return;
    }

    const usageCount = getStatusUsageCount(statusToDelete.key);
    if (usageCount > 0) {
      toast.error(
        `Cannot delete status "${statusToDelete.name}": actively referenced by ${usageCount} task(s). Deactivate instead.`
      );
      setStatusToDelete(null);
      return;
    }

    setStatuses((prev) => prev.filter((s) => s.id !== statusToDelete.id));
    toast.success(`Custom status "${statusToDelete.name}" deleted`);
    setStatusToDelete(null);
    triggerAutoSave();
  };

  // ─── Handlers: Priorities & SLA ───

  const handleUpdatePrioritySla = (id: string, hours: number) => {
    if (!isAdmin) return;
    const safeHours = Math.max(1, Math.min(720, hours));
    setPriorities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, slaHours: safeHours } : p))
    );
    triggerAutoSave();
  };

  const handleTogglePriorityActive = (id: string) => {
    if (!isAdmin) return;
    setPriorities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
    triggerAutoSave();
  };

  // ─── Read-Only Admin Callout Banner ───
  const renderAdminPermissionBanner = () => {
    if (isAdmin) return null;
    return (
      <div className="mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold">Workspace Administrator Restricted:</span> Settings are currently in read-only mode. Workspace Admin privileges are required to modify task governance rules.
        </div>
      </div>
    );
  };

  // ─── Configuration Sections ───

  const sections: ContextualSettingSection[] = [
    // 1. Task Types
    {
      id: "types",
      label: "Task Types",
      icon: ListTodo,
      badge: `${taskTypes.filter((t) => t.active).length} Active`,
      component: (
        <div className="space-y-5">
          {renderAdminPermissionBanner()}

          <SettingsSection
            title="Activity & Task Classifications"
            description="Manage predefined task categories for structured touchpoints, sales follow-ups, and action items."
            icon={ListTodo}
          >
            <div className="space-y-2">
              {taskTypes.map((type, idx) => {
                const isEditing = editingTypeId === type.id;
                const usage = getTypeUsageCount(type.name);

                return (
                  <div
                    key={type.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors text-xs ${
                      type.active
                        ? "border-border/70 bg-card hover:border-border"
                        : "border-border/40 bg-muted/30 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={!isAdmin || idx === 0}
                          onClick={() => handleMoveType(idx, "up")}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={!isAdmin || idx === taskTypes.length - 1}
                          onClick={() => handleMoveType(idx, "down")}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Type Name or Inline Edit */}
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                          <Input
                            value={editingTypeName}
                            onChange={(e) => setEditingTypeName(e.target.value)}
                            className="h-7 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRenameType();
                              if (e.key === "Escape") setEditingTypeId(null);
                            }}
                          />
                          <Button
                            size="icon-xs"
                            variant="default"
                            onClick={handleSaveRenameType}
                            className="h-7 w-7"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setEditingTypeId(null)}
                            className="h-7 w-7"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-foreground truncate">{type.name}</span>
                          {type.isSystem ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 shrink-0 font-medium"
                            >
                              Standard
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 shrink-0 font-medium"
                            >
                              Custom
                            </Badge>
                          )}
                          {usage > 0 && (
                            <span className="text-[10.5px] text-muted-foreground">
                              ({usage} {usage === 1 ? "task" : "tasks"})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions & Toggles */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && !isEditing && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleStartRenameType(type)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Rename Task Type"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}

                      <div className="flex items-center gap-1.5 pl-1 border-l border-border/50">
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">
                          {type.active ? "Active" : "Inactive"}
                        </span>
                        <Switch
                          checked={type.active}
                          disabled={!isAdmin}
                          onCheckedChange={() => handleToggleTypeActive(type.id)}
                          className="data-[state=checked]:bg-emerald-600 scale-90"
                        />
                      </div>

                      {isAdmin && !type.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setTypeToDelete(type)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Custom Task Type"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddType} className="mt-3 flex items-center gap-2">
                <Input
                  placeholder="New task type (e.g., Onsite Assessment, Tech Review)..."
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="text-xs h-9 flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={!newTypeName.trim()}
                  className="text-xs font-semibold h-9 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Type
                </Button>
              </form>
            )}
          </SettingsSection>
        </div>
      ),
    },

    // 2. Task Statuses
    {
      id: "statuses",
      label: "Task Statuses",
      icon: CheckSquare,
      badge: `${statuses.filter((s) => s.active).length} Statuses`,
      component: (
        <div className="space-y-5">
          {renderAdminPermissionBanner()}

          <SettingsSection
            title="Execution Statuses & Governance"
            description="Configure workflow lifecycle states tasks progress through from pending through terminal completion."
            icon={CheckSquare}
          >
            <div className="space-y-2">
              {statuses.map((st, idx) => {
                const isEditing = editingStatusId === st.id;
                const usage = getStatusUsageCount(st.key);

                return (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors text-xs ${
                      st.active
                        ? "border-border/70 bg-card hover:border-border"
                        : "border-border/40 bg-muted/30 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={!isAdmin || idx === 0}
                          onClick={() => handleMoveStatus(idx, "up")}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={!isAdmin || idx === statuses.length - 1}
                          onClick={() => handleMoveStatus(idx, "down")}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Status Color Dot */}
                      <div className={`w-3 h-3 rounded-full ${st.color} shrink-0 ring-2 ring-background`} />

                      {/* Status Name / Inline Edit */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <Input
                            value={editingStatusName}
                            onChange={(e) => setEditingStatusName(e.target.value)}
                            className="h-7 text-xs flex-1"
                            autoFocus
                          />
                          <Select
                            value={editingStatusColor}
                            onValueChange={setEditingStatusColor}
                          >
                            <SelectTrigger className="w-24 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLOR_PRESETS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className={`w-2.5 h-2.5 rounded-full ${c.value}`} />
                                    <span>{c.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon-xs"
                            variant="default"
                            onClick={handleSaveRenameStatus}
                            className="h-7 w-7"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setEditingStatusId(null)}
                            className="h-7 w-7"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-foreground truncate">{st.name}</span>
                          
                          {st.isTerminal && (
                            <Badge
                              variant="outline"
                              className="text-[9.5px] py-0 px-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0 font-medium"
                            >
                              Terminal
                            </Badge>
                          )}

                          {st.isSystem ? (
                            <Badge
                              variant="outline"
                              className="text-[9.5px] py-0 px-1.5 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 shrink-0 font-medium"
                            >
                              System Core
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9.5px] py-0 px-1.5 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 shrink-0 font-medium"
                            >
                              Custom
                            </Badge>
                          )}

                          <span className="text-[10px] text-muted-foreground/70 font-mono hidden md:inline">
                            [{st.key}]
                          </span>

                          {usage > 0 && (
                            <span className="text-[10.5px] text-muted-foreground">
                              ({usage} {usage === 1 ? "task" : "tasks"})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && !isEditing && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleStartRenameStatus(st)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit Status"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}

                      <div className="flex items-center gap-1.5 pl-1 border-l border-border/50">
                        <span className="text-[11px] text-muted-foreground hidden sm:inline">
                          {st.active ? "Active" : "Archived"}
                        </span>
                        <Switch
                          checked={st.active}
                          disabled={!isAdmin || (st.isSystem && st.key === "PENDING")}
                          onCheckedChange={() => handleToggleStatusActive(st.id)}
                          className="data-[state=checked]:bg-emerald-600 scale-90"
                        />
                      </div>

                      {isAdmin && !st.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setStatusToDelete(st)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Custom Status"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddStatus} className="mt-3.5 p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Add Custom Status
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <Input
                    placeholder="New status name (e.g. Waiting on Client)..."
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    className="text-xs h-9 flex-1"
                  />
                  <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                    <SelectTrigger className="w-32 h-9 text-xs">
                      <SelectValue placeholder="Color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`w-2.5 h-2.5 rounded-full ${c.value}`} />
                            <span>{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={!newStatusName.trim()}
                    className="text-xs font-semibold h-9 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Status
                  </Button>
                </div>
              </form>
            )}
          </SettingsSection>
        </div>
      ),
    },

    // 3. Priorities & SLA
    {
      id: "priorities",
      label: "Priorities & SLA",
      icon: AlertTriangle,
      badge: "SLA Targets",
      component: (
        <div className="space-y-5">
          {renderAdminPermissionBanner()}

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
                        <Badge
                          variant="secondary"
                          className="text-[9.5px] uppercase font-mono px-1.5 py-0"
                        >
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
                        onChange={(e) => handleUpdatePrioritySla(p.id, parseInt(e.target.value, 10) || 1)}
                        className="w-16 h-7 text-xs text-center font-semibold disabled:opacity-50"
                      />
                      <span className="text-muted-foreground text-[11px] font-medium">hours</span>
                    </div>

                    <Switch
                      checked={p.active}
                      disabled={!isAdmin || p.key === "MEDIUM"}
                      onCheckedChange={() => handleTogglePriorityActive(p.id)}
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
      ),
    },

    // 4. Default Due Dates
    {
      id: "due-dates",
      label: "Default Due Dates",
      icon: Calendar,
      component: (
        <div className="space-y-5">
          {renderAdminPermissionBanner()}

          <SettingsSection
            title="Schedule & Due Date Automation"
            description="Configure workspace baseline deadlines and task-type specific turnaround schedules."
            icon={Calendar}
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
                        onChange={(e) =>
                          handleUpdateTypeDueDays(type.id, parseInt(e.target.value, 10) || 0)
                        }
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
      ),
    },

    // 5. Reminders & Escalation
    {
      id: "reminders",
      label: "Reminders & Alerts",
      icon: Bell,
      badge: "Escalations",
      component: (
        <div className="space-y-5">
          {renderAdminPermissionBanner()}

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
                onCheckedChange={(c) => {
                  setEnableDueSoonReminder(c);
                  triggerAutoSave();
                }}
              />

              {enableDueSoonReminder && (
                <SettingsRow
                  label="Advance Notice Window"
                  description="Timing offset to trigger the upcoming task alert."
                >
                  <Select
                    value={dueSoonOffsetMinutes}
                    disabled={!isAdmin}
                    onValueChange={(val) => {
                      setDueSoonOffsetMinutes(val);
                      triggerAutoSave();
                    }}
                  >
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
                onCheckedChange={(c) => {
                  setEnableOverdueReminder(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Recurring Overdue Reminders"
                description="Repeat notification prompts on overdue tasks until they are resolved."
                checked={enableRepeatOverdueReminder}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setEnableRepeatOverdueReminder(c);
                  triggerAutoSave();
                }}
              />

              {enableRepeatOverdueReminder && (
                <SettingsRow
                  label="Recurrence Frequency"
                  description="How frequently to remind assignees on unresolved overdue tasks."
                >
                  <Select
                    value={repeatOverdueIntervalDays}
                    disabled={!isAdmin}
                    onValueChange={(val) => {
                      setRepeatOverdueIntervalDays(val);
                      triggerAutoSave();
                    }}
                  >
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
                onCheckedChange={(c) => {
                  setEnableInAppReminders(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Email Notifications"
                description="Deliver formatted task digest notifications directly to the assignee's corporate inbox."
                checked={enableEmailReminders}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setEnableEmailReminders(c);
                  triggerAutoSave();
                }}
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
                onCheckedChange={(c) => {
                  setEnableManagerEscalation(c);
                  triggerAutoSave();
                }}
              />

              {enableManagerEscalation && (
                <SettingsRow
                  label="Escalation Grace Period"
                  description="Trigger manager notice after task remains overdue for this duration."
                >
                  <Select
                    value={escalationTriggerDelayHours}
                    disabled={!isAdmin}
                    onValueChange={(val) => {
                      setEscalationTriggerDelayHours(val);
                      triggerAutoSave();
                    }}
                  >
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
      ),
    },

    // 6. Assignment & Ownership
    {
      id: "assignment",
      label: "Task Assignment",
      icon: UserCheck,
      badge: "Delegation",
      component: (
        <div className="space-y-5">
          {renderAdminPermissionBanner()}

          <SettingsSection
            title="Ownership & Delegation Governance"
            description="Define default ownership rules, delegation notifications, and reassignment policies."
            icon={UserCheck}
          >
            <div className="divide-y divide-border/40">
              <SettingsRow
                label="Default Task Owner"
                description="Select who is assigned by default when a task is created without explicit delegation."
              >
                <Select
                  value={defaultTaskOwner}
                  disabled={!isAdmin}
                  onValueChange={(val) => {
                    setDefaultTaskOwner(val);
                    triggerAutoSave();
                  }}
                >
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creator">Task Creator (Logged-in)</SelectItem>
                    <SelectItem value="record_owner">Associated Record Owner</SelectItem>
                    <SelectItem value="specific_user">Unassigned Pool</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>

              <SettingsToggleRow
                label="Notify Assignee on Task Delegation"
                description="Instantly send notification alerts to users whenever a task is assigned or reassigned to them."
                checked={notifyAssigneeOnTaskCreate}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setNotifyAssigneeOnTaskCreate(c);
                  triggerAutoSave();
                }}
              />

              <SettingsRow
                label="Task Reassignment Permissions"
                description="Control whether regular members can reassign tasks or if delegation requires manager privileges."
              >
                <Select
                  value={reassignmentPolicy}
                  disabled={!isAdmin}
                  onValueChange={(val: "all" | "admin_only") => {
                    setReassignmentPolicy(val);
                    triggerAutoSave();
                  }}
                >
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workspace Members</SelectItem>
                    <SelectItem value="admin_only">Admins & Managers Only</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>

              <SettingsToggleRow
                label="Round-Robin Auto Distribution"
                description="Automatically distribute newly unassigned inbound tasks evenly among active team members."
                checked={enableRoundRobin}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setEnableRoundRobin(c);
                  triggerAutoSave();
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 7. Task Fields & Completion Rules (NEW)
    {
      id: "field-rules",
      label: "Fields & Completion Rules",
      icon: FileCheck,
      badge: "Governance",
      component: (
        <div className="space-y-5">
          {renderAdminPermissionBanner()}

          <SettingsSection
            title="Required Fields on Task Creation"
            description="Enforce standard metadata completion when creating tasks to prevent incomplete records."
            icon={FileCheck}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Require Task Classification Type"
                description="Must specify an activity classification (e.g., Follow-up, Meeting) when creating a task."
                checked={reqFieldType}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setReqFieldType(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Require Priority Level"
                description="Enforce explicit priority assignment (Urgent, High, Medium, Low)."
                checked={reqFieldPriority}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setReqFieldPriority(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Require Due Date & Time"
                description="Tasks must have a targeted completion deadline set upon creation."
                checked={reqFieldDueDate}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setReqFieldDueDate(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Require Explicit Assignee"
                description="Prevent unassigned orphan tasks from entering the workspace queue."
                checked={reqFieldAssignee}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setReqFieldAssignee(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Require Associated CRM Record"
                description="Ensure every task is explicitly linked to a Lead, Customer, Contact, or Deal."
                checked={reqFieldRelatedRecord}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setReqFieldRelatedRecord(c);
                  triggerAutoSave();
                }}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Completion & Resolution Governance"
            description="Control conditions required before a task can transition into the Completed state."
            icon={CheckCircle2}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Require Completion Note"
                description="Prompt and require user to document an outcome note before marking task Completed."
                checked={requireCompletionNote}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setRequireCompletionNote(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Require All Checklist Subtasks Checked"
                description="Prevent completing a task if any items in its checklist remain unresolved."
                checked={requireChecklistComplete}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setRequireChecklistComplete(c);
                  triggerAutoSave();
                }}
              />

              <SettingsToggleRow
                label="Require Structured Outcome for Calls & Meetings"
                description="Enforce outcome classification (e.g. Connected, Left Voicemail, Rescheduled) on call tasks."
                checked={requireOutcomeCategorization}
                disabled={!isAdmin}
                onCheckedChange={(c) => {
                  setRequireOutcomeCategorization(c);
                  triggerAutoSave();
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
  ];

  return (
    <>
      <ContextualSettingsDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Task Settings"
        subtitle="Configure workspace task types, execution statuses, priority turnaround SLAs, reminders, and governance rules."
        icon={CheckSquare}
        sections={sections}
        defaultSection={defaultSection}
        autoSave={true}
        autoSaveStatus={autoSaveStatus}
      />

      {/* Confirm Delete Task Type Dialog */}
      <AlertDialog open={!!typeToDelete} onOpenChange={(o) => !o && setTypeToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              Delete Task Type
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete the custom task type{" "}
              <strong className="text-foreground">&quot;{typeToDelete?.name}&quot;</strong>?
              {typeToDelete && getTypeUsageCount(typeToDelete.name) > 0 ? (
                <span className="block mt-2 font-medium text-amber-600 dark:text-amber-400">
                  Warning: This task type is actively referenced by {getTypeUsageCount(typeToDelete.name)} task(s). Deleting it may cause data inconsistencies. Consider deactivating instead.
                </span>
              ) : (
                <span className="block mt-1">
                  This action is permanent and removes the option from creation dialogs.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteType}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold"
            >
              Delete Task Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Task Status Dialog */}
      <AlertDialog open={!!statusToDelete} onOpenChange={(o) => !o && setStatusToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              Delete Task Status
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete status{" "}
              <strong className="text-foreground">&quot;{statusToDelete?.name}&quot;</strong>?
              {statusToDelete && getStatusUsageCount(statusToDelete.key) > 0 ? (
                <span className="block mt-2 font-medium text-amber-600 dark:text-amber-400">
                  Warning: This status is actively assigned to {getStatusUsageCount(statusToDelete.key)} task(s). Deletion is blocked to prevent data corruption.
                </span>
              ) : (
                <span className="block mt-1">
                  This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteStatus}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold"
            >
              Delete Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
