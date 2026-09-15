"use client";

import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  QrCode,
  Loader2,
} from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

interface MfaAccountCardProps {
  isMfaActive: boolean;
  isOrgEnforced: boolean;
  recoveryCodesLeft: number;
  enrollLoading: boolean;
  handleStartEnrollment: () => Promise<void>;
  setShowRegenerateConfirmModal: (show: boolean) => void;
  setShowDisableModal: (show: boolean) => void;
}

export function MfaAccountCard({
  isMfaActive,
  isOrgEnforced,
  recoveryCodesLeft,
  enrollLoading,
  handleStartEnrollment,
  setShowRegenerateConfirmModal,
  setShowDisableModal,
}: MfaAccountCardProps) {
  return (
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
  );
}
