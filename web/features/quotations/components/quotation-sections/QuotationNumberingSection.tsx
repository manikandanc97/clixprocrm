"use client";

import React from "react";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Hash, Sparkles, AlertCircle } from "lucide-react";

interface QuotationNumberingSectionProps {
  quotePrefix: string;
  setQuotePrefix: (val: string) => void;
  nextSequenceNumber: string;
  setNextSequenceNumber: (val: string) => void;
  digitPadding: string;
  setDigitPadding: (val: string) => void;
  includeYearInPrefix: boolean;
  setIncludeYearInPrefix: (val: boolean) => void;
  autoIncrementSequence: boolean;
  setAutoIncrementSequence: (val: boolean) => void;
  resetSequenceOnYearEnd: boolean;
  setResetSequenceOnYearEnd: (val: boolean) => void;
  errors: Record<string, string>;
  formatPreview: string;
  setHasChanges: (val: boolean) => void;
}

export function QuotationNumberingSection({
  quotePrefix,
  setQuotePrefix,
  nextSequenceNumber,
  setNextSequenceNumber,
  digitPadding,
  setDigitPadding,
  includeYearInPrefix,
  setIncludeYearInPrefix,
  autoIncrementSequence,
  setAutoIncrementSequence,
  resetSequenceOnYearEnd,
  setResetSequenceOnYearEnd,
  errors,
  formatPreview,
  setHasChanges,
}: QuotationNumberingSectionProps) {
  return (
    <div className="space-y-4">
      <SettingsSection
        title="Quote Reference & Numbering Sequence"
        description="Configure automated quotation ID formats, prefixes, and sequence counters."
        icon={Hash}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <SettingsField
            label="Prefix"
            description="Short identifier prepended to quote numbers."
            required
          >
            <Input
              value={quotePrefix}
              onChange={(e) => {
                setQuotePrefix(e.target.value.toUpperCase());
                setHasChanges(true);
              }}
              className={`h-9 text-xs font-mono uppercase ${
                errors.prefix ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
              placeholder="QT-"
            />
            {errors.prefix && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.prefix}
              </p>
            )}
          </SettingsField>

          <SettingsField
            label="Next Sequence Number"
            description="Next counter value for newly created quotes."
            required
          >
            <Input
              type="number"
              min="1"
              value={nextSequenceNumber}
              onChange={(e) => {
                setNextSequenceNumber(e.target.value);
                setHasChanges(true);
              }}
              className={`h-9 text-xs font-mono ${
                errors.nextSequenceNumber ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            />
            {errors.nextSequenceNumber && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors.nextSequenceNumber}
              </p>
            )}
          </SettingsField>

          <SettingsField
            label="Digit Padding Length"
            description="Total number of digits for the sequential counter."
          >
            <Select
              value={digitPadding}
              onValueChange={(val) => {
                setDigitPadding(val);
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 Digits (0001)</SelectItem>
                <SelectItem value="5">5 Digits (00001)</SelectItem>
                <SelectItem value="6">6 Digits (000001)</SelectItem>
                <SelectItem value="7">7 Digits (0000001)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
        </div>

        {/* Generated Format Preview */}
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Generated Format Preview:
            </span>
            <p className="text-[11px] text-muted-foreground">
              The quotation sequence automatically increments whenever a new quotation is issued.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Badge
              variant="outline"
              className="font-mono text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            >
              {formatPreview}
            </Badge>
          </div>
        </div>

        {/* Sequence Automation Controls */}
        <div className="divide-y divide-border/40 border border-border/60 rounded-lg px-3 bg-muted/10">
          <SettingsToggleRow
            label="Include Current Fiscal Year in Prefix"
            description="Adds active year indicator into quote ID format (e.g., QT-2026-01001)."
            checked={includeYearInPrefix}
            onCheckedChange={(c) => {
              setIncludeYearInPrefix(c);
              setHasChanges(true);
            }}
          />
          <SettingsToggleRow
            label="Auto-Increment Sequence on Quote Creation"
            description="Automatically advance sequence number when a quote is created."
            checked={autoIncrementSequence}
            onCheckedChange={(c) => {
              setAutoIncrementSequence(c);
              setHasChanges(true);
            }}
          />
          <SettingsToggleRow
            label="Reset Sequence on New Fiscal Year"
            description="Restart numbering counter back to 00001 at the beginning of each financial year."
            checked={resetSequenceOnYearEnd}
            onCheckedChange={(c) => {
              setResetSequenceOnYearEnd(c);
              setHasChanges(true);
            }}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
