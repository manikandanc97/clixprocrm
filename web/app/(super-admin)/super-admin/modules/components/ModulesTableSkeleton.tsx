"use client";

import { Skeleton } from "@/shared/ui/skeleton";

export function ModulesTableSkeleton() {
  return (
    <div className="overflow-x-auto w-full rounded-xl border border-border/80 bg-card shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 z-20 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-500/20 shadow-xs backdrop-blur-xs">
          <tr className="h-10">
            <th className="px-3 py-2 w-20 text-center border-r border-emerald-500/15">
              <Skeleton className="h-3 w-10 mx-auto" />
            </th>
            <th className="px-4 py-2 border-r border-emerald-500/15">
              <Skeleton className="h-3 w-28" />
            </th>
            <th className="px-4 py-2 border-r border-emerald-500/15">
              <Skeleton className="h-3 w-24" />
            </th>
            <th className="px-4 py-2 text-center border-r border-emerald-500/15">
              <Skeleton className="h-3 w-20 mx-auto" />
            </th>
            <th className="px-4 py-2 text-center border-r border-emerald-500/15">
              <Skeleton className="h-3 w-20 mx-auto" />
            </th>
            <th className="px-4 py-2 text-right">
              <Skeleton className="h-3 w-12 ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-xs">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="h-16">
              <td className="px-3 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Skeleton className="w-6 h-6 rounded-md" />
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="w-6 h-6 rounded-md" />
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <Skeleton className="h-5 w-24 rounded-lg" />
              </td>
              <td className="px-4 py-4 text-center">
                <Skeleton className="h-5 w-24 rounded-full mx-auto" />
              </td>
              <td className="px-4 py-4 text-center">
                <Skeleton className="h-5 w-16 rounded-full mx-auto" />
              </td>
              <td className="px-4 py-4 text-right">
                <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
