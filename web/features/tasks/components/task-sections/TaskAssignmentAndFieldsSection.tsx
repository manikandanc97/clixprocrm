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
import { UserCheck, FileCheck, CheckCircle2 } from "lucide-react";
import { AdminPermissionBanner } from "./AdminPermissionBanner";

export interface TaskAssignmentSectionProps {
  isAdmin: boolean;
  defaultTaskOwner: string;
  setDefaultTaskOwner: (v: string) => void;
  notifyAssigneeOnTaskCreate: boolean;
  setNotifyAssigneeOnTaskCreate: (v: boolean) => void;
  reassignmentPolicy: "all" | "admin_only";
  setReassignmentPolicy: (v: "all" | "admin_only") => void;
  enableRoundRobin: boolean;
  setEnableRoundRobin: (v: boolean) => void;
  triggerAutoSave: () => void;
}

export function TaskAssignmentSection({
  isAdmin,
  defaultTaskOwner,
  setDefaultTaskOwner,
  notifyAssigneeOnTaskCreate,
  setNotifyAssigneeOnTaskCreate,
  reassignmentPolicy,
  setReassignmentPolicy,
  enableRoundRobin,
  setEnableRoundRobin,
  triggerAutoSave,
}: TaskAssignmentSectionProps) {
  return (
    <div className="space-y-5">
      <AdminPermissionBanner isAdmin={isAdmin} />

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
            <Select value={defaultTaskOwner} disabled={!isAdmin} onValueChange={(val) => { setDefaultTaskOwner(val); triggerAutoSave(); }}>
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
            onCheckedChange={(c) => { setNotifyAssigneeOnTaskCreate(c); triggerAutoSave(); }}
          />

          <SettingsRow
            label="Task Reassignment Permissions"
            description="Control whether regular members can reassign tasks or if delegation requires manager privileges."
          >
            <Select
              value={reassignmentPolicy}
              disabled={!isAdmin}
              onValueChange={(val: "all" | "admin_only") => { setReassignmentPolicy(val); triggerAutoSave(); }}
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
            onCheckedChange={(c) => { setEnableRoundRobin(c); triggerAutoSave(); }}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

export interface TaskFieldRulesSectionProps {
  isAdmin: boolean;
  reqFieldType: boolean;
  setReqFieldType: (v: boolean) => void;
  reqFieldPriority: boolean;
  setReqFieldPriority: (v: boolean) => void;
  reqFieldDueDate: boolean;
  setReqFieldDueDate: (v: boolean) => void;
  reqFieldAssignee: boolean;
  setReqFieldAssignee: (v: boolean) => void;
  reqFieldRelatedRecord: boolean;
  setReqFieldRelatedRecord: (v: boolean) => void;
  requireCompletionNote: boolean;
  setRequireCompletionNote: (v: boolean) => void;
  requireChecklistComplete: boolean;
  setRequireChecklistComplete: (v: boolean) => void;
  requireOutcomeCategorization: boolean;
  setRequireOutcomeCategorization: (v: boolean) => void;
  triggerAutoSave: () => void;
}

export function TaskFieldRulesSection({
  isAdmin,
  reqFieldType,
  setReqFieldType,
  reqFieldPriority,
  setReqFieldPriority,
  reqFieldDueDate,
  setReqFieldDueDate,
  reqFieldAssignee,
  setReqFieldAssignee,
  reqFieldRelatedRecord,
  setReqFieldRelatedRecord,
  requireCompletionNote,
  setRequireCompletionNote,
  requireChecklistComplete,
  setRequireChecklistComplete,
  requireOutcomeCategorization,
  setRequireOutcomeCategorization,
  triggerAutoSave,
}: TaskFieldRulesSectionProps) {
  return (
    <div className="space-y-5">
      <AdminPermissionBanner isAdmin={isAdmin} />

      <SettingsSection
        title="Required Fields on Task Creation"
        description="Enforce standard metadata completion when creating tasks to prevent incomplete records."
        icon={FileCheck}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow label="Require Task Classification Type" description="Must specify an activity classification (e.g., Follow-up, Meeting) when creating a task." checked={reqFieldType} disabled={!isAdmin} onCheckedChange={(c) => { setReqFieldType(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Require Priority Level" description="Enforce explicit priority assignment (Urgent, High, Medium, Low)." checked={reqFieldPriority} disabled={!isAdmin} onCheckedChange={(c) => { setReqFieldPriority(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Require Due Date & Time" description="Tasks must have a targeted completion deadline set upon creation." checked={reqFieldDueDate} disabled={!isAdmin} onCheckedChange={(c) => { setReqFieldDueDate(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Require Explicit Assignee" description="Prevent unassigned orphan tasks from entering the workspace queue." checked={reqFieldAssignee} disabled={!isAdmin} onCheckedChange={(c) => { setReqFieldAssignee(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Require Associated CRM Record" description="Ensure every task is explicitly linked to a Lead, Customer, Contact, or Deal." checked={reqFieldRelatedRecord} disabled={!isAdmin} onCheckedChange={(c) => { setReqFieldRelatedRecord(c); triggerAutoSave(); }} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Completion & Resolution Governance"
        description="Control conditions required before a task can transition into the Completed state."
        icon={CheckCircle2}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow label="Require Completion Note" description="Prompt and require user to document an outcome note before marking task Completed." checked={requireCompletionNote} disabled={!isAdmin} onCheckedChange={(c) => { setRequireCompletionNote(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Require All Checklist Subtasks Checked" description="Prevent completing a task if any items in its checklist remain unresolved." checked={requireChecklistComplete} disabled={!isAdmin} onCheckedChange={(c) => { setRequireChecklistComplete(c); triggerAutoSave(); }} />
          <SettingsToggleRow label="Require Structured Outcome for Calls & Meetings" description="Enforce outcome classification (e.g. Connected, Left Voicemail, Rescheduled) on call tasks." checked={requireOutcomeCategorization} disabled={!isAdmin} onCheckedChange={(c) => { setRequireOutcomeCategorization(c); triggerAutoSave(); }} />
        </div>
      </SettingsSection>
    </div>
  );
}
