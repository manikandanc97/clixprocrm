"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export interface UseInvoicesUrlStateOptions {
  setIsCreateModalOpen?: (open: boolean) => void;
  onOpenCreate?: () => void;
}

export interface UseInvoicesUrlStateReturn {
  // Customize state
  isCustomizeOpen: boolean;
  setIsCustomizeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customizeDefaultSection: string | undefined;
  setCustomizeDefaultSection: React.Dispatch<React.SetStateAction<string | undefined>>;
  openCustomize: (section?: string) => void;
  closeCustomize: () => void;

  // New invoice state & cleanup
  isNewInvoiceRequested: boolean;
  clearNewParam: () => void;

  // Raw search params
  searchParams: ReturnType<typeof useSearchParams>;
}

/**
 * Hook to manage URL-synchronized state for Invoices:
 * - ?customize=... (e.g. ?customize=true or ?customize=<sectionKey>)
 * - ?new=true (triggers create modal on mount, then cleans URL via history replacement)
 */
export function useInvoicesUrlState(options?: UseInvoicesUrlStateOptions): UseInvoicesUrlStateReturn {
  const searchParams = useSearchParams();

  const cust = searchParams.get("customize");
  const [prevCust, setPrevCust] = useState(cust);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(Boolean(cust));
  const [customizeDefaultSection, setCustomizeDefaultSection] = useState<string | undefined>(
    cust && cust !== "true" ? cust : undefined
  );

  // Synchronize state when customize URL parameter changes
  if (cust !== prevCust) {
    setPrevCust(cust);
    if (cust) {
      setIsCustomizeOpen(true);
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
    }
  }

  const [isNewInvoiceRequested, setIsNewInvoiceRequested] = useState(false);

  // Clean-history helper for ?new=true using imperative history replacement
  const clearNewParam = useCallback(() => {
    if (typeof window === "undefined") return;
    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, []);

  // Sync ?new=true param on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      const timer = setTimeout(() => {
        setIsNewInvoiceRequested(true);
        if (options?.setIsCreateModalOpen) {
          options.setIsCreateModalOpen(true);
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

  return {
    isCustomizeOpen,
    setIsCustomizeOpen,
    customizeDefaultSection,
    setCustomizeDefaultSection,
    openCustomize,
    closeCustomize,
    isNewInvoiceRequested,
    clearNewParam,
    searchParams,
  };
}
