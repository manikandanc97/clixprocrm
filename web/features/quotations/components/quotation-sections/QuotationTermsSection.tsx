"use client";

import React from "react";
import {
  SettingsSection,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Textarea } from "@/shared/ui/textarea";
import { FileCheck2, HelpCircle } from "lucide-react";

interface QuotationTermsSectionProps {
  standardPaymentTerms: string;
  setStandardPaymentTerms: (val: string) => void;
  defaultDeliveryTerms: string;
  setDefaultDeliveryTerms: (val: string) => void;
  defaultWarrantyTerms: string;
  setDefaultWarrantyTerms: (val: string) => void;
  legalDisclaimer: string;
  setLegalDisclaimer: (val: string) => void;
  setHasChanges: (val: boolean) => void;
}

export function QuotationTermsSection({
  standardPaymentTerms,
  setStandardPaymentTerms,
  defaultDeliveryTerms,
  setDefaultDeliveryTerms,
  defaultWarrantyTerms,
  setDefaultWarrantyTerms,
  legalDisclaimer,
  setLegalDisclaimer,
  setHasChanges,
}: QuotationTermsSectionProps) {
  return (
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
  );
}
