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


      {/* 4. News & tips */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 28, border: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#E8641A", textTransform: "uppercase", letterSpacing: "1.5px" }}>LATEST FROM EVERYDRIVER</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0A1628", margin: "4px 0 0" }}>News & tips</h3>
          </div>
          <Link to="/news" style={{ fontSize: 11, fontWeight: 600, color: "#0070C0", textDecoration: "none" }}>
            View all articles →
          </Link>
        </div>

        {recentNews.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 }}>
            {mainArticle && (
              <Link to={`/news/${mainArticle.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block", borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6" }}>
                <div style={{ height: 140, background: mainArticle.imageUrl ? `url(${mainArticle.imageUrl}) center/cover` : "linear-gradient(135deg, #0A2B6B, #1E4D9B)" }} />
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#E8641A", textTransform: "uppercase" }}>DRIVING NEWS</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0A1628", margin: "4px 0" }}>{mainArticle.title}</h4>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                    {mainArticle.pubDate ? new Date(mainArticle.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""} • 3 min read
                  </div>
                </div>
              </Link>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sideArticles.map((a) => (
                <Link key={a.slug} to={`/news/${a.slug}`} style={{ textDecoration: "none", color: "inherit", display: "flex", gap: 10, border: "1px solid #F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ width: 80, minWidth: 80, background: a.imageUrl ? `url(${a.imageUrl}) center/cover` : "linear-gradient(135deg, #0A2B6B, #1E4D9B)" }} />
                  <div style={{ padding: "10px 10px 10px 0", flex: 1 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: "#E8641A", textTransform: "uppercase" }}>DRIVING NEWS</div>
                    <h5 style={{ fontSize: 12, fontWeight: 700, color: "#0A1628", margin: "2px 0" }}>{a.title}</h5>
                    <div style={{ fontSize: 9, color: "#9CA3AF" }}>
                      {a.pubDate ? new Date(a.pubDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""} • 3 min read
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#9CA3AF", padding: "20px 0" }}>No articles available right now.</div>
        )}
      </div>

      </div>
    </section>
  );

}
