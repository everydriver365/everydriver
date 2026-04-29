import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, ChevronRight, Loader2 } from "lucide-react";
import {
  format,
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
import { supabase } from "@/integrations/supabase/client";
import { GapFillSheet } from "./GapFillSheet";

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

function formatGapDuration(mins: number): string {
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

/* Gap detection — mirrors MultiDayScheduleView. */
const TRAVEL_FALLBACK_MIN = 10;
const MIN_OFFERABLE_GAP_MIN = 60;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function fmtMins(mins: number): string {
  return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
}

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

interface GapRow {
  kind: "gap";
  id: string;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMin: number;
}

interface EventRow {
  kind: "event";
  id: string;
  evt: CalendarEvent;
}

type DayRow = EventRow | GapRow;

interface GapSuggestionRowProps {
  row: GapRow;
  onFill: (row: GapRow) => void;
}

function GapSuggestionRow({ row, onFill }: GapSuggestionRowProps) {
  return (
    <div
      style={{
        background: "#E8F3E8",
        borderRadius: 10,
        padding: "10px 12px",
        margin: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* Icon tile */}
      <div
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 7,
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CalendarPlus style={{ width: 16, height: 16, color: "#3B8B3B", strokeWidth: 2 }} />
      </div>

      {/* Title + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#000000",
            letterSpacing: "-0.1px",
            margin: "0 0 1px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {`Open slot · ${row.startTime} – ${row.endTime}`}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#6E6E73",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {`${formatGapDuration(row.durationMin)} gap — offer to waitlist?`}
        </p>
      </div>

      {/* Fill button */}
      <button
        type="button"
        onClick={() => onFill(row)}
        style={{
          flexShrink: 0,
          background: "#3B8B3B",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Fill
      </button>
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
  /** Required to surface inline Gap Filler suggestion rows. */
  instructorId?: string;
  instructorName?: string;
  /** Called after a Gap Filler offer is sent so the parent can refetch. */
  onGapFilled?: () => void;
}

export function CompactScheduleListView({
  events,
  loading = false,
  onEventClick,
  pastDays = 1,
  forwardDays = 14,
  instructorId,
  instructorName,
  onGapFilled,
}: CompactScheduleListViewProps) {
  const now = new Date();

  // Fetch the instructor's lesson buffer (used by gap detection). Falls back to 0.
  const [bufferMinutes, setBufferMinutes] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    if (!instructorId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("instructors")
          .select("lesson_buffer_minutes")
          .eq("id", instructorId)
          .maybeSingle();
        if (!cancelled && data?.lesson_buffer_minutes != null) {
          setBufferMinutes(Number(data.lesson_buffer_minutes) || 0);
        }
      } catch {
        // keep default 0
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  // Gap Fill sheet state
  const [activeGap, setActiveGap] = useState<GapRow | null>(null);

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

  /**
   * Build the interleaved row list for a day: events plus gap suggestions
   * inserted between adjacent events. Detection rule mirrors
   * MultiDayScheduleView: side allowance = bufferMinutes + 10m travel,
   * minimum effective gap = 60m. Only surface gaps when instructorId is
   * present (the parent enables the feature).
   */
  function buildDayRows(date: Date, dayEvents: CalendarEvent[]): DayRow[] {
    const out: DayRow[] = [];
    const canSurfaceGaps = !!instructorId;
    const dateStr = format(date, "yyyy-MM-dd");
    const sideAllowance = bufferMinutes + TRAVEL_FALLBACK_MIN;
    const isTodayView = isToday(date);
    const nowMinOfDay = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < dayEvents.length; i++) {
      const evt = dayEvents[i];
      out.push({ kind: "event", id: evt.id, evt });

      if (!canSurfaceGaps) continue;
      if (i === dayEvents.length - 1) continue;

      const next = dayEvents[i + 1];
      // Only consider gaps where both ends are on the same calendar day
      if (
        format(startOfDay(evt.end), "yyyy-MM-dd") !== dateStr ||
        format(startOfDay(next.start), "yyyy-MM-dd") !== dateStr
      ) {
        continue;
      }

      const endMin = evt.end.getHours() * 60 + evt.end.getMinutes();
      const nextStartMin = next.start.getHours() * 60 + next.start.getMinutes();
      const effectiveStartMin = endMin + sideAllowance;
      const effectiveEndMin = nextStartMin - sideAllowance;
      const effectiveGap = effectiveEndMin - effectiveStartMin;

      if (effectiveGap < MIN_OFFERABLE_GAP_MIN) continue;

      // Skip past gaps for today
      if (isTodayView && effectiveEndMin <= nowMinOfDay) continue;

      out.push({
        kind: "gap",
        id: `gap-${dateStr}-${effectiveStartMin}-${effectiveEndMin}`,
        date: dateStr,
        startTime: fmtMins(effectiveStartMin),
        endTime: fmtMins(effectiveEndMin),
        durationMin: effectiveGap,
      });
    }

    return out;
  }

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
        const rows = buildDayRows(day, dayEvents);

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
                {rows.map((row, idx) => {
                  const isLastRow = idx === rows.length - 1;
                  const nextRow = rows[idx + 1];
                  // Hairline divider between two consecutive event rows only.
                  const showDivider =
                    !isLastRow && row.kind === "event" && nextRow?.kind === "event";

                  if (row.kind === "gap") {
                    return (
                      <GapSuggestionRow
                        key={row.id}
                        row={row}
                        onFill={(g) => setActiveGap(g)}
                      />
                    );
                  }

                  const status = getRowStatus(row.evt, now, dayEvents);
                  return (
                    <div key={row.id}>
                      <ScheduleListRow evt={row.evt} status={status} onPress={onEventClick} />
                      {showDivider && (
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

      {/* Gap Filler bottom sheet — reuses the existing flow */}
      {instructorId && activeGap && (
        <GapFillSheet
          open={!!activeGap}
          onOpenChange={(open) => {
            if (!open) setActiveGap(null);
          }}
          instructorId={instructorId}
          instructorName={instructorName || "Your instructor"}
          date={activeGap.date}
          startTime={activeGap.startTime}
          endTime={activeGap.endTime}
          onSent={() => {
            setActiveGap(null);
            onGapFilled?.();
          }}
        />
      )}
    </div>
  );
}
