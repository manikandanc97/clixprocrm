"use client";

import { Skeleton } from "@/shared/ui/skeleton";

export function ModulesTableSkeleton() {
  return (
    <div className="overflow-x-auto w-full rounded-xl border border-border/60 bg-card shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="sticky top-0 z-20 bg-card border-b border-border/60">
          <tr className="h-10 sm:h-11">
            <th className="px-3 sm:px-4 py-2.5 w-20 text-center">
              <Skeleton className="h-2.5 w-10 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5">
              <Skeleton className="h-2.5 w-28" />
            </th>
            <th className="px-4 sm:px-6 py-2.5">
              <Skeleton className="h-2.5 w-24" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-center">
              <Skeleton className="h-2.5 w-20 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-center">
              <Skeleton className="h-2.5 w-20 mx-auto" />
            </th>
            <th className="px-4 sm:px-6 py-2.5 text-right">
              <Skeleton className="h-2.5 w-12 ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
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
