"use client";

import React from "react";
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { SlidersHorizontal, AlertCircle } from "lucide-react";
import {
  CURRENCIES,
  PAYMENT_PRESETS,
} from "../../constants/quotation-settings.constants";

interface QuotationApprovalSectionProps {
  defaultCurrency: string;
  setDefaultCurrency: (val: string) => void;
  defaultTaxRate: string;
  setDefaultTaxRate: (val: string) => void;
  defaultPaymentTermsPreset: string;
  setDefaultPaymentTermsPreset: (val: string) => void;
  defaultValidityDays: string;
  setDefaultValidityDays: (val: string) => void;
  enableApprovalWorkflow: boolean;
  setEnableApprovalWorkflow: (val: boolean) => void;
  requireApprovalForExcessiveDiscounts: boolean;
  setRequireApprovalForExcessiveDiscounts: (val: boolean) => void;
  maxDiscountWithoutApproval: string;
  setMaxDiscountWithoutApproval: (val: string) => void;
  requireHighValueApproval: boolean;
  setRequireHighValueApproval: (val: boolean) => void;
  highValueThreshold: string;
  setHighValueThreshold: (val: string) => void;
  errors: Record<string, string>;
  setHasChanges: (val: boolean) => void;
}

export function QuotationApprovalSection({
  defaultCurrency,
  setDefaultCurrency,
  defaultTaxRate,
  setDefaultTaxRate,
  defaultPaymentTermsPreset,
  setDefaultPaymentTermsPreset,
  defaultValidityDays,
  setDefaultValidityDays,
  enableApprovalWorkflow,
  setEnableApprovalWorkflow,
  requireApprovalForExcessiveDiscounts,
  setRequireApprovalForExcessiveDiscounts,
  maxDiscountWithoutApproval,
  setMaxDiscountWithoutApproval,
  requireHighValueApproval,
  setRequireHighValueApproval,
  highValueThreshold,
  setHighValueThreshold,
  errors,
  setHasChanges,
}: QuotationApprovalSectionProps) {
  return (
    <div className="space-y-4">
      <SettingsSection
        title="Quotation Defaults & Governance Approvals"
        description="Set default financial parameters, quote validity periods, and discount authorization limits."
        icon={SlidersHorizontal}
      >
        {/* Financial & Duration Defaults */}
        <div>
          <h5 className="text-xs font-semibold text-foreground mb-2 px-1">
            Quotation Financial & Duration Defaults
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SettingsField
              label="Default Currency"
              description="Default billing currency."
            >
              <Select
                value={defaultCurrency}
                onValueChange={(val) => {
                  setDefaultCurrency(val);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger className="h-9 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((cur) => (
                    <SelectItem key={cur.code} value={cur.code}>
                      {cur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>

            <SettingsField
              label="Default Tax Rate (%)"
              description="Standard tax percentage."
              required
            >
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={defaultTaxRate}
                  onChange={(e) => {
                    setDefaultTaxRate(e.target.value);
                    setHasChanges(true);
                  }}
                  className={`h-9 text-xs pr-7 font-mono ${
                    errors.defaultTaxRate ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
              {errors.defaultTaxRate && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.defaultTaxRate}
                </p>
              )}
            </SettingsField>

            <SettingsField
              label="Payment Terms Preset"
              description="Pre-selected term rule."
            >
              <Select
                value={defaultPaymentTermsPreset}
                onValueChange={(val) => {
                  setDefaultPaymentTermsPreset(val);
                  setHasChanges(true);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsField>

            <SettingsField
              label="Default Validity Period"
              description="Days until quote expires."
              required
            >
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={defaultValidityDays}
                  onChange={(e) => {
                    setDefaultValidityDays(e.target.value);
                    setHasChanges(true);
                  }}
                  className={`h-9 text-xs pr-11 font-mono ${
                    errors.defaultValidityDays ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground pointer-events-none">
                  days
                </span>
              </div>
              {errors.defaultValidityDays && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.defaultValidityDays}
                </p>
              )}
            </SettingsField>
          </div>
        </div>

        {/* Approval Governance Workflow */}
        <div className="pt-2">
          <h5 className="text-xs font-semibold text-foreground mb-2 px-1">
            Approval Governance & Authorization
          </h5>
          <div className="divide-y divide-border/40 border border-border/60 rounded-lg px-3 bg-muted/10">
            <SettingsToggleRow
              label="Enable quotation approval workflow"
              description="Require manager review and sign-off before quotations can be published or dispatched to clients."
              checked={enableApprovalWorkflow}
              onCheckedChange={(c) => {
                setEnableApprovalWorkflow(c);
                setHasChanges(true);
              }}
            />

            {enableApprovalWorkflow && (
              <>
                <SettingsToggleRow
                  label="Require approval for excessive discounts"
                  description="Require manager approval when a quotation exceeds the allowed discount threshold."
                  checked={requireApprovalForExcessiveDiscounts}
                  onCheckedChange={(c) => {
                    setRequireApprovalForExcessiveDiscounts(c);
                    setHasChanges(true);
                  }}
                />

                {requireApprovalForExcessiveDiscounts && (
                  <div className="py-2.5 px-2 -mx-2 bg-muted/20 rounded-md">
                    <SettingsField
                      label="Maximum discount allowed without approval (%)"
                      description="Discounts exceeding this threshold will automatically flag the quote for manager authorization."
                      required
                    >
                      <div className="relative max-w-xs">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={maxDiscountWithoutApproval}
                          onChange={(e) => {
                            setMaxDiscountWithoutApproval(e.target.value);
                            setHasChanges(true);
                          }}
                          className={`h-9 text-xs pr-7 font-mono ${
                            errors.maxDiscountWithoutApproval ? "border-destructive focus-visible:ring-destructive" : ""
                          }`}
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground pointer-events-none">
                          %
                        </span>
                      </div>
                      {errors.maxDiscountWithoutApproval && (
                        <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.maxDiscountWithoutApproval}
                        </p>
                      )}
                    </SettingsField>
                  </div>
                )}

                <SettingsToggleRow
                  label="Require approval for high-value quotations"
                  description="Require executive sign-off for quotations exceeding a predefined financial amount threshold."
                  checked={requireHighValueApproval}
                  onCheckedChange={(c) => {
                    setRequireHighValueApproval(c);
                    setHasChanges(true);
                  }}
                />

                {requireHighValueApproval && (
                  <div className="py-2.5 px-2 -mx-2 bg-muted/20 rounded-md">
                    <SettingsField
                      label="High-Value Quotation Threshold Amount"
                      description="Quotations with total contract value above this figure will mandate executive approval."
                      required
                    >
                      <div className="relative max-w-xs">
                        <Input
                          type="number"
                          min="1"
                          value={highValueThreshold}
                          onChange={(e) => {
                            setHighValueThreshold(e.target.value);
                            setHasChanges(true);
                          }}
                          className={`h-9 text-xs pr-12 font-mono ${
                            errors.highValueThreshold ? "border-destructive focus-visible:ring-destructive" : ""
                          }`}
                        />
                        <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground pointer-events-none">
                          {defaultCurrency}
                        </span>
                      </div>
                      {errors.highValueThreshold && (
                        <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.highValueThreshold}
                        </p>
                      )}
                    </SettingsField>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
