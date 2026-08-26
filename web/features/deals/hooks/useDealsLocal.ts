"use client";

import { useState, useMemo } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDealsLocal(deals: any[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedDeals = useMemo(() => {
    if (!sortConfig) return deals;
    return [...deals].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [deals, sortConfig]);

  /** 3-state: asc -> desc -> null */
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  /** Direct sort setter (used by DataTableColumnHeader onSort) */
  const setSort = (key: string, direction: "asc" | "desc" | null) => {
    if (direction === null) {
      setSortConfig(null);
    } else {
      setSortConfig({ key, direction });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === deals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(deals.map(d => d.id));
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
    sortedDeals,
    selectedIds,
    setSelectedIds,
    sortConfig,
    handleSort,
    setSort,
    toggleSelectAll,
    toggleSelect,
  };
}
