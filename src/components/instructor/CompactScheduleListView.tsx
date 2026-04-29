import { useMemo } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import {
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  addDays,
  subDays,
  isSameYear,
} from "date-fns";
import type { CalendarEvent } from "@/hooks/useInstructorCalendar";
import { titleCaseName } from "@/lib/titleCase";

/* ---------- helpers (per spec) ---------- */

function formatDayHeader(date: Date): string {
  const base = format(date, "EEE d LLL"); // "Mon 28 Apr"
  const baseWithYear = `${base} ${format(date, "yyyy")}`;
  const useWithYear = !isSameYear(date, new Date());
  const label = useWithYear ? baseWithYear : base;

  if (isToday(date)) return `${label} · today`;
  if (isTomorrow(date)) return `${label} · tomorrow`;
  if (isYesterday(date)) return `${label} · yesterday`;
  return label;
}

function formatLessonDuration(start: Date, end: Date): string {
  const mins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function isAllDay(start: Date, end: Date): boolean {
  // 24h+ block starting at 00:00
  const span = end.getTime() - start.getTime();
  return start.getHours() === 0 && start.getMinutes() === 0 && span >= 23 * 60 * 60 * 1000;
}

const DSM_LESSON_BLUE = "#2B7BC8";
const DRIVING_TEST_RED = "#C8434F";
const BLOCK_AMBER = "#B8801F";
const EXTERNAL_DEFAULT = "#8A5BC9";

function isDrivingTest(evt: CalendarEvent): boolean {
  if (evt.type !== "lesson") return false;
  const t = (evt.data?.lesson_type || "").toString().toLowerCase();
  return t.includes("test") && !t.includes("test prep");
}

function getCalendarSourceColor(evt: CalendarEvent): string {
  if (evt.type === "lesson") {
    return isDrivingTest(evt) ? DRIVING_TEST_RED : DSM_LESSON_BLUE;
  }
  if (evt.type === "block") {
    return BLOCK_AMBER;
  }
  // external (Google Calendar)
  const c = evt.data?.color;
  if (typeof c === "string" && /^#?[0-9a-f]{6}$/i.test(c)) {
    return c.startsWith("#") ? c : `#${c}`;
  }
  return EXTERNAL_DEFAULT;
}

function getRowSubtitle(evt: CalendarEvent): string {
  if (evt.type === "lesson") {
    if (isDrivingTest(evt)) {
      return `Driving test · ${evt.data?.pickup_location || "Location TBC"}`;
    }
    const lessonType = evt.data?.lesson_type || "Standard lesson";
    const loc = evt.data?.pickup_location || "Location TBC";
    return `${lessonType} · ${loc}`;
  }
  if (evt.type === "block") {
    return evt.data?.notes || "Personal · blocked";
  }
  return "Calendar · busy";
}

function getRowTitle(evt: CalendarEvent): string {
  if (evt.type === "lesson") {
    const name = titleCaseName(evt.title);
    return isDrivingTest(evt) ? `${name} · driving test` : name;
  }
  return evt.title;
}

type RowStatus = "live" | "conflict" | "tentative" | "cancelled" | null;

function getRowStatus(evt: CalendarEvent, now: Date, others: CalendarEvent[]): RowStatus {
  if (evt.type === "lesson" && evt.data?.status === "cancelled") return "cancelled";
  if (now >= evt.start && now < evt.end) return "live";
  // conflict: overlaps with any other event of different id
  const overlap = others.some(
    (o) => o.id !== evt.id && o.start < evt.end && o.end > evt.start,
  );
  if (overlap) return "conflict";
  if (evt.type === "external" && evt.data?.is_busy === false) return "tentative";
  return null;
}

function isTappable(evt: CalendarEvent): boolean {
  // External Google Calendar items: read-only, not tappable to detail
  return evt.type !== "external";
}

/* ---------- subcomponents ---------- */

function StatusPill({ status }: { status: Exclude<RowStatus, null> }) {
  const map = {
    live: { bg: "#FBEAEC", color: "#C8434F", text: "LIVE" },
    conflict: { bg: "#FBF1DE", color: "#B8801F", text: "CONFLICT" },
    tentative: { bg: "#F2F2F4", color: "#6E6E73", text: "TENTATIVE" },
    cancelled: { bg: "#F2F2F4", color: "#6E6E73", text: "CANCELLED" },
  } as const;
  const s = map[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 999,
        padding: "2px 7px",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.3px",
        flexShrink: 0,
      }}
    >
      {s.text}
    </span>
  );
}

function DayGroupHeader({ date }: { date: Date }) {
  return (
    <div style={{ padding: "10px 16px 6px" }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#6E6E73",
          letterSpacing: "0.3px",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {formatDayHeader(date)}
      </p>
    </div>
  );
}

interface ScheduleListRowProps {
  evt: CalendarEvent;
  status: RowStatus;
  onPress: (evt: CalendarEvent) => void;
}

function ScheduleListRow({ evt, status, onPress }: ScheduleListRowProps) {
  const tappable = isTappable(evt);
  const allDay = isAllDay(evt.start, evt.end);
  const colorBar = getCalendarSourceColor(evt);
  const title = getRowTitle(evt);
  const subtitle = getRowSubtitle(evt);
  const cancelled = status === "cancelled";

  return (
    <button
      type="button"
      disabled={!tappable}
      onClick={() => tappable && onPress(evt)}
      onMouseEnter={(e) => {
        if (tappable) (e.currentTarget as HTMLButtonElement).style.background = "#F2F2F4";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
      style={{
        background: "transparent",
        border: "none",
        padding: "12px 8px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        cursor: tappable ? "pointer" : "default",
        textAlign: "left",
        transition: "background 0.15s ease",
      }}
    >
      {/* Time column */}
      <div
        style={{
          flexShrink: 0,
          minWidth: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {allDay ? (
          <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>All day</p>
        ) : (
          <>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#000000",
                letterSpacing: "-0.1px",
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {format(evt.start, "HH:mm")}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6E6E73",
                margin: "1px 0 0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatLessonDuration(evt.start, evt.end)}
            </p>
          </>
        )}
      </div>

      {/* Source colour bar */}
      <span
        aria-hidden
        style={{
          width: 3,
          height: 36,
          borderRadius: 2,
          background: colorBar,
          flexShrink: 0,
        }}
      />

      {/* Title + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#000000",
            letterSpacing: "-0.1px",
            margin: "0 0 1px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: cancelled ? "line-through" : "none",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#6E6E73",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: cancelled ? "line-through" : "none",
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Status pill (conditional) */}
      {status && status !== "cancelled" && <StatusPill status={status} />}

      {/* Chevron (conditional) */}
      {tappable && (
        <ChevronRight
          style={{ width: 12, height: 12, color: "#6E6E73", flexShrink: 0, strokeWidth: 1.6 }}
        />
      )}
    </button>
  );
}

/* ---------- main view ---------- */

export interface CompactScheduleListViewProps {
  events: CalendarEvent[];
  loading?: boolean;
  onEventClick: (event: CalendarEvent) => void;
  /** Number of past days to show (default 1). */
  pastDays?: number;
  /** Number of forward days to show including today (default 14). */
  forwardDays?: number;
}

export function CompactScheduleListView({
  events,
  loading = false,
  onEventClick,
  pastDays = 1,
  forwardDays = 14,
}: CompactScheduleListViewProps) {
  const now = new Date();

  // Build range: yesterday → +14 days
  const days = useMemo(() => {
    const start = startOfDay(subDays(now, pastDays));
    const out: Date[] = [];
    for (let i = 0; i < pastDays + forwardDays; i++) {
      out.push(addDays(start, i));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastDays, forwardDays]);

  // Group events by day-of-start
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const key = format(startOfDay(evt.start), "yyyy-MM-dd");
      const list = map.get(key) || [];
      list.push(evt);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  if (loading && events.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Loader2 className="animate-spin" style={{ width: 22, height: 22, color: "#2B7BC8" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {days.map((day, dayIdx) => {
        const key = format(day, "yyyy-MM-dd");
        const dayEvents = eventsByDay.get(key) || [];
        const isLastDay = dayIdx === days.length - 1;

        return (
          <div key={key}>
            <DayGroupHeader date={day} />

            {dayEvents.length === 0 ? (
              <div style={{ padding: "0 16px 14px" }}>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6E6E73",
                    fontStyle: "italic",
                    margin: "8px 0",
                  }}
                >
                  No lessons
                </p>
              </div>
            ) : (
              <div style={{ padding: "0 8px" }}>
                {dayEvents.map((evt, idx) => {
                  const status = getRowStatus(evt, now, dayEvents);
                  const isLastRow = idx === dayEvents.length - 1;
                  return (
                    <div key={evt.id}>
                      <ScheduleListRow evt={evt} status={status} onPress={onEventClick} />
                      {!isLastRow && (
                        <div
                          aria-hidden
                          style={{
                            height: 0.5,
                            background: "#E5E5EA",
                            margin: "0 8px",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isLastDay && (
              <div
                aria-hidden
                style={{ height: 4, background: "#F2F2F4", margin: "4px 0" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
