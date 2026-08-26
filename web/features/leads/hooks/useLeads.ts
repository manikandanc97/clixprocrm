"use client";

import { useState, useMemo, useCallback } from "react";
import { LeadType } from "@/shared/types/lead";
import { useDeleteLead, useBulkDeleteLeads } from "@/shared/hooks/use-crm";
import { toast } from "sonner";

export type SortConfig = {
  key: "name" | "valueAmount" | "activity";
  direction: "asc" | "desc" | "newest" | "oldest" | "upcoming" | "overdue";
} | null;

export type FilterConfig = {
  stage: string;
  priority: string;
  activity: string;
};

const isOverdue = (dateStr: string | null | undefined) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const isToday = (dateStr: string | null | undefined) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isTomorrow = (dateStr: string | null | undefined) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

const isThisWeek = (dateStr: string | null | undefined) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return date >= firstDay && date <= lastDay;
};

export function useLeads(leads: LeadType[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const [filters, setFilters] = useState<FilterConfig>({
    stage: "All Stages",
    priority: "All Priorities",
    activity: "All Activity"
  });

  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const deleteLeadMutation = useDeleteLead();
  const bulkDeleteMutation = useBulkDeleteLeads();

  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    // 1. Apply Filters
    if (filters.stage !== "All Stages") {
      result = result.filter(lead => lead.stage === filters.stage);
    }

    if (filters.priority !== "All Priorities") {
      result = result.filter(lead => lead.priority === filters.priority);
    }

    if (filters.activity !== "All Activity") {
      result = result.filter(lead => {
        if (filters.activity === "Overdue") return isOverdue(lead.followUpAt);
        if (filters.activity === "Today") return isToday(lead.followUpAt);
        if (filters.activity === "Tomorrow") return isTomorrow(lead.followUpAt);
        if (filters.activity === "This Week") return isThisWeek(lead.followUpAt);
        if (filters.activity === "No Follow-up Scheduled") return !lead.followUpAt;
        if (filters.activity === "No Activity") return !lead.lastActivity && !lead.updatedAt;
        return true;
      });
    }

    // 2. Apply Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === "name") {
          const aVal = a.name.toLowerCase();
          const bVal = b.name.toLowerCase();
          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        }
        if (sortConfig.key === "valueAmount") {
          const aVal = a.valueAmount || 0;
          const bVal = b.valueAmount || 0;
          return sortConfig.direction === "desc" ? bVal - aVal : aVal - bVal;
        }
        if (sortConfig.key === "activity") {
          const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
          const aFollowUp = a.followUpAt ? new Date(a.followUpAt).getTime() : Infinity;
          const bFollowUp = b.followUpAt ? new Date(b.followUpAt).getTime() : Infinity;

          if (sortConfig.direction === "newest") return bDate - aDate;
          if (sortConfig.direction === "oldest") return aDate - bDate;
          if (sortConfig.direction === "upcoming") return aFollowUp - bFollowUp;
          if (sortConfig.direction === "overdue") {
            const aIsOverdue = isOverdue(a.followUpAt);
            const bIsOverdue = isOverdue(b.followUpAt);
            if (aIsOverdue && !bIsOverdue) return -1;
            if (!aIsOverdue && bIsOverdue) return 1;
            return aFollowUp - bFollowUp;
          }
        }
        return 0;
      });
    }

    return result;
  }, [leads, sortConfig, filters]);

  const handleSort = (key: NonNullable<SortConfig>["key"], direction?: NonNullable<SortConfig>["direction"]) => {
    if (direction) {
      setSortConfig({ key: key as ReturnType<typeof JSON.parse>, direction });
      return;
    }
    // Default toggles for simple sorts if no specific direction is provided
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (key === "name") return prev.direction === "asc" ? { key, direction: "desc" } : null;
        if (key === "valueAmount") return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      if (key === "name") return { key, direction: "asc" };
      if (key === "valueAmount") return { key, direction: "asc" };
      if (key === "activity") return { key, direction: "newest" };
      return null;
    });
  };

  /** Direct sort setter (used by DataTableColumnHeader onSort) */
  const setSort = (key: NonNullable<SortConfig>["key"], direction: "asc" | "desc" | null) => {
    if (direction === null) {
      setSortConfig(null);
    } else {
      setSortConfig({ key: key as ReturnType<typeof JSON.parse>, direction });
    }
  };

  const updateFilter = (key: keyof FilterConfig, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = useCallback(() => {
    setFilters({
      stage: "All Stages",
      priority: "All Priorities",
      activity: "All Activity"
    });
    setSortConfig(null);
  }, []);

  const hasActiveFilters = 
    filters.stage !== "All Stages" || 
    filters.priority !== "All Priorities" || 
    filters.activity !== "All Activity" ||
    sortConfig !== null;

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedLeads.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (id: string, name: string) => {
    deleteLeadMutation.mutate(id, {
      onSuccess: () => {
        toast.error("Lead Deleted", {
          description: `${name} has been removed from the CRM.`,
        });
      }
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    setIsDeletingBulk(true);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.error("Leads Deleted", {
        description: `${ids.length} leads have been removed from the CRM.`,
      });
      setSelectedIds([]);
    } catch {
      toast.error("Error", {
        description: "Failed to delete some leads.",
      });
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return {
    sortedLeads: filteredAndSortedLeads,
    selectedIds,
    setSelectedIds,
    expandedId,
    sortConfig,
    filters,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    handleSort,
    setSort,
    toggleSelectAll,
    toggleSelect,
    toggleExpand,
    handleDelete,
    handleBulkDelete,
    isDeletingBulk,
  };
}





