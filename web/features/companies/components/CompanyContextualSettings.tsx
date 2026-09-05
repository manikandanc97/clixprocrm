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
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { toast } from "sonner";
import {
  Building2,
  Factory,
  CheckSquare,
  CopyX,
  Plus,
  Trash2,
  SlidersHorizontal,
  GitMerge,
  AlertTriangle,
  Lock,
  Info,
} from "lucide-react";
import { useCompanies } from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { reassignIndustry, mergeCompanies } from "@/shared/lib/api/companies.api";

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
  "Energy & Utilities",
  "Telecommunications",
  "Media & Entertainment",
];

const DEFAULT_ACCOUNT_TYPES = [
  "Customer",
  "Prospect",
  "Partner",
  "Vendor",
  "Distributor",
];

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "url" | "select" | "date" | "boolean" | "currency";
  required: boolean;
  options?: string;
}

interface StandardFieldConfig {
  id: string;
  label: string;
  type: string;
  description: string;
  visible: boolean;
  systemLocked?: boolean;
}

const INITIAL_STANDARD_FIELDS: StandardFieldConfig[] = [
  {
    id: "name",
    label: "Company Name",
    type: "Text",
    description: "Primary legal or trade name of the organization.",
    visible: true,
    systemLocked: true,
  },
  {
    id: "industry",
    label: "Industry Classification",
    type: "Select",
    description: "Sector classification based on workspace taxonomy.",
    visible: true,
  },
  {
    id: "accountType",
    label: "Account Type",
    type: "Select",
    description: "Business relationship role (Customer, Partner, Vendor, etc.).",
    visible: true,
  },
  {
    id: "website",
    label: "Website / Domain",
    type: "URL",
    description: "Corporate website domain for deduplication and enrichment.",
    visible: true,
  },
  {
    id: "phone",
    label: "Primary Phone",
    type: "Phone",
    description: "Direct switchboard or headquarters contact number.",
    visible: true,
  },
  {
    id: "email",
    label: "Corporate Email",
    type: "Email",
    description: "General inbound inquiry or billing contact email.",
    visible: true,
  },
  {
    id: "employeeCount",
    label: "Employee Headcount",
    type: "Select",
    description: "Workforce size tier (1-10, 11-50, 50-200, 200+).",
    visible: true,
  },
  {
    id: "annualRevenue",
    label: "Annual Revenue",
    type: "Currency",
    description: "Estimated annual turnover and commercial scale.",
    visible: true,
  },
  {
    id: "taxId",
    label: "Tax ID / GSTIN / PAN",
    type: "Text",
    description: "Corporate registration and tax identification for invoicing.",
    visible: true,
  },
  {
    id: "address",
    label: "Headquarters Address",
    type: "Text",
    description: "Physical headquarters or billing street address.",
    visible: true,
  },
  {
    id: "city",
    label: "City / Geographic Location",
    type: "Text",
    description: "Primary operating city and geographic jurisdiction.",
    visible: true,
  },
  {
    id: "accountSize",
    label: "Company Size / Account Tier",
    type: "Select (Enterprise / Mid-Market / SMB)",
    description: "Commercial account scale classification.",
    visible: true,
  },
];

interface CompanyItem {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  accountType?: string;
  annualRevenue?: number | string;
  employeeCount?: number | string;
  _count?: {
    customers?: number;
    deals?: number;
  };
}

export function CompanyContextualSettings({
  open,
  onOpenChange,
  defaultSection = "industries",
}: CompanyContextualSettingsProps) {
  const { user } = useAuth();
  const tenantId = user?.tenantId || (user as { activeTenantId?: string })?.activeTenantId || "default";
  const storageKey = `clixprocrm_company_settings_${tenantId}`;

  // Fetch active companies for reference counts and merge workflows
  const { data: companiesData, refetch: refetchCompanies } = useCompanies();
  const companiesList: CompanyItem[] = useMemo(() => {
    const res = companiesData as { companies?: CompanyItem[] } | undefined;
    return Array.isArray(res?.companies) ? res.companies : [];
  }, [companiesData]);

  // 1. Industries State
  const [industries, setIndustries] = useState<string[]>(DEFAULT_INDUSTRIES);
  const [newIndustry, setNewIndustry] = useState("");
  const [industryToDelete, setIndustryToDelete] = useState<string | null>(null);
  const [reassignTargetIndustry, setReassignTargetIndustry] = useState<string>("");
  const [isReassigningIndustry, setIsReassigningIndustry] = useState(false);

  // 2. Account Types State
  const [accountTypes, setAccountTypes] = useState<string[]>(DEFAULT_ACCOUNT_TYPES);
  const [newAccountType, setNewAccountType] = useState("");

  // 3. Company Fields State
  const [standardFields, setStandardFields] = useState<StandardFieldConfig[]>(INITIAL_STANDARD_FIELDS);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isAddCustomFieldOpen, setIsAddCustomFieldOpen] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [newCustomFieldType, setNewCustomFieldType] = useState<CustomField["type"]>("text");
  const [newCustomFieldRequired, setNewCustomFieldRequired] = useState(false);
  const [newCustomFieldOptions, setNewCustomFieldOptions] = useState("");

  // 4. Required Fields State
  const [requireIndustry, setRequireIndustry] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireLocation, setRequireLocation] = useState(false);
  const [requireAccountType, setRequireAccountType] = useState(false);

  // 5. Duplicate Rules State
  const [preventDomainDuplicates, setPreventDomainDuplicates] = useState(true);
  const [preventNameDuplicates, setPreventNameDuplicates] = useState(true);
  const [preventPhoneDuplicates, setPreventPhoneDuplicates] = useState(true);
  const [duplicatePolicy, setDuplicatePolicy] = useState("warn");

  // Merge Dialog State
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState<string>("");
  const [mergeSecondaryId, setMergeSecondaryId] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);

  // UI state tracking
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load persistent configuration from storage on open / tenant load
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.industries && Array.isArray(parsed.industries)) setIndustries(parsed.industries);
        if (parsed.accountTypes && Array.isArray(parsed.accountTypes)) setAccountTypes(parsed.accountTypes);
        if (parsed.standardFields && Array.isArray(parsed.standardFields)) setStandardFields(parsed.standardFields);
        if (parsed.customFields && Array.isArray(parsed.customFields)) setCustomFields(parsed.customFields);
        if (parsed.requireIndustry !== undefined) setRequireIndustry(parsed.requireIndustry);
        if (parsed.requireWebsite !== undefined) setRequireWebsite(parsed.requireWebsite);
        if (parsed.requirePhone !== undefined) setRequirePhone(parsed.requirePhone);
        if (parsed.requireLocation !== undefined) setRequireLocation(parsed.requireLocation);
        if (parsed.requireAccountType !== undefined) setRequireAccountType(parsed.requireAccountType);
        if (parsed.preventDomainDuplicates !== undefined) setPreventDomainDuplicates(parsed.preventDomainDuplicates);
        if (parsed.preventNameDuplicates !== undefined) setPreventNameDuplicates(parsed.preventNameDuplicates);
        if (parsed.preventPhoneDuplicates !== undefined) setPreventPhoneDuplicates(parsed.preventPhoneDuplicates);
        if (parsed.duplicatePolicy !== undefined) setDuplicatePolicy(parsed.duplicatePolicy);
      }
    } catch {
      // Fall back to defaults
    }
  }, [storageKey, open]);

  // Compute usage counts for industries
  const industryUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const comp of companiesList) {
      if (comp && comp.industry) {
        counts[comp.industry] = (counts[comp.industry] || 0) + 1;
      }
    }
    return counts;
  }, [companiesList]);

  // Industry handlers
  const handleAddIndustry = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newIndustry.trim();
    if (!trimmed) return;
    if (industries.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Industry "${trimmed}" already exists`);
      return;
    }
    setIndustries([...industries, trimmed]);
    setNewIndustry("");
    setHasChanges(true);
    toast.success(`Industry "${trimmed}" added`);
  };

  const handleInitiateDeleteIndustry = (ind: string) => {
    const usage = industryUsageCounts[ind] || 0;
    if (usage > 0) {
      // Must reassign
      setIndustryToDelete(ind);
      const firstOther = industries.find((i) => i !== ind) || "";
      setReassignTargetIndustry(firstOther);
    } else {
      // Safe immediate delete
      setIndustries((prev) => prev.filter((i) => i !== ind));
      setHasChanges(true);
      toast.success(`Industry "${ind}" removed`);
    }
  };

  const handleConfirmReassignAndDeleteIndustry = async () => {
    if (!industryToDelete || !reassignTargetIndustry) return;
    setIsReassigningIndustry(true);
    try {
      await reassignIndustry(industryToDelete, reassignTargetIndustry);
      setIndustries((prev) => prev.filter((i) => i !== industryToDelete));
      setHasChanges(true);
      await refetchCompanies();
      toast.success(
        `Reassigned companies from "${industryToDelete}" to "${reassignTargetIndustry}" and deleted "${industryToDelete}"`
      );
      setIndustryToDelete(null);
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to reassign industry");
    } finally {
      setIsReassigningIndustry(false);
    }
  };

  // Account Type handlers
  const handleAddAccountType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAccountType.trim();
    if (!trimmed) return;
    if (accountTypes.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Account Type "${trimmed}" already exists`);
      return;
    }
    setAccountTypes([...accountTypes, trimmed]);
    setNewAccountType("");
    setHasChanges(true);
    toast.success(`Account Type "${trimmed}" added`);
  };

  const handleRemoveAccountType = (type: string) => {
    if (accountTypes.length <= 1) {
      toast.error("At least one account type must remain configured");
      return;
    }
    setAccountTypes((prev) => prev.filter((t) => t !== type));
    setHasChanges(true);
    toast.success(`Account Type "${type}" removed`);
  };

  // Standard Field toggle
  const handleToggleStandardField = (id: string, visible: boolean) => {
    setStandardFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, visible } : f))
    );
    setHasChanges(true);
  };

  // Custom Field handlers
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCustomFieldName.trim();
    if (!trimmed) {
      toast.error("Field label is required");
      return;
    }
    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      name: trimmed,
      type: newCustomFieldType,
      required: newCustomFieldRequired,
      options: newCustomFieldType === "select" ? newCustomFieldOptions : undefined,
    };
    setCustomFields((prev) => [...prev, newField]);
    setNewCustomFieldName("");
    setNewCustomFieldType("text");
    setNewCustomFieldRequired(false);
    setNewCustomFieldOptions("");
    setIsAddCustomFieldOpen(false);
    setHasChanges(true);
    toast.success(`Custom field "${trimmed}" added`);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    setHasChanges(true);
    toast.success("Custom field removed");
  };

  // Merge Companies handler
  const handleExecuteMerge = async () => {
    if (!mergePrimaryId || !mergeSecondaryId) {
      toast.error("Please select both a Primary and Duplicate company");
      return;
    }
    if (mergePrimaryId === mergeSecondaryId) {
      toast.error("Primary and Duplicate cannot be the same company");
      return;
    }

    setIsMerging(true);
    try {
      await mergeCompanies(mergePrimaryId, mergeSecondaryId);
      await refetchCompanies();
      toast.success("Companies merged successfully. Relational data preserved.");
      setIsMergeModalOpen(false);
      setMergePrimaryId("");
      setMergeSecondaryId("");
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to merge companies");
    } finally {
      setIsMerging(false);
    }
  };

  // Save changes to persistent storage
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const config = {
        industries,
        accountTypes,
        standardFields,
        customFields,
        requireIndustry,
        requireWebsite,
        requirePhone,
        requireLocation,
        requireAccountType,
        preventDomainDuplicates,
        preventNameDuplicates,
        preventPhoneDuplicates,
        duplicatePolicy,
        updatedAt: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(config));
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
      setHasChanges(false);
      toast.success("Company settings saved successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save company settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Get objects for merge modal comparison
  const primaryCompany: CompanyItem | undefined = useMemo(
    () => companiesList.find((c: CompanyItem) => c.id === mergePrimaryId),
    [companiesList, mergePrimaryId]
  );
  const secondaryCompany: CompanyItem | undefined = useMemo(
    () => companiesList.find((c: CompanyItem) => c.id === mergeSecondaryId),
    [companiesList, mergeSecondaryId]
  );

  // Define exactly the 5 requested sections
  const sections: ContextualSettingSection[] = [
    // 1. Industries
    {
      id: "industries",
      label: "Industries",
      icon: Factory,
      badge: `${industries.length}`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Industry Classifications"
            description="Manage industry classifications available when categorizing company accounts. Includes safe deletion protection."
            icon={Factory}
          >
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {industries.map((ind) => {
                  const count = industryUsageCounts[ind] || 0;
                  return (
                    <div
                      key={ind}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {ind}
                        </span>
                        {count > 0 ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 h-4 bg-muted text-muted-foreground font-normal shrink-0"
                          >
                            {count} {count === 1 ? "account" : "accounts"}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 shrink-0">
                            Unassigned
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleInitiateDeleteIndustry(ind)}
                        aria-label={`Delete industry ${ind}`}
                        className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        title={
                          count > 0
                            ? `Used by ${count} companies (requires reassignment)`
                            : "Delete classification"
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleAddIndustry} className="mt-4 flex items-center gap-2 pt-2 border-t border-border/40">
                <Input
                  placeholder="New industry classification (e.g., Aerospace, Hospitality)..."
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="text-xs h-9 flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="text-xs font-semibold h-9 shrink-0 gap-1"
                  disabled={!newIndustry.trim()}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Industry
                </Button>
              </form>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 2. Account Types
    {
      id: "account-types",
      label: "Account Types",
      icon: Building2,
      badge: `${accountTypes.length}`,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Account Types & Business Roles"
            description="Categorize companies by commercial relationship and partnership type."
            icon={Building2}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {accountTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/20 transition-colors"
                  >
                    <span className="text-xs font-semibold text-foreground truncate">
                      {type}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveAccountType(type)}
                      disabled={accountTypes.length <= 1}
                      aria-label={`Delete account type ${type}`}
                      className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddAccountType} className="mt-4 flex items-center gap-2 pt-2 border-t border-border/40">
                <Input
                  placeholder="New account type (e.g., Affiliate, Sub-Contractor)..."
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value)}
                  className="text-xs h-9 flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="text-xs font-semibold h-9 shrink-0 gap-1"
                  disabled={!newAccountType.trim()}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Account Type
                </Button>
              </form>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 3. Company Fields
    {
      id: "fields",
      label: "Company Fields",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Standard Account Fields"
            description="Manage core attributes and visibility in company records and forms."
            icon={SlidersHorizontal}
          >
            <div className="divide-y divide-border/40">
              {standardFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between py-2.5 px-1 text-xs"
                >
                  <div className="space-y-0.5 max-w-lg min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {field.label}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 h-4 font-medium text-muted-foreground"
                      >
                        {field.type}
                      </Badge>
                      {field.systemLocked && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 h-4 gap-1 bg-muted font-semibold text-muted-foreground"
                        >
                          <Lock className="w-2.5 h-2.5" /> System Core
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-normal">
                      {field.description}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {field.systemLocked ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground border-border/70"
                      >
                        Always Visible
                      </Badge>
                    ) : (
                      <Switch
                        checked={field.visible}
                        onCheckedChange={(c) => handleToggleStandardField(field.id, c)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>

          {/* Custom Fields Section */}
          <SettingsSection
            title="Custom Fields"
            description="Add bespoke metadata fields tailored to your organization's business workflow."
            icon={Plus}
            headerAction={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsAddCustomFieldOpen(true)}
                className="h-8 text-xs font-semibold gap-1.5 border-border/80"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Field
              </Button>
            }
          >
            {customFields.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border/70 rounded-lg text-muted-foreground text-xs">
                <p>No custom fields defined.</p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                  Click &quot;+ Add Custom Field&quot; to capture custom data points.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {customFields.map((cf) => (
                  <div
                    key={cf.id}
                    className="flex items-center justify-between py-2.5 px-1 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {cf.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 uppercase">
                          {cf.type}
                        </Badge>
                        {cf.required && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                            Required
                          </Badge>
                        )}
                      </div>
                      {cf.options && (
                        <p className="text-[11px] text-muted-foreground">
                          Options: {cf.options}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveCustomField(cf.id)}
                      className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SettingsSection>
        </div>
      ),
    },

    // 4. Required Fields
    {
      id: "required",
      label: "Required Fields",
      icon: CheckSquare,
      component: (
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
                onCheckedChange={(c) => {
                  setRequireIndustry(c);
                  setHasChanges(true);
                }}
              />

              <SettingsToggleRow
                label="Require Official Website"
                description="Ensure website URL domain is provided (Recommended OFF for SMB clients)."
                checked={requireWebsite}
                onCheckedChange={(c) => {
                  setRequireWebsite(c);
                  setHasChanges(true);
                }}
              />

              <SettingsToggleRow
                label="Require Primary Phone Number"
                description="Mandate a telephone contact number on company creation."
                checked={requirePhone}
                onCheckedChange={(c) => {
                  setRequirePhone(c);
                  setHasChanges(true);
                }}
              />

              <SettingsToggleRow
                label="Require City / Geographic Location"
                description="Mandate headquarters city for territory and regional reporting."
                checked={requireLocation}
                onCheckedChange={(c) => {
                  setRequireLocation(c);
                  setHasChanges(true);
                }}
              />

              <SettingsToggleRow
                label="Require Account Type"
                description="Enforce selecting a business relationship role (Customer, Partner, etc.)."
                checked={requireAccountType}
                onCheckedChange={(c) => {
                  setRequireAccountType(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 5. Duplicate Rules
    {
      id: "duplicates",
      label: "Duplicate Rules",
      icon: CopyX,
      component: (
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
                onCheckedChange={(c) => {
                  setPreventDomainDuplicates(c);
                  setHasChanges(true);
                }}
              />

              <SettingsToggleRow
                label="Fuzzy Legal Name Normalization"
                description="Detect variations like 'Acme Inc', 'Acme Corporation', and ignore punctuation."
                checked={preventNameDuplicates}
                onCheckedChange={(c) => {
                  setPreventNameDuplicates(c);
                  setHasChanges(true);
                }}
              />

              <SettingsToggleRow
                label="Deduplicate by Normalized Phone"
                description="Normalize phone digits before comparison to match '+91 9876543210' with '9876543210'."
                checked={preventPhoneDuplicates}
                onCheckedChange={(c) => {
                  setPreventPhoneDuplicates(c);
                  setHasChanges(true);
                }}
              />

              <SettingsRow
                label="Duplicate Policy"
                description="Action to take when a duplicate company is identified during creation."
              >
                <Select
                  value={duplicatePolicy}
                  onValueChange={(val) => {
                    setDuplicatePolicy(val);
                    setHasChanges(true);
                  }}
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
                onClick={() => setIsMergeModalOpen(true)}
                className="text-xs font-semibold gap-1.5 h-8.5 shrink-0"
              >
                <GitMerge className="w-3.5 h-3.5" /> Review & Merge
              </Button>
            </div>
          </SettingsSection>
        </div>
      ),
    },
  ];

  return (
    <>
      <ContextualSettingsDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Company Settings"
        subtitle="Manage company classifications, fields, validation and duplicate rules."
        icon={Building2}
        badge={undefined}
        sections={sections}
        defaultSection={defaultSection}
        isSaving={isSaving}
        hasUnsavedChanges={hasChanges}
        onSave={handleSave}
      />

      {/* ── Reassign Industry Before Deleting Dialog ───────────────────────────── */}
      <Dialog
        open={!!industryToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) setIndustryToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-destructive">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Reassign Companies Before Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              <strong className="text-foreground font-semibold">
                &quot;{industryToDelete}&quot;
              </strong>{" "}
              is currently assigned to{" "}
              <strong className="text-foreground font-semibold">
                {industryToDelete ? industryUsageCounts[industryToDelete] || 0 : 0}
              </strong>{" "}
              company account(s). Please select a replacement industry before removing it to prevent broken references.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Replacement Industry
            </Label>
            <Select
              value={reassignTargetIndustry}
              onValueChange={setReassignTargetIndustry}
            >
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder="Select replacement industry..." />
              </SelectTrigger>
              <SelectContent>
                {industries
                  .filter((ind) => ind !== industryToDelete)
                  .map((ind) => (
                    <SelectItem key={ind} value={ind} className="text-xs">
                      {ind}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIndustryToDelete(null)}
              disabled={isReassigningIndustry}
              className="text-xs h-8.5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmReassignAndDeleteIndustry}
              disabled={!reassignTargetIndustry || isReassigningIndustry}
              className="text-xs h-8.5 font-semibold gap-1.5"
            >
              {isReassigningIndustry ? "Reassigning..." : "Reassign & Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Custom Field Dialog ────────────────────────────────────────────── */}
      <Dialog open={isAddCustomFieldOpen} onOpenChange={setIsAddCustomFieldOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddCustomField}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">
                Add Custom Company Field
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Define a custom attribute to capture organization-specific metadata.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Field Label</Label>
                <Input
                  placeholder="e.g. LinkedIn Company URL, Parent Holding, Fiscal Year End..."
                  value={newCustomFieldName}
                  onChange={(e) => setNewCustomFieldName(e.target.value)}
                  className="text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data Type</Label>
                <Select
                  value={newCustomFieldType}
                  onValueChange={(val: "text" | "number" | "url" | "currency" | "date" | "select") => setNewCustomFieldType(val)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text" className="text-xs">Text (Single Line)</SelectItem>
                    <SelectItem value="number" className="text-xs">Numeric Number</SelectItem>
                    <SelectItem value="url" className="text-xs">Website / Profile URL</SelectItem>
                    <SelectItem value="currency" className="text-xs">Currency Amount</SelectItem>
                    <SelectItem value="date" className="text-xs">Date Picker</SelectItem>
                    <SelectItem value="select" className="text-xs">Dropdown Select</SelectItem>
                    <SelectItem value="boolean" className="text-xs">Checkbox (Yes/No)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCustomFieldType === "select" && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Options (comma-separated)</Label>
                  <Input
                    placeholder="e.g. Tier 1, Tier 2, Tier 3"
                    value={newCustomFieldOptions}
                    onChange={(e) => setNewCustomFieldOptions(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Required Field</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Must be populated when creating a company
                  </p>
                </div>
                <Switch
                  checked={newCustomFieldRequired}
                  onCheckedChange={setNewCustomFieldRequired}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCustomFieldOpen(false)}
                className="text-xs h-8.5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs h-8.5 font-semibold"
                disabled={!newCustomFieldName.trim()}
              >
                Add Field
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Side-by-Side Review Duplicates & Merge Dialog ──────────────────────── */}
      <Dialog open={isMergeModalOpen} onOpenChange={setIsMergeModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <GitMerge className="w-4 h-4 text-emerald-600" />
              Review & Merge Company Accounts
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the Master (Primary) record to keep and the Duplicate (Secondary) record to merge. All linked contacts, deals, invoices, and timeline history will be safely transferred.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Selector */}
              <div className="space-y-1.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Master Record (To Keep)
                  </Label>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                    Primary
                  </Badge>
                </div>
                <Select value={mergePrimaryId} onValueChange={setMergePrimaryId}>
                  <SelectTrigger className="w-full text-xs h-9 bg-card">
                    <SelectValue placeholder="Select primary company..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {companiesList
                      .filter((c: CompanyItem) => c.id !== mergeSecondaryId)
                      .map((c: CompanyItem) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name} ({c.industry || "No Industry"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secondary Selector */}
              <div className="space-y-1.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    Duplicate Record (To Merge & Archive)
                  </Label>
                  <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 border-rose-500/30">
                    Duplicate
                  </Badge>
                </div>
                <Select value={mergeSecondaryId} onValueChange={setMergeSecondaryId}>
                  <SelectTrigger className="w-full text-xs h-9 bg-card">
                    <SelectValue placeholder="Select duplicate company..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {companiesList
                      .filter((c: CompanyItem) => c.id !== mergePrimaryId)
                      .map((c: CompanyItem) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name} ({c.industry || "No Industry"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Side-by-Side Field Comparison Table */}
            {primaryCompany && secondaryCompany && (
              <div className="rounded-lg border border-border overflow-hidden text-xs">
                <div className="grid grid-cols-3 bg-muted/60 p-2 font-bold text-[11px] border-b border-border">
                  <span>Attribute</span>
                  <span className="text-emerald-700 dark:text-emerald-400">Master Record</span>
                  <span className="text-rose-700 dark:text-rose-400">Duplicate Record</span>
                </div>
                <div className="divide-y divide-border/50 text-[11.5px]">
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-muted-foreground">Name</span>
                    <span className="font-semibold text-foreground">{primaryCompany.name}</span>
                    <span className="text-muted-foreground line-through">{secondaryCompany.name}</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-muted-foreground">Industry</span>
                    <span>{primaryCompany.industry || secondaryCompany.industry || "—"}</span>
                    <span className="text-muted-foreground">{secondaryCompany.industry || "—"}</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-muted-foreground">Website</span>
                    <span>{primaryCompany.website || secondaryCompany.website || "—"}</span>
                    <span className="text-muted-foreground">{secondaryCompany.website || "—"}</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-muted-foreground">Phone</span>
                    <span>{primaryCompany.phone || secondaryCompany.phone || "—"}</span>
                    <span className="text-muted-foreground">{secondaryCompany.phone || "—"}</span>
                  </div>
                  <div className="grid grid-cols-3 p-2 items-center">
                    <span className="font-medium text-muted-foreground">Contacts / Deals</span>
                    <span className="text-emerald-600 font-semibold">
                      +{secondaryCompany._count?.customers || 0} Contacts, +{secondaryCompany._count?.deals || 0} Deals transferred
                    </span>
                    <span className="text-muted-foreground">
                      {secondaryCompany._count?.customers || 0} Contacts, {secondaryCompany._count?.deals || 0} Deals
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMergeModalOpen(false)}
              disabled={isMerging}
              className="text-xs h-8.5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteMerge}
              disabled={!mergePrimaryId || !mergeSecondaryId || isMerging}
              className="text-xs h-8.5 font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isMerging ? "Merging..." : "Confirm & Merge Accounts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
