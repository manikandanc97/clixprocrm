"use client";

import React from "react";
import {
  AlertTriangle,
  Loader2,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Copy,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

interface DisableMfaModalProps {
  showDisableModal: boolean;
  setShowDisableModal: (show: boolean) => void;
  disableError: string | null;
  disableLoading: boolean;
  handleDisableMfa: () => Promise<void>;
}

export function DisableMfaModal({
  showDisableModal,
  setShowDisableModal,
  disableError,
  disableLoading,
  handleDisableMfa,
}: DisableMfaModalProps) {
  return (
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
            Confirm &amp; Disable
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface RegenerateConfirmModalProps {
  showRegenerateConfirmModal: boolean;
  setShowRegenerateConfirmModal: (show: boolean) => void;
  enrollLoading: boolean;
  handleRegenerateCodes: () => Promise<void>;
}

export function RegenerateConfirmModal({
  showRegenerateConfirmModal,
  setShowRegenerateConfirmModal,
  enrollLoading,
  handleRegenerateCodes,
}: RegenerateConfirmModalProps) {
  return (
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
  );
}

interface RecoveryCodesModalProps {
  showRecoveryModal: boolean;
  setShowRecoveryModal: (show: boolean) => void;
  generatedCodes: string[];
  copiedCodes: boolean;
  handleCopyCodes: () => void;
  handleDownloadCodes: () => void;
}

export function RecoveryCodesModal({
  showRecoveryModal,
  setShowRecoveryModal,
  generatedCodes,
  copiedCodes,
  handleCopyCodes,
  handleDownloadCodes,
}: RecoveryCodesModalProps) {
  return (
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
  );
}
