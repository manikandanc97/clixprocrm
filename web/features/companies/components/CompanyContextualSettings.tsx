"use client";

import React, { useState, useMemo } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import { toast } from "sonner";
import {
  Building2,
  Factory,
  CheckSquare,
  CopyX,
  SlidersHorizontal,
} from "lucide-react";
import { useCompanies } from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { reassignIndustry, mergeCompanies } from "@/shared/lib/api/companies.api";

export interface CompanyContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

import {
  DEFAULT_INDUSTRIES,
  DEFAULT_ACCOUNT_TYPES,
  INITIAL_STANDARD_FIELDS,
  CustomField,
  StandardFieldConfig,
} from "../constants/company-settings.constants";
import { CompanyIndustryReassignModal } from "./contextual-settings/CompanyIndustryReassignModal";
import { CompanyCustomFieldModal } from "./contextual-settings/CompanyCustomFieldModal";
import { CompanyMergeModal } from "./contextual-settings/CompanyMergeModal";

import { CompanyIndustriesSection } from "./company-sections/CompanyIndustriesSection";
import { CompanyAccountTypesSection } from "./company-sections/CompanyAccountTypesSection";
import { CompanyFieldsSection } from "./company-sections/CompanyFieldsSection";
import { CompanyRequiredFieldsSection } from "./company-sections/CompanyRequiredFieldsSection";
import { CompanyDuplicateRulesSection } from "./company-sections/CompanyDuplicateRulesSection";

export type { CustomField, StandardFieldConfig };
export {
  DEFAULT_INDUSTRIES,
  DEFAULT_ACCOUNT_TYPES,
  INITIAL_STANDARD_FIELDS,
};

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
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);

  if (typeof window !== "undefined" && open && (!prevOpen || storageKey !== prevStorageKey)) {
    setPrevOpen(open);
    setPrevStorageKey(storageKey);
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
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

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
      setIndustryToDelete(ind);
      const firstOther = industries.find((i) => i !== ind) || "";
      setReassignTargetIndustry(firstOther);
    } else {
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

  // Define exactly the 5 requested sections
  const sections: ContextualSettingSection[] = [
    {
      id: "industries",
      label: "Industries",
      icon: Factory,
      badge: `${industries.length}`,
      component: (
        <CompanyIndustriesSection
          industries={industries}
          industryUsageCounts={industryUsageCounts}
          newIndustry={newIndustry}
          setNewIndustry={setNewIndustry}
          onAddIndustry={handleAddIndustry}
          onInitiateDeleteIndustry={handleInitiateDeleteIndustry}
        />
      ),
    },
    {
      id: "account-types",
      label: "Account Types",
      icon: Building2,
      badge: `${accountTypes.length}`,
      component: (
        <CompanyAccountTypesSection
          accountTypes={accountTypes}
          newAccountType={newAccountType}
          setNewAccountType={setNewAccountType}
          onAddAccountType={handleAddAccountType}
          onRemoveAccountType={handleRemoveAccountType}
        />
      ),
    },
    {
      id: "fields",
      label: "Company Fields",
      icon: SlidersHorizontal,
      component: (
        <CompanyFieldsSection
          standardFields={standardFields}
          customFields={customFields}
          onToggleStandardField={handleToggleStandardField}
          onOpenAddCustomField={() => setIsAddCustomFieldOpen(true)}
          onRemoveCustomField={handleRemoveCustomField}
        />
      ),
    },
    {
      id: "required",
      label: "Required Fields",
      icon: CheckSquare,
      component: (
        <CompanyRequiredFieldsSection
          requireIndustry={requireIndustry}
          setRequireIndustry={(c) => {
            setRequireIndustry(c);
            setHasChanges(true);
          }}
          requireWebsite={requireWebsite}
          setRequireWebsite={(c) => {
            setRequireWebsite(c);
            setHasChanges(true);
          }}
          requirePhone={requirePhone}
          setRequirePhone={(c) => {
            setRequirePhone(c);
            setHasChanges(true);
          }}
          requireLocation={requireLocation}
          setRequireLocation={(c) => {
            setRequireLocation(c);
            setHasChanges(true);
          }}
          requireAccountType={requireAccountType}
          setRequireAccountType={(c) => {
            setRequireAccountType(c);
            setHasChanges(true);
          }}
        />
      ),
    },
    {
      id: "duplicates",
      label: "Duplicate Rules",
      icon: CopyX,
      component: (
        <CompanyDuplicateRulesSection
          preventDomainDuplicates={preventDomainDuplicates}
          setPreventDomainDuplicates={(c) => {
            setPreventDomainDuplicates(c);
            setHasChanges(true);
          }}
          preventNameDuplicates={preventNameDuplicates}
          setPreventNameDuplicates={(c) => {
            setPreventNameDuplicates(c);
            setHasChanges(true);
          }}
          preventPhoneDuplicates={preventPhoneDuplicates}
          setPreventPhoneDuplicates={(c) => {
            setPreventPhoneDuplicates(c);
            setHasChanges(true);
          }}
          duplicatePolicy={duplicatePolicy}
          setDuplicatePolicy={(val) => {
            setDuplicatePolicy(val);
            setHasChanges(true);
          }}
          onOpenMergeModal={() => setIsMergeModalOpen(true)}
        />
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

      <CompanyIndustryReassignModal
        industryToDelete={industryToDelete}
        onClose={() => setIndustryToDelete(null)}
        industryUsageCounts={industryUsageCounts}
        reassignTargetIndustry={reassignTargetIndustry}
        setReassignTargetIndustry={setReassignTargetIndustry}
        industries={industries}
        isReassigningIndustry={isReassigningIndustry}
        onConfirmReassignAndDelete={handleConfirmReassignAndDeleteIndustry}
      />

      <CompanyCustomFieldModal
        open={isAddCustomFieldOpen}
        onOpenChange={setIsAddCustomFieldOpen}
        newCustomFieldName={newCustomFieldName}
        setNewCustomFieldName={setNewCustomFieldName}
        newCustomFieldType={newCustomFieldType}
        setNewCustomFieldType={setNewCustomFieldType}
        newCustomFieldOptions={newCustomFieldOptions}
        setNewCustomFieldOptions={setNewCustomFieldOptions}
        newCustomFieldRequired={newCustomFieldRequired}
        setNewCustomFieldRequired={setNewCustomFieldRequired}
        onAddCustomField={handleAddCustomField}
      />

      <CompanyMergeModal
        open={isMergeModalOpen}
        onOpenChange={setIsMergeModalOpen}
        companiesList={companiesList}
        mergePrimaryId={mergePrimaryId}
        setMergePrimaryId={setMergePrimaryId}
        mergeSecondaryId={mergeSecondaryId}
        setMergeSecondaryId={setMergeSecondaryId}
        isMerging={isMerging}
        onExecuteMerge={handleExecuteMerge}
      />
    </>
  );
}
