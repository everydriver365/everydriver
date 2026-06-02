import { Star } from "lucide-react";
import { useInstructorRating, hasEnoughReviews } from "@/hooks/useInstructorRating";
import { cn } from "@/lib/utils";

interface Props {
  instructorId?: string | null;
  size?: "sm" | "md";
  className?: string;
  /** Tone affects the "New instructor" pill background. */
  tone?: "light" | "dark";
  /** When true, hide entirely below the threshold instead of showing "New". */
  hideWhenNew?: boolean;
}

/**
 * Renders ★ 4.8 · 42 reviews from the live `instructor_rating_summary` view.
 * Falls back to "New instructor" below the 3-review threshold.
 */
export function InstructorRatingBadge({
  instructorId,
  size = "sm",
  className,
  tone = "light",
  hideWhenNew = false,
}: Props) {
  const { data, isLoading } = useInstructorRating(instructorId);

  if (!instructorId || isLoading) return null;

  const enough = hasEnoughReviews(data);
  const textSize = size === "md" ? "text-sm" : "text-xs";

  if (!enough) {
    if (hideWhenNew) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
          textSize,
          tone === "dark"
            ? "bg-white/15 text-white/80"
            : "bg-muted text-muted-foreground",
          className,
        )}
      >
        New instructor
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1", textSize, className)}>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold">{data!.avgRating?.toFixed(1)}</span>
      <span className={tone === "dark" ? "text-white/70" : "text-muted-foreground"}>
        · {data!.totalReviews} {data!.totalReviews === 1 ? "review" : "reviews"}
      </span>
    </span>
  );
}
