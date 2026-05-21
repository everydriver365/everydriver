import { useMemo, Fragment } from "react";
import { Plus, Repeat2, ChevronRight } from "lucide-react";


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
  navy: "#1B2A4A",
  blue: "#2E5FA8",
  red: "#C0392B",
  redTint: "#F2E0DE",
  blueTint: "#E4ECF7",
  muted: "#8A93A5",
  kicker: "#9AA3B2",
  line: "#ECEEF2",
  cardGrey: "#F1F3F6",
  bg: "#EEF0F3",
  grey: "#CDD2DA",
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
        background: "#FFFFFF",
        borderRadius: 22,
        boxShadow: "0 10px 30px -10px rgba(27,42,74,0.28)",
        padding: 18,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <div
            style={{
              fontSize: 13,
              color: C.kicker,
              letterSpacing: "1.4px",
              fontWeight: 600,
            }}
          >
            {kicker}
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.navy, lineHeight: 1.15, marginTop: 2 }}>
            {titleStr}
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center flex-shrink-0"
          style={{
            width: 58, height: 58, borderRadius: 29,
            background: C.navy, color: "#FFFFFF",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{lessons.length}</div>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1px", marginTop: 2, opacity: 0.85 }}>
            LESSONS
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {withStatus.map((l, idx) => {
          const isNow = l._status === "now";
          const isNext = l._status === "next";
          const isDone = l._status === "done";
          const barColor = isNow ? C.red : isNext ? C.blue : isDone ? C.grey : C.blue;
          const titleColor = isDone ? "#AEB4BF" : C.navy;

          return (
            <Fragment key={l.id}>
              {idx > 0 && (
                <div style={{ height: 1, background: C.line, marginLeft: 72 }} />
              )}
              <button
                type="button"
                onClick={() => onLessonClick(l.id)}
                className="w-full text-left transition-colors"
                style={{
                  background: "transparent",
                  border: 0,
                  borderRadius: 12,
                  padding: "14px 6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F7FA"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {/* Time col */}
                <div style={{ width: 52, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 20, fontWeight: 800,
                    color: titleColor, lineHeight: 1.05,
                    letterSpacing: "-0.3px",
                  }}>
                    {fmtHM(l._start)}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 500 }}>
                    {fmtDuration(l._start.getTime(), l._end.getTime())}
                  </div>
                </div>
                {/* Colored bar */}
                <div
                  className="flex-shrink-0 self-stretch"
                  style={{
                    width: 4, borderRadius: 2,
                    background: barColor,
                    minHeight: 36,
                  }}
                />
                {/* Info col */}
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      fontSize: 17, fontWeight: 700,
                      color: titleColor,
                      letterSpacing: "-0.3px",
                      textDecoration: isDone ? "line-through" : "none",
                      textDecorationColor: isDone ? C.grey : undefined,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}
                  >
                    {l.studentName}
                  </div>
                  <div style={{
                    fontSize: 13, color: C.muted, marginTop: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {l.lessonType} · {l.postcode}
                  </div>
                </div>
                {/* Chevron */}
                <ChevronRight size={18} color={C.grey} className="flex-shrink-0" strokeWidth={2.5} />
              </button>
            </Fragment>
          );
        })}
      </div>


      {/* Footer */}
      <div className="flex mt-3" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={onAddLesson}
          className="flex items-center justify-center"
          style={{
            background: C.redTint, color: C.red,
            border: 0, borderRadius: 999,
            padding: "7px 14px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", gap: 6,
          }}
        >
          <Plus size={14} strokeWidth={2.75} color={C.red} /> Add lesson
        </button>
        <button
          type="button"
          onClick={onFillGaps}
          className="flex items-center justify-center"
          style={{
            background: C.cardGrey, color: C.navy,
            border: 0, borderRadius: 999,
            padding: "7px 14px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", gap: 6,
          }}
        >
          <Repeat2 size={14} strokeWidth={2.75} color={C.navy} /> Fill gaps
        </button>
      </div>
    </div>
  );
}

export default ScheduleTile;
