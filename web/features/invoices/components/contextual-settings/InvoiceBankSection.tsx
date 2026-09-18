"use client";

import React from "react";
import {
  SettingsSection,
  SettingsField,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Eye, EyeOff, Plus, Trash2, Landmark, QrCode } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { BankAccountItem } from "../../constants/invoice-settings.constants";
import { toast } from "sonner";

export interface InvoiceBankSectionProps {
  bankAccounts: BankAccountItem[];
  setBankAccounts: React.Dispatch<React.SetStateAction<BankAccountItem[]>>;
  showAccountMask: boolean;
  setShowAccountMask: (v: boolean) => void;
  showAddBankForm: boolean;
  setShowAddBankForm: (v: boolean) => void;
  newBank: Omit<BankAccountItem, "id" | "isPrimary">;
  setNewBank: React.Dispatch<React.SetStateAction<Omit<BankAccountItem, "id" | "isPrimary">>>;
  showUpiQrOnInvoice: boolean;
  setShowUpiQrOnInvoice: (v: boolean) => void;
  legalName: string;
  onChangeNotify: () => void;
}

function maskAccountNumber(acc: string): string {
  if (!acc) return "•••• •••• ••••";
  if (acc.length <= 4) return acc;
  const last4 = acc.slice(-4);
  return `•••• •••• ${last4}`;
}

export function InvoiceBankSection({
  bankAccounts,
  setBankAccounts,
  showAccountMask,
  setShowAccountMask,
  showAddBankForm,
  setShowAddBankForm,
  newBank,
  setNewBank,
  showUpiQrOnInvoice,
  setShowUpiQrOnInvoice,
  legalName,
  onChangeNotify,
}: InvoiceBankSectionProps) {
  const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];

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
    setNewBank({ bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "", swiftCode: "", upiId: "" });
    setShowAddBankForm(false);
    onChangeNotify();
    toast.success("Bank account added");
  };

  const handleSetPrimaryBank = (id: string) => {
    setBankAccounts((prev) => prev.map((b) => ({ ...b, isPrimary: b.id === id })));
    onChangeNotify();
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
    onChangeNotify();
    toast.success("Bank account removed");
  };

  return (
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
            onClick={() => setShowAddBankForm(!showAddBankForm)}
            className="h-8 text-xs font-semibold gap-1.5 border-border"
          >
            <Plus className="w-3.5 h-3.5 text-primary" /> Add Bank Account
          </Button>
        }
      >
        <div className="space-y-3">
          {bankAccounts.map((account) => (
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
                    onClick={() => setShowAccountMask(!showAccountMask)}
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
                    {showAccountMask ? maskAccountNumber(account.accountNumber) : account.accountNumber || "Not Set"}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] text-muted-foreground block">IFSC Code</span>
                  <span className="font-mono font-bold text-foreground">{account.ifscCode || "Not Set"}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-muted-foreground block">UPI VPA</span>
                  <span className="font-mono text-primary font-semibold truncate block">
                    {account.upiId || "Not Configured"}
                  </span>
                </div>
              </div>
            </div>
          ))}

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
                    placeholder="Enter bank name"
                  />
                </SettingsField>
                <SettingsField label="Account Holder Name">
                  <Input
                    value={newBank.accountHolderName}
                    onChange={(e) => setNewBank({ ...newBank, accountHolderName: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Enter account name"
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
                    placeholder="Enter UPI ID"
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
            onCheckedChange={(c) => { setShowUpiQrOnInvoice(c); onChangeNotify(); }}
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
  );
}
