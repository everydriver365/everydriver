import { Skeleton } from "@/components/ui/skeleton";

export function FinanceSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Tab bar */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Summary card */}
      <Skeleton className="h-32 w-full rounded-2xl" />

      {/* List items */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
