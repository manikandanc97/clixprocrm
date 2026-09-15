"use client";

import React from "react";
import {
  SettingsSection,
  SettingsField,
} from "@/shared/components/crm/ContextualSettingsComponents";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Trash2, FileText } from "lucide-react";
import type { AdditionalClauseItem } from "../../constants/invoice-settings.constants";
import { toast } from "sonner";

export interface InvoiceNotesSectionProps {
  defaultNotes: string;
  setDefaultNotes: (v: string) => void;
  defaultTerms: string;
  setDefaultTerms: (v: string) => void;
  additionalClauses: AdditionalClauseItem[];
  setAdditionalClauses: React.Dispatch<React.SetStateAction<AdditionalClauseItem[]>>;
  onChangeNotify: () => void;
}

export function InvoiceNotesSection({
  defaultNotes,
  setDefaultNotes,
  defaultTerms,
  setDefaultTerms,
  additionalClauses,
  setAdditionalClauses,
  onChangeNotify,
}: InvoiceNotesSectionProps) {
  const handleAddClause = (title: string, defaultText: string) => {
    if (additionalClauses.some((c) => c.title === title)) {
      toast.info(`"${title}" is already added.`);
      return;
    }
    setAdditionalClauses((prev) => [
      ...prev,
      { id: `clause-${Date.now()}`, title, content: defaultText },
    ]);
    onChangeNotify();
  };

  const handleRemoveClause = (id: string) => {
    setAdditionalClauses((prev) => prev.filter((c) => c.id !== id));
    onChangeNotify();
  };

  return (
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
              onClick={() =>
                handleAddClause(
                  "Payment Instructions",
                  "Please make all cheques payable to the legal entity name. For RTGS/NEFT, kindly quote invoice reference number."
                )
              }
              className="text-[11px] h-7 font-semibold"
            >
              + Payment Clause
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() =>
                handleAddClause(
                  "Warranty & RMA",
                  "Goods once sold are covered under standard 12-month manufacturer warranty. For RMA claims, contact support."
                )
              }
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
              onChange={(e) => { setDefaultNotes(e.target.value); onChangeNotify(); }}
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
              onChange={(e) => { setDefaultTerms(e.target.value); onChangeNotify(); }}
              rows={4}
              className="text-xs resize-none font-mono"
              placeholder="1. Payment is due within standard settlement terms..."
            />
          </SettingsField>

          {additionalClauses.map((clause) => (
            <div
              key={clause.id}
              className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{clause.title}</span>
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
                  onChangeNotify();
                }}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
