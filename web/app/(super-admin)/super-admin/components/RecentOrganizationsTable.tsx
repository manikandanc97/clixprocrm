"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";

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
  
  const columns = useMemo<CRMDataTableColumn<OrganizationItem>[]>(() => {
    return [
      {
        header: "Organization",
        cell: (org) => {
          const orgColor = getOrgAvatarColor(org.name);
          return (
            <div className="flex items-center gap-2.5">
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
              <div className="min-w-0">
                <Link
                  href="/super-admin/organizations"
                  className="font-bold text-xs text-foreground hover:text-emerald-600 transition-colors truncate block"
                >
                  {org.name}
                </Link>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  /{org.slug}
                </p>
              </div>
            </div>
          );
        },
        className: "w-[240px]",
      },
      {
        header: "Plan",
        cell: (org) => <PlanBadge plan={org.plan} size="sm" />,
        className: "w-[120px]",
      },
      {
        header: "Users",
        align: "right",
        cell: (org) => (
          <span className="text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">{org.userCount}</span> users
          </span>
        ),
        className: "w-[100px]",
      },
      {
        header: "CRM Records",
        align: "right",
        cell: (org) => (
          <span className="text-xs text-foreground font-semibold">
            {(org.leadCount || 0) + (org.customerCount || 0) + (org.dealCount || 0)}
          </span>
        ),
        className: "w-[120px]",
      },
      {
        header: "Health",
        cell: (org) => (
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
        ),
        className: "w-[100px]",
      },
      {
        header: "Status",
        cell: (org) => (
          <StatusBadge
            status={org.status === "ACTIVE" ? "Active" : "Suspended"}
            variant={org.status === "ACTIVE" ? "emerald" : "rose"}
          />
        ),
        className: "w-[120px]",
      },
      {
        header: "Created",
        align: "right",
        cell: (org) => (
          <span className="text-xs text-muted-foreground font-medium">
            {new Date(org.createdAt).toLocaleDateString()}
          </span>
        ),
        className: "w-[120px]",
        headerClassName: "w-[120px] text-right",
      },
    ];
  }, []);

  const slicedOrganizations = useMemo(() => {
    return recentOrganizations ? recentOrganizations.slice(0, 6) : [];
  }, [recentOrganizations]);

  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between border-b border-border/40 pb-3 shrink-0">
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

      <div className="overflow-hidden flex flex-col flex-1 min-h-0 rounded-xl border border-border/60">
        <CRMDataTable<OrganizationItem>
          data={slicedOrganizations}
          columns={columns}
          isLoading={false}
          isError={false}
          emptyIcon={Building2}
          emptyTitle="No organizations created yet."
          emptyDescription="Click 'Create Workspace' to begin."
          hasPagination={false}
        />
      </div>
    </div>
  );
}
