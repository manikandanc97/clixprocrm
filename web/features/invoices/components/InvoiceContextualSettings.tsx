"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/shared/ui/badge";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Receipt,
  Hash,
  Percent,
  CreditCard,
  LayoutTemplate,
  SlidersHorizontal,
  Check,
  Building2,
  Landmark,
} from "lucide-react";
import {
  useInvoiceSettings,
  useUpdateInvoiceSettings,
} from "@/shared/hooks/use-invoices";

export interface InvoiceContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

const INVOICE_TEMPLATES = [
  { id: "corporate", name: "Corporate Clean", description: "Standard enterprise invoice layout with detailed itemization." },
  { id: "modern", name: "Modern Minimalist", description: "Sleek contemporary invoice design with bold total badges." },
  { id: "compact", name: "Compact Thermal", description: "Condensed layout optimized for services and fast rendering." },
];

export function InvoiceContextualSettings({
  open,
  onOpenChange,
  defaultSection = "legal-tax",
}: InvoiceContextualSettingsProps) {
  const { data: settingsData } = useInvoiceSettings();
  const settings = settingsData?.data || {};
  const { mutateAsync: updateSettingsMutate, isPending } = useUpdateInvoiceSettings();

  // Legal & Tax
  const [legalName, setLegalName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  // Bank & UPI
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [upiId, setUpiId] = useState("");

  // Numbering
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [financialYear, setFinancialYear] = useState("2026-2027");
  const [includeYearInPrefix, setIncludeYearInPrefix] = useState(true);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("1001");
  const [digitPadding, setDigitPadding] = useState("5");

  // Taxes
  const [defaultTaxRate, setDefaultTaxRate] = useState("18");
  const [applyTaxPerLineItem, setApplyTaxPerLineItem] = useState(true);
  const [showTaxBreakdownTable, setShowTaxBreakdownTable] = useState(true);

  // Payment Terms
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("NET30");
  const [allowPartialPayments, setAllowPartialPayments] = useState(true);
  const [autoReminderDaysBeforeDue, setAutoReminderDaysBeforeDue] = useState("3");

  // Templates
  const [selectedTemplate, setSelectedTemplate] = useState("corporate");
  const [showBankDetailsOnPDF, setShowBankDetailsOnPDF] = useState(true);
  const [showQRCodeForUPI, setShowQRCodeForUPI] = useState(true);

  // Default Values
  const [defaultNotes, setDefaultNotes] = useState("Thank you for your business. Please remit payment by the due date.");
  const [defaultTerms, setDefaultTerms] = useState("Payment is due within 15 days of invoice date.");
  const [autoMarkOverdue, setAutoMarkOverdue] = useState(true);

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setLegalName(settings.legalName || "");
      setGstin(settings.gstin || "");
      setPan(settings.pan || "");
      setBillingAddress(settings.billingAddress || "");
      setCity(settings.city || "");
      setState(settings.state || "");
      setPostalCode(settings.postalCode || "");
      setCountry(settings.country || "India");

      setBankName(settings.bankName || "");
      setAccountNumber(settings.accountNumber || "");
      setIfscCode(settings.ifscCode || "");
      setAccountHolderName(settings.accountHolderName || "");
      setUpiId(settings.upiId || "");

      setInvoicePrefix(settings.invoicePrefix || "INV-");
      setFinancialYear(settings.financialYear || "2026-2027");
      if (settings.nextInvoiceNumber) setNextInvoiceNumber(String(settings.nextInvoiceNumber));
      if (settings.defaultTaxRate !== undefined) setDefaultTaxRate(String(settings.defaultTaxRate));
      if (settings.defaultNotes) setDefaultNotes(settings.defaultNotes);
      if (settings.defaultTerms) setDefaultTerms(settings.defaultTerms);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettingsMutate({
        legalName,
        gstin,
        pan,
        billingAddress,
        city,
        state,
        postalCode,
        country,
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        upiId,
        invoicePrefix,
        financialYear,
        nextInvoiceNumber: parseInt(nextInvoiceNumber) || 1,
        defaultTaxRate: parseFloat(defaultTaxRate) || 18,
        defaultNotes,
        defaultTerms,
      });
      setHasChanges(false);
      onOpenChange(false);
    } catch {
      // Handled by mutation toast
    }
  };

  const sections: ContextualSettingSection[] = [
    {
      id: "legal-tax",
      label: "Organization & GST Profile",
      icon: Building2,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Legal Entity & Tax Registration"
            description="Configure official company details, GSTIN, and PAN printed on customer tax invoices."
            icon={Building2}
          >
            <div className="space-y-4">
              <SettingsField label="Legal Entity / Company Name">
                <Input
                  value={legalName}
                  onChange={(e) => {
                    setLegalName(e.target.value);
                    setHasChanges(true);
                  }}
                  className="h-9 text-xs font-semibold"
                  placeholder="e.g. Acme Technologies Pvt Ltd"
                />
              </SettingsField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField label="GSTIN (Goods & Services Tax ID)">
                  <Input
                    value={gstin}
                    onChange={(e) => {
                      setGstin(e.target.value.toUpperCase());
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs font-mono font-bold"
                    placeholder="29AAAAA0000A1Z5"
                  />
                </SettingsField>

                <SettingsField label="PAN (Permanent Account Number)">
                  <Input
                    value={pan}
                    onChange={(e) => {
                      setPan(e.target.value.toUpperCase());
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs font-mono font-bold"
                    placeholder="AAAAA0000A"
                  />
                </SettingsField>
              </div>

              <SettingsField label="Billing Street Address">
                <Input
                  value={billingAddress}
                  onChange={(e) => {
                    setBillingAddress(e.target.value);
                    setHasChanges(true);
                  }}
                  className="h-9 text-xs"
                  placeholder="123 Corporate Tower, Phase 2"
                />
              </SettingsField>

              <div className="grid grid-cols-3 gap-3">
                <SettingsField label="City">
                  <Input
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                    placeholder="Bengaluru"
                  />
                </SettingsField>
                <SettingsField label="State">
                  <Input
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                    placeholder="Karnataka"
                  />
                </SettingsField>
                <SettingsField label="PIN / Postal Code">
                  <Input
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs font-mono"
                    placeholder="560100"
                  />
                </SettingsField>
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "bank-payout",
      label: "Bank & UPI Payout",
      icon: Landmark,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Beneficiary Bank & UPI Remittance Details"
            description="Bank accounts and UPI VPA displayed on customer PDF invoices for electronic wire settlement."
            icon={Landmark}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField label="Bank Name">
                  <Input
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                    placeholder="HDFC Bank"
                  />
                </SettingsField>

                <SettingsField label="Account Holder Name">
                  <Input
                    value={accountHolderName}
                    onChange={(e) => {
                      setAccountHolderName(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                    placeholder="Acme Technologies Pvt Ltd"
                  />
                </SettingsField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField label="Account Number">
                  <Input
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs font-mono font-bold"
                    placeholder="50200012345678"
                  />
                </SettingsField>

                <SettingsField label="IFSC / SWIFT Code">
                  <Input
                    value={ifscCode}
                    onChange={(e) => {
                      setIfscCode(e.target.value.toUpperCase());
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs font-mono font-bold"
                    placeholder="HDFC0001234"
                  />
                </SettingsField>
              </div>

              <SettingsField label="UPI ID (VPA for QR Generation)">
                <Input
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    setHasChanges(true);
                  }}
                  className="h-9 text-xs font-mono"
                  placeholder="acme@hdfcbank"
                />
              </SettingsField>
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
            title="Invoice Identifier & Serial Formatting"
            description="Configure automated invoice numbering, fiscal year formatting, and starting counters."
            icon={Hash}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SettingsField label="Invoice Prefix">
                <Input
                  value={invoicePrefix}
                  onChange={(e) => {
                    setInvoicePrefix(e.target.value.toUpperCase());
                    setHasChanges(true);
                  }}
                  className="h-9 text-xs font-mono font-bold"
                  placeholder="INV-"
                />
              </SettingsField>

              <SettingsField label="Starting / Next Counter">
                <Input
                  type="number"
                  value={nextInvoiceNumber}
                  onChange={(e) => {
                    setNextInvoiceNumber(e.target.value);
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

            <div className="divide-y divide-border/40 pt-2">
              <SettingsToggleRow
                label="Include Current Year in Prefix"
                description="Example: INV-2026-00001 (Resets or namespaces per fiscal year)."
                checked={includeYearInPrefix}
                onCheckedChange={(c) => {
                  setIncludeYearInPrefix(c);
                  setHasChanges(true);
                }}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">Generated Identifier Preview:</span>
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                {invoicePrefix}{includeYearInPrefix ? `${new Date().getFullYear()}-` : ""}{nextInvoiceNumber.padStart(parseInt(digitPadding) || 5, "0")}
              </Badge>
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "taxes",
      label: "Taxes & GST Rules",
      icon: Percent,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Invoice Tax Calculation Rules"
            description="Configure default line-item tax behavior and calculation modes."
            icon={Percent}
          >
            <div className="space-y-4">
              <SettingsRow
                label="Default GST Tax Rate"
                description="Standard percentage applied to newly added invoice line items."
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
                  label="Calculate Tax Per Line Item"
                  description="Allows different tax percentages on individual product and service items."
                  checked={applyTaxPerLineItem}
                  onCheckedChange={(c) => {
                    setApplyTaxPerLineItem(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Show CGST/SGST/IGST Breakdown Table"
                  description="Display full GST itemized tax summary on invoices."
                  checked={showTaxBreakdownTable}
                  onCheckedChange={(c) => {
                    setShowTaxBreakdownTable(c);
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
      label: "Payment Terms",
      icon: CreditCard,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Invoice Due Dates & Payment Schedules"
            description="Manage standard settlement periods and automated payment reminders."
            icon={CreditCard}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsField label="Default Payment Term">
                <Select
                  value={defaultPaymentTerms}
                  onValueChange={(val) => {
                    setDefaultPaymentTerms(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DUE_ON_RECEIPT">Due on Receipt (Immediate)</SelectItem>
                    <SelectItem value="NET15">Net 15 Days</SelectItem>
                    <SelectItem value="NET30">Net 30 Days (Standard)</SelectItem>
                    <SelectItem value="NET60">Net 60 Days</SelectItem>
                    <SelectItem value="NET90">Net 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              <SettingsField label="Automated Payment Reminder Ahead of Due Date">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    value={autoReminderDaysBeforeDue}
                    onChange={(e) => {
                      setAutoReminderDaysBeforeDue(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs w-20 text-center"
                  />
                  <span className="text-xs text-muted-foreground">days before</span>
                </div>
              </SettingsField>
            </div>

            <div className="divide-y divide-border/40 pt-2">
              <SettingsToggleRow
                label="Allow Partial / Installment Payments"
                description="Enable logging split payments and tracking outstanding balances."
                checked={allowPartialPayments}
                onCheckedChange={(c) => {
                  setAllowPartialPayments(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Auto-Mark Status as Overdue"
                description="Automatically flag invoice state as Overdue when unpaid past due date."
                checked={autoMarkOverdue}
                onCheckedChange={(c) => {
                  setAutoMarkOverdue(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "templates",
      label: "Templates & PDF",
      icon: LayoutTemplate,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Invoice Visual Styling & Layout"
            description="Choose presentation template for customer downloadable invoice PDFs."
            icon={LayoutTemplate}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INVOICE_TEMPLATES.map((tmpl) => {
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
                label="Print Verified Bank Details on Invoice"
                description="Include beneficiary account number and IFSC/SWIFT on footer."
                checked={showBankDetailsOnPDF}
                onCheckedChange={(c) => {
                  setShowBankDetailsOnPDF(c);
                  setHasChanges(true);
                }}
              />
              <SettingsToggleRow
                label="Include Dynamic UPI / QR Code"
                description="Render a scannable payment QR code for instant UPI settlement."
                checked={showQRCodeForUPI}
                onCheckedChange={(c) => {
                  setShowQRCodeForUPI(c);
                  setHasChanges(true);
                }}
              />
            </div>
          </SettingsSection>
        </div>
      ),
    },
    {
      id: "defaults",
      label: "Default Notes & Terms",
      icon: SlidersHorizontal,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Standard Notes & Customer Remittance Terms"
            description="Pre-populate default remittance instructions and gratitude notes on new invoices."
            icon={SlidersHorizontal}
          >
            <div className="space-y-4">
              <SettingsField label="Default Customer Notes">
                <Textarea
                  value={defaultNotes}
                  onChange={(e) => {
                    setDefaultNotes(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="text-xs resize-none"
                />
              </SettingsField>

              <SettingsField label="Default Terms & Conditions">
                <Textarea
                  value={defaultTerms}
                  onChange={(e) => {
                    setDefaultTerms(e.target.value);
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
  ];

  return (
    <ContextualSettingsDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Invoice & GST Settings"
      subtitle="Configure legal tax details, bank accounts, numbering format, payment terms, and PDF templates."
      icon={Receipt}
      badge="Billing & Revenue"
      sections={sections}
      defaultSection={defaultSection}
      isSaving={isPending}
      hasUnsavedChanges={hasChanges}
      onSave={handleSave}
    />
  );
}
