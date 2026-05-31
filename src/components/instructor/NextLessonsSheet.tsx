import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin, X, CalendarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NextLessonsSheetProps {
  open: boolean;
  onClose: () => void;
  instructorId: string;
  onLessonClick: (id: string) => void;
}

const C = {
  outerBg: "#F2F4F8",
  cardBg: "#FFFFFF",
  charcoal: "#1a1a1f",
  muted: "#999999",
  border: "#e0e3ea",
  blue: "#2952b3",
  blueTint: "#E6ECF8",
  chevron: "#B5B9C2",
};

const FONT =
  "Poppins, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

interface Row {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  lesson_type: string;
  pickup_postcode: string | null;
  pupil_id: string;
  pupils?: { name: string | null } | null;
}

export function NextLessonsSheet({ open, onClose, instructorId, onLessonClick }: NextLessonsSheetProps) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, [open]);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["next-lessons-sheet", instructorId, todayStr],
    enabled: open && !!instructorId,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, lesson_date, start_time, duration_minutes, lesson_type, pickup_postcode, pupil_id, pupils:pupil_id(name)")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .neq("status", "cancelled")
        .gte("lesson_date", todayStr)
        .order("lesson_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(30);
      if (error) throw error;
      return (data as any) || [];
    },
  });

  if (!mounted) return null;

  // Group by date
  const groups = lessons.reduce<Record<string, Row[]>>((acc, l) => {
    (acc[l.lesson_date] ||= []).push(l);
    return acc;
  }, {});
  const dateKeys = Object.keys(groups).sort();

  const fmtDateHeader = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (dt.getTime() === today.getTime()) return "Today";
    if (dt.getTime() === tomorrow.getTime()) return "Tomorrow";
    return `${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        fontFamily: FONT,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          opacity: open ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          top: "10vh",
          background: "#FFFFFF",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.18)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms cubic-bezier(.2,.8,.2,1)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Grabber */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: "#D9DDE5" }} />
        </div>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px 12px",
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal }}>
            Next Lessons
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30, height: 30, borderRadius: 999,
              background: C.outerBg, border: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color={C.charcoal} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "0 14px 24px" }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.muted, fontSize: 13 }}>
              Loading…
            </div>
          ) : dateKeys.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "32px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                margin: "8px 0",
              }}
            >
              <CalendarOff size={24} color="#C7C7CC" strokeWidth={1.75} />
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>
                No upcoming lessons
              </div>
            </div>
          ) : (
            dateKeys.map((dateStr) => (
              <div key={dateStr} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    letterSpacing: "1.2px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    padding: "10px 4px 8px",
                  }}
                >
                  {fmtDateHeader(dateStr)} · {groups[dateStr].length} lesson{groups[dateStr].length === 1 ? "" : "s"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {groups[dateStr].map((l) => {
                    const [hh, mm] = l.start_time.split(":");
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { onClose(); onLessonClick(l.id); }}
                        className="w-full text-left"
                        style={{
                          background: C.outerBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 12,
                          padding: "14px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div style={{ width: 52, flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: C.charcoal, lineHeight: 1.05, letterSpacing: "-0.3px" }}>
                            {hh}:{mm}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 500 }}>
                            {fmtDuration(l.duration_minutes || 60)}
                          </div>
                        </div>
                        <div
                          className="flex-shrink-0 self-stretch"
                          style={{ width: 2.5, background: C.blue, minHeight: 40, borderRadius: 2 }}
                        />
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {l.pupils?.name || "Pupil"}
                          </div>
                          <div style={{ fontSize: 13, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {l.lesson_type}
                          </div>
                          {l.pickup_postcode && (
                            <div
                              className="inline-flex items-center"
                              style={{
                                marginTop: 6,
                                background: C.blueTint,
                                color: C.blue,
                                borderRadius: 999,
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                gap: 4,
                              }}
                            >
                              <MapPin size={11} strokeWidth={2.5} color={C.blue} />
                              {l.pickup_postcode}
                            </div>
                          )}
                        </div>
                        <ChevronRight size={20} color={C.chevron} className="flex-shrink-0" strokeWidth={2.5} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NextLessonsSheet;
