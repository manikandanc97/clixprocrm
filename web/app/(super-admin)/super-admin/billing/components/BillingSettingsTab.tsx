"use client";

import React from "react";
import {
  Shield,
  Briefcase,
  Building2,
  FileText,
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PlatformBillingSettingsData } from "@/shared/lib/api/super-admin.api";

interface BillingSettingsTabProps {
  configForm: Partial<PlatformBillingSettingsData>;
  setConfigForm: React.Dispatch<React.SetStateAction<Partial<PlatformBillingSettingsData>>>;
  savingConfig: boolean;
  showAccountNumber: boolean;
  setShowAccountNumber: (val: boolean) => void;
  onSaveConfig: (e: React.FormEvent) => void;
}

export function BillingSettingsTab({
  configForm,
  setConfigForm,
  savingConfig,
  showAccountNumber,
  setShowAccountNumber,
  onSaveConfig,
}: BillingSettingsTabProps) {
  return (
    <form onSubmit={onSaveConfig} className="space-y-6">
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-border/80 flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> ClixPro Platform Legal &amp; Invoicing Configuration
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Platform legal and banking details printed on invoices generated when customer organizations subscribe.
            </p>
          </div>
          <Button type="submit" size="sm" disabled={savingConfig} className="gap-1.5 text-xs font-semibold">
            {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Configuration
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Legal & Tax */}
          <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
              <Briefcase className="w-3.5 h-3.5 text-primary" /> Legal &amp; Tax
            </h4>

            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">Company Legal Entity Name</Label>
              <Input
                value={configForm.companyLegalName || ""}
                onChange={(e) => setConfigForm({ ...configForm, companyLegalName: e.target.value })}
                placeholder="ClixPro Technologies Pvt. Ltd."
                className="h-8 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Platform GSTIN</Label>
                <Input
                  value={configForm.gstin || ""}
                  onChange={(e) => setConfigForm({ ...configForm, gstin: e.target.value.toUpperCase() })}
                  placeholder="29AAAAA0000A1Z5"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Platform PAN</Label>
                <Input
                  value={configForm.pan || ""}
                  onChange={(e) => setConfigForm({ ...configForm, pan: e.target.value.toUpperCase() })}
                  placeholder="AAAAA0000A"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Registered Address */}
          <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
              <Building2 className="w-3.5 h-3.5 text-primary" /> Registered Address
            </h4>

            <div>
              <Label className="text-xs font-semibold text-foreground mb-1">Registered Address</Label>
              <Input
                value={configForm.billingAddress || ""}
                onChange={(e) => setConfigForm({ ...configForm, billingAddress: e.target.value })}
                placeholder="Level 4, Cyber City, Phase II"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">City</Label>
                <Input
                  value={configForm.city || ""}
                  onChange={(e) => setConfigForm({ ...configForm, city: e.target.value })}
                  placeholder="Bengaluru"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">State</Label>
                <Input
                  value={configForm.state || ""}
                  onChange={(e) => setConfigForm({ ...configForm, state: e.target.value })}
                  placeholder="Karnataka"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Postal Code</Label>
                <Input
                  value={configForm.postalCode || ""}
                  onChange={(e) => setConfigForm({ ...configForm, postalCode: e.target.value })}
                  placeholder="560100"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Invoice Settings */}
          <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
              <FileText className="w-3.5 h-3.5 text-primary" /> Invoice Settings
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Invoice Prefix</Label>
                <Input
                  value={configForm.invoicePrefix || ""}
                  onChange={(e) => setConfigForm({ ...configForm, invoicePrefix: e.target.value.toUpperCase() })}
                  placeholder="CP-INV"
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">GST Rate (%)</Label>
                <Input
                  type="number"
                  value={configForm.taxRate || 18}
                  onChange={(e) => setConfigForm({ ...configForm, taxRate: Number(e.target.value) })}
                  placeholder="18"
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Due Terms (Days)</Label>
                <Input
                  type="number"
                  value={configForm.paymentTermsDays || 15}
                  onChange={(e) => setConfigForm({ ...configForm, paymentTermsDays: Number(e.target.value) })}
                  placeholder="15"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Bank & Settlement */}
          <div className="bg-muted/15 border border-border/60 rounded-xl p-4.5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border/40">
              <CreditCard className="w-3.5 h-3.5 text-primary" /> Bank &amp; Settlement
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">Bank Name</Label>
                <Input
                  value={configForm.bankName || ""}
                  onChange={(e) => setConfigForm({ ...configForm, bankName: e.target.value })}
                  placeholder="HDFC Bank"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-semibold text-foreground">Account Number</Label>
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {showAccountNumber ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showAccountNumber ? "Mask" : "Reveal"}</span>
                  </button>
                </div>
                <Input
                  type={showAccountNumber ? "text" : "password"}
                  value={configForm.accountNumber || ""}
                  onChange={(e) => setConfigForm({ ...configForm, accountNumber: e.target.value })}
                  placeholder="50200012345678"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">IFSC Code</Label>
                <Input
                  value={configForm.ifscCode || ""}
                  onChange={(e) => setConfigForm({ ...configForm, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="HDFC0001234"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1">UPI ID</Label>
                <Input
                  value={configForm.upiId || ""}
                  onChange={(e) => setConfigForm({ ...configForm, upiId: e.target.value })}
                  placeholder="Enter UPI ID"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
