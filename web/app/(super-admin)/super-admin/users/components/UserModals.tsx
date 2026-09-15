"use client";

import React from "react";
import { Crown, Trash2, X } from "lucide-react";
import { PlatformUser } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { CRMRoleBadge } from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";

// ─── User Detail Modal ──────────────────────────────────────────────────────
interface UserDetailModalProps {
  user: PlatformUser | null;
  onClose: () => void;
  onTransfer: (user: PlatformUser) => void;
  onDelete: (user: PlatformUser) => void;
  onToggleStatus: (user: PlatformUser) => void;
}

export function UserDetailModal({
  user,
  onClose,
  onTransfer,
  onDelete,
  onToggleStatus,
}: UserDetailModalProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {user.name || "User Profile"}
              </h3>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/40">
            <div>
              <span className="text-muted-foreground font-semibold">Status</span>
              <div className="mt-1">
                <StatusBadge
                  status={user.status === "ACTIVE" ? "Active" : user.status === "SUSPENDED" ? "Suspended" : "Inactive"}
                  variant={user.status === "ACTIVE" ? "emerald" : user.status === "SUSPENDED" ? "rose" : "neutral"}
                />
              </div>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Platform Role</span>
              <p className="font-bold text-emerald-600 mt-1 flex items-center gap-1">
                {user.isSuperAdmin ? (
                  <>
                    <Crown className="h-3.5 w-3.5" />
                    SUPER ADMIN (Root)
                  </>
                ) : (
                  "Standard User"
                )}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Member Since</span>
              <p className="font-medium text-foreground mt-0.5">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Organizations</span>
              <p className="font-bold text-foreground mt-0.5">
                {user.organizations?.length || 0} workspaces
              </p>
            </div>
          </div>

          {/* Memberships */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
              Workspace Memberships
            </h4>
            <div className="space-y-2">
              {user.organizations && user.organizations.length > 0 ? (
                user.organizations.map((org) => (
                  <div
                    key={org.tenantId}
                    className="p-3 rounded-xl bg-card border border-border flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-foreground">{org.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        /{org.slug}
                      </p>
                    </div>
                    <div className="text-right">
                      <CRMRoleBadge role={org.role} size="xs" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4 text-xs">
                  No tenant organization memberships.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/60">
            {user.isSuperAdmin ? (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" />
                Protected Platform Root Admin
              </span>
            ) : (
              <>
                <Button
                  onClick={() => {
                    onClose();
                    onTransfer(user);
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <Crown className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Transfer Super Admin
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    onDelete(user);
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-500" />
                  Delete Account
                </Button>
                <Button
                  onClick={() => {
                    onToggleStatus(user);
                    onClose();
                  }}
                  size="sm"
                  className={`rounded-xl text-xs font-bold ${
                    user.status === "ACTIVE"
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {user.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer Confirmation Modal ────────────────────────────────────────────
import { ShieldCheck } from "lucide-react";

interface UserTransferDialogProps {
  user: PlatformUser | null;
  confirmText: string;
  setConfirmText: (val: string) => void;
  isTransferring: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function UserTransferDialog({
  user,
  confirmText,
  setConfirmText,
  isTransferring,
  onConfirm,
  onClose,
}: UserTransferDialogProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5 text-amber-600">
            <Crown className="h-6 w-6" />
            <h3 className="text-base font-bold text-foreground">
              Transfer Platform Ownership
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-muted-foreground">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-2">
            <p className="font-bold text-amber-600 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Strict Single Super Admin Invariant
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The platform strictly maintains <strong className="text-foreground">exactly ONE active Super Admin</strong>.
              Transferring Super Admin status will atomically grant root platform privileges to:
            </p>
            <div className="p-2.5 rounded-lg bg-card border border-border text-foreground font-semibold">
              <p>{user.name || "No name"}</p>
              <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              ⚠️ Your current account will be safely demoted to Standard User. This transaction is atomic and irreversible without the new Super Admin transferring it back.
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-foreground block">
              Type <span className="font-mono text-rose-500 font-bold">TRANSFER</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="TRANSFER"
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/60">
            <Button onClick={onClose} variant="ghost" size="sm" className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={confirmText.trim().toUpperCase() !== "TRANSFER" || isTransferring}
              size="sm"
              className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isTransferring ? "Transferring..." : "Confirm & Transfer Ownership"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ──────────────────────────────────────────────
import { AlertTriangle } from "lucide-react";

interface UserDeleteDialogProps {
  user: PlatformUser | null;
  confirmText: string;
  setConfirmText: (val: string) => void;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function UserDeleteDialog({
  user,
  confirmText,
  setConfirmText,
  isDeleting,
  onConfirm,
  onClose,
}: UserDeleteDialogProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5 text-rose-600">
            <Trash2 className="h-6 w-6" />
            <h3 className="text-base font-bold text-foreground">
              Delete User Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-muted-foreground">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-foreground space-y-2">
            <p className="font-bold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Permanent Account Deletion
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are about to permanently delete the user account:
            </p>
            <div className="p-2.5 rounded-lg bg-card border border-border text-foreground font-semibold">
              <p>{user.name || "No name"}</p>
              <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
              ⚠️ This action will remove all organization memberships, revoke active sessions, and dissociate assigned CRM records. This action cannot be undone.
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-foreground block">
              Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border/60">
            <Button onClick={onClose} variant="ghost" size="sm" className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={confirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
              size="sm"
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete User"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
