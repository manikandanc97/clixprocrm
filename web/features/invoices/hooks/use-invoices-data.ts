"use client";

import { useState, useMemo, useCallback } from "react";
import { useInvoices } from "@/shared/hooks/use-invoices";
import { useAuth } from "@/features/auth/components/auth-provider";
import { getOrgAvatarColor } from "@/shared/utils/avatar-colors";
import { toast } from "sonner";

export type InvoiceStatusFilter =
  | "ALL"
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface InvoiceSortConfig {
  key: string;
  direction: "asc" | "desc";
}

export function getInvoiceColor(name: string) {
  return getOrgAvatarColor(name || "Invoice");
}

export interface UseInvoicesDataReturn {
  // Query state
  data: ReturnType<typeof useInvoices>["data"];
  rawInvoices: any[];
  isLoading: boolean;
  isInitialLoading: boolean;
  isPending: boolean;
  refetch: () => void;

  // Search
  search: string;
  setSearch: (value: string) => void;

  // Filter
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  hasActiveFilters: boolean;
  handleClearFilters: () => void;

  // Sorting
  sortConfig: InvoiceSortConfig | null;
  setSort: (key: string, dir: "asc" | "desc" | null) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  totalPages: number;
  goToFirstPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  goToLastPage: () => void;

  // Selection
  selectedInvoiceIds: string[];
  setSelectedInvoiceIds: React.Dispatch<React.SetStateAction<string[]>>;
  isAllCurrentPageSelected: boolean;
  toggleSelectAllCurrentPage: () => void;
  toggleSelectInvoice: (invoiceId: string) => void;

  // Data sets
  filteredInvoices: any[];
  paginatedInvoices: any[];
  totalInvoices: number;

  // Actions & Helpers
  exportCSV: () => void;
  getInvoiceColor: (name: string) => ReturnType<typeof getOrgAvatarColor>;
}

/**
 * Hook to manage invoice list data derivation, filtering, sorting, pagination, selection, and CSV export.
 */
export function useInvoicesData(): UseInvoicesDataReturn {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading: loading, isPending, refetch } = useInvoices();

  const rawInvoices = useMemo(
    () => (Array.isArray(data?.invoices) ? data.invoices : []),
    [data]
  );

  const isInitialLoading =
    !data && (loading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  // Filter & search state
  const [statusFilter, setStatusFilterState] = useState("ALL");
  const [search, setSearchState] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageState] = useState(10);
  const [sortConfig, setSortConfig] = useState<InvoiceSortConfig | null>(null);

  const setSearch = useCallback((val: string) => {
    setSearchState(val);
    setCurrentPage(1);
  }, []);

  const setStatusFilter = useCallback((val: string) => {
    setStatusFilterState(val);
    setCurrentPage(1);
  }, []);

  const setSort = useCallback((key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  }, []);

  const setRowsPerPage = useCallback((v: number) => {
    setRowsPerPageState(v);
    setCurrentPage(1);
  }, []);

  // Filter and sort logic
  const filteredInvoices = useMemo(() => {
    return rawInvoices
      .filter((inv: any) => {
        const clientName =
          inv.company?.name || inv.customer?.company || inv.customer?.name || "";
        const matchSearch =
          search.trim() === "" ||
          (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) ||
          clientName.toLowerCase().includes(search.toLowerCase());

        const matchStatus =
          statusFilter === "ALL" ||
          inv.status?.toUpperCase() === statusFilter.toUpperCase() ||
          inv.paymentStatus?.toUpperCase() === statusFilter.toUpperCase();

        return matchSearch && matchStatus;
      })
      .sort((a: any, b: any) => {
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
  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredInvoices, currentPage, rowsPerPage]);

  // Pagination navigation helpers
  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToPreviousPage = useCallback(
    () => setCurrentPage((p) => Math.max(1, p - 1)),
    []
  );
  const goToNextPage = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  );
  const goToLastPage = useCallback(
    () => setCurrentPage(totalPages),
    [totalPages]
  );

  // Selection helpers
  const isAllCurrentPageSelected = useMemo(() => {
    return (
      paginatedInvoices.length > 0 &&
      paginatedInvoices.every((inv: any) => selectedInvoiceIds.includes(inv.id))
    );
  }, [paginatedInvoices, selectedInvoiceIds]);

  const toggleSelectAllCurrentPage = useCallback(() => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedInvoices.map((inv: any) => inv.id));
      setSelectedInvoiceIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      setSelectedInvoiceIds((prev) =>
        Array.from(new Set([...prev, ...paginatedInvoices.map((inv: any) => inv.id)]))
      );
    }
  }, [isAllCurrentPageSelected, paginatedInvoices]);

  const toggleSelectInvoice = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  // Filter actions
  const hasActiveFilters = statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setStatusFilterState("ALL");
    setSearchState("");
    setCurrentPage(1);
  }, []);

  // CSV Export
  const exportCSV = useCallback(() => {
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
      const clientName =
        inv.company?.name || inv.customer?.company || inv.customer?.name || "Unassigned";
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
    link.setAttribute(
      "download",
      `clixpro_invoices_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rawInvoices]);

  return {
    data,
    rawInvoices,
    isLoading: loading,
    isInitialLoading,
    isPending,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    handleClearFilters,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    isAllCurrentPageSelected,
    toggleSelectAllCurrentPage,
    toggleSelectInvoice,
    filteredInvoices,
    paginatedInvoices,
    totalInvoices: filteredInvoices.length,
    exportCSV,
    getInvoiceColor,
  };
}
