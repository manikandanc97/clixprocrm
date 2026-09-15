"use client";

import React from "react";
import { Building2, CheckCircle2, Info, Loader2 } from "lucide-react";
import { CRMCard } from "@/shared/components/crm";
import { Badge } from "@/shared/ui/badge";

interface MfaStatusShape {
  orgMfaPolicy?: "OPTIONAL" | "REQUIRED" | string;
}

interface MfaPolicyCardProps {
  isAdmin: boolean;
  mfaStatus?: MfaStatusShape;
  isPolicyPending: boolean;
  onUpdatePolicy: (policy: "OPTIONAL" | "REQUIRED") => void;
}

export function MfaPolicyCard({
  isAdmin,
  mfaStatus,
  isPolicyPending,
  onUpdatePolicy,
}: MfaPolicyCardProps) {
  if (!isAdmin) {
    return (
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
    );
  }

  return (
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
              onClick={() => onUpdatePolicy("OPTIONAL")}
              disabled={isPolicyPending}
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
              onClick={() => onUpdatePolicy("REQUIRED")}
              disabled={isPolicyPending}
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
        {isPolicyPending && (
          <span className="flex items-center gap-1 text-primary font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>
    </CRMCard>
  );
}
