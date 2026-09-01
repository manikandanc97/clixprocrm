"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Settings,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useInvoices } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { Button } from "@/shared/ui/button";
import { DataTableColumnHeader, SortDirection } from "@/shared/components/DataTableColumnHeader";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageErrorState } from "@/shared/components/page-states";
import { InvoiceContextualSettings } from "@/features/invoices/components/InvoiceContextualSettings";
import {
  CRMPageHeader,
  CRMMetricCard,
  CRMToolbar,
  CRMPageContainer,
  CRMMetricsGrid,
  TruncatedText,
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
import { useAuth } from "@/features/auth/components/auth-provider";

export default function InvoicesPage() {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: "",
    direction: null,
  });

  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  const { formatCurrency } = useCurrency();

  const { data, isLoading: loading, isPending, error, refetch } = useInvoices({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const invoices = data?.invoices || [];

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a: any, b: any) => {
      if (!sortConfig.direction) return 0;
      const dir = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.key === "invoiceNumber") {
        return (a.invoiceNumber || "").localeCompare(b.invoiceNumber || "") * dir;
      }
      if (sortConfig.key === "client") {
        const nameA = a.company?.name || a.customer?.company || a.customer?.name || "";
        const nameB = b.company?.name || b.customer?.company || b.customer?.name || "";
        return nameA.localeCompare(nameB) * dir;
      }
      if (sortConfig.key === "invoiceDate") {
        const dateA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
        const dateB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
        return (dateA - dateB) * dir;
      }
      if (sortConfig.key === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return (dateA - dateB) * dir;
      }
      if (sortConfig.key === "total") {
        return ((a.total || 0) - (b.total || 0)) * dir;
      }
      if (sortConfig.key === "balance") {
        return ((a.balance || 0) - (b.balance || 0)) * dir;
      }
      if (sortConfig.key === "status") {
        return (a.status || "").localeCompare(b.status || "") * dir;
      }
      return 0;
    });
  }, [invoices, sortConfig]);

  const stats = useMemo(() => {
    return (
      data?.stats || {
        totalInvoiced: invoices.reduce((acc: number, inv: any) => acc + (inv.totalAmount || inv.total || 0), 0),
        totalPaid: invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0),
        totalPending: invoices.reduce((acc: number, inv: any) => acc + (inv.balanceAmount || inv.balance || 0), 0),
        totalOverdue: invoices.filter((inv: any) => inv.isOverdue || inv.status === "OVERDUE").reduce((acc: number, inv: any) => acc + (inv.balanceAmount || inv.balance || 0), 0),
        paidCount: invoices.filter((inv: any) => inv.paymentStatus === "PAID" || inv.status === "PAID").length,
        pendingCount: invoices.filter((inv: any) => inv.status === "SENT" || inv.paymentStatus === "PARTIALLY_PAID" || inv.paymentStatus === "UNPAID").length,
        overdueCount: invoices.filter((inv: any) => inv.isOverdue || inv.status === "OVERDUE").length,
        totalCount: invoices.length,
      }
    );
  }, [data?.stats, invoices]);

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

  const isInitialLoading = !data && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  if (isInitialLoading && invoices.length === 0) {
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
    <CRMPageContainer twoStageScroll>
      <CRMPageHeader
        title="Invoices"
        subtitle="Manage customer invoices, track payments, and calculate GST tax breakdowns."
        icon={Receipt}
        badge="Billing & Revenue"
        actions={[
          {
            label: "Customize",
            icon: Settings,
            onClick: () => setIsCustomizeOpen(true),
            variant: "outline",
          },
          {
            label: "Create Invoice",
            icon: Plus,
            onClick: () => setIsCreateModalOpen(true),
            variant: "default",
          },
        ]}
      />

      {/* Empty State or Main Content */}
      {stats.totalCount === 0 || (invoices.length === 0 && !searchQuery && statusFilter === "all") ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <EmptyState
            module="invoices"
            action={{
              label: "Create Invoice",
              onClick: () => setIsCreateModalOpen(true),
              icon: Plus,
            }}
          />
        </div>
      ) : (
        <>
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

          {/* Two-Stage Scroll Workspace */}
          <div className="crm-table-workspace-sticky">
            <CRMToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder="Search invoices by number, client, company..."
              sticky={false}
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
              <AnimatePresence mode="wait">
                {invoices.length > 0 ? (
                  <motion.div
                    key="invoices-table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <div className="crm-table-wrap crm-table-no-pagination">
                      <div className="overflow-auto flex-1 min-h-0">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 z-20 bg-card border-b border-border/80 text-muted-foreground font-semibold">
                            <tr>
                              <th className="py-3 px-4 text-left">
                                <DataTableColumnHeader
                                  title="Invoice #"
                                  sortable
                                  sortDirection={sortConfig.key === "invoiceNumber" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("invoiceNumber", dir)}
                                />
                              </th>
                              <th className="py-3 px-4 text-left">
                                <DataTableColumnHeader
                                  title="Customer / Company"
                                  sortable
                                  sortDirection={sortConfig.key === "client" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("client", dir)}
                                />
                              </th>
                              <th className="py-3 px-3 text-left">
                                <DataTableColumnHeader
                                  title="Invoice Date"
                                  sortable
                                  sortDirection={sortConfig.key === "invoiceDate" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("invoiceDate", dir)}
                                />
                              </th>
                              <th className="py-3 px-3 text-left">
                                <DataTableColumnHeader
                                  title="Due Date"
                                  sortable
                                  sortDirection={sortConfig.key === "dueDate" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("dueDate", dir)}
                                />
                              </th>
                              <th className="py-3 px-3 text-right">
                                <DataTableColumnHeader
                                  title="Total Amount"
                                  align="right"
                                  sortable
                                  sortDirection={sortConfig.key === "totalAmount" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("totalAmount", dir)}
                                />
                              </th>
                              <th className="py-3 px-3 text-right">
                                <DataTableColumnHeader
                                  title="Paid"
                                  align="right"
                                  sortable
                                  sortDirection={sortConfig.key === "paidAmount" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("paidAmount", dir)}
                                />
                              </th>
                              <th className="py-3 px-3 text-right">
                                <DataTableColumnHeader
                                  title="Balance"
                                  align="right"
                                  sortable
                                  sortDirection={sortConfig.key === "balanceAmount" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("balanceAmount", dir)}
                                />
                              </th>
                              <th className="py-3 px-3 text-center">
                                <DataTableColumnHeader
                                  title="Status"
                                  align="center"
                                  sortable
                                  sortDirection={sortConfig.key === "status" ? sortConfig.direction : null}
                                  onSort={(dir) => handleSort("status", dir)}
                                />
                              </th>
                              <th className="py-3 px-3 w-[60px]"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {sortedInvoices.map((inv: any) => (
                              <tr
                                key={inv.id}
                                onClick={() => handleOpenDetail(inv.id)}
                                className="hover:bg-muted/30 transition-colors cursor-pointer group"
                              >
                                <td className="py-3 px-4 font-mono font-bold text-foreground">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="py-3 px-4 max-w-[220px]">
                                  <TruncatedText
                                    text={inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned"}
                                    lines={1}
                                    className="font-semibold text-foreground"
                                  />
                                  {inv.customer?.name && inv.company?.name && (
                                    <TruncatedText
                                      text={inv.customer.name}
                                      lines={1}
                                      className="text-[11px] text-muted-foreground"
                                    />
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
                  </motion.div>
                ) : (
                  <EmptyState
                    icon={Receipt}
                    title="No invoices found"
                    description="No customer invoices match the selected filter or search."
                    action={{
                      label: "Clear Filters",
                      onClick: () => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      },
                      variant: "outline",
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

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

      <InvoiceContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "numbering"}
      />
    </CRMPageContainer>
  );
}
