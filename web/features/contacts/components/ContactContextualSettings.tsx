"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { toast } from "sonner";
import {
  Users,
  CheckSquare,
  CopyX,
  SlidersHorizontal,
  Tag,
  RotateCcw,
} from "lucide-react";
import {
  ContactSettingsConfig,
  DEFAULT_CONTACT_SETTINGS,
  getStoredContactSettings,
  saveStoredContactSettings,
} from "../hooks/use-contact-settings";

export interface ContactContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
  onSettingsSaved?: (settings: ContactSettingsConfig) => void;
}

export function ContactContextualSettings({
  open,
  onOpenChange,
  defaultSection = "fields",
  onSettingsSaved,
}: ContactContextualSettingsProps) {
  const [savedSettings, setSavedSettings] = useState<ContactSettingsConfig>(DEFAULT_CONTACT_SETTINGS);
  const [draft, setDraft] = useState<ContactSettingsConfig>(DEFAULT_CONTACT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Load persisted configuration on modal open
  useEffect(() => {
    if (open) {
      const stored = getStoredContactSettings();
      setSavedSettings(stored);
      setDraft(stored);
    }
  }, [open]);

  // Strict dirty checking against saved state
  const hasChanges = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedSettings);
  }, [draft, savedSettings]);

  const updateDraft = (updates: Partial<ContactSettingsConfig>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const handleRestoreDefaults = () => {
    setDraft({ ...DEFAULT_CONTACT_SETTINGS });
    toast.info("Restored standard CRM defaults. Click Save Changes to apply.");
  };

  const handleResetDraft = () => {
    setDraft({ ...savedSettings });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 350));

      saveStoredContactSettings(draft);
      setSavedSettings(draft);

      if (onSettingsSaved) {
        onSettingsSaved(draft);
      }

      toast.success("Contact settings saved successfully");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save contact settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "fields",
      label: "Contact Fields",
      icon: SlidersHorizontal,
      component: (
        <SettingsSection
          title="Contact Fields"
          description="Choose which contact information is available across the CRM."
          icon={SlidersHorizontal}
          headerAction={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRestoreDefaults}
              className="group text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5 cursor-pointer hover:bg-muted/60"
            >
              <AppIcon name="reset" icon={RotateCcw} size={13} className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
              <span>Restore Defaults</span>
            </Button>
          }
        >
          <div className="divide-y divide-border/40">
            <SettingsToggleRow
              label="Job Title / Position"
              description="Show job title and professional designation across contact profiles and cards."
              checked={draft.showJobTitle}
              onCheckedChange={(val) => updateDraft({ showJobTitle: val })}
            />
            <SettingsToggleRow
              label="Department / Business Unit"
              description="Enable department grouping and organizational unit taxonomy on contacts."
              checked={draft.showDepartment}
              onCheckedChange={(val) => updateDraft({ showDepartment: val })}
            />
            <SettingsToggleRow
              label="Primary Phone / Mobile"
              description="Display direct mobile and telephone number for rapid outreach."
              checked={draft.showPhone}
              onCheckedChange={(val) => updateDraft({ showPhone: val })}
            />
            <SettingsToggleRow
              label="Secondary Email"
              description="Allow secondary and alternate email addresses on individual contact records."
              checked={draft.showSecondaryEmail}
              onCheckedChange={(val) => updateDraft({ showSecondaryEmail: val })}
            />
            <SettingsToggleRow
              label="Social Profile Links"
              description="Enable social profile attributes including LinkedIn and Twitter / X."
              checked={draft.showSocialProfiles}
              onCheckedChange={(val) => updateDraft({ showSocialProfiles: val })}
            />
          </div>
        </SettingsSection>
      ),
    },
    {
      id: "required",
      label: "Required Fields",
      icon: CheckSquare,
      component: (
        <SettingsSection
          title="Required Fields"
          description="Define the information users must provide when creating or updating contacts."
          icon={CheckSquare}
        >
          <div className="divide-y divide-border/40">
            <SettingsToggleRow
              label="Primary Email"
              description="Valid email address is mandatory for contact identification and communication."
              checked={draft.requireEmail}
              onCheckedChange={() => {}}
              disabled
              badge="Mandatory"
            />
            <SettingsToggleRow
              label="Phone / Mobile"
              description="Require telephone or mobile number before saving contact records."
              checked={draft.requirePhone}
              onCheckedChange={(val) => updateDraft({ requirePhone: val })}
            />
            <SettingsToggleRow
              label="Job Title / Role"
              description="Mandate job designation for business relationship tracking."
              checked={draft.requireJobTitle}
              onCheckedChange={(val) => updateDraft({ requireJobTitle: val })}
            />
          </div>
        </SettingsSection>
      ),
    },
    {
      id: "duplicates",
      label: "Duplicate Rules",
      icon: CopyX,
      component: (
        <SettingsSection
          title="Duplicate Rules"
          description="Control how the CRM detects potential duplicate contacts."
          icon={CopyX}
        >
          <div className="divide-y divide-border/40">
            <SettingsToggleRow
              label="Email Matching"
              description="Check for existing contacts with matching primary or secondary email."
              checked={draft.matchEmail}
              onCheckedChange={(val) => updateDraft({ matchEmail: val })}
            />
            <SettingsToggleRow
              label="Phone / Mobile Matching"
              description="Identify potential duplicates with matching phone or mobile numbers."
              checked={draft.matchPhone}
              onCheckedChange={(val) => updateDraft({ matchPhone: val })}
            />
            <SettingsToggleRow
              label="Normalize Email Addresses"
              description="Strip whitespace and treat email comparison as case-insensitive."
              checked={draft.normalizeEmail}
              onCheckedChange={(val) => updateDraft({ normalizeEmail: val })}
            />
            <SettingsRow
              label="When a duplicate is found"
              description="Action to take when an existing matching contact is detected."
            >
              <Select
                value={draft.duplicateResolution}
                onValueChange={(val: "warn" | "block" | "merge") => updateDraft({ duplicateResolution: val })}
              >
                <SelectTrigger className="w-48 h-8.5 text-xs rounded-lg border-border/80 bg-background font-semibold cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="warn" className="text-xs cursor-pointer font-medium">
                    Warn & Allow Override
                  </SelectItem>
                  <SelectItem value="block" className="text-xs cursor-pointer font-medium">
                    Block Duplicate Creation
                  </SelectItem>
                  <SelectItem value="merge" className="text-xs cursor-pointer font-medium">
                    Auto-merge Records
                  </SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          </div>
        </SettingsSection>
      ),
    },
    {
      id: "defaults",
      label: "Default Values",
      icon: Tag,
      component: (
        <SettingsSection
          title="Default Values"
          description="Set the values automatically applied to new contacts."
          icon={Tag}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SettingsField
              label="Default Contact Type"
              description="Initial classification assigned when creating new contact records."
            >
              <Select
                value={draft.defaultContactType}
                onValueChange={(val: "Lead" | "Customer" | "Partner" | "Vendor") => updateDraft({ defaultContactType: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-lg border-border/80 bg-background font-semibold cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="Lead" className="text-xs cursor-pointer font-medium">Lead</SelectItem>
                  <SelectItem value="Customer" className="text-xs cursor-pointer font-medium">Customer</SelectItem>
                  <SelectItem value="Partner" className="text-xs cursor-pointer font-medium">Partner</SelectItem>
                  <SelectItem value="Vendor" className="text-xs cursor-pointer font-medium">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </SettingsField>

            <SettingsField
              label="Default Lifecycle Stage"
              description="Starting lifecycle status pre-selected during contact onboarding."
            >
              <Select
                value={draft.defaultLifecycleStage}
                onValueChange={(val: "NEW" | "CONTACTED" | "ACTIVE" | "ONBOARDING" | "PROSPECT") => updateDraft({ defaultLifecycleStage: val })}
              >
                <SelectTrigger className="h-9 text-xs rounded-lg border-border/80 bg-background font-semibold cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-lg">
                  <SelectItem value="NEW" className="text-xs cursor-pointer font-medium">New Lead (NEW)</SelectItem>
                  <SelectItem value="CONTACTED" className="text-xs cursor-pointer font-medium">Contacted (CONTACTED)</SelectItem>
                  <SelectItem value="ACTIVE" className="text-xs cursor-pointer font-medium">Active Account (ACTIVE)</SelectItem>
                  <SelectItem value="ONBOARDING" className="text-xs cursor-pointer font-medium">Onboarding (ONBOARDING)</SelectItem>
                  <SelectItem value="PROSPECT" className="text-xs cursor-pointer font-medium">Prospect (PROSPECT)</SelectItem>
                </SelectContent>
              </Select>
            </SettingsField>
          </div>
        </SettingsSection>
      ),
    },
  ];

  return (
    <ContextualSettingsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Contact Settings"
      subtitle="Configure available fields, mandatory input rules, duplicate detection, and default values."
      icon={Users}
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
      onReset={handleResetDraft}
    />
  );
}
export { DEFAULT_CONTACT_SETTINGS } from "../hooks/use-contact-settings";
export type { ContactSettingsConfig } from "../hooks/use-contact-settings";
