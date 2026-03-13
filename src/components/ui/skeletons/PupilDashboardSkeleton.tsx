import { Skeleton } from "@/components/ui/skeleton";

export function PupilDashboardSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      {/* Greeting */}
      <div className="pt-1">
        <Skeleton className="h-3 w-20 mb-1" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Lesson countdown card */}
      <Skeleton className="h-24 w-full rounded-2xl" />

      {/* Widget grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Journey timeline */}
      <Skeleton className="h-32 w-full rounded-2xl" />

      {/* Navigation list */}
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-4 py-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
