"use client";

import React from "react";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Percent } from "lucide-react";

interface QuotationTaxesSectionProps {
  defaultTaxType: "GST" | "VAT" | "NO_TAX";
  setDefaultTaxType: (val: "GST" | "VAT" | "NO_TAX") => void;
  taxCalculationMode: "PER_ITEM" | "ON_SUBTOTAL";
  setTaxCalculationMode: (val: "PER_ITEM" | "ON_SUBTOTAL") => void;
  defaultDiscountType: "PERCENTAGE" | "FIXED";
  setDefaultDiscountType: (val: "PERCENTAGE" | "FIXED") => void;
  taxInclusivePricing: boolean;
  setTaxInclusivePricing: (val: boolean) => void;
  requireHSNSAC: boolean;
  setRequireHSNSAC: (val: boolean) => void;
  allowLineItemDiscounts: boolean;
  setAllowLineItemDiscounts: (val: boolean) => void;
  setHasChanges: (val: boolean) => void;
}

export function QuotationTaxesSection({
  defaultTaxType,
  setDefaultTaxType,
  taxCalculationMode,
  setTaxCalculationMode,
  defaultDiscountType,
  setDefaultDiscountType,
  taxInclusivePricing,
  setTaxInclusivePricing,
  requireHSNSAC,
  setRequireHSNSAC,
  allowLineItemDiscounts,
  setAllowLineItemDiscounts,
  setHasChanges,
}: QuotationTaxesSectionProps) {
  return (
    <div className="space-y-4">
      <SettingsSection
        title="Taxes & Line-Item Calculation Rules"
        description="Configure tax calculation mode, tax types, inclusive pricing, and line discount rules."
        icon={Percent}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <SettingsField
            label="Default Tax Type"
            description="Primary tax framework applied to quotation line items."
          >
            <Select
              value={defaultTaxType}
              onValueChange={(val: "GST" | "VAT" | "NO_TAX") => {
                setDefaultTaxType(val);
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GST">GST (Goods & Services Tax)</SelectItem>
                <SelectItem value="VAT">VAT (Value Added Tax)</SelectItem>
                <SelectItem value="NO_TAX">No Tax (Zero-rated / Exempt)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField
            label="Tax Calculation Mode"
            description="Method used for computing quotation tax amounts."
          >
            <Select
              value={taxCalculationMode}
              onValueChange={(val: "PER_ITEM" | "ON_SUBTOTAL") => {
                setTaxCalculationMode(val);
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PER_ITEM">Tax per line item</SelectItem>
                <SelectItem value="ON_SUBTOTAL">Tax on subtotal</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField
            label="Default Discount Basis"
            description="Standard discount entry mode on newly added line items."
          >
            <Select
              value={defaultDiscountType}
              onValueChange={(val: "PERCENTAGE" | "FIXED") => {
                setDefaultDiscountType(val);
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                <SelectItem value="FIXED">Fixed Currency Amount</SelectItem>
              </SelectContent>
            </Select>
          </SettingsField>
        </div>

        {/* Tax Rules & Compliance */}
        <div className="divide-y divide-border/40 border border-border/60 rounded-lg px-3 bg-muted/10">
          <SettingsToggleRow
            label="Tax-Inclusive Pricing"
            description="When enabled, entered unit prices are treated as already inclusive of statutory taxes."
            checked={taxInclusivePricing}
            onCheckedChange={(c) => {
              setTaxInclusivePricing(c);
              setHasChanges(true);
            }}
          />
          <SettingsToggleRow
            label="Require HSN / SAC Code"
            description="Mandate product/service tax classification codes on all quotation line items."
            checked={requireHSNSAC}
            onCheckedChange={(c) => {
              setRequireHSNSAC(c);
              setHasChanges(true);
            }}
          />
          <SettingsToggleRow
            label="Allow Line-Item Discounts"
            description="Permit sales representatives to apply discounts on individual line items in addition to quote-level discounts."
            checked={allowLineItemDiscounts}
            onCheckedChange={(c) => {
              setAllowLineItemDiscounts(c);
              setHasChanges(true);
            }}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
