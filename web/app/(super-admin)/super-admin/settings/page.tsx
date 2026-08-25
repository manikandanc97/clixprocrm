"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Settings,
  Shield,
  Sliders,
  Server,
  Save,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { toast } from "sonner";
import {
  CRMPageContainer,
  CRMPageHeader,
} from "@/shared/components/crm";
import { compareFormValues } from "@/shared/hooks/use-dirty-form";

export default function SuperAdminSettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [initialFormState, setInitialFormState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [platformName, setPlatformName] = useState("ClixProCRM Multi-Tenant Platform");
  const [defaultTenantPlan, setDefaultTenantPlan] = useState("free");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowPublicRegistrations, setAllowPublicRegistrations] = useState(true);
  const [aiCopilotEnabled, setAiCopilotEnabled] = useState(true);
  const [documentRagEnabled, setDocumentRagEnabled] = useState(true);
  const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(true);

  const currentFormState = useMemo(() => ({
    platformName,
    defaultTenantPlan,
    maintenanceMode,
    allowPublicRegistrations,
    aiCopilotEnabled,
    documentRagEnabled,
    multiCurrencyEnabled,
  }), [
    platformName,
    defaultTenantPlan,
    maintenanceMode,
    allowPublicRegistrations,
    aiCopilotEnabled,
    documentRagEnabled,
    multiCurrencyEnabled,
  ]);

  const isDirty = useMemo(() => {
    if (!initialFormState) return false;
    return !compareFormValues(initialFormState, currentFormState);
  }, [initialFormState, currentFormState]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformSettings();
      setSettingsData(res);
      const loaded = {
        platformName: res?.platform?.name || "ClixProCRM Multi-Tenant Platform",
        defaultTenantPlan: res?.platform?.defaultTenantPlan || "free",
        maintenanceMode: res?.platform?.maintenanceMode || false,
        allowPublicRegistrations: res?.platform?.allowPublicRegistrations ?? true,
        aiCopilotEnabled: res?.features?.aiCopilot ?? true,
        documentRagEnabled: res?.features?.documentRag ?? true,
        multiCurrencyEnabled: res?.features?.multiCurrency ?? true,
      };
      setPlatformName(loaded.platformName);
      setDefaultTenantPlan(loaded.defaultTenantPlan);
      setMaintenanceMode(loaded.maintenanceMode);
      setAllowPublicRegistrations(loaded.allowPublicRegistrations);
      setAiCopilotEnabled(loaded.aiCopilotEnabled);
      setDocumentRagEnabled(loaded.documentRagEnabled);
      setMultiCurrencyEnabled(loaded.multiCurrencyEnabled);
      setInitialFormState(loaded);
    } catch (err: any) {
      toast.error("Failed to load platform settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    try {
      setSaving(true);
      await updatePlatformSettings({
        platform: {
          name: platformName,
          defaultTenantPlan,
          maintenanceMode,
          allowPublicRegistrations,
        },
        features: {
          aiCopilot: aiCopilotEnabled,
          documentRag: documentRagEnabled,
          multiCurrency: multiCurrencyEnabled,
        },
      });
      setInitialFormState(currentFormState);
      toast.success("Platform settings saved successfully.");
    } catch (err: any) {
      toast.error("Failed to update platform settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CRMPageContainer>
      {/* 1. Standard CRM Page Header */}
      <CRMPageHeader
        title="Platform Settings"
        subtitle="Global application configuration, environment settings, and multi-tenant feature toggles."
        icon={Settings}
        badge="System Configuration"
        actions={[
          {
            label: "Refresh",
            icon: RefreshCw,
            onClick: loadSettings,
            variant: "outline",
          },
        ]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Platform Config */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <span>General Platform Parameters</span>
          </h3>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="platformName" className="text-xs font-semibold">
                Platform Display Name
              </Label>
              <Input
                id="platformName"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="h-10 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="defaultPlan" className="text-xs font-semibold">
                  Default New Organization Tier
                </Label>
                <select
                  id="defaultPlan"
                  value={defaultTenantPlan}
                  onChange={(e) => setDefaultTenantPlan(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                >
                  <option value="free">Free Sandbox</option>
                  <option value="starter">Starter Growth</option>
                  <option value="pro">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Platform Runtime Environment
                </Label>
                <Input
                  disabled
                  value={settingsData?.platform?.environment?.toUpperCase() || "DEVELOPMENT"}
                  className="h-10 rounded-xl bg-muted/60 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Tenant Feature Flags */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <span>Global Feature Matrix</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
              <Checkbox
                id="aiCopilot"
                checked={aiCopilotEnabled}
                onCheckedChange={(c) => setAiCopilotEnabled(c === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="aiCopilot" className="text-xs font-bold cursor-pointer">
                  AI Copilot & Summarizer
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Global LLM pipeline for smart summaries and lead scoring.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
              <Checkbox
                id="docRag"
                checked={documentRagEnabled}
                onCheckedChange={(c) => setDocumentRagEnabled(c === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="docRag" className="text-xs font-bold cursor-pointer">
                  Document RAG Engine
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Vector search for quotations, PDFs, and customer files.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
              <Checkbox
                id="multiCurrency"
                checked={multiCurrencyEnabled}
                onCheckedChange={(c) => setMultiCurrencyEnabled(c === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="multiCurrency" className="text-xs font-bold cursor-pointer">
                  Multi-Currency Engine
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Dynamic currency conversions across international tenants.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Security & Availability Flags */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>System Access & Availability</span>
          </h3>

          <div className="space-y-3 pt-1">
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
              <Checkbox
                id="publicReg"
                checked={allowPublicRegistrations}
                onCheckedChange={(c) => setAllowPublicRegistrations(c === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="publicReg" className="text-xs font-bold cursor-pointer">
                  Allow Public Organization Registrations
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  When enabled, new users can sign up and self-provision workspaces through the public /register portal.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
              <Checkbox
                id="maintenance"
                checked={maintenanceMode}
                onCheckedChange={(c) => setMaintenanceMode(c === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="maintenance" className="text-xs font-bold cursor-pointer text-rose-500">
                  Global Maintenance Mode
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Restricts non-super-admin access across all tenant dashboards during scheduled platform maintenance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Diagnostics */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-600" />
            <span>System Health & Diagnostics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-center">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                API Version
              </p>
              <p className="text-base font-black text-foreground mt-1">
                {settingsData?.platform?.version || "2.4.0"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Platform Status
              </p>
              <p className="text-base font-black text-emerald-500 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Operational
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                Super Admins
              </p>
              <p className="text-base font-black text-emerald-600 mt-1">
                {settingsData?.stats?.superAdminCount || 1}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={!isDirty || saving}
            className={`rounded-xl gap-2 font-bold shadow-md text-xs px-6 h-10 transition-all ${
              !isDirty || saving
                ? "opacity-50 cursor-not-allowed bg-emerald-600/50 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            }`}
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Changes..." : "Save Platform Settings"}</span>
          </Button>
        </div>
      </form>
    </CRMPageContainer>
  );
}
