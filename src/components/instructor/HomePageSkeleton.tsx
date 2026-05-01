import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-transparent pb-24">
      {/* Hero skeleton */}
      <Skeleton className="w-full h-56" />
      
      {/* Overlapping card skeleton */}
      <div className="relative -mt-16 mx-3">
        <div className="bg-card rounded-2xl shadow-lift border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-24 mt-3" />
            </div>
          </div>
          <div className="flex items-center justify-around mt-3 pt-3 border-t border-border">
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-12 w-16" />
            <Skeleton className="h-12 w-16" />
          </div>
        </div>
      </div>

      {/* Next lesson skeleton */}
      <div className="mx-4 mt-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>

      {/* Quick actions skeleton */}
      <div className="px-4 pt-4 space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function NextLessonSkeleton() {
  return (
    <div className="mx-4 mb-4">
      <div className="bg-muted/50 rounded-2xl border border-border p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-8 rounded-2xl" />
            <Skeleton className="h-8 w-8 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeeklyGoalSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="h-4 w-24 mt-2" />
    </div>
  );
}
