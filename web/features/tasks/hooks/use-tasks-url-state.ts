"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // Edit task state
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
export function useTasksUrlState(
  options?: UseTasksUrlStateOptions
): UseTasksUrlStateReturn {
  const searchParams = useSearchParams();

  // Customize drawer state
  const customizeParam = searchParams.get("customize");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(
    Boolean(customizeParam)
  );
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<
    string | undefined
  >(customizeParam && customizeParam !== "true" ? customizeParam : undefined);

  // New task modal requested via ?new=true
  const [isNewTaskRequested, setIsNewTaskRequested] = useState(false);
  const newHandledRef = useRef(false);

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
    if (params.get("new") === "true" && !newHandledRef.current) {
      newHandledRef.current = true;
      setIsNewTaskRequested(true);
      if (options?.setIsAddModalOpen) {
        options.setIsAddModalOpen(true);
      }
      if (options?.onOpenCreate) {
        options.onOpenCreate();
      }
      clearNewParam();
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
