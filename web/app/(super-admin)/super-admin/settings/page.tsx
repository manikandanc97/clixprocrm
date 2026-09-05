"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Settings,
  Sliders,
  Building2,
  Server,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Coins,
} from "lucide-react";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
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
  CRMPageContainer,
  CRMPageHeader,
} from "@/shared/components/crm";
import { compareFormValues } from "@/shared/hooks/use-dirty-form";

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹) - Indian Rupee" },
  { value: "USD", label: "USD ($) - US Dollar" },
  { value: "EUR", label: "EUR (€) - Euro" },
  { value: "GBP", label: "GBP (£) - British Pound" },
  { value: "AED", label: "AED (د.إ) - UAE Dirham" },
  { value: "SGD", label: "SGD (S$) - Singapore Dollar" },
  { value: "CAD", label: "CAD (C$) - Canadian Dollar" },
  { value: "AUD", label: "AUD (A$) - Australian Dollar" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST - UTC+05:30)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time - UTC+00:00)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT - UTC-05:00)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT - UTC-06:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT - UTC-08:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST - UTC+00:00)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST - UTC+01:00)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST - UTC+01:00)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST - UTC+04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT - UTC+08:00)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST - UTC+09:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT - UTC+10:00)" },
];

interface FormState {
  platformName: string;
  defaultTenantPlan: string;
  defaultCurrency: string;
  defaultTimezone: string;
  allowPublicRegistrations: boolean;
  requireEmailVerification: boolean;
  allowWorkspaceSelfRegistration: boolean;
  maintenanceMode: boolean;
}

export default function SuperAdminSettingsPage() {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [initialFormState, setInitialFormState] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  // Form State
  const [platformName, setPlatformName] = useState("ClixProCRM");
  const [defaultTenantPlan, setDefaultTenantPlan] = useState("free");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [defaultTimezone, setDefaultTimezone] = useState("Asia/Kolkata");
  const [allowPublicRegistrations, setAllowPublicRegistrations] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [allowWorkspaceSelfRegistration, setAllowWorkspaceSelfRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const currentFormState = useMemo<FormState>(
    () => ({
      platformName,
      defaultTenantPlan,
      defaultCurrency,
      defaultTimezone,
      allowPublicRegistrations,
      requireEmailVerification,
      allowWorkspaceSelfRegistration,
      maintenanceMode,
    }),
    [
      platformName,
      defaultTenantPlan,
      defaultCurrency,
      defaultTimezone,
      allowPublicRegistrations,
      requireEmailVerification,
      allowWorkspaceSelfRegistration,
      maintenanceMode,
    ]
  );

  const isDirty = useMemo(() => {
    if (!initialFormState) return false;
    return !compareFormValues(initialFormState, currentFormState);
  }, [initialFormState, currentFormState]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformSettings();
      setSettingsData(res);

      const general = res?.general || res?.platform || {};
      const reg = res?.workspaceRegistration || res?.platform || {};

      const loaded: FormState = {
        platformName: general?.name || "ClixProCRM",
        defaultTenantPlan: general?.defaultTenantPlan || "free",
        defaultCurrency: general?.defaultCurrency || "INR",
        defaultTimezone: general?.defaultTimezone || "Asia/Kolkata",
        allowPublicRegistrations: reg?.allowPublicRegistrations ?? true,
        requireEmailVerification: reg?.requireEmailVerification ?? false,
        allowWorkspaceSelfRegistration: reg?.allowWorkspaceSelfRegistration ?? true,
        maintenanceMode: reg?.maintenanceMode ?? false,
      };

      setPlatformName(loaded.platformName);
      setDefaultTenantPlan(loaded.defaultTenantPlan);
      setDefaultCurrency(loaded.defaultCurrency);
      setDefaultTimezone(loaded.defaultTimezone);
      setAllowPublicRegistrations(loaded.allowPublicRegistrations);
      setRequireEmailVerification(loaded.requireEmailVerification);
      setAllowWorkspaceSelfRegistration(loaded.allowWorkspaceSelfRegistration);
      setMaintenanceMode(loaded.maintenanceMode);
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

  const handleMaintenanceToggle = (checked: boolean) => {
    if (checked) {
      // Opening maintenance mode requires confirmation modal
      setMaintenanceModalOpen(true);
    } else {
      // Disabling maintenance mode can proceed immediately
      setMaintenanceMode(false);
    }
  };

  const confirmEnableMaintenance = () => {
    setMaintenanceMode(true);
    setMaintenanceModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || !initialFormState) return;

    try {
      setSaving(true);

      // Extract changed settings only
      const payload: Record<string, any> = {};
      const generalPayload: Record<string, any> = {};
      const regPayload: Record<string, any> = {};

      if (platformName !== initialFormState.platformName) {
        generalPayload.name = platformName;
      }
      if (defaultTenantPlan !== initialFormState.defaultTenantPlan) {
        generalPayload.defaultTenantPlan = defaultTenantPlan;
      }
      if (defaultCurrency !== initialFormState.defaultCurrency) {
        generalPayload.defaultCurrency = defaultCurrency;
      }
      if (defaultTimezone !== initialFormState.defaultTimezone) {
        generalPayload.defaultTimezone = defaultTimezone;
      }

      if (allowPublicRegistrations !== initialFormState.allowPublicRegistrations) {
        regPayload.allowPublicRegistrations = allowPublicRegistrations;
      }
      if (requireEmailVerification !== initialFormState.requireEmailVerification) {
        regPayload.requireEmailVerification = requireEmailVerification;
      }
      if (allowWorkspaceSelfRegistration !== initialFormState.allowWorkspaceSelfRegistration) {
        regPayload.allowWorkspaceSelfRegistration = allowWorkspaceSelfRegistration;
      }
      if (maintenanceMode !== initialFormState.maintenanceMode) {
        regPayload.maintenanceMode = maintenanceMode;
      }

      if (Object.keys(generalPayload).length > 0) {
        payload.general = generalPayload;
      }
      if (Object.keys(regPayload).length > 0) {
        payload.workspaceRegistration = regPayload;
      }

      const res = await updatePlatformSettings(payload);

      if (res?.success || res?.data) {
        const updatedGeneral = res?.data?.general || res?.data?.platform || {};
        const updatedReg = res?.data?.workspaceRegistration || res?.data?.platform || {};

        const updatedState: FormState = {
          platformName: updatedGeneral?.name ?? platformName,
          defaultTenantPlan: updatedGeneral?.defaultTenantPlan ?? defaultTenantPlan,
          defaultCurrency: updatedGeneral?.defaultCurrency ?? defaultCurrency,
          defaultTimezone: updatedGeneral?.defaultTimezone ?? defaultTimezone,
          allowPublicRegistrations: updatedReg?.allowPublicRegistrations ?? allowPublicRegistrations,
          requireEmailVerification: updatedReg?.requireEmailVerification ?? requireEmailVerification,
          allowWorkspaceSelfRegistration: updatedReg?.allowWorkspaceSelfRegistration ?? allowWorkspaceSelfRegistration,
          maintenanceMode: updatedReg?.maintenanceMode ?? maintenanceMode,
        };

        setInitialFormState(updatedState);
        toast.success("Platform settings saved successfully.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update platform settings.");
    } finally {
      setSaving(false);
    }
  };

  const availablePlans = useMemo(() => {
    if (settingsData?.availablePlans && Array.isArray(settingsData.availablePlans)) {
      return settingsData.availablePlans;
    }
    return [
      { id: "free", name: "Free", price: "₹0" },
      { id: "starter", name: "Starter", price: "₹999" },
      { id: "pro", name: "Professional", price: "₹2,499" },
      { id: "enterprise", name: "Enterprise", price: "Custom" },
    ];
  }, [settingsData]);

  const systemInfo = useMemo(() => {
    return {
      platformVersion: settingsData?.systemInfo?.platformVersion || "2.4.0",
      apiVersion: settingsData?.systemInfo?.apiVersion || "2.4.0",
      platformStatus: settingsData?.systemInfo?.platformStatus || "Operational",
      databaseStatus: settingsData?.systemInfo?.databaseStatus || "Connected",
      environment: settingsData?.systemInfo?.environment || "Development",
    };
  }, [settingsData]);

  return (
    <CRMPageContainer>
      {/* Page Header */}
      <CRMPageHeader
        title="Platform Settings"
        subtitle="Global application configuration and platform-wide defaults."
        icon={Settings}
        badge="System Configuration"
      />

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 pb-12">
          {/* 1. GENERAL PLATFORM */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                <span>GENERAL PLATFORM</span>
              </h3>
              <span className="text-[11px] font-medium text-muted-foreground">
                Core system defaults
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Platform Name */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="platformName" className="text-xs font-semibold">
                  Platform Name
                </Label>
                <Input
                  id="platformName"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="ClixProCRM"
                  className="h-10 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Default New Workspace Plan */}
              <div className="space-y-1.5">
                <Label htmlFor="defaultPlan" className="text-xs font-semibold">
                  Default New Workspace Plan
                </Label>
                <select
                  id="defaultPlan"
                  value={defaultTenantPlan}
                  onChange={(e) => setDefaultTenantPlan(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                >
                  {availablePlans.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} {plan.price ? `(${plan.price})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Assigned to newly registered organizations automatically.
                </p>
              </div>

              {/* Default Currency */}
              <div className="space-y-1.5">
                <Label htmlFor="defaultCurrency" className="text-xs font-semibold flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Default Currency</span>
                </Label>
                <select
                  id="defaultCurrency"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Base standard currency for subscriptions and tenant invoices.
                </p>
              </div>

              {/* Default Timezone */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="defaultTimezone" className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Default Timezone</span>
                </Label>
                <select
                  id="defaultTimezone"
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                >
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Default schedule and telemetry timestamp timezone for new workspaces.
                </p>
              </div>
            </div>
          </div>

          {/* 2. WORKSPACE & REGISTRATION */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span>WORKSPACE & REGISTRATION</span>
              </h3>
              <span className="text-[11px] font-medium text-muted-foreground">
                Access controls & lifecycle
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Allow Public Registration */}
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="allowPublicReg"
                  checked={allowPublicRegistrations}
                  onCheckedChange={(c) => setAllowPublicRegistrations(c === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="allowPublicReg" className="text-xs font-bold cursor-pointer">
                    Allow Public Registration
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Allow new users to create accounts through the public registration flow.
                  </p>
                </div>
              </div>

              {/* Require Email Verification */}
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="requireEmailVerif"
                  checked={requireEmailVerification}
                  onCheckedChange={(c) => setRequireEmailVerification(c === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="requireEmailVerif" className="text-xs font-bold cursor-pointer">
                    Require Email Verification
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Require new users to verify their email before accessing the platform.
                  </p>
                </div>
              </div>

              {/* Allow Workspace Self-Registration */}
              <div className="flex items-start space-x-3 p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="allowSelfReg"
                  checked={allowWorkspaceSelfRegistration}
                  onCheckedChange={(c) => setAllowWorkspaceSelfRegistration(c === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="allowSelfReg" className="text-xs font-bold cursor-pointer">
                    Allow Workspace Self-Registration
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Allow eligible users to create their own CRM workspace.
                  </p>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className={`flex items-start space-x-3 p-4 rounded-xl border transition-colors ${
                maintenanceMode
                  ? "bg-rose-500/10 border-rose-500/30"
                  : "bg-muted/30 border-border/40 hover:bg-muted/50"
              }`}>
                <Checkbox
                  id="maintenanceMode"
                  checked={maintenanceMode}
                  onCheckedChange={(c) => handleMaintenanceToggle(c === true)}
                  className={`mt-0.5 ${maintenanceMode ? "data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600" : ""}`}
                />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="maintenanceMode"
                      className={`text-xs font-bold cursor-pointer ${
                        maintenanceMode ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                      }`}
                    >
                      Maintenance Mode
                    </Label>
                    {maintenanceMode && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Temporarily restrict tenant access during platform maintenance. Super Administrators retain full system access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. SYSTEM INFORMATION (Read-only) */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600" />
                <span>SYSTEM INFORMATION</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                Read-Only Telemetry
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {/* Platform Version */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Platform Version
                </p>
                <p className="text-sm font-black text-foreground mt-1">
                  v{systemInfo.platformVersion}
                </p>
              </div>

              {/* API Version */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  API Version
                </p>
                <p className="text-sm font-black text-foreground mt-1">
                  v{systemInfo.apiVersion}
                </p>
              </div>

              {/* Platform Status */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Platform Status
                </p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{systemInfo.platformStatus}</span>
                </p>
              </div>

              {/* Database Status */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Database Status
                </p>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{systemInfo.databaseStatus}</span>
                </p>
              </div>

              {/* Current Environment */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Current Environment
                </p>
                <p className="text-sm font-black text-foreground mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                    {systemInfo.environment}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved configuration changes
                </span>
              ) : (
                <span className="text-muted-foreground">All platform settings are up to date.</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isDirty || saving}
              className={`rounded-xl gap-2 font-bold shadow-md text-xs px-6 h-10 transition-all ${
                !isDirty || saving
                  ? "opacity-50 cursor-not-allowed bg-emerald-600/50 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Maintenance Mode Confirmation Modal */}
      <Dialog open={maintenanceModalOpen} onOpenChange={setMaintenanceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Enable Global Maintenance Mode?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This is a sensitive platform-wide action.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-foreground space-y-2">
            <p className="font-semibold text-rose-600 dark:text-rose-400">
              Immediate Impact on Tenants:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>All tenant organization dashboard access will be restricted.</li>
              <li>Active tenant user operations will be temporarily paused.</li>
              <li>Super Administrators will retain full access to manage platform operations.</li>
              <li>This action will be recorded in sealed security audit logs.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMaintenanceModalOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmEnableMaintenance}
              className="text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Enable Maintenance Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CRMPageContainer>
  );
}
