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

      {/* 1. Trust bar */}
      <div
        style={{
          background: "#0A1628",
          borderRadius: 10,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {[
          {
            icon: "⭐",
            title: "Rated 4.9 / 5",
            sub: "2,400+ verified reviews",
          },
          {
            icon: "🛡",
            title: "Pass Promise",
            sub: "Free re-test guaranteed",
          },
          {
            icon: "✅",
            title: "DVSA verified",
            sub: "Every instructor checked",
          },
        ].map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 180, borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none", height: 28 }}>
            <span style={{ fontSize: 16 }}>{it.icon}</span>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>{it.title}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{it.sub}</span>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220 }}>
          <span style={{ background: "#FFB3C7", color: "#17120F", fontFamily: "system-ui", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 999 }}>Klarna</span>
          <span style={{ background: "#B2FCE4", color: "#000E18", fontFamily: "system-ui", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 999 }}>Clearpay</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, marginLeft: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>Pay your way</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>No upfront lump sum</span>
          </div>
        </div>
      </div>

      {/* 2. Learner stories */}
      <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 32, border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#E8641A", textTransform: "uppercase", letterSpacing: "1.5px" }}>
          LEARNER STORIES
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0A1628", margin: "4px 0 4px" }}>
          Every learner's journey starts here.
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
          From first lesson nerves to passing-day celebrations.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "20px 0" }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ background: "#F8FAFF", borderRadius: 10, padding: 16, borderLeft: `4px solid ${r.accent}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: r.accent, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {r.initials}
                </div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0A1628" }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>{r.course}</span>
                </div>
              </div>
              <div style={{ color: "#FBBF24", fontSize: 11, marginBottom: 6 }}>★★★★★</div>
              <p style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.6, fontStyle: "italic", margin: "0 0 10px" }}>
                "{r.text}"
              </p>
              <span style={{ background: "#D1FAE5", color: "#059669", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999, display: "inline-block" }}>
                ✓ Passed 1st time
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F3F4F6", paddingTop: 16, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { value: "15,000", suffix: "+", label: "Students passed" },
              { value: "780", suffix: "", label: "Tests taken" },
              { value: "650", suffix: "+", label: "Instructors" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0A1628" }}>
                  {s.value}
                  <span style={{ color: "#E8641A" }}>{s.suffix}</span>
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <Link to="/courses" style={{ background: "#E8641A", color: "#FFFFFF", borderRadius: 7, padding: "10px 20px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            Start your journey →
          </Link>
        </div>
      </div>

      {/* 3. Video section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: 14, overflow: "hidden", border: "1px solid #E5E7EB" }}>
        <Link
          to="/about"
          style={{
            background: "linear-gradient(135deg, #0A2B6B, #0A1628)",
            minHeight: 220,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.5)", color: "#FFFFFF", fontSize: 9, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
            2 MIN WATCH
          </span>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: "#E8641A", boxShadow: "0 4px 20px rgba(232,100,26,0.4)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            ▶
          </div>
        </Link>
        <div style={{ background: "#FFFFFF", padding: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#E8641A", textTransform: "uppercase", letterSpacing: "1.5px" }}>OUR STORY</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0A1628", margin: "6px 0" }}>
            Watch how learners pass with <span style={{ color: "#E8641A" }}>confidence.</span>
          </h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 12px" }}>
            Discover why thousands of learners trust us with their driving journey.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex" }}>
              {["S", "J", "E", "P"].map((l, i) => (
                <div key={i} style={{ width: 24, height: 24, borderRadius: 999, background: ACCENTS[i % 3], color: "#FFFFFF", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i === 0 ? 0 : -8, border: "2px solid #FFFFFF" }}>
                  {l}
                </div>
              ))}
            </div>
            <span style={{ color: "#FBBF24", fontSize: 12 }}>★★★★★</span>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>4.9 from 6,499 learner reviews</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/about" style={{ background: "#E8641A", color: "#FFFFFF", borderRadius: 7, padding: "9px 16px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>▶ Play video</Link>
            <Link to="/instructors" style={{ background: "#FFFFFF", color: "#0070C0", border: "1.5px solid #0070C0", borderRadius: 7, padding: "9px 16px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Find an instructor →</Link>
          </div>
        </div>
      </div>

      {/* 4. Instructor recruitment */}
      <div style={{ background: "#0A2B6B", borderRadius: 14, padding: "28px 32px", display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
        <div>
          <span style={{ background: "#E8641A", color: "#FFFFFF", fontSize: 9, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "inline-block", marginBottom: 10 }}>
            ● Now recruiting
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", margin: "0 0 6px" }}>Are you a driving instructor?</h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "0 0 12px" }}>
            Join the EveryDriver franchise — free private healthcare, £50 bonus every time a pupil passes, and the best tech platform in the business.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "Free private healthcare",
              "£50 bonus every time a pupil passes",
              "Best tech platform in the business",
            ].map((b, i) => (
              <li key={i} style={{ fontSize: 12, color: "#FFFFFF" }}>
                <span style={{ color: "#22C55E", marginRight: 8, fontWeight: 700 }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>From just</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>£25</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>per week</div>
          <Link to="/become-instructor" style={{ background: "#E8641A", color: "#FFFFFF", borderRadius: 7, padding: "10px 18px", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
            Learn more →
          </Link>
        </div>
      </div>

      {/* 5. News & tips */}
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

      {/* 6. Platform overview */}
      <div style={{ background: "#0A1628", borderRadius: 14, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ background: "rgba(232,100,26,0.2)", border: "1px solid rgba(232,100,26,0.3)", color: "#E8641A", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, display: "inline-block", marginBottom: 10 }}>
            All-in-one platform
          </span>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", margin: "0 0 6px" }}>
            Everything you need to <span style={{ color: "#E8641A" }}>learn to drive.</span>
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Our platform connects learners, instructors, and parents in one seamless experience.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { tag: "FOR PARENTS", tagColor: "#D12E2E", title: "Parent Portal", desc: "Stay informed with lesson updates and payment visibility", link: "Learn more →", to: "/parents", gradient: "linear-gradient(135deg, #D12E2E, #B02222)", emoji: "👨‍👩‍👧" },
            { tag: "FOR LEARNERS", tagColor: "#E8641A", title: "Local Instructors", desc: "Find certified instructors near you by postcode. Search and compare prices 24/7", link: "Find an instructor →", to: "/instructors", gradient: "linear-gradient(135deg, #E8641A, #C8520E)", emoji: "🚗" },
            { tag: "FOR EVERYONE", tagColor: "#059669", title: "Track Progress", desc: "Monitor your journey with detailed progress reports", link: "Learn more →", to: "/pupil", gradient: "linear-gradient(135deg, #059669, #047857)", emoji: "📊" },
          ].map((c, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: 100, background: c.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>
                {c.emoji}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: c.tagColor, textTransform: "uppercase", marginBottom: 4 }}>{c.tag}</div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px" }}>{c.title}</h4>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: "0 0 8px" }}>{c.desc}</p>
                <Link to={c.to} style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>{c.link}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
