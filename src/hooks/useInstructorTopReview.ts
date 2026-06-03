import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorTopReview {
  snippet: string;
  reviewerFirstName: string;
  rating: number;
}

/**
 * Returns the most recent visible 5-star review for an instructor,
 * trimmed to ~120 chars. Returns null when no qualifying review exists.
 */
export function useInstructorTopReview(instructorId?: string | null) {
  return useQuery({
    queryKey: ["instructor-top-review", instructorId],
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<InstructorTopReview | null> => {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("review_text, reviewer_name, rating")
        .eq("instructor_id", instructorId!)
        .eq("is_visible", true)
        .eq("moderation_status", "approved")
        .gte("rating", 5)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const snippet = data.review_text.length > 120
        ? data.review_text.slice(0, 117).trimEnd() + "…"
        : data.review_text;
      return {
        snippet,
        reviewerFirstName: (data.reviewer_name ?? "").split(" ")[0] || "Anonymous",
        rating: data.rating,
      };
    },
  });
}
