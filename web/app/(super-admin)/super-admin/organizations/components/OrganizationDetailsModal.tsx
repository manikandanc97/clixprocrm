"use client";

import React from "react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import {
  PlatformOrganization,
  PlatformOrganizationDetail,
} from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { CRMRoleBadge } from "@/shared/components/crm";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";

interface OrganizationDetailsModalProps {
  detailsModalOpen: boolean;
  setDetailsModalOpen: (open: boolean) => void;
  selectedOrgDetails: PlatformOrganizationDetail | null;
  loadingDetails: boolean;
  organizations: PlatformOrganization[];
  setOrgToDelete: (org: PlatformOrganization) => void;
}

export function OrganizationDetailsModal({
  detailsModalOpen,
  setDetailsModalOpen,
  selectedOrgDetails,
  loadingDetails,
  organizations,
  setOrgToDelete,
}: OrganizationDetailsModalProps) {
  if (!detailsModalOpen) return null;

  const modalColor = getOrgAvatarColor(selectedOrgDetails?.name || "O");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-11 w-11 rounded-2xl flex items-center justify-center font-extrabold text-base border shadow-xs",
                modalColor.bg,
                modalColor.text,
                modalColor.border
              )}
            >
              {selectedOrgDetails?.name?.charAt(0)?.toUpperCase() || "O"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {selectedOrgDetails?.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">/{selectedOrgDetails?.slug}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <PlanBadge plan={selectedOrgDetails?.plan} size="sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const org = organizations.find((o) => o.id === selectedOrgDetails?.id) || {
                  id: selectedOrgDetails?.id,
                  name: selectedOrgDetails?.name || "Organization",
                  slug: selectedOrgDetails?.slug || "",
                  plan: selectedOrgDetails?.plan || "free",
                  status: selectedOrgDetails?.status || "ACTIVE",
                  userCount: selectedOrgDetails?.members?.length || 0,
                  leadCount: selectedOrgDetails?.counts?.leads || 0,
                  customerCount: selectedOrgDetails?.counts?.customers || 0,
                  dealCount: selectedOrgDetails?.counts?.deals || 0,
                  taskCount: selectedOrgDetails?.counts?.tasks || 0,
                  createdAt: selectedOrgDetails?.createdAt || new Date().toISOString(),
                  updatedAt: selectedOrgDetails?.updatedAt || new Date().toISOString(),
                };
                setOrgToDelete(org as PlatformOrganization);
              }}
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-semibold gap-1.5 h-8 px-2.5 rounded-lg cursor-pointer"
            >
              <AppIcon name="trash" size={14} className="text-destructive" />
              <span>Delete</span>
            </Button>
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <AppIcon name="close" size={16} />
            </button>
          </div>
        </div>

        {loadingDetails ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-2">
                <Skeleton className="h-2.5 w-16 mx-auto" />
                <Skeleton className="h-6 w-10 mx-auto" />
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-2">
                <Skeleton className="h-2.5 w-16 mx-auto" />
                <Skeleton className="h-6 w-10 mx-auto" />
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-2">
                <Skeleton className="h-2.5 w-16 mx-auto" />
                <Skeleton className="h-6 w-10 mx-auto" />
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-3.5 w-36" />
              <div className="rounded-xl border border-border/60 p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedOrgDetails ? (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[11px] text-muted-foreground uppercase font-bold">
                  Members
                </p>
                <p className="text-xl font-black text-foreground mt-1">
                  {selectedOrgDetails.members?.length || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[11px] text-muted-foreground uppercase font-bold">
                  Leads
                </p>
                <p className="text-xl font-black text-foreground mt-1">
                  {selectedOrgDetails.counts?.leads || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[11px] text-muted-foreground uppercase font-bold">
                  Deals
                </p>
                <p className="text-xl font-black text-foreground mt-1">
                  {selectedOrgDetails.counts?.deals || 0}
                </p>
              </div>
            </div>

            {/* Organization Members Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Organization Users ({selectedOrgDetails.members?.length || 0})
              </h4>
              <div className="rounded-xl border border-border/60 overflow-auto max-h-60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-card shadow-xs">
                    <tr className="bg-muted/40 text-muted-foreground border-b border-border/40 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4 bg-card">User</th>
                      <th className="py-2.5 px-4 bg-card">Role</th>
                      <th className="py-2.5 px-4 bg-card">Status</th>
                      <th className="py-2.5 px-4 text-right bg-card">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {selectedOrgDetails.members && selectedOrgDetails.members.length > 0 ? (
                      selectedOrgDetails.members.map((m) => (
                        <tr key={m.membershipId} className="hover:bg-muted/20 h-12">
                          <td className="py-2.5 px-4">
                            <p className="font-semibold text-foreground">{m.name}</p>
                            <p className="text-[11px] text-muted-foreground">{m.email}</p>
                          </td>
                          <td className="py-2.5 px-4">
                            <CRMRoleBadge role={m.role} size="xs" />
                          </td>
                          <td className="py-2.5 px-4">
                            <StatusBadge
                              status={m.status || "ACTIVE"}
                              variant={m.status === "ACTIVE" ? "emerald" : "neutral"}
                            />
                          </td>
                          <td className="py-2.5 px-4 text-right text-muted-foreground">
                            {new Date(m.joinedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No members registered in this organization.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
