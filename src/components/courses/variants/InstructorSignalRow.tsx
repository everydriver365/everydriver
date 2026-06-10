import { Star, BadgeCheck } from "lucide-react";
import { useInstructorRating, hasEnoughReviews } from "@/hooks/useInstructorRating";
import { useVerifiedProSummary } from "@/hooks/useVerifiedProSummary";
import { useInstructorTopReview } from "@/hooks/useInstructorTopReview";
import { cn } from "@/lib/utils";

interface Props {
  instructorId: string;
  tone?: "light" | "dark";
  showSnippet?: boolean;
  snippetClamp?: 1 | 2;
  className?: string;
}

/**
 * Live instructor trust signals: ★ rating · N reviews · Verified Pro chip
 * + optional review snippet underneath.
 */
export function InstructorSignalRow({
  instructorId,
  tone = "light",
  showSnippet = true,
  snippetClamp = 1,
  className,
}: Props) {
  const { data: rating } = useInstructorRating(instructorId);
  const { data: verified } = useVerifiedProSummary(instructorId);
  const { data: review } = useInstructorTopReview(instructorId);

  const enough = hasEnoughReviews(rating);
  const isVerified = !!verified?.badge_enabled && (verified.verified_credential_count > 0 || verified.is_founding);
  const muted = tone === "dark" ? "text-white/70" : "text-muted-foreground";
  const chip = tone === "dark"
    ? "bg-white/15 text-white border-white/20"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* When we have a review snippet, skip the rating count row to avoid showing
            two review signals on the same card. Keep the Verified Pro chip. */}
        {enough && !(showSnippet && review) && (
          <span className="inline-flex items-center gap-1 text-xs">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{rating!.avgRating?.toFixed(1)}</span>
            <span className={muted}>· {rating!.totalReviews} reviews</span>
          </span>
        )}
        {isVerified && (
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", chip)}>
            <BadgeCheck className="h-3 w-3" />
            Verified Pro
          </span>
        )}
      </div>
      {showSnippet && review && (
        <p
          className={cn("text-xs italic leading-snug", muted)}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: snippetClamp,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          “{review.snippet}” <span className="not-italic">— {review.reviewerFirstName}</span>
        </p>
      )}
    </div>
  );
}
