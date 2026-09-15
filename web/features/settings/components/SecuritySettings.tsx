"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageErrorState } from "@/shared/components/crm/PageFeedbackStates";
import { SecuritySettingsSkeleton } from "./SettingsSkeletons";
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
import type { NotificationSettingsDataType } from "@/shared/types/settings";

import { MfaAccountCard } from "./security/MfaAccountCard";
import { MfaPolicyCard } from "./security/MfaPolicyCard";
import { SecurityPreferencesCards } from "./security/SecurityPreferencesCards";
import { MfaEnrollModal } from "./security/MfaEnrollModal";
import {
  DisableMfaModal,
  RegenerateConfirmModal,
  RecoveryCodesModal,
} from "./security/MfaRecoveryModals";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const candidate = err as { response?: { data?: { message?: string } }; message?: string };
    return candidate.response?.data?.message || candidate.message || fallback;
  }
  return fallback;
}

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
      const res = await client.get<{ success: boolean; data: NotificationSettingsDataType }>("/crm/settings/notifications");
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
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to update organization MFA policy"));
    },
  });

  // Notification Preference Mutation
  const notifMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await client.patch<{ success: boolean; data: NotificationSettingsDataType }>("/crm/settings/notifications", {
        securityAlerts: enabled,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Security notification preference updated");
      void queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to update notification settings"));
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
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Could not start 2FA setup. Please try again.");
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
    } catch (err: unknown) {
      setEnrollError(extractErrorMessage(err, "Verification failed. Please check the code in your authenticator app."));
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
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to disable 2FA.");
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
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to generate backup codes"));
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
    } catch (err: unknown) {
      toast.error(
        extractErrorMessage(err, "Failed to export personal data archive.")
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
    <div className="space-y-6 min-h-full flex flex-col">
      {/* Section Header */}
      <div className="pb-1">
        <h3 className="text-base font-bold tracking-tight text-foreground">Security &amp; Privacy</h3>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          Manage account two-factor verification, organization security policies, and personal privacy controls.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Account Security (2FA) */}
        <MfaAccountCard
          isMfaActive={isMfaActive}
          isOrgEnforced={isOrgEnforced}
          recoveryCodesLeft={recoveryCodesLeft}
          enrollLoading={enrollLoading}
          handleStartEnrollment={handleStartEnrollment}
          setShowRegenerateConfirmModal={setShowRegenerateConfirmModal}
          setShowDisableModal={setShowDisableModal}
        />

        {/* 2. Workspace Security Policy */}
        <MfaPolicyCard
          isAdmin={isAdmin}
          mfaStatus={mfaStatus}
          isPolicyPending={policyMutation.isPending}
          onUpdatePolicy={(policy) => policyMutation.mutate(policy)}
        />
      </div>

      {/* 3. Security Notifications & 4. Privacy and Data */}
      <SecurityPreferencesCards
        securityAlertsEnabled={securityAlertsEnabled}
        onToggleSecurityAlerts={(checked) => notifMutation.mutate(checked)}
        isNotifLoading={isNotifLoading}
        isNotifPending={notifMutation.isPending}
        isExporting={isExporting}
        handleExportData={handleExportData}
      />

      {/* 2FA Enrollment Wizard Modal */}
      <MfaEnrollModal
        showEnrollModal={showEnrollModal}
        setShowEnrollModal={setShowEnrollModal}
        enrollStep={enrollStep}
        setEnrollStep={setEnrollStep}
        enrollError={enrollError}
        enrollData={enrollData}
        copiedSecret={copiedSecret}
        setCopiedSecret={setCopiedSecret}
        generatedCodes={generatedCodes}
        hasConfirmedSavedCodes={hasConfirmedSavedCodes}
        setHasConfirmedSavedCodes={setHasConfirmedSavedCodes}
        copiedCodes={copiedCodes}
        handleCopyCodes={handleCopyCodes}
        handleDownloadCodes={handleDownloadCodes}
        verifyOtp={verifyOtp}
        setVerifyOtp={setVerifyOtp}
        enrollLoading={enrollLoading}
        handleConfirmEnrollment={handleConfirmEnrollment}
      />

      {/* Disable 2FA Confirmation Modal */}
      <DisableMfaModal
        showDisableModal={showDisableModal}
        setShowDisableModal={setShowDisableModal}
        disableError={disableError}
        disableLoading={disableLoading}
        handleDisableMfa={handleDisableMfa}
      />

      {/* Regenerate Recovery Codes Confirmation Modal */}
      <RegenerateConfirmModal
        showRegenerateConfirmModal={showRegenerateConfirmModal}
        setShowRegenerateConfirmModal={setShowRegenerateConfirmModal}
        enrollLoading={enrollLoading}
        handleRegenerateCodes={handleRegenerateCodes}
      />

      {/* View / Fresh Recovery Codes Modal */}
      <RecoveryCodesModal
        showRecoveryModal={showRecoveryModal}
        setShowRecoveryModal={setShowRecoveryModal}
        generatedCodes={generatedCodes}
        copiedCodes={copiedCodes}
        handleCopyCodes={handleCopyCodes}
        handleDownloadCodes={handleDownloadCodes}
      />
    </div>
  );
}
