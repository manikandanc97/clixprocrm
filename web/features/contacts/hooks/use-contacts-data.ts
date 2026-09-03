"use client";

import { useMemo } from "react";
import { useLeads, useCustomers } from "@/shared/hooks/use-crm";
import { useAuth } from "@/features/auth/components/auth-provider";
import type { ContactTypeFilter } from "./use-contacts-url-state";

export type ContactItem =
  | {
      id: string;
      type: "Lead";
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      stage?: string;
      status?: string;
      valueAmount?: number;
      revenueValue?: number;
      createdAt?: string;
      lastContact?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw: any;
      [key: string]: unknown;
    }
  | {
      id: string;
      type: "Customer";
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      status?: string;
      stage?: string;
      valueAmount?: number;
      revenueValue?: number;
      createdAt?: string;
      lastContact?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      raw: any;
      [key: string]: unknown;
    };

export interface UseContactsDataProps {
  typeFilter: ContactTypeFilter;
  statusFilter: string;
  search: string;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  currentPage: number;
  rowsPerPage: number;
}

export function useContactsData({
  typeFilter,
  statusFilter,
  search,
  sortConfig,
  currentPage,
  rowsPerPage,
}: UseContactsDataProps) {
  const { isHydrated, isAuthenticated, isInitializing } = useAuth();

  const shouldFetchLeads =
    typeFilter === "ALL" || typeFilter === "lead" || typeFilter === "inactive";
  const shouldFetchCustomers =
    typeFilter === "ALL" || typeFilter === "customer" || typeFilter === "inactive";

  const {
    data: leadsData,
    isLoading: leadsLoading,
    isPending: leadsPending,
    isError: isLeadsError,
    error: leadsError,
    refetch: refetchLeads,
  } = useLeads(undefined, { enabled: shouldFetchLeads });

  const {
    data: customersData,
    isLoading: customersLoading,
    isPending: customersPending,
    isError: isCustomersError,
    error: customersError,
    refetch: refetchCustomers,
  } = useCustomers(undefined, { enabled: shouldFetchCustomers });

  const safeLeads = useMemo(
    () => (Array.isArray(leadsData?.leads) ? leadsData.leads : []),
    [leadsData]
  );
  const safeCustomers = useMemo(
    () => (Array.isArray(customersData?.customers) ? customersData.customers : []),
    [customersData]
  );

  // Combine Leads & Customers into strongly typed ContactItems
  const combinedContacts = useMemo<ContactItem[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedLeads: ContactItem[] = safeLeads.map((lead: any) => ({
      ...lead,
      type: "Lead" as const,
      raw: lead,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedCustomers: ContactItem[] = safeCustomers.map((customer: any) => ({
      ...customer,
      type: "Customer" as const,
      raw: customer,
    }));

    return [...mappedLeads, ...mappedCustomers].sort(
      (a, b) =>
        new Date((b.createdAt as string) || (b.lastContact as string) || 0).getTime() -
        new Date((a.createdAt as string) || (a.lastContact as string) || 0).getTime()
    );
  }, [safeLeads, safeCustomers]);

  // Derived Metrics from existing dataset
  const metrics = useMemo(() => {
    const totalContacts = safeLeads.length + safeCustomers.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeLeads = safeLeads.filter((l: any) => {
      const stage = (l.stage || l.status || "").toUpperCase();
      return stage !== "LOST";
    }).length;
    const customersCount = safeCustomers.length;
    // Sum pipeline revenue across all leads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipelineRevenue = safeLeads.reduce((acc: number, l: any) => {
      const val = l.valueAmount ?? l.revenueValue ?? 0;
      return acc + (typeof val === "number" && !isNaN(val) ? val : 0);
    }, 0);

    return {
      totalContacts,
      activeLeads,
      customersCount,
      pipelineRevenue,
    };
  }, [safeLeads, safeCustomers]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    const filtered = combinedContacts.filter((contact) => {
      // 1. Type Filter
      if (typeFilter === "lead" && contact.type !== "Lead") return false;
      if (typeFilter === "customer" && contact.type !== "Customer") return false;
      if (typeFilter === "inactive") {
        const isInactive =
          (contact.type === "Customer" && contact.status === "INACTIVE") ||
          (contact.type === "Lead" && (contact.stage === "LOST" || contact.status === "LOST"));
        if (!isInactive) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "ALL") {
        const curStatus = (contact.status || contact.stage || "").toLowerCase();
        if (!curStatus.includes(statusFilter.toLowerCase())) return false;
      }

      // 3. Search Filter (name, company, email, phone)
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (contact.name && contact.name.toLowerCase().includes(q)) ||
        (contact.company && contact.company.toLowerCase().includes(q)) ||
        (contact.email && contact.email.toLowerCase().includes(q)) ||
        (contact.phone && contact.phone.toLowerCase().includes(q))
      );
    });

    // 4. Sorting
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: unknown = a[sortConfig.key];
      let bVal: unknown = b[sortConfig.key];

      if (sortConfig.key === "revenue") {
        aVal = a.valueAmount ?? a.revenueValue ?? 0;
        bVal = b.valueAmount ?? b.revenueValue ?? 0;
      } else if (sortConfig.key === "date") {
        aVal = new Date((a.createdAt as string) || (a.lastContact as string) || 0).getTime();
        bVal = new Date((b.createdAt as string) || (b.lastContact as string) || 0).getTime();
      } else {
        aVal = aVal ?? "";
        bVal = bVal ?? "";
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [combinedContacts, search, typeFilter, statusFilter, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / rowsPerPage));
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredContacts, currentPage, rowsPerPage]);

  const isLoading =
    !isHydrated ||
    !isAuthenticated ||
    isInitializing ||
    (shouldFetchLeads && (leadsLoading || leadsPending) && !leadsData) ||
    (shouldFetchCustomers && (customersLoading || customersPending) && !customersData);

  const isError = (shouldFetchLeads && isLeadsError) || (shouldFetchCustomers && isCustomersError);
  const error = leadsError || customersError;

  const handleRetry = () => {
    if (shouldFetchLeads) refetchLeads();
    if (shouldFetchCustomers) refetchCustomers();
  };

  return {
    combinedContacts,
    filteredContacts,
    paginatedContacts,
    metrics,
    totalPages,
    totalCount: filteredContacts.length,
    isLoading,
    isError,
    error,
    handleRetry,
  };
}
