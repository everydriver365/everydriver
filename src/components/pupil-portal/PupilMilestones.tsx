import { useEffect, useState } from "react";
import { Trophy, Star, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface PupilMilestonesProps {
  pupilId: string;
}

interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  created_at: string;
}

export function PupilMilestones({ pupilId }: PupilMilestonesProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("pupil_milestones")
        .select("id, milestone_type, title, description, icon_name, created_at")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false });
      if (alive) {
        setMilestones((data as Milestone[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pupilId]);

  if (loading) return null;

  return (
    <div
      style={{
        backgroundColor: "#F2F4F8",
        borderRadius: 16,
        padding: 16,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Sparkles size={18} style={{ color: "#d97706" }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
          Milestones
        </h3>
      </div>

      {milestones.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px" }}>
          <Trophy size={32} style={{ color: "#d1d5db", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            No milestones yet — keep going!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {milestones.map((m) => {
            const isCategory = m.milestone_type === "category_complete";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  padding: "12px 14px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isCategory ? "#FEF3C7" : "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isCategory ? (
                    <Trophy size={20} style={{ color: "#d97706" }} />
                  ) : (
                    <Star size={20} style={{ color: "#2563eb" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                      lineHeight: 1.3,
                    }}
                  >
                    {m.title}
                  </div>
                  {m.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {m.description}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                    {format(parseISO(m.created_at), "dd/MM/yy")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
