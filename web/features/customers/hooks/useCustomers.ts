"use client";

import { useState, useMemo } from "react";
import { CustomerType } from "@/shared/types/customer";
// import { } from "sonner";

export function useCustomers(customers: CustomerType[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CustomerType;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedCustomers = useMemo(() => {
    if (!sortConfig) return customers;
    return [...customers].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [customers, sortConfig]);

  /** 3-state: asc -> desc -> null */
  const handleSort = (key: keyof CustomerType) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  /** Direct sort setter (used by DataTableColumnHeader onSort) */
  const setSort = (key: keyof CustomerType, direction: "asc" | "desc" | null) => {
    if (direction === null) {
      setSortConfig(null);
    } else {
      setSortConfig({ key, direction });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return {
    sortedCustomers,
    selectedIds,
    setSelectedIds,
    sortConfig,
    handleSort,
    setSort,
    toggleSelectAll,
    toggleSelect,
  };
}
