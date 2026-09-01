"use client";

import { useState, useMemo, useEffect } from "react";
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
  CRMDataTable,
  CRMTableHeader,
  CRMTableBody,
  CRMTableRow,
  CRMTableCell,
  CRMTableHeaderCell,
  CRMPagination,
  TruncatedText,
  CRMActionMenu,
} from "@/shared/components/crm";
import { StatusBadge, StatusVariant } from "@/shared/components/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
      if (sortConfig.key === "total" || sortConfig.key === "totalAmount") {
        return ((a.totalAmount || a.total || 0) - (b.totalAmount || b.total || 0)) * dir;
      }
      if (sortConfig.key === "paidAmount") {
        return ((a.paidAmount || 0) - (b.paidAmount || 0)) * dir;
      }
      if (sortConfig.key === "balance" || sortConfig.key === "balanceAmount") {
        return ((a.balanceAmount || a.balance || 0) - (b.balanceAmount || b.balance || 0)) * dir;
      }
      if (sortConfig.key === "status") {
        return (a.status || "").localeCompare(b.status || "") * dir;
      }
      return 0;
    });
  }, [invoices, sortConfig]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(sortedInvoices.length / rowsPerPage) || 1;
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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

  const getInvoiceStatusVariant = (st?: string): StatusVariant => {
    switch (st?.toUpperCase()) {
      case "PAID":
        return "success";
      case "PARTIALLY_PAID":
        return "warning";
      case "OVERDUE":
        return "danger";
      case "SENT":
        return "info";
      case "CANCELLED":
      case "VOID":
      case "DRAFT":
      default:
        return "neutral";
    }
  };

  const getInvoiceStatusLabel = (st?: string): string => {
    switch (st?.toUpperCase()) {
      case "PARTIALLY_PAID":
        return "Partially Paid";
      case "PAID":
        return "Paid";
      case "OVERDUE":
        return "Overdue";
      case "SENT":
        return "Sent";
      case "VOID":
      case "CANCELLED":
        return "Void";
      case "DRAFT":
      default:
        return "Draft";
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
                {sortedInvoices.length > 0 ? (
                  <motion.div
                    key="invoices-table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col min-h-0 gap-3.5 sm:gap-4"
                  >
                    <div className="crm-table-wrap">
                      <CRMDataTable hasPagination={sortedInvoices.length > rowsPerPage} className="w-full">
                        <CRMTableHeader className="sticky top-0 z-20 bg-card border-b border-border/60">
                          <CRMTableRow className="h-10 sm:h-11">
                            <CRMTableHeaderCell>
                              <DataTableColumnHeader
                                title="Invoice #"
                                sortable
                                sortDirection={sortConfig.key === "invoiceNumber" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("invoiceNumber", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell>
                              <DataTableColumnHeader
                                title="Customer / Company"
                                sortable
                                sortDirection={sortConfig.key === "client" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("client", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell className="hidden md:table-cell">
                              <DataTableColumnHeader
                                title="Invoice Date"
                                sortable
                                sortDirection={sortConfig.key === "invoiceDate" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("invoiceDate", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell className="hidden md:table-cell">
                              <DataTableColumnHeader
                                title="Due Date"
                                sortable
                                sortDirection={sortConfig.key === "dueDate" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("dueDate", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell className="text-right">
                              <DataTableColumnHeader
                                title="Total Amount"
                                align="right"
                                sortable
                                sortDirection={sortConfig.key === "totalAmount" || sortConfig.key === "total" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("totalAmount", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell className="text-right hidden sm:table-cell">
                              <DataTableColumnHeader
                                title="Paid"
                                align="right"
                                sortable
                                sortDirection={sortConfig.key === "paidAmount" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("paidAmount", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell className="text-right hidden sm:table-cell">
                              <DataTableColumnHeader
                                title="Balance"
                                align="right"
                                sortable
                                sortDirection={sortConfig.key === "balanceAmount" || sortConfig.key === "balance" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("balanceAmount", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell className="text-center">
                              <DataTableColumnHeader
                                title="Status"
                                align="center"
                                sortable
                                sortDirection={sortConfig.key === "status" ? sortConfig.direction : null}
                                onSort={(dir) => handleSort("status", dir)}
                              />
                            </CRMTableHeaderCell>
                            <CRMTableHeaderCell className="text-center w-[60px]">
                              <span className="sr-only">Actions</span>
                            </CRMTableHeaderCell>
                          </CRMTableRow>
                        </CRMTableHeader>
                        <CRMTableBody>
                          {paginatedInvoices.map((inv: any) => (
                            <CRMTableRow
                              key={inv.id}
                              onClick={() => handleOpenDetail(inv.id)}
                              className="h-16 hover:bg-muted/[0.03] transition-colors cursor-pointer group"
                            >
                              <CRMTableCell className="font-mono font-bold text-foreground">
                                {inv.invoiceNumber}
                              </CRMTableCell>
                              <CRMTableCell className="max-w-[220px]">
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
                              </CRMTableCell>
                              <CRMTableCell className="text-muted-foreground hidden md:table-cell">
                                {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </CRMTableCell>
                              <CRMTableCell className="text-muted-foreground hidden md:table-cell">
                                {inv.dueDate
                                  ? new Date(inv.dueDate).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "On Receipt"}
                              </CRMTableCell>
                              <CRMTableCell className="text-right font-mono font-bold text-foreground">
                                {formatCurrency(inv.totalAmount, inv.currency)}
                              </CRMTableCell>
                              <CRMTableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:table-cell">
                                {inv.paidAmount > 0 ? formatCurrency(inv.paidAmount, inv.currency) : "-"}
                              </CRMTableCell>
                              <CRMTableCell className="text-right font-mono font-bold text-foreground hidden sm:table-cell">
                                {formatCurrency(inv.balanceAmount, inv.currency)}
                              </CRMTableCell>
                              <CRMTableCell className="text-center">
                                <StatusBadge
                                  status={getInvoiceStatusLabel(inv.status)}
                                  variant={getInvoiceStatusVariant(inv.status)}
                                  showDot
                                />
                              </CRMTableCell>
                              <CRMTableCell className="text-center">
                                <CRMActionMenu
                                  items={[
                                    {
                                      label: "View Details",
                                      icon: Eye,
                                      variant: "primary" as const,
                                      onClick: () => handleOpenDetail(inv.id),
                                    },
                                    {
                                      label: "Print / PDF",
                                      icon: Printer,
                                      onClick: () => handlePrintPdf(inv.id),
                                    },
                                    ...(inv.balanceAmount > 0 && inv.status !== "CANCELLED"
                                      ? [
                                          {
                                            label: "Record Payment",
                                            icon: CreditCard,
                                            className: "text-emerald-600 dark:text-emerald-400 font-semibold",
                                            separatorBefore: true,
                                            onClick: () => handleOpenPayment(inv),
                                          },
                                        ]
                                      : []),
                                  ]}
                                />
                              </CRMTableCell>
                            </CRMTableRow>
                          ))}
                        </CRMTableBody>
                      </CRMDataTable>
                    </div>

                    <CRMPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={sortedInvoices.length}
                      rowsPerPage={rowsPerPage}
                      onPageChange={setCurrentPage}
                      onRowsPerPageChange={(size) => {
                        setRowsPerPage(size);
                        setCurrentPage(1);
                      }}
                      itemName="Invoices"
                      pageSizeOptions={[10, 25, 50, 100]}
                    />
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
