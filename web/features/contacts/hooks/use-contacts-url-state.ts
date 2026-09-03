"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export type ContactTypeFilter = "ALL" | "lead" | "customer" | "inactive";

/**
 * Normalizes a raw string query param into a valid ContactTypeFilter.
 */
function normalizeType(raw: string | null): ContactTypeFilter {
  if (!raw) return "ALL";
  const lower = raw.toLowerCase().trim();
  if (lower === "lead") return "lead";
  if (lower === "customer") return "customer";
  if (lower === "inactive") return "inactive";
  return "ALL";
}

export function useContactsUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read 'type' first, then fallback to legacy 'status'
  const rawType = searchParams.get("type");
  const rawStatus = searchParams.get("status");
  const typeFilter: ContactTypeFilter = rawType
    ? normalizeType(rawType)
    : rawStatus
    ? normalizeType(rawStatus)
    : "ALL";

  // Read customize param (e.g. ?customize=sources or ?customize=true)
  const customizeParam = searchParams.get("customize");

  const setTypeFilter = useCallback(
    (newType: ContactTypeFilter) => {
      // Avoid redundant router replacement if it already matches
      if (newType === typeFilter) return;

      const params = new URLSearchParams(searchParams.toString());

      // Clean up legacy status parameter if present to avoid conflicts
      params.delete("status");

      if (newType === "ALL") {
        params.delete("type");
      } else {
        params.set("type", newType);
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [router, pathname, searchParams, typeFilter]
  );

  return {
    typeFilter,
    setTypeFilter,
    customizeParam,
    searchParams,
  };
}
