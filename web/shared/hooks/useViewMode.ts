"use client";

import { useSyncExternalStore, useCallback } from "react";

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

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") return () => {};

      const handleStorage = (e: StorageEvent) => {
        if (e.key === storageKey) {
          onStoreChange();
        }
      };

      const handleCustomEvent = (e: Event) => {
        const custom = e as CustomEvent<{ moduleKey: string; viewMode: string }>;
        if (custom.detail && custom.detail.moduleKey === moduleKey) {
          onStoreChange();
        }
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener("crm-viewmode-change", handleCustomEvent);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("crm-viewmode-change", handleCustomEvent);
      };
    },
    [moduleKey, storageKey]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return normalizedDefault;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return normalizeViewMode(saved, normalizedDefault);

      if (moduleKey === "leads") {
        const legacySaved = localStorage.getItem("leadViewMode");
        if (legacySaved) return normalizeViewMode(legacySaved, normalizedDefault);
      }
      return normalizedDefault;
    } catch {
      return normalizedDefault;
    }
  }, [moduleKey, storageKey, normalizedDefault]);

  const getServerSnapshot = useCallback(() => {
    return normalizedDefault;
  }, [normalizedDefault]);

  const viewMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setViewMode = useCallback(
    (newMode: string) => {
      const normalized = normalizeViewMode(newMode, normalizedDefault);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, normalized);
          if (moduleKey === "leads") {
            localStorage.setItem("leadViewMode", "table");
          }
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

  return [viewMode, setViewMode] as const;
}

