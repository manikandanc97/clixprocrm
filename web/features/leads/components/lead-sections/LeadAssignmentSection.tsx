"use client";

import React from "react";
import { UserCheck } from "lucide-react";
import { Input } from "@/shared/ui/input";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsRow,
} from "@/shared/components/crm/ContextualSettingsComponents";

interface LeadAssignmentSectionProps {
  autoAssignRoundRobin: boolean;
  setAutoAssignRoundRobin: (v: boolean) => void;
  notifyAssigneeEmail: boolean;
  setNotifyAssigneeEmail: (v: boolean) => void;
  reassignInactiveDays: string;
  setReassignInactiveDays: (v: string) => void;
  onChanged: () => void;
}

export function LeadAssignmentSection({
  autoAssignRoundRobin,
  setAutoAssignRoundRobin,
  notifyAssigneeEmail,
  setNotifyAssigneeEmail,
  reassignInactiveDays,
  setReassignInactiveDays,
  onChanged,
}: LeadAssignmentSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Lead Routing & Assignment Rules"
        description="Distribute captured prospects across sales representatives automatically."
        icon={UserCheck}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Round-Robin Distribution"
            description="Evenly distribute newly created inbound leads among active sales agents."
            checked={autoAssignRoundRobin}
            onCheckedChange={(c) => { setAutoAssignRoundRobin(c); onChanged(); }}
          />
          <SettingsToggleRow
            label="Notify Assignee on Dispatch"
            description="Send an instant email and push notification when a lead is assigned."
            checked={notifyAssigneeEmail}
            onCheckedChange={(c) => { setNotifyAssigneeEmail(c); onChanged(); }}
          />
          <SettingsRow
            label="Inactive Lead Reassignment"
            description="Reassign leads to pool if left uncontacted for more than threshold days."
          >
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="1"
                max="60"
                value={reassignInactiveDays}
                onChange={(e) => { setReassignInactiveDays(e.target.value); onChanged(); }}
                className="w-16 h-8 text-xs text-center"
              />
              <span className="text-muted-foreground text-xs">days</span>
            </div>
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
}
