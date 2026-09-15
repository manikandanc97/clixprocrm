"use client";

import React from "react";
import { CopyX, GitMerge } from "lucide-react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface CompanyDuplicateRulesSectionProps {
  preventDomainDuplicates: boolean;
  setPreventDomainDuplicates: (val: boolean) => void;
  preventNameDuplicates: boolean;
  setPreventNameDuplicates: (val: boolean) => void;
  preventPhoneDuplicates: boolean;
  setPreventPhoneDuplicates: (val: boolean) => void;
  duplicatePolicy: string;
  setDuplicatePolicy: (val: string) => void;
  onOpenMergeModal: () => void;
}

export function CompanyDuplicateRulesSection({
  preventDomainDuplicates,
  setPreventDomainDuplicates,
  preventNameDuplicates,
  setPreventNameDuplicates,
  preventPhoneDuplicates,
  setPreventPhoneDuplicates,
  duplicatePolicy,
  setDuplicatePolicy,
  onOpenMergeModal,
}: CompanyDuplicateRulesSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Account Deduplication Rules"
        description="Automate matching across web domains, fuzzy legal names, and normalized phone numbers."
        icon={CopyX}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Deduplicate by Domain Name"
            description="Match website domains (e.g., acme.com) against existing accounts."
            checked={preventDomainDuplicates}
            onCheckedChange={setPreventDomainDuplicates}
          />

          <SettingsToggleRow
            label="Fuzzy Legal Name Normalization"
            description="Detect variations like 'Acme Inc', 'Acme Corporation', and ignore punctuation."
            checked={preventNameDuplicates}
            onCheckedChange={setPreventNameDuplicates}
          />

          <SettingsToggleRow
            label="Deduplicate by Normalized Phone"
            description="Normalize phone digits before comparison to match '+91 9876543210' with '9876543210'."
            checked={preventPhoneDuplicates}
            onCheckedChange={setPreventPhoneDuplicates}
          />

          <SettingsRow
            label="Duplicate Policy"
            description="Action to take when a duplicate company is identified during creation."
          >
            <Select
              value={duplicatePolicy}
              onValueChange={setDuplicatePolicy}
            >
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">Allow (No Warning)</SelectItem>
                <SelectItem value="warn">Warn & Allow Override</SelectItem>
                <SelectItem value="block">Block Creation</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </div>
      </SettingsSection>

      {/* Merge Companies Tool */}
      <SettingsSection
        title="Duplicate Review & Merge"
        description="Safely consolidate duplicate accounts without orphaning contacts, deals, invoices, or activity logs."
        icon={GitMerge}
      >
        <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/70 bg-card">
          <div className="space-y-0.5 max-w-md">
            <h5 className="text-xs font-bold text-foreground">
              Merge Duplicate Accounts
            </h5>
            <p className="text-[11.5px] text-muted-foreground leading-normal">
              Compare two company profiles side-by-side and transfer all relational data to the primary record.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenMergeModal}
            className="text-xs font-semibold gap-1.5 h-8.5 shrink-0"
          >
            <GitMerge className="w-3.5 h-3.5" /> Review & Merge
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}
