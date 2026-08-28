"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  KeyRound,
  Copy,
  Download,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Building2,
  BellRing,
  FileDown,
  RefreshCw,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CRMCard } from "@/shared/components/crm";
import { PageErrorState } from "@/shared/components/page-states";
import { SecuritySettingsSkeleton } from "./SettingsSkeletons";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { useAuth } from "@/features/auth/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
  getMfaStatus,
  generateRecoveryCodes,
  disableMfa,
  recordMfaAuditEvent,
  updateTenantMfaPolicy,
  RecoveryCodesResponse,
} from "@/shared/lib/api/mfa.api";
import { exportUserData } from "@/shared/lib/api/privacy.api";
import client from "@/shared/lib/api/client";
import { toast } from "sonner";

export default function SecuritySettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "ADMIN" ||
    user?.role === "super_admin" ||
    user?.role === "SUPER_ADMIN";

  // Modals state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState(false);

  // Enrollment flow state
  const [enrollStep, setEnrollStep] = useState<"qr" | "codes" | "verify">("qr");
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [hasConfirmedSavedCodes, setHasConfirmedSavedCodes] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Disable flow state
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Privacy export state
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch Real MFA Status
  const {
    data: mfaStatus,
    isLoading: isMfaLoading,
    error: mfaError,
    refetch: refetchMfa,
  } = useQuery({
    queryKey: ["mfa-status"],
    queryFn: getMfaStatus,
    staleTime: 30000,
  });

  // 2. Fetch Security Notification Preferences
  const {
    data: notificationData,
    isLoading: isNotifLoading,
  } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const res = await client.get<{ success: boolean; data: any }>("/crm/settings/notifications");
      return res.data.data;
    },
    staleTime: 30000,
  });

  // Organization MFA Policy Mutation
  const policyMutation = useMutation({
    mutationFn: (policy: "OPTIONAL" | "REQUIRED") => updateTenantMfaPolicy(policy),
    onSuccess: (data) => {
      toast.success(data?.message || "Organization MFA policy updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to update organization MFA policy"
      );
    },
  });

  // Notification Preference Mutation
  const notifMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await client.patch<{ success: boolean; data: any }>("/crm/settings/notifications", {
        securityAlerts: enabled,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Security notification preference updated");
      void queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to update notification settings"
      );
    },
  });

  // Start Enrollment Wizard Flow
  const handleStartEnrollment = async () => {
    try {
      setEnrollLoading(true);
      setEnrollError(null);
      setEnrollStep("qr");
      setVerifyOtp("");
      setHasConfirmedSavedCodes(false);
      const supabase = createClient();

      // 1. Enroll TOTP factor in Supabase Auth
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "ClixProCRM Authenticator",
      });

      if (enrollErr || !data) {
        throw new Error(enrollErr?.message || "Failed to initialize 2FA enrollment");
      }

      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });

      // 2. Generate backup recovery codes
      const recoveryRes: RecoveryCodesResponse = await generateRecoveryCodes();
      setGeneratedCodes(recoveryRes.recoveryCodes || []);

      setShowEnrollModal(true);
    } catch (err: any) {
      const msg = err?.message || "Could not start 2FA setup. Please try again.";
      setEnrollError(msg);
      toast.error(msg);
    } finally {
      setEnrollLoading(false);
    }
  };

  // Complete Enrollment Verification
  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData || !verifyOtp.trim()) return;

    try {
      setEnrollLoading(true);
      setEnrollError(null);
      const supabase = createClient();

      const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: verifyOtp.trim(),
      });

      if (verifyErr || !data) {
        await recordMfaAuditEvent("MFA_CHALLENGE_FAILED", {
          factorId: enrollData.factorId,
          error: verifyErr?.message,
        }).catch(() => {});
        throw new Error(verifyErr?.message || "Invalid authentication code. Please check and try again.");
      }

      // Record successful enrollment in audit log
      await recordMfaAuditEvent("MFA_ENROLLED", {
        factorId: enrollData.factorId,
      }).catch(() => {});

      toast.success("Two-Factor Authentication activated successfully!");
      await queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
      setShowEnrollModal(false);
    } catch (err: any) {
      setEnrollError(err?.message || "Verification failed. Please check the code in your authenticator app.");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Handle Disable MFA Flow
  const handleDisableMfa = async () => {
    try {
      setDisableLoading(true);
      setDisableError(null);

      await disableMfa();
      toast.success("Two-Factor Authentication disabled.");
      await queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
      setShowDisableModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to disable 2FA.";
      setDisableError(msg);
      toast.error(msg);
    } finally {
      setDisableLoading(false);
    }
  };

  // Handle Regenerating Recovery Codes
  const handleRegenerateCodes = async () => {
    try {
      setEnrollLoading(true);
      const res = await generateRecoveryCodes();
      setGeneratedCodes(res.recoveryCodes || []);
      setShowRegenerateConfirmModal(false);
      setShowRecoveryModal(true);
      toast.success("Fresh backup recovery codes generated.");
      await queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to generate backup codes");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Handle Real Privacy Data Export
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await exportUserData();

      // Trigger browser download of real JSON payload
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `clixprocrm-personal-data-${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Personal data archive exported successfully.");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to export personal data archive."
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Copy helper
  const handleCopyCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join("\n"));
    setCopiedCodes(true);
    toast.success("Recovery codes copied to clipboard");
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  // Download helper
  const handleDownloadCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedCodes.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "clixprocrm-recovery-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isMfaLoading) {
    return <SecuritySettingsSkeleton />;
  }

  if (mfaError) {
    return (
      <PageErrorState
        title="Security settings unavailable"
        message={(mfaError as Error).message}
        onRetry={() => {
          void refetchMfa();
        }}
      />
    );
  }

  const isMfaActive = mfaStatus?.hasVerifiedFactor === true;
  const isOrgEnforced = mfaStatus?.isEnforcedByOrg === true;
  const recoveryCodesLeft = mfaStatus?.recoveryCodesRemaining ?? 0;
  const securityAlertsEnabled = notificationData?.securityAlerts ?? true;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-1">
        <h3 className="text-base font-bold tracking-tight text-foreground">Security & Privacy</h3>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          Manage account two-factor verification, organization security policies, and personal privacy controls.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Account Security (2FA) */}
        <CRMCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight text-foreground">Two-Factor Authentication</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">TOTP authenticator app verification</p>
                </div>
              </div>
              <Badge
                variant={isMfaActive ? "default" : "secondary"}
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                  isMfaActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : ""
                }`}
              >
                {isMfaActive ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-foreground">
                    {isMfaActive ? "Authenticator Protection Active" : "Protect Your Account with 2FA"}
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    {isMfaActive
                      ? "Your account requires a 6-digit TOTP verification code from your authenticator app (Google Authenticator, Authy, or 1Password) during login."
                      : "Add an extra layer of protection. In addition to your password, you will need to enter a 6-digit code from your authenticator app."}
                  </p>
                </div>
              </div>

              {isOrgEnforced && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Two-factor authentication is required by your workspace security policy.</span>
                </div>
              )}

              {isMfaActive && (
                <div className="flex items-center justify-between pt-2 text-xs border-t border-border/40">
                  <span className="text-muted-foreground font-medium">Backup Recovery Codes:</span>
                  <Badge variant="outline" className="text-[10px] font-bold font-mono">
                    {recoveryCodesLeft} Available
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 flex items-center gap-3 border-t border-border/50">
            {isMfaActive ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerateConfirmModal(true)}
                  className="font-bold text-xs gap-1.5 h-8.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Regenerate Backup Codes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisableModal(true)}
                  className="font-bold text-xs gap-1.5 h-8.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Disable 2FA
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartEnrollment}
                disabled={enrollLoading}
                className="font-bold text-xs gap-2 h-8.5"
              >
                {enrollLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <QrCode className="w-3.5 h-3.5" />
                )}
                Enable 2FA
              </Button>
            )}
          </div>
        </CRMCard>

        {/* 2. Workspace Security Policy (Admins Only) */}
        {isAdmin ? (
          <CRMCard className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-tight text-foreground">Organization MFA Policy</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">Workspace-wide authentication rule</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 text-primary border-primary/20 bg-primary/5">
                  Admin Policy
                </Badge>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-foreground">MFA Enforcement Level</h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Select whether workspace members can optionally configure 2FA or are strictly required to use it.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => policyMutation.mutate("OPTIONAL")}
                    disabled={policyMutation.isPending}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      mfaStatus?.orgMfaPolicy === "OPTIONAL"
                        ? "border-primary bg-primary/5 text-foreground shadow-sm"
                        : "border-border/60 hover:border-border text-muted-foreground bg-background/50"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center justify-between">
                      Optional MFA
                      {mfaStatus?.orgMfaPolicy === "OPTIONAL" && (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground leading-snug">
                      Members choose whether to enable 2FA on their own account.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => policyMutation.mutate("REQUIRED")}
                    disabled={policyMutation.isPending}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      mfaStatus?.orgMfaPolicy === "REQUIRED"
                        ? "border-primary bg-primary/5 text-foreground shadow-sm"
                        : "border-border/60 hover:border-border text-muted-foreground bg-background/50"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center justify-between">
                      Required MFA
                      {mfaStatus?.orgMfaPolicy === "REQUIRED" && (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground leading-snug">
                      Mandatory two-factor enrollment for all workspace members.
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary" />
                Changes apply instantly across all member sessions.
              </span>
              {policyMutation.isPending && (
                <span className="flex items-center gap-1 text-primary font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
            </div>
          </CRMCard>
        ) : (
          /* Non-Admin Informational Card */
          <CRMCard className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-tight text-foreground">Workspace Policy</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">Organization security status</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {mfaStatus?.orgMfaPolicy === "REQUIRED" ? "MFA Required" : "MFA Optional"}
                </Badge>
              </div>

              <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-2">
                <h5 className="text-xs font-bold text-foreground">
                  {mfaStatus?.orgMfaPolicy === "REQUIRED"
                    ? "Organization-Wide MFA Requirement"
                    : "Standard Workspace Policy"}
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  {mfaStatus?.orgMfaPolicy === "REQUIRED"
                    ? "Your workspace administrator has mandated two-factor authentication for all team members to protect CRM data."
                    : "Two-factor authentication is optional for your workspace. You may enable it independently for enhanced personal account safety."}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 text-[11px] text-muted-foreground border-t border-border/50">
              Contact your workspace administrator to modify organization policies.
            </div>
          </CRMCard>
        )}
      </div>

      {/* 3. Security Notifications & 4. Privacy and Data */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Security Notifications Card */}
        <CRMCard>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-foreground">Security Notifications</h4>
                <p className="text-[11px] text-muted-foreground font-medium">Automated login and verification alerts</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-foreground">Security & Login Alerts</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Receive instant email and in-app alerts for unrecognized device logins, password modifications, and MFA state changes.
              </p>
            </div>
            <Switch
              checked={securityAlertsEnabled}
              onCheckedChange={(checked) => notifMutation.mutate(checked)}
              disabled={isNotifLoading || notifMutation.isPending}
            />
          </div>
        </CRMCard>

        {/* Privacy & Data Card */}
        <CRMCard>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-foreground">Privacy & Personal Data</h4>
                <p className="text-[11px] text-muted-foreground font-medium">Data portability and GDPR / DPDP records</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-foreground">Export Personal Account Data</h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Download a machine-readable JSON archive of your personal profile, activity history, and security metadata.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={isExporting}
              className="font-bold text-xs gap-1.5 h-8.5 shrink-0"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isExporting ? "Exporting..." : "Export My Data"}
            </Button>
          </div>
        </CRMCard>
      </div>

      {/* 2FA Enrollment Wizard Modal */}
      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent className="sm:max-w-lg border-border bg-card">
          <DialogHeader className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-1 text-primary">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Scan the QR code with your authenticator app and save your recovery codes.
            </DialogDescription>
          </DialogHeader>

          {enrollError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{enrollError}</span>
            </div>
          )}

          {enrollStep === "qr" && (
            <div className="space-y-4 pt-1">
              <div className="p-4 bg-muted/40 rounded-xl border border-border/60 flex flex-col items-center justify-center gap-3 text-center">
                {enrollData?.qrCode ? (
                  <div className="p-3 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    {enrollData.qrCode.startsWith("data:") ||
                    enrollData.qrCode.startsWith("http://") ||
                    enrollData.qrCode.startsWith("https://") ? (
                      <img
                        src={enrollData.qrCode}
                        alt="2FA QR Code"
                        className="w-44 h-44 object-contain"
                      />
                    ) : enrollData.qrCode.trim().startsWith("<svg") ? (
                      <div
                        className="w-44 h-44 [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: enrollData.qrCode }}
                      />
                    ) : (
                      <img
                        src={`data:image/svg+xml;utf-8,${encodeURIComponent(enrollData.qrCode)}`}
                        alt="2FA QR Code"
                        className="w-44 h-44 object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-foreground">Scan with Google Authenticator or 1Password</p>
                  <p className="text-[10px] text-muted-foreground">
                    Or enter this manual secret key into your app:
                  </p>
                  {enrollData?.secret && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <code className="px-2 py-1 bg-background rounded border text-[11px] font-mono font-bold tracking-wider">
                        {enrollData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(enrollData.secret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                        className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
                      >
                        {copiedSecret ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSecret ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowEnrollModal(false)} className="h-9">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setEnrollStep("codes")}
                  className="font-bold text-xs gap-1.5 h-9"
                >
                  Next: Backup Codes
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {enrollStep === "codes" && (
            <div className="space-y-4 pt-1">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-300 text-xs font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Save your backup recovery codes
                </p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  If you lose access to your authenticator device, you will need these single-use codes to regain access.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
                {generatedCodes.map((c, i) => (
                  <div
                    key={i}
                    className="p-1.5 px-2.5 bg-background rounded border text-xs font-mono font-bold tracking-wider text-center"
                  >
                    {c}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-border/50">
                <input
                  type="checkbox"
                  id="confirmSavedCodes"
                  checked={hasConfirmedSavedCodes}
                  onChange={(e) => setHasConfirmedSavedCodes(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label
                  htmlFor="confirmSavedCodes"
                  className="text-xs font-medium text-foreground cursor-pointer select-none"
                >
                  I have safely stored these recovery codes
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyCodes} className="font-bold text-xs gap-1 h-8">
                    {copiedCodes ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCodes ? "Copied All" : "Copy Codes"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadCodes} className="font-bold text-xs gap-1 h-8">
                    <Download className="w-3.5 h-3.5" />
                    Download .txt
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => setEnrollStep("verify")}
                  disabled={!hasConfirmedSavedCodes}
                  className="font-bold text-xs gap-1.5 h-8"
                >
                  Next: Verify Code
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {enrollStep === "verify" && (
            <form onSubmit={handleConfirmEnrollment} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Enter 6-digit confirmation code from your app
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value)}
                  maxLength={6}
                  autoFocus
                  className="text-center text-lg tracking-widest font-mono font-bold h-11"
                  required
                />
              </div>

              <div className="flex justify-between items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEnrollStep("codes")}
                  className="h-9 font-bold text-xs"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={enrollLoading || verifyOtp.trim().length !== 6}
                  className="font-bold text-xs gap-2 h-9"
                >
                  {enrollLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Verify & Activate 2FA
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Confirmation Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Disabling 2FA removes the TOTP requirement and invalidates all active recovery codes. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>

          {disableError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium">
              {disableError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowDisableModal(false)} className="h-9">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisableMfa}
              disabled={disableLoading}
              className="font-bold text-xs gap-1.5 h-9"
            >
              {disableLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Confirm & Disable
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Recovery Codes Confirmation Modal */}
      <Dialog open={showRegenerateConfirmModal} onOpenChange={setShowRegenerateConfirmModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Regenerate Backup Recovery Codes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Generating new backup codes will permanently invalidate all previously generated codes. Make sure to save the new codes.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRegenerateConfirmModal(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRegenerateCodes}
              disabled={enrollLoading}
              className="font-bold text-xs gap-1.5 h-9"
            >
              {enrollLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Regenerate Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Fresh Recovery Codes Modal */}
      <Dialog open={showRecoveryModal} onOpenChange={setShowRecoveryModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              New Backup Recovery Codes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Store these single-use recovery codes in a secure location. Each code can be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
            {generatedCodes.map((c, i) => (
              <div
                key={i}
                className="p-1.5 px-2.5 bg-background rounded border text-xs font-mono font-bold tracking-wider text-center"
              >
                {c}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyCodes} className="font-bold text-xs gap-1 h-8">
                {copiedCodes ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCodes ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCodes} className="font-bold text-xs gap-1 h-8">
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
            </div>
            <Button size="sm" onClick={() => setShowRecoveryModal(false)} className="font-bold text-xs h-8">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
