import { useMemo, useState } from "react";
import { Plus, RefreshCw, ChevronRight, MapPin, CalendarOff } from "lucide-react";

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
  outerBg: "#F2F4F8",
  cardBg: "#FFFFFF",
  charcoal: "#1a1a1f",
  muted: "#999999",
  border: "#e0e3ea",
  blue: "#2952b3",
  blueTint: "#E6ECF8",
  green: "#2d8a4e",
  chevron: "#B5B9C2",
  trackBg: "#F2F4F8",
  hover: "#e8e9ed",
};


const FONT = "Poppins, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";

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
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function ScheduleTile({ lessons, onAddLesson, onFillGaps, onLessonClick }: ScheduleTileProps) {
  const [tab, setTab] = useState<"today" | "tomorrow">("today");

  const { todayDate, tomorrowDate, todayLessons, tomorrowLessons } = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sorted = lessons
      .slice()
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map((l) => ({ ...l, _start: new Date(l.startTime), _end: new Date(l.endTime) }));

    return {
      todayDate: today,
      tomorrowDate: tomorrow,
      todayLessons: sorted.filter((l) => sameDay(l._start, today)),
      tomorrowLessons: sorted.filter((l) => sameDay(l._start, tomorrow)),
    };
  }, [lessons]);

  const active = tab === "today" ? todayLessons : tomorrowLessons;
  const headerDate = tab === "today" ? todayDate : tomorrowDate;
  const kicker = `SCHEDULE · ${DAYS[headerDate.getDay()]} ${headerDate.getDate()} ${MONTHS[headerDate.getMonth()].toUpperCase()}`;

  const fmtPill = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

  const renderPill = (key: "today" | "tomorrow", label: string, date: Date) => {
    const isActive = tab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setTab(key)}
        className="flex-1 transition-all"
        style={{
          background: isActive ? "#FFFFFF" : "transparent",
          color: isActive ? C.charcoal : C.muted,
          border: 0,
          borderRadius: 8,
          padding: "8px 10px",
          cursor: "pointer",
          fontFamily: FONT,
          textAlign: "center",
          lineHeight: 1.2,
          boxShadow: isActive ? "0 1px 3px rgba(15,32,68,0.10)" : "none",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 500 }}>
          {label} / {date.getDate()} {MONTHS[date.getMonth()]}
        </div>
      </button>
    );
  };

  return (
    <div
      className="w-full"
      style={{
        fontFamily: FONT,
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 14,
      }}
    >
      {/* Header kicker */}
      <div
        style={{
          fontSize: 10,
          color: C.muted,
          letterSpacing: "1.2px",
          fontWeight: 600,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {kicker}
      </div>

      {/* Segmented day selector */}
      <div
        className="flex"
        style={{
          gap: 0,
          marginBottom: 12,
          background: C.trackBg,
          borderRadius: 8,
          padding: 3,
        }}
      >
        {renderPill("today", "Today", todayDate)}
        {renderPill("tomorrow", "Tomorrow", tomorrowDate)}
      </div>


      {/* Section label */}
      <div
        style={{
          fontSize: 10,
          color: C.muted,
          letterSpacing: "1.2px",
          fontWeight: 600,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {active.length === 0
          ? "No lessons"
          : `${active.length} lesson${active.length === 1 ? "" : "s"}`}
      </div>

      {/* Lessons / empty */}
      {active.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "24px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CalendarOff size={28} color="#C7C7CC" strokeWidth={1.75} />
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, textAlign: "center" }}>
            Nothing scheduled for {tab === "today" ? "today" : "tomorrow"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {active.map((l) => (
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
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
            >
              {/* Time col */}
              <div style={{ width: 52, flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.charcoal, lineHeight: 1.05, letterSpacing: "-0.3px" }}>
                  {fmtHM(l._start)}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 500 }}>
                  {fmtDuration(l._start.getTime(), l._end.getTime())}
                </div>
              </div>
              {/* Blue divider */}
              <div
                className="flex-shrink-0 self-stretch"
                style={{ width: 2.5, background: C.blue, minHeight: 40, borderRadius: 2 }}
              />
              {/* Info col */}
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l.studentName}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
              <ChevronRight size={20} color={C.chevron} className="flex-shrink-0" strokeWidth={2.5} />
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex" style={{ gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={onAddLesson}
          className="flex-1 flex items-center justify-center"
          style={{
            background: C.green, color: "#FFFFFF",
            border: 0, borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", gap: 6,
            fontFamily: FONT,
          }}
        >
          <Plus size={14} strokeWidth={2.5} color="#FFFFFF" /> Add lesson
        </button>
        <button
          type="button"
          onClick={onFillGaps}
          className="flex-1 flex items-center justify-center"
          style={{
            background: C.blue, color: "#FFFFFF",
            border: 0, borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", gap: 6,
            fontFamily: FONT,
          }}
        >
          <RefreshCw size={14} strokeWidth={2.5} color="#FFFFFF" /> Fill gaps
        </button>
      </div>

    </div>
  );
}

export default ScheduleTile;
