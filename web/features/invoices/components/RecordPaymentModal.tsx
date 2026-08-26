"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Receipt,
  Mail,
  Building,
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
import { useRecordPayment } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    currency: string;
    customer?: { name?: string; company?: string; email?: string } | null;
  } | null;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
}: RecordPaymentModalProps) {
  const { formatCurrency } = useCurrency();
  const { mutateAsync: recordPaymentMutate, isPending } = useRecordPayment();

  const balance = invoice?.balanceAmount ?? 0;
  const curr = invoice?.currency || "INR";

  const [amount, setAmount] = useState<number>(balance);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [sendReceiptEmail, setSendReceiptEmail] = useState(true);

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.balanceAmount || 0);
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

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

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-card border border-border/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Record Customer Payment</h2>
              <p className="text-xs text-muted-foreground font-mono">
                Invoice {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 border border-border/60 rounded-xl text-center">
            <div>
              <span className="text-[11px] text-muted-foreground block">Invoice Total</span>
              <span className="text-xs font-bold text-foreground font-mono">
                {formatCurrency(invoice.totalAmount, curr)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Paid so far</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(invoice.paidAmount, curr)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-medium">Balance Due</span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(invoice.balanceAmount, curr)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Payment Amount ({curr}) *</Label>
              <Input
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
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Payment Mode *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER" className="text-xs">Bank Transfer / NEFT / IMPS</SelectItem>
                  <SelectItem value="UPI" className="text-xs">UPI (GPay, PhonePe, Paytm)</SelectItem>
                  <SelectItem value="CARD" className="text-xs">Credit / Debit Card</SelectItem>
                  <SelectItem value="CHEQUE" className="text-xs">Cheque</SelectItem>
                  <SelectItem value="CASH" className="text-xs">Cash</SelectItem>
                  <SelectItem value="OTHER" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Payment Date *</Label>
              <Input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5">Reference # (UTR / Cheque #)</Label>
              <Input
                placeholder="e.g. UTR123456789"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground mb-1.5">Payment Notes (Optional)</Label>
            <Textarea
              rows={2}
              placeholder="Received via ICICI Netbanking..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {invoice.customer?.email && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-xs font-semibold text-foreground block">Email Payment Receipt</span>
                  <span className="text-[11px] text-muted-foreground">Send receipt to {invoice.customer.email}</span>
                </div>
              </div>
              <Switch
                checked={sendReceiptEmail}
                onCheckedChange={setSendReceiptEmail}
              />
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Payment
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
