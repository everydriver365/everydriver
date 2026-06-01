import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, ChevronRight, MapPin, CalendarOff } from "lucide-react";
import { eolKey } from "@/hooks/useDayLessonHistory";

export interface Lesson {
  id: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  studentName: string;
  lessonType: string;
  postcode: string;
  pupilId?: string;
  status?: string;
}

interface ScheduleTileProps {
  lessons: Lesson[];
  nextLessons?: Lesson[];
  onAddLesson: () => void;
  onFillGaps: () => void;
  onLessonClick: (id: string) => void;
  onEolClick?: (id: string) => void;
  onViewNext?: () => void;
  eolDoneKeys?: Set<string>;
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
  greenAccent: "#1D9E75",
  greenTint: "#E6F4EE",
  amber: "#D97706",
  amberTint: "#FEF3E2",
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

export function ScheduleTile({ lessons, nextLessons = [], onAddLesson, onFillGaps, onLessonClick, eolDoneKeys }: ScheduleTileProps) {
  const [tab, setTab] = useState<"today" | "tomorrow" | "next">("today");
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { todayDate, tomorrowDate, todayLessons, tomorrowLessons, nextLessonsSorted } = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const decorate = (arr: Lesson[]) =>
      arr
        .slice()
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .map((l) => ({ ...l, _start: new Date(l.startTime), _end: new Date(l.endTime) }));

    const sorted = decorate(lessons);

    return {
      todayDate: today,
      tomorrowDate: tomorrow,
      todayLessons: sorted.filter((l) => sameDay(l._start, today)),
      tomorrowLessons: sorted.filter((l) => sameDay(l._start, tomorrow)),
      nextLessonsSorted: decorate(nextLessons),
    };
  }, [lessons, nextLessons]);

  const active =
    tab === "today" ? todayLessons : tab === "tomorrow" ? tomorrowLessons : nextLessonsSorted;
  const headerDate = tab === "today" ? todayDate : tab === "tomorrow" ? tomorrowDate : todayDate;
  const kicker =
    tab === "next"
      ? "SCHEDULE · NEXT LESSONS"
      : `SCHEDULE · ${DAYS[headerDate.getDay()]} ${headerDate.getDate()} ${MONTHS[headerDate.getMonth()].toUpperCase()}`;

  const renderPill = (key: "today" | "tomorrow" | "next", label: string, date: Date | null) => {
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
          {date ? `${label} / ${date.getDate()} ${MONTHS[date.getMonth()]}` : label}
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: C.muted,
            letterSpacing: "1.2px",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>
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
        {renderPill("next", "Next", null)}
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
          <CalendarOff size={24} color="#C7C7CC" strokeWidth={1.75} />
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, textAlign: "center" }}>
            {tab === "next"
              ? "No upcoming lessons"
              : `Nothing scheduled for ${tab === "today" ? "today" : "tomorrow"}`}
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col"
          style={
            tab === "next"
              ? { gap: 10, maxHeight: 260, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", paddingRight: 2 }
              : { gap: 10 }
          }
        >
          {active.map((l) => {
            const isToday = tab === "today";
            const isPast = isToday && l._end.getTime() <= nowMs;
            const startHMS = l._start.toTimeString().slice(0, 8); // HH:MM:SS in local time
            const eolDone =
              isPast && !!l.pupilId && !!eolDoneKeys && eolDoneKeys.has(eolKey(l.pupilId, startHMS));
            const dividerColor = eolDone ? C.greenAccent : isPast ? C.amber : C.blue;
            const showEolPill = isPast;
            return (
            <button
              key={l.id}
              type="button"
              onClick={() => onLessonClick(l.id)}
              className="w-full text-left transition-colors"
              style={{
                background: C.outerBg,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "14px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexShrink: 0,
                opacity: isPast ? 0.62 : 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.blue; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
            >

              {/* Time col */}
              <div style={{ width: 56, flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.charcoal, lineHeight: 1.05, letterSpacing: "-0.3px" }}>
                  {fmtHM(l._start)}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                  {tab === "next"
                    ? `${DAYS[l._start.getDay()]} ${l._start.getDate()} ${MONTHS[l._start.getMonth()]}`
                    : fmtDuration(l._start.getTime(), l._end.getTime())}
                </div>
              </div>
              {/* Divider (blue / green / amber) */}
              <div
                className="flex-shrink-0 self-stretch"
                style={{ width: 2.5, background: dividerColor, minHeight: 40, borderRadius: 2 }}
              />
              {/* Info col */}
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l.studentName}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l.lessonType}
                </div>
                <div className="flex items-center" style={{ gap: 6, flexWrap: "wrap" }}>
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
                  {showEolPill && (
                    <div
                      className="inline-flex items-center"
                      style={{
                        marginTop: 6,
                        background: eolDone ? C.greenTint : C.amberTint,
                        color: eolDone ? C.greenAccent : C.amber,
                        borderRadius: 999,
                        padding: "3px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.2px",
                      }}
                    >
                      {eolDone ? "EOL ✓" : "EOL needed"}
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight size={20} color={C.chevron} className="flex-shrink-0" strokeWidth={2.5} />
            </button>
            );
          })}
        </div>
      )}


      {/* Footer */}
      <div className="flex" style={{ gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={onAddLesson}
          className="flex-1 flex items-center justify-center transition-colors"
          style={{
            background: "#FFFFFF", color: C.green,
            border: `1px solid ${C.border}`, borderRadius: 14,
            padding: "13px 12px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", gap: 6,
            fontFamily: FONT,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.hover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
        >
          <Plus size={14} strokeWidth={2.5} color={C.green} /> Add lesson
        </button>
        <button
          type="button"
          onClick={onFillGaps}
          className="flex-1 flex items-center justify-center transition-colors"
          style={{
            background: "#FFFFFF", color: C.blue,
            border: `1px solid ${C.border}`, borderRadius: 14,
            padding: "13px 12px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", gap: 6,
            fontFamily: FONT,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.hover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; }}
        >
          <RefreshCw size={14} strokeWidth={2.5} color={C.blue} /> Fill gaps
        </button>
      </div>

    </div>
  );
}


export default ScheduleTile;
