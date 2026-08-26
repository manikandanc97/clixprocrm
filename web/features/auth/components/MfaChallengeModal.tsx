"use client";

import React, { useState } from "react";
import { ShieldCheck, KeyRound, AlertCircle, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { createClient } from "@/lib/supabase/client";
import { verifyRecoveryCode, recordMfaAuditEvent } from "@/shared/lib/api/mfa.api";

interface MfaChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factorId?: string;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const MfaChallengeModal: React.FC<MfaChallengeModalProps> = ({
  open,
  onOpenChange,
  factorId,
  onSuccess,
  title = "Two-Factor Verification Required",
  description = "Enter the 6-digit security code from your authenticator app to continue.",
}) => {
  const [code, setCode] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTotpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      let targetFactorId = factorId;
      if (!targetFactorId) {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError || !factorsData?.totp?.length) {
          throw new Error("No active two-factor authentication factor found.");
        }
        targetFactorId = factorsData.totp[0].id;
      }

      const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: targetFactorId,
        code: code.trim(),
      });

      if (verifyErr) {
        await recordMfaAuditEvent("MFA_CHALLENGE_FAILED", {
          factorId: targetFactorId,
          error: verifyErr.message,
        }).catch(() => {});
        throw new Error(verifyErr.message || "Invalid authentication code. Please try again.");
      }

      if (data) {
        await recordMfaAuditEvent("MFA_VERIFIED", {
          factorId: targetFactorId,
        }).catch(() => {});
        await supabase.auth.refreshSession();
        window.dispatchEvent(new CustomEvent("clixpro:aal2-verified"));
        setCode("");
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await verifyRecoveryCode(code.trim());
      if (res.success) {
        const supabase = createClient();
        await supabase.auth.refreshSession();
        window.dispatchEvent(new CustomEvent("clixpro:aal2-verified"));
        setCode("");
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Invalid or used recovery code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1 text-primary">
            {isRecoveryMode ? <KeyRound className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isRecoveryMode ? "Use Backup Recovery Code" : title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {isRecoveryMode
              ? "Enter one of your 8-character backup codes generated during 2FA setup."
              : description}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 text-destructive text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={isRecoveryMode ? handleRecoveryVerify : handleTotpVerify} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              {isRecoveryMode ? "Backup Recovery Code" : "6-Digit Authenticator Code"}
            </label>
            <Input
              type="text"
              inputMode={isRecoveryMode ? "text" : "numeric"}
              placeholder={isRecoveryMode ? "ABCD-1234" : "000000"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={isRecoveryMode ? 16 : 6}
              autoFocus
              className="text-center text-base tracking-widest font-mono font-bold h-11"
              required
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full font-bold text-xs gap-2 h-10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Proceed
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(!isRecoveryMode);
                setCode("");
                setError(null);
              }}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium text-center py-1 flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {isRecoveryMode
                ? "Back to Authenticator App Code"
                : "Lost your authenticator device? Use a backup code"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
