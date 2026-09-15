"use client";

import React from "react";
import { Receipt, FileText, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceItem {
  id: string;
  date: string;
  invoiceNumber: string;
  description: string;
  seats: number;
  amount: number;
  status: string;
}

interface BillingHistorySectionProps {
  invoices: InvoiceItem[];
  isLoadingInvoices: boolean;
  showBillingHistory: boolean;
  setShowBillingHistory: (show: boolean) => void;
}

export function BillingHistorySection({
  invoices,
  isLoadingInvoices,
  showBillingHistory,
  setShowBillingHistory,
}: BillingHistorySectionProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs w-full mt-2">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setShowBillingHistory(!showBillingHistory)}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Receipt className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              Billing &amp; Payment History
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              View past invoices, payment receipts, active plan charges, and billing statements.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground rounded-lg cursor-pointer">
          <span>{showBillingHistory ? "Hide History" : "View History"}</span>
          {showBillingHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {showBillingHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 border-t border-border/60 pt-4 overflow-hidden"
          >
            {isLoadingInvoices ? (
              <div className="space-y-2 py-3">
                <div className="h-10 bg-muted/50 rounded-xl animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-xl animate-pulse" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border/80 rounded-xl space-y-2 bg-muted/20">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-xs font-bold text-foreground">
                  No past billing records found
                </p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Invoices and payment receipts will appear here automatically after your first subscription payment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40">
                      <th className="p-3.5 font-bold text-foreground rounded-tl-xl">Date</th>
                      <th className="p-3.5 font-bold text-foreground">Invoice #</th>
                      <th className="p-3.5 font-bold text-foreground">Plan / Description</th>
                      <th className="p-3.5 font-bold text-foreground">Seats</th>
                      <th className="p-3.5 font-bold text-foreground">Amount</th>
                      <th className="p-3.5 font-bold text-foreground">Status</th>
                      <th className="p-3.5 font-bold text-foreground text-right rounded-tr-xl">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-medium text-foreground">{inv.date}</td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground">{inv.invoiceNumber}</td>
                        <td className="p-3.5 text-foreground font-semibold">{inv.description}</td>
                        <td className="p-3.5 text-foreground">{inv.seats} seats</td>
                        <td className="p-3.5 font-bold text-foreground">
                          ₹{inv.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info(`Invoice ${inv.invoiceNumber} is being downloaded.`)}
                            className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
