import { useMemo, Fragment } from "react";
import { Plus, RefreshCw, ChevronRight, MapPin } from "lucide-react";

export interface Lesson {
  id: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  studentName: string;
  lessonType: string;
  postcode: string;
}

interface ScheduleTileProps {
  lessons: Lesson[];
  onAddLesson: () => void;
  onFillGaps: () => void;
  onLessonClick: (id: string) => void;
}

const C = {
  charcoal: "#1a1a1f",
  muted: "#888888",
  border: "#dddddd",
  blue: "#2952b3",
  blueTint: "#E6ECF8",
  green: "#2d8a4e",
  chevron: "#B5B9C2",
};

type Status = "done" | "now" | "next" | "upcoming";

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function fmtHM(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtDuration(startMs: number, endMs: number) {
  const mins = Math.max(0, Math.round((endMs - startMs) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
const DAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function ScheduleTile({ lessons, onAddLesson, onFillGaps, onLessonClick }: ScheduleTileProps) {
  const { withStatus, headerDate, isToday } = useMemo(() => {
    const now = new Date();
    let nextFound = false;
    const sorted = lessons
      .slice()
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const ws = sorted.map((lesson) => {
      const start = new Date(lesson.startTime);
      const end = new Date(lesson.endTime);
      let _status: Status;
      if (end < now) _status = "done";
      else if (start <= now && now <= end) _status = "now";
      else if (!nextFound && start > now) { nextFound = true; _status = "next"; }
      else _status = "upcoming";
      return { ...lesson, _status, _start: start, _end: end };
    });

    const ref = sorted.length ? new Date(sorted[0].startTime) : now;
    const today = new Date();
    const isT = ref.getFullYear() === today.getFullYear() &&
                ref.getMonth() === today.getMonth() &&
                ref.getDate() === today.getDate();
    return { withStatus: ws, headerDate: ref, isToday: isT };
  }, [lessons]);

  const kicker = `SCHEDULE · ${DAYS[headerDate.getDay()]} ${headerDate.getDate()} ${MONTHS[headerDate.getMonth()].toUpperCase()}`;
  const titleStr = isToday ? "Today" : `${DAYS_SHORT[headerDate.getDay()]} ${headerDate.getDate()} ${MONTHS[headerDate.getMonth()]}`;

  return (
    <div
      className="w-full"
      style={{
        fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            color: C.muted,
            letterSpacing: "1.2px",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.charcoal, lineHeight: 1.15, marginTop: 4 }}>
          {titleStr}
        </div>
      </div>

      {/* Lesson cards */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        {withStatus.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onLessonClick(l.id)}
            className="w-full text-left transition-colors"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "14px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Time col */}
            <div style={{ width: 52, flexShrink: 0 }}>
              <div style={{
                fontSize: 20, fontWeight: 700,
                color: C.charcoal, lineHeight: 1.05,
                letterSpacing: "-0.3px",
              }}>
                {fmtHM(l._start)}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 500 }}>
                {fmtDuration(l._start.getTime(), l._end.getTime())}
              </div>
            </div>
            {/* Blue divider */}
            <div
              className="flex-shrink-0 self-stretch"
              style={{
                width: 2,
                background: C.blue,
                minHeight: 40,
                borderRadius: 1,
              }}
            />
            {/* Info col */}
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontSize: 15, fontWeight: 600,
                  color: C.charcoal,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {l.studentName}
              </div>
              <div style={{
                fontSize: 13, color: C.muted, marginTop: 2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {l.lessonType}
              </div>
              {l.postcode && (
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
                  {l.postcode}
                </div>
              )}
            </div>
            {/* Chevron */}
            <ChevronRight size={20} color={C.chevron} className="flex-shrink-0" strokeWidth={2.5} />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex mt-3" style={{ gap: 10 }}>
        <button
          type="button"
          onClick={onAddLesson}
          className="flex-1 flex items-center justify-center"
          style={{
            background: C.green, color: "#FFFFFF",
            border: 0, borderRadius: 14,
            padding: "14px 14px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", gap: 6,
            fontFamily: "Poppins, -apple-system, sans-serif",
          }}
        >
          <Plus size={16} strokeWidth={2.5} color="#FFFFFF" /> Add lesson
        </button>
        <button
          type="button"
          onClick={onFillGaps}
          className="flex-1 flex items-center justify-center"
          style={{
            background: C.blue, color: "#FFFFFF",
            border: 0, borderRadius: 14,
            padding: "14px 14px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", gap: 6,
            fontFamily: "Poppins, -apple-system, sans-serif",
          }}
        >
          <RefreshCw size={16} strokeWidth={2.5} color="#FFFFFF" /> Fill gaps
        </button>
      </div>
    </div>
  );
}

export default ScheduleTile;
