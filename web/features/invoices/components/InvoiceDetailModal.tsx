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
import { CRMDeleteDialog } from "@/shared/components/crm/CRMDeleteDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import {
  useInvoiceDetails,
  useDeleteInvoice,
  useDeletePayment,
  useSendInvoiceEmail,
} from "@/shared/hooks/use-invoices";
import { InvoiceType } from "@/shared/types/invoice";
import { RecordPaymentModal } from "./RecordPaymentModal";
import { InvoiceDocumentTab } from "./invoice-detail/InvoiceDocumentTab";
import { InvoicePaymentsTab } from "./invoice-detail/InvoicePaymentsTab";
import { InvoiceTimelineTab } from "./invoice-detail/InvoiceTimelineTab";
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
  const invoice: InvoiceType | undefined = invoiceData?.data;

  const { mutateAsync: deleteInvoiceMutate, isPending: isDeletingInvoice } = useDeleteInvoice();
  const { mutateAsync: deletePaymentMutate, isPending: isDeletingPayment } = useDeletePayment();
  const { mutateAsync: sendEmailMutate, isPending: isSendingEmail } = useSendInvoiceEmail();

  const [activeTab, setActiveTab] = useState<"document" | "payments" | "timeline">("document");
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isDeleteInvoiceOpen, setIsDeleteInvoiceOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; paymentNumber?: string } | null>(null);

  if (!isOpen || !invoiceId) return null;

  const curr = invoice?.currency || "INR";
  const status = invoice?.status || "DRAFT";

  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case "PAID":
        return <Badge variant="success" className="gap-1 font-bold"><CheckCircle2 className="size-3" /> PAID</Badge>;
      case "PARTIALLY_PAID":
        return <Badge variant="warning" className="gap-1 font-bold"><Clock className="size-3" /> PARTIALLY PAID</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive" className="gap-1 font-bold"><AlertCircle className="size-3" /> OVERDUE</Badge>;
      case "SENT":
        return <Badge variant="info" className="gap-1 font-bold"><Send className="size-3" /> SENT</Badge>;
      case "CANCELLED":
      case "VOID":
        return <Badge variant="neutral" className="gap-1 font-bold">VOID / CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" className="gap-1 font-bold">DRAFT</Badge>;
    }
  };

  const handlePrint = () => {
    if (!invoice?.id) return;
    window.open(`/api/crm/invoices/${invoice.id}/pdf`, "_blank");
  };

  const handleSendEmail = async () => {
    if (!invoice?.id) return;
    if (!invoice.customer?.email) {
      toast.error("Customer has no email address configured.");
      return;
    }
    try {
      await sendEmailMutate({ id: invoice.id });
    } catch {
      // Error handled by hook toast
    }
  };

  const onRequestDeleteInvoice = () => {
    if (invoice?.payments && invoice.payments.length > 0) {
      toast.error("Cannot delete an invoice with recorded payments. Please void or cancel the invoice instead.");
      return;
    }
    setIsDeleteInvoiceOpen(true);
  };

  const handleConfirmDeleteInvoice = async () => {
    if (!invoice?.id) return;
    try {
      await deleteInvoiceMutate(invoice.id);
      setIsDeleteInvoiceOpen(false);
      onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  const onRequestDeletePayment = (payment: { id: string; paymentNumber?: string }) => {
    setPaymentToDelete(payment);
  };

  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete?.id) return;
    try {
      await deletePaymentMutate(paymentToDelete.id);
      setPaymentToDelete(null);
      refetch();
    } catch {
      // Error handled by hook toast
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={true}
          className="flex flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-4xl max-h-[92vh] border-border/80 shadow-2xl rounded-2xl"
        >
          {/* Header */}
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
            onValueChange={(v) => setActiveTab(v as "document" | "payments" | "timeline")}
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

            {/* Scrollable Body */}
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
                  <TabsContent value="document" className="mt-0 space-y-6">
                    <InvoiceDocumentTab invoice={invoice} curr={curr} />
                  </TabsContent>

                  <TabsContent value="payments" className="mt-0 space-y-4">
                    <InvoicePaymentsTab
                      invoice={invoice}
                      curr={curr}
                      onRecordPayment={() => setIsRecordPaymentOpen(true)}
                      onDeletePayment={onRequestDeletePayment}
                    />
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-0 space-y-4">
                    <InvoiceTimelineTab invoice={invoice} />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>

          {/* Footer */}
          <DialogFooter className="shrink-0 -mx-0 -mb-0 px-6 py-3.5 border-t border-border/80 bg-muted/30 flex items-center justify-between sm:justify-between flex-row">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRequestDeleteInvoice}
              disabled={isDeletingInvoice || (invoice?.payments && invoice.payments.length > 0)}
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 font-semibold h-8"
            >
              <AppIcon name="trash" size={14} className="text-destructive" /> Delete Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold h-8">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Dialog */}
      <CRMDeleteDialog
        mode="single"
        isOpen={isDeleteInvoiceOpen}
        onOpenChange={setIsDeleteInvoiceOpen}
        title="Delete Invoice"
        itemName="Invoice"
        description={`Are you sure you want to delete invoice ${invoice?.invoiceNumber}? This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        onConfirm={handleConfirmDeleteInvoice}
        isDeleting={isDeletingInvoice}
      />

      {/* Delete Payment Dialog */}
      <CRMDeleteDialog
        mode="single"
        isOpen={Boolean(paymentToDelete)}
        onOpenChange={(open) => { if (!open) setPaymentToDelete(null); }}
        title="Delete Payment"
        itemName="Payment"
        description={`Are you sure you want to delete this payment record${paymentToDelete?.paymentNumber ? ` (${paymentToDelete.paymentNumber})` : ""}? Outstanding balance will be restored.`}
        confirmLabel="Delete Payment"
        onConfirm={handleConfirmDeletePayment}
        isDeleting={isDeletingPayment}
      />

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
