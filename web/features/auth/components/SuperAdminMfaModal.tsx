"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { createClient } from "@/lib/supabase/client";
import { verifyRecoveryCode, recordMfaAuditEvent } from "@/shared/lib/api/mfa.api";
import { useAuth } from "./auth-provider";
import { toast } from "sonner";

interface SuperAdminMfaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
  title?: string;
  description?: string;
}

export const SuperAdminMfaModal: React.FC<SuperAdminMfaModalProps> = ({
  open,
  onOpenChange,
  onVerified,
  title = "Super Admin MFA Assurance Required",
  description = "Level 2 Authenticator Assurance (AAL2) is required to access Super Admin platform operations.",
}) => {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingFactors, setCheckingFactors] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Flow mode: "verify" (TOTP exists) or "enroll" (no TOTP yet)
  const [mode, setMode] = useState<"verify" | "enroll">("verify");
  const [targetFactorId, setTargetFactorId] = useState<string | null>(null);
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);

  const initMfaState = useCallback(async () => {
    try {
      setCheckingFactors(true);
      setError(null);
      const supabase = createClient();

      const { data: factorsData, error: factorsErr } =
        await supabase.auth.mfa.listFactors();

      if (factorsErr) {
        throw new Error(factorsErr.message || "Failed to check MFA factors");
      }

      const totpFactors = factorsData?.totp || [];
      const verifiedTotp = totpFactors.find((f: any) => f.status === "verified") || totpFactors[0];

      if (verifiedTotp) {
        setMode("verify");
        setTargetFactorId(verifiedTotp.id);
        setEnrollData(null);
      } else {
        // No TOTP factor exists -> Initialize automatic TOTP enrollment
        setMode("enroll");
        const { data: enrollRes, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Super Admin Authenticator",
        });

        if (enrollErr || !enrollRes) {
          throw new Error(enrollErr?.message || "Failed to initialize 2FA enrollment");
        }

        setTargetFactorId(enrollRes.id);
        setEnrollData({
          factorId: enrollRes.id,
          qrCode: enrollRes.totp.qr_code,
          secret: enrollRes.totp.secret,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initialize MFA assurance flow.");
    } finally {
      setCheckingFactors(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setCode("");
      setIsRecoveryMode(false);
      initMfaState();
    }
  }, [open, initMfaState]);

  const handleCopySecret = () => {
    if (enrollData?.secret) {
      navigator.clipboard.writeText(enrollData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("MFA Secret key copied to clipboard");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      if (isRecoveryMode) {
        // Verify via backend recovery code
        const res = await verifyRecoveryCode(code.trim());
        if (res.success) {
          await supabase.auth.refreshSession();
          await refreshUser();
          toast.success("MFA Recovery code accepted. AAL2 session activated.");
          setCode("");
          onOpenChange(false);
          onVerified?.();
          return;
        }
      }

      // Normal TOTP Verification or Enrollment Confirmation
      let factorIdToVerify = targetFactorId;
      if (!factorIdToVerify) {
        const { data: fData } = await supabase.auth.mfa.listFactors();
        factorIdToVerify = fData?.totp?.[0]?.id || enrollData?.factorId || "";
      }

      if (!factorIdToVerify) {
        throw new Error("No active MFA factor found to verify.");
      }

      const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorIdToVerify,
        code: code.trim(),
      });

      if (verifyErr || !data) {
        await recordMfaAuditEvent("MFA_CHALLENGE_FAILED", {
          factorId: factorIdToVerify,
          error: verifyErr?.message,
        }).catch(() => {});
        throw new Error(
          verifyErr?.message || "Invalid authentication code. Please check and try again."
        );
      }

      // Record successful verification
      await recordMfaAuditEvent(
        mode === "enroll" ? "MFA_ENROLLED" : "MFA_VERIFIED",
        { factorId: factorIdToVerify }
      ).catch(() => {});

      // Refresh Supabase session to update access token claims to AAL2
      await supabase.auth.refreshSession();
      await refreshUser();

      toast.success("AAL2 Session Assurance Activated. Super Admin Platform unlocked.");
      setCode("");
      onOpenChange(false);
      onVerified?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderQrCode = (qrCodeStr: string) => {
    if (!qrCodeStr) return null;
    if (
      qrCodeStr.startsWith("data:") ||
      qrCodeStr.startsWith("http://") ||
      qrCodeStr.startsWith("https://") ||
      qrCodeStr.startsWith("blob:")
    ) {
      return (
        <img
          src={qrCodeStr}
          alt="Two-factor authentication QR Code"
          className="w-40 h-40 object-contain rounded-md"
        />
      );
    }
    if (qrCodeStr.trim().startsWith("<svg")) {
      return (
        <div
          className="w-40 h-40 [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: qrCodeStr }}
        />
      );
    }
    return (
      <img
        src={`data:image/svg+xml;utf-8,${encodeURIComponent(qrCodeStr)}`}
        alt="Two-factor authentication QR Code"
        className="w-40 h-40 object-contain rounded-md"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-emerald-500/20 bg-card text-foreground shadow-2xl p-6 overflow-hidden">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-sm shrink-0">
              {mode === "enroll" ? (
                <Sparkles className="w-5 h-5" />
              ) : isRecoveryMode ? (
                <KeyRound className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {isRecoveryMode ? "Use Backup Recovery Code" : title}
                </DialogTitle>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  AAL2 CORE
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {mode === "enroll"
                  ? "Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password) to link 2FA."
                  : isRecoveryMode
                  ? "Enter one of your 8-character backup recovery codes to verify your session."
                  : description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2.5 text-destructive text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {checkingFactors ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Checking Super Admin security assurance level...</p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4 pt-1">
            {/* Enrollment QR & Secret display */}
            {mode === "enroll" && enrollData && !isRecoveryMode && (
              <div className="space-y-3.5 rounded-xl border border-border/80 bg-muted/20 p-4">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center">
                    {enrollData.qrCode ? (
                      renderQrCode(enrollData.qrCode)
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-xs text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium text-center">
                    Point your authenticator camera at the QR code
                  </p>
                </div>

                {/* Secret manual entry */}
                <div className="space-y-1.5 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Can&apos;t scan QR? Manual Key:
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopySecret}
                      className="h-6 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "Copied!" : "Copy Key"}</span>
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <code className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all tracking-wider text-center break-all shadow-inner">
                      {enrollData.secret}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Code Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  {isRecoveryMode
                    ? "Backup Recovery Code"
                    : mode === "enroll"
                    ? "Enter 6-Digit Code from Authenticator"
                    : "6-Digit Authenticator Security Code"}
                </label>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  {isRecoveryMode ? "Recovery Code" : "TOTP"}
                </span>
              </div>
              <Input
                type="text"
                inputMode={isRecoveryMode ? "text" : "numeric"}
                placeholder={isRecoveryMode ? "ABCD-1234" : "123456"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={isRecoveryMode ? 16 : 6}
                autoFocus
                className="text-center text-xl tracking-[0.35em] font-mono font-extrabold h-12 rounded-xl border-border bg-background focus-visible:ring-2 focus-visible:ring-emerald-500/30 placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/40 shadow-inner"
                required
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full font-bold text-xs gap-2 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Session Assurance...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{mode === "enroll" ? "Activate 2FA & Unlock Platform" : "Verify & Unlock Super Admin"}</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </Button>

              {mode === "verify" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(!isRecoveryMode);
                    setCode("");
                    setError(null);
                  }}
                  className="text-[11px] text-muted-foreground hover:text-emerald-600 transition-colors font-medium text-center py-1 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {isRecoveryMode
                      ? "Back to Authenticator App Code"
                      : "Lost your authenticator device? Use a backup recovery code"}
                  </span>
                </button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
