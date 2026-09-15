"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";
import { toast } from "sonner";
import {
  CheckSquare,
  ListTodo,
  AlertTriangle,
  Calendar,
  Bell,
  UserCheck,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useTasks } from "@/shared/hooks/use-crm";
import { TaskType } from "@/shared/types/task";

import {
  TaskTypeDef,
  TaskStatusDef,
  PriorityDef,
  DEFAULT_TYPES,
  DEFAULT_STATUSES,
  DEFAULT_PRIORITIES,
  TASK_COLOR_PRESETS as COLOR_PRESETS,
} from "../constants/task-settings.constants";
import { TaskTypesSection } from "./task-sections/TaskTypesSection";
import { TaskStatusesSection } from "./task-sections/TaskStatusesSection";
import { TaskPrioritiesSection, TaskDueDatesSection } from "./task-sections/TaskPrioritiesAndDueSection";
import { TaskRemindersSection } from "./task-sections/TaskRemindersSection";
import { TaskAssignmentSection, TaskFieldRulesSection } from "./task-sections/TaskAssignmentAndFieldsSection";

export type { TaskTypeDef, TaskStatusDef, PriorityDef };
export { DEFAULT_TYPES, DEFAULT_STATUSES, DEFAULT_PRIORITIES };

export interface TaskContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

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

  const { data: tasksData } = useTasks();
  const activeTasks: TaskType[] = useMemo(() => {
    if (!tasksData) return [];
    if (tasksData && "tasks" in tasksData && Array.isArray(tasksData.tasks)) return tasksData.tasks;
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

  // Load configuration from localStorage on open / mount
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);

  if (typeof window !== "undefined" && open && (!prevOpen || storageKey !== prevStorageKey)) {
    setPrevOpen(open);
    setPrevStorageKey(storageKey);
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
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  // Auto-Save Trigger
  const triggerAutoSave = useCallback(() => {
    if (!isAdmin || !isLoadedRef.current || typeof window === "undefined") return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setAutoSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const payload = {
          taskTypes, statuses, priorities,
          defaultDueOffsetDays, defaultWorkingDaysOnly,
          enableDueSoonReminder, dueSoonOffsetMinutes,
          enableOverdueReminder, enableRepeatOverdueReminder, repeatOverdueIntervalDays,
          enableInAppReminders, enableEmailReminders,
          enableManagerEscalation, escalationTriggerDelayHours,
          defaultTaskOwner, notifyAssigneeOnTaskCreate, reassignmentPolicy, enableRoundRobin,
          reqFieldType, reqFieldPriority, reqFieldDueDate, reqFieldAssignee, reqFieldRelatedRecord,
          requireCompletionNote, requireChecklistComplete, requireOutcomeCategorization,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 1600);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 300);
  }, [
    isAdmin, storageKey, taskTypes, statuses, priorities,
    defaultDueOffsetDays, defaultWorkingDaysOnly,
    enableDueSoonReminder, dueSoonOffsetMinutes, enableOverdueReminder,
    enableRepeatOverdueReminder, repeatOverdueIntervalDays,
    enableInAppReminders, enableEmailReminders, enableManagerEscalation, escalationTriggerDelayHours,
    defaultTaskOwner, notifyAssigneeOnTaskCreate, reassignmentPolicy, enableRoundRobin,
    reqFieldType, reqFieldPriority, reqFieldDueDate, reqFieldAssignee, reqFieldRelatedRecord,
    requireCompletionNote, requireChecklistComplete, requireOutcomeCategorization,
  ]);

  // ─── Handlers: Task Types ───

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) { toast.error("Admin permission required to add task types"); return; }
    const clean = newTypeName.trim();
    if (!clean) return;
    if (taskTypes.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Task type "${clean}" already exists`); return;
    }
    setTaskTypes((prev) => [...prev, { id: `type_custom_${Date.now()}`, name: clean, active: true, isSystem: false, defaultDueDays: 1 }]);
    setNewTypeName("");
    triggerAutoSave();
    toast.success(`Task type "${clean}" added`);
  };

  const handleToggleTypeActive = (id: string) => {
    if (!isAdmin) return;
    setTaskTypes((prev) => prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
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
    setTaskTypes((prev) => prev.map((t) => (t.id === editingTypeId ? { ...t, name: editingTypeName.trim() } : t)));
    setEditingTypeId(null);
    setEditingTypeName("");
    triggerAutoSave();
    toast.success("Task type renamed");
  };

  const handleConfirmDeleteType = () => {
    if (!typeToDelete || !isAdmin) return;
    if (typeToDelete.isSystem) { toast.error("System-defined task types cannot be deleted"); setTypeToDelete(null); return; }
    const usageCount = getTypeUsageCount(typeToDelete.name);
    if (usageCount > 0) {
      toast.error(`Cannot delete: "${typeToDelete.name}" is used by ${usageCount} task(s). Deactivate it instead.`);
      setTypeToDelete(null); return;
    }
    setTaskTypes((prev) => prev.filter((t) => t.id !== typeToDelete.id));
    toast.success(`Task type "${typeToDelete.name}" removed`);
    setTypeToDelete(null);
    triggerAutoSave();
  };

  const handleUpdateTypeDueDays = (id: string, days: number) => {
    if (!isAdmin) return;
    setTaskTypes((prev) => prev.map((t) => (t.id === id ? { ...t, defaultDueDays: Math.max(0, Math.min(90, days)) } : t)));
    triggerAutoSave();
  };

  // ─── Handlers: Task Statuses ───

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) { toast.error("Admin permission required to add statuses"); return; }
    const clean = newStatusName.trim();
    if (!clean) return;
    const generatedKey = clean.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
    if (statuses.some((s) => s.key === generatedKey || s.name.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Status "${clean}" or key "${generatedKey}" already exists`); return;
    }
    setStatuses((prev) => [...prev, { id: `st_custom_${Date.now()}`, name: clean, key: generatedKey, color: newStatusColor, isSystem: false, isTerminal: newStatusIsTerminal, active: true }]);
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
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
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
    setStatuses((prev) => prev.map((s) => s.id === editingStatusId ? { ...s, name: clean, color: editingStatusColor || s.color } : s));
    setEditingStatusId(null);
    setEditingStatusName("");
    triggerAutoSave();
    toast.success("Status updated");
  };

  const handleConfirmDeleteStatus = () => {
    if (!statusToDelete || !isAdmin) return;
    if (statusToDelete.isSystem) { toast.error("System statuses are core to workflow execution and cannot be deleted"); setStatusToDelete(null); return; }
    const usageCount = getStatusUsageCount(statusToDelete.key);
    if (usageCount > 0) {
      toast.error(`Cannot delete status "${statusToDelete.name}": actively referenced by ${usageCount} task(s). Deactivate instead.`);
      setStatusToDelete(null); return;
    }
    setStatuses((prev) => prev.filter((s) => s.id !== statusToDelete.id));
    toast.success(`Custom status "${statusToDelete.name}" deleted`);
    setStatusToDelete(null);
    triggerAutoSave();
  };

  // ─── Handlers: Priorities ───

  const handleUpdatePrioritySla = (id: string, hours: number) => {
    if (!isAdmin) return;
    setPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, slaHours: Math.max(1, Math.min(720, hours)) } : p)));
    triggerAutoSave();
  };

  const handleTogglePriorityActive = (id: string) => {
    if (!isAdmin) return;
    setPriorities((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
    triggerAutoSave();
  };

  // ─── Configuration Sections ───

  const sections: ContextualSettingSection[] = [
    {
      id: "types",
      label: "Task Types",
      icon: ListTodo,
      badge: `${taskTypes.filter((t) => t.active).length} Active`,
      component: (
        <TaskTypesSection
          isAdmin={isAdmin}
          taskTypes={taskTypes}
          newTypeName={newTypeName}
          setNewTypeName={setNewTypeName}
          editingTypeId={editingTypeId}
          setEditingTypeId={setEditingTypeId}
          editingTypeName={editingTypeName}
          setEditingTypeName={setEditingTypeName}
          getTypeUsageCount={getTypeUsageCount}
          onAddType={handleAddType}
          onToggleTypeActive={handleToggleTypeActive}
          onMoveType={handleMoveType}
          onStartRenameType={handleStartRenameType}
          onSaveRenameType={handleSaveRenameType}
          onRequestDeleteType={setTypeToDelete}
        />
      ),
    },
    {
      id: "statuses",
      label: "Task Statuses",
      icon: CheckSquare,
      badge: `${statuses.filter((s) => s.active).length} Statuses`,
      component: (
        <TaskStatusesSection
          isAdmin={isAdmin}
          statuses={statuses}
          newStatusName={newStatusName}
          setNewStatusName={setNewStatusName}
          newStatusColor={newStatusColor}
          setNewStatusColor={setNewStatusColor}
          newStatusIsTerminal={newStatusIsTerminal}
          setNewStatusIsTerminal={setNewStatusIsTerminal}
          editingStatusId={editingStatusId}
          setEditingStatusId={setEditingStatusId}
          editingStatusName={editingStatusName}
          setEditingStatusName={setEditingStatusName}
          editingStatusColor={editingStatusColor}
          setEditingStatusColor={setEditingStatusColor}
          getStatusUsageCount={getStatusUsageCount}
          onAddStatus={handleAddStatus}
          onMoveStatus={handleMoveStatus}
          onToggleStatusActive={handleToggleStatusActive}
          onStartRenameStatus={handleStartRenameStatus}
          onSaveRenameStatus={handleSaveRenameStatus}
          onRequestDeleteStatus={setStatusToDelete}
        />
      ),
    },
    {
      id: "priorities",
      label: "Priorities & SLA",
      icon: AlertTriangle,
      badge: "SLA Targets",
      component: (
        <TaskPrioritiesSection
          isAdmin={isAdmin}
          priorities={priorities}
          onUpdatePrioritySla={handleUpdatePrioritySla}
          onTogglePriorityActive={handleTogglePriorityActive}
        />
      ),
    },
    {
      id: "due-dates",
      label: "Default Due Dates",
      icon: Calendar,
      component: (
        <TaskDueDatesSection
          isAdmin={isAdmin}
          taskTypes={taskTypes}
          defaultDueOffsetDays={defaultDueOffsetDays}
          setDefaultDueOffsetDays={setDefaultDueOffsetDays}
          defaultWorkingDaysOnly={defaultWorkingDaysOnly}
          setDefaultWorkingDaysOnly={setDefaultWorkingDaysOnly}
          onUpdateTypeDueDays={handleUpdateTypeDueDays}
          triggerAutoSave={triggerAutoSave}
        />
      ),
    },
    {
      id: "reminders",
      label: "Reminders & Alerts",
      icon: Bell,
      badge: "Escalations",
      component: (
        <TaskRemindersSection
          isAdmin={isAdmin}
          enableDueSoonReminder={enableDueSoonReminder}
          setEnableDueSoonReminder={setEnableDueSoonReminder}
          dueSoonOffsetMinutes={dueSoonOffsetMinutes}
          setDueSoonOffsetMinutes={setDueSoonOffsetMinutes}
          enableOverdueReminder={enableOverdueReminder}
          setEnableOverdueReminder={setEnableOverdueReminder}
          enableRepeatOverdueReminder={enableRepeatOverdueReminder}
          setEnableRepeatOverdueReminder={setEnableRepeatOverdueReminder}
          repeatOverdueIntervalDays={repeatOverdueIntervalDays}
          setRepeatOverdueIntervalDays={setRepeatOverdueIntervalDays}
          enableInAppReminders={enableInAppReminders}
          setEnableInAppReminders={setEnableInAppReminders}
          enableEmailReminders={enableEmailReminders}
          setEnableEmailReminders={setEnableEmailReminders}
          enableManagerEscalation={enableManagerEscalation}
          setEnableManagerEscalation={setEnableManagerEscalation}
          escalationTriggerDelayHours={escalationTriggerDelayHours}
          setEscalationTriggerDelayHours={setEscalationTriggerDelayHours}
          triggerAutoSave={triggerAutoSave}
        />
      ),
    },
    {
      id: "assignment",
      label: "Task Assignment",
      icon: UserCheck,
      badge: "Delegation",
      component: (
        <TaskAssignmentSection
          isAdmin={isAdmin}
          defaultTaskOwner={defaultTaskOwner}
          setDefaultTaskOwner={setDefaultTaskOwner}
          notifyAssigneeOnTaskCreate={notifyAssigneeOnTaskCreate}
          setNotifyAssigneeOnTaskCreate={setNotifyAssigneeOnTaskCreate}
          reassignmentPolicy={reassignmentPolicy}
          setReassignmentPolicy={setReassignmentPolicy}
          enableRoundRobin={enableRoundRobin}
          setEnableRoundRobin={setEnableRoundRobin}
          triggerAutoSave={triggerAutoSave}
        />
      ),
    },
    {
      id: "field-rules",
      label: "Fields & Completion Rules",
      icon: FileCheck,
      badge: "Governance",
      component: (
        <TaskFieldRulesSection
          isAdmin={isAdmin}
          reqFieldType={reqFieldType}
          setReqFieldType={setReqFieldType}
          reqFieldPriority={reqFieldPriority}
          setReqFieldPriority={setReqFieldPriority}
          reqFieldDueDate={reqFieldDueDate}
          setReqFieldDueDate={setReqFieldDueDate}
          reqFieldAssignee={reqFieldAssignee}
          setReqFieldAssignee={setReqFieldAssignee}
          reqFieldRelatedRecord={reqFieldRelatedRecord}
          setReqFieldRelatedRecord={setReqFieldRelatedRecord}
          requireCompletionNote={requireCompletionNote}
          setRequireCompletionNote={setRequireCompletionNote}
          requireChecklistComplete={requireChecklistComplete}
          setRequireChecklistComplete={setRequireChecklistComplete}
          requireOutcomeCategorization={requireOutcomeCategorization}
          setRequireOutcomeCategorization={setRequireOutcomeCategorization}
          triggerAutoSave={triggerAutoSave}
        />
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
      <CRMDeleteDialog
        isOpen={Boolean(typeToDelete)}
        onOpenChange={(open) => !open && setTypeToDelete(null)}
        title="Delete Task Type"
        itemName="Task Type"
        description={
          <>
            Are you sure you want to delete the custom task type{" "}
            <strong className="text-foreground font-semibold">&quot;{typeToDelete?.name}&quot;</strong>?
            {(!typeToDelete || getTypeUsageCount(typeToDelete.name) === 0) && (
              <span className="block mt-1">
                This action is permanent and removes the option from creation dialogs.
              </span>
            )}
          </>
        }
        warningText={
          typeToDelete && getTypeUsageCount(typeToDelete.name) > 0 ? (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Warning: This task type is actively referenced by {getTypeUsageCount(typeToDelete.name)} task(s). Deleting it may cause data inconsistencies. Consider deactivating instead.
            </span>
          ) : undefined
        }
        confirmLabel="Delete Task Type"
        onConfirm={handleConfirmDeleteType}
      />

      {/* Confirm Delete Task Status Dialog */}
      <CRMDeleteDialog
        isOpen={Boolean(statusToDelete)}
        onOpenChange={(open) => !open && setStatusToDelete(null)}
        title="Delete Task Status"
        itemName="Task Status"
        description={
          <>
            Are you sure you want to delete status{" "}
            <strong className="text-foreground font-semibold">&quot;{statusToDelete?.name}&quot;</strong>?
            {(!statusToDelete || getStatusUsageCount(statusToDelete.key) === 0) && (
              <span className="block mt-1">This action cannot be undone.</span>
            )}
          </>
        }
        warningText={
          statusToDelete && getStatusUsageCount(statusToDelete.key) > 0 ? (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Warning: This status is actively assigned to {getStatusUsageCount(statusToDelete.key)} task(s). Deletion is blocked to prevent data corruption.
            </span>
          ) : undefined
        }
        confirmLabel="Delete Status"
        onConfirm={handleConfirmDeleteStatus}
      />
    </>
  );
}
