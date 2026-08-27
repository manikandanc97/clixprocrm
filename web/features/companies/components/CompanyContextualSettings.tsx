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
  Building2,
  Briefcase,
  Factory,
  CheckSquare,
  CopyX,
  Plus,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";

export interface CompanyContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

const DEFAULT_INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Pharma",
  "Financial Services & Banking",
  "Manufacturing & Industrial",
  "Retail & E-Commerce",
  "Real Estate & Construction",
  "Consulting & Professional",
  "Education & EdTech",
  "Logistics & Supply Chain",
];

const DEFAULT_TYPES = [
  "Enterprise Account",
  "Mid-Market",
  "Small Business (SMB)",
  "Strategic Partner",
  "Vendor / Supplier",
  "Distributor",
];

export function CompanyContextualSettings({
  open,
  onOpenChange,
  defaultSection = "industries",
}: CompanyContextualSettingsProps) {
  // Industries list
  const [industries, setIndustries] = useState<string[]>(DEFAULT_INDUSTRIES);
  const [newIndustry, setNewIndustry] = useState("");

  // Company Types list
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES);
  const [newType, setNewType] = useState("");

  // Company Fields
  const [showAnnualRevenue, setShowAnnualRevenue] = useState(true);
  const [showEmployeeCount, setShowEmployeeCount] = useState(true);
  const [showGSTINField, setShowGSTINField] = useState(true);
  const [showWebsiteDomain, setShowWebsiteDomain] = useState(true);

  // Required Fields
  const [requireIndustry, setRequireIndustry] = useState(true);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [requireLocation, setRequireLocation] = useState(false);

  // Duplicate Rules
  const [preventDomainDuplicates, setPreventDomainDuplicates] = useState(true);
  const [preventNameDuplicates, setPreventNameDuplicates] = useState(true);
  const [duplicatePolicy, setDuplicatePolicy] = useState("warn");

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddIndustry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndustry.trim() || industries.includes(newIndustry.trim())) return;
    setIndustries([...industries, newIndustry.trim()]);
    setNewIndustry("");
    setHasChanges(true);
    toast.success(`Industry "${newIndustry.trim()}" added`);
  };

  const handleRemoveIndustry = (ind: string) => {
    if (industries.length <= 1) return;
    setIndustries(industries.filter((i) => i !== ind));
    setHasChanges(true);
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim() || types.includes(newType.trim())) return;
    setTypes([...types, newType.trim()]);
    setNewType("");
    setHasChanges(true);
    toast.success(`Company type "${newType.trim()}" added`);
  };

  const handleRemoveType = (t: string) => {
    if (types.length <= 1) return;
    setTypes(types.filter((item) => item !== t));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Company settings saved successfully");
    onOpenChange(false);
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "industries",
      label: "Industries",
      icon: Factory,
      badge: `${industries.length} Sectors`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Industry Taxonomy"
            description="Manage the list of industry classifications available for company accounts."
            icon={Factory}
          >
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border/70 bg-card">
              {industries.map((ind) => (
                <Badge
                  key={ind}
                  variant="secondary"
                  className="text-xs py-1 px-2.5 gap-1.5 bg-muted hover:bg-muted/80 text-foreground"
                >
                  <span>{ind}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIndustry(ind)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <form onSubmit={handleAddIndustry} className="mt-3 flex items-center gap-2">
              <Input
                placeholder="New industry sector (e.g., Aerospace, Hospitality)..."
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold h-9 shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Sector
              </Button>
            </form>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "types",
      label: "Company Types",
      icon: Briefcase,
      badge: `${types.length} Types`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Organization & Account Tiers"
            description="Categorize companies by business size, partnership status, or commercial tier."
            icon={Briefcase}
          >
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border/70 bg-card">
              {types.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-xs py-1 px-2.5 gap-1.5 bg-muted hover:bg-muted/80 text-foreground"
                >
                  <span>{type}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveType(type)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <form onSubmit={handleAddType} className="mt-3 flex items-center gap-2">
              <Input
                placeholder="New account type (e.g., Non-Profit, Government)..."
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="text-xs h-9 flex-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="text-xs font-semibold h-9 shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Type
              </Button>
            </form>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "fields",
      label: "Company Fields",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Account Attributes & Field Visibility"
            description="Configure display parameters and tax details for company profiles."
            icon={SlidersHorizontal}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Annual Revenue Estimation"
                description="Track organization turnover and estimated account spending."
                checked={showAnnualRevenue}
                onCheckedChange={(c) => {
                  setShowAnnualRevenue(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Employee Headcount Bracket"
                description="Show workforce size tier (e.g. 1-10, 11-50, 50-200, 200+)."
                checked={showEmployeeCount}
                onCheckedChange={(c) => {
                  setShowEmployeeCount(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Tax Identification / GSTIN / PAN"
                description="Display corporate tax identification fields for invoice generation."
                checked={showGSTINField}
                onCheckedChange={(c) => {
                  setShowGSTINField(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Website & Domain Association"
                description="Enable website URL field for auto-matching inbound email domains."
                checked={showWebsiteDomain}
                onCheckedChange={(c) => {
                  setShowWebsiteDomain(c);
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
            title="Account Validation Rules"
            description="Enforce completeness on company records."
            icon={CheckSquare}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Require Industry Category"
                description="Require sales reps to categorize industry on creation."
                checked={requireIndustry}
                onCheckedChange={(c) => {
                  setRequireIndustry(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Require Official Website"
                description="Ensure website domain is provided for corporate validation."
                checked={requireWebsite}
                onCheckedChange={(c) => {
                  setRequireWebsite(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Require City / Geographic Location"
                description="Mandate billing or headquarters city for geographic reporting."
                checked={requireLocation}
                onCheckedChange={(c) => {
                  setRequireLocation(c);
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
            title="Company Deduplication"
            description="Prevent duplicate accounts through domain and legal name matching."
            icon={CopyX}
          >
            <div className="divide-y divide-border/40">
              <SettingsToggleRow
                label="Deduplicate by Domain Name"
                description="Match website domain e.g., acme.com to existing accounts."
                checked={preventDomainDuplicates}
                onCheckedChange={(c) => {
                  setPreventDomainDuplicates(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Fuzzy Name Normalization"
                description="Detect variations like 'Acme Inc' vs 'Acme Corporation'."
                checked={preventNameDuplicates}
                onCheckedChange={(c) => {
                  setPreventNameDuplicates(c);
                  setHasChanges(true);
                }}
              />
              <SettingsRow
                label="Duplicate Policy"
                description="Action to take when a duplicate company is identified."
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
                    <SelectItem value="warn">Warn & Allow Override</SelectItem>
                    <SelectItem value="block">Block Duplicate Account</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
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
      title="Company Settings"
      subtitle="Manage company classifications, industry sectors, mandatory account attributes, and deduplication."
      icon={Building2}
      badge="Companies Module"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
