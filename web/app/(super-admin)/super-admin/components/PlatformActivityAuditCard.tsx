"use client";

import React from "react";
import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  actor: string;
  module: string;
  createdAt: string;
}

interface PlatformActivityAuditCardProps {
  recentAuditLogs?: AuditLogItem[];
}

export function PlatformActivityAuditCard({
  recentAuditLogs,
}: PlatformActivityAuditCardProps) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Platform Activity &amp; Audit Trail
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time security and administrative events recorded across the platform
            </p>
          </div>
        </div>

        <Link
          href="/super-admin/audit-logs"
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider transition-colors inline-flex items-center gap-1"
        >
          <span>View All Logs</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recentAuditLogs && recentAuditLogs.length > 0 ? (
          recentAuditLogs.slice(0, 6).map((log) => (
            <div
              key={log.id}
              className="rounded-xl bg-muted/20 border border-border/40 p-3.5 text-xs space-y-1.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-foreground truncate">
                  {log.action.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="truncate">
                  by <strong className="text-foreground">{log.actor}</strong>
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {log.module}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center col-span-2">
            No recent audit trail entries.
          </p>
        )}
      </div>
    </div>
  );
}
