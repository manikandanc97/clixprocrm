"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useCallback, useRef } from "react";

export interface UseEmployeesUrlStateProps {
  onOpenAddModal?: () => void;
}

export interface UseEmployeesUrlStateReturn {
  newParam: string | null;
  clearNewParam: () => void;
}

export function useEmployeesUrlState(props?: UseEmployeesUrlStateProps): UseEmployeesUrlStateReturn {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const newParam = searchParams.get("new");
  const onOpenAddModal = props?.onOpenAddModal;
  const newHandledRef = useRef(false);

  const clearNewParam = useCallback(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("new");
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [pathname]);

  useEffect(() => {
    if (newParam === "true" && !newHandledRef.current) {
      newHandledRef.current = true;
      onOpenAddModal?.();
      clearNewParam();
    }
  }, [newParam, onOpenAddModal, clearNewParam]);

  return {
    newParam,
    clearNewParam,
  };
}
