"use client";

import React, { useMemo } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  CRMToolbar,
  CRMPagination,
  TruncatedText,
} from "@/shared/components/crm";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { cn } from "@/shared/lib/utils";
import { PlatformSubscriptionItem } from "@/shared/lib/api/super-admin.api";
import { getSubStatusBadge } from "../utils/billing-formatters.util";

interface BillingSubscriptionsTabProps {
  loading: boolean;
  subSearch: string;
  setSubSearch: (val: string) => void;
  subStatusFilter: string;
  setSubStatusFilter: (val: string) => void;
  subPlanFilter: string;
  setSubPlanFilter: (val: string) => void;
  subPage: number;
  setSubPage: (page: number) => void;
  subRowsPerPage: number;
  setSubRowsPerPage: (rows: number) => void;
  subSortConfig: { key: string; direction: "asc" | "desc" } | null;
  setSubSortConfig: (cfg: { key: string; direction: "asc" | "desc" } | null) => void;
  filteredSubscriptions: PlatformSubscriptionItem[];
  paginatedSubscriptions: PlatformSubscriptionItem[];
  totalSubPages: number;
  formatCurrency: (amount: number, currency?: string) => string;
  onEditSubscription: (sub: PlatformSubscriptionItem) => void;
  onCreateSubscription: () => void;
}

export function BillingSubscriptionsTab({
  loading,
  subSearch,
  setSubSearch,
  subStatusFilter,
  setSubStatusFilter,
  subPlanFilter,
  setSubPlanFilter,
  subPage,
  setSubPage,
  subRowsPerPage,
  setSubRowsPerPage,
  subSortConfig,
  setSubSortConfig,
  filteredSubscriptions,
  paginatedSubscriptions,
  totalSubPages,
  formatCurrency,
  onEditSubscription,
  onCreateSubscription,
}: BillingSubscriptionsTabProps) {
  
  const columns = useMemo<CRMDataTableColumn<PlatformSubscriptionItem>[]>(() => {
    return [
      {
        header: "Organization",
        sortable: true,
        sortDirection: subSortConfig?.key === "tenantName" ? subSortConfig.direction : null,
        onSort: (dir) => setSubSortConfig(dir ? { key: "tenantName", direction: dir } : null),
        cell: (sub) => {
          const orgColor = getOrgAvatarColor(sub.tenantName);
          return (
            <div className="flex items-center gap-2.5 min-w-0 font-bold text-foreground">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border shadow-xs",
                  orgColor.bg,
                  orgColor.text,
                  orgColor.border
                )}
              >
                {sub.tenantName?.charAt(0)?.toUpperCase() || "O"}
              </div>
              <div className="min-w-0">
                <TruncatedText text={sub.tenantName} lines={1} className="font-bold text-foreground text-xs" />
                <span className="text-[10px] text-muted-foreground font-mono block">
                  ID: {sub.tenantId?.slice(0, 8)}...
                </span>
              </div>
            </div>
          );
        },
        className: "min-w-[200px]",
      },
      {
        header: "Plan Tier",
        cell: (sub) => (
          <PlanBadge plan={sub.planName || sub.planId} size="sm" />
        ),
        className: "w-[130px]",
      },
      {
        header: "Billing Cycle",
        align: "center",
        cell: (sub) => (
          <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground font-medium capitalize">
            {sub.billingCycle}
          </span>
        ),
        className: "w-[120px]",
      },
      {
        header: "Seats",
        align: "right",
        cell: (sub) => (
          <span className="font-mono font-medium text-xs">{sub.seats}</span>
        ),
        className: "w-[80px]",
      },
      {
        header: "Recurring Amount",
        align: "right",
        sortable: true,
        sortDirection: subSortConfig?.key === "recurringAmount" ? subSortConfig.direction : null,
        onSort: (dir) => setSubSortConfig(dir ? { key: "recurringAmount", direction: dir } : null),
        cell: (sub) => (
          <span className="font-mono font-bold text-foreground text-xs">
            {formatCurrency(sub.recurringAmount, sub.currency)}
          </span>
        ),
        className: "w-[160px]",
      },
      {
        header: "Next Renewal",
        cell: (sub) => (
          <span className="text-xs text-muted-foreground">
            {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
        className: "w-[130px]",
      },
      {
        header: "Status",
        align: "center",
        cell: (sub) => getSubStatusBadge(sub.status),
        className: "w-[120px]",
      },
      {
        header: "Actions",
        align: "right",
        cell: (sub) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditSubscription(sub)}
            className="h-7 px-2.5 text-[11px] font-semibold"
          >
            Edit
          </Button>
        ),
        className: "w-20 text-right",
        headerClassName: "w-20 text-right",
      },
    ];
  }, [subSortConfig, setSubSortConfig, formatCurrency, onEditSubscription]);

  return (
    <div className="crm-table-workspace-sticky">
      <CRMToolbar
        searchQuery={subSearch}
        setSearchQuery={setSubSearch}
        placeholder="Search by organization or plan..."
        sticky={false}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
            {["all", "active", "trialing", "past_due", "canceled"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSubStatusFilter(st);
                  setSubPage(1);
                }}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  subStatusFilter === st
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Plan Filter */}
          <Select 
            value={subPlanFilter} 
            onValueChange={(val) => {
              setSubPlanFilter(val);
              setSubPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[170px] text-xs font-semibold bg-card border-border shadow-xs focus:ring-primary/20">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="growth">Growth / Pro</SelectItem>
              <SelectItem value="business">Business / Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CRMToolbar>

      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <CRMDataTable<PlatformSubscriptionItem>
          data={paginatedSubscriptions}
          columns={columns}
          isLoading={loading}
          isError={false}
          emptyIcon={CreditCard}
          emptyTitle="No platform subscriptions found"
          emptyDescription="No tenant organizations match your search or filter criteria."
          emptyAction={{
            label: "Create Subscription",
            onClick: onCreateSubscription,
          }}
          hasPagination={false}
        />

        {/* Pagination */}
        <CRMPagination
          currentPage={subPage}
          totalPages={totalSubPages}
          totalItems={filteredSubscriptions.length}
          rowsPerPage={subRowsPerPage}
          onPageChange={setSubPage}
          onRowsPerPageChange={(rows: number) => {
            setSubRowsPerPage(rows);
            setSubPage(1);
          }}
          itemName="Subscriptions"
        />
      </div>
    </div>
  );
}
