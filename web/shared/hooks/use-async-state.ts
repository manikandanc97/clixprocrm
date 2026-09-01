"use client";

import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";

export interface AsyncStateOptions<TData, TItem> {
  query: UseQueryResult<TData, unknown>;
  auth?: {
    isHydrated?: boolean;
    isAuthenticated?: boolean;
    isInitializing?: boolean;
  };
  getItems?: (data: TData | undefined) => TItem[] | undefined;
  hasFilters?: boolean;
  searchQuery?: string;
}

export interface AsyncStateResult<TItem> {
  /** True when the initial request is pending/fetching or auth is initializing and no data is cached yet */
  isInitialLoading: boolean;
  /** True when background refetching occurs while existing data remains displayed */
  isRefetching: boolean;
  /** True when the query resulted in an error and no cached data is available */
  isError: boolean;
  /** True strictly when the query has resolved successfully and the items array has 0 records */
  isConfirmedEmpty: boolean;
  /** True strictly when the query has resolved successfully and has 1 or more records */
  isConfirmedData: boolean;
  /** True when filters or search query produced 0 records while the overall dataset has data */
  isFilterEmpty: boolean;
  /** The safe array of records */
  items: TItem[];
  /** Error object if present */
  error: unknown;
  /** Refetch method */
  refetch: () => void;
}

/**
 * Standardized data lifecycle evaluation hook.
 * Prevents premature empty-state flashes before authentication or API responses complete.
 */
export function useAsyncDataState<TData, TItem = unknown>(
  options: AsyncStateOptions<TData, TItem>
): AsyncStateResult<TItem> {
  const { query, auth, getItems, hasFilters = false, searchQuery = "" } = options;

  return useMemo(() => {
    const rawData = query.data;
    const hasData = rawData !== undefined && rawData !== null;

    const items: TItem[] = getItems
      ? getItems(rawData) || []
      : Array.isArray(rawData)
      ? (rawData as TItem[])
      : [];

    const isAuthPending = auth
      ? (!auth.isHydrated || auth.isInitializing)
      : false;

    // Initial loading means we have NO data yet AND (query is pending/loading/fetching OR auth is preparing)
    const isInitialLoading =
      !hasData &&
      (query.isPending ||
        query.isLoading ||
        query.isFetching ||
        isAuthPending ||
        (auth !== undefined && !auth.isAuthenticated));

    // Refetching means we already have data in memory and a background update is in-flight
    const isRefetching = hasData && query.isFetching;

    // Error state when no data is cached
    const isError = !hasData && query.isError;

    // Confirmed states ONLY apply when the query has completed successfully
    const isConfirmedData = !isInitialLoading && !isError && items.length > 0;
    const isConfirmedEmpty = !isInitialLoading && !isError && query.isSuccess && items.length === 0;

    const isFilterActive = Boolean(hasFilters || (searchQuery && searchQuery.trim().length > 0));
    const isFilterEmpty = isConfirmedEmpty && isFilterActive;

    return {
      isInitialLoading,
      isRefetching,
      isError,
      isConfirmedEmpty,
      isConfirmedData,
      isFilterEmpty,
      items,
      error: query.error,
      refetch: query.refetch,
    };
  }, [
    query.data,
    query.isPending,
    query.isLoading,
    query.isFetching,
    query.isError,
    query.isSuccess,
    query.error,
    query.refetch,
    auth?.isHydrated,
    auth?.isInitializing,
    auth?.isAuthenticated,
    getItems,
    hasFilters,
    searchQuery,
  ]);
}
