import { CRMPageContainer } from "@/shared/components/crm";
import { PageHeaderSkeleton, CardSkeleton } from "@/shared/components/skeletons";
import { Skeleton } from "@/shared/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <CRMPageContainer>
      {/* Header Skeleton with Navigation Pill Bar */}
      <div className="shrink-0 space-y-3 pt-0.5 pb-1">
        <PageHeaderSkeleton />
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-xl shrink-0" />
          ))}
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="w-full space-y-4">
        <CardSkeleton className="min-h-[160px]" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <CardSkeleton className="min-h-[220px]" />
          <CardSkeleton className="min-h-[220px]" />
        </div>
        <CardSkeleton className="min-h-[180px]" />
      </div>
    </CRMPageContainer>
  );
}
