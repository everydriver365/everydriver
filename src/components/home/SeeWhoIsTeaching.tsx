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
}

const TOP_BARS = ["#059669", "#E8641A", "#0070C0"];
const AVATAR_BGS = ["#1E4D9B", "#0A2B6B", "#059669"];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
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
          top.push({ ...(e as any), avg_rating: null, total_reviews: 0 });
          if (top.length === 3) break;
        }
      }

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
    <section style={{ background: "#0A1628", padding: "48px 40px", width: "100%" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#E8641A", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>
            Before you book
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", letterSpacing: -0.5, lineHeight: 1.2, margin: 0 }}>
            See who's teaching you.
            <br />
            <span style={{ color: "#60C8F5" }}>Then decide.</span>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 400, margin: "12px auto 0", lineHeight: 1.6 }}>
            Most schools assign you a random instructor. We show you exactly who's available near you — before you hand over a penny.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(instructors.length, 3)}, 1fr)`, gap: 10, marginBottom: 24 }}>
          {instructors.map((ins, idx) => {
            const isTop = idx === 0;
            const isFeatured = idx === 1;
            const href = ins.app_slug ? `/i/${ins.app_slug}` : `/courses`;
            const outward = (ins.home_postcode ?? "").split(" ")[0];
            return (
              <div key={ins.id} style={{ background: "#FFFFFF", borderRadius: 10, overflow: "hidden", position: "relative" }}>
                <div style={{ height: 6, background: TOP_BARS[idx] }} />
                {isTop && (
                  <div style={{ position: "absolute", top: 14, right: 10, background: "#E8641A", color: "#FFFFFF", fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 20 }}>
                    Top rated
                  </div>
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {ins.profile_image_url ? (
                      <img src={ins.profile_image_url} alt={ins.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: AVATAR_BGS[idx], color: "#FFFFFF", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {initials(ins.name)}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#0A1628" }}>{ins.name}</div>
                      {outward && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{outward}</div>}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#9CA3AF" }}>
                      <Star style={{ width: 10, height: 10, fill: "#F59E0B", color: "#F59E0B" }} />
                      {ins.avg_rating != null ? (
                        <span>{ins.avg_rating.toFixed(1)} ({ins.total_reviews})</span>
                      ) : (
                        <span>New</span>
                      )}
                    </div>
                  </div>

                  {ins.hourly_rate != null && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>£{Number(ins.hourly_rate).toFixed(0)}</span>
                      <span style={{ fontSize: 10, fontWeight: 400, color: "#9CA3AF" }}>/hr</span>
                    </div>
                  )}

                  <Link to={href} style={{ textDecoration: "none" }}>
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        padding: 6,
                        background: isFeatured ? "#E8641A" : "#0A1628",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 5,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      View profile →
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center" }}>
          <Link to="/courses" style={{ textDecoration: "none" }}>
            <button
              type="button"
              style={{
                background: "#E8641A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "13px 32px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              See who's teaching you →
            </button>
          </Link>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            {totalActive} instructors available near you right now
          </div>
        </div>
      </div>
    </section>
  );
}
