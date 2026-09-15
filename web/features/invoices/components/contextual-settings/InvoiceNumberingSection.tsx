"use client";

import React from "react";
import {
  SettingsSection,
  SettingsField,
  SettingsToggleRow,
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
import { Hash, ShieldCheck } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface InvoiceNumberingSectionProps {
  activeDocType: "INV" | "CN" | "DN";
  setActiveDocType: (v: "INV" | "CN" | "DN") => void;
  invoicePrefix: string;
  setInvoicePrefix: (v: string) => void;
  creditNotePrefix: string;
  setCreditNotePrefix: (v: string) => void;
  debitNotePrefix: string;
  setDebitNotePrefix: (v: string) => void;
  nextInvoiceNumber: string;
  setNextInvoiceNumber: (v: string) => void;
  financialYear: string;
  setFinancialYear: (v: string) => void;
  digitPadding: string;
  setDigitPadding: (v: string) => void;
  includeYearInPrefix: boolean;
  setIncludeYearInPrefix: (v: boolean) => void;
  onChangeNotify: () => void;
}

function getIdentifierPreview(
  type: "INV" | "CN" | "DN",
  invoicePrefix: string,
  creditNotePrefix: string,
  debitNotePrefix: string,
  digitPadding: string,
  nextInvoiceNumber: string,
  includeYearInPrefix: boolean
): string {
  const prefix =
    type === "INV" ? invoicePrefix : type === "CN" ? creditNotePrefix : debitNotePrefix;
  const pad = parseInt(digitPadding) || 5;
  const num = nextInvoiceNumber.padStart(pad, "0");
  const fy = includeYearInPrefix ? `${new Date().getFullYear()}/` : "";
  return `${prefix}${fy}${num}`;
}

export function InvoiceNumberingSection({
  activeDocType,
  setActiveDocType,
  invoicePrefix,
  setInvoicePrefix,
  creditNotePrefix,
  setCreditNotePrefix,
  debitNotePrefix,
  setDebitNotePrefix,
  nextInvoiceNumber,
  setNextInvoiceNumber,
  financialYear,
  setFinancialYear,
  digitPadding,
  setDigitPadding,
  includeYearInPrefix,
  setIncludeYearInPrefix,
  onChangeNotify,
}: InvoiceNumberingSectionProps) {
  const identifierPreview = getIdentifierPreview(
    activeDocType,
    invoicePrefix,
    creditNotePrefix,
    debitNotePrefix,
    digitPadding,
    nextInvoiceNumber,
    includeYearInPrefix
  );

  return (
    <div className="space-y-5">
      <SettingsSection
        title="Document Series & Sequential Numbering"
        description="Manage sequential serial codes and financial year namespacing for Invoices, Credit Notes, and Debit Notes."
        icon={Hash}
      >
        {/* Document Type Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60 max-w-sm">
          {(["INV", "CN", "DN"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveDocType(type)}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                activeDocType === type
                  ? "bg-background text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "INV" ? "Tax Invoice" : type === "CN" ? "Credit Note" : "Debit Note"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SettingsField
            label={`${activeDocType === "INV" ? "Invoice" : activeDocType === "CN" ? "Credit Note" : "Debit Note"} Prefix`}
            required
          >
            <Input
              value={
                activeDocType === "INV"
                  ? invoicePrefix
                  : activeDocType === "CN"
                  ? creditNotePrefix
                  : debitNotePrefix
              }
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                if (activeDocType === "INV") setInvoicePrefix(val);
                else if (activeDocType === "CN") setCreditNotePrefix(val);
                else setDebitNotePrefix(val);
                onChangeNotify();
              }}
              className="h-9 text-xs font-mono font-bold uppercase"
              placeholder="INV-"
            />
          </SettingsField>

          <SettingsField label="Starting / Next Sequence Counter" required>
            <Input
              type="number"
              min="1"
              value={nextInvoiceNumber}
              onChange={(e) => { setNextInvoiceNumber(e.target.value); onChangeNotify(); }}
              className="h-9 text-xs font-mono"
            />
          </SettingsField>

          <SettingsField label="Digit Padding Length">
            <Select value={digitPadding} onValueChange={(val) => { setDigitPadding(val); onChangeNotify(); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 Digits (e.g. 0001)</SelectItem>
                <SelectItem value="5">5 Digits (e.g. 00001)</SelectItem>
                <SelectItem value="6">6 Digits (e.g. 000001)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <SettingsField label="Financial Year Reference">
            <Select value={financialYear} onValueChange={(val) => { setFinancialYear(val); onChangeNotify(); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-2027">FY 2026-2027 (Standard Indian Fiscal)</SelectItem>
                <SelectItem value="2026-27">FY 2026-27 (Short)</SelectItem>
                <SelectItem value="2026">2026 (Calendar Year)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>

          <div className="pt-6">
            <SettingsToggleRow
              label="Include Current Year in Document Prefix"
              checked={includeYearInPrefix}
              onCheckedChange={(c) => { setIncludeYearInPrefix(c); onChangeNotify(); }}
            />
          </div>
        </div>

        {/* Identifier Preview Card */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[11px] block font-medium">
              Generated Document Identifier Preview:
            </span>
            <span className="text-xs font-bold text-foreground">
              {activeDocType === "INV" ? "Tax Invoice #" : activeDocType === "CN" ? "Credit Note #" : "Debit Note #"}
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-xs font-bold text-primary px-2.5 py-1 border-primary/30 bg-primary/5">
            {identifierPreview}
          </Badge>
        </div>

        {/* Immutability Notice */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed">
            <strong>GST Document Immutability:</strong> Once a tax invoice or credit note is officially issued and finalized, its serial number is permanently locked to preserve audit integrity and statutory compliance.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
