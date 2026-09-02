"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Building2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  DollarSign,
  Calendar,
  Layers,
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCRMStore } from "@/shared/store/useCRMStore";

export interface QuotationContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: "modern",
    name: "Modern Minimal",
    description: "Clean typography with emerald accents and structured summary blocks.",
    badge: "Recommended",
  },
  {
    id: "classic",
    name: "Classic Professional",
    description: "Traditional corporate layout with bordered tables and header crest.",
  },
  {
    id: "compact",
    name: "Enterprise Compact",
    description: "High data-density layout ideal for multi-line item quotations.",
  },
];

const CURRENCIES = [
  { code: "INR", label: "INR (₹) - Indian Rupee" },
  { code: "USD", label: "USD ($) - US Dollar" },
  { code: "EUR", label: "EUR (€) - Euro" },
  { code: "GBP", label: "GBP (£) - British Pound" },
  { code: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "CAD", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", label: "AUD ($) - Australian Dollar" },
  { code: "SGD", label: "SGD ($) - Singapore Dollar" },
];

const PAYMENT_PRESETS = [
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt" },
  { value: "NET15", label: "Net 15 Days" },
  { value: "NET30", label: "Net 30 Days" },
  { value: "NET60", label: "Net 60 Days" },
  { value: "ADVANCE_50_50", label: "50% Advance / 50% on Delivery" },
  { value: "ADVANCE_100", label: "100% Advance Payment" },
  { value: "CUSTOM", label: "Custom Stated Terms" },
];

export function QuotationContextualSettings({
  open,
  onOpenChange,
  defaultSection = "templates",
}: QuotationContextualSettingsProps) {
  const { user } = useAuth();
  const workspaceCurrency = useCRMStore((state) => state.currency);
  const tenantId =
    user?.tenantId ||
    (user as { activeTenantId?: string })?.activeTenantId ||
    "default";
  const storageKey = `clixprocrm_quotation_settings_${tenantId}`;

  // 1. Templates & Layout
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showCompanyLogo, setShowCompanyLogo] = useState(true);
  const [showCompanyAddress, setShowCompanyAddress] = useState(true);
  const [showGSTIN, setShowGSTIN] = useState(true);
  const [showAuthorizedSignatory, setShowAuthorizedSignatory] = useState(true);
  const [showPageNumber, setShowPageNumber] = useState(true);
  const [showGeneratedDate, setShowGeneratedDate] = useState(true);

  // 2. Numbering & Sequence
  const [quotePrefix, setQuotePrefix] = useState("QT-");
  const [nextSequenceNumber, setNextSequenceNumber] = useState("1001");
  const [digitPadding, setDigitPadding] = useState("5");
  const [includeYearInPrefix, setIncludeYearInPrefix] = useState(false);
  const [autoIncrementSequence, setAutoIncrementSequence] = useState(true);
  const [resetSequenceOnYearEnd, setResetSequenceOnYearEnd] = useState(false);

  // 3. Taxes & Calculations
  const [defaultTaxType, setDefaultTaxType] = useState<"GST" | "VAT" | "NO_TAX">("GST");
  const [taxCalculationMode, setTaxCalculationMode] = useState<"PER_ITEM" | "ON_SUBTOTAL">("PER_ITEM");
  const [defaultDiscountType, setDefaultDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [taxInclusivePricing, setTaxInclusivePricing] = useState(false);
  const [requireHSNSAC, setRequireHSNSAC] = useState(true);
  const [allowLineItemDiscounts, setAllowLineItemDiscounts] = useState(true);

  // 4. Terms & Conditions
  const [standardPaymentTerms, setStandardPaymentTerms] = useState(
    "50% advance upon quote confirmation, remaining 50% upon delivery and milestone sign-off."
  );
  const [defaultDeliveryTerms, setDefaultDeliveryTerms] = useState(
    "Standard delivery within 7-10 business days following confirmed purchase order and receipt of advance payment."
  );
  const [defaultWarrantyTerms, setDefaultWarrantyTerms] = useState(
    "12 months comprehensive warranty on supplied hardware; 90 days complimentary implementation support."
  );
  const [legalDisclaimer, setLegalDisclaimer] = useState(
    "This quotation is subject to standard terms of service. Prices quoted remain valid for the specified duration and are subject to statutory tax revisions if applicable."
  );

  // 5. Approval & Defaults
  const [defaultCurrency, setDefaultCurrency] = useState(workspaceCurrency || "INR");
  const [defaultTaxRate, setDefaultTaxRate] = useState("18");
  const [defaultPaymentTermsPreset, setDefaultPaymentTermsPreset] = useState("ADVANCE_50_50");
  const [defaultValidityDays, setDefaultValidityDays] = useState("30");

  const [enableApprovalWorkflow, setEnableApprovalWorkflow] = useState(true);
  const [requireApprovalForExcessiveDiscounts, setRequireApprovalForExcessiveDiscounts] = useState(true);
  const [maxDiscountWithoutApproval, setMaxDiscountWithoutApproval] = useState("15");
  const [requireHighValueApproval, setRequireHighValueApproval] = useState(false);
  const [highValueThreshold, setHighValueThreshold] = useState("500000");

  // State management
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const isLoadedRef = useRef(false);

  // Load persisted configuration from storage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.selectedTemplate !== undefined) setSelectedTemplate(parsed.selectedTemplate);
        if (parsed.showCompanyLogo !== undefined) setShowCompanyLogo(parsed.showCompanyLogo);
        if (parsed.showCompanyAddress !== undefined) setShowCompanyAddress(parsed.showCompanyAddress);
        if (parsed.showGSTIN !== undefined) setShowGSTIN(parsed.showGSTIN);
        if (parsed.showAuthorizedSignatory !== undefined) setShowAuthorizedSignatory(parsed.showAuthorizedSignatory);
        if (parsed.showPageNumber !== undefined) setShowPageNumber(parsed.showPageNumber);
        if (parsed.showGeneratedDate !== undefined) setShowGeneratedDate(parsed.showGeneratedDate);

        if (parsed.quotePrefix !== undefined) setQuotePrefix(parsed.quotePrefix);
        if (parsed.nextSequenceNumber !== undefined) setNextSequenceNumber(String(parsed.nextSequenceNumber));
        if (parsed.digitPadding !== undefined) setDigitPadding(String(parsed.digitPadding));
        if (parsed.includeYearInPrefix !== undefined) setIncludeYearInPrefix(parsed.includeYearInPrefix);
        if (parsed.autoIncrementSequence !== undefined) setAutoIncrementSequence(parsed.autoIncrementSequence);
        if (parsed.resetSequenceOnYearEnd !== undefined) setResetSequenceOnYearEnd(parsed.resetSequenceOnYearEnd);

        if (parsed.defaultTaxType !== undefined) setDefaultTaxType(parsed.defaultTaxType);
        if (parsed.taxCalculationMode !== undefined) setTaxCalculationMode(parsed.taxCalculationMode);
        if (parsed.defaultDiscountType !== undefined) setDefaultDiscountType(parsed.defaultDiscountType);
        if (parsed.taxInclusivePricing !== undefined) setTaxInclusivePricing(parsed.taxInclusivePricing);
        if (parsed.requireHSNSAC !== undefined) setRequireHSNSAC(parsed.requireHSNSAC);
        if (parsed.allowLineItemDiscounts !== undefined) setAllowLineItemDiscounts(parsed.allowLineItemDiscounts);

        if (parsed.standardPaymentTerms !== undefined) setStandardPaymentTerms(parsed.standardPaymentTerms);
        if (parsed.defaultDeliveryTerms !== undefined) setDefaultDeliveryTerms(parsed.defaultDeliveryTerms);
        if (parsed.defaultWarrantyTerms !== undefined) setDefaultWarrantyTerms(parsed.defaultWarrantyTerms);
        if (parsed.legalDisclaimer !== undefined) setLegalDisclaimer(parsed.legalDisclaimer);

        if (parsed.defaultCurrency !== undefined) setDefaultCurrency(parsed.defaultCurrency);
        if (parsed.defaultTaxRate !== undefined) setDefaultTaxRate(String(parsed.defaultTaxRate));
        if (parsed.defaultPaymentTermsPreset !== undefined) setDefaultPaymentTermsPreset(parsed.defaultPaymentTermsPreset);
        if (parsed.defaultValidityDays !== undefined) setDefaultValidityDays(String(parsed.defaultValidityDays));

        if (parsed.enableApprovalWorkflow !== undefined) setEnableApprovalWorkflow(parsed.enableApprovalWorkflow);
        if (parsed.requireApprovalForExcessiveDiscounts !== undefined) setRequireApprovalForExcessiveDiscounts(parsed.requireApprovalForExcessiveDiscounts);
        if (parsed.maxDiscountWithoutApproval !== undefined) setMaxDiscountWithoutApproval(String(parsed.maxDiscountWithoutApproval));
        if (parsed.requireHighValueApproval !== undefined) setRequireHighValueApproval(parsed.requireHighValueApproval);
        if (parsed.highValueThreshold !== undefined) setHighValueThreshold(String(parsed.highValueThreshold));
      }
    } catch {
      // Fallback to initial defaults
    } finally {
      isLoadedRef.current = true;
    }
  }, [storageKey]);

  // Validation checks
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    // Prefix validation
    if (!quotePrefix.trim()) {
      errs.prefix = "Quotation prefix is required.";
    }

    // Sequence validation
    const seq = parseInt(nextSequenceNumber, 10);
    if (isNaN(seq) || seq < 1) {
      errs.nextSequenceNumber = "Sequence number must be a positive integer.";
    }

    // Tax rate validation
    const tax = parseFloat(defaultTaxRate);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      errs.defaultTaxRate = "Tax rate must be between 0% and 100%.";
    }

    // Validity days validation
    const validity = parseInt(defaultValidityDays, 10);
    if (isNaN(validity) || validity < 1) {
      errs.defaultValidityDays = "Validity period must be at least 1 day.";
    }

    // Discount threshold validation
    if (enableApprovalWorkflow && requireApprovalForExcessiveDiscounts) {
      const discount = parseFloat(maxDiscountWithoutApproval);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        errs.maxDiscountWithoutApproval = "Discount ceiling must be between 0% and 100%.";
      }
    }

    // High value threshold validation
    if (enableApprovalWorkflow && requireHighValueApproval) {
      const threshold = parseFloat(highValueThreshold);
      if (isNaN(threshold) || threshold < 1) {
        errs.highValueThreshold = "Threshold amount must be greater than zero.";
      }
    }

    return errs;
  }, [
    quotePrefix,
    nextSequenceNumber,
    defaultTaxRate,
    defaultValidityDays,
    enableApprovalWorkflow,
    requireApprovalForExcessiveDiscounts,
    maxDiscountWithoutApproval,
    requireHighValueApproval,
    highValueThreshold,
  ]);

  const hasValidationErrors = Object.keys(errors).length > 0;

  // Format preview calculator
  const formatPreview = useMemo(() => {
    const padded = (nextSequenceNumber || "1").padStart(parseInt(digitPadding, 10) || 5, "0");
    const currentYear = new Date().getFullYear();
    const prefix = quotePrefix.trim() || "QT-";
    if (includeYearInPrefix) {
      return `${prefix}${currentYear}-${padded}`;
    }
    return `${prefix}${padded}`;
  }, [quotePrefix, nextSequenceNumber, digitPadding, includeYearInPrefix]);

  const handleSave = async () => {
    if (hasValidationErrors) {
      toast.error("Please resolve the validation errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const settingsPayload = {
        selectedTemplate,
        showCompanyLogo,
        showCompanyAddress,
        showGSTIN,
        showAuthorizedSignatory,
        showPageNumber,
        showGeneratedDate,

        quotePrefix: quotePrefix.trim(),
        nextSequenceNumber: parseInt(nextSequenceNumber, 10) || 1001,
        digitPadding: parseInt(digitPadding, 10) || 5,
        includeYearInPrefix,
        autoIncrementSequence,
        resetSequenceOnYearEnd,

        defaultTaxType,
        taxCalculationMode,
        defaultDiscountType,
        taxInclusivePricing,
        requireHSNSAC,
        allowLineItemDiscounts,

        standardPaymentTerms,
        defaultDeliveryTerms,
        defaultWarrantyTerms,
        legalDisclaimer,

        defaultCurrency,
        defaultTaxRate: parseFloat(defaultTaxRate) || 18,
        defaultPaymentTermsPreset,
        defaultValidityDays: parseInt(defaultValidityDays, 10) || 30,

        enableApprovalWorkflow,
        requireApprovalForExcessiveDiscounts,
        maxDiscountWithoutApproval: parseFloat(maxDiscountWithoutApproval) || 15,
        requireHighValueApproval,
        highValueThreshold: parseFloat(highValueThreshold) || 500000,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(storageKey, JSON.stringify(settingsPayload));
      // Artificial delay for UI feedback consistency
      await new Promise((resolve) => setTimeout(resolve, 400));

      setHasChanges(false);
      toast.success("Quotation settings saved successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save quotation settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSelectedTemplate("modern");
    setShowCompanyLogo(true);
    setShowCompanyAddress(true);
    setShowGSTIN(true);
    setShowAuthorizedSignatory(true);
    setShowPageNumber(true);
    setShowGeneratedDate(true);

    setQuotePrefix("QT-");
    setNextSequenceNumber("1001");
    setDigitPadding("5");
    setIncludeYearInPrefix(false);
    setAutoIncrementSequence(true);
    setResetSequenceOnYearEnd(false);

    setDefaultTaxType("GST");
    setTaxCalculationMode("PER_ITEM");
    setDefaultDiscountType("PERCENTAGE");
    setTaxInclusivePricing(false);
    setRequireHSNSAC(true);
    setAllowLineItemDiscounts(true);

    setStandardPaymentTerms("50% advance upon quote confirmation, remaining 50% upon delivery and milestone sign-off.");
    setDefaultDeliveryTerms("Standard delivery within 7-10 business days following confirmed purchase order and receipt of advance payment.");
    setDefaultWarrantyTerms("12 months comprehensive warranty on supplied hardware; 90 days complimentary implementation support.");
    setLegalDisclaimer("This quotation is subject to standard terms of service. Prices quoted remain valid for the specified duration and are subject to statutory tax revisions if applicable.");

    setDefaultCurrency("INR");
    setDefaultTaxRate("18");
    setDefaultPaymentTermsPreset("ADVANCE_50_50");
    setDefaultValidityDays("30");

    setEnableApprovalWorkflow(true);
    setRequireApprovalForExcessiveDiscounts(true);
    setMaxDiscountWithoutApproval("15");
    setRequireHighValueApproval(false);
    setHighValueThreshold("500000");

    setHasChanges(true);
    toast.info("Reset quotation configuration to system defaults");
  };

  const sections: ContextualSettingSection[] = [
    // 1. TEMPLATES & LAYOUT
    {
      id: "templates",
      label: "Templates & Layout",
      icon: LayoutTemplate,
      component: (
        <div className="space-y-4">
          <SettingsSection
            title="Quotation PDF & Layout Templates"
            description="Select visual styling, brand layout, and presentation theme for customer quotes."
            icon={LayoutTemplate}
          >
            {/* Visual Template Thumbnails */}
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
                    className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-500/[0.04] ring-1 ring-emerald-500/40 shadow-xs dark:bg-emerald-500/10 dark:border-emerald-500"
                        : "border-border/80 hover:border-border hover:bg-muted/30 bg-card"
                    }`}
                  >
                    {/* Visual Preview Miniature */}
                    <div className="w-full h-20 rounded-lg bg-muted/40 border border-border/50 p-2 mb-2.5 flex flex-col justify-between overflow-hidden pointer-events-none">
                      {tmpl.id === "modern" && (
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center justify-between">
                            <div className="h-2 w-10 rounded bg-emerald-600/70" />
                            <div className="h-1.5 w-6 rounded bg-muted-foreground/30" />
                          </div>
                          <div className="h-1 w-full bg-border/80 my-1" />
                          <div className="space-y-1">
                            <div className="h-1.5 w-full bg-muted-foreground/20 rounded-xs" />
                            <div className="h-1.5 w-4/5 bg-muted-foreground/15 rounded-xs" />
                            <div className="h-1.5 w-3/4 bg-muted-foreground/15 rounded-xs" />
                          </div>
                          <div className="flex justify-end pt-1">
                            <div className="h-2.5 w-12 rounded bg-emerald-500/20 border border-emerald-500/30" />
                          </div>
                        </div>
                      )}

                      {tmpl.id === "classic" && (
                        <div className="space-y-1 w-full border border-border/70 p-1 rounded-xs bg-background/50 h-full flex flex-col justify-between">
                          <div className="flex items-center justify-between border-b border-border/60 pb-1">
                            <div className="h-2 w-8 rounded-xs bg-foreground/60" />
                            <div className="h-1.5 w-8 rounded-xs bg-foreground/40" />
                          </div>
                          <div className="grid grid-cols-3 gap-0.5 py-0.5">
                            <div className="h-1.5 bg-muted-foreground/20" />
                            <div className="h-1.5 bg-muted-foreground/20" />
                            <div className="h-1.5 bg-muted-foreground/20" />
                            <div className="h-1.5 bg-muted-foreground/10" />
                            <div className="h-1.5 bg-muted-foreground/10" />
                            <div className="h-1.5 bg-muted-foreground/10" />
                          </div>
                          <div className="border-t border-border/60 pt-0.5 flex justify-between">
                            <div className="h-1.5 w-6 bg-muted-foreground/30" />
                            <div className="h-1.5 w-8 bg-foreground/70" />
                          </div>
                        </div>
                      )}

                      {tmpl.id === "compact" && (
                        <div className="space-y-1 w-full h-full flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div className="h-1.5 w-12 rounded-xs bg-foreground/60" />
                            <div className="h-1.5 w-10 rounded-xs bg-muted-foreground/40" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="h-1 w-full bg-muted-foreground/25" />
                            <div className="h-1 w-full bg-muted-foreground/15" />
                            <div className="h-1 w-full bg-muted-foreground/25" />
                            <div className="h-1 w-full bg-muted-foreground/15" />
                            <div className="h-1 w-full bg-muted-foreground/25" />
                          </div>
                          <div className="flex justify-end gap-1">
                            <div className="h-1.5 w-6 bg-muted-foreground/30" />
                            <div className="h-1.5 w-6 bg-foreground/70" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Template Details */}
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold text-xs text-foreground tracking-tight">
                          {tmpl.name}
                        </p>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {tmpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Branding & Header Elements */}
            <div className="pt-2">
              <h5 className="text-xs font-semibold text-foreground mb-2 px-1">
                Branding & Header Elements
              </h5>
              <div className="divide-y divide-border/40 border border-border/60 rounded-lg px-3 bg-muted/10">
                <SettingsToggleRow
                  label="Show Company Logo"
                  description="Display your primary organization logo on the top header of quotation documents."
                  checked={showCompanyLogo}
                  onCheckedChange={(c) => {
                    setShowCompanyLogo(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Show Company Address & Contact"
                  description="Include registered office location, contact phone, and official email on the quote header."
                  checked={showCompanyAddress}
                  onCheckedChange={(c) => {
                    setShowCompanyAddress(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Show GSTIN / Tax Registration Number"
                  description="Display company GSTIN / corporate tax identification on the quotation document."
                  checked={showGSTIN}
                  onCheckedChange={(c) => {
                    setShowGSTIN(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Show Authorized Signatory Block"
                  description="Display signature line, signee name, and acceptance confirmation block."
                  checked={showAuthorizedSignatory}
                  onCheckedChange={(c) => {
                    setShowAuthorizedSignatory(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Show Page Numbers"
                  description="Include document pagination indicators (e.g., Page 1 of 2) in footer."
                  checked={showPageNumber}
                  onCheckedChange={(c) => {
                    setShowPageNumber(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Show Generated Date & Timestamp"
                  description="Print quote creation timestamp and system reference metadata."
                  checked={showGeneratedDate}
                  onCheckedChange={(c) => {
                    setShowGeneratedDate(c);
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 2. NUMBERING & SEQUENCE
    {
      id: "numbering",
      label: "Numbering & Sequence",
      icon: Hash,
      component: (
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
      ),
    },

    // 3. TAXES & CALCULATIONS
    {
      id: "taxes",
      label: "Taxes & Calculations",
      icon: Percent,
      component: (
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
      ),
    },

    // 4. TERMS & CONDITIONS
    {
      id: "terms",
      label: "Terms & Conditions",
      icon: FileCheck2,
      component: (
        <div className="space-y-4">
          <SettingsSection
            title="Standard Quotation Terms & Policies"
            description="Pre-populate default delivery terms, warranty conditions, payment schedules, and legal notes."
            icon={FileCheck2}
          >
            <div className="p-3 rounded-lg bg-muted/20 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                These values are automatically pre-filled when creating a new quotation draft and can be modified per proposal.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <SettingsField
                label="Standard Payment Terms"
                description="Default milestone schedule and payment distribution text."
              >
                <Textarea
                  value={standardPaymentTerms}
                  onChange={(e) => {
                    setStandardPaymentTerms(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="e.g., 50% advance upon quote approval, balance upon project delivery..."
                />
              </SettingsField>

              <SettingsField
                label="Default Delivery Terms"
                description="Standard dispatch, fulfillment, or milestone handover timeline."
              >
                <Textarea
                  value={defaultDeliveryTerms}
                  onChange={(e) => {
                    setDefaultDeliveryTerms(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="e.g., Delivery within 7-10 business days following confirmed PO..."
                />
              </SettingsField>

              <SettingsField
                label="Default Warranty & Service Terms"
                description="Standard warranty coverage period and maintenance SLA conditions."
              >
                <Textarea
                  value={defaultWarrantyTerms}
                  onChange={(e) => {
                    setDefaultWarrantyTerms(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="e.g., 12 months standard warranty; 90 days complimentary support..."
                />
              </SettingsField>

              <SettingsField
                label="Legal Disclaimer & Notes"
                description="Governing compliance disclaimer and contract reference clauses."
              >
                <Textarea
                  value={legalDisclaimer}
                  onChange={(e) => {
                    setLegalDisclaimer(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="e.g., This quotation is subject to our master service agreement..."
                />
              </SettingsField>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 5. APPROVAL & DEFAULTS
    {
      id: "defaults",
      label: "Approval & Defaults",
      icon: SlidersHorizontal,
      component: (
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
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isSaving}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
      onReset={handleResetDefaults}
    />
  );
}
