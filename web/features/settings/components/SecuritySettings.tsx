"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  QrCode,
  KeyRound,
  Copy,
  Download,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowRight,
  Loader2,
  Building2,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  LogOut,
  Monitor,
  Clock,
  Eye,
  EyeOff,
  Activity,
  UserCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CRMCard } from "@/shared/components/crm";
import { PageErrorState } from "@/shared/components/page-states";
import { SecuritySettingsSkeleton } from "./SettingsSkeletons";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { useAuth } from "@/features/auth/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { changePassword } from "@/shared/lib/api/auth";
import {
  getMfaStatus,
  generateRecoveryCodes,
  disableMfa,
  recordMfaAuditEvent,
  updateTenantMfaPolicy,
  RecoveryCodesResponse,
} from "@/shared/lib/api/mfa.api";
import {
  fetchUserSessions,
  revokeUserSession,
  revokeAllOtherSessions,
  fetchSecurityActivity,
  UserSessionDto,
  SecurityActivityDto,
} from "@/shared/lib/api/sessions.api";


const SecuritySettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "ADMIN" || user?.role === "super_admin" || user?.role === "SUPER_ADMIN";

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Change Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Enrollment flow state
  const [enrollStep, setEnrollStep] = useState<"qr" | "codes" | "verify">("qr");
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Disable flow state
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Fetch MFA Status
  const {
    data: mfaStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["mfa-status"],
    queryFn: getMfaStatus,
    staleTime: 30000,
  });

  // Fetch Active Sessions
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: ["auth-sessions"],
    queryFn: fetchUserSessions,
    staleTime: 15000,
  });

  // Session Mutations
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeUserSession(sessionId),
    onMutate: (sessionId) => {
      setRevokingSessionId(sessionId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["security-activity"] });
      setRevokingSessionId(null);
    },
    onError: (err: any) => {
      setRevokingSessionId(null);
      alert(err?.response?.data?.message || err?.message || "Failed to revoke session");
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => revokeAllOtherSessions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["security-activity"] });
      setShowRevokeAllModal(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.message || "Failed to revoke sessions");
    },
  });

  // Security Activity state & query
  const [activityPage, setActivityPage] = useState(1);
  const [allActivities, setAllActivities] = useState<SecurityActivityDto[]>([]);

  const {
    data: activityData,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["security-activity", activityPage],
    queryFn: () => fetchSecurityActivity(activityPage, 20),
    staleTime: 30000,
  });

  React.useEffect(() => {
    if (activityData?.activity) {
      if (activityPage === 1) {
        setAllActivities(activityData.activity);
      } else {
        setAllActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newItems = activityData.activity.filter((a) => !existingIds.has(a.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [activityData, activityPage]);

  const getActivityVisuals = (action: string) => {
    switch (action) {
      case "NEW_DEVICE_LOGIN":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
          bgColor: "bg-amber-500/10",
          title: "New Sign-In Detected",
        };
      case "LOGIN_SUCCESS":
        return {
          icon: <UserCheck className="w-4 h-4 text-emerald-500" />,
          bgColor: "bg-emerald-500/10",
          title: "Sign-In Successful",
        };
      case "LOGIN_FAILED":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
          bgColor: "bg-rose-500/10",
          title: "Failed Sign-In Attempt",
        };
      case "MFA_VERIFIED":
        return {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
          bgColor: "bg-emerald-500/10",
          title: "MFA Challenge Verified",
        };
      case "MFA_ENROLLED":
        return {
          icon: <ShieldCheck className="w-4 h-4 text-primary" />,
          bgColor: "bg-primary/10",
          title: "MFA Enrolled",
        };
      case "MFA_DISABLED":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          bgColor: "bg-amber-500/10",
          title: "MFA Disabled",
        };
      case "MFA_CHALLENGE_FAILED":
      case "AAL2_REQUIRED_DENIED":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
          bgColor: "bg-rose-500/10",
          title: "MFA Verification Failed",
        };
      case "MFA_RECOVERY_CODE_GENERATED":
      case "MFA_RECOVERY_CODE_VERIFIED":
        return {
          icon: <KeyRound className="w-4 h-4 text-purple-500" />,
          bgColor: "bg-purple-500/10",
          title: "Recovery Code Used",
        };
      case "PASSWORD_CHANGED":
      case "PASSWORD_RESET":
        return {
          icon: <KeyRound className="w-4 h-4 text-blue-500" />,
          bgColor: "bg-blue-500/10",
          title: "Password Changed",
        };
      case "SESSION_REVOKED":
      case "SESSION_REVOKED_REMOTE":
        return {
          icon: <LogOut className="w-4 h-4 text-muted-foreground" />,
          bgColor: "bg-muted",
          title: "Session Revoked",
        };
      case "ALL_OTHER_SESSIONS_REVOKED":
        return {
          icon: <LogOut className="w-4 h-4 text-amber-500" />,
          bgColor: "bg-amber-500/10",
          title: "All Other Sessions Revoked",
        };
      case "SESSION_EXPIRED_IDLE":
      case "SESSION_EXPIRED_ABSOLUTE":
        return {
          icon: <Clock className="w-4 h-4 text-muted-foreground" />,
          bgColor: "bg-muted",
          title: "Session Expired",
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-primary" />,
          bgColor: "bg-primary/10",
          title: action.replace(/_/g, " "),
        };
    }
  };


  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Tablet className="w-4 h-4" />;
      case "desktop":
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  const formatSessionTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return "Active just now";
      if (diffSec < 3600) return `Active ${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `Active ${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  // Organization policy mutation
  const policyMutation = useMutation({
    mutationFn: (policy: "OPTIONAL" | "REQUIRED") => updateTenantMfaPolicy(policy),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
    },
  });

  // Start Enrollment Wizard
  const handleStartEnrollment = async () => {
    try {
      setEnrollLoading(true);
      setEnrollError(null);
      setEnrollStep("qr");
      setVerifyOtp("");
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
      setEnrollError(err?.message || "Could not start 2FA setup. Please try again.");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Complete Enrollment
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

      await recordMfaAuditEvent("MFA_ENROLLED", {
        factorId: enrollData.factorId,
      }).catch(() => {});

      await queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
      setShowEnrollModal(false);
    } catch (err: any) {
      setEnrollError(err?.message || "Verification failed. Please ensure the code is current.");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Handle Disable MFA
  const handleDisableMfa = async () => {
    try {
      setDisableLoading(true);
      setDisableError(null);

      await disableMfa();
      await queryClient.invalidateQueries({ queryKey: ["mfa-status"] });
      setShowDisableModal(false);
    } catch (err: any) {
      setDisableError(err?.response?.data?.message || err?.message || "Failed to disable 2FA.");
    } finally {
      setDisableLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      await changePassword(newPassword);
      setPasswordSuccess("Password updated successfully. All other active sessions have been signed out.");
      await queryClient.invalidateQueries({ queryKey: ["auth-sessions"] });
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordSuccess(null);
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || err?.message || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Copy helper
  const handleCopyCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join("\n"));
    setCopiedCodes(true);
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

  if (isLoading) {
    return <SecuritySettingsSkeleton />;
  }

  if (error) {
    return (
      <PageErrorState
        title="Security settings unavailable"
        message={(error as Error).message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const isMfaActive = mfaStatus?.hasVerifiedFactor === true;
  const isOrgEnforced = mfaStatus?.isEnforcedByOrg === true;

  return (
    <div className="space-y-5">
      <div className="mb-5">
        <h3 className="text-base font-bold tracking-tight text-foreground">Security & Privacy</h3>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          Manage your enterprise authentication, two-factor verification, and access controls.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 2FA / MFA Management Card */}
        <CRMCard>
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Two-Factor Authentication (2FA)</h3>
                <p className="text-[11px] text-muted-foreground font-medium">TOTP authenticator app verification</p>
              </div>
            </div>
            <Badge
              variant={isMfaActive ? "default" : "secondary"}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                isMfaActive ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" : ""
              }`}
            >
              {isMfaActive ? "Enabled (AAL2)" : "Disabled"}
            </Badge>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg border border-border/50 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">
                  {isMfaActive ? "Authenticator Protection Active" : "Protect Your Account with 2FA"}
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  {isMfaActive
                    ? "Your account requires a 6-digit TOTP verification code from Google Authenticator, Authy, or 1Password when signing in."
                    : "Add an extra layer of security. In addition to your password, you will need to enter a 6-digit code from your authenticator app."}
                </p>
              </div>
            </div>

            {isOrgEnforced && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Two-factor authentication is required by your organization policy.</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-border/40">
              {isMfaActive ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisableModal(true)}
                    className="font-bold text-xs gap-1.5 h-8 text-destructive hover:text-destructive"
                  >
                    Disable 2FA
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await generateRecoveryCodes();
                        setGeneratedCodes(res.recoveryCodes || []);
                        setShowRecoveryModal(true);
                      } catch (err: any) {
                        alert(err?.message || "Failed to generate backup codes");
                      }
                    }}
                    className="font-bold text-xs gap-1.5 h-8"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    View Backup Codes
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartEnrollment}
                  disabled={enrollLoading}
                  className="font-bold text-xs gap-2 h-8"
                >
                  {enrollLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <QrCode className="w-3.5 h-3.5" />
                  )}
                  Enable 2FA
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowChangePasswordModal(true);
                }}
                className="font-bold text-xs gap-1.5 h-8"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </Button>
            </div>
          </div>
        </CRMCard>

        {/* Organization MFA Policy Card (Admins Only) */}
        {isAdmin && (
          <CRMCard>
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">Organization 2FA Policy</h3>
                  <p className="text-[11px] text-muted-foreground font-medium">Tenant-wide security requirements</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                Admin Control
              </Badge>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 flex flex-col gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">MFA Enforcement Policy</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  When enabled, all administrators and workspace members will be required to verify 2FA.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => policyMutation.mutate("OPTIONAL")}
                  disabled={policyMutation.isPending}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                    mfaStatus?.orgMfaPolicy === "OPTIONAL"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border/60 hover:border-border text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center justify-between">
                    Optional MFA
                    {mfaStatus?.orgMfaPolicy === "OPTIONAL" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Users can choose whether to enable 2FA
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => policyMutation.mutate("REQUIRED")}
                  disabled={policyMutation.isPending}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                    mfaStatus?.orgMfaPolicy === "REQUIRED"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border/60 hover:border-border text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-bold flex items-center justify-between">
                    Required MFA
                    {mfaStatus?.orgMfaPolicy === "REQUIRED" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Enforce AAL2 2FA for workspace operations
                  </span>
                </button>
              </div>
            </div>
          </CRMCard>
        )}
      </div>

      {/* Active Sessions & Device Registry Card */}
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-foreground">Active Sessions & Devices</h3>
                {sessionsData?.activeCount !== undefined && (
                  <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5">
                    {sessionsData.activeCount} Active
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Manage your authenticated devices. Sessions expire after 30 minutes of inactivity or 24 hours maximum duration.
              </p>
            </div>
          </div>

          {sessionsData?.sessions && sessionsData.sessions.filter((s) => !s.isCurrent && !s.isRevoked).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeAllModal(true)}
              className="font-bold text-xs gap-1.5 h-8 text-destructive hover:text-destructive shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out All Other Sessions
            </Button>
          )}
        </div>

        {sessionsLoading ? (
          <div className="py-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading active sessions...
          </div>
        ) : sessionsError ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium">
            Failed to load active sessions. Please refresh the page.
          </div>
        ) : (
          <div className="space-y-3">
            {sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
              sessionsData.sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    session.isCurrent
                      ? "border-primary/40 bg-primary/[0.03]"
                      : session.isRevoked
                      ? "border-border/30 bg-muted/20 opacity-60"
                      : "border-border/60 bg-muted/30 hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        session.isCurrent
                          ? "bg-primary/10 text-primary"
                          : session.isRevoked
                          ? "bg-muted text-muted-foreground"
                          : "bg-background border border-border/60 text-foreground"
                      }`}
                    >
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {session.browser} on {session.operatingSystem}
                        </span>
                        {session.isCurrent && (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                            This Device
                          </Badge>
                        )}
                        {session.isRevoked && (
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                        {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                        <span>•</span>
                        <span>{session.isCurrent ? "Active now" : formatSessionTime(session.lastActiveAt)}</span>
                        <span>•</span>
                        <span>Signed in {new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && !session.isRevoked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeMutation.mutate(session.id)}
                      disabled={revokingSessionId === session.id}
                      className="text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 shrink-0"
                    >
                      {revokingSessionId === session.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5 mr-1" />
                      )}
                      Revoke
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 bg-muted/20 rounded-lg text-center text-xs text-muted-foreground font-medium">
                No session records found.
              </div>
            )}
          </div>
        )}
      </CRMCard>

      {/* Security Activity Card */}
      <CRMCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-foreground">
                  Security Activity
                </h3>
                {activityData?.total !== undefined && (
                  <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5">
                    {activityData.total} Events
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Recent sign-ins, device changes, and security events for your account.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetchActivity()}
            disabled={activityLoading}
            className="text-xs font-bold gap-1.5 h-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${activityLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {activityLoading && allActivities.length === 0 ? (
          <div className="py-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading security activity...
          </div>
        ) : activityError && allActivities.length === 0 ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium flex items-center justify-between">
            <span>Failed to load security activity. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetchActivity()}
              className="text-xs h-7 px-2"
            >
              Retry
            </Button>
          </div>
        ) : allActivities.length === 0 ? (
          <div className="py-8 px-4 border border-dashed rounded-lg text-center space-y-1">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-foreground">No security activity yet</p>
            <p className="text-[11px] text-muted-foreground font-medium max-w-sm mx-auto">
              Your recent sign-ins and account security events will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allActivities.map((activity) => {
              const visuals = getActivityVisuals(activity.action);
              const isRemoteActiveSession =
                !activity.isCurrent && !activity.isRevoked && Boolean(activity.sessionId);

              return (
                <div
                  key={activity.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    activity.isCurrent
                      ? "border-primary/40 bg-primary/[0.03]"
                      : activity.isRevoked
                      ? "border-border/30 bg-muted/20 opacity-70"
                      : "border-border/60 bg-muted/30 hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${visuals.bgColor}`}
                    >
                      {visuals.icon}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          {visuals.title}
                        </span>
                        {activity.isCurrent && (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                            This Device
                          </Badge>
                        )}
                        {activity.isRevoked && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2"
                          >
                            Session Revoked
                          </Badge>
                        )}
                        {activity.action === "NEW_DEVICE_LOGIN" && (
                          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2">
                            New Device
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                        {(activity.browser || activity.operatingSystem) && (
                          <>
                            <span>
                              {activity.browser || "Unknown Browser"} on{" "}
                              {activity.operatingSystem || "Unknown OS"}
                              {activity.deviceType ? ` • ${activity.deviceType}` : ""}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>
                          {new Date(activity.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {activity.ipAddress && (
                          <>
                            <span>•</span>
                            <span>IP: {activity.ipAddress}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isRemoteActiveSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeMutation.mutate(activity.sessionId!)}
                      disabled={revokingSessionId === activity.sessionId}
                      className="text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 shrink-0 self-start sm:self-auto"
                    >
                      {revokingSessionId === activity.sessionId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5 mr-1" />
                      )}
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Load More Pagination Button */}
            {allActivities.length < (activityData?.total || 0) && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivityPage((p) => p + 1)}
                  disabled={activityLoading}
                  className="text-xs font-bold gap-1.5 h-8"
                >
                  {activityLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  Load More Activity ({allActivities.length} of {activityData?.total})
                </Button>
              </div>
            )}
          </div>
        )}
      </CRMCard>

      {/* Danger Zone */}
      <CRMCard className="border-destructive/30 bg-destructive/5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-tight text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Danger Zone
              </h3>
              <Badge variant="destructive" className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5">
                Irreversible
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Permanently delete your account, workspace, and all associated CRM records.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="font-bold text-xs gap-2 shrink-0 h-9 px-4 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </Button>
        </div>
      </CRMCard>

      {/* Delete Account Modal */}
      <DeleteAccountModal open={showDeleteModal} onOpenChange={setShowDeleteModal} />

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
                    Or enter this manual configuration secret key:
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
                <Button size="sm" onClick={() => setEnrollStep("verify")} className="font-bold text-xs gap-1.5 h-8">
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

      {/* Disable 2FA Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Disabling 2FA reduces your account security. Are you sure you want to disable it?
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

      {/* View Recovery Codes Modal */}
      <Dialog open={showRecoveryModal} onOpenChange={setShowRecoveryModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Your Backup Recovery Codes
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Each backup code can be used once to sign in if you lose your authenticator app.
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

      {/* Sign Out All Other Sessions Confirmation Modal */}
      <Dialog open={showRevokeAllModal} onOpenChange={setShowRevokeAllModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center mb-1 text-destructive">
              <LogOut className="w-4.5 h-4.5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Sign Out All Other Sessions?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed font-medium">
              This will immediately revoke access from all other devices and browsers logged into your account. Your current session on this device will remain active.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeAllModal(false)}
              disabled={revokeAllMutation.isPending}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
              className="text-xs font-bold gap-1.5"
            >
              {revokeAllMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sign Out All Other Devices
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog Modal */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-1 text-primary">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Change Password
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed font-medium">
              Update your account password. For your security, changing your password will automatically sign out all other active devices.
            </DialogDescription>
          </DialogHeader>

          {passwordError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="changeNewPassword" className="text-xs font-semibold text-foreground/80">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="changeNewPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="pr-10 h-10 text-xs rounded-lg"
                  required
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="changeConfirmPassword" className="text-xs font-semibold text-foreground/80">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="changeConfirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10 h-10 text-xs rounded-lg"
                  required
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowChangePasswordModal(false)}
                disabled={passwordLoading}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={passwordLoading}
                className="text-xs font-bold gap-1.5"
              >
                {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecuritySettings;
