"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { AttentionRequiredItem } from "@/shared/lib/api/super-admin.api";

interface AttentionRequiredPanelProps {
  attentionItems: AttentionRequiredItem[];
}

export function AttentionRequiredPanel({
  attentionItems,
}: AttentionRequiredPanelProps) {
  return (
    <div className="rounded-2xl bg-card border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border ${
              attentionItems.length > 0
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Attention Required
          </h3>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            attentionItems.length > 0
              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          }`}
        >
          {attentionItems.length} Action{attentionItems.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {attentionItems.length > 0 ? (
          attentionItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 p-3 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    item.severity === "CRITICAL"
                      ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                      : item.severity === "WARNING"
                      ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                      : "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                  }`}
                >
                  {item.severity}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <p className="text-xs font-bold text-foreground leading-tight">
                {item.title}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {item.description}
              </p>

              <div className="pt-1 flex items-center justify-between">
                {item.entityName && (
                  <span className="text-[10px] font-semibold text-foreground/80 bg-muted/60 px-2 py-0.5 rounded">
                    {item.entityName}
                  </span>
                )}
                <Link
                  href={item.targetUrl}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 ml-auto"
                >
                  <span>Review</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-foreground">
              All systems are operating normally
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Zero critical incidents, service anomalies, or overdue accounts requiring intervention.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
