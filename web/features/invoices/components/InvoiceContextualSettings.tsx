"use client";

import React, { useState } from "react";
import {
  ContextualSettingsDrawer,
  ContextualSettingSection,
} from "@/shared/components/crm/ContextualSettingsDrawer";
import {
  Receipt,
  Hash,
  Percent,
  CreditCard,
  LayoutTemplate,
  FileText,
  Building2,
  Landmark,
} from "lucide-react";
import {
  useInvoiceSettings,
  useUpdateInvoiceSettings,
} from "@/shared/hooks/use-invoices";
import { useWorkspace } from "@/shared/hooks/use-settings";

import {
  INDIAN_STATES,
  INVOICE_TEMPLATES,
  BankAccountItem,
  AdditionalClauseItem,
} from "../constants/invoice-settings.constants";
import { InvoicePreviewModal } from "./contextual-settings/InvoicePreviewModal";
import { InvoiceIdentitySection } from "./contextual-settings/InvoiceIdentitySection";
import { InvoiceBankSection } from "./contextual-settings/InvoiceBankSection";
import { InvoiceNumberingSection } from "./contextual-settings/InvoiceNumberingSection";
import { InvoiceTaxSection } from "./contextual-settings/InvoiceTaxSection";
import { InvoicePaymentSection } from "./contextual-settings/InvoicePaymentSection";
import { InvoiceTemplateSection } from "./contextual-settings/InvoiceTemplateSection";
import { InvoiceNotesSection } from "./contextual-settings/InvoiceNotesSection";

export interface InvoiceContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

export type { BankAccountItem, AdditionalClauseItem };
export { INDIAN_STATES, INVOICE_TEMPLATES };

export function InvoiceContextualSettings({
  open,
  onOpenChange,
  defaultSection = "identity",
}: InvoiceContextualSettingsProps) {
  const { data: settingsData } = useInvoiceSettings();
  const settings = settingsData?.data;
  const { data: workspaceData } = useWorkspace();
  const workspace = workspaceData;
  const { mutateAsync: updateSettingsMutate, isPending } = useUpdateInvoiceSettings();

  // Section 1: Business & Tax Identity
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [gstType, setGstType] = useState("REGULAR");
  const [billingAddress, setBillingAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Karnataka");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  // Section 2: Bank & UPI
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([
    {
      id: "primary-bank",
      bankName: "HDFC Bank",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      swiftCode: "",
      upiId: "",
      isPrimary: true,
    },
  ]);
  const [showAccountMask, setShowAccountMask] = useState(true);
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [newBank, setNewBank] = useState<Omit<BankAccountItem, "id" | "isPrimary">>({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    swiftCode: "",
    upiId: "",
  });
  const [showUpiQrOnInvoice, setShowUpiQrOnInvoice] = useState(true);

  // Section 3: Numbering & Documents
  const [activeDocType, setActiveDocType] = useState<"INV" | "CN" | "DN">("INV");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [creditNotePrefix, setCreditNotePrefix] = useState("CN-");
  const [debitNotePrefix, setDebitNotePrefix] = useState("DN-");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("1001");
  const [financialYear, setFinancialYear] = useState("2026-2027");
  const [digitPadding, setDigitPadding] = useState("5");
  const [includeYearInPrefix, setIncludeYearInPrefix] = useState(true);

  // Section 4: Tax & GST Rules
  const [defaultTaxRate, setDefaultTaxRate] = useState("18");
  const [requireHsnSac, setRequireHsnSac] = useState(true);
  const [applyTaxPerLineItem, setApplyTaxPerLineItem] = useState(true);
  const [showTaxBreakdownTable, setShowTaxBreakdownTable] = useState(true);
  const [enableRoundOff, setEnableRoundOff] = useState(true);

  // Section 5: Payment Terms
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("NET30");
  const [allowPartialPayments, setAllowPartialPayments] = useState(true);
  const [autoMarkOverdue, setAutoMarkOverdue] = useState(true);
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState("3");
  const [reminderDaysAfter, setReminderDaysAfter] = useState("7");
  const [showAdvancedSettlement, setShowAdvancedSettlement] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState("3");

  // Section 6: Invoice Template & PDF
  const [selectedTemplate, setSelectedTemplate] = useState("corporate");
  const [paperFormat, setPaperFormat] = useState("A4");
  const [showLogoOnPDF, setShowLogoOnPDF] = useState(true);
  const [showCustomerGstin, setShowCustomerGstin] = useState(true);
  const [showBankDetailsOnPDF, setShowBankDetailsOnPDF] = useState(true);
  const [showSignatureBlock, setShowSignatureBlock] = useState(true);
  const [showCompanyStamp, setShowCompanyStamp] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Section 7: Notes & Legal
  const [defaultNotes, setDefaultNotes] = useState(
    "Thank you for your business. Please remit payment by the due date."
  );
  const [defaultTerms, setDefaultTerms] = useState(
    "1. Payment is due within standard settlement terms.\n2. Invoices unpaid after due date may attract statutory interest @ 18% p.a.\n3. Subject to local state jurisdiction."
  );
  const [additionalClauses, setAdditionalClauses] = useState<AdditionalClauseItem[]>([]);

  const [hasChanges, setHasChanges] = useState(false);
  const notifyChange = () => setHasChanges(true);

  // Initialize from backend settings once upon arrival
  const [syncedSettingsKey, setSyncedSettingsKey] = useState<string | null>(null);
  const currentSettingsKey =
    settings && Object.keys(settings).length > 0
      ? settings.id || settings.invoicePrefix || JSON.stringify(settings)
      : null;

  if (currentSettingsKey && syncedSettingsKey !== currentSettingsKey) {
    setSyncedSettingsKey(currentSettingsKey);
    setLegalName(settings.legalName || workspace?.name || "");
    setGstin(settings.gstin || workspace?.taxId || "");
    setPan(settings.pan || "");
    setBillingAddress(settings.billingAddress || workspace?.address || "");
    setCity(settings.city || "");
    setState(settings.state || "Karnataka");
    setPostalCode(settings.postalCode || "");
    setCountry(settings.country || "India");

    if (settings.invoicePrefix) setInvoicePrefix(settings.invoicePrefix);
    if (settings.financialYear) setFinancialYear(settings.financialYear);
    if (settings.nextInvoiceNumber) setNextInvoiceNumber(String(settings.nextInvoiceNumber));
    if (settings.defaultTaxRate !== undefined) setDefaultTaxRate(String(settings.defaultTaxRate));
    if (settings.defaultNotes) setDefaultNotes(settings.defaultNotes);
    if (settings.defaultTerms) setDefaultTerms(settings.defaultTerms);

    if (settings.bankName || settings.accountNumber) {
      setBankAccounts([
        {
          id: "primary-bank",
          bankName: settings.bankName || "HDFC Bank",
          accountHolderName: settings.accountHolderName || settings.legalName || workspace?.name || "",
          accountNumber: settings.accountNumber || "",
          ifscCode: settings.ifscCode || "",
          upiId: settings.upiId || "",
          isPrimary: true,
        },
      ]);
    }
  }

  const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];

  const maskAccountNumber = (acc: string) => {
    if (!acc) return "•••• •••• ••••";
    if (acc.length <= 4) return acc;
    return `•••• •••• ${acc.slice(-4)}`;
  };

  const getIdentifierPreview = (type: "INV" | "CN" | "DN") => {
    const prefix =
      type === "INV" ? invoicePrefix : type === "CN" ? creditNotePrefix : debitNotePrefix;
    const pad = parseInt(digitPadding) || 5;
    const num = nextInvoiceNumber.padStart(pad, "0");
    const fy = includeYearInPrefix ? `${new Date().getFullYear()}/` : "";
    return `${prefix}${fy}${num}`;
  };

  const handleSave = async () => {
    try {
      const primary = primaryBank;
      await updateSettingsMutate({
        legalName,
        gstin: gstin.toUpperCase().trim(),
        pan: pan.toUpperCase().trim(),
        billingAddress,
        city,
        state,
        postalCode,
        country,
        taxType: "GST",
        bankName: primary?.bankName || "",
        accountNumber: primary?.accountNumber || "",
        ifscCode: primary?.ifscCode?.toUpperCase() || "",
        accountHolderName: primary?.accountHolderName || legalName,
        upiId: primary?.upiId || "",
        invoicePrefix: invoicePrefix.toUpperCase().trim(),
        financialYear,
        nextInvoiceNumber: parseInt(nextInvoiceNumber) || 1,
        defaultTaxRate: parseFloat(defaultTaxRate) || 18,
        defaultNotes,
        defaultTerms,
      });
      setHasChanges(false);
      onOpenChange(false);
    } catch {
      // Error handled by mutation hook
    }
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "identity",
      label: "Business & Tax Identity",
      icon: Building2,
      component: (
        <InvoiceIdentitySection
          legalName={legalName}
          setLegalName={setLegalName}
          tradeName={tradeName}
          setTradeName={setTradeName}
          gstin={gstin}
          setGstin={setGstin}
          pan={pan}
          setPan={setPan}
          gstType={gstType}
          setGstType={setGstType}
          billingAddress={billingAddress}
          setBillingAddress={setBillingAddress}
          city={city}
          setCity={setCity}
          state={state}
          setState={setState}
          postalCode={postalCode}
          setPostalCode={setPostalCode}
          country={country}
          setCountry={setCountry}
          workspaceLogo={workspace?.logo ?? undefined}
          onChangeNotify={notifyChange}
        />
      ),
    },
    {
      id: "bank",
      label: "Bank & UPI",
      icon: Landmark,
      component: (
        <InvoiceBankSection
          bankAccounts={bankAccounts}
          setBankAccounts={setBankAccounts}
          showAccountMask={showAccountMask}
          setShowAccountMask={setShowAccountMask}
          showAddBankForm={showAddBankForm}
          setShowAddBankForm={setShowAddBankForm}
          newBank={newBank}
          setNewBank={setNewBank}
          showUpiQrOnInvoice={showUpiQrOnInvoice}
          setShowUpiQrOnInvoice={setShowUpiQrOnInvoice}
          legalName={legalName}
          onChangeNotify={notifyChange}
        />
      ),
    },
    {
      id: "numbering",
      label: "Numbering & Documents",
      icon: Hash,
      component: (
        <InvoiceNumberingSection
          activeDocType={activeDocType}
          setActiveDocType={setActiveDocType}
          invoicePrefix={invoicePrefix}
          setInvoicePrefix={setInvoicePrefix}
          creditNotePrefix={creditNotePrefix}
          setCreditNotePrefix={setCreditNotePrefix}
          debitNotePrefix={debitNotePrefix}
          setDebitNotePrefix={setDebitNotePrefix}
          nextInvoiceNumber={nextInvoiceNumber}
          setNextInvoiceNumber={setNextInvoiceNumber}
          financialYear={financialYear}
          setFinancialYear={setFinancialYear}
          digitPadding={digitPadding}
          setDigitPadding={setDigitPadding}
          includeYearInPrefix={includeYearInPrefix}
          setIncludeYearInPrefix={setIncludeYearInPrefix}
          onChangeNotify={notifyChange}
        />
      ),
    },
    {
      id: "tax",
      label: "Tax & GST Rules",
      icon: Percent,
      component: (
        <InvoiceTaxSection
          defaultTaxRate={defaultTaxRate}
          setDefaultTaxRate={setDefaultTaxRate}
          requireHsnSac={requireHsnSac}
          setRequireHsnSac={setRequireHsnSac}
          applyTaxPerLineItem={applyTaxPerLineItem}
          setApplyTaxPerLineItem={setApplyTaxPerLineItem}
          showTaxBreakdownTable={showTaxBreakdownTable}
          setShowTaxBreakdownTable={setShowTaxBreakdownTable}
          enableRoundOff={enableRoundOff}
          setEnableRoundOff={setEnableRoundOff}
          companyState={state}
          onChangeNotify={notifyChange}
        />
      ),
    },
    {
      id: "payment",
      label: "Payment Terms",
      icon: CreditCard,
      component: (
        <InvoicePaymentSection
          defaultPaymentTerms={defaultPaymentTerms}
          setDefaultPaymentTerms={setDefaultPaymentTerms}
          allowPartialPayments={allowPartialPayments}
          setAllowPartialPayments={setAllowPartialPayments}
          autoMarkOverdue={autoMarkOverdue}
          setAutoMarkOverdue={setAutoMarkOverdue}
          enableReminders={enableReminders}
          setEnableReminders={setEnableReminders}
          reminderDaysBefore={reminderDaysBefore}
          setReminderDaysBefore={setReminderDaysBefore}
          reminderDaysAfter={reminderDaysAfter}
          setReminderDaysAfter={setReminderDaysAfter}
          showAdvancedSettlement={showAdvancedSettlement}
          setShowAdvancedSettlement={setShowAdvancedSettlement}
          gracePeriodDays={gracePeriodDays}
          setGracePeriodDays={setGracePeriodDays}
          onChangeNotify={notifyChange}
        />
      ),
    },
    {
      id: "template",
      label: "Invoice Template",
      icon: LayoutTemplate,
      component: (
        <InvoiceTemplateSection
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          paperFormat={paperFormat}
          setPaperFormat={setPaperFormat}
          showLogoOnPDF={showLogoOnPDF}
          setShowLogoOnPDF={setShowLogoOnPDF}
          showCustomerGstin={showCustomerGstin}
          setShowCustomerGstin={setShowCustomerGstin}
          showBankDetailsOnPDF={showBankDetailsOnPDF}
          setShowBankDetailsOnPDF={setShowBankDetailsOnPDF}
          showSignatureBlock={showSignatureBlock}
          setShowSignatureBlock={setShowSignatureBlock}
          showCompanyStamp={showCompanyStamp}
          setShowCompanyStamp={setShowCompanyStamp}
          onPreviewOpen={() => setIsPreviewOpen(true)}
          onChangeNotify={notifyChange}
        />
      ),
    },
    {
      id: "legal",
      label: "Notes & Legal",
      icon: FileText,
      component: (
        <InvoiceNotesSection
          defaultNotes={defaultNotes}
          setDefaultNotes={setDefaultNotes}
          defaultTerms={defaultTerms}
          setDefaultTerms={setDefaultTerms}
          additionalClauses={additionalClauses}
          setAdditionalClauses={setAdditionalClauses}
          onChangeNotify={notifyChange}
        />
      ),
    },
  ];

  return (
    <>
      <ContextualSettingsDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Invoice & GST Settings"
        subtitle="Configure legal tax details, bank accounts, numbering format, payment terms, and PDF templates."
        icon={Receipt}
        sections={sections}
        defaultSection={defaultSection}
        isSaving={isPending}
        hasUnsavedChanges={hasChanges}
        onSave={handleSave}
      />

      <InvoicePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        selectedTemplate={selectedTemplate}
        paperFormat={paperFormat}
        invoiceIdentifier={getIdentifierPreview("INV")}
        workspace={workspace}
        legalName={legalName}
        billingAddress={billingAddress}
        city={city}
        state={state}
        postalCode={postalCode}
        gstin={gstin}
        pan={pan}
        defaultPaymentTerms={defaultPaymentTerms}
        showLogoOnPDF={showLogoOnPDF}
        showCustomerGstin={showCustomerGstin}
        requireHsnSac={requireHsnSac}
        defaultTaxRate={defaultTaxRate}
        showBankDetailsOnPDF={showBankDetailsOnPDF}
        primaryBank={primaryBank}
        maskAccountNumber={maskAccountNumber}
        showUpiQrOnInvoice={showUpiQrOnInvoice}
        showTaxBreakdownTable={showTaxBreakdownTable}
        enableRoundOff={enableRoundOff}
        defaultNotes={defaultNotes}
        defaultTerms={defaultTerms}
        showSignatureBlock={showSignatureBlock}
      />
    </>
  );
}
