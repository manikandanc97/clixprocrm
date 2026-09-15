"use client";

import React from "react";
import { CopyX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsRow,
} from "@/shared/components/crm/ContextualSettingsComponents";

interface LeadDuplicatesSectionProps {
  preventEmailDuplicates: boolean;
  setPreventEmailDuplicates: (v: boolean) => void;
  preventPhoneDuplicates: boolean;
  setPreventPhoneDuplicates: (v: boolean) => void;
  duplicateAction: string;
  setDuplicateAction: (v: string) => void;
  onChanged: () => void;
}

export function LeadDuplicatesSection({
  preventEmailDuplicates,
  setPreventEmailDuplicates,
  preventPhoneDuplicates,
  setPreventPhoneDuplicates,
  duplicateAction,
  setDuplicateAction,
  onChanged,
}: LeadDuplicatesSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Deduplication & Merge Policies"
        description="Prevent duplicate lead entries and maintain clean CRM records."
        icon={CopyX}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Match Exact Email Address"
            description="Flag potential duplicates when an identical email address is entered."
            checked={preventEmailDuplicates}
            onCheckedChange={(c) => { setPreventEmailDuplicates(c); onChanged(); }}
          />
          <SettingsToggleRow
            label="Match Phone Number"
            description="Flag duplicate leads matching normalized mobile/landline numbers."
            checked={preventPhoneDuplicates}
            onCheckedChange={(c) => { setPreventPhoneDuplicates(c); onChanged(); }}
          />
          <SettingsRow
            label="Duplicate Detection Policy"
            description="Choose whether to warn the user or completely block duplicate lead creation."
          >
            <Select
              value={duplicateAction}
              onValueChange={(val) => { setDuplicateAction(val); onChanged(); }}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warn">Warn & Allow Override</SelectItem>
                <SelectItem value="block">Strict Block</SelectItem>
                <SelectItem value="automerge">Auto-merge to existing</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </div>
      </SettingsSection>
    </div>
  );
}
