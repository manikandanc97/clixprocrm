import React from "react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { PlatformInvoiceItemData, PlatformSubscriptionItem } from "@/shared/lib/api/super-admin.api";
import { toast } from "sonner";

export function getSubStatusBadge(st: string) {
  switch (st?.toUpperCase()) {
    case "ACTIVE":
      return <StatusBadge status="ACTIVE" variant="emerald" />;
    case "TRIALING":
      return <StatusBadge status="TRIALING" variant="blue" />;
    case "PAST_DUE":
      return <StatusBadge status="PAST DUE" variant="rose" />;
    case "CANCELED":
    case "CANCELLED":
      return <StatusBadge status="CANCELED" variant="neutral" />;
    default:
      return <StatusBadge status={st || "UNKNOWN"} variant="neutral" />;
  }
}

export function getInvStatusBadge(st: string, paySt: string) {
  if (st === "REFUNDED" || paySt === "REFUNDED") {
    return <StatusBadge status="REFUNDED" variant="purple" />;
  }
  switch (paySt?.toUpperCase()) {
    case "PAID":
      return <StatusBadge status="PAID" variant="emerald" />;
    case "PARTIALLY_REFUNDED":
      return <StatusBadge status="PARTIAL REFUND" variant="amber" />;
    case "PENDING":
      return <StatusBadge status="PENDING" variant="amber" />;
    case "FAILED":
    case "OVERDUE":
      return <StatusBadge status={paySt || "OVERDUE"} variant="rose" />;
    default:
      return <StatusBadge status={paySt || st || "UNPAID"} variant="neutral" />;
  }
}

export function exportInvoicesToCSV(invoices: PlatformInvoiceItemData[]) {
  try {
    const rows = [
      ["Invoice Number", "Organization", "Plan", "Seats", "Date", "Subtotal", "Tax", "Total Amount", "Paid Amount", "Status"],
      ...invoices.map((i) => [
        i.invoiceNumber,
        i.tenantName,
        i.planName,
        i.seats,
        new Date(i.invoiceDate).toLocaleDateString(),
        i.subtotal,
        i.taxAmount,
        i.totalAmount,
        i.paidAmount,
        i.status,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Platform invoices exported to CSV.");
  } catch {
    toast.error("Failed to export CSV.");
  }
}

export function exportSubscriptionsToCSV(subscriptions: PlatformSubscriptionItem[]) {
  try {
    const rows = [
      ["Organization", "Plan", "Billing Cycle", "Seats", "Recurring Amount", "Next Renewal", "Status"],
      ...subscriptions.map((s) => [
        s.tenantName,
        s.planName || s.planId,
        s.billingCycle,
        s.seats,
        s.recurringAmount,
        new Date(s.currentPeriodEnd).toLocaleDateString(),
        s.status,
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Platform subscriptions exported to CSV.");
  } catch {
    toast.error("Failed to export CSV.");
  }
}
