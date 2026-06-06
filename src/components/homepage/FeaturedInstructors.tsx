import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import richardPhoto from "@/assets/testimonial-james.jpg";
import kenPhoto from "@/assets/ken-d-hero.jpg";
import sarahPhoto from "@/assets/testimonial-sarah-m.jpg";


interface InstructorRow {
  id: string;
  name: string;
  profile_image_url: string | null;
  hourly_rate: number | null;
  home_postcode: string | null;
  location_name: string | null;
  app_slug: string | null;
}

interface ReviewRow {
  instructor_id: string;
  review_text: string;
  reviewer_name: string | null;
  passed_first_time: boolean | null;
  created_at: string;
}

interface ScoredInstructor {
  id: string;
  name: string;
  photo: string | null;
  hourly_rate: number | null;
  location: string | null;
  app_slug: string | null;
  avg_rating: number;
  total_reviews: number;
  pass_rate: number | null;
  score: number;
  review?: ReviewRow;
  badge?: "reviews" | "rating" | "pass";
  isPlaceholder?: boolean;
  googleBacked?: boolean;
  googleQuery?: string;
}

const ACCENTS = [
  { bar: "#E8641A", avatar: "#E8641A", quoteBg: "#FFF7ED", quoteBorder: "#E8641A", btnBg: "#E8641A", border: "2px solid #E8641A" },
  { bar: "#0A2B6B", avatar: "#1E4D9B", quoteBg: "#F8FAFF", quoteBorder: "#0A2B6B", btnBg: "#0A1628", border: "1px solid #E5E7EB" },
  { bar: "#059669", avatar: "#059669", quoteBg: "#F0FDF4", quoteBorder: "#059669", btnBg: "#0A1628", border: "1px solid #E5E7EB" },
];

const BADGES = {
  reviews: { label: "💬 Most reviewed", bg: "#FFF7ED", border: "#FED7AA", color: "#E8641A" },
  rating: { label: "⭐ Highest rated", bg: "#EFF6FF", border: "#BFDBFE", color: "#0A2B6B" },
  pass: { label: "🎯 Best pass rate", bg: "#F0FDF4", border: "#BBF7D0", color: "#059669" },
} as const;

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function truncate(text: string, n = 80) {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
}

interface GoogleData {
  rating: number | null;
  userRatingsTotal: number | null;
  reviews: GoogleReview[];
  photoReference?: string | null;
}

const PLACEHOLDERS: (ScoredInstructor & { matchSlug?: string })[] = [
  {
    id: "placeholder-richard",
    name: "Richard Chapman",
    photo: richardPhoto,
    hourly_rate: null,
    location: "Winchester",
    app_slug: null,
    avg_rating: 0,
    total_reviews: 0,
    pass_rate: null,
    score: 0,
    isPlaceholder: true,
    googleQuery: "Chapman's Driving School Winchester",
    matchSlug: "richard-chapman",
  },
  {
    id: "placeholder-ken",
    name: "Ken D",
    photo: kenPhoto,
    hourly_rate: null,
    location: null,
    app_slug: null,
    avg_rating: 0,
    total_reviews: 0,
    pass_rate: null,
    score: 0,
    isPlaceholder: true,
    matchSlug: "ken-d",
  },
  {
    id: "placeholder-sarah",
    name: "Sarah M",
    photo: sarahPhoto,
    hourly_rate: null,
    location: "Southampton",
    app_slug: null,
    avg_rating: 0,
    total_reviews: 0,
    pass_rate: null,
    score: 0,
    isPlaceholder: true,
    matchSlug: "sarah-mitchell",
  },
];

export function FeaturedInstructors() {

  const [instructors, setInstructors] = useState<ScoredInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleData, setGoogleData] = useState<Record<string, GoogleData>>({});
  const [nextAvailable, setNextAvailable] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Active, non-placeholder instructors (via public view so anon can read)
      const { data: insRows } = await supabase
        .from("public_instructors" as any)
        .select("id, name, profile_image_url, hourly_rate, home_postcode, location_name, app_slug, is_active, is_network_placeholder")
        .eq("is_active", true)
        .eq("is_network_placeholder", false);
      if (!insRows || insRows.length === 0) {
        if (!cancelled) { setInstructors(PLACEHOLDERS); setLoading(false); }
        return;
      }
      const ids = (insRows as any[]).map((r) => r.id);

      // 2. Ratings summary
      const { data: ratings } = await supabase
        .from("instructor_rating_summary" as any)
        .select("instructor_id, avg_rating, total_reviews")
        .in("instructor_id", ids);
      const ratingMap = new Map<string, { avg: number; total: number }>();
      for (const r of (ratings ?? []) as any[]) {
        ratingMap.set(r.instructor_id, {
          avg: r.avg_rating != null ? Number(r.avg_rating) : 0,
          total: r.total_reviews ?? 0,
        });
      }

      // 3. Pass rate from driving_test_results (non-mock)
      const { data: tests } = await supabase
        .from("driving_test_results")
        .select("instructor_id, result, is_mock")
        .in("instructor_id", ids)
        .eq("is_mock", false);
      const passMap = new Map<string, { total: number; passed: number }>();
      for (const t of (tests ?? []) as any[]) {
        const entry = passMap.get(t.instructor_id) ?? { total: 0, passed: 0 };
        entry.total += 1;
        if (t.result === "pass") entry.passed += 1;
        passMap.set(t.instructor_id, entry);
      }

      // 4. Build scored list with filters
      const scored: ScoredInstructor[] = (insRows as unknown as InstructorRow[])
        .map((row) => {
          const r = ratingMap.get(row.id) ?? { avg: 0, total: 0 };
          const p = passMap.get(row.id);
          const pass_rate = p && p.total > 0 ? (p.passed / p.total) * 100 : null;
          const score = r.total * 0.4 + r.avg * 10 * 0.3 + (pass_rate ?? 0) * 0.3;
          return {
            id: row.id,
            name: row.name,
            photo: row.profile_image_url,
            hourly_rate: row.hourly_rate,
            location: row.location_name ?? (row.home_postcode ? row.home_postcode.split(" ")[0] : null),
            app_slug: row.app_slug,
            avg_rating: r.avg,
            total_reviews: r.total,
            pass_rate,
            score,
          };
        })
        .filter((i) =>
          i.total_reviews >= 5 &&
          i.avg_rating >= 4.5 &&
          (i.pass_rate === null || i.pass_rate >= 85)
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      // 5. Assign merit badges (one per real instructor based on highest metric)
      const real = scored.filter((i) => !i.isPlaceholder);
      if (real.length > 0) {
        const topReviews = real.reduce((a, b) => (b.total_reviews > a.total_reviews ? b : a));
        const topRating = real.reduce((a, b) => (b.avg_rating > a.avg_rating ? b : a));
        const withPass = real.filter((i) => i.pass_rate !== null);
        const topPass = withPass.length ? withPass.reduce((a, b) => ((b.pass_rate ?? 0) > (a.pass_rate ?? 0) ? b : a)) : null;
        const assigned = new Set<string>();
        function assign(target: ScoredInstructor | null, badge: ScoredInstructor["badge"]) {
          if (!target || assigned.has(target.id)) return;
          target.badge = badge;
          assigned.add(target.id);
        }
        assign(topReviews, "reviews");
        assign(topRating, "rating");
        assign(topPass, "pass");
        const fallbackOrder: ScoredInstructor["badge"][] = ["reviews", "rating", "pass"];
        for (const i of real) {
          if (!i.badge) i.badge = fallbackOrder.find((b) => ![...assigned].some((id) => real.find((s) => s.id === id)?.badge === b)) ?? "reviews";
        }
      }

      // 6. Build final list: Richard pinned to slot 0 (hydrated from DB if his account exists),
      //    then real CRM-qualified instructors, then any remaining placeholders (e.g. Ken D).
      const bySlug = new Map<string, InstructorRow>();
      for (const row of insRows as unknown as InstructorRow[]) {
        if (row.app_slug) bySlug.set(row.app_slug, row);
      }
      function hydratePlaceholder(p: typeof PLACEHOLDERS[number]): ScoredInstructor {
        if (!p.matchSlug) return { ...p };
        const realRow = bySlug.get(p.matchSlug);
        if (!realRow) return { ...p };
        return {
          ...p,
          id: realRow.id,
          photo: realRow.profile_image_url ?? p.photo,
          hourly_rate: realRow.hourly_rate,
          location: realRow.location_name ?? (realRow.home_postcode ? realRow.home_postcode.split(" ")[0] : p.location),
          app_slug: realRow.app_slug,
          isPlaceholder: false,
          googleBacked: true,
        };
      }
      const realIdsAlreadyShown = new Set<string>();
      const richard = hydratePlaceholder(PLACEHOLDERS[0]);
      const finalList: ScoredInstructor[] = [richard];
      if (!richard.isPlaceholder) realIdsAlreadyShown.add(richard.id);
      for (const s of scored) {
        if (finalList.length >= 3) break;
        if (realIdsAlreadyShown.has(s.id)) continue;
        finalList.push(s);
        realIdsAlreadyShown.add(s.id);
      }
      for (let i = 1; i < PLACEHOLDERS.length && finalList.length < 3; i++) {
        const hydrated = hydratePlaceholder(PLACEHOLDERS[i]);
        if (realIdsAlreadyShown.has(hydrated.id)) continue;
        finalList.push(hydrated);
        if (!hydrated.isPlaceholder) realIdsAlreadyShown.add(hydrated.id);
      }
      scored.length = 0;
      scored.push(...finalList);

      // 7. Most recent approved review per instructor (skip placeholders)
      const realIds = real.map((s) => s.id);
      if (realIds.length > 0) {
        const { data: reviews } = await supabase
          .from("course_reviews")
          .select("instructor_id, review_text, reviewer_name, passed_first_time, created_at")
          .in("instructor_id", realIds)
          .eq("is_visible", true)
          .eq("moderation_status", "approved")
          .order("created_at", { ascending: false });
        const reviewMap = new Map<string, ReviewRow>();
        for (const r of (reviews ?? []) as ReviewRow[]) {
          if (!reviewMap.has(r.instructor_id)) reviewMap.set(r.instructor_id, r);
        }
        for (const i of scored) i.review = reviewMap.get(i.id);
      }

      if (!cancelled) { setInstructors(scored); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch Google reviews for cards backed by Google (placeholders or hydrated real instructors)
  useEffect(() => {
    let cancelled = false;
    const targets = instructors.filter((i) => i.googleQuery);
    for (const ins of targets) {
      if (!ins.googleQuery || googleData[ins.id]) continue;
      const cacheKey = ins.googleBacked ? `slug:${ins.app_slug ?? ins.id}` : ins.id;
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("fetch-google-reviews", {
            body: { query: ins.googleQuery, cacheKey },
          });
          if (cancelled || error || !data) return;
          setGoogleData((prev) => ({
            ...prev,
            [ins.id]: {
              rating: data.rating ?? null,
              userRatingsTotal: data.userRatingsTotal ?? null,
              reviews: data.reviews ?? [],
              photoReference: data.photoReference ?? null,
            },
          }));
        } catch (e) {
          console.error("Google reviews fetch failed:", e);
        }
      })();
    }
    return () => { cancelled = true; };
  }, [instructors]);

  // Fetch next available date per real instructor via public-courses edge function.
  // Auto-refreshes every 5 minutes and whenever the tab regains focus so newly
  // booked / cancelled diary entries surface without a page reload.
  useEffect(() => {
    let cancelled = false;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const fetchAll = async () => {
      const targets = instructors.filter((i) => !i.isPlaceholder && i.app_slug);
      await Promise.all(targets.map(async (ins) => {
        try {
          const res = await fetch(
            `${supabaseUrl}/functions/v1/public-courses?slug=${encodeURIComponent(ins.app_slug!)}`,
            { headers: { apikey, Authorization: `Bearer ${apikey}` }, cache: "no-store" }
          );
          if (!res.ok) return;
          const data = await res.json();
          const date: string | null = data?.courses?.[0]?.nextAvailable ?? null;
          if (cancelled || !date) return;
          setNextAvailable((prev) => (prev[ins.id] === date ? prev : { ...prev, [ins.id]: date }));
        } catch (e) {
          console.error("next-available fetch failed:", e);
        }
      }));
    };

    fetchAll();
    const interval = window.setInterval(fetchAll, 5 * 60 * 1000);
    const onFocus = () => { if (document.visibilityState === "visible") fetchAll(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [instructors]);

  function formatNextAvailable(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12));
    const diffDays = Math.round((date.getTime() - todayUtc.getTime()) / 86400000);
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  }


  if (loading || instructors.length === 0) return null;

  const CARD_THEMES = [
    { bar: "#E8600A", bg: "#FFF8F4", avatar: "#E8600A", badgeBg: "#FFEDD5", badgeColor: "#9A3412", btn: "#E8600A" },
    { bar: "#0A2B6B", bg: "#F4F7FC", avatar: "#0A2B6B", badgeBg: "#DBE4F4", badgeColor: "#0A2B6B", btn: "#0A2B6B" },
    { bar: "#1A7D4E", bg: "#F3FAF6", avatar: "#1A7D4E", badgeBg: "#D6F0E1", badgeColor: "#0F5A37", btn: "#1A7D4E" },
  ];

  const STANDARD_PILLS = ["✓ DBS checked", "✓ DVSA approved", "✓ Pupil reviewed"];

  function renderStars(rating: number) {
    const full = Math.round(rating);
    return "★★★★★".split("").map((_, i) => (
      <span key={i} style={{ color: i < full ? "#F5B400" : "#D1D5DB", fontSize: 10, letterSpacing: 1 }}>★</span>
    ));
  }

  return (
    <section style={{ background: "#F6F6F8", padding: "40px 5%", fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#D12E2E", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>
              Featured instructors
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0A1936", letterSpacing: -0.3, margin: 0 }}>
              Chosen by our pupils.
            </h2>
          </div>
          <Link to="/courses" style={{ fontSize: 13, fontWeight: 600, color: "#0070C0", textDecoration: "none" }}>
            See all instructors →
          </Link>
        </div>

        {/* Every Driver Standard strip */}
        <div
          style={{
            background: "#0A2B6B",
            borderRadius: 8,
            padding: "14px 20px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
          className="every-driver-standard-strip"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 auto", minWidth: 0 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD66B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <div style={{ color: "#fff", fontSize: 13, lineHeight: 1.45 }}>
              <span style={{ fontWeight: 700 }}>The Every Driver Standard</span>
              <span style={{ opacity: 0.85 }}> — every instructor is personally vetted before they take a single booking.</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STANDARD_PILLS.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 11, fontWeight: 600, color: "#fff",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(instructors.length, 3)}, 1fr)`,
            gap: 16,
          }}
          className="featured-instructors-grid"
        >
          {instructors.map((ins, idx) => {
            const theme = CARD_THEMES[idx] ?? CARD_THEMES[2];
            const profileHref = ins.app_slug ? `/i/${ins.app_slug}` : `/courses`;
            const firstName = ins.name.split(" ")[0] || ins.name;

            // Resolve live data (real instructor first, Google-backed fallback)
            const g = googleData[ins.id];
            const topGoogleReview = g?.reviews?.find((r) => r.text && r.text.length > 20) ?? g?.reviews?.[0];
            const ratingValue =
              !ins.isPlaceholder && !ins.googleBacked && ins.avg_rating > 0
                ? ins.avg_rating
                : g?.rating ?? null;
            const reviewCount =
              !ins.isPlaceholder && !ins.googleBacked && ins.total_reviews > 0
                ? ins.total_reviews
                : g?.userRatingsTotal ?? null;
            const passRate = ins.pass_rate;

            const badgeLabel = ins.badge === "rating"
              ? "Highest rated"
              : ins.badge === "pass"
              ? "Best pass rate"
              : (ins.googleBacked || (ins.isPlaceholder && g)) ? "Verified on Google" : "Most reviewed";

            const reviewText = ins.review?.review_text ?? topGoogleReview?.text ?? null;
            const reviewerName = ins.review?.reviewer_name ?? topGoogleReview?.author_name ?? null;
            const passedFirstTime = ins.review?.passed_first_time;

            return (
              <Link
                key={ins.id}
                to={profileHref}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  background: theme.bg,
                  border: "1px solid #E5E7EB",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 2px rgba(10,25,54,0.04)",
                }}
              >
                {/* Top accent bar */}
                <div style={{ height: 4, background: theme.bar }} />

                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                  {/* Avatar + name + area */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {(() => {
                      const gPhotoRef = ins.isPlaceholder ? googleData[ins.id]?.photoReference : null;
                      const photoSrc = ins.photo
                        ?? (gPhotoRef
                          ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-place-photo?ref=${encodeURIComponent(gPhotoRef)}&maxwidth=200`
                          : null);
                      return photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={ins.name}
                          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 48, height: 48, borderRadius: "50%",
                            background: theme.avatar, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 600, fontSize: 16, flexShrink: 0,
                          }}
                        >
                          {initials(ins.name)}
                        </div>
                      );
                    })()}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#0A1936", lineHeight: 1.2 }}>
                        {ins.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                        {[ins.location, ins.hourly_rate ? `£${ins.hourly_rate}/hr` : null].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11, fontWeight: 600,
                        background: theme.badgeBg, color: theme.badgeColor,
                        padding: "4px 10px", borderRadius: 999,
                      }}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Stat boxes */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: "1px solid #EEF0F3" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#0A1936", lineHeight: 1 }}>
                          {ratingValue != null ? ratingValue.toFixed(1) : "—"}
                        </div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>
                          {reviewCount != null ? `${reviewCount} reviews` : "No reviews"}
                        </div>
                      </div>
                      <div style={{ marginTop: 4, display: "flex", gap: 1 }}>
                        {ratingValue != null ? renderStars(ratingValue) : <span style={{ fontSize: 10, color: "#9CA3AF" }}>—</span>}
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: "1px solid #EEF0F3" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#0A1936", lineHeight: 1 }}>
                        {passRate != null ? `${Math.round(passRate)}%` : "—"}
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                        Pass rate
                      </div>
                    </div>
                  </div>

                  {/* Availability pill */}
                  {nextAvailable[ins.id] && (
                    <div>
                      <span
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "#E7F8EE", color: "#0F5A37",
                          fontSize: 11, fontWeight: 600,
                          padding: "5px 10px", borderRadius: 999,
                          border: "1px solid #BFE6CE",
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A7D4E" }} />
                        Available {formatNextAvailable(nextAvailable[ins.id])}
                      </span>
                    </div>
                  )}

                  {/* Review quote */}
                  {reviewText && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontStyle: "italic", color: "#374151", lineHeight: 1.55 }}>
                        "{truncate(reviewText, 110)}"
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                        — {reviewerName || "Anonymous"}
                        {passedFirstTime ? " · Passed 1st time" : ""}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div
                    style={{
                      marginTop: "auto",
                      width: "100%", padding: "10px 14px",
                      borderRadius: 8, background: theme.btn, color: "#fff",
                      fontSize: 13, fontWeight: 600, textAlign: "center",
                    }}
                  >
                    Book {firstName} →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .featured-instructors-grid {
            grid-template-columns: 1fr !important;
          }
          .every-driver-standard-strip {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
}

export default FeaturedInstructors;
