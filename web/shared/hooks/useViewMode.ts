"use client";

import { useState, useEffect, useCallback } from "react";

export type ViewMode = "list" | "table" | "pipeline" | "kanban" | "calendar" | "timeline" | string;

export function normalizeViewMode(mode: string | null | undefined, defaultMode: string = "list"): string {
  if (!mode) return defaultMode;
  const lower = mode.toLowerCase();
  if (lower === "table" || lower === "list" || lower === "cards" || lower === "grid") return "list";
  return lower;
}

export function useViewMode(moduleKey: string, defaultMode: string = "list") {
  const storageKey = `crm:view:${moduleKey}`;
  const normalizedDefault = normalizeViewMode(defaultMode, "list");

  const [viewMode, setViewModeState] = useState<string>(normalizedDefault);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // 1. Try standard module key
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        // We use a timeout to avoid synchronous setState inside the effect, fixing the React warning.
        setTimeout(() => setViewModeState(normalizeViewMode(saved, normalizedDefault)), 0);
        return;
      }

      // 2. Legacy fallback for leads
      if (moduleKey === "leads") {
        const legacySaved = localStorage.getItem("leadViewMode");
        if (legacySaved) {
          setTimeout(() => setViewModeState(normalizeViewMode(legacySaved, normalizedDefault)), 0);
        }
      }
    } catch {
      // Storage access error
    }
  }, [moduleKey, storageKey, normalizedDefault]);

  const setViewMode = useCallback(
    (newMode: string) => {
      const normalized = normalizeViewMode(newMode, normalizedDefault);
      setViewModeState(normalized);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, normalized);
          // Also update legacy key if leads for backward compatibility
          if (moduleKey === "leads") {
            localStorage.setItem("leadViewMode", "table");
          }
          // Notify other components/tabs
          window.dispatchEvent(
            new CustomEvent("crm-viewmode-change", {
              detail: { moduleKey, viewMode: normalized },
            })
          );
        } catch {
          // Ignore storage quota/permission error
        }
      }
    },
    [moduleKey, storageKey, normalizedDefault]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setViewModeState(normalizeViewMode(e.newValue, normalizedDefault));
      }
    };

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<{ moduleKey: string; viewMode: string }>;
      if (custom.detail && custom.detail.moduleKey === moduleKey) {
        setViewModeState(custom.detail.viewMode);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("crm-viewmode-change", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("crm-viewmode-change", handleCustomEvent);
    };
  }, [moduleKey, storageKey, normalizedDefault]);

  return [viewMode, setViewMode] as const;
}
