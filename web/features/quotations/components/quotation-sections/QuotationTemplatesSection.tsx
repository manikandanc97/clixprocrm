"use client";

import React from "react";
import {
  SettingsSection,
  SettingsToggleRow,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { LayoutTemplate, Check } from "lucide-react";
import { TEMPLATES } from "../../constants/quotation-settings.constants";

interface QuotationTemplatesSectionProps {
  selectedTemplate: string;
  setSelectedTemplate: (val: string) => void;
  showCompanyLogo: boolean;
  setShowCompanyLogo: (val: boolean) => void;
  showCompanyAddress: boolean;
  setShowCompanyAddress: (val: boolean) => void;
  showGSTIN: boolean;
  setShowGSTIN: (val: boolean) => void;
  showAuthorizedSignatory: boolean;
  setShowAuthorizedSignatory: (val: boolean) => void;
  showPageNumber: boolean;
  setShowPageNumber: (val: boolean) => void;
  showGeneratedDate: boolean;
  setShowGeneratedDate: (val: boolean) => void;
  setHasChanges: (val: boolean) => void;
}

export function QuotationTemplatesSection({
  selectedTemplate,
  setSelectedTemplate,
  showCompanyLogo,
  setShowCompanyLogo,
  showCompanyAddress,
  setShowCompanyAddress,
  showGSTIN,
  setShowGSTIN,
  showAuthorizedSignatory,
  setShowAuthorizedSignatory,
  showPageNumber,
  setShowPageNumber,
  showGeneratedDate,
  setShowGeneratedDate,
  setHasChanges,
}: QuotationTemplatesSectionProps) {
  return (
    <div className="space-y-4">
      <SettingsSection
        title="Quotation PDF & Layout Templates"
        description="Select visual styling, brand layout, and presentation theme for customer quotes."
        icon={LayoutTemplate}
      >
        {/* Visual Template Thumbnails */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  setSelectedTemplate(tmpl.id);
                  setHasChanges(true);
                }}
                className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-500/[0.04] ring-1 ring-emerald-500/40 shadow-xs dark:bg-emerald-500/10 dark:border-emerald-500"
                    : "border-border/80 hover:border-border hover:bg-muted/30 bg-card"
                }`}
              >
                {/* Visual Preview Miniature */}
                <div className="w-full h-20 rounded-lg bg-muted/40 border border-border/50 p-2 mb-2.5 flex flex-col justify-between overflow-hidden pointer-events-none">
                  {tmpl.id === "modern" && (
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-10 rounded bg-emerald-600/70" />
                        <div className="h-1.5 w-6 rounded bg-muted-foreground/30" />
                      </div>
                      <div className="h-1 w-full bg-border/80 my-1" />
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-muted-foreground/20 rounded-xs" />
                        <div className="h-1.5 w-4/5 bg-muted-foreground/15 rounded-xs" />
                        <div className="h-1.5 w-3/4 bg-muted-foreground/15 rounded-xs" />
                      </div>
                      <div className="flex justify-end pt-1">
                        <div className="h-2.5 w-12 rounded bg-emerald-500/20 border border-emerald-500/30" />
                      </div>
                    </div>
                  )}

                  {tmpl.id === "classic" && (
                    <div className="space-y-1 w-full border border-border/70 p-1 rounded-xs bg-background/50 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-border/60 pb-1">
                        <div className="h-2 w-8 rounded-xs bg-foreground/60" />
                        <div className="h-1.5 w-8 rounded-xs bg-foreground/40" />
                      </div>
                      <div className="grid grid-cols-3 gap-0.5 py-0.5">
                        <div className="h-1.5 bg-muted-foreground/20" />
                        <div className="h-1.5 bg-muted-foreground/20" />
                        <div className="h-1.5 bg-muted-foreground/20" />
                        <div className="h-1.5 bg-muted-foreground/10" />
                        <div className="h-1.5 bg-muted-foreground/10" />
                        <div className="h-1.5 bg-muted-foreground/10" />
                      </div>
                      <div className="border-t border-border/60 pt-0.5 flex justify-between">
                        <div className="h-1.5 w-6 bg-muted-foreground/30" />
                        <div className="h-1.5 w-8 bg-foreground/70" />
                      </div>
                    </div>
                  )}

                  {tmpl.id === "compact" && (
                    <div className="space-y-1 w-full h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="h-1.5 w-12 rounded-xs bg-foreground/60" />
                        <div className="h-1.5 w-10 rounded-xs bg-muted-foreground/40" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="h-1 w-full bg-muted-foreground/25" />
                        <div className="h-1 w-full bg-muted-foreground/15" />
                        <div className="h-1 w-full bg-muted-foreground/25" />
                        <div className="h-1 w-full bg-muted-foreground/15" />
                        <div className="h-1 w-full bg-muted-foreground/25" />
                      </div>
                      <div className="flex justify-end gap-1">
                        <div className="h-1.5 w-6 bg-muted-foreground/30" />
                        <div className="h-1.5 w-6 bg-foreground/70" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Details */}
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-xs text-foreground tracking-tight">
                      {tmpl.name}
                    </p>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {tmpl.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Branding & Header Elements */}
        <div className="pt-2">
          <h5 className="text-xs font-semibold text-foreground mb-2 px-1">
            Branding & Header Elements
          </h5>
          <div className="divide-y divide-border/40 border border-border/60 rounded-lg px-3 bg-muted/10">
            <SettingsToggleRow
              label="Show Company Logo"
              description="Display your primary organization logo on the top header of quotation documents."
              checked={showCompanyLogo}
              onCheckedChange={(c) => {
                setShowCompanyLogo(c);
                setHasChanges(true);
              }}
            />
            <SettingsToggleRow
              label="Show Company Address & Contact"
              description="Include registered office location, contact phone, and official email on the quote header."
              checked={showCompanyAddress}
              onCheckedChange={(c) => {
                setShowCompanyAddress(c);
                setHasChanges(true);
              }}
            />
            <SettingsToggleRow
              label="Show GSTIN / Tax Registration Number"
              description="Display company GSTIN / corporate tax identification on the quotation document."
              checked={showGSTIN}
              onCheckedChange={(c) => {
                setShowGSTIN(c);
                setHasChanges(true);
              }}
            />
            <SettingsToggleRow
              label="Show Authorized Signatory Block"
              description="Display signature line, signee name, and acceptance confirmation block."
              checked={showAuthorizedSignatory}
              onCheckedChange={(c) => {
                setShowAuthorizedSignatory(c);
                setHasChanges(true);
              }}
            />
            <SettingsToggleRow
              label="Show Page Numbers"
              description="Include document pagination indicators (e.g., Page 1 of 2) in footer."
              checked={showPageNumber}
              onCheckedChange={(c) => {
                setShowPageNumber(c);
                setHasChanges(true);
              }}
            />
            <SettingsToggleRow
              label="Show Generated Date & Timestamp"
              description="Print quote creation timestamp and system reference metadata."
              checked={showGeneratedDate}
              onCheckedChange={(c) => {
                setShowGeneratedDate(c);
                setHasChanges(true);
              }}
            />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
