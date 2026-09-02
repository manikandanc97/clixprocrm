"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  X,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Settings,
  Eye,
  CreditCard,
  Printer,
  Calendar,
  Building2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AppIcon } from "@/shared/components/icons/icon-registry";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { CRMPageContainer } from "@/shared/components/crm";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/lib/utils";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { useInvoices, useDeleteInvoice } from "@/shared/hooks/use-invoices";
import { useCurrency } from "@/shared/hooks/use-currency";
import { CreateInvoiceModal } from "@/features/invoices/components/CreateInvoiceModal";
import { InvoiceDetailModal } from "@/features/invoices/components/InvoiceDetailModal";
import { RecordPaymentModal } from "@/features/invoices/components/RecordPaymentModal";
import { InvoiceContextualSettings } from "@/features/invoices/components/InvoiceContextualSettings";
import { useAuth } from "@/features/auth/components/auth-provider";

export default function InvoicesPage() {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const searchParams = useSearchParams();
  const { formatCurrency } = useCurrency();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  const { data, isLoading: loading, isPending, refetch } = useInvoices();
  const rawInvoices = useMemo(
    () => (Array.isArray(data?.invoices) ? data.invoices : []),
    [data]
  );

  const { mutateAsync: deleteInvoiceMutate } = useDeleteInvoice();

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();

  // Delete modal state
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Sync customize query param & new param
  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      const timer = setTimeout(() => {
        setIsCreateModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const getInvoiceColor = (name: string) => {
    return getOrgAvatarColor(name || "Invoice");
  };

  const hasActiveFilters = statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
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

  const handleDeleteSingle = async () => {
    if (!invoiceToDelete) return;
    try {
      setDeleting(true);
      await deleteInvoiceMutate(invoiceToDelete.id);
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceToDelete.id));
      setInvoiceToDelete(null);
      refetch();
    } catch {
      // Handled by mutation toast
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      setBulkDeleting(true);
      for (const id of selectedInvoiceIds) {
        await deleteInvoiceMutate(id);
      }
      setSelectedInvoiceIds([]);
      setBulkDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error("An error occurred during bulk deletion");
    } finally {
      setBulkDeleting(false);
    }
  };

  const exportCSV = () => {
    if (rawInvoices.length === 0) {
      toast.error("No invoices available to export.");
      return;
    }
    const headers = [
      "Invoice Number",
      "Customer/Company",
      "Invoice Date",
      "Due Date",
      "Total Amount",
      "Paid Amount",
      "Balance",
      "Status",
    ];
    const rows = rawInvoices.map((inv: any) => {
      const clientName = inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned";
      return [
        inv.invoiceNumber || "",
        `"${clientName.replace(/"/g, '""')}"`,
        inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().slice(0, 10) : "",
        inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : "",
        inv.totalAmount || inv.total || 0,
        inv.paidAmount || 0,
        inv.balanceAmount || inv.balance || 0,
        inv.status || "DRAFT",
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row: (string | number)[]) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort logic
  const filteredInvoices = useMemo(() => {
    return rawInvoices.filter((inv: any) => {
      const clientName = inv.company?.name || inv.customer?.company || inv.customer?.name || "";
      const matchSearch =
        search.trim() === "" ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
        clientName.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        inv.status?.toUpperCase() === statusFilter.toUpperCase() ||
        inv.paymentStatus?.toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchStatus;
    }).sort((a: any, b: any) => {
      if (!sortConfig) return 0;
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
      if (sortConfig.key === "totalAmount") {
        return ((a.totalAmount || a.total || 0) - (b.totalAmount || b.total || 0)) * dir;
      }
      if (sortConfig.key === "paidAmount") {
        return ((a.paidAmount || 0) - (b.paidAmount || 0)) * dir;
      }
      if (sortConfig.key === "balanceAmount") {
        return ((a.balanceAmount || a.balance || 0) - (b.balanceAmount || b.balance || 0)) * dir;
      }
      if (sortConfig.key === "status") {
        return (a.status || "").localeCompare(b.status || "") * dir;
      }
      return 0;
    });
  }, [rawInvoices, search, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage));
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isInitialLoading =
    !data && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  return (
    <CRMPageContainer twoStageScroll>
      {/* 1. Header Layout */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div
            data-animate-target="true"
            className="group h-10 w-10 rounded-xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs shrink-0 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer select-none"
          >
            <AppIcon
              name="invoices"
              icon={Receipt}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Invoices
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage billing, tax breakdowns, track payments, and download PDF receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCustomizeOpen(true)}
            className="group font-semibold text-xs h-9 px-3 rounded-lg shadow-xs gap-1.5 cursor-pointer border-border/70 bg-background hover:bg-muted/50 text-foreground"
          >
            <AppIcon
              name="settings"
              icon={Settings}
              size={14}
              className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
            />
            <span>Customize</span>
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="plus"
              icon={Plus}
              size={14}
              className="w-3.5 h-3.5 text-white shrink-0"
            />
            <span>Create Invoice</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Card Container */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Top Controls Toolbar */}
        <div className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/50 shrink-0">
          {/* Left: Filter Selects & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <AppIcon
                  name="search"
                  icon={Search}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors"
                />
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices by number, client..."
                className="h-9 pl-8 pr-8 rounded-lg bg-background border-border/70 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-end lg:self-auto flex-wrap">
            {/* Multi-Select Delete Button */}
            {selectedInvoiceIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon
                  name="trash"
                  icon={Trash2}
                  size={14}
                  className="w-3.5 h-3.5 text-rose-500 shrink-0"
                />
                <span>Delete ({selectedInvoiceIds.length})</span>
              </button>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <AppIcon
                  name="reset"
                  icon={RotateCcw}
                  size={14}
                  className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                />
                <span>Reset Filters</span>
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={exportCSV}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-background hover:bg-muted/50 text-foreground text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <AppIcon
                name="export"
                icon={Download}
                size={14}
                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
              />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-auto flex-1 min-h-0 relative flex flex-col kanban-board-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
                  <input
                    type="checkbox"
                    checked={
                      paginatedInvoices.length > 0 &&
                      paginatedInvoices.every((inv: any) => selectedInvoiceIds.includes(inv.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoiceIds(
                          Array.from(new Set([...selectedInvoiceIds, ...paginatedInvoices.map((inv: any) => inv.id)]))
                        );
                      } else {
                        const pageIds = new Set(paginatedInvoices.map((inv: any) => inv.id));
                        setSelectedInvoiceIds(selectedInvoiceIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "invoiceNumber",
                      sortConfig?.key === "invoiceNumber" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Invoice #</span>
                    {sortConfig?.key === "invoiceNumber" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "client",
                      sortConfig?.key === "client" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer / Company</span>
                    {sortConfig?.key === "client" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "dueDate",
                      sortConfig?.key === "dueDate" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    {sortConfig?.key === "dueDate" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "totalAmount",
                      sortConfig?.key === "totalAmount" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total Amount</span>
                    {sortConfig?.key === "totalAmount" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "paidAmount",
                      sortConfig?.key === "paidAmount" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Paid</span>
                    {sortConfig?.key === "paidAmount" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "balanceAmount",
                      sortConfig?.key === "balanceAmount" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Balance</span>
                    {sortConfig?.key === "balanceAmount" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "status",
                      sortConfig?.key === "status" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortConfig?.key === "status" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="w-16 px-4 py-3.5 text-right bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-16">
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 w-4 bg-muted rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="h-3.5 w-28 bg-muted rounded" />
                          <div className="h-2.5 w-20 bg-muted/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-20 bg-muted rounded-md" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-6 w-6 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv: any) => {
                  const clientName =
                    inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned";
                  const color = getInvoiceColor(clientName || inv.invoiceNumber);
                  const isSelected = selectedInvoiceIds.includes(inv.id);

                  return (
                    <tr
                      key={inv.id}
                      className={cn(
                        "group h-16 hover:bg-muted/30 transition-colors",
                        isSelected && "bg-primary/[0.03]"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedInvoiceIds((prev) =>
                              prev.includes(inv.id)
                                ? prev.filter((id) => id !== inv.id)
                                : [...prev, inv.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Invoice # & Icon */}
                      <td className="px-4 py-3.5 font-medium overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs border shrink-0",
                              color.bg,
                              color.text,
                              color.border
                            )}
                          >
                            <Receipt className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => handleOpenDetail(inv.id)}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate font-mono"
                            >
                              {inv.invoiceNumber}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {inv.invoiceDate
                                ? new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "No date"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer / Company */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                            {clientName ? clientName.charAt(0) : "C"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {clientName}
                            </p>
                            {inv.customer?.name && inv.company?.name && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {inv.customer.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <span>
                            {inv.dueDate
                              ? new Date(inv.dueDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "On Receipt"}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-foreground text-xs font-mono">
                          {formatCurrency(inv.totalAmount || inv.total || 0, inv.currency)}
                        </span>
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs font-mono">
                          {inv.paidAmount > 0
                            ? formatCurrency(inv.paidAmount, inv.currency)
                            : "—"}
                        </span>
                      </td>

                      {/* Balance Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-foreground text-xs font-mono">
                          {formatCurrency(inv.balanceAmount || inv.balance || 0, inv.currency)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                            (inv.status === "PAID" || inv.paymentStatus === "PAID") &&
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
                            inv.paymentStatus === "PARTIALLY_PAID" &&
                              "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
                            (inv.status === "OVERDUE" || inv.isOverdue) &&
                              "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
                            inv.status === "SENT" &&
                              "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
                            inv.status === "DRAFT" &&
                              "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
                            inv.status === "CANCELLED" &&
                              "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          {inv.status || "DRAFT"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-xl p-1.5 shadow-lg border-border bg-popover text-popover-foreground"
                          >
                            <DropdownMenuItem
                              onClick={() => handleOpenDetail(inv.id)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="eye"
                                icon={Eye}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>View Details</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handlePrintPdf(inv.id)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="printer"
                                icon={Printer}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Print / PDF</span>
                            </DropdownMenuItem>

                            {(inv.balanceAmount > 0 || inv.balance > 0) && inv.status !== "CANCELLED" && (
                              <DropdownMenuItem
                                onClick={() => handleOpenPayment(inv)}
                                className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-emerald-600 hover:bg-emerald-500/10 focus:bg-emerald-500/10"
                              >
                                <AppIcon
                                  name="creditCard"
                                  icon={CreditCard}
                                  size={14}
                                  className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                                />
                                <span>Record Payment</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="my-1" />

                            <DropdownMenuItem
                              onClick={() => setInvoiceToDelete(inv)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon
                                name="trash"
                                icon={Trash2}
                                size={14}
                                className="w-3.5 h-3.5 text-destructive shrink-0"
                              />
                              <span>Delete Invoice</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={Receipt}
                        title="No invoices found"
                        description="No customer invoices match your current search or filter criteria."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
                        action={
                          hasActiveFilters
                            ? {
                                label: "Clear Filters",
                                onClick: handleClearFilters,
                                icon: RotateCcw,
                              }
                            : {
                                label: "Create Invoice",
                                onClick: () => setIsCreateModalOpen(true),
                                icon: Plus,
                              }
                        }
                      />
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 text-xs font-medium text-muted-foreground bg-card shrink-0 mt-auto">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filteredInvoices.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredInvoices.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredInvoices.length}</span> Invoices
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 rounded-lg bg-background border border-border/70 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg shadow-xs cursor-pointer disabled:opacity-40"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
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

      {/* Single Delete Dialog */}
      <AlertDialog open={Boolean(invoiceToDelete)} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Invoice?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete invoice{" "}
              <strong className="text-foreground">{invoiceToDelete?.invoiceNumber}</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              disabled={deleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {deleting ? "Deleting..." : "Delete Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete {selectedInvoiceIds.length} Selected Invoices?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all selected invoices. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold border-border hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="text-xs h-9 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {bulkDeleting ? "Deleting..." : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "numbering"}
      />
    </CRMPageContainer>
  );
}
