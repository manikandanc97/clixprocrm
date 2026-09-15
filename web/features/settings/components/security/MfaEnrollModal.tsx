"use client";

import React from "react";
import {
  QrCode,
  AlertTriangle,
  Loader2,
  Copy,
  CheckCircle2,
  KeyRound,
  Download,
  ArrowRight,
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

interface EnrollDataShape {
  factorId: string;
  qrCode: string;
  secret: string;
}

interface MfaEnrollModalProps {
  showEnrollModal: boolean;
  setShowEnrollModal: (show: boolean) => void;
  enrollStep: "qr" | "codes" | "verify";
  setEnrollStep: (step: "qr" | "codes" | "verify") => void;
  enrollError: string | null;
  enrollData: EnrollDataShape | null;
  copiedSecret: boolean;
  setCopiedSecret: (copied: boolean) => void;
  generatedCodes: string[];
  hasConfirmedSavedCodes: boolean;
  setHasConfirmedSavedCodes: (confirmed: boolean) => void;
  copiedCodes: boolean;
  handleCopyCodes: () => void;
  handleDownloadCodes: () => void;
  verifyOtp: string;
  setVerifyOtp: (otp: string) => void;
  enrollLoading: boolean;
  handleConfirmEnrollment: (e: React.FormEvent) => Promise<void>;
}

export function MfaEnrollModal({
  showEnrollModal,
  setShowEnrollModal,
  enrollStep,
  setEnrollStep,
  enrollError,
  enrollData,
  copiedSecret,
  setCopiedSecret,
  generatedCodes,
  hasConfirmedSavedCodes,
  setHasConfirmedSavedCodes,
  copiedCodes,
  handleCopyCodes,
  handleDownloadCodes,
  verifyOtp,
  setVerifyOtp,
  enrollLoading,
  handleConfirmEnrollment,
}: MfaEnrollModalProps) {
  return (
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
                    // eslint-disable-next-line @next/next/no-img-element
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
                    // eslint-disable-next-line @next/next/no-img-element
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
                      className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
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
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring cursor-pointer"
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
                Verify &amp; Activate 2FA
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
