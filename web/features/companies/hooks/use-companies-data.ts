"use client";

import { useMemo, useCallback } from "react";
import { useCompanies } from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import { toast } from "sonner";

export interface CompanyItem {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    customers?: number;
    deals?: number;
  };
  [key: string]: unknown;
}

export interface UseCompaniesDataProps {
  statusFilter: string;
  industryFilter: string;
  search: string;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  currentPage: number;
  rowsPerPage: number;
}

export function useCompaniesData({
  statusFilter,
  industryFilter,
  search,
  sortConfig,
  currentPage,
  rowsPerPage,
}: UseCompaniesDataProps) {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading: queryLoading, isPending, isError, error, refetch } = useCompanies();

  const safeCompanies = useMemo<CompanyItem[]>(() => {
    return Array.isArray(data?.companies) ? (data.companies as CompanyItem[]) : [];
  }, [data]);

  // Extract unique industries for filter dropdown
  const uniqueIndustries = useMemo(() => {
    const set = new Set<string>();
    safeCompanies.forEach((c) => {
      if (c.industry && c.industry.trim()) {
        set.add(c.industry.trim());
      }
    });
    return Array.from(set).sort();
  }, [safeCompanies]);

  // Derived metrics from in-memory dataset
  const metrics = useMemo(() => {
    const total = safeCompanies.length;
    let active = 0;
    let totalCustomers = 0;
    let totalDeals = 0;

    for (const c of safeCompanies) {
      if ((c.status || "ACTIVE").toUpperCase() === "ACTIVE") {
        active += 1;
      }
      totalCustomers += c._count?.customers || 0;
      totalDeals += c._count?.deals || 0;
    }

    return {
      total,
      active,
      totalCustomers,
      totalDeals,
    };
  }, [safeCompanies]);

  // Filtered companies based on search, status, and industry
  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = safeCompanies.filter((company) => {
      // 1. Status Filter
      if (
        statusFilter !== "ALL" &&
        (company.status || "ACTIVE").toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }

      // 2. Industry Filter
      if (
        industryFilter !== "ALL" &&
        (company.industry || "").toLowerCase() !== industryFilter.toLowerCase()
      ) {
        return false;
      }

      // 3. Search substring match on name & industry
      if (!q) return true;
      const nameMatch = company.name && company.name.toLowerCase().includes(q);
      const industryMatch = company.industry && company.industry.toLowerCase().includes(q);
      return Boolean(nameMatch || industryMatch);
    });

    // 4. Sorting
    if (!sortConfig) return filtered;

    return [...filtered].sort((a, b) => {
      let aVal: unknown = a[sortConfig.key];
      let bVal: unknown = b[sortConfig.key];

      if (sortConfig.key === "customers") {
        aVal = a._count?.customers || 0;
        bVal = b._count?.customers || 0;
      } else if (sortConfig.key === "deals") {
        aVal = a._count?.deals || 0;
        bVal = b._count?.deals || 0;
      } else if (sortConfig.key === "createdAt") {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      } else {
        aVal = (aVal ?? "").toString().toLowerCase();
        bVal = (bVal ?? "").toString().toLowerCase();
      }

      if ((aVal as number | string) < (bVal as number | string)) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if ((aVal as number | string) > (bVal as number | string)) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [safeCompanies, search, statusFilter, industryFilter, sortConfig]);

  // Pagination
  const totalItems = filteredCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredCompanies.slice(start, start + rowsPerPage);
  }, [filteredCompanies, currentPage, rowsPerPage]);

  // Loading state
  const isInitialLoading =
    !data && (queryLoading || isPending || !isHydrated || !isAuthenticated || isInitializing);

  // CSV Export
  const exportCSV = useCallback(() => {
    if (safeCompanies.length === 0) {
      toast.error("No companies available to export.");
      return;
    }
    const headers = [
      "ID",
      "Name",
      "Industry",
      "Status",
      "Customers Count",
      "Deals Count",
      "Created At",
    ];
    const rows = safeCompanies.map((c) => [
      c.id,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.industry || "").replace(/"/g, '""')}"`,
      c.status || "ACTIVE",
      c._count?.customers || 0,
      c._count?.deals || 0,
      c.createdAt || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `clixpro_companies_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Companies exported successfully.");
  }, [safeCompanies]);

  return {
    safeCompanies,
    filteredCompanies,
    paginatedCompanies,
    uniqueIndustries,
    metrics,
    totalItems,
    totalPages,
    isLoading: isInitialLoading,
    isError,
    error,
    refetch,
    exportCSV,
  };
}
