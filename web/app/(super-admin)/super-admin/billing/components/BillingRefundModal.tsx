"use client";

import React from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { PlatformInvoiceItemData } from "@/shared/lib/api/super-admin.api";

interface BillingRefundModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  refundTargetInvoice: PlatformInvoiceItemData | null;
  refundAmount: number;
  setRefundAmount: (amount: number) => void;
  refundReason: string;
  setRefundReason: (reason: string) => void;
  isProcessing: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
}

export function BillingRefundModal({
  open,
  onClose,
  onSubmit,
  refundTargetInvoice,
  refundAmount,
  setRefundAmount,
  refundReason,
  setRefundReason,
  isProcessing,
  formatCurrency,
}: BillingRefundModalProps) {
  if (!open || !refundTargetInvoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-card border border-border/80 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-purple-600" /> Process Platform Refund
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice #:</span>
              <span className="font-mono font-bold text-foreground">{refundTargetInvoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization:</span>
              <span className="font-semibold text-foreground">{refundTargetInvoice.tenantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(refundTargetInvoice.paidAmount, refundTargetInvoice.currency)}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Refund Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={refundTargetInvoice.paidAmount}
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="h-9 text-xs font-mono font-bold"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground mb-1">Refund Reason *</Label>
            <Textarea
              rows={2}
              required
              placeholder="Enter reason for refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing}
              className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Confirm Refund
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
