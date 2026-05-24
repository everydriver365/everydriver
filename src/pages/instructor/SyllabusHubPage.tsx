import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, History as HistoryIcon, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DrivingSyllabus } from "@/components/instructor/DrivingSyllabus";
import { DVSA_SYLLABUS, SKILL_LEVELS } from "@/constants/dvsaSyllabus";

interface LessonUpdate {
  id: string;
  lesson_history_id: string;
  competency_id: string;
  previous_level: number;
  new_level: number;
  comment: string | null;
  created_at: string;
}

interface LessonMeta {
  id: string;
  lesson_date: string | null;
}

const FONT = "Poppins, -apple-system, BlinkMacSystemFont, sans-serif";
const BG = "#F2F4F8";

export default function SyllabusHubPage() {
  const { pupilId = "" } = useParams<{ pupilId: string }>();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"progress" | "history">("progress");
  const [pupilName, setPupilName] = useState<string>("");
  const [loadingPupil, setLoadingPupil] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("pupils")
        .select("name")
        .eq("id", pupilId)
        .maybeSingle();
      if (!active) return;
      setPupilName(data?.name || "");
      setLoadingPupil(false);
    })();
    return () => {
      active = false;
    };
  }, [pupilId]);

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: FONT }}>
      {/* Header */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "0.5px solid #E0E3EA",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate(`/instructor/pupils/${pupilId}`)}
          aria-label="Back to pupil"
          style={{
            width: 32,
            height: 32,
            borderRadius: 12,
            background: "#F2F4F8",
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={18} color="#3D55A1" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#6B7280",
              letterSpacing: 0.3,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {loadingPupil ? "Loading…" : pupilName || "Pupil"}
          </p>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
            DVSA syllabus
          </h1>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "0.5px solid #E0E3EA",
          padding: "8px 16px",
          display: "flex",
          gap: 8,
        }}
      >
        {(["progress", "history"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 999,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT,
                cursor: "pointer",
                background: active ? "#3D55A1" : "#EDF2FE",
                color: active ? "#FFFFFF" : "#3D55A1",
                transition: "background 150ms ease, color 150ms ease",
              }}
            >
              {t === "progress" ? "Progress" : "History"}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "progress" ? (
        pupilId ? (
          <DrivingSyllabus pupilId={pupilId} pupilName={pupilName} />
        ) : null
      ) : (
        <HistoryTab pupilId={pupilId} />
      )}
    </div>
  );
}

function HistoryTab({ pupilId }: { pupilId: string }) {
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<LessonUpdate[]>([]);
  const [lessons, setLessons] = useState<Map<string, LessonMeta>>(new Map());

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: ups } = await supabase
        .from("lesson_syllabus_updates")
        .select("id, lesson_history_id, competency_id, previous_level, new_level, comment, created_at")
        .eq("pupil_id", pupilId)
        .order("created_at", { ascending: false })
        .limit(500);

      const lessonIds = Array.from(new Set((ups || []).map((u) => u.lesson_history_id)));
      let lessonMap = new Map<string, LessonMeta>();
      if (lessonIds.length) {
        const { data: lh } = await supabase
          .from("lesson_history")
          .select("id, lesson_date")
          .in("id", lessonIds);
        lessonMap = new Map((lh || []).map((l) => [l.id, l as LessonMeta]));
      }

      if (!active) return;
      setUpdates(ups || []);
      setLessons(lessonMap);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [pupilId]);

  if (loading) {
    return (
      <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
        <Loader2 size={20} className="animate-spin" color="#6B7280" />
      </div>
    );
  }

  if (!updates.length) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            border: "0.5px solid #E0E3EA",
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#EDF2FE",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <HistoryIcon size={22} color="#3D55A1" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>
            No syllabus history yet
          </p>
          <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
            Skill changes recorded at lesson end will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Group updates by lesson_history_id
  const grouped = new Map<string, LessonUpdate[]>();
  for (const u of updates) {
    const arr = grouped.get(u.lesson_history_id) || [];
    arr.push(u);
    grouped.set(u.lesson_history_id, arr);
  }
  const groups = Array.from(grouped.entries()).sort((a, b) => {
    const aDate = lessons.get(a[0])?.lesson_date || a[1][0].created_at;
    const bDate = lessons.get(b[0])?.lesson_date || b[1][0].created_at;
    return bDate.localeCompare(aDate);
  });

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {groups.map(([lessonId, items]) => {
        const meta = lessons.get(lessonId);
        const dateStr = meta?.lesson_date
          ? new Date(meta.lesson_date).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : new Date(items[0].created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
        return (
          <div
            key={lessonId}
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              border: "0.5px solid #E0E3EA",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "0.5px solid #E0E3EA",
                background: "#F8FAFC",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B7280",
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Lesson
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "2px 0 0" }}>
                {dateStr}
              </p>
            </div>
            <div style={{ padding: "4px 0" }}>
              {items.map((u) => {
                const comp = DVSA_SYLLABUS.find((c) => c.id === u.competency_id);
                const prev = SKILL_LEVELS[u.previous_level];
                const next = SKILL_LEVELS[u.new_level];
                const improved = u.new_level > u.previous_level;
                return (
                  <div
                    key={u.id}
                    style={{
                      padding: "10px 16px",
                      borderTop: "0.5px solid #F1F3F7",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#111827",
                        }}
                      >
                        {comp?.name || u.competency_id}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#F1F3F7",
                          color: "#6B7280",
                        }}
                      >
                        {prev?.label || `L${u.previous_level}`}
                      </span>
                      <ArrowRight size={12} color="#6B7280" />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: improved ? "#DCFCE7" : "#FEE2E2",
                          color: improved ? "#15803D" : "#B91C1C",
                        }}
                      >
                        {next?.label || `L${u.new_level}`}
                      </span>
                    </div>
                    {u.comment && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          fontStyle: "italic",
                          margin: 0,
                          paddingLeft: 2,
                        }}
                      >
                        “{u.comment}”
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
