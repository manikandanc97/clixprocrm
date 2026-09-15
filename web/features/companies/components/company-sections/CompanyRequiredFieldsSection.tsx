"use client";

import React from "react";
import { CheckSquare, Info, Lock } from "lucide-react";
import {
  SettingsSection,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";

interface CompanyRequiredFieldsSectionProps {
  requireIndustry: boolean;
  setRequireIndustry: (val: boolean) => void;
  requireWebsite: boolean;
  setRequireWebsite: (val: boolean) => void;
  requirePhone: boolean;
  setRequirePhone: (val: boolean) => void;
  requireLocation: boolean;
  setRequireLocation: (val: boolean) => void;
  requireAccountType: boolean;
  setRequireAccountType: (val: boolean) => void;
}

export function CompanyRequiredFieldsSection({
  requireIndustry,
  setRequireIndustry,
  requireWebsite,
  setRequireWebsite,
  requirePhone,
  setRequirePhone,
  requireLocation,
  setRequireLocation,
  requireAccountType,
  setRequireAccountType,
}: CompanyRequiredFieldsSectionProps) {
  return (
    <div className="space-y-5">
      <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-foreground flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          These rules apply when creating or updating company records.
        </p>
      </div>

      <SettingsSection
        title="Validation & Completeness Rules"
        description="Configure mandatory data points for account creation."
        icon={CheckSquare}
      >
        <div className="divide-y divide-border/40">
          {/* System Required: Company Name */}
          <div className="flex items-center justify-between py-2.5 px-2 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  Company Name
                </span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 gap-1 bg-muted text-muted-foreground font-semibold">
                  <Lock className="w-2.5 h-2.5" /> Required (System Default)
                </Badge>
              </div>
              <p className="text-[11.5px] text-muted-foreground">
                Core company identifier. Always mandatory at the database level.
              </p>
            </div>
            <Switch checked disabled />
          </div>

          <SettingsToggleRow
            label="Require Industry Category"
            description="Mandate selection of an industry sector before saving the company."
            checked={requireIndustry}
            onCheckedChange={setRequireIndustry}
          />

          <SettingsToggleRow
            label="Require Official Website"
            description="Ensure website URL domain is provided (Recommended OFF for SMB clients)."
            checked={requireWebsite}
            onCheckedChange={setRequireWebsite}
          />

          <SettingsToggleRow
            label="Require Primary Phone Number"
            description="Mandate a telephone contact number on company creation."
            checked={requirePhone}
            onCheckedChange={setRequirePhone}
          />

          <SettingsToggleRow
            label="Require City / Geographic Location"
            description="Mandate headquarters city for territory and regional reporting."
            checked={requireLocation}
            onCheckedChange={setRequireLocation}
          />

          <SettingsToggleRow
            label="Require Account Type"
            description="Enforce selecting a business relationship role (Customer, Partner, etc.)."
            checked={requireAccountType}
            onCheckedChange={setRequireAccountType}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
