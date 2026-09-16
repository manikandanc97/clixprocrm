"use client";

import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PlatformInvoiceItemData } from "@/shared/lib/api/super-admin.api";
import { getInvStatusBadge } from "../utils/billing-formatters.util";

interface BillingInvoiceViewModalProps {
  open: boolean;
  onClose: () => void;
  selectedInvoice: PlatformInvoiceItemData | null;
  formatCurrency: (amount: number, currency?: string) => string;
}

export function BillingInvoiceViewModal({
  open,
  onClose,
  selectedInvoice,
  formatCurrency,
}: BillingInvoiceViewModalProps) {
  if (!open || !selectedInvoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-card border border-border/80 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-base font-bold text-foreground font-mono">
                {selectedInvoice.invoiceNumber}
              </h3>
              <p className="text-[11px] text-muted-foreground">Platform SaaS Tax Invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border border-border/60">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase font-bold block">Billed To</span>
              <span className="font-bold text-foreground block text-sm mt-0.5">{selectedInvoice.tenantName}</span>
              <span className="text-muted-foreground block text-[11px]">Tenant ID: {selectedInvoice.tenantId}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground uppercase font-bold block">Status</span>
              <div className="mt-1">{getInvStatusBadge(selectedInvoice.status, selectedInvoice.paymentStatus)}</div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-foreground font-bold">
                <tr className="h-10">
                  <th className="py-2 px-3 text-left border-r border-emerald-500/15">Description</th>
                  <th className="py-2 px-3 text-center border-r border-emerald-500/15">Seats</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground block capitalize">{selectedInvoice.planName} Plan</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{selectedInvoice.billingCycle} billing</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{selectedInvoice.seats}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                    {formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({selectedInvoice.taxRate || 18}%)</span>
              <span className="font-mono">{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/60">
              <span>Total Amount</span>
              <span className="font-mono text-primary">
                {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
              </span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Amount Paid</span>
              <span className="font-mono">
                {formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
