import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InstructorRow {
  id: string;
  name: string;
  profile_image_url: string | null;
  hourly_rate: number | null;
  home_postcode: string | null;
  app_slug: string | null;
  avg_rating: number | null;
  total_reviews: number;
  town: string | null;
}

const TOP_BARS = ["#10B981", "#E8641A", "#60C8F5"];
const AVATAR_BGS = ["#1E4D9B", "#0A2B6B", "#059669"];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

async function lookupTown(postcode: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result?.admin_district || json?.result?.parish || json?.result?.admin_ward || null;
  } catch {
    return null;
  }
}

export default function SeeWhoIsTeaching() {
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [totalActive, setTotalActive] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ratings } = await supabase
        .from("instructor_rating_summary" as any)
        .select("instructor_id, avg_rating, total_reviews")
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .order("total_reviews", { ascending: false })
        .limit(20);

      const ids = ((ratings ?? []) as any[]).map(r => r.instructor_id);
      let top: InstructorRow[] = [];

      if (ids.length > 0) {
        const { data: instr } = await supabase
          .from("instructors")
          .select("id, name, profile_image_url, hourly_rate, home_postcode, app_slug")
          .in("id", ids)
          .eq("is_active", true)
          .eq("is_network_placeholder", false);
        const map = new Map((instr ?? []).map(i => [i.id, i]));
        for (const r of (ratings ?? []) as any[]) {
          const i = map.get(r.instructor_id);
          if (!i) continue;
          top.push({
            ...(i as any),
            avg_rating: r.avg_rating != null ? Number(r.avg_rating) : null,
            total_reviews: r.total_reviews ?? 0,
            town: null,
          });
          if (top.length === 3) break;
        }
      }

      if (top.length < 3) {
        const have = new Set(top.map(t => t.id));
        const { data: extras } = await supabase
          .from("instructors")
          .select("id, name, profile_image_url, hourly_rate, home_postcode, app_slug")
          .eq("is_active", true)
          .eq("is_network_placeholder", false)
          .limit(6);
        for (const e of extras ?? []) {
          if (have.has(e.id)) continue;
          top.push({ ...(e as any), avg_rating: null, total_reviews: 0, town: null });
          if (top.length === 3) break;
        }
      }

      // Resolve towns from postcodes
      await Promise.all(top.map(async (t) => {
        if (t.home_postcode) {
          t.town = await lookupTown(t.home_postcode);
        }
      }));

      const { count } = await supabase
        .from("instructors")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("is_network_placeholder", false);

      setInstructors(top);
      setTotalActive(count ?? 0);
      setLoaded(true);
    })();
  }, []);

  if (loaded && instructors.length === 0) return null;

  return (
    <section style={{ background: "#0A1628", padding: "80px 5%", width: "100%" }}>
      <style>{`
        @keyframes swyt-fadeup { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .swyt-card { transition: transform 300ms ease, box-shadow 300ms ease; will-change: transform; }
        .swyt-card:hover { transform: translateY(-6px); box-shadow: 0 30px 60px -20px rgba(0,0,0,0.55); }
        .swyt-cta { transition: transform 200ms ease, background 200ms ease, box-shadow 200ms ease; }
        .swyt-cta:hover { transform: scale(1.04); background: #d15814; box-shadow: 0 20px 40px -10px rgba(232,100,26,0.45); }
        .swyt-arrow { display: inline-block; transition: transform 200ms ease; }
        .swyt-cta:hover .swyt-arrow { transform: translateX(4px); }
      `}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>

        <div style={{ textAlign: "center", marginBottom: 56, animation: "swyt-fadeup 600ms ease both" }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, color: "#FFFFFF", letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>
            See who's teaching you.
            <br />
            <span style={{ color: "#60C8F5" }}>Then decide.</span>
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 620, margin: "20px auto 0", lineHeight: 1.6 }}>
            Most schools assign you a random instructor. We show you exactly who's available near you — before you hand over a penny.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(instructors.length, 3)}, 1fr)`, gap: 28, marginBottom: 56, width: "100%" }}>
          {instructors.map((ins, idx) => {
            const isTop = idx === 0;
            const isFeatured = idx === 1;
            const href = ins.app_slug ? `/i/${ins.app_slug}` : `/courses`;
            const location = ins.town || (ins.home_postcode ? ins.home_postcode.split(" ")[0] : null);
            return (
              <div
                key={ins.id}
                className="swyt-card"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 16,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  borderTop: `8px solid ${TOP_BARS[idx]}`,
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.45)",
                  animation: `swyt-fadeup 600ms ease both`,
                  animationDelay: `${120 + idx * 80}ms`,
                }}
              >
                <div style={{ padding: 24, flexGrow: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                    {ins.profile_image_url ? (
                      <img
                        src={ins.profile_image_url}
                        alt={ins.name}
                        style={{ width: 56, height: 56, borderRadius: 9999, objectFit: "cover", border: "2px solid #F8FAFC", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
                      />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 9999, background: AVATAR_BGS[idx], color: "#FFFFFF", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #F8FAFC" }}>
                        {initials(ins.name)}
                      </div>
                    )}
                    {isTop && (
                      <span style={{ background: "#E8641A", color: "#FFFFFF", fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "1px" }}>
                        Top rated
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <h3 style={{ color: "#0A1628", fontSize: 19, fontWeight: 700, lineHeight: 1.25, margin: 0 }}>{ins.name}</h3>
                    {location && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 500, margin: "4px 0 0" }}>{location}</p>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 24 }}>
                    {ins.avg_rating != null ? (
                      <>
                        <Star style={{ width: 14, height: 14, fill: "#F59E0B", color: "#F59E0B" }} />
                        <span style={{ color: "#F59E0B", fontWeight: 700 }}>{ins.avg_rating.toFixed(1)}</span>
                        <span style={{ color: "#94A3B8", fontWeight: 500 }}>({ins.total_reviews} review{ins.total_reviews === 1 ? "" : "s"})</span>
                      </>
                    ) : (
                      <>
                        <Star style={{ width: 14, height: 14, fill: "#F59E0B", color: "#F59E0B" }} />
                        <span style={{ color: "#F59E0B", fontWeight: 600, fontStyle: "italic" }}>New instructor</span>
                      </>
                    )}
                  </div>

                  {ins.hourly_rate != null && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ color: "#0A1628", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>£{Number(ins.hourly_rate).toFixed(0)}</span>
                      <span style={{ color: "#94A3B8", fontSize: 14, fontWeight: 500 }}>/hr</span>
                    </div>
                  )}
                </div>

                <Link to={href} style={{ textDecoration: "none", display: "block" }}>
                  <button
                    type="button"
                    style={{
                      width: "100%",
                      padding: "18px 16px",
                      background: isFeatured ? "#E8641A" : "#0A1628",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      cursor: "pointer",
                      transition: "background 200ms ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isFeatured ? "#d15814" : "#000000"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isFeatured ? "#E8641A" : "#0A1628"; }}
                  >
                    View profile →
                  </button>
                </Link>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Link to="/courses" style={{ textDecoration: "none" }}>
            <button
              type="button"
              className="swyt-cta"
              style={{
                background: "#E8641A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 14,
                padding: "20px 40px",
                fontSize: 17,
                fontWeight: 800,
                cursor: "pointer",
                marginBottom: 16,
                boxShadow: "0 15px 35px -10px rgba(232,100,26,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              See who's teaching you
              <span className="swyt-arrow">→</span>
            </button>
          </Link>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
            {totalActive} instructors available near you right now
          </div>
        </div>
      </div>
    </section>
  );
}
