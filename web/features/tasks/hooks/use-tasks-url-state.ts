"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export interface UseTasksUrlStateOptions {
  setIsAddModalOpen?: (open: boolean) => void;
  onOpenCreate?: () => void;
}

export interface UseTasksUrlStateReturn {
  // Customize state
  isCustomizeOpen: boolean;
  setIsCustomizeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customizeDefaultSection: string | undefined;
  setCustomizeDefaultSection: React.Dispatch<React.SetStateAction<string | undefined>>;
  openCustomize: (section?: string) => void;
  closeCustomize: () => void;

  // New task state & cleanup
  isNewTaskRequested: boolean;
  clearNewParam: () => void;

  // Edit task state (if present in URL)
  editTaskId: string | null;
  clearEditParam: () => void;

  // Raw search params
  searchParams: ReturnType<typeof useSearchParams>;
}

/**
 * Hook to manage URL-synchronized state for Tasks:
 * - ?customize=... (e.g. ?customize=true or ?customize=<section>)
 * - ?new=true (triggers create modal on mount, then cleans URL via history replacement)
 * - ?edit=<id> (if present, exposes editTaskId and cleanup helper)
 */
export function useTasksUrlState(options?: UseTasksUrlStateOptions): UseTasksUrlStateReturn {
  const searchParams = useSearchParams();

  const cust = searchParams.get("customize");
  const [prevCust, setPrevCust] = useState(cust);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(Boolean(cust));
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>(
    cust && cust !== "true" ? cust : undefined
  );

  // Synchronize state when customize URL parameter changes without cascading renders
  if (cust !== prevCust) {
    setPrevCust(cust);
    if (cust) {
      setIsCustomizeOpen(true);
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
    }
  }

  const [isNewTaskRequested, setIsNewTaskRequested] = useState(false);

  // Clean-history helper for ?new=true using imperative history replacement
  const clearNewParam = useCallback(() => {
    if (typeof window === "undefined") return;
    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, []);

  // Clean-history helper for ?edit=<id>
  const clearEditParam = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
  }, []);

  // Sync ?new=true param on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      const timer = setTimeout(() => {
        setIsNewTaskRequested(true);
        if (options?.setIsAddModalOpen) {
          options.setIsAddModalOpen(true);
        }
        if (options?.onOpenCreate) {
          options.onOpenCreate();
        }
        clearNewParam();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [options, clearNewParam]);

  const openCustomize = useCallback((section?: string) => {
    if (section) {
      setCustomizeDefaultSection(section);
    }
    setIsCustomizeOpen(true);
  }, []);

  const closeCustomize = useCallback(() => {
    setIsCustomizeOpen(false);
  }, []);

  const editTaskId = searchParams.get("edit");

  return {
    isCustomizeOpen,
    setIsCustomizeOpen,
    customizeDefaultSection,
    setCustomizeDefaultSection,
    openCustomize,
    closeCustomize,
    isNewTaskRequested,
    clearNewParam,
    editTaskId,
    clearEditParam,
    searchParams,
  };
}
