"use client";

import React, { useState } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import {
  SettingsSection,
  SettingsRow,
  SettingsToggleRow,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { toast } from "sonner";
import {
  FileText,
  LayoutTemplate,
  Hash,
  Percent,
  FileCheck2,
  SlidersHorizontal,
  Check,
} from "lucide-react";

export interface QuotationContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

const TEMPLATES = [
  { id: "modern", name: "Modern Minimal", description: "Clean typography with emerald accents and structured summary blocks." },
  { id: "classic", name: "Classic Professional", description: "Traditional corporate layout with bordered tables and header crest." },
  { id: "compact", name: "Enterprise Compact", description: "High data-density layout ideal for multi-line item quotations." },
];

export function QuotationContextualSettings({
  open,
  onOpenChange,
  defaultSection = "templates",
}: QuotationContextualSettingsProps) {
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showCompanyLogo, setShowCompanyLogo] = useState(true);
  const [showSignatureBlock, setShowSignatureBlock] = useState(true);

  // Numbering
  const [quotePrefix, setQuotePrefix] = useState("QT-");
  const [nextSequenceNumber, setNextSequenceNumber] = useState("1001");
  const [digitPadding, setDigitPadding] = useState("5");

  // Taxes
  const [defaultTaxRate, setDefaultTaxRate] = useState("18");
  const [taxInclusivePricing, setTaxInclusivePricing] = useState(false);
  const [requireHSNSAC, setRequireHSNSAC] = useState(true);

  // Terms & Conditions
  const [defaultValidityDays, setDefaultValidityDays] = useState("30");
  const [standardPaymentTerms, setStandardPaymentTerms] = useState("50% advance upon quote approval, balance upon project delivery.");
  const [legalDisclaimer, setLegalDisclaimer] = useState("This quotation is subject to our standard service agreements and is valid for 30 calendar days from issue date.");

  // Default Values
  const [defaultDiscountLimit, setDefaultDiscountLimit] = useState("15");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [requireManagerApproval, setRequireManagerApproval] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    toast.success("Quotation settings saved successfully");
    onOpenChange(false);
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "templates",
      label: "Templates & Layout",
      icon: LayoutTemplate,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Quotation PDF & View Templates"
            description="Select visual styling, brand layout, and presentation theme for customer quotes."
            icon={LayoutTemplate}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl.id);
                      setHasChanges(true);
                    }}
                    className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                        : "border-border hover:border-border/80 bg-card"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <p className="font-semibold text-xs text-foreground">{tmpl.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      {tmpl.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="divide-y divide-border/40 pt-2">
              <SettingsToggleRow
                label="Embed Company Logo on Header"
                description="Include primary workspace logo on generated PDF quotes."
                checked={showCompanyLogo}
                onCheckedChange={(c) => {
                  setShowCompanyLogo(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Include Authorized Signatory Block"
                description="Display signature line and acceptance seal box."
                checked={showSignatureBlock}
                onCheckedChange={(c) => {
                  setShowSignatureBlock(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "numbering",
      label: "Numbering & Sequence",
      icon: Hash,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Quote Reference Numbering"
            description="Configure automated quote ID formats, prefixes, and sequence counters."
            icon={Hash}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SettingsField label="Prefix">
                <Input
                  value={quotePrefix}
                  onChange={(e) => {
                    setQuotePrefix(e.target.value);
                    setHasChanges(true);
                  }}
                  className="h-9 text-xs font-mono"
                  placeholder="QT-"
                />
              </SettingsField>

              <SettingsField label="Next Sequence Number">
                <Input
                  type="number"
                  value={nextSequenceNumber}
                  onChange={(e) => {
                    setNextSequenceNumber(e.target.value);
                    setHasChanges(true);
                  }}
                  className="h-9 text-xs font-mono"
                />
              </SettingsField>

              <SettingsField label="Digit Padding Length">
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
                  </SelectContent>
                </Select>
              </SettingsField>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">Generated Format Preview:</span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                {quotePrefix}{nextSequenceNumber.padStart(parseInt(digitPadding) || 5, "0")}
              </Badge>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "taxes",
      label: "Taxes & Calculations",
      icon: Percent,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Tax Rate & Line-Item Pricing"
            description="Set default GST/VAT rates and tax calculation rules for line items."
            icon={Percent}
          >
            <div className="space-y-4">
              <SettingsRow
                label="Default GST / Tax Rate"
                description="Standard tax percentage applied to newly added quotation items."
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={defaultTaxRate}
                    onChange={(e) => {
                      setDefaultTaxRate(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center font-semibold"
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                </div>
              </SettingsRow>

              <div className="divide-y divide-border/40">
                <SettingsToggleRow
                  label="Tax-Inclusive Pricing"
                  description="When enabled, entered unit prices are treated as including taxes."
                  checked={taxInclusivePricing}
                  onCheckedChange={(c) => {
                    setTaxInclusivePricing(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Require HSN / SAC Code"
                  description="Mandate product/service tax classification codes on quote lines."
                  checked={requireHSNSAC}
                  onCheckedChange={(c) => {
                    setRequireHSNSAC(c);
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "terms",
      label: "Terms & Conditions",
      icon: FileCheck2,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Standard Quotation Terms & Policies"
            description="Pre-populate default validity duration, payment schedules, and legal terms."
            icon={FileCheck2}
          >
            <div className="space-y-4">
              <SettingsRow
                label="Quotation Validity Duration"
                description="Number of days the quote pricing is guaranteed before expiring."
              >
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={defaultValidityDays}
                    onChange={(e) => {
                      setDefaultValidityDays(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-16 h-8 text-xs text-center"
                  />
                  <span className="text-muted-foreground text-xs">days</span>
                </div>
              </SettingsRow>

              <SettingsField label="Standard Payment Terms">
                <Textarea
                  value={standardPaymentTerms}
                  onChange={(e) => {
                    setStandardPaymentTerms(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={2}
                  className="text-xs resize-none"
                />
              </SettingsField>

              <SettingsField label="Legal Disclaimer & Notes">
                <Textarea
                  value={legalDisclaimer}
                  onChange={(e) => {
                    setLegalDisclaimer(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="text-xs resize-none"
                />
              </SettingsField>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "defaults",
      label: "Default Values & Approval",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Quotation Approval & Financial Limits"
            description="Control discount thresholds and mandatory manager authorizations."
            icon={SlidersHorizontal}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsField label="Default Currency">
                <Select
                  value={defaultCurrency}
                  onValueChange={(val) => {
                    setDefaultCurrency(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                    <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              <SettingsField label="Max Allowed Rep Discount Without Approval (%)">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultDiscountLimit}
                  onChange={(e) => {
                    setDefaultDiscountLimit(e.target.value);
                    setHasChanges(true);
                  }}
                  className="h-9 text-xs"
                />
              </SettingsField>
            </div>

            <div className="pt-2 divide-y divide-border/40">
              <SettingsToggleRow
                label="Enforce Strict Manager Approval"
                description="Require Sales Manager sign-off before dispatching PDF quotes exceeding discount ceiling."
                checked={requireManagerApproval}
                onCheckedChange={(c) => {
                  setRequireManagerApproval(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
  ];

  return (
    <ContextualSettingsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Quotation Settings"
      subtitle="Customize quotation PDF templates, automated numbering sequences, tax configurations, and terms."
      icon={FileText}
      badge="Quotations Module"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
