"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { useCurrency } from "@/shared/hooks/use-currency";
import { InvoiceType, InvoiceItemType } from "@/shared/types/invoice";

interface InvoiceDocumentTabProps {
  invoice: InvoiceType;
  curr: string;
}

export function InvoiceDocumentTab({ invoice, curr }: InvoiceDocumentTabProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="space-y-6 bg-card border border-border/70 rounded-xl p-6 shadow-xs font-sans">
      {/* Top Billed Row */}
      <div className="flex justify-between items-start flex-wrap gap-4 pb-6 border-b border-border/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Billed To
          </span>
          <h3 className="text-base font-bold text-foreground">
            {invoice.company?.name || invoice.customer?.company || invoice.customer?.name || "Customer Account"}
          </h3>
          {invoice.customer?.name && (
            <p className="text-xs text-muted-foreground mt-0.5">Attn: {invoice.customer.name}</p>
          )}
          {invoice.customer?.email && (
            <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
          )}
          {Boolean((invoice.customerBillingAddress as Record<string, unknown> | null)?.gstin) && (
            <p className="text-xs font-mono font-medium text-foreground mt-1">
              GSTIN: {String((invoice.customerBillingAddress as Record<string, unknown>).gstin)}
            </p>
          )}
        </div>

        <div className="text-right space-y-1.5 text-xs">
          <div>
            <span className="text-muted-foreground">Invoice Date: </span>
            <span className="font-semibold text-foreground">
              {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Due Date: </span>
            <span className="font-semibold text-foreground">
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "Due on Receipt"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Terms: </span>
            <span className="font-semibold text-foreground">{invoice.paymentTerms || "Net 15"}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <Table wrapperClassName="border border-border/80 rounded-xl overflow-hidden shadow-none">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 text-left">Item Description</TableHead>
            <TableHead className="px-3 text-center w-20">Qty</TableHead>
            <TableHead className="px-3 text-right w-28">Rate</TableHead>
            <TableHead className="px-3 text-right w-20">Tax</TableHead>
            <TableHead className="px-4 text-right w-32 border-r-0">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
          {invoice.items?.map((it: InvoiceItemType) => (
            <TableRow key={it.id} className="h-auto hover:bg-muted/20 transition-colors border-b border-border/60">
              <TableCell className="py-3 px-4 align-top">
                <div className="font-semibold text-foreground text-xs">{it.name}</div>
                {it.description && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{it.description}</div>
                )}
              </TableCell>
              <TableCell className="py-3 px-3 text-center text-muted-foreground align-top text-xs">
                {it.quantity} {it.unit || ""}
              </TableCell>
              <TableCell className="py-3 px-3 text-right font-mono text-muted-foreground align-top text-xs">
                {formatCurrency(it.unitPrice, curr)}
              </TableCell>
              <TableCell className="py-3 px-3 text-right text-muted-foreground align-top text-xs">
                {it.taxRate ? `${it.taxRate}%` : "0%"}
              </TableCell>
              <TableCell className="py-3 px-4 text-right font-mono font-bold text-foreground align-top text-xs">
                {formatCurrency(it.lineTotal, curr)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Bottom Summary Grid */}
      <div className="flex justify-end pt-2">
        <div className="w-full sm:w-80 space-y-2.5 text-xs bg-muted/20 border border-border/60 rounded-xl p-4">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(invoice.subtotal, curr)}</span>
          </div>
          {Boolean(invoice.discountAmount && invoice.discountAmount > 0) && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Discount:</span>
              <span className="font-mono">-{formatCurrency(invoice.discountAmount || 0, curr)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Taxable Amount:</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(invoice.taxableAmount || 0, curr)}</span>
          </div>
          {Boolean(invoice.cgstAmount && invoice.cgstAmount > 0) && (
            <div className="flex justify-between text-muted-foreground">
              <span>CGST:</span>
              <span className="font-mono">{formatCurrency(invoice.cgstAmount || 0, curr)}</span>
            </div>
          )}
          {Boolean(invoice.sgstAmount && invoice.sgstAmount > 0) && (
            <div className="flex justify-between text-muted-foreground">
              <span>SGST:</span>
              <span className="font-mono">{formatCurrency(invoice.sgstAmount || 0, curr)}</span>
            </div>
          )}
          {Boolean(invoice.igstAmount && invoice.igstAmount > 0) && (
            <div className="flex justify-between text-muted-foreground">
              <span>IGST:</span>
              <span className="font-mono">{formatCurrency(invoice.igstAmount || 0, curr)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
            <span>Total Amount:</span>
            <span className="font-mono text-primary font-bold text-base">{formatCurrency(invoice.totalAmount, curr)}</span>
          </div>
          {invoice.paidAmount > 0 && (
            <>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">{formatCurrency(invoice.paidAmount, curr)}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold text-sm">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(invoice.balanceAmount, curr)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes & Terms */}
      {(invoice.notes || invoice.termsAndConditions) && (
        <div className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3 text-xs">
          {invoice.notes && (
            <div>
              <span className="font-bold text-foreground block mb-0.5">Notes:</span>
              <p className="text-muted-foreground leading-relaxed">{invoice.notes}</p>
            </div>
          )}
          {invoice.termsAndConditions && (
            <div>
              <span className="font-bold text-foreground block mb-0.5">Terms & Conditions:</span>
              <p className="text-muted-foreground leading-relaxed">{invoice.termsAndConditions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
