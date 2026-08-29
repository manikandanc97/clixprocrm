"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Building2,
  Landmark,
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  Percent,
  QrCode,
  Info,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { useInvoiceSettings, useUpdateInvoiceSettings } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { InvoiceSettingsSkeleton } from "./SettingsSkeletons";
import { toast } from "sonner";

export function InvoiceSettings() {
  const { data: settingsData, isLoading } = useInvoiceSettings();
  const settings = settingsData?.data || {};
  const { mutateAsync: updateSettingsMutate, isPending } = useUpdateInvoiceSettings();
  const { formatCurrency } = useCurrency();

  const [form, setForm] = useState({
    invoicePrefix: "INV",
    financialYear: "2026-2027",
    nextInvoiceNumber: 1,
    legalName: "",
    gstin: "",
    pan: "",
    billingAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    upiId: "",
    defaultNotes: "Thank you for doing business with us.",
    defaultTerms: "Payment is due within 15 days of invoice date.",
    defaultTaxRate: 18,
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setForm({
        invoicePrefix: settings.invoicePrefix || "INV",
        financialYear: settings.financialYear || "2026-2027",
        nextInvoiceNumber: settings.nextInvoiceNumber || 1,
        legalName: settings.legalName || "",
        gstin: settings.gstin || "",
        pan: settings.pan || "",
        billingAddress: settings.billingAddress || "",
        city: settings.city || "",
        state: settings.state || "",
        postalCode: settings.postalCode || "",
        country: settings.country || "India",
        bankName: settings.bankName || "",
        accountNumber: settings.accountNumber || "",
        ifscCode: settings.ifscCode || "",
        accountHolderName: settings.accountHolderName || "",
        upiId: settings.upiId || "",
        defaultNotes: settings.defaultNotes || "Thank you for doing business with us.",
        defaultTerms: settings.defaultTerms || "Payment is due within 15 days of invoice date.",
        defaultTaxRate: settings.defaultTaxRate ?? 18,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsMutate({
        ...form,
        defaultTaxRate: Number(form.defaultTaxRate) || 18,
      });
    } catch {
      // Error handled by hook toast
    }
  };

  if (isLoading) {
    return <InvoiceSettingsSkeleton />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/80">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" /> Invoice & Billing Configuration
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure your organization legal tax details, numbering sequence, and bank payout information.
          </p>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="text-xs font-semibold gap-1.5"
        >
          <Save className="w-3.5 h-3.5" /> Save Changes
        </Button>
      </div>

      {/* Grid: Numbering & Tax */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Numbering & Tax Rules */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" /> Numbering & Tax Format
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">Invoice Prefix</Label>
              <Input
                value={form.invoicePrefix}
                onChange={(e) => handleChange("invoicePrefix", e.target.value.toUpperCase())}
                placeholder="INV"
                className="h-8 text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-muted-foreground">e.g. INV-2026-000001</span>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">Default GST Rate (%)</Label>
              <Input
                type="number"
                value={form.defaultTaxRate}
                onChange={(e) => handleChange("defaultTaxRate", e.target.value)}
                placeholder="18"
                className="h-8 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">GSTIN</Label>
              <Input
                value={form.gstin}
                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                placeholder="29AAAAA0000A1Z5"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">PAN</Label>
              <Input
                value={form.pan}
                onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
                placeholder="AAAAA0000A"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Legal Entity */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary" /> Organization Legal Identity
          </h4>

          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Legal Entity / Company Name</Label>
            <Input
              value={form.legalName}
              onChange={(e) => handleChange("legalName", e.target.value)}
              placeholder="Acme Technologies Pvt Ltd"
              className="h-8 text-xs font-semibold"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Billing Street Address</Label>
            <Input
              value={form.billingAddress}
              onChange={(e) => handleChange("billingAddress", e.target.value)}
              placeholder="123 Tech Park, Phase 1"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">City</Label>
              <Input
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Bengaluru"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">State</Label>
              <Input
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="Karnataka"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">PIN Code</Label>
              <Input
                value={form.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                placeholder="560100"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Bank & Payout Details */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-primary" /> Bank & UPI Payment Details (Printed on Invoices)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Bank Name</Label>
            <Input
              value={form.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              placeholder="HDFC Bank"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Account Number</Label>
            <Input
              value={form.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
              placeholder="50200012345678"
              className="h-8 text-xs font-mono"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">IFSC Code</Label>
            <Input
              value={form.ifscCode}
              onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())}
              placeholder="HDFC0001234"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Account Holder Name</Label>
            <Input
              value={form.accountHolderName}
              onChange={(e) => handleChange("accountHolderName", e.target.value)}
              placeholder="Acme Technologies Pvt Ltd"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">UPI ID (VPA)</Label>
            <Input
              value={form.upiId}
              onChange={(e) => handleChange("upiId", e.target.value)}
              placeholder="acme@hdfcbank"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Default Notes & Terms */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Default Notes & Terms
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Default Notes</Label>
            <Textarea
              rows={3}
              value={form.defaultNotes}
              onChange={(e) => handleChange("defaultNotes", e.target.value)}
              className="text-xs resize-none"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Default Terms & Conditions</Label>
            <Textarea
              rows={3}
              value={form.defaultTerms}
              onChange={(e) => handleChange("defaultTerms", e.target.value)}
              className="text-xs resize-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
