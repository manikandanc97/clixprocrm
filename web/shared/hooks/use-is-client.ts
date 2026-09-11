"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true once mounted on the client.
 * Uses `useSyncExternalStore` to avoid cascading render warnings and hydration mismatches.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
