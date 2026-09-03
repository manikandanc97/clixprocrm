import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QuotationType } from "@/shared/types/quotation";

export interface QuotationsUrlStateOptions {
  safeQuotations: QuotationType[];
  setIsCustomizeOpen: (open: boolean) => void;
  setCustomizeDefaultSection: (section: string | undefined) => void;
  setIsAddModalOpen: (open: boolean) => void;
  setQuoteToEdit: (quote: QuotationType | null) => void;
}

/**
 * Syncs URL search parameters to modal/panel state on mount and param changes.
 *
 * Handled params:
 *   ?customize=true        → opens the customize panel (no default section)
 *   ?customize=<section>   → opens the customize panel scrolled to <section>
 *   ?edit=<id>             → finds the matching quotation and opens edit modal, then strips param
 *   ?new=true              → opens the create modal on mount, then strips param
 */
export function useQuotationsUrlState({
  safeQuotations,
  setIsCustomizeOpen,
  setCustomizeDefaultSection,
  setIsAddModalOpen,
  setQuoteToEdit,
}: QuotationsUrlStateOptions) {
  const searchParams = useSearchParams();

  // ?customize=true | ?customize=<section>
  useEffect(() => {
    const cust = searchParams.get("customize");
    if (cust) {
      if (cust !== "true") {
        setCustomizeDefaultSection(cust);
      }
      setIsCustomizeOpen(true);
    }
  }, [searchParams, setCustomizeDefaultSection, setIsCustomizeOpen]);

  // ?edit=<id>
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && safeQuotations.length > 0) {
      const q = safeQuotations.find(
        (item) => item.id === editId || item.quoteId === editId
      );
      if (q) {
        setQuoteToEdit(q);
        setIsAddModalOpen(true);
      }
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("edit");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams, safeQuotations, setIsAddModalOpen, setQuoteToEdit]);

  // ?new=true — only checked once on mount via window.location to avoid
  // re-opening the modal when searchParams object reference changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      const timer = setTimeout(() => {
        setQuoteToEdit(null);
        setIsAddModalOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
