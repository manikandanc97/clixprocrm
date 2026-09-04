"use client";

import React, { useState } from "react";
import {
  Printer,
  Mail,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Send,
  Receipt,
} from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  useInvoiceDetails,
  useDeleteInvoice,
  useDeletePayment,
  useSendInvoiceEmail,
} from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { toast } from "sonner";

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
        return (
          <Badge variant="success" className="gap-1 font-bold">
            <CheckCircle2 className="size-3" /> PAID
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge variant="warning" className="gap-1 font-bold">
            <Clock className="size-3" /> PARTIALLY PAID
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="gap-1 font-bold">
            <AlertCircle className="size-3" /> OVERDUE
          </Badge>
        );
      case "SENT":
        return (
          <Badge variant="info" className="gap-1 font-bold">
            <Send className="size-3" /> SENT
          </Badge>
        );
      case "CANCELLED":
      case "VOID":
        return (
          <Badge variant="neutral" className="gap-1 font-bold">
            VOID / CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="gap-1 font-bold">
            DRAFT
          </Badge>
        );
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
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={true}
          className="flex flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl max-h-[92vh] border-border/80 shadow-2xl rounded-2xl"
        >
          {/* Top Bar / Header */}
          <DialogHeader className="shrink-0 px-6 py-4 border-b border-border/80 bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <DialogTitle className="text-lg font-bold text-foreground font-mono">
                      {invoice?.invoiceNumber || "Invoice"}
                    </DialogTitle>
                    {invoice && getStatusBadge(status)}
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {invoice?.customer?.name || invoice?.company?.name || "Customer Invoice"}
                  </DialogDescription>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1.5 text-xs font-semibold h-8 border-border hover:bg-muted"
                >
                  <Printer className="size-3.5" /> Print / PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="gap-1.5 text-xs font-semibold h-8 border-border hover:bg-muted"
                >
                  <Mail className="size-3.5 text-primary" /> Send Email
                </Button>
                {invoice && invoice.balanceAmount > 0 && status !== "CANCELLED" && status !== "VOID" && (
                  <Button
                    size="sm"
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="gap-1.5 text-xs font-semibold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <CreditCard className="size-3.5" /> Record Payment
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Tab Navigation & Body */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="px-6 border-b border-border/80 bg-background/50">
              <TabsList className="bg-transparent border-0 p-0 h-auto gap-6 justify-start">
                <TabsTrigger
                  value="document"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-0.5 text-xs font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Invoice Document
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-0.5 text-xs font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Payments & History {invoice?.payments?.length ? `(${invoice.payments.length})` : ""}
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-0.5 text-xs font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Activity Timeline {invoice?.timelineEvents?.length ? `(${invoice.timelineEvents.length})` : ""}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading || !invoice ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-32 ml-auto" />
                      <Skeleton className="h-4 w-28 ml-auto" />
                    </div>
                  </div>
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <div className="flex justify-end">
                    <Skeleton className="h-32 w-64 rounded-xl" />
                  </div>
                </div>
              ) : (
                <>
                  {/* TAB 1: High Fidelity Document Preview */}
                  <TabsContent value="document" className="mt-0 space-y-6">
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
                          {(invoice.customerBillingAddress as any)?.gstin && (
                            <p className="text-xs font-mono font-medium text-foreground mt-1">
                              GSTIN: {(invoice.customerBillingAddress as any).gstin}
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
                      <Table wrapperClassName="border border-border/70 rounded-xl overflow-hidden shadow-none">
                        <TableHeader className="bg-muted/40 border-b border-border/70">
                          <TableRow className="h-9 hover:bg-transparent border-b border-border/70">
                            <TableHead className="py-2.5 px-4 text-left font-semibold text-muted-foreground text-xs">
                              Item Description
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-center font-semibold text-muted-foreground text-xs w-20">
                              Qty
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-right font-semibold text-muted-foreground text-xs w-28">
                              Rate
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-right font-semibold text-muted-foreground text-xs w-20">
                              Tax
                            </TableHead>
                            <TableHead className="py-2.5 px-4 text-right font-semibold text-muted-foreground text-xs w-32">
                              Amount
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/60">
                          {invoice.items?.map((it: any) => (
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
                  </TabsContent>

                  {/* TAB 2: Payments History */}
                  <TabsContent value="payments" className="mt-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Payment Records</h3>
                        <p className="text-xs text-muted-foreground">History of payments received for this invoice</p>
                      </div>
                      {invoice.balanceAmount > 0 && (
                        <Button
                          size="sm"
                          onClick={() => setIsRecordPaymentOpen(true)}
                          className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <CreditCard className="size-3.5" /> Record Payment
                        </Button>
                      )}
                    </div>

                    {!invoice.payments || invoice.payments.length === 0 ? (
                      <EmptyState
                        title="No payments recorded yet"
                        description="When the customer makes a partial or full payment, record it here to update the balance."
                        icon={CreditCard}
                        className="border border-dashed border-border/80 rounded-2xl bg-muted/10 py-10"
                        action={
                          invoice.balanceAmount > 0
                            ? {
                                label: "Record Payment",
                                onClick: () => setIsRecordPaymentOpen(true),
                                icon: CreditCard,
                                className: "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold",
                              }
                            : undefined
                        }
                      />
                    ) : (
                      <Table wrapperClassName="border border-border/70 rounded-xl overflow-hidden shadow-none">
                        <TableHeader className="bg-muted/40 border-b border-border/70">
                          <TableRow className="h-9 hover:bg-transparent border-b border-border/70">
                            <TableHead className="py-2.5 px-4 text-left font-semibold text-muted-foreground text-xs">
                              Payment #
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-left font-semibold text-muted-foreground text-xs">
                              Date
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-left font-semibold text-muted-foreground text-xs">
                              Mode
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-left font-semibold text-muted-foreground text-xs">
                              Reference #
                            </TableHead>
                            <TableHead className="py-2.5 px-4 text-right font-semibold text-muted-foreground text-xs">
                              Amount
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-center font-semibold text-muted-foreground text-xs w-12">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/60">
                          {invoice.payments.map((p: any) => (
                            <TableRow key={p.id} className="h-auto hover:bg-muted/20 transition-colors border-b border-border/60">
                              <TableCell className="py-3 px-4 font-mono font-bold text-foreground text-xs">
                                {p.paymentNumber}
                              </TableCell>
                              <TableCell className="py-3 px-3 text-muted-foreground text-xs">
                                {new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </TableCell>
                              <TableCell className="py-3 px-3 font-medium text-foreground text-xs">
                                {p.paymentMethod.replace(/_/g, " ")}
                              </TableCell>
                              <TableCell className="py-3 px-3 font-mono text-muted-foreground text-xs">
                                {p.referenceNumber || "—"}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                {formatCurrency(p.amount, p.currency || curr)}
                              </TableCell>
                              <TableCell className="py-3 px-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleDeletePayment(p.id)}
                                  title="Delete Payment"
                                  aria-label="Delete payment"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <AppIcon name="trash" size={14} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>

                  {/* TAB 3: Activity Timeline */}
                  <TabsContent value="timeline" className="mt-0 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Invoice Timeline</h3>
                      <p className="text-xs text-muted-foreground">Audit trail and life cycle events for this invoice</p>
                    </div>

                    {!invoice.timelineEvents || invoice.timelineEvents.length === 0 ? (
                      <EmptyState
                        title="No timeline events recorded"
                        description="Timeline events will be logged as actions occur on this invoice."
                        icon={Clock}
                        className="border border-dashed border-border/80 rounded-2xl bg-muted/10 py-10"
                      />
                    ) : (
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                        {invoice.timelineEvents.map((evt: any) => (
                          <div key={evt.id} className="relative group">
                            <div className="absolute -left-6 top-0.5 size-3 rounded-full bg-primary ring-4 ring-background" />
                            <div className="text-xs font-semibold text-foreground">{evt.description || evt.action}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {new Date(evt.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>

          {/* Footer Actions */}
          <DialogFooter className="shrink-0 -mx-0 -mb-0 px-6 py-3.5 border-t border-border/80 bg-muted/30 flex items-center justify-between sm:justify-between flex-row">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteInvoice}
              disabled={isDeletingInvoice || (invoice?.payments && invoice.payments.length > 0)}
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 font-semibold h-8"
            >
              <AppIcon name="trash" size={14} className="text-destructive" /> Delete Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold h-8"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
