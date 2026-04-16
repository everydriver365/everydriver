import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic full-page shimmer skeleton — replaces "Loading..." text
 * and spinner patterns with an iOS-style shimmer placeholder.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-5 p-5 animate-in fade-in duration-300">
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Hero / summary card */}
      <Skeleton className="h-28 w-full rounded-2xl" />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* List items */}
      <div className="space-y-1 rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 px-1">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
