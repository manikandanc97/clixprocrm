"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export interface UseCompaniesUrlStateReturn {
  customizeParam: string | null;
  isCustomizeOpen: boolean;
  customizeDefaultSection: string | undefined;
  setCustomizeOpen: (open: boolean, section?: string) => void;
  newParam: string | null;
  clearNewParam: () => void;
  searchParams: ReturnType<typeof useSearchParams>;
}

export function useCompaniesUrlState(): UseCompaniesUrlStateReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read customize param (e.g. ?customize=industries or ?customize=true)
  const customizeParam = searchParams.get("customize");
  const isCustomizeOpen = Boolean(customizeParam);
  const customizeDefaultSection =
    customizeParam && customizeParam !== "true" ? customizeParam : undefined;

  // Read 'new' param
  const newParam = searchParams.get("new");

  const clearNewParam = useCallback(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("new");
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [pathname]);

  const setCustomizeOpen = useCallback(
    (open: boolean, section?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (open) {
        params.set("customize", section || "true");
      } else {
        params.delete("customize");
      }
      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return {
    customizeParam,
    isCustomizeOpen,
    customizeDefaultSection,
    setCustomizeOpen,
    newParam,
    clearNewParam,
    searchParams,
  };
}
