"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/table";
import { EmptyState } from "@/shared/components/EmptyState";
import { useCurrency } from "@/shared/hooks/use-currency";
import { InvoiceType, InvoicePaymentType } from "@/shared/types/invoice";

interface InvoicePaymentsTabProps {
  invoice: InvoiceType;
  curr: string;
  onRecordPayment: () => void;
  onDeletePayment: (payment: { id: string; paymentNumber?: string }) => void;
}

export function InvoicePaymentsTab({
  invoice,
  curr,
  onRecordPayment,
  onDeletePayment,
}: InvoicePaymentsTabProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Payment Records</h3>
          <p className="text-xs text-muted-foreground">History of payments received for this invoice</p>
        </div>
        {invoice.balanceAmount > 0 && (
          <Button
            size="sm"
            onClick={onRecordPayment}
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
                  onClick: onRecordPayment,
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
              <TableHead className="py-2.5 px-4 text-left font-semibold text-muted-foreground text-xs">Payment #</TableHead>
              <TableHead className="py-2.5 px-3 text-left font-semibold text-muted-foreground text-xs">Date</TableHead>
              <TableHead className="py-2.5 px-3 text-left font-semibold text-muted-foreground text-xs">Mode</TableHead>
              <TableHead className="py-2.5 px-3 text-left font-semibold text-muted-foreground text-xs">Reference #</TableHead>
              <TableHead className="py-2.5 px-4 text-right font-semibold text-muted-foreground text-xs">Amount</TableHead>
              <TableHead className="py-2.5 px-3 text-center font-semibold text-muted-foreground text-xs w-12">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {(invoice.payments || []).map((p: InvoicePaymentType) => (
              <TableRow key={p.id} className="h-auto hover:bg-muted/20 transition-colors border-b border-border/60">
                <TableCell className="py-3 px-4 font-mono font-bold text-foreground text-xs">
                  {p.paymentNumber}
                </TableCell>
                <TableCell className="py-3 px-3 text-muted-foreground text-xs">
                  {new Date(p.paymentDate || p.createdAt || "").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
                    onClick={() => onDeletePayment(p)}
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
    </div>
  );
}
