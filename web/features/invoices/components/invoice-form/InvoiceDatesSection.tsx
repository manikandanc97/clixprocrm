"use client";

import React from "react";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface InvoiceDatesSectionProps {
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  setInvoiceDate: (v: string) => void;
  setDueDate: (v: string) => void;
  setPaymentTerms: (v: string) => void;
  setCurrency: (v: string) => void;
}

export function InvoiceDatesSection({
  invoiceDate,
  dueDate,
  paymentTerms,
  currency,
  setInvoiceDate,
  setDueDate,
  setPaymentTerms,
  setCurrency,
}: InvoiceDatesSectionProps) {
  return (
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
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
