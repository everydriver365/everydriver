import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface InstructorRow {
  id: string;
  name: string;
  profile_image_url: string | null;
  hourly_rate: number | null;
  home_postcode: string | null;
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
    photo: null,
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
    photo: null,
    hourly_rate: null,
    location: null,
    app_slug: null,
    avg_rating: 0,
    total_reviews: 0,
    pass_rate: null,
    score: 0,
    isPlaceholder: true,
  },
];

export function FeaturedInstructors() {
  const [instructors, setInstructors] = useState<ScoredInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleData, setGoogleData] = useState<Record<string, GoogleData>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Active, non-placeholder instructors (via public view so anon can read)
      const { data: insRows } = await supabase
        .from("public_instructors" as any)
        .select("id, name, profile_image_url, hourly_rate, home_postcode, app_slug, is_active, is_network_placeholder")
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
            location: row.home_postcode ? row.home_postcode.split(" ")[0] : null,
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
          photo: realRow.profile_image_url,
          hourly_rate: realRow.hourly_rate,
          location: realRow.home_postcode ? realRow.home_postcode.split(" ")[0] : p.location,
          app_slug: realRow.app_slug,
          isPlaceholder: false,
          googleBacked: true,
        };
      }
      const realIdsAlreadyShown = new Set(scored.map((s) => s.id));
      const richard = hydratePlaceholder(PLACEHOLDERS[0]);
      const finalList: ScoredInstructor[] = [richard];
      realIdsAlreadyShown.add(richard.id);
      for (const s of scored) {
        if (finalList.length >= 3) break;
        if (realIdsAlreadyShown.has(s.id)) continue;
        finalList.push(s);
      }
      for (let i = 1; i < PLACEHOLDERS.length && finalList.length < 3; i++) {
        finalList.push(hydratePlaceholder(PLACEHOLDERS[i]));
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

  if (loading || instructors.length === 0) return null;

  return (
    <section style={{ background: "#F6F6F8", padding: "32px 5%" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Trust statement bar */}
        <div
          style={{
            background: "#0A1628",
            borderRadius: 10,
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
            ✅ Every instructor is{" "}
            <span style={{ color: "#22C55E" }}>DVSA verified</span>,{" "}
            <span style={{ color: "#22C55E" }}>DBS checked</span> and{" "}
            <span style={{ color: "#22C55E" }}>fully insured</span> before they appear on EveryDriver.
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ background: "#FFB3C7", fontFamily: "system-ui", fontSize: 9, fontWeight: 900, color: "#17120F", padding: "2px 9px", borderRadius: 3 }}>Klarna</span>
            <span style={{ background: "#B2FCE4", fontFamily: "system-ui", fontSize: 9, fontWeight: 900, color: "#000E18", padding: "2px 9px", borderRadius: 3 }}>Clearpay</span>
            <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "2px 9px" }}>🛡 Pass Promise</span>
          </div>
        </div>

        {/* Cards container */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#E8641A", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>
                FEATURED INSTRUCTORS
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0A1628", letterSpacing: -0.3 }}>
                Chosen by our pupils.
              </div>
            </div>
            <Link to="/courses" style={{ fontSize: 11, fontWeight: 600, color: "#0070C0", textDecoration: "none" }}>
              See all instructors →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(instructors.length, 3)}, 1fr)`,
              gap: 12,
            }}
            className="featured-instructors-grid"
          >
            {instructors.map((ins, idx) => {
              const accent = ACCENTS[idx] ?? ACCENTS[2];
              const badge = BADGES[ins.badge ?? "reviews"];
              const profileHref = ins.app_slug ? `/p/${ins.app_slug}` : `/courses`;
              return (
                <Link
                  key={ins.id}
                  to={profileHref}
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    border: accent.border,
                    cursor: "pointer",
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    background: "#fff",
                  }}
                >
                  <div style={{ height: 4, background: accent.bar }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      {(() => {
                        const gPhotoRef = ins.isPlaceholder ? googleData[ins.id]?.photoReference : null;
                        const photoSrc = ins.photo
                          ?? (gPhotoRef
                            ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-place-photo?ref=${encodeURIComponent(gPhotoRef)}&maxwidth=200`
                            : null);
                        return photoSrc ? (
                          <img src={photoSrc} alt={ins.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: accent.avatar, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                            {initials(ins.name)}
                          </div>
                        );
                      })()}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628", marginBottom: 1 }}>{ins.name}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                          {[ins.location, ins.hourly_rate ? `£${ins.hourly_rate}/hr` : null].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>

                    {!ins.isPlaceholder && !ins.googleBacked ? (
                      <>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10, background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
                          {badge.label}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          {ins.pass_rate !== null && (
                            <div style={{ flex: 1, textAlign: "center", background: "#F3F4F6", borderRadius: 7, padding: "8px 4px" }}>
                              <div style={{ fontSize: 16, fontWeight: 800, color: "#22C55E" }}>{Math.round(ins.pass_rate)}%</div>
                              <div style={{ fontSize: 8, color: "#9CA3AF" }}>pass rate</div>
                            </div>
                          )}
                          <div style={{ flex: 1, textAlign: "center", background: "#F3F4F6", borderRadius: 7, padding: "8px 4px" }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#0A1628" }}>{ins.avg_rating.toFixed(1)}</div>
                            <div style={{ fontSize: 8, color: "#9CA3AF" }}>rating</div>
                          </div>
                          <div style={{ flex: 1, textAlign: "center", background: "#F3F4F6", borderRadius: 7, padding: "8px 4px" }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#0A1628" }}>{ins.total_reviews}</div>
                            <div style={{ fontSize: 8, color: "#9CA3AF" }}>reviews</div>
                          </div>
                        </div>

                        {ins.review && (
                          <div style={{ marginBottom: 12, borderLeft: `3px solid ${accent.quoteBorder}`, background: accent.quoteBg, borderRadius: "0 6px 6px 0", padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, fontStyle: "italic", color: "#4B5563", lineHeight: 1.5, marginBottom: 3 }}>
                              "{truncate(ins.review.review_text)}"
                            </div>
                            <div style={{ fontSize: 9, color: "#9CA3AF" }}>
                              {ins.review.reviewer_name || "Anonymous"}
                              {ins.review.passed_first_time ? " · ✓ Passed 1st time" : ""}
                            </div>
                          </div>
                        )}

                        <div style={{ width: "100%", padding: 9, border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, background: accent.btnBg, color: "#fff", textAlign: "center" }}>
                          View profile →
                        </div>
                      </>
                    ) : (() => {
                      const g = googleData[ins.id];
                      const topReview = g?.reviews?.find((r) => r.text && r.text.length > 20) ?? g?.reviews?.[0];
                      const hasGoogle = !!g && (g.rating != null || (g.reviews && g.reviews.length > 0));
                      return (
                        <>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10, background: hasGoogle ? "#EFF6FF" : "#F3F4F6", border: `1px solid ${hasGoogle ? "#BFDBFE" : "#E5E7EB"}`, color: hasGoogle ? "#1E40AF" : "#6B7280", fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
                            {hasGoogle ? "⭐ Verified on Google" : "⏳ Coming soon"}
                          </div>

                          {hasGoogle ? (
                            <>
                              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                {g.rating != null && (
                                  <div style={{ flex: 1, textAlign: "center", background: "#F3F4F6", borderRadius: 7, padding: "8px 4px" }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0A1628" }}>{g.rating.toFixed(1)}</div>
                                    <div style={{ fontSize: 8, color: "#9CA3AF" }}>Google rating</div>
                                  </div>
                                )}
                                {g.userRatingsTotal != null && (
                                  <div style={{ flex: 1, textAlign: "center", background: "#F3F4F6", borderRadius: 7, padding: "8px 4px" }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0A1628" }}>{g.userRatingsTotal}</div>
                                    <div style={{ fontSize: 8, color: "#9CA3AF" }}>Google reviews</div>
                                  </div>
                                )}
                              </div>
                              {topReview && (
                                <div style={{ marginBottom: 12, borderLeft: `3px solid ${accent.quoteBorder}`, background: accent.quoteBg, borderRadius: "0 6px 6px 0", padding: "8px 10px" }}>
                                  <div style={{ fontSize: 10, fontStyle: "italic", color: "#4B5563", lineHeight: 1.5, marginBottom: 3 }}>
                                    "{truncate(topReview.text)}"
                                  </div>
                                  <div style={{ fontSize: 9, color: "#9CA3AF" }}>
                                    {topReview.author_name} · via Google
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 12, minHeight: 60, display: "flex", alignItems: "center" }}>
                              This instructor will be featured here soon. Check back for updates.
                            </div>
                          )}

                          <div style={{ width: "100%", padding: 9, border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, background: (ins.googleBacked || hasGoogle) ? accent.btnBg : "#E5E7EB", color: (ins.googleBacked || hasGoogle) ? "#fff" : "#6B7280", textAlign: "center" }}>
                            {ins.googleBacked ? "View profile →" : (hasGoogle ? "Joining soon →" : "Coming soon")}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .featured-instructors-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export default FeaturedInstructors;
