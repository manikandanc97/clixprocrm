"use client";

import React from "react";
import { Flame, Search, ShieldCheck } from "lucide-react";
import { SecurityAlertItem } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CRMPagination, EmptyState } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { getStatusBadge } from "./types";

interface SecOpsAlertsTabProps {
  filteredAlerts: SecurityAlertItem[];
  paginatedAlerts: SecurityAlertItem[];
  alertStatusFilter: string;
  setAlertStatusFilter: (val: string) => void;
  alertSeverityFilter: string;
  setAlertSeverityFilter: (val: string) => void;
  alertSearch: string;
  setAlertSearch: (val: string) => void;
  alertPage: number;
  setAlertPage: (page: number) => void;
  alertRowsPerPage: number;
  setAlertRowsPerPage: (rows: number) => void;
  alertTotalPages: number;
  setSelectedAlert: (alert: SecurityAlertItem | null) => void;
  handleAcknowledgeAlert: (alertId: string) => Promise<void>;
  handleEscalateAlert: (alertId: string) => Promise<void>;
}

export function SecOpsAlertsTab({
  filteredAlerts,
  paginatedAlerts,
  alertStatusFilter,
  setAlertStatusFilter,
  alertSeverityFilter,
  setAlertSeverityFilter,
  alertSearch,
  setAlertSearch,
  alertPage,
  setAlertPage,
  alertRowsPerPage,
  setAlertRowsPerPage,
  alertTotalPages,
  setSelectedAlert,
  handleAcknowledgeAlert,
  handleEscalateAlert,
}: SecOpsAlertsTabProps) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
        <div>
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Security Alerts &amp; Threat Detections ({filteredAlerts.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Automated platform detection from failed login spikes, privilege modifications, and suspicious activity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={alertStatusFilter}
            onChange={(e) => {
              setAlertStatusFilter(e.target.value);
              setAlertPage(1);
            }}
            className="h-8 px-2.5 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={alertSeverityFilter}
            onChange={(e) => {
              setAlertSeverityFilter(e.target.value);
              setAlertPage(1);
            }}
            className="h-8 px-2.5 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={alertSearch}
              onChange={(e) => {
                setAlertSearch(e.target.value);
                setAlertPage(1);
              }}
              placeholder="Search alerts..."
              className="h-8 pl-8 pr-2 text-xs w-44"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead className="bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20">
            <tr className="text-foreground font-bold">
              <th className="px-4 py-3 border-r border-emerald-500/15">Severity</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Status</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Alert Type</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Title &amp; Description</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Detected</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {paginatedAlerts.length > 0 ? (
              paginatedAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 border-r border-border/30">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getStatusBadge(alert.severity))}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-border/30">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getStatusBadge(alert.status))}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[11px] text-foreground border-r border-border/30">
                    {alert.alertType}
                  </td>
                  <td className="px-4 py-3 max-w-sm border-r border-border/30">
                    <p className="font-semibold text-foreground truncate">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{alert.description}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] border-r border-border/30">
                    {new Date(alert.detectedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{" "}
                    {new Date(alert.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedAlert(alert)}
                      className="h-7 px-2 text-xs font-semibold"
                    >
                      Inspect
                    </Button>
                    {alert.status === "OPEN" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="h-7 px-2 text-xs font-semibold"
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.status !== "RESOLVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEscalateAlert(alert.id)}
                        className="h-7 px-2 text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                      >
                        Escalate
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  <EmptyState
                    icon={ShieldCheck}
                    title="All security systems operating normally"
                    description="No active security alerts or threat anomalies detected across platform telemetry."
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Alerts Pagination */}
      <CRMPagination
        currentPage={alertPage}
        totalPages={alertTotalPages}
        totalItems={filteredAlerts.length}
        rowsPerPage={alertRowsPerPage}
        onPageChange={setAlertPage}
        onRowsPerPageChange={(rows) => {
          setAlertRowsPerPage(rows);
          setAlertPage(1);
        }}
        itemName="alerts"
      />
    </div>
  );
}
