"use client";

import React, { useState } from "react";
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
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import {
  Users,
  CheckSquare,
  CopyX,
  SlidersHorizontal,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";

export interface ContactContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

export function ContactContextualSettings({
  open,
  onOpenChange,
  defaultSection = "fields",
}: ContactContextualSettingsProps) {
  // Contact Fields
  const [showJobTitle, setShowJobTitle] = useState(true);
  const [showDepartment, setShowDepartment] = useState(true);
  const [showSocialProfiles, setShowSocialProfiles] = useState(true);
  const [showSecondaryEmail, setShowSecondaryEmail] = useState(false);

  // Required Fields
  const [requireEmail, setRequireEmail] = useState(true);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireCompany, setRequireCompany] = useState(false);
  const [requireJobTitle, setRequireJobTitle] = useState(false);

  // Duplicate Rules
  const [preventEmailDupes, setPreventEmailDupes] = useState(true);
  const [preventPhoneDupes, setPreventPhoneDupes] = useState(true);
  const [duplicatePolicy, setDuplicatePolicy] = useState("warn");

  // Default Values
  const [defaultContactType, setDefaultContactType] = useState("Customer");
  const [defaultLifecycleStage, setDefaultLifecycleStage] = useState("ACTIVE");
  const [tags, setTags] = useState<string[]>(["VIP", "Decision Maker", "Billing Contact", "Technical Lead"]);
  const [newTag, setNewTag] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag("");
    setHasChanges(true);
    toast.success(`Tag "${newTag.trim()}" added`);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Contact settings saved successfully");
    onOpenChange(false);
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "fields",
      label: "Contact Fields",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Contact Field Visibility & Layout"
            description="Control which standard profile fields and metadata attributes are displayed."
            icon={SlidersHorizontal}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Job Title & Position"
                description="Show job designation field on contact cards and detail drawers."
                checked={showJobTitle}
                onCheckedChange={(c) => {
                  setShowJobTitle(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Department / Unit"
                description="Enable department grouping on contact profiles."
                checked={showDepartment}
                onCheckedChange={(c) => {
                  setShowDepartment(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Social Profiles (LinkedIn, Twitter)"
                description="Display social profile links on contact cards."
                checked={showSocialProfiles}
                onCheckedChange={(c) => {
                  setShowSocialProfiles(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Secondary Contact Email"
                description="Allow multiple email addresses per individual contact record."
                checked={showSecondaryEmail}
                onCheckedChange={(c) => {
                  setShowSecondaryEmail(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "required",
      label: "Required Fields",
      icon: CheckSquare,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Enforced / Mandatory Fields"
            description="Enforce mandatory validation rules before contacts can be saved."
            icon={CheckSquare}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Require Valid Email Address"
                description="Email is strictly mandatory for all newly created contacts."
                checked={requireEmail}
                onCheckedChange={(c) => {
                  setRequireEmail(c);
                  setHasChanges(true);
                }}
                disabled
                badge="Mandatory"
              />
              <SettingsToggleRow
                label="Require Phone Number"
                description="Ensure phone number is populated when creating contacts."
                checked={requirePhone}
                onCheckedChange={(c) => {
                  setRequirePhone(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Require Linked Company"
                description="Contacts must be associated with an existing or new company account."
                checked={requireCompany}
                onCheckedChange={(c) => {
                  setRequireCompany(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Require Job Title"
                description="Ensure job title is provided for B2B relationship tracking."
                checked={requireJobTitle}
                onCheckedChange={(c) => {
                  setRequireJobTitle(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "duplicates",
      label: "Duplicate Rules",
      icon: CopyX,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Contact Deduplication"
            description="Detect and handle duplicate contacts across your CRM workspace."
            icon={CopyX}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Deduplicate by Email"
                description="Check for existing contacts with matching primary or secondary email."
                checked={preventEmailDupes}
                onCheckedChange={(c) => {
                  setPreventEmailDupes(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Deduplicate by Phone"
                description="Flag contacts with matching internationalized mobile number."
                checked={preventPhoneDupes}
                onCheckedChange={(c) => {
                  setPreventPhoneDupes(c);
                  setHasChanges(true);
                }}
              />
              <SettingsRow
                label="Duplicate Policy"
                description="Action to take when a potential duplicate contact is identified."
              >
                <Select
                  value={duplicatePolicy}
                  onValueChange={(val) => {
                    setDuplicatePolicy(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn User</SelectItem>
                    <SelectItem value="block">Block Creation</SelectItem>
                    <SelectItem value="merge">Auto-merge</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "defaults",
      label: "Default Values",
      icon: Tag,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Default Lifecycle Stage & Pre-set Tags"
            description="Configure default contact values and reusable organization tags."
            icon={Tag}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsField label="Default Contact Category">
                <Select
                  value={defaultContactType}
                  onValueChange={(val) => {
                    setDefaultContactType(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              <SettingsField label="Default Lifecycle State">
                <Select
                  value={defaultLifecycleStage}
                  onValueChange={(val) => {
                    setDefaultLifecycleStage(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active Account</SelectItem>
                    <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                    <SelectItem value="INACTIVE">Inactive / Dormant</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Standard Contact Tags & Badges
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border/70 bg-card">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs py-1 px-2.5 gap-1.5 bg-muted hover:bg-muted/80 text-foreground"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <form onSubmit={handleAddTag} className="mt-2.5 flex items-center gap-2">
                <Input
                  placeholder="New tag label (e.g., Executive, Key Account)..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="text-xs h-8.5 flex-1"
                />
                <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold h-8.5">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Tag
                </Button>
              </form>
            </div>
          </SettingsSection>
        </div>
      ),
    },
  ];

  return (
    <ContextualSettingsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Contact Settings"
      subtitle="Manage contact visibility, required validation fields, tags, and deduplication rules."
      icon={Users}
      badge="Contacts Module"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
