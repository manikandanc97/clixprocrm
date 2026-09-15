"use client";

import React from "react";
import { User, Building2, FileText, Sparkles } from "lucide-react";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CustomerType } from "@/shared/types/customer";
import { PipelineLeadType } from "@/shared/types/pipeline";
import { QuotationType } from "@/shared/types/quotation";
import { useCurrency } from "@/shared/hooks/use-currency";

interface CompanyOption {
  id: string;
  name: string;
}

interface InvoiceReferencesSectionProps {
  customerId: string;
  companyId: string;
  dealId: string;
  quotationId: string;
  customers: CustomerType[];
  companies: CompanyOption[];
  deals: PipelineLeadType[];
  quotations: QuotationType[];
  onCustomerChange: (id: string) => void;
  onCompanyChange: (id: string) => void;
  onDealChange: (id: string) => void;
  onQuotationChange: (id: string) => void;
}

export function InvoiceReferencesSection({
  customerId,
  companyId,
  dealId,
  quotationId,
  customers,
  companies,
  deals,
  quotations,
  onCustomerChange,
  onCompanyChange,
  onDealChange,
  onQuotationChange,
}: InvoiceReferencesSectionProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border/60">
      <div>
        <Label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" /> Customer / Contact
        </Label>
        <Select value={customerId} onValueChange={onCustomerChange}>
          <SelectTrigger className="h-9 text-xs bg-background">
            <SelectValue placeholder="Select Customer" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {customers.map((c: CustomerType) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.name} {c.company ? `(${c.company})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-primary" /> Company (Account)
        </Label>
        <Select value={companyId} onValueChange={onCompanyChange}>
          <SelectTrigger className="h-9 text-xs bg-background">
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {companies.map((comp: CompanyOption) => (
              <SelectItem key={comp.id} value={comp.id} className="text-xs">
                {comp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" /> Quotation (Optional)
        </Label>
        <Select value={quotationId} onValueChange={onQuotationChange}>
          <SelectTrigger className="h-9 text-xs bg-background">
            <SelectValue placeholder="Import Quotation" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {quotations.map((q: QuotationType) => (
              <SelectItem key={q.id} value={q.id} className="text-xs">
                {q.quoteNumber || "Quote"} - {q.client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Deal (Optional)
        </Label>
        <Select value={dealId} onValueChange={onDealChange}>
          <SelectTrigger className="h-9 text-xs bg-background">
            <SelectValue placeholder="Link Deal" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {deals.map((d: PipelineLeadType) => (
              <SelectItem key={d.id} value={d.id} className="text-xs">
                {d.name} ({formatCurrency(Number(d.value) || 0)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
