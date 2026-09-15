"use client";

import React from "react";
import { KeyRound, Lock, Ban, Shield, ArrowUpRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { EmergencyModalState } from "./types";

interface SecOpsEmergencyTabProps {
  setEmergencyModal: React.Dispatch<React.SetStateAction<EmergencyModalState>>;
}

export function SecOpsEmergencyTab({ setEmergencyModal }: SecOpsEmergencyTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <KeyRound className="w-4 h-4" />
            <span>Force User Password Reset</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Flags user record with forced password reset requirement, revokes all active auth tokens, and logs security audit trail.
          </p>
        </div>

        <Button
          onClick={() =>
            setEmergencyModal({
              action: "FORCE_RESET",
              targetId: "",
              reason: "",
              confirmText: "",
            })
          }
          variant="outline"
          className="w-full text-xs font-semibold justify-between h-9 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
        >
          <span>Configure Forced Password Reset</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>Emergency User Lock &amp; Session Eviction</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Immediately locks user account, invalidates active sessions, and terminates ingress API access.
          </p>
        </div>

        <Button
          onClick={() =>
            setEmergencyModal({
              action: "LOCK_USER",
              targetId: "",
              reason: "",
              confirmText: "",
            })
          }
          variant="outline"
          className="w-full text-xs font-semibold justify-between h-9 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
        >
          <span>Lockdown User Account</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <Ban className="w-4 h-4" />
            <span>Revoke All User Sessions</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Terminates all active refresh tokens and browser sessions without altering account credentials.
          </p>
        </div>

        <Button
          onClick={() =>
            setEmergencyModal({
              action: "REVOKE_SESSIONS",
              targetId: "",
              reason: "",
              confirmText: "",
            })
          }
          variant="outline"
          className="w-full text-xs font-semibold justify-between h-9 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
        >
          <span>Revoke Active Sessions</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>Suspend Workspace / Organization</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Locks tenant organization, immediately terminates all member sessions, and halts tenant CRM operations.
          </p>
        </div>

        <Button
          onClick={() =>
            setEmergencyModal({
              action: "LOCK_TENANT",
              targetId: "",
              reason: "",
              confirmText: "",
            })
          }
          variant="outline"
          className="w-full text-xs font-semibold justify-between h-9 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
        >
          <span>Suspend Workspace</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
