"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Receipt,
  Mail,
  Building2,
  QrCode,
  CreditCard,
  Banknote,
  CircleDollarSign,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Switch } from "@/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { useRecordPayment } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { toast } from "sonner";

interface InvoiceTarget {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  customer?: { name?: string; company?: string; email?: string } | null;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceTarget | null;
}

function RecordPaymentForm({
  invoice,
  onClose,
}: {
  invoice: InvoiceTarget;
  onClose: () => void;
}) {
  const { formatCurrency } = useCurrency();
  const { mutateAsync: recordPaymentMutate, isPending } = useRecordPayment();

  const balance = invoice.balanceAmount ?? 0;
  const curr = invoice.currency || "INR";

  const [amount, setAmount] = useState<number>(balance);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [sendReceiptEmail, setSendReceiptEmail] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error("Payment amount must be greater than 0.");
      return;
    }
    if (amount > balance + 0.01) {
      toast.error(`Payment cannot exceed outstanding balance of ${formatCurrency(balance, curr)}`);
      return;
    }

    try {
      await recordPaymentMutate({
        invoiceId: invoice.id,
        payload: {
          amount: Number(amount),
          currency: curr,
          paymentMethod,
          paymentDate,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          status: "SUCCESS",
          sendReceiptEmail,
        },
      });
      onClose();
    } catch {
      // Error handled by hook toast
    }
  };

  const customerDisplay = invoice.customer?.name || invoice.customer?.company;

  return (
    <DialogContent
      showCloseButton={true}
      className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl rounded-2xl"
    >
      {/* Header */}
      <DialogHeader className="shrink-0 px-6 py-4 border-b border-border/80 bg-muted/30">
        <div className="flex items-center gap-3 pr-8">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Receipt className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Record Customer Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-mono">
              Invoice {invoice.invoiceNumber}
              {customerDisplay ? ` • ${customerDisplay}` : ""}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-2 p-3.5 bg-muted/30 border border-border/70 rounded-xl text-center">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">Invoice Total</span>
              <span className="text-xs font-bold text-foreground font-mono">
                {formatCurrency(invoice.totalAmount, curr)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block mb-0.5">Paid So Far</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(invoice.paidAmount, curr)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 block mb-0.5">Balance Due</span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(invoice.balanceAmount, curr)}
              </span>
            </div>
          </div>

          {/* Amount & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount" className="text-xs font-semibold text-foreground">
                Payment Amount ({curr}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-method" className="text-xs font-semibold text-foreground">
                Payment Mode <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="h-9 text-xs">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <span>Bank Transfer / NEFT / IMPS</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="UPI" className="text-xs">
                    <div className="flex items-center gap-2">
                      <QrCode className="size-3.5 text-muted-foreground" />
                      <span>UPI (GPay, PhonePe, Paytm)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CARD" className="text-xs">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-3.5 text-muted-foreground" />
                      <span>Credit / Debit Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CHEQUE" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Receipt className="size-3.5 text-muted-foreground" />
                      <span>Cheque</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CASH" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Banknote className="size-3.5 text-muted-foreground" />
                      <span>Cash</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="OTHER" className="text-xs">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="size-3.5 text-muted-foreground" />
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="payment-date" className="text-xs font-semibold text-foreground">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="payment-date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference-number" className="text-xs font-semibold text-foreground">
                Reference # (UTR / Cheque #)
              </Label>
              <Input
                id="reference-number"
                placeholder="Enter UTR or transaction reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-notes" className="text-xs font-semibold text-foreground">
              Payment Notes <span className="text-[11px] font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="payment-notes"
              rows={2}
              placeholder="Received via ICICI Netbanking..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Email Receipt Option */}
          {invoice.customer?.email && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/60 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="send-receipt-email" className="text-xs font-semibold text-foreground block cursor-pointer">
                    Email Payment Receipt
                  </Label>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Send receipt to {invoice.customer.email}
                  </p>
                </div>
              </div>
              <Switch
                id="send-receipt-email"
                checked={sendReceiptEmail}
                onCheckedChange={setSendReceiptEmail}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 -mx-0 -mb-0 px-6 py-3.5 border-t border-border/80 bg-muted/30 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="text-xs font-semibold h-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="text-xs font-semibold h-8 gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>Confirm Payment</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
}: RecordPaymentModalProps) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isOpen && (
        <RecordPaymentForm
          key={`${invoice.id}-${invoice.balanceAmount}`}
          invoice={invoice}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}
