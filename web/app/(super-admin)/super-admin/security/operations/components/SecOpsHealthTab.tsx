"use client";

import React, { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { PlatformHealthRow } from "@/shared/lib/api/super-admin.api";
import { cn } from "@/shared/lib/utils";
import {
  CRMDataTable,
  CRMDataTableColumn,
} from "@/shared/components/crm/CRMDataTable";
import { getServiceIcon, getStatusBadge } from "./types";

interface SecOpsHealthTabProps {
  healthRows: PlatformHealthRow[];
}

export function SecOpsHealthTab({ healthRows }: SecOpsHealthTabProps) {
  const columns = useMemo<CRMDataTableColumn<PlatformHealthRow>[]>(() => {
    return [
      {
        header: "Service Subsystem",
        cell: (row) => {
          const IconComponent = getServiceIcon(row.service);
          return (
            <div className="font-semibold text-foreground flex items-center gap-2.5">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              <span>{row.service}</span>
            </div>
          );
        },
        className: "w-[200px]",
      },
      {
        header: "Health Status",
        cell: (row) => (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border uppercase tracking-wider",
              getStatusBadge(row.status)
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {row.status}
          </span>
        ),
        className: "w-[150px]",
      },
      {
        header: "Last Verified",
        cell: (row) => (
          <span className="text-muted-foreground font-mono text-[11px]">
            {new Date(row.lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        ),
        className: "w-[150px]",
      },
      {
        header: "Operational Telemetry Detail",
        cell: (row) => (
          <span className="text-muted-foreground font-medium">
            {row.detail}
          </span>
        ),
        className: "min-w-[200px]",
      },
    ];
  }, []);

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Subsystem Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 shrink-0">
        {healthRows.map((row) => {
          const IconComponent = getServiceIcon(row.service);
          const isHealthy = row.status === "Healthy";
          const isWarning = row.status === "Warning";

          return (
            <div
              key={row.service}
              className="bg-card border border-border/80 rounded-xl p-4 shadow-xs hover:border-border transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 transition-transform group-hover:scale-105",
                      isHealthy
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : isWarning
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                    )}
                  >
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {row.service}
                    </h4>
                    <span className="text-[10.5px] font-mono text-muted-foreground">
                      {new Date(row.lastChecked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                    getStatusBadge(row.status)
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isHealthy ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500"
                    )}
                  />
                  {row.status}
                </span>
              </div>

              <div className="pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  {row.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subsystem Health Detail Table */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">Platform Telemetry Status Matrix</h3>
              <p className="text-[11px] text-muted-foreground">
                Live end-to-end cryptographic and database connectivity checks
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            All 6 Subsystems Verified
          </span>
        </div>

        <CRMDataTable<PlatformHealthRow>
          data={healthRows}
          columns={columns}
          isLoading={false}
          isError={false}
          hasPagination={false}
        />
      </div>
    </div>
  );
}
