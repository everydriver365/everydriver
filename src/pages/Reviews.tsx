import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWhitelabelConfig, getWhitelabelInstructorSlug } from "@/lib/whitelabel";

interface Review {
  id: string;
  reviewer_name: string;
  review_text: string;
  rating: number;
  course_hours: number;
  review_date: string | null;
  is_verified: boolean | null;
}

export default function Reviews() {
  const whitelabel = getWhitelabelConfig();
  const brandName = whitelabel?.brandName || "Drive365";
  const slug = getWhitelabelInstructorSlug();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      // Resolve instructor_id when scoped to a whitelabel host
      let instructorId: string | null = null;
      if (slug) {
        const { data: inst } = await supabase
          .from("public_instructors")
          .select("id")
          .eq("app_slug", slug)
          .maybeSingle();
        instructorId = inst?.id ?? null;
      }

      let query = supabase
        .from("course_reviews")
        .select("id, reviewer_name, review_text, rating, course_hours, review_date, is_verified")
        .eq("is_visible", true)
        .eq("moderation_status", "approved")
        .order("review_date", { ascending: false })
        .limit(60);

      if (instructorId) query = query.eq("instructor_id", instructorId);

      const { data } = await query;
      if (!cancelled) {
        setReviews((data as Review[] | null) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const stats = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { avg: sum / reviews.length, count: reviews.length };
  }, [reviews]);

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            What learners say about {brandName}
          </h1>
          {stats.count > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(stats.avg)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-foreground">
                {stats.avg.toFixed(1)}
              </span>
              <span>· {stats.count} review{stats.count === 1 ? "" : "s"}</span>
            </div>
          )}
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 w-1/3 rounded bg-muted mb-3" />
                  <div className="h-3 w-full rounded bg-muted mb-2" />
                  <div className="h-3 w-5/6 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No reviews yet. Be the first to share your experience.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-foreground">{r.reviewer_name}</div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < r.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {r.review_text}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground/80">
                    {r.course_hours}h course
                    {r.review_date && ` · ${new Date(r.review_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
                    {r.is_verified && " · Verified"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
