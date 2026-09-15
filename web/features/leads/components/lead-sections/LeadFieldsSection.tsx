"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  SettingsSection,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";

interface LeadFieldsSectionProps {
  requireCompany: boolean;
  setRequireCompany: (v: boolean) => void;
  requirePhone: boolean;
  setRequirePhone: (v: boolean) => void;
  enableCustomFields: boolean;
  setEnableCustomFields: (v: boolean) => void;
  trackUTMParameters: boolean;
  setTrackUTMParameters: (v: boolean) => void;
  onChanged: () => void;
}

export function LeadFieldsSection({
  requireCompany,
  setRequireCompany,
  requirePhone,
  setRequirePhone,
  enableCustomFields,
  setEnableCustomFields,
  trackUTMParameters,
  setTrackUTMParameters,
  onChanged,
}: LeadFieldsSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="Lead Capture & Standard Fields"
        description="Configure which fields are enabled, required, or tracked during lead creation."
        icon={SlidersHorizontal}
      >
        <div className="divide-y divide-border/40">
          <SettingsToggleRow
            label="Require Company Name"
            description="Make the Company / Organization field mandatory on lead entry."
            checked={requireCompany}
            onCheckedChange={(c) => { setRequireCompany(c); onChanged(); }}
          />
          <SettingsToggleRow
            label="Require Phone Number"
            description="Require a valid phone contact before saving new leads."
            checked={requirePhone}
            onCheckedChange={(c) => { setRequirePhone(c); onChanged(); }}
          />
          <SettingsToggleRow
            label="Enable Custom Attributes"
            description="Allow team members to attach arbitrary key-value custom fields to leads."
            checked={enableCustomFields}
            onCheckedChange={(c) => { setEnableCustomFields(c); onChanged(); }}
          />
          <SettingsToggleRow
            label="Capture UTM & Referrer Parameters"
            description="Automatically parse utm_source, utm_medium, and campaign tags from form submissions."
            checked={trackUTMParameters}
            onCheckedChange={(c) => { setTrackUTMParameters(c); onChanged(); }}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
