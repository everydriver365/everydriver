import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDVSANews } from "@/hooks/useDVSANews";

type Review = {
  name: string;
  course: string;
  text: string;
  initials: string;
  accent: string;
};

const FALLBACK_REVIEWS: Review[] = [
  {
    name: "Sarah M.",
    course: "5-Day Intensive",
    text: "The intensive course was exactly what I needed. My instructor was patient and really focused on my weak points.",
    initials: "SM",
    accent: "#0A2B6B",
  },
  {
    name: "Emily R.",
    course: "Semi-Intensive",
    text: "I went from being terrified of roundabouts to navigating them with ease. Best decision I ever made.",
    initials: "ER",
    accent: "#E8641A",
  },
  {
    name: "Priya T.",
    course: "10-Day Course",
    text: "Working full-time made it hard to learn, but the flexible scheduling meant I could fit lessons around my job.",
    initials: "PT",
    accent: "#059669",
  },
];

const ACCENTS = ["#0A2B6B", "#E8641A", "#059669"];

function initialsFrom(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function HomepageExtraSections() {
  const { news } = useDVSANews();
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("reviews" as any)
          .select("reviewer_name, course_type, review_text, rating")
          .eq("is_approved", true)
          .gte("rating", 5)
          .order("created_at", { ascending: false })
          .limit(3);
        if (cancelled || !data || data.length === 0) return;
        const mapped: Review[] = data.map((r: any, i: number) => ({
          name: r.reviewer_name || "Learner",
          course: r.course_type || "Driving Lessons",
          text: r.review_text || "",
          initials: initialsFrom(r.reviewer_name || "L"),
          accent: ACCENTS[i % 3],
        }));
        setReviews(mapped);
      } catch {
        // keep fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recentNews = news.slice(0, 3);
  const mainArticle = recentNews[0];
  const sideArticles = recentNews.slice(1, 3);

  return (
    <section style={{ background: "#F6F6F8", padding: "32px 5%" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>



      {/* Video section moved to render under the hero (see Index.tsx afterHero) */}



      </div>
    </section>
  );

}
