"use client";

import React from "react";
import { ShieldAlert, Search, ShieldCheck } from "lucide-react";
import { SecurityIncidentItem } from "@/shared/lib/api/super-admin.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CRMPagination, EmptyState } from "@/shared/components/crm";
import { cn } from "@/shared/lib/utils";
import { getStatusBadge } from "./types";

interface SecOpsIncidentsTabProps {
  filteredIncidents: SecurityIncidentItem[];
  paginatedIncidents: SecurityIncidentItem[];
  incidentStatusFilter: string;
  setIncidentStatusFilter: (val: string) => void;
  incidentSearch: string;
  setIncidentSearch: (val: string) => void;
  incidentPage: number;
  setIncidentPage: (page: number) => void;
  incidentRowsPerPage: number;
  setIncidentRowsPerPage: (rows: number) => void;
  incidentTotalPages: number;
  setSelectedIncident: (inc: SecurityIncidentItem | null) => void;
  handleAcknowledgeIncident: (incidentId: string) => Promise<void>;
}

export function SecOpsIncidentsTab({
  filteredIncidents,
  paginatedIncidents,
  incidentStatusFilter,
  setIncidentStatusFilter,
  incidentSearch,
  setIncidentSearch,
  incidentPage,
  setIncidentPage,
  incidentRowsPerPage,
  setIncidentRowsPerPage,
  incidentTotalPages,
  setSelectedIncident,
  handleAcknowledgeIncident,
}: SecOpsIncidentsTabProps) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
        <div>
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span>Open Security Incidents ({filteredIncidents.length})</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Incident response management workflow: Triage, Investigation, Containment, and Sealed Resolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={incidentStatusFilter}
            onChange={(e) => {
              setIncidentStatusFilter(e.target.value);
              setIncidentPage(1);
            }}
            className="h-8 px-2.5 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CONTAINED">Contained</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={incidentSearch}
              onChange={(e) => {
                setIncidentSearch(e.target.value);
                setIncidentPage(1);
              }}
              placeholder="Search incidents..."
              className="h-8 pl-8 pr-2 text-xs w-44"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead className="bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20">
            <tr className="text-foreground font-bold">
              <th className="px-4 py-3 border-r border-emerald-500/15">Incident #</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Severity</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Status</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Title &amp; Context</th>
              <th className="px-4 py-3 border-r border-emerald-500/15">Detected</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {paginatedIncidents.length > 0 ? (
              paginatedIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-foreground border-r border-border/30">
                    {inc.incidentNumber}
                  </td>
                  <td className="px-4 py-3 border-r border-border/30">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getStatusBadge(inc.severity))}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-border/30">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider", getStatusBadge(inc.status))}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground truncate max-w-xs border-r border-border/30">
                    {inc.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] border-r border-border/30">
                    {new Date(inc.detectedAt || inc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{" "}
                    {new Date(inc.detectedAt || inc.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedIncident(inc)}
                      className="h-7 px-2 text-xs font-semibold"
                    >
                      Inspect
                    </Button>
                    {inc.status === "OPEN" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeIncident(inc.id)}
                        className="h-7 px-2 text-xs font-semibold"
                      >
                        Investigate
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
                    title="No active security incidents"
                    description="All security triage queues are clear and systems operate within safety baselines."
                    className="border-none bg-transparent shadow-none p-0 min-h-0"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Incidents Pagination */}
      <CRMPagination
        currentPage={incidentPage}
        totalPages={incidentTotalPages}
        totalItems={filteredIncidents.length}
        rowsPerPage={incidentRowsPerPage}
        onPageChange={setIncidentPage}
        onRowsPerPageChange={(rows) => {
          setIncidentRowsPerPage(rows);
          setIncidentPage(1);
        }}
        itemName="Incidents"
      />
    </div>
  );
}
