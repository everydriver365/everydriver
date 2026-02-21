import { Skeleton } from "@/components/ui/skeleton";

export function MessagesSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Conversation items */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full max-w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
