"use client";

import React, { useMemo } from "react";
import { Flame, Search, ShieldCheck } from "lucide-react";
import { SecurityAlertItem } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CRMPagination } from "@/shared/components/crm";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
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

  const columns = useMemo<CRMDataTableColumn<SecurityAlertItem>[]>(() => {
    return [
      {
        header: "Severity",
        cell: (alert) => (
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getStatusBadge(alert.severity))}>
            {alert.severity}
          </span>
        ),
        className: "w-[120px]",
      },
      {
        header: "Status",
        cell: (alert) => (
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getStatusBadge(alert.status))}>
            {alert.status}
          </span>
        ),
        className: "w-[120px]",
      },
      {
        header: "Alert Type",
        cell: (alert) => (
          <span className="font-mono font-bold text-[11px] text-foreground">
            {alert.alertType}
          </span>
        ),
        className: "w-[160px]",
      },
      {
        header: "Title & Description",
        cell: (alert) => (
          <div className="max-w-sm">
            <p className="font-semibold text-foreground truncate">{alert.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{alert.description}</p>
          </div>
        ),
        className: "min-w-[200px]",
      },
      {
        header: "Detected",
        cell: (alert) => (
          <span className="text-muted-foreground font-mono text-[11px]">
            {new Date(alert.detectedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{" "}
            {new Date(alert.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        ),
        className: "w-[140px]",
      },
      {
        header: "Actions",
        align: "right",
        cell: (alert) => (
          <div className="flex items-center justify-end gap-1.5">
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
          </div>
        ),
        className: "w-[240px] text-right",
        headerClassName: "w-[240px] text-right",
      },
    ];
  }, [setSelectedAlert, handleAcknowledgeAlert, handleEscalateAlert]);

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 shrink-0">
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
          <Select 
            value={alertStatusFilter} 
            onValueChange={(val) => {
              setAlertStatusFilter(val);
              setAlertPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] px-2.5 bg-background border-border/70 text-xs font-semibold shadow-2xs focus:ring-primary/20">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={alertSeverityFilter} 
            onValueChange={(val) => {
              setAlertSeverityFilter(val);
              setAlertPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] px-2.5 bg-background border-border/70 text-xs font-semibold shadow-2xs focus:ring-primary/20">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

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

      <CRMDataTable<SecurityAlertItem>
        data={paginatedAlerts}
        columns={columns}
        isLoading={false}
        isError={false}
        emptyIcon={ShieldCheck}
        emptyTitle="All security systems operating normally"
        emptyDescription="No active security alerts or threat anomalies detected across platform telemetry."
        hasPagination={false}
      />

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
        itemName="Alerts"
      />
    </div>
  );
}
