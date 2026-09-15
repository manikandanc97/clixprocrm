"use client";

import React, { useMemo } from "react";
import {
  SettingsSection,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { INDIAN_STATES } from "../../constants/invoice-settings.constants";

export interface InvoiceIdentitySectionProps {
  legalName: string;
  setLegalName: (v: string) => void;
  tradeName: string;
  setTradeName: (v: string) => void;
  gstin: string;
  setGstin: (v: string) => void;
  pan: string;
  setPan: (v: string) => void;
  gstType: string;
  setGstType: (v: string) => void;
  billingAddress: string;
  setBillingAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  workspaceLogo?: string;
  onChangeNotify: () => void;
}

export function InvoiceIdentitySection({
  legalName,
  setLegalName,
  tradeName,
  setTradeName,
  gstin,
  setGstin,
  pan,
  setPan,
  gstType,
  setGstType,
  billingAddress,
  setBillingAddress,
  city,
  setCity,
  state,
  setState,
  postalCode,
  setPostalCode,
  country,
  setCountry,
  workspaceLogo,
  onChangeNotify,
}: InvoiceIdentitySectionProps) {
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

  return (
    <div className="space-y-5">
      {/* Workspace Branding Inheritance Banner */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {workspaceLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={workspaceLogo}
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
                onChange={(e) => { setLegalName(e.target.value); onChangeNotify(); }}
                className="h-9 text-xs font-semibold"
                placeholder="e.g. ClixPro Technologies Pvt Ltd"
              />
            </SettingsField>

            <SettingsField label="Trade / Display Name" description="Optional commercial name displayed on header">
              <Input
                value={tradeName}
                onChange={(e) => { setTradeName(e.target.value); onChangeNotify(); }}
                className="h-9 text-xs"
                placeholder="e.g. ClixPro Cloud"
              />
            </SettingsField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SettingsField label="GSTIN (15-Digit ID)" description="Goods & Services Tax ID" required>
              <div className="relative">
                <Input
                  value={gstin}
                  onChange={(e) => { setGstin(e.target.value.toUpperCase().trim()); onChangeNotify(); }}
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
                  onChange={(e) => { setPan(e.target.value.toUpperCase().trim()); onChangeNotify(); }}
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
              <Select value={gstType} onValueChange={(val) => { setGstType(val); onChangeNotify(); }}>
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
              onChange={(e) => { setBillingAddress(e.target.value); onChangeNotify(); }}
              className="h-9 text-xs"
              placeholder="e.g. Level 4, Corporate Cyber Tower, Phase 2"
            />
          </SettingsField>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <SettingsField label="City">
              <Input
                value={city}
                onChange={(e) => { setCity(e.target.value); onChangeNotify(); }}
                className="h-9 text-xs"
                placeholder="Bengaluru"
              />
            </SettingsField>

            <SettingsField label="State / Place of Supply" required>
              <Select value={state} onValueChange={(val) => { setState(val); onChangeNotify(); }}>
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
                onChange={(e) => { setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6)); onChangeNotify(); }}
                maxLength={6}
                className="h-9 text-xs font-mono"
                placeholder="560100"
              />
            </SettingsField>

            <SettingsField label="Country">
              <Input
                value={country}
                onChange={(e) => { setCountry(e.target.value); onChangeNotify(); }}
                className="h-9 text-xs"
                placeholder="India"
              />
            </SettingsField>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
