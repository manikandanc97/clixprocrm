"use client";

import React from "react";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  userCount: number;
  leadCount?: number;
  customerCount?: number;
  dealCount?: number;
  healthStatus?: string;
  status: string;
  createdAt: string;
}

interface RecentOrganizationsTableProps {
  recentOrganizations?: OrganizationItem[];
}

export function RecentOrganizationsTable({
  recentOrganizations,
}: RecentOrganizationsTableProps) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Recent Organizations
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Live Workspaces
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Workspaces registered on the ClixPro platform
            </p>
          </div>
        </div>

        <Link
          href="/super-admin/organizations"
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors inline-flex items-center gap-1"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto w-full rounded-xl border border-border/60">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="sticky top-0 z-20 bg-muted/30 border-b border-border/60">
            <tr className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em] leading-tight">
              <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                Organization
              </th>
              <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                Plan
              </th>
              <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right whitespace-nowrap">
                Users
              </th>
              <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right whitespace-nowrap">
                CRM Records
              </th>
              <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                Health
              </th>
              <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-left whitespace-nowrap">
                Status
              </th>
              <th className="h-9 sm:h-10 px-3.5 sm:px-4 py-2 text-right whitespace-nowrap">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {recentOrganizations && recentOrganizations.length > 0 ? (
              recentOrganizations.slice(0, 6).map((org) => (
                <tr
                  key={org.id}
                  className="group h-12 hover:bg-muted/[0.04] transition-colors"
                >
                  <td className="px-3.5 py-2 font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      {(() => {
                        const orgColor = getOrgAvatarColor(org.name);
                        return (
                          <div
                            className={cn(
                              "h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs border shadow-xs shrink-0",
                              orgColor.bg,
                              orgColor.text,
                              orgColor.border
                            )}
                          >
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })()}
                      <div className="min-w-0">
                        <Link
                          href="/super-admin/organizations"
                          className="font-bold text-xs text-foreground group-hover:text-emerald-600 transition-colors truncate block"
                        >
                          {org.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          /{org.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-2">
                    <PlanBadge plan={org.plan} size="sm" />
                  </td>
                  <td className="px-3.5 py-2 text-xs text-muted-foreground font-medium text-right">
                    <span className="text-foreground font-semibold">{org.userCount}</span> users
                  </td>
                  <td className="px-3.5 py-2 text-xs text-muted-foreground font-medium text-right">
                    <span className="text-foreground font-semibold">
                      {(org.leadCount || 0) + (org.customerCount || 0) + (org.dealCount || 0)}
                    </span>
                  </td>
                  <td className="px-3.5 py-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        org.healthStatus === "HEALTHY"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : org.healthStatus === "AT_RISK"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                      }`}
                    >
                      {org.healthStatus === "HEALTHY"
                        ? "Healthy"
                        : org.healthStatus === "AT_RISK"
                        ? "At Risk"
                        : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3.5 py-2">
                    <StatusBadge
                      status={org.status === "ACTIVE" ? "Active" : "Suspended"}
                      variant={org.status === "ACTIVE" ? "emerald" : "rose"}
                    />
                  </td>
                  <td className="px-3.5 py-2 text-right text-xs text-muted-foreground font-medium">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-xs text-muted-foreground"
                >
                  No organizations created yet. Click &quot;Create Workspace&quot; to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
