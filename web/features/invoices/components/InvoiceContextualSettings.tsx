"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  Receipt,
  Hash,
  Percent,
  CreditCard,
  LayoutTemplate,
  FileText,
  Check,
  CheckCircle2,
  Building2,
  Landmark,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  QrCode,
  Printer,
} from "lucide-react";
import {
  useInvoiceSettings,
  useUpdateInvoiceSettings,
} from "@/shared/hooks/use-invoices";
import { useWorkspace } from "@/shared/hooks/use-settings";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

export interface InvoiceContextualSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection?: string;
}

// Standard Indian GST State Codes
const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

const INVOICE_TEMPLATES = [
  {
    id: "corporate",
    name: "Corporate Clean",
    description: "Standard Indian enterprise invoice layout with full GST breakdown and itemized tax summary.",
    badge: "GST Compliant",
  },
  {
    id: "modern",
    name: "Modern Minimalist",
    description: "Contemporary layout with bold totals, streamlined typography, and scannable payment cards.",
    badge: "Recommended",
  },
  {
    id: "compact",
    name: "Compact Thermal / POS",
    description: "Condensed single-page layout optimized for fast rendering, service slips, and receipts.",
    badge: "Thermal 80mm",
  },
];

interface BankAccountItem {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  swiftCode?: string;
  upiId?: string;
  isPrimary: boolean;
}

interface AdditionalClauseItem {
  id: string;
  title: string;
  content: string;
}

export function InvoiceContextualSettings({
  open,
  onOpenChange,
  defaultSection = "identity",
}: InvoiceContextualSettingsProps) {
  const { data: settingsData } = useInvoiceSettings();
  const settings = settingsData?.data || {};
  const { data: workspaceData } = useWorkspace();
  const workspace: any = workspaceData || {};
  const { mutateAsync: updateSettingsMutate, isPending } = useUpdateInvoiceSettings();

  // -------------------------------------------------------------
  // SECTION 1: BUSINESS & TAX IDENTITY
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // SECTION 2: BANK & UPI
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // SECTION 3: NUMBERING & DOCUMENTS
  // -------------------------------------------------------------
  const [activeDocType, setActiveDocType] = useState<"INV" | "CN" | "DN">("INV");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [creditNotePrefix, setCreditNotePrefix] = useState("CN-");
  const [debitNotePrefix, setDebitNotePrefix] = useState("DN-");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("1001");
  const [financialYear, setFinancialYear] = useState("2026-2027");
  const [digitPadding, setDigitPadding] = useState("5");
  const [includeYearInPrefix, setIncludeYearInPrefix] = useState(true);

  // -------------------------------------------------------------
  // SECTION 4: TAX & GST RULES
  // -------------------------------------------------------------
  const [defaultTaxRate, setDefaultTaxRate] = useState("18");
  const [requireHsnSac, setRequireHsnSac] = useState(true);
  const [applyTaxPerLineItem, setApplyTaxPerLineItem] = useState(true);
  const [showTaxBreakdownTable, setShowTaxBreakdownTable] = useState(true);
  const [enableRoundOff, setEnableRoundOff] = useState(true);
  const [taxType, setTaxType] = useState("GST");

  // -------------------------------------------------------------
  // SECTION 5: PAYMENT TERMS
  // -------------------------------------------------------------
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("NET30");
  const [allowPartialPayments, setAllowPartialPayments] = useState(true);
  const [autoMarkOverdue, setAutoMarkOverdue] = useState(true);
  const [enableReminders, setEnableReminders] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState("3");
  const [reminderDaysAfter, setReminderDaysAfter] = useState("7");
  const [showAdvancedSettlement, setShowAdvancedSettlement] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState("3");

  // -------------------------------------------------------------
  // SECTION 6: INVOICE TEMPLATE & PDF
  // -------------------------------------------------------------
  const [selectedTemplate, setSelectedTemplate] = useState("corporate");
  const [paperFormat, setPaperFormat] = useState("A4");
  const [showLogoOnPDF, setShowLogoOnPDF] = useState(true);
  const [showCustomerGstin, setShowCustomerGstin] = useState(true);
  const [showBankDetailsOnPDF, setShowBankDetailsOnPDF] = useState(true);
  const [showSignatureBlock, setShowSignatureBlock] = useState(true);
  const [showCompanyStamp, setShowCompanyStamp] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // -------------------------------------------------------------
  // SECTION 7: NOTES & LEGAL
  // -------------------------------------------------------------
  const [defaultNotes, setDefaultNotes] = useState("Thank you for your business. Please remit payment by the due date.");
  const [defaultTerms, setDefaultTerms] = useState("1. Payment is due within standard settlement terms.\n2. Invoices unpaid after due date may attract statutory interest @ 18% p.a.\n3. Subject to local state jurisdiction.");
  const [additionalClauses, setAdditionalClauses] = useState<AdditionalClauseItem[]>([]);

  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from backend settings
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setLegalName(settings.legalName || workspace?.name || "");
      setGstin(settings.gstin || workspace?.taxId || "");
      setPan(settings.pan || "");
      setBillingAddress(settings.billingAddress || workspace?.address || "");
      setCity(settings.city || "");
      setState(settings.state || "Karnataka");
      setPostalCode(settings.postalCode || "");
      setCountry(settings.country || "India");
      setTaxType(settings.taxType || "GST");

      if (settings.invoicePrefix) setInvoicePrefix(settings.invoicePrefix);
      if (settings.financialYear) setFinancialYear(settings.financialYear);
      if (settings.nextInvoiceNumber) setNextInvoiceNumber(String(settings.nextInvoiceNumber));
      if (settings.defaultTaxRate !== undefined) setDefaultTaxRate(String(settings.defaultTaxRate));
      if (settings.defaultNotes) setDefaultNotes(settings.defaultNotes);
      if (settings.defaultTerms) setDefaultTerms(settings.defaultTerms);

      // Initialize Bank Accounts
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
  }, [settings, workspace]);

  // Validation helpers
  const isGstinValid = useMemo(() => {
    if (!gstin) return true;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.trim());
  }, [gstin]);

  const isPanValid = useMemo(() => {
    if (!pan) return true;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.trim());
  }, [pan]);

  const primaryBank = useMemo(
    () => bankAccounts.find((b) => b.isPrimary) || bankAccounts[0],
    [bankAccounts]
  );

  // Masking helper
  const maskAccountNumber = (acc: string) => {
    if (!acc) return "•••• •••• ••••";
    if (acc.length <= 4) return acc;
    const last4 = acc.slice(-4);
    return `•••• •••• ${last4}`;
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
        taxType,
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

  const handleAddBankAccount = () => {
    if (!newBank.bankName.trim() || !newBank.accountNumber.trim()) {
      toast.error("Please provide at least the Bank Name and Account Number");
      return;
    }
    const created: BankAccountItem = {
      ...newBank,
      id: `bank-${Date.now()}`,
      isPrimary: bankAccounts.length === 0,
    };
    setBankAccounts((prev) => [...prev, created]);
    setNewBank({
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      swiftCode: "",
      upiId: "",
    });
    setShowAddBankForm(false);
    setHasChanges(true);
    toast.success("Bank account added");
  };

  const handleSetPrimaryBank = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((b) => ({
        ...b,
        isPrimary: b.id === id,
      }))
    );
    setHasChanges(true);
    toast.success("Primary bank updated");
  };

  const handleDeleteBank = (id: string) => {
    if (bankAccounts.length <= 1) {
      toast.error("At least one beneficiary bank account is required");
      return;
    }
    setBankAccounts((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      if (prev.find((b) => b.id === id)?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
    setHasChanges(true);
    toast.success("Bank account removed");
  };

  const handleAddClause = (title: string, defaultText: string) => {
    if (additionalClauses.some((c) => c.title === title)) {
      toast.info(`"${title}" is already added.`);
      return;
    }
    setAdditionalClauses((prev) => [
      ...prev,
      { id: `clause-${Date.now()}`, title, content: defaultText },
    ]);
    setHasChanges(true);
  };

  const handleRemoveClause = (id: string) => {
    setAdditionalClauses((prev) => prev.filter((c) => c.id !== id));
    setHasChanges(true);
  };

  // Preview Identifier Generator
  const getIdentifierPreview = (type: "INV" | "CN" | "DN") => {
    const prefix =
      type === "INV"
        ? invoicePrefix
        : type === "CN"
        ? creditNotePrefix
        : debitNotePrefix;
    const pad = parseInt(digitPadding) || 5;
    const num = nextInvoiceNumber.padStart(pad, "0");
    const fy = includeYearInPrefix ? `${new Date().getFullYear()}/` : "";
    return `${prefix}${fy}${num}`;
  };

  // -------------------------------------------------------------
  // SECTIONS ARRAY
  // -------------------------------------------------------------
  const sections: ContextualSettingSection[] = [
    // 1. BUSINESS & TAX IDENTITY
    {
      id: "identity",
      label: "Business & Tax Identity",
      icon: Building2,
      component: (
        <div className="space-y-5">
          {/* Workspace Branding Inheritance Banner */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {workspace?.logo ? (
                <img
                  src={workspace.logo}
                  alt="Workspace Logo"
                  className="w-9 h-9 rounded-lg object-contain bg-background border border-border p-1"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                  {legalName?.slice(0, 2).toUpperCase() || "CP"}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-foreground">
                  Branding Inherited from Workspace
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Company logo and primary colors automatically apply to customer invoices.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
              Synced
            </Badge>
          </div>

          <SettingsSection
            title="Legal Entity & GST Registration"
            description="Official business registration details, GSTIN, PAN, and registered place of business printed on tax invoices."
            icon={Building2}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingsField label="Legal Entity / Company Name" required>
                  <Input
                    value={legalName}
                    onChange={(e) => {
                      setLegalName(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs font-semibold"
                    placeholder="e.g. ClixPro Technologies Pvt Ltd"
                  />
                </SettingsField>

                <SettingsField label="Trade / Display Name" description="Optional commercial name displayed on header">
                  <Input
                    value={tradeName}
                    onChange={(e) => {
                      setTradeName(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                    placeholder="e.g. ClixPro Cloud"
                  />
                </SettingsField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SettingsField
                  label="GSTIN (15-Digit ID)"
                  description="Goods & Services Tax ID"
                  required
                >
                  <div className="relative">
                    <Input
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase().trim());
                        setHasChanges(true);
                      }}
                      maxLength={15}
                      className={cn(
                        "h-9 text-xs font-mono font-bold uppercase",
                        gstin && !isGstinValid && "border-rose-500 focus-visible:ring-rose-500"
                      )}
                      placeholder="29AAAAA0000A1Z5"
                    />
                    {gstin && isGstinValid && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-3" />
                    )}
                  </div>
                  {gstin && !isGstinValid && (
                    <span className="text-[10.5px] text-rose-600 font-medium">
                      Invalid GSTIN format (e.g. 29AAAAA0000A1Z5)
                    </span>
                  )}
                </SettingsField>

                <SettingsField label="PAN (10-Digit ID)" description="Permanent Account Number" required>
                  <div className="relative">
                    <Input
                      value={pan}
                      onChange={(e) => {
                        setPan(e.target.value.toUpperCase().trim());
                        setHasChanges(true);
                      }}
                      maxLength={10}
                      className={cn(
                        "h-9 text-xs font-mono font-bold uppercase",
                        pan && !isPanValid && "border-rose-500 focus-visible:ring-rose-500"
                      )}
                      placeholder="AAAAA0000A"
                    />
                    {pan && isPanValid && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-3" />
                    )}
                  </div>
                  {pan && !isPanValid && (
                    <span className="text-[10.5px] text-rose-600 font-medium">
                      Invalid PAN format (e.g. AAAAA0000A)
                    </span>
                  )}
                </SettingsField>

                <SettingsField label="GST Registration Type">
                  <Select
                    value={gstType}
                    onValueChange={(val) => {
                      setGstType(val);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULAR">Regular Taxpayer</SelectItem>
                      <SelectItem value="COMPOSITION">Composition Scheme</SelectItem>
                      <SelectItem value="UNREGISTERED">Unregistered / Below Threshold</SelectItem>
                      <SelectItem value="SEZ">SEZ Unit / Developer</SelectItem>
                    </SelectContent>
                  </Select>
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
                  placeholder="e.g. Level 4, Corporate Cyber Tower, Phase 2"
                />
              </SettingsField>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

                <SettingsField label="State / Place of Supply" required>
                  <Select
                    value={state}
                    onValueChange={(val) => {
                      setState(val);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {INDIAN_STATES.map((st) => (
                        <SelectItem key={st.code} value={st.name}>
                          {st.code} - {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingsField>

                <SettingsField label="PIN / Postal Code">
                  <Input
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setHasChanges(true);
                    }}
                    maxLength={6}
                    className="h-9 text-xs font-mono"
                    placeholder="560100"
                  />
                </SettingsField>

                <SettingsField label="Country">
                  <Input
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setHasChanges(true);
                    }}
                    className="h-9 text-xs"
                    placeholder="India"
                  />
                </SettingsField>
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 2. BANK & UPI
    {
      id: "bank",
      label: "Bank & UPI",
      icon: Landmark,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Beneficiary Settlement Accounts"
            description="Manage electronic wire transfer and UPI remittance details printed on customer invoices."
            icon={Landmark}
            headerAction={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddBankForm((prev) => !prev)}
                className="h-8 text-xs font-semibold gap-1.5 border-border"
              >
                <Plus className="w-3.5 h-3.5 text-primary" /> Add Bank Account
              </Button>
            }
          >
            {/* Bank Accounts List */}
            <div className="space-y-3">
              {bankAccounts.map((account) => {
                return (
                  <div
                    key={account.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all relative space-y-3",
                      account.isPrimary
                        ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                        : "border-border/70 bg-card hover:border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {account.bankName || "Unnamed Bank"}
                          </span>
                          {account.isPrimary && (
                            <Badge className="text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0 bg-emerald-600 text-white hover:bg-emerald-600">
                              Primary Payout
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          A/C Name: {account.accountHolderName || legalName || "Organization"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setShowAccountMask((prev) => !prev)}
                          title={showAccountMask ? "Reveal Account Number" : "Mask Account Number"}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          {showAccountMask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </Button>
                        {!account.isPrimary && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimaryBank(account.id)}
                            className="text-[11px] h-7 px-2 text-primary hover:text-primary font-semibold"
                          >
                            Set Primary
                          </Button>
                        )}
                        {bankAccounts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteBank(account.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/50 text-xs">
                      <div>
                        <span className="text-[10.5px] text-muted-foreground block">Account Number</span>
                        <span className="font-mono font-bold text-foreground">
                          {showAccountMask
                            ? maskAccountNumber(account.accountNumber)
                            : account.accountNumber || "Not Set"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-muted-foreground block">IFSC Code</span>
                        <span className="font-mono font-bold text-foreground">
                          {account.ifscCode || "Not Set"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-muted-foreground block">UPI VPA</span>
                        <span className="font-mono text-primary font-semibold truncate block">
                          {account.upiId || "Not Configured"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Bank Form Drawer/Card */}
              {showAddBankForm && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-primary" /> Add New Bank Account
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setShowAddBankForm(false)}
                      className="text-muted-foreground text-xs"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SettingsField label="Bank Name" required>
                      <Input
                        value={newBank.bankName}
                        onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="e.g. ICICI Bank"
                      />
                    </SettingsField>

                    <SettingsField label="Account Holder Name">
                      <Input
                        value={newBank.accountHolderName}
                        onChange={(e) => setNewBank({ ...newBank, accountHolderName: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="e.g. ClixPro Technologies Pvt Ltd"
                      />
                    </SettingsField>

                    <SettingsField label="Account Number" required>
                      <Input
                        value={newBank.accountNumber}
                        onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                        className="h-8 text-xs font-mono font-bold"
                        placeholder="50200012345678"
                      />
                    </SettingsField>

                    <SettingsField label="IFSC Code" required>
                      <Input
                        value={newBank.ifscCode}
                        onChange={(e) => setNewBank({ ...newBank, ifscCode: e.target.value.toUpperCase() })}
                        className="h-8 text-xs font-mono font-bold"
                        placeholder="ICIC0001234"
                      />
                    </SettingsField>

                    <SettingsField label="UPI VPA / ID">
                      <Input
                        value={newBank.upiId}
                        onChange={(e) => setNewBank({ ...newBank, upiId: e.target.value })}
                        className="h-8 text-xs font-mono"
                        placeholder="clixpro@icici"
                      />
                    </SettingsField>

                    <SettingsField label="SWIFT Code (Optional)">
                      <Input
                        value={newBank.swiftCode}
                        onChange={(e) => setNewBank({ ...newBank, swiftCode: e.target.value.toUpperCase() })}
                        className="h-8 text-xs font-mono"
                        placeholder="ICICINBBXXX"
                      />
                    </SettingsField>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBankAccount}
                      className="h-8 text-xs font-semibold bg-primary text-primary-foreground"
                    >
                      Save Account
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* UPI QR Code Section */}
            <div className="pt-3 border-t border-border/60 space-y-3">
              <SettingsToggleRow
                label="Render Dynamic UPI Payment QR Code on Invoices"
                description="Embeds a scannable standard UPI QR code (GPay, PhonePe, Paytm, BHIM) that auto-populates beneficiary and amount."
                checked={showUpiQrOnInvoice}
                onCheckedChange={(c) => {
                  setShowUpiQrOnInvoice(c);
                  setHasChanges(true);
                }}
              />

              {showUpiQrOnInvoice && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Active UPI VPA for Invoices</p>
                      <p className="font-mono text-muted-foreground text-[11px]">
                        {primaryBank?.upiId || "No UPI ID set for primary bank account"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                    upi://pay format
                  </Badge>
                </div>
              )}
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 3. NUMBERING & DOCUMENTS
    {
      id: "numbering",
      label: "Numbering & Documents",
      icon: Hash,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Document Series & Sequential Numbering"
            description="Manage sequential serial codes and financial year namespacing for Invoices, Credit Notes, and Debit Notes."
            icon={Hash}
          >
            {/* Document Type Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60 max-w-sm">
              <button
                type="button"
                onClick={() => setActiveDocType("INV")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeDocType === "INV"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setActiveDocType("CN")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeDocType === "CN"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Credit Note
              </button>
              <button
                type="button"
                onClick={() => setActiveDocType("DN")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  activeDocType === "DN"
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Debit Note
              </button>
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
                    setHasChanges(true);
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
                    <SelectItem value="4">4 Digits (e.g. 0001)</SelectItem>
                    <SelectItem value="5">5 Digits (e.g. 00001)</SelectItem>
                    <SelectItem value="6">6 Digits (e.g. 000001)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <SettingsField label="Financial Year Reference">
                <Select
                  value={financialYear}
                  onValueChange={(val) => {
                    setFinancialYear(val);
                    setHasChanges(true);
                  }}
                >
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
                  onCheckedChange={(c) => {
                    setIncludeYearInPrefix(c);
                    setHasChanges(true);
                  }}
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
                {getIdentifierPreview(activeDocType)}
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
      ),
    },

    // 4. TAX & GST RULES
    {
      id: "tax",
      label: "Tax & GST Rules",
      icon: Percent,
      component: (
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
                    onValueChange={(val) => {
                      setDefaultTaxRate(val);
                      setHasChanges(true);
                    }}
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
                  • <strong>Intra-State Sale (Same State as {state || "Company State"}):</strong> Automatically split into <strong>CGST (50%) + SGST (50%)</strong>.<br />
                  • <strong>Inter-State Sale (Outside {state || "Company State"}):</strong> Automatically applied as full <strong>IGST (100%)</strong>.
                </p>
              </div>

              <div className="divide-y divide-border/40">
                <SettingsToggleRow
                  label="Require HSN / SAC Code on Invoice Line Items"
                  description="Mandatory for Indian GST B2B tax compliance and e-invoicing verification."
                  checked={requireHsnSac}
                  onCheckedChange={(c) => {
                    setRequireHsnSac(c);
                    setHasChanges(true);
                  }}
                />

                <SettingsToggleRow
                  label="Calculate Tax Per Individual Line Item"
                  description="Allows line items with varying tax rates (e.g. 5%, 12%, 18%) on the same invoice."
                  checked={applyTaxPerLineItem}
                  onCheckedChange={(c) => {
                    setApplyTaxPerLineItem(c);
                    setHasChanges(true);
                  }}
                />

                <SettingsToggleRow
                  label="Show Itemized CGST / SGST / IGST Breakdown Table"
                  description="Prints a comprehensive GST summary matrix with taxable value and split tax on customer PDF."
                  checked={showTaxBreakdownTable}
                  onCheckedChange={(c) => {
                    setShowTaxBreakdownTable(c);
                    setHasChanges(true);
                  }}
                />

                <SettingsToggleRow
                  label="Apply Automatic Round-Off on Grand Total"
                  description="Rounds invoice total amount to the nearest whole rupee (₹1.00)."
                  checked={enableRoundOff}
                  onCheckedChange={(c) => {
                    setEnableRoundOff(c);
                    setHasChanges(true);
                  }}
                />
              </div>

              {/* Round-Off Demonstration Box */}
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
      ),
    },

    // 5. PAYMENT TERMS
    {
      id: "payment",
      label: "Payment Terms",
      icon: CreditCard,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Invoice Due Dates & Settlement Terms"
            description="Manage default payment periods, partial split receipts, and automated payment reminders."
            icon={CreditCard}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsField label="Default Settlement Period" required>
                <Select
                  value={defaultPaymentTerms}
                  onValueChange={(val) => {
                    setDefaultPaymentTerms(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DUE_ON_RECEIPT">Due on Receipt (Immediate)</SelectItem>
                    <SelectItem value="NET7">Net 7 Days</SelectItem>
                    <SelectItem value="NET15">Net 15 Days</SelectItem>
                    <SelectItem value="NET30">Net 30 Days (Standard)</SelectItem>
                    <SelectItem value="NET45">Net 45 Days</SelectItem>
                    <SelectItem value="NET60">Net 60 Days</SelectItem>
                    <SelectItem value="NET90">Net 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              <SettingsField label="Automated Overdue Flagging">
                <div className="pt-2">
                  <SettingsToggleRow
                    label="Auto-Mark Overdue"
                    description="Flags invoice status as OVERDUE immediately when unpaid past due date."
                    checked={autoMarkOverdue}
                    onCheckedChange={(c) => {
                      setAutoMarkOverdue(c);
                      setHasChanges(true);
                    }}
                  />
                </div>
              </SettingsField>
            </div>

            <div className="divide-y divide-border/40 pt-2">
              <SettingsToggleRow
                label="Allow Partial / Installment Payments"
                description="Enables split payment logging against single invoices while automatically maintaining outstanding balance."
                checked={allowPartialPayments}
                onCheckedChange={(c) => {
                  setAllowPartialPayments(c);
                  setHasChanges(true);
                }}
              />

              <SettingsToggleRow
                label="Enable Automated Payment Reminders"
                description="Sends scheduled automated email notices to customers regarding pending invoices."
                checked={enableReminders}
                onCheckedChange={(c) => {
                  setEnableReminders(c);
                  setHasChanges(true);
                }}
              />
            </div>

            {/* Reminder Schedule */}
            {enableReminders && (
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                <p className="text-xs font-bold text-foreground">
                  Automated Reminder Schedule
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground block">Ahead of Due Date</span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={reminderDaysBefore}
                        onChange={(e) => {
                          setReminderDaysBefore(e.target.value);
                          setHasChanges(true);
                        }}
                        className="h-8 text-xs font-mono w-16 text-center"
                      />
                      <span className="text-muted-foreground text-[11px]">days before</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground block">On Due Date</span>
                    <div className="pt-1">
                      <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                        Exact Due Date
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground block">Overdue Follow-up</span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={reminderDaysAfter}
                        onChange={(e) => {
                          setReminderDaysAfter(e.target.value);
                          setHasChanges(true);
                        }}
                        className="h-8 text-xs font-mono w-16 text-center"
                      />
                      <span className="text-muted-foreground text-[11px]">days overdue</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Expandable Advanced Settlement Policy */}
            <div className="border border-border/70 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedSettlement((prev) => !prev)}
                aria-expanded={showAdvancedSettlement}
                className="w-full px-4 py-2.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <span>Advanced Settlement & Grace Period Rules</span>
                {showAdvancedSettlement ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showAdvancedSettlement && (
                <div className="p-4 bg-card space-y-3 border-t border-border/70 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SettingsField
                      label="Grace Period (Days)"
                      description="Extra days allowed after due date before applying late notices."
                    >
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={gracePeriodDays}
                        onChange={(e) => {
                          setGracePeriodDays(e.target.value);
                          setHasChanges(true);
                        }}
                        className="h-8 text-xs font-mono w-24 text-center"
                      />
                    </SettingsField>
                  </div>
                </div>
              )}
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 6. INVOICE TEMPLATE & PDF
    {
      id: "template",
      label: "Invoice Template",
      icon: LayoutTemplate,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Invoice Visual Styling & Layout"
            description="Select customer-facing PDF layout, typography format, paper size, and content visibility controls."
            icon={LayoutTemplate}
            headerAction={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewOpen(true)}
                className="h-8 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
              >
                <Eye className="w-3.5 h-3.5" /> Preview Invoice
              </Button>
            }
          >
            {/* Template Choices */}
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
                    className={cn(
                      "relative p-3.5 rounded-xl border cursor-pointer transition-all space-y-2",
                      isSelected
                        ? "border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30 shadow-xs"
                        : "border-border/80 hover:border-border bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9.5px] font-semibold border-border">
                        {tmpl.badge}
                      </Badge>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-xs text-foreground">{tmpl.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Paper Size Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <SettingsField label="PDF Document Paper Format">
                <Select
                  value={paperFormat}
                  onValueChange={(val) => {
                    setPaperFormat(val);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 Portrait (Standard 210 × 297 mm)</SelectItem>
                    <SelectItem value="A5">A5 Portrait (Condensed 148 × 210 mm)</SelectItem>
                    <SelectItem value="THERMAL">Thermal 80mm (Point of Sale)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>
            </div>

            {/* Content Visibility Toggles */}
            <div className="space-y-1 pt-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Content Elements Visibility
              </p>
              <div className="divide-y divide-border/40">
                <SettingsToggleRow
                  label="Display Organization Logo on Header"
                  checked={showLogoOnPDF}
                  onCheckedChange={(c) => {
                    setShowLogoOnPDF(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Display Customer GSTIN & PAN Section"
                  checked={showCustomerGstin}
                  onCheckedChange={(c) => {
                    setShowCustomerGstin(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Display Bank Remittance & Wire Settlement Details"
                  checked={showBankDetailsOnPDF}
                  onCheckedChange={(c) => {
                    setShowBankDetailsOnPDF(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Include Authorized Signatory Block"
                  checked={showSignatureBlock}
                  onCheckedChange={(c) => {
                    setShowSignatureBlock(c);
                    setHasChanges(true);
                  }}
                />
                <SettingsToggleRow
                  label="Include Company Seal / Stamp Placeholder"
                  checked={showCompanyStamp}
                  onCheckedChange={(c) => {
                    setShowCompanyStamp(c);
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>
          </SettingsSection>
        </div>
      ),
    },

    // 7. NOTES & LEGAL
    {
      id: "legal",
      label: "Notes & Legal",
      icon: FileText,
      component: (
        <div className="space-y-5">
          <SettingsSection
            title="Default Customer Notes & Legal Terms"
            description="Pre-populate standardized gratitude notes, payment instructions, and contractual terms on newly generated invoices."
            icon={FileText}
            headerAction={
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleAddClause("Payment Instructions", "Please make all cheques payable to the legal entity name. For RTGS/NEFT, kindly quote invoice reference number.")}
                  className="text-[11px] h-7 font-semibold"
                >
                  + Payment Clause
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => handleAddClause("Warranty & RMA", "Goods once sold are covered under standard 12-month manufacturer warranty. For RMA claims, contact support.")}
                  className="text-[11px] h-7 font-semibold"
                >
                  + Warranty Clause
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <SettingsField
                label="Default Customer Notes"
                description="Friendly gratitude message or brief remittance instructions printed on footer."
              >
                <Textarea
                  value={defaultNotes}
                  onChange={(e) => {
                    setDefaultNotes(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="Thank you for your business..."
                />
              </SettingsField>

              <SettingsField
                label="Default Terms & Conditions"
                description="Contractual terms, dispute jurisdiction, and overdue interest clauses."
              >
                <Textarea
                  value={defaultTerms}
                  onChange={(e) => {
                    setDefaultTerms(e.target.value);
                    setHasChanges(true);
                  }}
                  rows={4}
                  className="text-xs resize-none font-mono"
                  placeholder="1. Payment is due within standard settlement terms..."
                />
              </SettingsField>

              {/* Dynamic Additional Clauses */}
              {additionalClauses.map((clause) => (
                <div
                  key={clause.id}
                  className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {clause.title}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveClause(clause.id)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={clause.content}
                    onChange={(e) => {
                      const updated = additionalClauses.map((c) =>
                        c.id === clause.id ? { ...c, content: e.target.value } : c
                      );
                      setAdditionalClauses(updated);
                      setHasChanges(true);
                    }}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>
              ))}
            </div>
          </SettingsSection>
        </div>
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

      {/* Real High-Fidelity Live Invoice Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
          <DialogHeader className="p-4 border-b border-border/80 bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" /> Live Invoice PDF Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Layout template: <strong className="text-foreground">{selectedTemplate}</strong> • Paper: <strong className="text-foreground">{paperFormat}</strong>
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
              {getIdentifierPreview("INV")}
            </Badge>
          </DialogHeader>

          {/* High Fidelity Render Document */}
          <div className="p-6 bg-white text-slate-900 font-sans text-xs space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div className="space-y-1">
                {showLogoOnPDF && workspace?.logo && (
                  <img src={workspace.logo} alt="Logo" className="h-10 object-contain mb-2" />
                )}
                <h2 className="text-base font-extrabold text-slate-950">
                  {legalName || workspace?.name || "ClixPro Technologies Pvt Ltd"}
                </h2>
                <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">
                  {billingAddress || "Level 4, Corporate Cyber Tower, Phase 2"}, {city || "Bengaluru"}, {state} - {postalCode || "560100"}
                </p>
                {gstin && (
                  <p className="text-[11px] font-mono text-slate-700">
                    <strong>GSTIN:</strong> {gstin}
                  </p>
                )}
                {pan && (
                  <p className="text-[11px] font-mono text-slate-700">
                    <strong>PAN:</strong> {pan}
                  </p>
                )}
              </div>

              <div className="text-right space-y-1">
                <span className="text-xl font-black uppercase tracking-tight text-slate-900 block">
                  TAX INVOICE
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  ISSUED
                </span>
                <div className="pt-2 text-[11px] text-slate-600 space-y-0.5">
                  <p>Invoice #: <strong className="font-mono text-slate-900">{getIdentifierPreview("INV")}</strong></p>
                  <p>Invoice Date: <strong className="text-slate-900">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong></p>
                  <p>Payment Terms: <strong className="text-slate-900">{defaultPaymentTerms}</strong></p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Billed To
                </span>
                <p className="font-bold text-slate-900 text-xs">Acme Enterprises Pvt Ltd</p>
                <p className="text-[11px] text-slate-600">77 Residency Road, Bengaluru, Karnataka - 560025</p>
              </div>
              {showCustomerGstin && (
                <div className="text-right text-[11px] text-slate-600">
                  <p><strong>Customer GSTIN:</strong> 29AABCA1234F1Z1</p>
                  <p><strong>State:</strong> 29 - Karnataka</p>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px]">
                  <th className="p-2 text-left rounded-l-md">#</th>
                  <th className="p-2 text-left">Item & Description</th>
                  {requireHsnSac && <th className="p-2 text-center">HSN/SAC</th>}
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">GST</th>
                  <th className="p-2 text-right rounded-r-md">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 text-slate-500">1</td>
                  <td className="p-2">
                    <p className="font-bold text-slate-900">Enterprise Cloud CRM Subscription</p>
                    <p className="text-[11px] text-slate-500">Annual license with SLA support</p>
                  </td>
                  {requireHsnSac && <td className="p-2 text-center font-mono text-slate-600">998313</td>}
                  <td className="p-2 text-center font-mono">1 yr</td>
                  <td className="p-2 text-right font-mono">₹10,000.00</td>
                  <td className="p-2 text-right font-mono text-slate-600">{defaultTaxRate}%</td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">₹10,000.00</td>
                </tr>
              </tbody>
            </table>

            {/* Bottom Row: Bank + Summary */}
            <div className="flex justify-between items-start gap-6 pt-2">
              {/* Bank Details */}
              {showBankDetailsOnPDF && primaryBank && (
                <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Bank & Remittance Details
                  </span>
                  <p><strong>Bank:</strong> {primaryBank.bankName}</p>
                  <p><strong>A/C Name:</strong> {primaryBank.accountHolderName || legalName}</p>
                  <p><strong>A/C Number:</strong> {primaryBank.accountNumber ? maskAccountNumber(primaryBank.accountNumber) : "50200012345678"}</p>
                  <p><strong>IFSC:</strong> {primaryBank.ifscCode || "HDFC0001234"}</p>
                  {showUpiQrOnInvoice && primaryBank.upiId && (
                    <p className="text-primary font-bold"><strong>UPI ID:</strong> {primaryBank.upiId}</p>
                  )}
                </div>
              )}

              {/* Financial Totals */}
              <div className="w-64 text-xs space-y-1.5 border-t-2 border-slate-900 pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹10,000.00</span>
                </div>
                {showTaxBreakdownTable ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (9%):</span>
                      <span className="font-mono">₹900.00</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (9%):</span>
                      <span className="font-mono">₹900.00</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>GST ({defaultTaxRate}%):</span>
                    <span className="font-mono">₹1,800.00</span>
                  </div>
                )}
                {enableRoundOff && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Round-Off:</span>
                    <span className="font-mono">₹0.00</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-950 border-t border-slate-300 pt-1.5">
                  <span>Total Due:</span>
                  <span className="font-mono">₹11,800.00</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(defaultNotes || defaultTerms) && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                {defaultNotes && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Notes:</span>
                    <p className="text-slate-700 text-[11px] mt-0.5">{defaultNotes}</p>
                  </div>
                )}
                {defaultTerms && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Terms & Conditions:</span>
                    <p className="text-slate-600 text-[10.5px] mt-0.5 whitespace-pre-line">{defaultTerms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Signature Block */}
            {showSignatureBlock && (
              <div className="flex justify-end pt-4">
                <div className="text-center w-48 border-t border-slate-400 pt-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Authorized Signatory</p>
                  <p className="text-[11px] text-slate-800 font-semibold">{legalName || workspace?.name}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
