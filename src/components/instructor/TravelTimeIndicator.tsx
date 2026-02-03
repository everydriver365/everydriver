import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface TravelTimeIndicatorProps {
  durationMinutes: number | null;
  durationText: string | null;
  gapMinutes: number;
  status: "plenty" | "tight" | "late" | "unknown";
  isLoading?: boolean;
  className?: string;
}

export function TravelTimeIndicator({
  durationMinutes,
  durationText,
  gapMinutes,
  status,
  isLoading = false,
  className,
}: TravelTimeIndicatorProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-1", className)}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted animate-pulse">
          <Car className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">...</span>
        </div>
      </div>
    );
  }

  if (durationMinutes === null) {
    return null;
  }

  const statusColors = {
    plenty: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    tight: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    late: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    unknown: "bg-muted text-muted-foreground",
  };

  const displayText = durationText || `~${durationMinutes} min`;

  return (
    <div className={cn("flex items-center justify-center py-1", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium",
          statusColors[status]
        )}
      >
        <Car className="h-3 w-3" />
        <span>{displayText}</span>
        {status === "late" && (
          <span className="text-[9px] opacity-75">
            ({gapMinutes} min gap)
          </span>
        )}
      </div>
    </div>
  );
}
