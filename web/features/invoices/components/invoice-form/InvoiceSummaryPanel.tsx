"use client";

import React from "react";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { useCurrency } from "@/shared/hooks/use-currency";
import { InvoiceTotals } from "./invoice-types";

interface InvoiceSummaryPanelProps {
  notes: string;
  termsAndConditions: string;
  currency: string;
  totals: InvoiceTotals;
  setNotes: (v: string) => void;
  setTermsAndConditions: (v: string) => void;
}

export function InvoiceSummaryPanel({
  notes,
  termsAndConditions,
  currency,
  totals,
  setNotes,
  setTermsAndConditions,
}: InvoiceSummaryPanelProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
      {/* Notes & Terms */}
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-foreground mb-1.5">Notes to Customer</Label>
          <Textarea
            rows={2}
            placeholder="Thank you for your business..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs resize-none"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground mb-1.5">Terms & Conditions</Label>
          <Textarea
            rows={2}
            placeholder="Payment is due within 15 days..."
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            className="text-xs resize-none"
          />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-muted/20 border border-border/70 rounded-xl p-4 space-y-2.5 font-sans">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Items Subtotal:</span>
          <span className="font-semibold text-foreground font-mono">
            {formatCurrency(totals.subtotal, currency)}
          </span>
        </div>
        {totals.totalDiscount > 0 && (
          <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Total Discount:</span>
            <span className="font-mono">-{formatCurrency(totals.totalDiscount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Taxable Amount:</span>
          <span className="font-semibold text-foreground font-mono">
            {formatCurrency(totals.taxable, currency)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>CGST (Intra-state):</span>
          <span className="font-mono">{formatCurrency(totals.cgst, currency)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>SGST (Intra-state):</span>
          <span className="font-mono">{formatCurrency(totals.sgst, currency)}</span>
        </div>
        {totals.roundOff !== 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Round Off:</span>
            <span className="font-mono">
              {totals.roundOff > 0 ? "+" : ""}{formatCurrency(totals.roundOff, currency)}
            </span>
          </div>
        )}
        <div className="pt-2 border-t border-border flex justify-between items-baseline">
          <span className="text-sm font-bold text-foreground">Grand Total:</span>
          <span className="text-lg font-black text-primary font-mono">
            {formatCurrency(totals.totalAmount, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
