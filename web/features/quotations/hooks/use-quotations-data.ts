import { useState, useMemo, useEffect } from "react";
import { useQuotations } from "@/shared/hooks/use-crm";
import { QuotationType } from "@/shared/types/quotation";
import { toast } from "sonner";

export type QuotationSortKey = string;
export type QuotationSortDirection = "asc" | "desc";

export interface QuotationSortConfig {
  key: QuotationSortKey;
  direction: QuotationSortDirection;
}

export type QuotationStatusFilter =
  | "ALL"
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface UseQuotationsDataReturn {
  // raw
  safeQuotations: QuotationType[];
  isLoading: boolean;
  isPending: boolean;
  refetch: () => void;

  // filter/search state
  search: string;
  setSearch: (v: string) => void;
  statusFilter: QuotationStatusFilter;
  setStatusFilter: (v: QuotationStatusFilter) => void;

  // selection
  selectedQuoteIds: string[];
  setSelectedQuoteIds: React.Dispatch<React.SetStateAction<string[]>>;

  // sort state
  sortConfig: QuotationSortConfig | null;
  setSort: (key: string, dir: "asc" | "desc" | null) => void;

  // pagination state
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (v: number) => void;

  // derived
  filteredQuotations: QuotationType[];
  paginatedQuotations: QuotationType[];
  totalPages: number;
  hasActiveFilters: boolean;

  // actions
  handleClearFilters: () => void;
  exportCSV: () => void;
}

/**
 * Encapsulates all list-data logic for the quotations page:
 *   - sources useQuotations()
 *   - search (quoteId, client, leadName)
 *   - status filtering (ALL | DRAFT | SENT | ACCEPTED | REJECTED | EXPIRED)
 *   - sorting with direction cycle (asc → desc → null)
 *   - pagination (page sizes: 10, 25, 50, 100; default: 10)
 *   - page reset when search or filter changes
 *   - row selection state
 *   - CSV export
 */
export function useQuotationsData(): UseQuotationsDataReturn {
  const { data, isLoading, isPending, refetch } = useQuotations();

  const safeQuotations = useMemo<QuotationType[]>(
    () =>
      Array.isArray(data?.quotations) ? (data.quotations as QuotationType[]) : [],
    [data]
  );

  // --- filter/search ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatusFilter>("ALL");

  // --- selection ---
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  // --- sort ---
  const [sortConfig, setSortConfig] = useState<QuotationSortConfig | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  // --- pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageState] = useState(10);

  const setRowsPerPage = (v: number) => {
    setRowsPerPageState(v);
    setCurrentPage(1);
  };

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // --- derived data ---
  const filteredQuotations = useMemo(() => {
    return safeQuotations
      .filter((quote: QuotationType) => {
        const matchSearch =
          search.trim() === "" ||
          (quote.quoteId &&
            quote.quoteId.toLowerCase().includes(search.toLowerCase())) ||
          (quote.client &&
            quote.client.toLowerCase().includes(search.toLowerCase())) ||
          (quote.leadName &&
            quote.leadName.toLowerCase().includes(search.toLowerCase()));

        const matchStatus =
          statusFilter === "ALL" ||
          quote.status?.toUpperCase() === statusFilter.toUpperCase();

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        let aVal: string | number;
        let bVal: string | number;

        if (sortConfig.key === "amount") {
          aVal = a.amountValue ?? 0;
          bVal = b.amountValue ?? 0;
        } else {
          const rawA = a[sortConfig.key as keyof QuotationType];
          const rawB = b[sortConfig.key as keyof QuotationType];
          aVal = rawA ? String(rawA).toLowerCase() : "";
          bVal = rawB ? String(rawB).toLowerCase() : "";
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [safeQuotations, search, statusFilter, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQuotations.length / rowsPerPage)
  );

  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const hasActiveFilters = statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  // --- CSV export ---
  const exportCSV = () => {
    if (safeQuotations.length === 0) {
      toast.error("No quotations available to export.");
      return;
    }
    const headers = [
      "Quote ID",
      "Customer",
      "Related Deal",
      "Amount",
      "Status",
      "Valid Till",
      "Created At",
    ];
    const rows = safeQuotations.map((q: QuotationType) => [
      q.quoteId || "",
      `"${(q.client || "").replace(/"/g, '""')}"`,
      `"${(q.leadName || "").replace(/"/g, '""')}"`,
      q.amountValue ?? 0,
      q.status || "DRAFT",
      q.validTill || "",
      q.lastActivity || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row: (string | number)[]) => row.join(",")),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_quotations_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    safeQuotations,
    isLoading,
    isPending,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    selectedQuoteIds,
    setSelectedQuoteIds,
    sortConfig,
    setSort,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    filteredQuotations,
    paginatedQuotations,
    totalPages,
    hasActiveFilters,
    handleClearFilters,
    exportCSV,
  };
}
