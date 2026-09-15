"use client";

import React from "react";
import { Clock } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { InvoiceType, InvoiceTimelineEventType } from "@/shared/types/invoice";

interface InvoiceTimelineTabProps {
  invoice: InvoiceType;
}

export function InvoiceTimelineTab({ invoice }: InvoiceTimelineTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">Invoice Timeline</h3>
        <p className="text-xs text-muted-foreground">Audit trail and life cycle events for this invoice</p>
      </div>

      {!invoice.timelineEvents || invoice.timelineEvents.length === 0 ? (
        <EmptyState
          title="No timeline events recorded"
          description="Timeline events will be logged as actions occur on this invoice."
          icon={Clock}
          className="border border-dashed border-border/80 rounded-2xl bg-muted/10 py-10"
        />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
          {(invoice.timelineEvents || []).map((evt: InvoiceTimelineEventType) => (
            <div key={evt.id} className="relative group">
              <div className="absolute -left-6 top-0.5 size-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="text-xs font-semibold text-foreground">{evt.description || evt.action}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(evt.createdAt).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
