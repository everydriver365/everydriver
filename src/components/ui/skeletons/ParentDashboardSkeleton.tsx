import { Skeleton } from "@/components/ui/skeleton";

export function ParentDashboardSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      {/* Greeting */}
      <div className="pt-1">
        <Skeleton className="h-3 w-24 mb-1" />
        <Skeleton className="h-6 w-44" />
      </div>

      {/* Child cards */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}

      {/* Activity section */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <Skeleton className="h-4 w-32 mb-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
