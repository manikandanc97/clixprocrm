"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  SettingsSection,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";

interface LeadDefaultsSectionProps {
  defaultPriority: string;
  setDefaultPriority: (v: string) => void;
  defaultCurrency: string;
  setDefaultCurrency: (v: string) => void;
  onChanged: () => void;
}

export function LeadDefaultsSection({
  defaultPriority,
  setDefaultPriority,
  defaultCurrency,
  setDefaultCurrency,
  onChanged,
}: LeadDefaultsSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Lead Defaults & Pre-fills"
        description="Preset initial currency, priority, and channel for new lead dialogs."
        icon={SlidersHorizontal}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsField label="Default Priority">
            <Select
              value={defaultPriority}
              onValueChange={(val) => { setDefaultPriority(val); onChanged(); }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium (Recommended)</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField label="Default Currency">
            <Select
              value={defaultCurrency}
              onValueChange={(val) => { setDefaultCurrency(val); onChanged(); }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
        </div>
      </SettingsSection>
    </div>
  );
}
