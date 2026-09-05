"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { deleteAccount } from "@/shared/lib/api/auth";
import { extractErrorMessage } from "@/shared/lib/api/error";
import { useCRMStore } from "@/shared/store/useCRMStore";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useWorkspace } from "@/shared/hooks/use-settings";
import { AppIcon } from "@/shared/components/icons/icon-registry";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
}: DeleteAccountModalProps) {
  const { user } = useAuth();
  const { data: workspace } = useWorkspace();
  const [confirm1, setConfirm1] = useState("");
  const [confirm2, setConfirm2] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const companyName = workspace?.name || (user as any)?.companyName || "clixprocrm";

  const isFirstValid =
    confirm1.trim().toLowerCase() === companyName.trim().toLowerCase() ||
    (confirm1.trim().toLowerCase() === "clixprocrm");
  const isSecondValid = confirm2.trim().toLowerCase() === "delete my account";
  const canDelete = isFirstValid && isSecondValid;

  const handleClose = () => {
    if (isDeleting) return;
    setConfirm1("");
    setConfirm2("");
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteAccount({
        confirm1: confirm1.trim(),
        confirm2: confirm2.trim(),
      });

      // Backend deletion confirmed successfully: perform full cleanup

      // 1. Clear client storage & remove auth cookies
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("has_session");
          localStorage.removeItem("orbit_currency");
          localStorage.removeItem("orbit_token");
          localStorage.removeItem("orbit_user");
          localStorage.removeItem("workspace_id");
          sessionStorage.clear();

          // Clear any supabase / auth cookies
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
            if (name.startsWith("sb-") || name.startsWith("supabase") || name === "has_session") {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
            }
          });

          document.body.style.removeProperty("pointer-events");
          document.body.style.removeProperty("overflow");
        } catch {}
      }

      // 2. Clear cached state
      queryClient.clear();
      useCRMStore.getState().reset();

      // 3. Immediately hard redirect directly to /account-deleted
      if (typeof window !== "undefined") {
        window.location.replace("/account-deleted");
      }
    } catch (error: any) {
      setIsDeleting(false);

      const isNetworkTimeout =
        error?.code === "ECONNABORTED" ||
        error?.message?.toLowerCase().includes("timeout") ||
        error?.message?.toLowerCase().includes("network error") ||
        !error?.response;

      if (isNetworkTimeout && !error?.response) {
        toast.error(
          "We could not confirm that your account was deleted. Please check your account status or try again."
        );
      } else {
        const errorMsg = extractErrorMessage(
          error?.response?.data,
          error?.message || "Account deletion failed. No data was deleted. Please try again."
        );
        toast.error(errorMsg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-border bg-card p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Danger Header Banner */}
        <div className="p-5 pb-3.5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0 text-destructive">
              <AppIcon name="alert" icon={AlertTriangle} size={18} className="text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Delete Account
              </DialogTitle>
              <p className="text-[10.5px] text-destructive font-semibold uppercase tracking-wider mt-0.5">
                Danger Zone · Irreversible Action
              </p>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            This will permanently delete your account and all data associated with your workspace.
          </DialogDescription>
        </div>

        <div className="px-5 space-y-3.5 pb-1">
          {/* Warning Callout Box */}
          <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs leading-relaxed font-medium flex items-start gap-2.5">
            <AppIcon name="alert" icon={AlertTriangle} size={14} className="shrink-0 mt-0.5 text-destructive" />
            <span>
              This action cannot be undone. Your account and related data will be permanently deleted and cannot be recovered.
            </span>
          </div>

          {/* Verification Input 1 */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-foreground/80">
              To confirm, type <span className="font-mono font-bold text-destructive">“{companyName}”</span>
            </Label>
            <Input
              value={confirm1}
              onChange={(e) => setConfirm1(e.target.value)}
              placeholder={companyName}
              disabled={isDeleting}
              className={`h-9 text-xs rounded-lg font-mono transition-all ${
                isFirstValid
                  ? "border-emerald-500/80 bg-emerald-500/5 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-border/80 bg-muted/30 focus:bg-card focus:border-destructive focus:ring-destructive/20"
              }`}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Verification Input 2 */}
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold text-foreground/80">
              To confirm, type <span className="font-mono font-bold text-destructive">“delete my account”</span>
            </Label>
            <Input
              value={confirm2}
              onChange={(e) => setConfirm2(e.target.value)}
              placeholder="delete my account"
              disabled={isDeleting}
              className={`h-9 text-xs rounded-lg font-mono transition-all ${
                isSecondValid
                  ? "border-emerald-500/80 bg-emerald-500/5 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-border/80 bg-muted/30 focus:bg-card focus:border-destructive focus:ring-destructive/20"
              }`}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 bg-muted/30 border-t border-border/70 flex flex-row items-center justify-end gap-2.5 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isDeleting}
            className="group rounded-lg text-xs font-semibold h-8 px-3.5 border-border/80 hover:bg-muted gap-1.5"
          >
            <AppIcon name="close" size={12} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="group rounded-lg text-xs font-bold gap-1.5 h-8 px-3.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting Account...
              </>
            ) : (
              <>
                <AppIcon name="trash" icon={Trash2} size={13} />
                Delete Account
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
