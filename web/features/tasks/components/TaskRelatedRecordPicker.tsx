"use client";

import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import { useLeads, useCustomers, useQuotations } from "@/shared/hooks/use-crm";

export type RelationType = "lead" | "customer" | "quotation";

export interface RelatedRecord {
  type: RelationType;
  id: string;
  label: string;
  sub?: string;
}

export const RECORD_TYPE_LABELS: Record<RelationType, { label: string; color: string }> = {
  lead: { label: "Lead", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  customer: { label: "Customer", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  quotation: { label: "Quote", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
};

interface TaskRelatedRecordPickerProps {
  relatedRecord: RelatedRecord | null;
  onSelectRecord: (record: RelatedRecord | null) => void;
}

export function TaskRelatedRecordPicker({
  relatedRecord,
  onSelectRecord,
}: TaskRelatedRecordPickerProps) {
  const [recordSearch, setRecordSearch] = useState("");
  const [recordDropdownOpen, setRecordDropdownOpen] = useState(false);

  const { data: leadsData } = useLeads();
  const { data: customersData } = useCustomers();
  const { data: quotesData } = useQuotations();

  const leads = leadsData?.leads || (Array.isArray(leadsData) ? leadsData : []);
  const customers = customersData?.customers || (Array.isArray(customersData) ? customersData : []);
  const quotes = quotesData?.quotations || (Array.isArray(quotesData) ? quotesData : []);

  const recordResults = useMemo(() => {
    if (!recordSearch.trim()) return [];
    const q = recordSearch.toLowerCase();
    const results: RelatedRecord[] = [];

    leads.forEach((l: any) => {
      if (l.name?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q)) {
        results.push({ type: "lead", id: l.id, label: l.name, sub: l.company });
      }
    });

    customers.forEach((c: any) => {
      if (c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)) {
        results.push({ type: "customer", id: c.id, label: c.name, sub: c.company });
      }
    });

    quotes.forEach((qu: any) => {
      const title = qu.title || qu.quoteNumber || "Quote";
      if (title.toLowerCase().includes(q) || qu.customerName?.toLowerCase().includes(q)) {
        results.push({ type: "quotation", id: qu.id, label: title, sub: qu.customerName });
      }
    });

    return results.slice(0, 10);
  }, [recordSearch, leads, customers, quotes]);

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
        Related Record
      </Label>

      {relatedRecord ? (
        <div className="h-10 rounded-lg border border-border bg-muted/10 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                RECORD_TYPE_LABELS[relatedRecord.type].color,
              )}
            >
              {RECORD_TYPE_LABELS[relatedRecord.type].label}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {relatedRecord.label}
            </span>
            {relatedRecord.sub && (
              <span className="text-xs text-muted-foreground truncate">
                — {relatedRecord.sub}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onSelectRecord(null)}
            aria-label="Remove related record"
            className="text-muted-foreground hover:text-destructive shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search leads, customers, quotes..."
              value={recordSearch}
              onChange={(e) => {
                setRecordSearch(e.target.value);
                setRecordDropdownOpen(true);
              }}
              onFocus={() => setRecordDropdownOpen(true)}
              onBlur={() => setTimeout(() => setRecordDropdownOpen(false), 200)}
              className="h-10 pl-9 text-sm"
            />
          </div>

          {recordDropdownOpen && recordResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
              {recordResults.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelectRecord(r);
                    setRecordSearch("");
                    setRecordDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-muted/60 flex items-center gap-2 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                      RECORD_TYPE_LABELS[r.type].color,
                    )}
                  >
                    {RECORD_TYPE_LABELS[r.type].label}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {r.label}
                  </span>
                  {r.sub && (
                    <span className="text-xs text-muted-foreground truncate ml-auto">
                      {r.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {recordDropdownOpen && recordSearch.trim() && recordResults.length === 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg px-3 py-4 text-center">
              <p className="text-xs text-muted-foreground">No records found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
