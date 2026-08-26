"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Receipt,
  Building2,
  User,
  Calendar,
  IndianRupee,
  FileText,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useCreateInvoice, useInvoiceSettings } from "@/shared/hooks/use-invoices";
import { useCustomers, useCompanies, useDeals, useQuotations } from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerId?: string;
  initialCompanyId?: string;
  initialDealId?: string;
  initialQuotationId?: string;
}

interface LineItemState {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  taxRate: number;
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
  const settings = settingsData?.data || {};
  const { data: customersData } = useCustomers();
  const { data: companiesData } = useCompanies();
  const { data: dealsData } = useDeals();
  const { data: quotationsData } = useQuotations();
  const { mutateAsync: createInvoiceMutate, isPending: isSubmitting } = useCreateInvoice();
  const { formatCurrency } = useCurrency();

  const safeCustomers = Array.isArray(customersData) ? customersData : customersData?.customers || [];
  const safeCompanies = Array.isArray(companiesData) ? companiesData : companiesData?.companies || [];
  const safeDeals = Array.isArray(dealsData) ? dealsData : dealsData?.deals || [];
  const safeQuotations = Array.isArray(quotationsData) ? quotationsData : quotationsData?.quotations || [];

  // Form State
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
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const defaultTax = settings.defaultTaxRate ?? 18;

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

  // Load defaults from settings
  useEffect(() => {
    if (settings) {
      if (settings.defaultNotes && !notes) setNotes(settings.defaultNotes);
      if (settings.defaultTerms && !termsAndConditions) setTermsAndConditions(settings.defaultTerms);
    }
  }, [settings]);

  // Auto-sync company when customer selected
  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const found = safeCustomers.find((c: any) => c.id === cId);
    if (found?.companyId) {
      setCompanyId(found.companyId);
    }
  };

  // If quotation selected, import items
  const handleQuotationChange = (qId: string) => {
    setQuotationId(qId);
    const found = safeQuotations.find((q: any) => q.id === qId);
    if (found) {
      if (found.customerId) setCustomerId(found.customerId);
      if (found.dealId) setDealId(found.dealId);
      if (Array.isArray(found.items) && found.items.length > 0) {
        setItems(
          found.items.map((it: any, idx: number) => ({
            id: `quote_item_${idx}`,
            name: it.name || it.item || "Quotation Item",
            description: it.description || "",
            quantity: Number(it.quantity || it.qty) || 1,
            unit: it.unit || "unit",
            unitPrice: Number(it.rate || it.unitPrice || it.price) || 0,
            discountType: "PERCENTAGE",
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

  const updateItem = (index: number, field: keyof LineItemState, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Live Calculations
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxable = 0;
    let totalTax = 0;

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

      subtotal += gross;
      totalDiscount += discAmt;
      taxable += lineTaxable;
      totalTax += taxAmt;

      return {
        gross,
        discAmt,
        lineTaxable,
        taxAmt,
        lineTotal,
      };
    });

    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const rawTotal = taxable + totalTax;
    const roundedTotal = Math.round(rawTotal);
    const roundOff = Math.round((roundedTotal - rawTotal) * 100) / 100;

    return {
      subtotal,
      totalDiscount,
      taxable,
      cgst,
      sgst,
      totalTax,
      roundOff,
      totalAmount: roundedTotal,
      itemCalculations,
    };
  }, [items]);

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
    } catch (err: any) {
      // Error handled by hook toast
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-border/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Create Customer Invoice</h2>
              <p className="text-xs text-muted-foreground">
                Issue a GST-compliant tax invoice to a client organization or contact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Customer & References */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border/60">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Customer / Contact
              </Label>
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {safeCustomers.map((c: any) => (
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
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {safeCompanies.map((comp: any) => (
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
              <Select value={quotationId} onValueChange={handleQuotationChange}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Import Quotation" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {safeQuotations.map((q: any) => (
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
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Link Deal" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {safeDeals.map((d: any) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.name} ({formatCurrency(Number(d.value) || 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 2: Invoice Dates & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DUE_ON_RECEIPT" className="text-xs">Due on Receipt</SelectItem>
                  <SelectItem value="NET15" className="text-xs">Net 15 Days</SelectItem>
                  <SelectItem value="NET30" className="text-xs">Net 30 Days</SelectItem>
                  <SelectItem value="NET60" className="text-xs">Net 60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR" className="text-xs">INR (₹)</SelectItem>
                  <SelectItem value="USD" className="text-xs">USD ($)</SelectItem>
                  <SelectItem value="EUR" className="text-xs">EUR (€)</SelectItem>
                  <SelectItem value="GBP" className="text-xs">GBP (£)</SelectItem>
                  <SelectItem value="AED" className="text-xs">AED (د.إ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 3: Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Invoice Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-1.5 text-xs h-8 font-semibold"
              >
                <Plus className="w-3.5 h-3.5 text-primary" /> Add Item
              </Button>
            </div>

            <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 text-left w-[36%]">Item & Description</th>
                    <th className="py-2.5 px-2 text-center w-[12%]">Qty / Unit</th>
                    <th className="py-2.5 px-2 text-right w-[16%]">Unit Price (₹)</th>
                    <th className="py-2.5 px-2 text-right w-[12%]">Disc %</th>
                    <th className="py-2.5 px-2 text-right w-[10%]">GST %</th>
                    <th className="py-2.5 px-3 text-right w-[14%]">Total</th>
                    <th className="py-2.5 px-2 w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item, idx) => {
                    const itemCalc = calculatedTotals.itemCalculations[idx];
                    return (
                      <tr key={item.id} className="bg-card hover:bg-muted/10 transition-colors">
                        <td className="p-2.5 space-y-1">
                          <Input
                            placeholder="Product or Service Name"
                            value={item.name}
                            onChange={(e) => updateItem(idx, "name", e.target.value)}
                            className="h-8 text-xs font-semibold"
                          />
                          <Input
                            placeholder="Description (Optional)"
                            value={item.description}
                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                            className="h-7 text-[11px] text-muted-foreground"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1 items-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                              className="h-8 text-xs text-center px-1"
                            />
                            <Input
                              placeholder="unit"
                              value={item.unit}
                              onChange={(e) => updateItem(idx, "unit", e.target.value)}
                              className="h-8 text-[11px] text-center w-14 px-1"
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                            className="h-8 text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountValue}
                            onChange={(e) => updateItem(idx, "discountValue", e.target.value)}
                            className="h-8 text-xs text-right"
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={String(item.taxRate)}
                            onValueChange={(val) => updateItem(idx, "taxRate", Number(val))}
                          >
                            <SelectTrigger className="h-8 text-xs text-right">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0" className="text-xs">0%</SelectItem>
                              <SelectItem value="5" className="text-xs">5%</SelectItem>
                              <SelectItem value="12" className="text-xs">12%</SelectItem>
                              <SelectItem value="18" className="text-xs">18%</SelectItem>
                              <SelectItem value="28" className="text-xs">28%</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-foreground">
                          {formatCurrency(itemCalc?.lineTotal || 0, currency)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Notes & Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5">Notes to Customer</Label>
                <Textarea
                  rows={2}
                  placeholder="Thank you for your business..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground mb-1.5">Terms & Conditions</Label>
                <Textarea
                  rows={2}
                  placeholder="Payment is due within 15 days..."
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <div className="bg-muted/20 border border-border/70 rounded-xl p-4 space-y-2.5 font-sans">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatCurrency(calculatedTotals.subtotal, currency)}
                </span>
              </div>
              {calculatedTotals.totalDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Total Discount:</span>
                  <span className="font-mono">-{formatCurrency(calculatedTotals.totalDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Taxable Amount:</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatCurrency(calculatedTotals.taxable, currency)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>CGST (Intra-state):</span>
                <span className="font-mono">{formatCurrency(calculatedTotals.cgst, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>SGST (Intra-state):</span>
                <span className="font-mono">{formatCurrency(calculatedTotals.sgst, currency)}</span>
              </div>
              {calculatedTotals.roundOff !== 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Round Off:</span>
                  <span className="font-mono">{calculatedTotals.roundOff > 0 ? "+" : ""}{formatCurrency(calculatedTotals.roundOff, currency)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Grand Total:</span>
                <span className="text-lg font-black text-primary font-mono">
                  {formatCurrency(calculatedTotals.totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/30">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary" /> Numbers and tax totals are verified server-side on creation.
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit("SENT")}
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Save & Issue
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
