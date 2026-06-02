import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorRating {
  instructorId: string;
  avgRating: number | null;
  totalReviews: number;
  lastReviewAt: string | null;
}

const STALE = 5 * 60 * 1000;
const MIN_REVIEWS_FOR_SCORE = 3;

/** Single instructor rating from the `instructor_rating_summary` view. */
export function useInstructorRating(instructorId?: string | null) {
  return useQuery({
    queryKey: ["instructor-rating", instructorId],
    enabled: !!instructorId,
    staleTime: STALE,
    queryFn: async (): Promise<InstructorRating> => {
      const { data, error } = await supabase
        .from("instructor_rating_summary" as any)
        .select("instructor_id, avg_rating, total_reviews, last_review_at")
        .eq("instructor_id", instructorId!)
        .maybeSingle();
      if (error) throw error;
      const row: any = data;
      return {
        instructorId: instructorId!,
        avgRating: row?.avg_rating != null ? Number(row.avg_rating) : null,
        totalReviews: row?.total_reviews ?? 0,
        lastReviewAt: row?.last_review_at ?? null,
      };
    },
  });
}

/** Batch fetch for lists (course search, directory). */
export function useInstructorRatings(instructorIds: string[]) {
  const ids = Array.from(new Set(instructorIds.filter(Boolean))).sort();
  return useQuery({
    queryKey: ["instructor-ratings", ids],
    enabled: ids.length > 0,
    staleTime: STALE,
    queryFn: async (): Promise<Record<string, InstructorRating>> => {
      const { data, error } = await supabase
        .from("instructor_rating_summary" as any)
        .select("instructor_id, avg_rating, total_reviews, last_review_at")
        .in("instructor_id", ids);
      if (error) throw error;
      const map: Record<string, InstructorRating> = {};
      for (const id of ids) {
        map[id] = { instructorId: id, avgRating: null, totalReviews: 0, lastReviewAt: null };
      }
      for (const row of (data ?? []) as any[]) {
        map[row.instructor_id] = {
          instructorId: row.instructor_id,
          avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
          totalReviews: row.total_reviews ?? 0,
          lastReviewAt: row.last_review_at ?? null,
        };
      }
      return map;
    },
  });
}

export function hasEnoughReviews(r?: { totalReviews: number } | null): boolean {
  return !!r && r.totalReviews >= MIN_REVIEWS_FOR_SCORE;
}

export { MIN_REVIEWS_FOR_SCORE };
