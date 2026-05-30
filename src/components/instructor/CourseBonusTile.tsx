import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TileCard } from "@/components/instructor/ui";
import { Icon3D, hasIcon3D } from "@/components/Icon3D";

interface CourseBonusTileProps {
  instructorId: string;
}

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';
const ROUTE = "/instructor/payments?tab=bonus";
const BONUS_PER_COURSE = 50;

const INNER: React.CSSProperties = { padding: 14, fontFamily: FONT };

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.6,
  color: "#8a93a4",
  textTransform: "uppercase",
};

export function CourseBonusTile({ instructorId }: CourseBonusTileProps) {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!instructorId) return;
    let active = true;

    const fetchCount = async () => {
      const { count: c, error } = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .eq("course_status", "completed");
      if (!active) return;
      if (error) {
        setCount(0);
        return;
      }
      setCount(c ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel(`course-bonus-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pupils",
          filter: `instructor_id=eq.${instructorId}`,
        },
        () => fetchCount(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  const go = () => navigate(ROUTE);

  // ─── Loading ─────────────────────────────────────────────
  if (count === null) {
    return (
      <TileCard ariaLabel="Course bonus loading">
        <div style={INNER} aria-busy="true">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={eyebrow}>Course &amp; Loyalty Bonus</span>
            <span style={{ fontSize: 10, color: "#8a93a4" }}>&nbsp;</span>
          </div>
          <div style={{ height: 22, marginTop: 8, background: "#F2F4F8", borderRadius: 6, width: "60%" }} />
          <div style={{ height: 10, marginTop: 8, background: "#F2F4F8", borderRadius: 4, width: "45%" }} />
        </div>
      </TileCard>
    );
  }

  const total = count * BONUS_PER_COURSE;

  // ─── Empty state ─────────────────────────────────────────
  if (count === 0) {
    return (
      <TileCard onClick={go} ariaLabel="Course and loyalty bonus">
        <div style={INNER}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: hasIcon3D("trophy") ? 0 : 10,
                  background: hasIcon3D("trophy") ? "transparent" : "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hasIcon3D("trophy") ? (
                  <Icon3D name="trophy" size={44} />
                ) : (
                  <Trophy size={18} color="#92400e" />
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>
                  Course &amp; Loyalty Bonus
                </div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>
                  Earn £50 for every intensive course completed
                </div>
              </div>
            </div>
            <ChevronRight size={16} color="#9CA3AF" />
          </div>
        </div>
      </TileCard>
    );
  }

  // ─── Earned ──────────────────────────────────────────────
  return (
    <TileCard onClick={go} accentColor="green" ariaLabel={`${count} course bonuses earned, total £${total}`}>
      <div style={INNER}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...eyebrow, color: "#2d8a4e" }}>Course &amp; Loyalty Bonus</span>
          <ChevronRight size={16} color="#2d8a4e" />
        </div>
        <div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, color: "#1F2937", letterSpacing: -0.3 }}>
          £{total.toLocaleString("en-GB")}
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
          {count} course{count === 1 ? "" : "s"} completed · £{BONUS_PER_COURSE} each
        </div>
      </div>
    </TileCard>
  );
}

export default CourseBonusTile;
