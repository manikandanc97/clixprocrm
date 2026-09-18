"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  CRMToolbar,
  CRMPagination,
  TruncatedText,
  EmptyState,
} from "@/shared/components/crm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { PlanBadge } from "@/shared/components/PlanBadge";
import { DataTableColumnHeader } from "@/shared/components/DataTableColumnHeader";
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
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-20 bg-muted border-b border-border shadow-xs">
              <tr className="h-10 text-xs font-bold text-foreground">
                <th className="h-10 px-4 py-2 text-left border-r border-border/60 bg-muted whitespace-nowrap cursor-pointer select-none">
                  <DataTableColumnHeader
                    title="Organization"
                    sortable
                    sortDirection={subSortConfig?.key === "tenantName" ? subSortConfig.direction : null}
                    onSort={(d) => setSubSortConfig(d ? { key: "tenantName", direction: d } : null)}
                  />
                </th>
                <th className="h-10 px-4 py-2 text-left border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Plan Tier" />
                </th>
                <th className="h-10 px-4 py-2 text-center border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Billing Cycle" align="center" />
                </th>
                <th className="h-10 px-4 py-2 text-right border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Seats" align="right" />
                </th>
                <th className="h-10 px-4 py-2 text-right border-r border-border/60 bg-muted whitespace-nowrap cursor-pointer select-none">
                  <DataTableColumnHeader
                    title="Recurring Amount"
                    align="right"
                    sortable
                    sortDirection={subSortConfig?.key === "recurringAmount" ? subSortConfig.direction : null}
                    onSort={(d) => setSubSortConfig(d ? { key: "recurringAmount", direction: d } : null)}
                  />
                </th>
                <th className="h-10 px-4 py-2 text-left border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Next Renewal" />
                </th>
                <th className="h-10 px-4 py-2 text-center border-r border-border/60 bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Status" align="center" />
                </th>
                <th className="h-10 w-20 px-4 py-2 text-right bg-muted whitespace-nowrap">
                  <DataTableColumnHeader title="Actions" align="right" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4"><div className="h-4 w-36 bg-muted rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-20 bg-muted rounded-full" /></td>
                    <td className="px-4 py-4 text-center"><div className="h-4 w-16 bg-muted rounded mx-auto" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 w-8 bg-muted rounded ml-auto" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 w-20 bg-muted rounded ml-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-4 py-4 text-center"><div className="h-5 w-16 bg-muted rounded-full mx-auto" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-7 w-14 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 border-0">
                    <EmptyState
                      title="No platform subscriptions found"
                      description="No tenant organizations match your search or filter criteria."
                      icon={CreditCard}
                      className="border-none bg-transparent shadow-none p-0 min-h-0"
                      action={{
                        label: "Create Subscription",
                        onClick: onCreateSubscription,
                      }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedSubscriptions.map((sub) => (
                  <tr key={sub.id} className="group h-16 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {(() => {
                          const orgColor = getOrgAvatarColor(sub.tenantName);
                          return (
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
                          );
                        })()}
                        <div className="min-w-0">
                          <TruncatedText text={sub.tenantName} lines={1} className="font-bold text-foreground text-xs" />
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            ID: {sub.tenantId?.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PlanBadge plan={sub.planName || sub.planId} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-center capitalize text-xs text-muted-foreground font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-muted/40 border border-border/60">
                        {sub.billingCycle}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-xs">
                      {sub.seats}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground text-xs">
                      {formatCurrency(sub.recurringAmount, sub.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getSubStatusBadge(sub.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditSubscription(sub)}
                        className="h-7 px-2.5 text-[11px] font-semibold"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
