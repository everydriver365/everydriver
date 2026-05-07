import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, isSameDay, isTomorrow, startOfDay } from "date-fns";
import { ChevronRight, Plus, MapPin } from "lucide-react";
import { motion } from "framer-motion";

import { useScheduleWeek, type ScheduleDay, type ScheduleLesson } from "@/hooks/useScheduleWeek";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";

/* ---------- DSM tokens (match MobileHomeRedesign) ---------- */
const RED = "#C8242C";
const BLUE = "#1E6FB8";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#5B6B8A";
const TEXT_TERTIARY = "#8E8E93";
const TINT_GREY = "#F1EFE8";
const TINT_BLUE = "#E8F2FA";
const TINT_BLUE_FG = "#0A4F8A";
const TINT_AMBER = "#FAEEDA";
const TINT_AMBER_FG = "#854F0B";
const SUCCESS = "#1D9E75";
const WARNING = "#BA7517";
const DIVIDER = "#E5E7EB";
const CARD_BG = "#FFFFFF";
const SHADOW = "0 1px 2px rgba(16,24,40,0.04)";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

/* ---------- Helpers ---------- */
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}`;
}
function shortLine(addr: string | null, postcode: string | null) {
  if (addr) {
    const first = addr.split(",")[0]?.trim();
    if (first) return first;
  }
  return postcode || "Pickup";
}
function lessonAccentColor(l: ScheduleLesson, now: Date): string {
  if (l.status === "cancelled") return TEXT_TERTIARY;
  if (l.status === "completed") return SUCCESS;
  if (now >= l.startDate && now <= l.endDate) return RED;
  const t = (l.lessonType || "").toLowerCase();
  if (t.includes("test")) return WARNING;
  return BLUE;
}
function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

/* ============================================================ */
/* Section header                                               */
/* ============================================================ */
function SectionHeader({ onWeekClick }: { onWeekClick: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 4px 12px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: TEXT_SECONDARY,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
        }}
      >
        Schedule
      </span>
      <button
        type="button"
        onClick={onWeekClick}
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: BLUE,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Week →
      </button>
    </div>
  );
}

/* ============================================================ */
/* Day card + strip                                             */
/* ============================================================ */
const DayCard = memo(function DayCard({
  day,
  isSelected,
  onSelect,
}: {
  day: ScheduleDay;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const labelColor = isSelected
    ? "rgba(255,255,255,0.85)"
    : day.isWorkingDay
    ? TEXT_SECONDARY
    : TEXT_TERTIARY;
  const numberColor = isSelected
    ? "#FFFFFF"
    : day.isWorkingDay
    ? TEXT_PRIMARY
    : TEXT_TERTIARY;

  let fillColor = "transparent";
  if (isSelected) fillColor = "#FFFFFF";
  else if (day.utilizationPercent >= 100) fillColor = RED;
  else if (day.utilizationPercent > 0) fillColor = BLUE;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${day.dayOfWeek} ${day.dayOfMonth}, ${day.hoursBooked} hours booked of ${day.hoursAvailable}`}
      title={`${day.hoursBooked}h / ${day.hoursAvailable}h booked`}
      style={{
        flex: "1 0 0",
        minWidth: 40,
        scrollSnapAlign: "start",
        background: isSelected ? RED : CARD_BG,
        opacity: !isSelected && !day.isWorkingDay ? 0.6 : 1,
        border: isSelected ? "none" : `0.5px solid ${DIVIDER}`,
        borderRadius: 10,
        padding: "8px 0 6px",
        textAlign: "center",
        cursor: "pointer",
        boxShadow: isSelected ? "none" : SHADOW,
        transition: "transform 120ms ease, background 160ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
      onPointerDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: labelColor,
          lineHeight: 1,
        }}
      >
        {day.dayOfWeek}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: numberColor,
          lineHeight: 1,
          margin: "1px 0 4px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {day.dayOfMonth}
      </div>
      {day.isWorkingDay ? (
        <div
          style={{
            height: 3,
            borderRadius: 2,
            margin: "0 8px",
            background: isSelected ? "rgba(255,255,255,0.25)" : TINT_GREY,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${day.utilizationPercent}%`,
              height: "100%",
              background: fillColor,
              transition: "width 400ms ease-out",
            }}
          />
        </div>
      ) : (
        <div style={{ height: 3, margin: "0 8px" }} />
      )}
    </button>
  );
});

function DayStrip({
  days,
  selectedDate,
  onSelect,
}: {
  days: ScheduleDay[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Day strip"
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 12,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
      }}
      className="scrollbar-hide"
      onKeyDown={(e) => {
        const idx = days.findIndex((d) => isSameDay(d.date, selectedDate));
        if (e.key === "ArrowLeft" && idx > 0) onSelect(days[idx - 1].date);
        if (e.key === "ArrowRight" && idx >= 0 && idx < days.length - 1)
          onSelect(days[idx + 1].date);
      }}
    >
      {days.map((d) => (
        <DayCard
          key={d.dateStr}
          day={d}
          isSelected={isSameDay(d.date, selectedDate)}
          onSelect={() => onSelect(d.date)}
        />
      ))}
    </div>
  );
}

/* ============================================================ */
/* Capacity ring                                                */
/* ============================================================ */
const CapacityRing = memo(function CapacityRing({
  hoursBooked,
  hoursAvailable,
  utilizationPercent,
}: {
  hoursBooked: number;
  hoursAvailable: number;
  utilizationPercent: number;
}) {
  const r = 22;
  const circumference = 2 * Math.PI * r; // ~138.23
  const fillLength = (utilizationPercent / 100) * circumference;
  const reduced = prefersReducedMotion();
  const stroke =
    utilizationPercent >= 90 ? RED : utilizationPercent >= 70 ? WARNING : BLUE;

  return (
    <div
      style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}
      role="img"
      aria-label={`${hoursBooked} hours booked out of ${hoursAvailable}, ${utilizationPercent}% capacity`}
    >
      <svg
        viewBox="0 0 52 52"
        width={52}
        height={52}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        <circle cx={26} cy={26} r={r} stroke={TINT_GREY} strokeWidth={5} fill="none" />
        <motion.circle
          cx={26}
          cy={26}
          r={r}
          stroke={stroke}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${fillLength} ${circumference}`}
          initial={reduced ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Number.isInteger(hoursBooked) ? hoursBooked : hoursBooked.toFixed(1)}h
        </span>
        <span
          style={{
            fontSize: 8,
            color: TEXT_TERTIARY,
            letterSpacing: 0.5,
            marginTop: 1,
          }}
        >
          / {Number.isInteger(hoursAvailable) ? hoursAvailable : hoursAvailable.toFixed(1)}h
        </span>
      </div>
    </div>
  );
});

/* ============================================================ */
/* Day summary card                                             */
/* ============================================================ */
function DaySummaryCard({
  day,
  standardRate,
  showRevenuePotential = true,
  onFillGaps,
}: {
  day: ScheduleDay;
  standardRate: number;
  showRevenuePotential?: boolean;
  onFillGaps: () => void;
}) {
  const lessonCount = day.lessons.length;
  const hoursOpen = Math.max(0, day.hoursAvailable - day.hoursBooked);
  const potentialEarnings = Math.round(hoursOpen * standardRate);

  let labelText = `${day.dayOfWeek} ${day.dayOfMonth} ${day.monthShort}`;
  if (day.isToday) labelText += " · TODAY";
  else if (isTomorrow(day.date)) labelText += " · TOMORROW";

  let secondary: string;
  if (!day.isWorkingDay) secondary = "Day off";
  else if (hoursOpen === 0) secondary = "Fully booked";
  else if (showRevenuePotential)
    secondary = `${fmtDuration(hoursOpen * 60)} open · could earn £${potentialEarnings}`;
  else secondary = `${fmtDuration(hoursOpen * 60)} available`;

  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: 12,
        padding: "14px 16px 12px",
        marginBottom: 10,
        boxShadow: SHADOW,
        border: `0.5px solid ${DIVIDER}`,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <CapacityRing
          hoursBooked={day.hoursBooked}
          hoursAvailable={day.hoursAvailable}
          utilizationPercent={day.utilizationPercent}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: 1,
              color: TEXT_SECONDARY,
              textTransform: "uppercase",
            }}
          >
            {labelText}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              marginTop: 2,
              lineHeight: 1.2,
            }}
          >
            {lessonCount} lesson{lessonCount === 1 ? "" : "s"} · {fmtDuration(day.hoursBooked * 60)} booked
          </div>
          <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>
            {secondary}
          </div>
        </div>
      </div>

      {day.isWorkingDay && hoursOpen > 0 && (
        <button
          type="button"
          onClick={onFillGaps}
          style={{
            width: "100%",
            background: TINT_BLUE,
            color: BLUE,
            padding: 8,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            border: "none",
            marginTop: 12,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Plus size={13} strokeWidth={2.4} />
          Fill open time
        </button>
      )}
    </div>
  );
}

/* ============================================================ */
/* Lesson row + gap marker + empty state                        */
/* ============================================================ */
function LessonRow({
  lesson,
  now,
  onClick,
}: {
  lesson: ScheduleLesson;
  now: Date;
  onClick: () => void;
}) {
  const accent = lessonAccentColor(lesson, now);
  const t = (lesson.lessonType || "").toLowerCase();

  const pills: { label: string; bg: string; color: string; aria: string }[] = [];
  if (lesson.status === "cancelled") {
    pills.push({ label: "Cancelled", bg: TINT_GREY, color: TEXT_TERTIARY, aria: "Cancelled" });
  }
  if (t === "mock_test" || t.includes("mock")) {
    pills.push({ label: "Mock test", bg: TINT_AMBER, color: TINT_AMBER_FG, aria: "Mock test" });
  } else if (t === "test_prep" || t.includes("test prep")) {
    pills.push({ label: "test prep", bg: TINT_AMBER, color: TINT_AMBER_FG, aria: "Test preparation" });
  } else if (t.includes("test")) {
    pills.push({ label: "test day", bg: TINT_AMBER, color: TINT_AMBER_FG, aria: "Test day" });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        background: CARD_BG,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        width: "100%",
        textAlign: "left",
        border: `0.5px solid ${DIVIDER}`,
        boxShadow: SHADOW,
        display: "flex",
        gap: 12,
        alignItems: "center",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
      aria-label={`Lesson with ${lesson.pupilName}, ${lesson.startTime} for ${fmtDuration(lesson.durationMinutes)}, at ${shortLine(lesson.pickupLocation, lesson.pickupPostcode)}`}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 12,
          bottom: 12,
          width: 3,
          borderRadius: "0 2px 2px 0",
          background: accent,
        }}
      />
      <div style={{ paddingLeft: 6, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: accent,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {lesson.startTime}
        </div>
        <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 3 }}>
          {fmtDuration(lesson.durationMinutes)}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: TEXT_PRIMARY }}>
            {lesson.pupilFirstName} {lesson.pupilLastInitial}
          </span>
          {pills.map((p) => (
            <span
              key={p.label}
              aria-label={p.aria}
              style={{
                background: p.bg,
                color: p.color,
                fontSize: 10,
                fontWeight: 500,
                padding: "1px 6px",
                borderRadius: 8,
                whiteSpace: "nowrap",
              }}
            >
              {p.label}
            </span>
          ))}
        </div>
        <div
          style={{
            fontSize: 12,
            color: TEXT_SECONDARY,
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          <MapPin size={12} strokeWidth={2} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {shortLine(lesson.pickupLocation, lesson.pickupPostcode)}
          </span>
        </div>
      </div>

      <ChevronRight size={16} color={TEXT_TERTIARY} />
    </button>
  );
}

function GapMarker({
  startTime,
  endTime,
  onClick,
}: {
  startTime: string;
  endTime: string;
  onClick: () => void;
}) {
  const mins = timeToMinutes(endTime) - timeToMinutes(startTime);
  const label = `${fmtDuration(mins)} open · ${startTime} — ${endTime}`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${fmtDuration(mins)} of open time between ${startTime} and ${endTime}, tap to fill`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 4px 8px",
        opacity: 0.6,
        background: "transparent",
        border: "none",
        width: "100%",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, transparent, ${DIVIDER}, transparent)`,
        }}
      />
      <span
        style={{
          fontSize: 10,
          color: TEXT_TERTIARY,
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, transparent, ${DIVIDER}, transparent)`,
        }}
      />
    </button>
  );
}

function EmptyDayState({
  isWorkingDay,
  onAddLesson,
  onBlockDay,
}: {
  isWorkingDay: boolean;
  onAddLesson: () => void;
  onBlockDay: () => void;
}) {
  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: 12,
        padding: "24px 16px",
        textAlign: "center",
        border: `0.5px solid ${DIVIDER}`,
        boxShadow: SHADOW,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_SECONDARY }}>
        Free day
      </div>
      <div style={{ fontSize: 12, color: TEXT_TERTIARY, marginTop: 4 }}>
        {isWorkingDay
          ? "Add a lesson or block off the day"
          : "You have this day off"}
      </div>
      {isWorkingDay && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
          <button
            type="button"
            onClick={onAddLesson}
            style={{
              background: BLUE,
              color: "#FFF",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Add lesson
          </button>
          <button
            type="button"
            onClick={onBlockDay}
            style={{
              background: TINT_BLUE,
              color: BLUE,
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Block day
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* Lesson list with gaps                                        */
/* ============================================================ */
function LessonList({
  day,
  onLessonClick,
  onGapClick,
  onAddLesson,
  onBlockDay,
}: {
  day: ScheduleDay;
  onLessonClick: (id: string) => void;
  onGapClick: (start: string, end: string) => void;
  onAddLesson: () => void;
  onBlockDay: () => void;
}) {
  const now = new Date();
  const items: React.ReactNode[] = [];

  if (day.lessons.length === 0) {
    return (
      <EmptyDayState
        isWorkingDay={day.isWorkingDay}
        onAddLesson={onAddLesson}
        onBlockDay={onBlockDay}
      />
    );
  }

  const workStart = day.isWorkingDay ? timeToMinutes(day.workingStart) : null;
  const workEnd = day.isWorkingDay ? timeToMinutes(day.workingEnd) : null;

  // Pre gap (before first lesson)
  if (workStart !== null) {
    const first = day.lessons[0];
    const gap = timeToMinutes(first.startTime) - workStart;
    if (gap >= 30) {
      items.push(
        <GapMarker
          key="gap-start"
          startTime={day.workingStart}
          endTime={first.startTime}
          onClick={() => onGapClick(day.workingStart, first.startTime)}
        />,
      );
    }
  }

  for (let i = 0; i < day.lessons.length; i++) {
    const l = day.lessons[i];
    items.push(
      <LessonRow key={l.id} lesson={l} now={now} onClick={() => onLessonClick(l.id)} />,
    );
    const next = day.lessons[i + 1];
    if (next) {
      const gap = timeToMinutes(next.startTime) - timeToMinutes(l.endTime);
      if (gap >= 30) {
        items.push(
          <GapMarker
            key={`gap-${l.id}`}
            startTime={l.endTime}
            endTime={next.startTime}
            onClick={() => onGapClick(l.endTime, next.startTime)}
          />,
        );
      }
    }
  }

  // Trailing gap
  if (workEnd !== null) {
    const last = day.lessons[day.lessons.length - 1];
    const gap = workEnd - timeToMinutes(last.endTime);
    if (gap >= 30) {
      items.push(
        <GapMarker
          key="gap-end"
          startTime={last.endTime}
          endTime={day.workingEnd}
          onClick={() => onGapClick(last.endTime, day.workingEnd)}
        />,
      );
    }
  }

  return <div>{items}</div>;
}

/* ============================================================ */
/* Public Schedule                                              */
/* ============================================================ */
export default function Schedule({
  instructorId,
  showRevenuePotential = true,
}: {
  instructorId: string;
  showRevenuePotential?: boolean;
}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [weekStart, setWeekStart] = useState<Date>(() => startOfDay(new Date()));
  const [addOpen, setAddOpen] = useState(false);

  // If user selects a date outside current 7-day window, slide the window.
  useEffect(() => {
    const diffDays = Math.floor(
      (selectedDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays < 0 || diffDays > 6) {
      setWeekStart(selectedDate);
    }
  }, [selectedDate, weekStart]);

  const { data: days, isLoading, settings } = useScheduleWeek(instructorId, weekStart, 7);

  const selectedDay: ScheduleDay | undefined = useMemo(() => {
    if (!days) return undefined;
    return days.find((d) => isSameDay(d.date, selectedDate)) || days[0];
  }, [days, selectedDate]);

  const openAddLesson = () => setAddOpen(true);
  const handleLessonClick = (id: string) => navigate(`/instructor/lessons/${id}`);
  const handleGapClick = (_start: string, _end: string) => {
    // For now, opening Add Lesson scoped to the day; future: prefill time range.
    setAddOpen(true);
  };
  const handleBlockDay = () => navigate("/instructor/availability");

  if (!days || isLoading) {
    return (
      <div style={{ padding: "0 16px", marginBottom: 14, fontFamily: FONT }}>
        <SectionHeader onWeekClick={() => navigate("/instructor/diary")} />
        <div
          style={{
            height: 56,
            background: CARD_BG,
            borderRadius: 10,
            border: `0.5px solid ${DIVIDER}`,
            marginBottom: 12,
          }}
        />
        <div
          style={{
            height: 92,
            background: CARD_BG,
            borderRadius: 12,
            border: `0.5px solid ${DIVIDER}`,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px", marginBottom: 14, fontFamily: FONT, color: TEXT_PRIMARY }}>
      <SectionHeader onWeekClick={() => navigate("/instructor/diary")} />
      <DayStrip days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />
      {selectedDay && (
        <>
          <DaySummaryCard
            day={selectedDay}
            standardRate={settings.standardRate}
            showRevenuePotential={showRevenuePotential}
            onFillGaps={openAddLesson}
          />
          <LessonList
            day={selectedDay}
            onLessonClick={handleLessonClick}
            onGapClick={handleGapClick}
            onAddLesson={openAddLesson}
            onBlockDay={handleBlockDay}
          />
        </>
      )}

      <button
        type="button"
        onClick={openAddLesson}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          background: CARD_BG,
          color: BLUE,
          border: `0.5px solid ${DIVIDER}`,
          boxShadow: SHADOW,
          fontSize: 14,
          fontWeight: 500,
          marginTop: 8,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Plus size={16} strokeWidth={2.4} />
        Add lesson
      </button>

      <AddLessonSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        instructorId={instructorId}
        defaultDate={selectedDate}
        onSuccess={() => setAddOpen(false)}
      />
    </div>
  );
}
