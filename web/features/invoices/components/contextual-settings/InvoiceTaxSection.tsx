"use client";

import React from "react";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Percent } from "lucide-react";

export interface InvoiceTaxSectionProps {
  defaultTaxRate: string;
  setDefaultTaxRate: (v: string) => void;
  requireHsnSac: boolean;
  setRequireHsnSac: (v: boolean) => void;
  applyTaxPerLineItem: boolean;
  setApplyTaxPerLineItem: (v: boolean) => void;
  showTaxBreakdownTable: boolean;
  setShowTaxBreakdownTable: (v: boolean) => void;
  enableRoundOff: boolean;
  setEnableRoundOff: (v: boolean) => void;
  companyState: string;
  onChangeNotify: () => void;
}

export function InvoiceTaxSection({
  defaultTaxRate,
  setDefaultTaxRate,
  requireHsnSac,
  setRequireHsnSac,
  applyTaxPerLineItem,
  setApplyTaxPerLineItem,
  showTaxBreakdownTable,
  setShowTaxBreakdownTable,
  enableRoundOff,
  setEnableRoundOff,
  companyState,
  onChangeNotify,
}: InvoiceTaxSectionProps) {
  return (
    <div className="space-y-5">
      <SettingsSection
        title="GST Tax Rates & Calculation Behavior"
        description="Configure default GST percentages, intra/inter-state rules, HSN requirements, and total round-off precision."
        icon={Percent}
      >
        <div className="space-y-4">
          <SettingsRow
            label="Default GST Tax Rate"
            description="Standard tax percentage applied to newly added invoice line items."
          >
            <div className="flex items-center gap-2">
              <Select
                value={defaultTaxRate}
                onValueChange={(val) => { setDefaultTaxRate(val); onChangeNotify(); }}
              >
                <SelectTrigger className="h-8 text-xs font-semibold w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (Nil)</SelectItem>
                  <SelectItem value="5">5% GST</SelectItem>
                  <SelectItem value="12">12% GST</SelectItem>
                  <SelectItem value="18">18% GST</SelectItem>
                  <SelectItem value="28">28% GST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SettingsRow>

          {/* Intra vs Inter-state Explanation */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Percent className="w-3.5 h-3.5 text-primary" /> Automatic Place of Supply GST Determination
            </div>
            <p className="text-muted-foreground text-[11.5px] leading-relaxed">
              • <strong>Intra-State Sale (Same State as {companyState || "Company State"}):</strong> Automatically split into <strong>CGST (50%) + SGST (50%)</strong>.<br />
              • <strong>Inter-State Sale (Outside {companyState || "Company State"}):</strong> Automatically applied as full <strong>IGST (100%)</strong>.
            </p>
          </div>

          <div className="divide-y divide-border/40">
            <SettingsToggleRow
              label="Require HSN / SAC Code on Invoice Line Items"
              description="Mandatory for Indian GST B2B tax compliance and e-invoicing verification."
              checked={requireHsnSac}
              onCheckedChange={(c) => { setRequireHsnSac(c); onChangeNotify(); }}
            />
            <SettingsToggleRow
              label="Calculate Tax Per Individual Line Item"
              description="Allows line items with varying tax rates (e.g. 5%, 12%, 18%) on the same invoice."
              checked={applyTaxPerLineItem}
              onCheckedChange={(c) => { setApplyTaxPerLineItem(c); onChangeNotify(); }}
            />
            <SettingsToggleRow
              label="Show Itemized CGST / SGST / IGST Breakdown Table"
              description="Prints a comprehensive GST summary matrix with taxable value and split tax on customer PDF."
              checked={showTaxBreakdownTable}
              onCheckedChange={(c) => { setShowTaxBreakdownTable(c); onChangeNotify(); }}
            />
            <SettingsToggleRow
              label="Apply Automatic Round-Off on Grand Total"
              description="Rounds invoice total amount to the nearest whole rupee (₹1.00)."
              checked={enableRoundOff}
              onCheckedChange={(c) => { setEnableRoundOff(c); onChangeNotify(); }}
            />
          </div>

          {enableRoundOff && (
            <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2 shadow-xs">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Interactive Round-Off Example
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">Subtotal</span>
                  <span className="font-semibold text-foreground">₹10,000.40</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block">GST (18%)</span>
                  <span className="font-semibold text-foreground">₹1,800.07</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">Round-Off</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">-₹0.47</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">Grand Total</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">₹11,800.00</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
