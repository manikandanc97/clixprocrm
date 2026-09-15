"use client";

import React from "react";
import {
  SettingsSection,
  SettingsField,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { LayoutTemplate, Eye, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { INVOICE_TEMPLATES } from "../../constants/invoice-settings.constants";

export interface InvoiceTemplateSectionProps {
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
  paperFormat: string;
  setPaperFormat: (v: string) => void;
  showLogoOnPDF: boolean;
  setShowLogoOnPDF: (v: boolean) => void;
  showCustomerGstin: boolean;
  setShowCustomerGstin: (v: boolean) => void;
  showBankDetailsOnPDF: boolean;
  setShowBankDetailsOnPDF: (v: boolean) => void;
  showSignatureBlock: boolean;
  setShowSignatureBlock: (v: boolean) => void;
  showCompanyStamp: boolean;
  setShowCompanyStamp: (v: boolean) => void;
  onPreviewOpen: () => void;
  onChangeNotify: () => void;
}

export function InvoiceTemplateSection({
  selectedTemplate,
  setSelectedTemplate,
  paperFormat,
  setPaperFormat,
  showLogoOnPDF,
  setShowLogoOnPDF,
  showCustomerGstin,
  setShowCustomerGstin,
  showBankDetailsOnPDF,
  setShowBankDetailsOnPDF,
  showSignatureBlock,
  setShowSignatureBlock,
  showCompanyStamp,
  setShowCompanyStamp,
  onPreviewOpen,
  onChangeNotify,
}: InvoiceTemplateSectionProps) {
  return (
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
            onClick={onPreviewOpen}
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
                onClick={() => { setSelectedTemplate(tmpl.id); onChangeNotify(); }}
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
                <p className="text-[11px] text-muted-foreground leading-relaxed">{tmpl.description}</p>
              </div>
            );
          })}
        </div>

        {/* Paper Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <SettingsField label="PDF Document Paper Format">
            <Select value={paperFormat} onValueChange={(val) => { setPaperFormat(val); onChangeNotify(); }}>
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
              onCheckedChange={(c) => { setShowLogoOnPDF(c); onChangeNotify(); }}
            />
            <SettingsToggleRow
              label="Display Customer GSTIN & PAN Section"
              checked={showCustomerGstin}
              onCheckedChange={(c) => { setShowCustomerGstin(c); onChangeNotify(); }}
            />
            <SettingsToggleRow
              label="Display Bank Remittance & Wire Settlement Details"
              checked={showBankDetailsOnPDF}
              onCheckedChange={(c) => { setShowBankDetailsOnPDF(c); onChangeNotify(); }}
            />
            <SettingsToggleRow
              label="Include Authorized Signatory Block"
              checked={showSignatureBlock}
              onCheckedChange={(c) => { setShowSignatureBlock(c); onChangeNotify(); }}
            />
            <SettingsToggleRow
              label="Include Company Seal / Stamp Placeholder"
              checked={showCompanyStamp}
              onCheckedChange={(c) => { setShowCompanyStamp(c); onChangeNotify(); }}
            />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
