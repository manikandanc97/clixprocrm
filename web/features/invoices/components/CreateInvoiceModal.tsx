"use client";

import React, { useState, useMemo } from "react";
import { Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { FormModal } from "@/shared/components/crm/FormModal";
import { useCreateInvoice, useInvoiceSettings } from "@/shared/hooks/use-invoices";
import { useCustomers, useCompanies, useDeals, useQuotations } from "@/shared/hooks/use-crm";
import { QuotationType } from "@/shared/types/quotation";
import { PipelineLeadType } from "@/shared/types/pipeline";
import { CustomerType } from "@/shared/types/customer";
import { toast } from "sonner";

import { LineItemState, InvoiceTotals } from "./invoice-form/invoice-types";
import { InvoiceReferencesSection } from "./invoice-form/InvoiceReferencesSection";
import { InvoiceDatesSection } from "./invoice-form/InvoiceDatesSection";
import { InvoiceLineItemsTable } from "./invoice-form/InvoiceLineItemsTable";
import { InvoiceSummaryPanel } from "./invoice-form/InvoiceSummaryPanel";

interface CompanyOption {
  id: string;
  name: string;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerId?: string;
  initialCompanyId?: string;
  initialDealId?: string;
  initialQuotationId?: string;
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  initialCustomerId,
  initialCompanyId,
  initialDealId,
  initialQuotationId,
}: CreateInvoiceModalProps) {
  const { data: settingsData } = useInvoiceSettings();
  const settings = settingsData?.data;
  const { data: customersData } = useCustomers();
  const { data: companiesData } = useCompanies();
  const { data: dealsData } = useDeals();
  const { data: quotationsData } = useQuotations();
  const { mutateAsync: createInvoiceMutate, isPending: isSubmitting } = useCreateInvoice();

  const safeCustomers: CustomerType[] = Array.isArray(customersData) ? (customersData as CustomerType[]) : (customersData?.customers as CustomerType[]) || [];
  const safeCompanies: CompanyOption[] = Array.isArray(companiesData) ? (companiesData as CompanyOption[]) : (companiesData?.companies as CompanyOption[]) || [];
  const safeDeals: PipelineLeadType[] = Array.isArray(dealsData) ? (dealsData as PipelineLeadType[]) : (dealsData?.deals as PipelineLeadType[]) || [];
  const safeQuotations: QuotationType[] = Array.isArray(quotationsData) ? (quotationsData as QuotationType[]) : (quotationsData?.quotations as QuotationType[]) || [];

  // ─── Form State ────────────────────────────────────────────────────────────
  const [customerId, setCustomerId] = useState(initialCustomerId || "");
  const [companyId, setCompanyId] = useState(initialCompanyId || "");
  const [dealId, setDealId] = useState(initialDealId || "");
  const [quotationId, setQuotationId] = useState(initialQuotationId || "");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [paymentTerms, setPaymentTerms] = useState("NET15");
  const [currency, setCurrency] = useState("INR");
  const [notes, setNotes] = useState(() => settings?.defaultNotes || "");
  const [termsAndConditions, setTermsAndConditions] = useState(() => settings?.defaultTerms || "");
  const defaultTax = settings?.defaultTaxRate ?? 18;

  const [items, setItems] = useState<LineItemState[]>([
    {
      id: "item_1",
      name: "",
      description: "",
      quantity: 1,
      unit: "unit",
      unitPrice: 0,
      discountType: "PERCENTAGE",
      discountValue: 0,
      taxRate: defaultTax,
    },
  ]);

  // Async settings sync
  const [prevSettings, setPrevSettings] = useState(settings);
  if (settings && settings !== prevSettings) {
    setPrevSettings(settings);
    if (!notes && settings.defaultNotes) setNotes(settings.defaultNotes);
    if (!termsAndConditions && settings.defaultTerms) setTermsAndConditions(settings.defaultTerms);
  }

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const found = safeCustomers.find((c: CustomerType) => c.id === cId);
    if (found?.companyId) setCompanyId(found.companyId);
  };

  const handleQuotationChange = (qId: string) => {
    setQuotationId(qId);
    const found = safeQuotations.find((q: QuotationType) => q.id === qId);
    if (found) {
      if (found.customerId) setCustomerId(found.customerId);
      if (found.dealId) setDealId(found.dealId);
      if (Array.isArray(found.items) && found.items.length > 0) {
        setItems(
          found.items.map((it: Record<string, unknown>, idx: number) => ({
            id: `quote_item_${idx}`,
            name: String(it.name || it.item || "Quotation Item"),
            description: String(it.description || ""),
            quantity: Number(it.quantity || it.qty) || 1,
            unit: String(it.unit || "unit"),
            unitPrice: Number(it.rate || it.unitPrice || it.price) || 0,
            discountType: "PERCENTAGE" as const,
            discountValue: Number(it.discount) || 0,
            taxRate: Number(it.taxRate) || defaultTax,
          }))
        );
      }
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        name: "",
        description: "",
        quantity: 1,
        unit: "unit",
        unitPrice: 0,
        discountType: "PERCENTAGE",
        discountValue: 0,
        taxRate: defaultTax,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("Invoice must have at least one line item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = <K extends keyof LineItemState>(index: number, field: K, value: LineItemState[K]) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // ─── Dirty Tracking ────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    const hasCustomerChanged = customerId !== (initialCustomerId || "");
    const hasCompanyChanged = companyId !== (initialCompanyId || "");
    const hasDealChanged = dealId !== (initialDealId || "");
    const hasQuotationChanged = quotationId !== (initialQuotationId || "");
    const hasNotes = Boolean(notes && notes !== (settings?.defaultNotes || ""));
    const hasTerms = Boolean(termsAndConditions && termsAndConditions !== (settings?.defaultTerms || ""));
    const hasItemData =
      items.length > 1 ||
      Boolean(items[0]?.name.trim()) ||
      Number(items[0]?.unitPrice) > 0 ||
      Boolean(items[0]?.description?.trim());
    return hasCustomerChanged || hasCompanyChanged || hasDealChanged || hasQuotationChanged || hasNotes || hasTerms || hasItemData;
  }, [customerId, initialCustomerId, companyId, initialCompanyId, dealId, initialDealId, quotationId, initialQuotationId, notes, settings?.defaultNotes, termsAndConditions, settings?.defaultTerms, items]);

  // ─── Live Totals ───────────────────────────────────────────────────────────
  const calculatedTotals = useMemo((): InvoiceTotals => {
    const itemCalculations = items.map((it) => {
      const qty = Math.max(0, Number(it.quantity) || 0);
      const rate = Math.max(0, Number(it.unitPrice) || 0);
      const gross = qty * rate;
      let discAmt = 0;
      if (it.discountType === "PERCENTAGE") {
        discAmt = gross * (Math.min(100, Math.max(0, Number(it.discountValue) || 0)) / 100);
      } else {
        discAmt = Math.min(gross, Math.max(0, Number(it.discountValue) || 0));
      }
      const lineTaxable = Math.max(0, gross - discAmt);
      const taxRate = Math.max(0, Number(it.taxRate) || 0);
      const taxAmt = lineTaxable * (taxRate / 100);
      const lineTotal = lineTaxable + taxAmt;
      return { gross, discAmt, lineTaxable, taxAmt, lineTotal };
    });

    const totals = itemCalculations.reduce(
      (acc, curr) => ({
        subtotal: acc.subtotal + curr.gross,
        totalDiscount: acc.totalDiscount + curr.discAmt,
        taxable: acc.taxable + curr.lineTaxable,
        totalTax: acc.totalTax + curr.taxAmt,
      }),
      { subtotal: 0, totalDiscount: 0, taxable: 0, totalTax: 0 }
    );

    const cgst = totals.totalTax / 2;
    const sgst = totals.totalTax / 2;
    const rawTotal = totals.taxable + totals.totalTax;
    const roundedTotal = Math.round(rawTotal);
    const roundOff = Math.round((roundedTotal - rawTotal) * 100) / 100;

    return {
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      taxable: totals.taxable,
      cgst,
      sgst,
      totalTax: totals.totalTax,
      roundOff,
      totalAmount: roundedTotal,
      itemCalculations,
    };
  }, [items]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (targetStatus: "DRAFT" | "SENT") => {
    if (items.some((it) => !it.name.trim())) {
      toast.error("Please provide a name/description for all items.");
      return;
    }
    if (items.some((it) => Number(it.unitPrice) <= 0)) {
      toast.error("Item unit price must be greater than 0.");
      return;
    }
    try {
      await createInvoiceMutate({
        customerId: customerId || undefined,
        companyId: companyId || undefined,
        dealId: dealId || undefined,
        quotationId: quotationId || undefined,
        invoiceDate,
        dueDate,
        paymentTerms,
        currency,
        status: targetStatus,
        notes,
        termsAndConditions,
        items: items.map((it, idx) => ({
          name: it.name.trim(),
          description: it.description?.trim() || undefined,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || "unit",
          unitPrice: Number(it.unitPrice) || 0,
          discountType: it.discountType,
          discountValue: Number(it.discountValue) || 0,
          taxRate: Number(it.taxRate) || 0,
          sortOrder: idx,
        })),
      });
      onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  return (
    <FormModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Create Customer Invoice"
      description="Issue a GST-compliant tax invoice to a client organization or contact"
      size="xl"
      isDirty={isDirty}
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary shrink-0" /> Numbers and tax totals are verified server-side on creation.
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="text-xs font-semibold">
              Cancel
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => handleSubmit("DRAFT")} disabled={isSubmitting} className="text-xs font-semibold">
              Save Draft
            </Button>
            <Button type="button" size="sm" onClick={() => handleSubmit("SENT")} disabled={isSubmitting} className="text-xs font-semibold gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Save & Issue
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Section 1: Customer & References */}
        <InvoiceReferencesSection
          customerId={customerId}
          companyId={companyId}
          dealId={dealId}
          quotationId={quotationId}
          customers={safeCustomers}
          companies={safeCompanies}
          deals={safeDeals}
          quotations={safeQuotations}
          onCustomerChange={handleCustomerChange}
          onCompanyChange={setCompanyId}
          onDealChange={setDealId}
          onQuotationChange={handleQuotationChange}
        />

        {/* Section 2: Invoice Dates & Terms */}
        <InvoiceDatesSection
          invoiceDate={invoiceDate}
          dueDate={dueDate}
          paymentTerms={paymentTerms}
          currency={currency}
          setInvoiceDate={setInvoiceDate}
          setDueDate={setDueDate}
          setPaymentTerms={setPaymentTerms}
          setCurrency={setCurrency}
        />

        {/* Section 3: Line Items Table */}
        <InvoiceLineItemsTable
          items={items}
          currency={currency}
          itemCalculations={calculatedTotals.itemCalculations}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
        />

        {/* Section 4: Notes & Financial Summary */}
        <InvoiceSummaryPanel
          notes={notes}
          termsAndConditions={termsAndConditions}
          currency={currency}
          totals={calculatedTotals}
          setNotes={setNotes}
          setTermsAndConditions={setTermsAndConditions}
        />
      </div>
    </FormModal>
  );
}
