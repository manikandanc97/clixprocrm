"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
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
  Edit,
  Check,
  Send,
  Copy,
  Calendar,
  DollarSign,
  Building2,
} from "lucide-react";
import dynamic from "next/dynamic";
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
import {
  useQuotations,
  useDeleteQuotation,
  useUpdateQuotationStatus,
  useCreateQuotation,
} from "@/shared/hooks/use-crm";
import { useCurrency } from "@/shared/hooks/use-currency";
import { FormModal } from "@/shared/components/form-modal";
import { QuoteFormSkeleton } from "@/shared/components/skeletons";
import { QuotationContextualSettings } from "@/features/quotations/components/QuotationContextualSettings";
import { QuotationType } from "@/shared/types/quotation";
import { useAuth } from "@/features/auth/components/auth-provider";

const QuoteForm = dynamic(
  () => import("@/features/forms/QuoteForm").then((mod) => ({ default: mod.QuoteForm })),
  {
    loading: () => <QuoteFormSkeleton />,
  }
);

const QuotationPreview = dynamic(
  () => import("@/features/quotations/components/QuotationPreview"),
  { ssr: false }
);

export default function QuotationsPage() {
  const searchParams = useSearchParams();
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { formatCurrency } = useCurrency();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const setSort = (key: string, dir: "asc" | "desc" | null) => {
    setSortConfig(dir === null ? null : { key, direction: dir });
  };

  const { data, isLoading: loading, isPending, refetch } = useQuotations();
  const safeQuotations = useMemo(
    () => (Array.isArray(data?.quotations) ? (data.quotations as QuotationType[]) : []),
    [data]
  );

  const { mutateAsync: deleteQuotationMutate } = useDeleteQuotation();
  const { mutate: updateStatusMutate } = useUpdateQuotationStatus();
  const { mutate: createQuotationMutate } = useCreateQuotation();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuotationType | null>(null);
  const [quoteToEdit, setQuoteToEdit] = useState<QuotationType | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>();

  // Delete modal state
  const [quoteToDelete, setQuoteToDelete] = useState<QuotationType | null>(null);
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
    const editId = searchParams.get("edit");
    if (editId && safeQuotations.length > 0) {
      const q = safeQuotations.find((item) => item.id === editId || item.quoteId === editId);
      if (q) {
        setQuoteToEdit(q);
        setIsAddModalOpen(true);
      }
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("edit");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams, safeQuotations]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      const timer = setTimeout(() => {
        setQuoteToEdit(null);
        setIsAddModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const getQuoteColor = (name: string) => {
    return getOrgAvatarColor(name || "Quotation");
  };

  const hasActiveFilters = statusFilter !== "ALL" || search.trim().length > 0;

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setSearch("");
    setCurrentPage(1);
  };

  const handleDuplicate = (quote: QuotationType) => {
    const duplicateData = {
      ...quote,
      quoteId: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "DRAFT" as const,
    };
    createQuotationMutate(duplicateData);
  };

  const handleDeleteSingle = async () => {
    if (!quoteToDelete) return;
    try {
      setDeleting(true);
      await deleteQuotationMutate(quoteToDelete.id);
      setSelectedQuoteIds((prev) => prev.filter((id) => id !== quoteToDelete.id));
      setQuoteToDelete(null);
      refetch();
    } catch {
      // Error handled by mutation toast
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuoteIds.length === 0) return;
    try {
      setBulkDeleting(true);
      for (const id of selectedQuoteIds) {
        await deleteQuotationMutate(id);
      }
      setSelectedQuoteIds([]);
      setBulkDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error("An error occurred during bulk deletion");
    } finally {
      setBulkDeleting(false);
    }
  };

  const exportCSV = () => {
    if (safeQuotations.length === 0) {
      toast.error("No quotations available to export.");
      return;
    }
    const headers = ["Quote ID", "Customer", "Related Deal", "Amount", "Status", "Valid Till", "Created At"];
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
      [headers.join(","), ...rows.map((row: (string | number)[]) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clixpro_quotations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort logic
  const filteredQuotations = useMemo(() => {
    return safeQuotations.filter((quote: QuotationType) => {
      const matchSearch =
        search.trim() === "" ||
        (quote.quoteId && quote.quoteId.toLowerCase().includes(search.toLowerCase())) ||
        (quote.client && quote.client.toLowerCase().includes(search.toLowerCase())) ||
        (quote.leadName && quote.leadName.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "ALL" || quote.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchStatus;
    }).sort((a, b) => {
      if (!sortConfig) return 0;
      let aVal: any = a[sortConfig.key as keyof QuotationType];
      let bVal: any = b[sortConfig.key as keyof QuotationType];

      if (sortConfig.key === "amount") {
        aVal = a.amountValue ?? 0;
        bVal = b.amountValue ?? 0;
      } else {
        aVal = aVal ? String(aVal).toLowerCase() : "";
        bVal = bVal ? String(bVal).toLowerCase() : "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [safeQuotations, search, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / rowsPerPage));
  const paginatedQuotations = filteredQuotations.slice(
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
              name="quotations"
              icon={FileText}
              size={18}
              className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Quotations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate and manage sales quotes with real-time tracking and conversion status.
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
            onClick={() => {
              setQuoteToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 cursor-pointer transition-colors"
          >
            <AppIcon
              name="plus"
              icon={Plus}
              size={14}
              className="w-3.5 h-3.5 text-white shrink-0"
            />
            <span>Create Quote</span>
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
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
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
                placeholder="Search quotes, clients..."
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
            {selectedQuoteIds.length > 0 && (
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
                <span>Delete ({selectedQuoteIds.length})</span>
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
          <table className="w-full text-left text-xs border-collapse min-w-[1000px] table-fixed">
            <colgroup>
              <col style={{ width: "48px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "240px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
              <tr className="text-xs font-bold text-foreground">
                <th className="w-12 px-4 py-3.5 text-center bg-emerald-50/80 dark:bg-emerald-950/40 border-r border-emerald-500/15">
                  <input
                    type="checkbox"
                    checked={
                      paginatedQuotations.length > 0 &&
                      paginatedQuotations.every((q) => selectedQuoteIds.includes(q.id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuoteIds(
                          Array.from(new Set([...selectedQuoteIds, ...paginatedQuotations.map((q) => q.id)]))
                        );
                      } else {
                        const pageIds = new Set(paginatedQuotations.map((q) => q.id));
                        setSelectedQuoteIds(selectedQuoteIds.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "quoteId",
                      sortConfig?.key === "quoteId" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Quote #</span>
                    {sortConfig?.key === "quoteId" && (
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
                    <span>Customer</span>
                    {sortConfig?.key === "client" && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40">
                  <span>Related Deal</span>
                </th>
                <th
                  className="px-4 py-3.5 text-left border-r border-emerald-500/15 bg-emerald-50/80 dark:bg-emerald-950/40 cursor-pointer select-none"
                  onClick={() =>
                    setSort(
                      "amount",
                      sortConfig?.key === "amount" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Quote Value</span>
                    {sortConfig?.key === "amount" && (
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
                      "validTill",
                      sortConfig?.key === "validTill" ? (sortConfig.direction === "asc" ? "desc" : null) : "asc"
                    )
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>Valid Until</span>
                    {sortConfig?.key === "validTill" && (
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
                      <div className="h-4 w-28 bg-muted rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-muted rounded" />
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
              ) : paginatedQuotations.length > 0 ? (
                paginatedQuotations.map((quote: QuotationType) => {
                  const color = getQuoteColor(quote.client || quote.quoteId);
                  const isSelected = selectedQuoteIds.includes(quote.id);

                  return (
                    <tr
                      key={quote.id}
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
                            setSelectedQuoteIds((prev) =>
                              prev.includes(quote.id)
                                ? prev.filter((id) => id !== quote.id)
                                : [...prev, quote.id]
                            );
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Quote ID & Icon */}
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
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => setSelectedQuote(quote)}
                              className="font-bold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate font-mono"
                            >
                              {quote.quoteId}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {quote.lastActivity || "Created Recently"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer / Client */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 uppercase">
                            {quote.client ? quote.client.charAt(0) : "C"}
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {quote.client || "Untitled Client"}
                          </span>
                        </div>
                      </td>

                      {/* Related Deal */}
                      <td className="px-4 py-3.5">
                        {quote.leadName ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-muted/40 text-muted-foreground max-w-[160px] truncate">
                            <Building2 className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-xs font-semibold text-foreground truncate">
                              {quote.leadName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-foreground text-xs font-mono">
                          {formatCurrency(quote.amountValue ?? 0)}
                        </span>
                      </td>

                      {/* Valid Until */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <span>{quote.validTill || "—"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border",
                            quote.status === "ACCEPTED" &&
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
                            quote.status === "SENT" &&
                              "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
                            quote.status === "DRAFT" &&
                              "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
                            quote.status === "REJECTED" &&
                              "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
                            quote.status === "EXPIRED" &&
                              "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                          )}
                        >
                          {quote.status || "DRAFT"}
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
                              onClick={() => setSelectedQuote(quote)}
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
                              onClick={() => {
                                setQuoteToEdit(quote);
                                setIsAddModalOpen(true);
                              }}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="edit"
                                icon={Edit}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Edit Quote</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => window.open(`/quotations/${quote.id}/pdf`, "_blank")}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="download"
                                icon={Download}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Download PDF</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDuplicate(quote)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 hover:bg-muted focus:bg-muted"
                            >
                              <AppIcon
                                name="copy"
                                icon={Copy}
                                size={14}
                                className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0"
                              />
                              <span>Duplicate Quote</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1" />

                            {quote.status !== "ACCEPTED" && (
                              <DropdownMenuItem
                                onClick={() => updateStatusMutate({ id: quote.id, status: "ACCEPTED" })}
                                className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-emerald-600 hover:bg-emerald-500/10 focus:bg-emerald-500/10"
                              >
                                <AppIcon
                                  name="check"
                                  icon={Check}
                                  size={14}
                                  className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                                />
                                <span>Mark Accepted</span>
                              </DropdownMenuItem>
                            )}

                            {quote.status !== "SENT" && (
                              <DropdownMenuItem
                                onClick={() => updateStatusMutate({ id: quote.id, status: "SENT" })}
                                className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-blue-600 hover:bg-blue-500/10 focus:bg-blue-500/10"
                              >
                                <AppIcon
                                  name="send"
                                  icon={Send}
                                  size={14}
                                  className="w-3.5 h-3.5 text-blue-600 shrink-0"
                                />
                                <span>Mark Sent</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="my-1" />

                            <DropdownMenuItem
                              onClick={() => setQuoteToDelete(quote)}
                              className="group cursor-pointer text-xs rounded-lg py-2 px-2.5 font-medium flex items-center gap-2 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                            >
                              <AppIcon
                                name="trash"
                                icon={Trash2}
                                size={14}
                                className="w-3.5 h-3.5 text-destructive shrink-0"
                              />
                              <span>Delete Quote</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground align-middle border-0">
                    <div className="flex flex-col items-center justify-center py-6">
                      <EmptyState
                        icon={FileText}
                        title="No quotations found"
                        description="No quotations match your current search or filter criteria."
                        className="border-none bg-transparent shadow-none p-0 min-h-0"
                        action={
                          hasActiveFilters
                            ? {
                                label: "Clear Filters",
                                onClick: handleClearFilters,
                                icon: RotateCcw,
                              }
                            : {
                                label: "Create Quote",
                                onClick: () => {
                                  setQuoteToEdit(null);
                                  setIsAddModalOpen(true);
                                },
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
              {filteredQuotations.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * rowsPerPage, filteredQuotations.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filteredQuotations.length}</span> Quotes
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
      <FormModal
        title={quoteToEdit ? "Edit Sales Quotation" : "Create Sales Quotation"}
        description={
          quoteToEdit
            ? "Update the details of your existing quotation."
            : "Generate a professional quote for your client."
        }
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        size="lg"
      >
        <QuoteForm
          initialData={quoteToEdit || undefined}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setQuoteToEdit(null);
            refetch();
          }}
          onCancel={() => {
            setIsAddModalOpen(false);
            setQuoteToEdit(null);
          }}
        />
      </FormModal>

      <QuotationPreview
        quotation={selectedQuote}
        isOpen={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={Boolean(quoteToDelete)} onOpenChange={(open) => !open && setQuoteToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Quotation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete quotation{" "}
              <strong className="text-foreground">{quoteToDelete?.quoteId}</strong>? This action cannot be
              undone.
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
              {deleting ? "Deleting..." : "Delete Quotation"}
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
              Delete {selectedQuoteIds.length} Selected Quotations?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete all selected quotations. This action cannot be undone.
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

      <QuotationContextualSettings
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultSection={customizeDefaultSection || "templates"}
      />
    </CRMPageContainer>
  );
}
