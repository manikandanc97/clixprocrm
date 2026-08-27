"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Mail,
  Clock,
  Building2,
  User,
  Calendar,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle,
  Send,
  Receipt,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { useInvoiceDetails, useUpdateInvoice, useDeleteInvoice, useDeletePayment, useSendInvoiceEmail } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface InvoiceDetailModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({
  invoiceId,
  isOpen,
  onClose,
}: InvoiceDetailModalProps) {
  const { data: invoiceData, isLoading, refetch } = useInvoiceDetails(invoiceId);
  const invoice = invoiceData?.data || invoiceData;
  const { formatCurrency } = useCurrency();

  const { mutateAsync: updateStatusMutate, isPending: isUpdatingStatus } = useUpdateInvoice();
  const { mutateAsync: deleteInvoiceMutate, isPending: isDeletingInvoice } = useDeleteInvoice();
  const { mutateAsync: deletePaymentMutate } = useDeletePayment();
  const { mutateAsync: sendEmailMutate, isPending: isSendingEmail } = useSendInvoiceEmail();

  const [activeTab, setActiveTab] = useState<"document" | "payments" | "timeline">("document");
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  if (!isOpen || !invoiceId) return null;

  const curr = invoice?.currency || "INR";
  const status = invoice?.status || "DRAFT";

  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case "PAID":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> PAID</span>;
      case "PARTIALLY_PAID":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> PARTIALLY PAID</span>;
      case "OVERDUE":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"><AlertCircle className="w-3.5 h-3.5" /> OVERDUE</span>;
      case "SENT":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"><Send className="w-3.5 h-3.5" /> SENT</span>;
      case "CANCELLED":
      case "VOID":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-500 border border-slate-500/20">VOID / CANCELLED</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">DRAFT</span>;
    }
  };

  const handlePrint = () => {
    const printUrl = `/api/crm/invoices/${invoice.id}/pdf`;
    window.open(printUrl, "_blank");
  };

  const handleSendEmail = async () => {
    if (!invoice?.customer?.email) {
      toast.error("Customer has no email address configured.");
      return;
    }
    try {
      await sendEmailMutate({ id: invoice.id });
    } catch {
      // Error handled by hook toast
    }
  };

  const handleDeleteInvoice = async () => {
    if (invoice.payments && invoice.payments.length > 0) {
      toast.error("Cannot delete an invoice with recorded payments. Please void or cancel the invoice instead.");
      return;
    }
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      try {
        await deleteInvoiceMutate(invoice.id);
        onClose();
      } catch {
        // Error handled by hook toast
      }
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment record? Outstanding balance will be restored.")) {
      try {
        await deletePaymentMutate(paymentId);
        refetch();
      } catch {
        // Error handled by hook toast
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-card border border-border/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-mono font-bold text-sm">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground font-mono">
                    {invoice?.invoiceNumber || "Invoice"}
                  </h2>
                  {invoice && getStatusBadge(status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoice?.customer?.name || invoice?.company?.name || "Customer Invoice"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs font-semibold h-8"
              >
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="gap-1.5 text-xs font-semibold h-8"
              >
                <Mail className="w-3.5 h-3.5 text-primary" /> Send Email
              </Button>
              {invoice && invoice.balanceAmount > 0 && status !== "CANCELLED" && status !== "VOID" && (
                <Button
                  size="sm"
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="gap-1.5 text-xs font-semibold h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Record Payment
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 px-6 border-b border-border/80 bg-background/50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("document")}
              className={`py-3 relative transition-colors ${
                activeTab === "document" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Invoice Document
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`py-3 relative transition-colors ${
                activeTab === "payments" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Payments & History {invoice?.payments?.length ? `(${invoice.payments.length})` : ""}
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-3 relative transition-colors ${
                activeTab === "timeline" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity Timeline {invoice?.timelineEvents?.length ? `(${invoice.timelineEvents.length})` : ""}
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading || !invoice ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-muted rounded w-48" />
                <div className="h-32 bg-muted/60 rounded-xl" />
                <div className="h-48 bg-muted/40 rounded-xl" />
              </div>
            ) : (
              <>
                {/* TAB 1: High Fidelity Document Preview */}
                {activeTab === "document" && (
                  <div className="space-y-6 bg-card border border-border/70 rounded-2xl p-6 shadow-xs font-sans">
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
                          <p className="text-xs text-muted-foreground">Attn: {invoice.customer.name}</p>
                        )}
                        {invoice.customer?.email && (
                          <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
                        )}
                        {(invoice.customerBillingAddress as any)?.gstin && (
                          <p className="text-xs font-mono font-medium text-foreground mt-1">
                            GSTIN: {(invoice.customerBillingAddress as any).gstin}
                          </p>
                        )}
                      </div>

                      <div className="text-right space-y-1 text-xs">
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
                    <div className="border border-border/80 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                          <tr>
                            <th className="py-2.5 px-3 text-left">Item Description</th>
                            <th className="py-2.5 px-2 text-center">Qty</th>
                            <th className="py-2.5 px-2 text-right">Rate</th>
                            <th className="py-2.5 px-2 text-right">Tax</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {invoice.items?.map((it: any) => (
                            <tr key={it.id} className="hover:bg-muted/10">
                              <td className="p-3">
                                <div className="font-semibold text-foreground">{it.name}</div>
                                {it.description && <div className="text-[11px] text-muted-foreground mt-0.5">{it.description}</div>}
                              </td>
                              <td className="p-2 text-center text-muted-foreground">
                                {it.quantity} {it.unit || ""}
                              </td>
                              <td className="p-2 text-right font-mono text-muted-foreground">
                                {formatCurrency(it.unitPrice, curr)}
                              </td>
                              <td className="p-2 text-right text-muted-foreground">
                                {it.taxRate ? `${it.taxRate}%` : "0%"}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-foreground">
                                {formatCurrency(it.lineTotal, curr)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Summary Grid */}
                    <div className="flex justify-end">
                      <div className="w-72 space-y-2 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal:</span>
                          <span className="font-mono font-semibold text-foreground">{formatCurrency(invoice.subtotal, curr)}</span>
                        </div>
                        {invoice.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span>Discount:</span>
                            <span className="font-mono">-{formatCurrency(invoice.discountAmount, curr)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Taxable Amount:</span>
                          <span className="font-mono font-semibold text-foreground">{formatCurrency(invoice.taxableAmount, curr)}</span>
                        </div>
                        {invoice.cgstAmount > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>CGST:</span>
                            <span className="font-mono">{formatCurrency(invoice.cgstAmount, curr)}</span>
                          </div>
                        )}
                        {invoice.sgstAmount > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>SGST:</span>
                            <span className="font-mono">{formatCurrency(invoice.sgstAmount, curr)}</span>
                          </div>
                        )}
                        {invoice.igstAmount > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>IGST:</span>
                            <span className="font-mono">{formatCurrency(invoice.igstAmount, curr)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
                          <span>Total Amount:</span>
                          <span className="font-mono text-primary font-black text-base">{formatCurrency(invoice.totalAmount, curr)}</span>
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

                    {/* Notes */}
                    {(invoice.notes || invoice.termsAndConditions) && (
                      <div className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-2 text-xs">
                        {invoice.notes && (
                          <div>
                            <span className="font-bold text-foreground block">Notes:</span>
                            <p className="text-muted-foreground">{invoice.notes}</p>
                          </div>
                        )}
                        {invoice.termsAndConditions && (
                          <div>
                            <span className="font-bold text-foreground block">Terms & Conditions:</span>
                            <p className="text-muted-foreground">{invoice.termsAndConditions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Payments History */}
                {activeTab === "payments" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">Payment Records</h3>
                      {invoice.balanceAmount > 0 && (
                        <Button
                          size="sm"
                          onClick={() => setIsRecordPaymentOpen(true)}
                          className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Record Payment
                        </Button>
                      )}
                    </div>

                    {invoice.payments?.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border/80 rounded-2xl bg-muted/10 space-y-3">
                        <CreditCard className="w-10 h-10 text-muted-foreground mx-auto" />
                        <h4 className="text-sm font-bold text-foreground">No payments recorded yet</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          When the customer makes a partial or full payment, record it here to update the balance.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                            <tr>
                              <th className="py-2.5 px-3 text-left">Payment #</th>
                              <th className="py-2.5 px-2 text-left">Date</th>
                              <th className="py-2.5 px-2 text-left">Mode</th>
                              <th className="py-2.5 px-2 text-left">Reference #</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-2 w-[5%]"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {invoice.payments?.map((p: any) => (
                              <tr key={p.id} className="hover:bg-muted/10">
                                <td className="p-3 font-mono font-bold text-foreground">{p.paymentNumber}</td>
                                <td className="p-2 text-muted-foreground">
                                  {new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td className="p-2 font-medium text-foreground">{p.paymentMethod.replace(/_/g, " ")}</td>
                                <td className="p-2 font-mono text-muted-foreground">{p.referenceNumber || "-"}</td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(p.amount, p.currency || curr)}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => handleDeletePayment(p.id)}
                                    title="Delete Payment"
                                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                  >
                                    <AppIcon name="trash" size={14} className="text-destructive" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Activity Timeline */}
                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground">Invoice Timeline</h3>
                    {invoice.timelineEvents?.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No timeline events recorded.</p>
                    ) : (
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {invoice.timelineEvents?.map((evt: any) => (
                          <div key={evt.id} className="relative group">
                            <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                            <div className="text-xs font-semibold text-foreground">{evt.description || evt.action}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {new Date(evt.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteInvoice}
              disabled={isDeletingInvoice || (invoice?.payments && invoice.payments.length > 0)}
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 font-semibold"
            >
              <AppIcon name="trash" size={14} className="text-destructive" /> Delete Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Record Payment Sub-Modal */}
      {invoice && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            refetch();
          }}
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount,
            paidAmount: invoice.paidAmount,
            balanceAmount: invoice.balanceAmount,
            currency: curr,
            customer: invoice.customer,
          }}
        />
      )}
    </>
  );
}
