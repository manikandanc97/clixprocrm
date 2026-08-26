"use client";

import React, { useState, useMemo } from "react";
import {
  Receipt,
  Plus,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Eye,
  CreditCard,
  Printer,
  Mail,
  Trash2,
  Send,
  Building2,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";
import { useInvoices } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageErrorState } from "@/shared/components/page-states";
import {
  CRMPageHeader,
  CRMMetricCard,
  CRMToolbar,
  CRMPageContainer,
  CRMMetricsGrid,
} from "@/shared/components/crm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { InvoicesSkeleton } from "@/features/invoices/components/InvoicesSkeleton";
import { CreateInvoiceModal } from "@/features/invoices/components/CreateInvoiceModal";
import { InvoiceDetailModal } from "@/features/invoices/components/InvoiceDetailModal";
import { RecordPaymentModal } from "@/features/invoices/components/RecordPaymentModal";
import { motion, AnimatePresence } from "framer-motion";

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { formatCurrency } = useCurrency();

  const { data, isLoading: loading, error, refetch } = useInvoices({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const invoices = data?.invoices || [];
  const stats = data?.stats || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalCount: 0,
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> PAID
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> PARTIALLY PAID
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> OVERDUE
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Send className="w-3 h-3" /> SENT
          </span>
        );
      case "CANCELLED":
      case "VOID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-500 border border-slate-500/20">
            VOID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
            DRAFT
          </span>
        );
    }
  };

  const handleOpenDetail = (id: string) => {
    setSelectedInvoiceId(id);
    setIsDetailModalOpen(true);
  };

  const handleOpenPayment = (inv: any) => {
    setPaymentTargetInvoice(inv);
    setIsPaymentModalOpen(true);
  };

  const handlePrintPdf = (id: string) => {
    window.open(`/api/crm/invoices/${id}/pdf`, "_blank");
  };

  if (loading && invoices.length === 0) {
    return <InvoicesSkeleton />;
  }

  if (error && invoices.length === 0) {
    return (
      <PageErrorState
        title="Invoices unavailable"
        message={(error as Error).message || "An error occurred fetching invoices."}
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  return (
    <CRMPageContainer>
      <CRMPageHeader
        title="Invoices"
        subtitle="Manage customer invoices, track payments, and calculate GST tax breakdowns."
        icon={Receipt}
        badge="Billing & Revenue"
        actions={[
          {
            label: "Create Invoice",
            icon: Plus,
            onClick: () => setIsCreateModalOpen(true),
            variant: "default",
          },
        ]}
      />

      {/* Metrics Row */}
      <div className="shrink-0">
        <CRMMetricsGrid cols={4} className="gap-4">
          <CRMMetricCard
            title="Total Invoiced"
            value={formatCurrency(stats.totalInvoiced)}
            change={`${stats.totalCount} invoices`}
            trend="up"
            icon={IndianRupee}
            color="indigo"
            delay={0.1}
          />
          <CRMMetricCard
            title="Collected Revenue"
            value={formatCurrency(stats.totalPaid)}
            change={`${stats.paidCount} paid`}
            trend="up"
            icon={CheckCircle2}
            color="emerald"
            delay={0.2}
          />
          <CRMMetricCard
            title="Pending Payment"
            value={formatCurrency(stats.totalPending)}
            change={`${stats.pendingCount} pending`}
            trend="neutral"
            icon={Clock}
            color="orange"
            delay={0.3}
          />
          <CRMMetricCard
            title="Overdue"
            value={formatCurrency(stats.totalOverdue)}
            change={`${stats.overdueCount} overdue`}
            trend={stats.overdueCount > 0 ? "down" : "neutral"}
            icon={AlertCircle}
            color="pink"
            delay={0.4}
          />
        </CRMMetricsGrid>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <CRMToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search invoices by number, client, company..."
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All" },
              { id: "draft", label: "Draft" },
              { id: "sent", label: "Sent" },
              { id: "partially_paid", label: "Partially Paid" },
              { id: "paid", label: "Paid" },
              { id: "overdue", label: "Overdue" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(tab.id)}
                className="h-8 px-3 text-xs font-semibold"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CRMToolbar>

        {/* Invoice Records Table */}
        <div className="flex-1 min-h-0 flex flex-col" data-testid="invoices-list">
          {invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices found"
              description="No customer invoices match the selected filter or search."
              action={{
                label: "Create Invoice",
                onClick: () => setIsCreateModalOpen(true),
                icon: Plus,
              }}
            />
          ) : (
            <div className="bg-card border border-border/80 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-4 text-left">Invoice #</th>
                      <th className="py-3 px-4 text-left">Customer / Company</th>
                      <th className="py-3 px-3 text-left">Invoice Date</th>
                      <th className="py-3 px-3 text-left">Due Date</th>
                      <th className="py-3 px-3 text-right">Total Amount</th>
                      <th className="py-3 px-3 text-right">Paid</th>
                      <th className="py-3 px-3 text-right">Balance</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 w-[60px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoices.map((inv: any) => (
                      <tr
                        key={inv.id}
                        onClick={() => handleOpenDetail(inv.id)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">
                            {inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned"}
                          </div>
                          {inv.customer?.name && inv.company?.name && (
                            <div className="text-[11px] text-muted-foreground">{inv.customer.name}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "On Receipt"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {inv.paidAmount > 0 ? formatCurrency(inv.paidAmount, inv.currency) : "-"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                          {formatCurrency(inv.balanceAmount, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                              >
                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuItem
                                onClick={() => handleOpenDetail(inv.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePrintPdf(inv.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5 text-muted-foreground" /> Print / PDF
                              </DropdownMenuItem>
                              {inv.balanceAmount > 0 && inv.status !== "CANCELLED" && (
                                <DropdownMenuItem
                                  onClick={() => handleOpenPayment(inv)}
                                  className="gap-2 cursor-pointer text-emerald-600 font-semibold"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Record Payment
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />

      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInvoiceId(null);
          refetch();
        }}
      />

      {paymentTargetInvoice && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentTargetInvoice(null);
            refetch();
          }}
          invoice={paymentTargetInvoice}
        />
      )}
    </CRMPageContainer>
  );
}
