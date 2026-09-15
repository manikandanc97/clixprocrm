"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import { toast } from "sonner";
import {
  FileText,
  LayoutTemplate,
  Hash,
  Percent,
  FileCheck2,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { useCRMStore } from "@/shared/store/useCRMStore";

import {
  TemplateOption,
  TEMPLATES,
  CURRENCIES,
  PAYMENT_PRESETS,
} from "../constants/quotation-settings.constants";

import { QuotationTemplatesSection } from "./quotation-sections/QuotationTemplatesSection";
import { QuotationNumberingSection } from "./quotation-sections/QuotationNumberingSection";
import { QuotationTaxesSection } from "./quotation-sections/QuotationTaxesSection";
import { QuotationTermsSection } from "./quotation-sections/QuotationTermsSection";
import { QuotationApprovalSection } from "./quotation-sections/QuotationApprovalSection";

export interface QuotationContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

export type { TemplateOption };
export { TEMPLATES, CURRENCIES, PAYMENT_PRESETS };

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

  // Load persisted configuration from storage on open / mount
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);

  if (typeof window !== "undefined" && open && (!prevOpen || storageKey !== prevStorageKey)) {
    setPrevOpen(open);
    setPrevStorageKey(storageKey);
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
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

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
        <QuotationTemplatesSection
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          showCompanyLogo={showCompanyLogo}
          setShowCompanyLogo={setShowCompanyLogo}
          showCompanyAddress={showCompanyAddress}
          setShowCompanyAddress={setShowCompanyAddress}
          showGSTIN={showGSTIN}
          setShowGSTIN={setShowGSTIN}
          showAuthorizedSignatory={showAuthorizedSignatory}
          setShowAuthorizedSignatory={setShowAuthorizedSignatory}
          showPageNumber={showPageNumber}
          setShowPageNumber={setShowPageNumber}
          showGeneratedDate={showGeneratedDate}
          setShowGeneratedDate={setShowGeneratedDate}
          setHasChanges={setHasChanges}
        />
      ),
    },

    // 2. NUMBERING & SEQUENCE
    {
      id: "numbering",
      label: "Numbering & Sequence",
      icon: Hash,
      component: (
        <QuotationNumberingSection
          quotePrefix={quotePrefix}
          setQuotePrefix={setQuotePrefix}
          nextSequenceNumber={nextSequenceNumber}
          setNextSequenceNumber={setNextSequenceNumber}
          digitPadding={digitPadding}
          setDigitPadding={setDigitPadding}
          includeYearInPrefix={includeYearInPrefix}
          setIncludeYearInPrefix={setIncludeYearInPrefix}
          autoIncrementSequence={autoIncrementSequence}
          setAutoIncrementSequence={setAutoIncrementSequence}
          resetSequenceOnYearEnd={resetSequenceOnYearEnd}
          setResetSequenceOnYearEnd={setResetSequenceOnYearEnd}
          errors={errors}
          formatPreview={formatPreview}
          setHasChanges={setHasChanges}
        />
      ),
    },

    // 3. TAXES & CALCULATIONS
    {
      id: "taxes",
      label: "Taxes & Calculations",
      icon: Percent,
      component: (
        <QuotationTaxesSection
          defaultTaxType={defaultTaxType}
          setDefaultTaxType={setDefaultTaxType}
          taxCalculationMode={taxCalculationMode}
          setTaxCalculationMode={setTaxCalculationMode}
          defaultDiscountType={defaultDiscountType}
          setDefaultDiscountType={setDefaultDiscountType}
          taxInclusivePricing={taxInclusivePricing}
          setTaxInclusivePricing={setTaxInclusivePricing}
          requireHSNSAC={requireHSNSAC}
          setRequireHSNSAC={setRequireHSNSAC}
          allowLineItemDiscounts={allowLineItemDiscounts}
          setAllowLineItemDiscounts={setAllowLineItemDiscounts}
          setHasChanges={setHasChanges}
        />
      ),
    },

    // 4. TERMS & CONDITIONS
    {
      id: "terms",
      label: "Terms & Conditions",
      icon: FileCheck2,
      component: (
        <QuotationTermsSection
          standardPaymentTerms={standardPaymentTerms}
          setStandardPaymentTerms={setStandardPaymentTerms}
          defaultDeliveryTerms={defaultDeliveryTerms}
          setDefaultDeliveryTerms={setDefaultDeliveryTerms}
          defaultWarrantyTerms={defaultWarrantyTerms}
          setDefaultWarrantyTerms={setDefaultWarrantyTerms}
          legalDisclaimer={legalDisclaimer}
          setLegalDisclaimer={setLegalDisclaimer}
          setHasChanges={setHasChanges}
        />
      ),
    },

    // 5. APPROVAL & DEFAULTS
    {
      id: "defaults",
      label: "Approval & Defaults",
      icon: SlidersHorizontal,
      component: (
        <QuotationApprovalSection
          defaultCurrency={defaultCurrency}
          setDefaultCurrency={setDefaultCurrency}
          defaultTaxRate={defaultTaxRate}
          setDefaultTaxRate={setDefaultTaxRate}
          defaultPaymentTermsPreset={defaultPaymentTermsPreset}
          setDefaultPaymentTermsPreset={setDefaultPaymentTermsPreset}
          defaultValidityDays={defaultValidityDays}
          setDefaultValidityDays={setDefaultValidityDays}
          enableApprovalWorkflow={enableApprovalWorkflow}
          setEnableApprovalWorkflow={setEnableApprovalWorkflow}
          requireApprovalForExcessiveDiscounts={requireApprovalForExcessiveDiscounts}
          setRequireApprovalForExcessiveDiscounts={setRequireApprovalForExcessiveDiscounts}
          maxDiscountWithoutApproval={maxDiscountWithoutApproval}
          setMaxDiscountWithoutApproval={setMaxDiscountWithoutApproval}
          requireHighValueApproval={requireHighValueApproval}
          setRequireHighValueApproval={setRequireHighValueApproval}
          highValueThreshold={highValueThreshold}
          setHighValueThreshold={setHighValueThreshold}
          errors={errors}
          setHasChanges={setHasChanges}
        />
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
