"use client";

import React, { useState } from "react";
import {
  History,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Download,
  KeyRound,
  ShieldAlert,
  Laptop,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CRMCard } from "@/shared/components/crm";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  fetchSecurityActivity,
  SecurityActivityDto,
} from "@/shared/lib/api/sessions.api";
import { toast } from "sonner";

export default function AuditLogSettings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const {
    data: activityData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["security-activity", page],
    queryFn: () => fetchSecurityActivity(page, 25),
    staleTime: 30_000,
  });

  const activities = activityData?.activity || [];

  const filteredActivities = activities.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.action.toLowerCase().includes(term) ||
      a.module?.toLowerCase().includes(term) ||
      a.ipAddress?.toLowerCase().includes(term) ||
      a.browser?.toLowerCase().includes(term)
    );
  });

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("login") || act.includes("signin")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20">
          Sign In
        </Badge>
      );
    }
    if (act.includes("password")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-amber-600 bg-amber-500/10 border-amber-500/20">
          Password Change
        </Badge>
      );
    }
    if (act.includes("mfa") || act.includes("2fa")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 border-indigo-500/20">
          MFA Event
        </Badge>
      );
    }
    if (act.includes("revoke") || act.includes("logout")) {
      return (
        <Badge variant="outline" className="text-[10px] font-bold text-destructive bg-destructive/10 border-destructive/20">
          Session Revoke
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
        {action}
      </Badge>
    );
  };

  const handleExport = () => {
    if (activities.length === 0) {
      toast.info("No audit logs to export");
      return;
    }
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Timestamp,Action,Module,IP Address,Browser,OS"]
        .concat(
          activities.map(
            (a) =>
              `"${a.createdAt}","${a.action}","${a.module || ""}","${a.ipAddress || ""}","${a.browser || ""}","${a.operatingSystem || ""}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit log exported to CSV");
  };

  return (
    <div className="min-h-full flex-1 flex flex-col">
      <CRMCard className="min-h-full flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Security Audit Trail & Logs</h3>
                {activityData?.total !== undefined && (
                  <Badge variant="outline" className="text-[10px] font-bold text-primary bg-primary/10 border-primary/20">
                    {activityData.total} Events Recorded
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Immutable chronological log of authentication, password updates, and administrative security events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isLoading}
              className="text-xs font-semibold gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs font-semibold gap-1.5 h-9"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-4 pb-2">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by action, IP address, or browser..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        {isLoading ? (
          <div className="mt-3 border rounded-xl overflow-hidden divide-y divide-border/50">
            <div className="grid grid-cols-12 bg-card border-b border-border/60 px-4 py-2.5 h-10 sm:h-11 items-center">
              <Skeleton className="col-span-4 h-3.5 w-28" />
              <Skeleton className="col-span-3 h-3.5 w-24" />
              <Skeleton className="col-span-2 h-3.5 w-20" />
              <Skeleton className="col-span-3 h-3.5 w-20 ml-auto" />
            </div>

            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-12 items-center px-4 py-3 gap-3"
              >
                <div className="col-span-4 flex items-center gap-2.5">
                  <Skeleton className="w-6 h-6 rounded-md shrink-0" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-3.5 w-36" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-3.5 w-24 font-mono" />
                </div>
                <div className="col-span-3 flex justify-end">
                  <Skeleton className="h-3.5 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 mt-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs font-medium">
            Failed to load audit activity. Please refresh.
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 mt-4 text-center text-xs text-muted-foreground font-medium border border-dashed rounded-xl">
            No audit records matching criteria.
          </div>
        ) : (
          <div className="mt-3 border rounded-xl overflow-hidden divide-y divide-border/50 text-xs">
            <div className="grid grid-cols-12 bg-card border-b border-border/60 px-4 py-2.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.05em] leading-tight h-10 sm:h-11 items-center">
              <span className="col-span-4">Event / Action</span>
              <span className="col-span-3">Client &amp; Device</span>
              <span className="col-span-2">IP Address</span>
              <span className="col-span-3 text-right">Timestamp</span>
            </div>

            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-2">
                  {getActionBadge(act.action)}
                  <span className="font-semibold text-foreground truncate">{act.action}</span>
                </div>

                <div className="col-span-3 text-muted-foreground">
                  {act.browser || "Browser"} on {act.operatingSystem || "OS"}
                </div>

                <div className="col-span-2 font-mono text-[11px] text-muted-foreground">
                  {act.ipAddress || "—"}
                </div>

                <div className="col-span-3 text-right text-muted-foreground text-[11px]">
                  {new Date(act.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CRMCard>
    </div>
  );
}
