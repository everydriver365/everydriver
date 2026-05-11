import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, isSameDay, isTomorrow, startOfDay } from "date-fns";
import { ChevronRight, ChevronLeft, Plus, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import { useScheduleWeek, type ScheduleDay, type ScheduleLesson } from "@/hooks/useScheduleWeek";
import { AppointmentTile } from "@/components/instructor/AppointmentTile";
import { useDayLessonHistory, eolKey } from "@/hooks/useDayLessonHistory";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { EndLessonWizard } from "@/components/instructor/EndLessonWizard";
import { supabase } from "@/integrations/supabase/client";

/* ---------- DSM tokens (match MobileHomeRedesign) ---------- */
const RED = "#C8242C";
const BLUE = "#1E6FB8";
const DSM_BLUE = "#1A52A0";
const DSM_BLUE_TINT = "#F0F5FF";
const DSM_BLUE_BORDER = "rgba(26,82,160,0.08)";
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
  return DSM_BLUE;
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
        padding: "0 4px",
        marginBottom: 8,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#8E8E93",
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
          fontSize: 14,
          fontWeight: 600,
          color: DSM_BLUE,
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
/* Day chip + week strip card                                   */
/* ============================================================ */
function isoWeekNumber(d: Date): number {
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

const DayChip = memo(function DayChip({
  day,
  isSelected,
  onSelect,
}: {
  day: ScheduleDay;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const hasLessons = day.lessons.length > 0;
  // No "events" data on ScheduleDay yet — reserved for later wiring.
  const hasEvent = false;
  const eventColor = "#B45309";
  const eventBg = "#FFF6E6";

  const dayIndex = day.date.getDay(); // 0 = Sun .. 6 = Sat
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const shortLetter = (day.dayOfWeek || "").charAt(0).toUpperCase();

  const showDot = !isSelected && (hasLessons || hasEvent);
  const dotColor = hasLessons ? DSM_BLUE : eventColor;

  let circleBg = "transparent";
  let circleShadow = "none";
  if (isSelected) {
    circleBg = DSM_BLUE;
    circleShadow = "0 2px 6px rgba(26,82,160,0.30)";
  } else if (hasEvent && !hasLessons) {
    circleBg = eventBg;
  }

  let numberColor = "#1A1A1A";
  if (isSelected) numberColor = "#FFFFFF";
  else if (hasEvent && !hasLessons) numberColor = eventColor;
  else if (isWeekend && !hasLessons && !hasEvent) numberColor = "#C7C7CC";

  const letterColor = isSelected ? DSM_BLUE : "#8E8E93";
  const numberWeight = isSelected ? 700 : hasLessons || hasEvent ? 600 : 500;
  const letterWeight = isSelected ? 700 : 500;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${day.dayOfWeek} ${day.dayOfMonth}`}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        background: "transparent",
        border: "none",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: letterWeight,
          color: letterColor,
          letterSpacing: 0.04,
        }}
      >
        {shortLetter}
      </span>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          background: circleBg,
          boxShadow: circleShadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 160ms ease",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: numberWeight,
            color: numberColor,
            letterSpacing: -0.3,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {day.dayOfMonth}
        </span>
      </span>
      <span
        style={{
          height: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showDot ? (
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              background: dotColor,
              display: "block",
            }}
          />
        ) : null}
      </span>
    </button>
  );
});

function DayStripCard({
  days,
  selectedDate,
  onSelect,
  onPrevWeek,
  onNextWeek,
}: {
  days: ScheduleDay[];
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const reference = days[0]?.date ?? selectedDate;
  const monthLabel = format(reference, "MMM yyyy");
  const weekNumber = isoWeekNumber(reference);

  const navBtn: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 11,
    background: "#F2F4F8",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: 14,
        padding: "8px 10px",
        marginBottom: 10,
        border: `0.5px solid ${DSM_BLUE_BORDER}`,
      }}
      onKeyDown={(e) => {
        const idx = days.findIndex((d) => isSameDay(d.date, selectedDate));
        if (e.key === "ArrowLeft" && idx > 0) onSelect(days[idx - 1].date);
        if (e.key === "ArrowRight" && idx >= 0 && idx < days.length - 1)
          onSelect(days[idx + 1].date);
      }}
    >
      {/* Week header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 7,
          padding: "0 2px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.2 }}>
            {monthLabel}
          </span>
          <span style={{ fontSize: 14, color: "#8E8E93" }}>· W{weekNumber}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" onClick={onPrevWeek} aria-label="Previous week" style={navBtn}>
            <ChevronLeft size={8} color="#5B6B8A" strokeWidth={2.5} />
          </button>
          <button type="button" onClick={onNextWeek} aria-label="Next week" style={navBtn}>
            <ChevronRight size={8} color="#5B6B8A" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Day row */}
      <div style={{ display: "flex", gap: 3 }} role="tablist" aria-label="Day strip">
        {days.map((d) => (
          <DayChip
            key={d.dateStr}
            day={d}
            isSelected={isSameDay(d.date, selectedDate)}
            onSelect={() => onSelect(d.date)}
          />
        ))}
      </div>
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
            fontSize: 14,
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
            fontSize: 14,
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
  const bookedHours = day.hoursBooked;
  const freeHours = Math.max(0, day.hoursAvailable - day.hoursBooked);
  const potentialEarnings = showRevenuePotential ? Math.round(freeHours * standardRate) : 0;

  let labelText = `${day.dayOfWeek} ${day.dayOfMonth} ${day.monthShort}`;
  if (day.isToday) labelText += " · Today";
  else if (isTomorrow(day.date)) labelText += " · Tomorrow";

  const fmtH = (h: number) =>
    Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;

  const stats: { value: string | number; label: string; color: string }[] = [
    { value: lessonCount, label: "Lessons", color: DSM_BLUE },
    { value: fmtH(bookedHours), label: "Booked", color: "#1A7A3C" },
    { value: fmtH(freeHours), label: "Free", color: "#5B6B8A" },
  ];

  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 8,
        border: `0.5px solid ${DSM_BLUE_BORDER}`,
      }}
    >
      {/* Header band */}
      <div
        style={{
          background: DSM_BLUE_TINT,
          padding: "9px 12px",
          borderBottom: `0.5px solid rgba(26,82,160,0.07)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: DSM_BLUE,
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: DSM_BLUE,
              letterSpacing: 0.4,
            }}
          >
            {labelText}
          </span>
        </div>
        <span style={{ fontSize: 14, color: "#8E8E93" }}>
          {lessonCount} lesson{lessonCount !== 1 ? "s" : ""} booked
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", borderBottom: `0.5px solid #F0F3F8` }}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderLeft: i > 0 ? `0.5px solid #F0F3F8` : "none",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: stat.color,
                letterSpacing: -0.5,
                lineHeight: "19px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 14, color: "#8E8E93", marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Earnings potential row */}
      {potentialEarnings > 0 && (
        <div
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `0.5px solid #F0F3F8`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontSize: 14,
                color: "#1A7A3C",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              £
            </span>
            <span style={{ fontSize: 14, color: "#8E8E93" }}>Could earn</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A7A3C" }}>
            £{potentialEarnings} today
          </span>
        </div>
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
  eolDone,
  onClick,
  onEOLClick,
  stackedMeta,
}: {
  lesson: ScheduleLesson;
  now: Date;
  eolDone: boolean;
  onClick: () => void;
  onEOLClick: (e: React.MouseEvent) => void;
  stackedMeta?: boolean;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <AppointmentTile
        pupilDisplayName={`${lesson.pupilFirstName} ${lesson.pupilLastInitial}`}
        startTimeLabel={lesson.startTime}
        durationMinutes={lesson.durationMinutes}
        pickupLocation={lesson.pickupLocation}
        pickupPostcode={lesson.pickupPostcode}
        lessonType={lesson.lessonType}
        status={lesson.status}
        paymentStatus={lesson.paymentStatus}
        startDate={lesson.startDate}
        endDate={lesson.endDate}
        now={now}
        eolDone={eolDone}
        onClick={onClick}
        onEOLClick={onEOLClick}
        stackedMeta={stackedMeta}
      />
    </div>
  );
}

/* ---------- Open slot card ---------- */
const PRIME_TINT = "#F0997B";
const PRIME_FG = "#712B13";
const OPEN_TINT = "#B5D4F4";

function isPrimeTimeRange(start: Date, end: Date): boolean {
  // Default windows: weekday eves Mon-Fri 17-20, weekend day Sat-Sun 09-17
  const checkOverlap = (d: Date) => {
    const dow = d.getDay(); // 0=Sun..6=Sat
    const minutes = d.getHours() * 60 + d.getMinutes();
    if (dow >= 1 && dow <= 5) {
      return minutes >= 17 * 60 && minutes < 20 * 60;
    }
    // weekend
    return minutes >= 9 * 60 && minutes < 17 * 60;
  };
  // Sample at start and end-1min; cheap approximation
  if (checkOverlap(start)) return true;
  const probe = new Date(end.getTime() - 60_000);
  if (checkOverlap(probe)) return true;
  return false;
}

const OpenSlotCard = memo(function OpenSlotCard({
  startDate,
  endDate,
  startTime,
  endTime,
  durationMinutes,
  isAllDay,
  isPast,
  standardRate,
  standardLessonMinutes,
  showRevenuePotential,
  onBook,
}: {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isAllDay: boolean;
  isPast: boolean;
  standardRate: number;
  standardLessonMinutes: number;
  showRevenuePotential: boolean;
  onBook: () => void;
}) {
  const isPrime = !isPast && isPrimeTimeRange(startDate, endDate);
  const earnings = Math.round((durationMinutes / 60) * standardRate);
  const lessonsThatFit = Math.max(1, Math.floor(durationMinutes / standardLessonMinutes));

  const accentBar = isPrime
    ? `repeating-linear-gradient(to bottom, ${PRIME_TINT} 0, ${PRIME_TINT} 4px, transparent 4px, transparent 8px)`
    : `repeating-linear-gradient(to bottom, ${OPEN_TINT} 0, ${OPEN_TINT} 4px, transparent 4px, transparent 8px)`;
  void accentBar;

  let title: string;
  let subtitle: string;
  if (isAllDay) {
    title = "Day fully open";
    subtitle = showRevenuePotential
      ? `${startTime} — ${endTime} · could earn £${earnings}`
      : `${startTime} — ${endTime} · ~${lessonsThatFit} lesson${lessonsThatFit === 1 ? "" : "s"} fit`;
  } else {
    title = isPrime ? "Prime time open" : "Open time";
    subtitle = showRevenuePotential
      ? `until ${endTime} · could earn £${earnings}`
      : `until ${endTime} · ~${lessonsThatFit} lesson${lessonsThatFit === 1 ? "" : "s"} fit`;
  }

  const aria = isPast
    ? `Open slot, ${fmtDuration(durationMinutes)} from ${startTime} to ${endTime} (past)`
    : isPrime
    ? `Prime time open slot, ${fmtDuration(durationMinutes)} from ${startTime} to ${endTime}, high-value booking window, tap to book`
    : `Open slot, ${fmtDuration(durationMinutes)} from ${startTime} to ${endTime}, potential earnings £${earnings}, tap to book a lesson`;

  const dashColor = isPrime ? PRIME_TINT : "#E0E5EE";
  const titleColor = isPrime ? PRIME_FG : "#8E8E93";
  const timeColor = isPrime ? PRIME_FG : "#8E8E93";

  return (
    <button
      type="button"
      onClick={isPast ? undefined : onBook}
      disabled={isPast}
      aria-label={aria}
      style={{
        position: "relative",
        overflow: "hidden",
        background: CARD_BG,
        borderRadius: 16,
        padding: "10px 12px",
        marginBottom: 8,
        width: "100%",
        textAlign: "left",
        border: `0.5px solid ${DSM_BLUE_BORDER}`,
        display: "flex",
        gap: 8,
        alignItems: "center",
        cursor: isPast ? "not-allowed" : "pointer",
        opacity: isPast ? 0.4 : 1,
        WebkitTapHighlightColor: "transparent",
        transition: "transform 120ms ease",
      }}
      onPointerDown={(e) => {
        if (!isPast) e.currentTarget.style.transform = "scale(0.98)";
      }}
      onPointerUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* Dashed left band */}
      <div
        aria-hidden
        style={{
          width: 3,
          height: 36,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: 4,
              borderRadius: 1.5,
              background: dashColor,
            }}
          />
        ))}
      </div>

      {/* Time + duration */}
      <div style={{ flexShrink: 0, minWidth: 38 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: timeColor,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {startTime}
        </div>
        <div style={{ fontSize: 14, color: "#C7C7CC", marginTop: 2 }}>
          {fmtDuration(durationMinutes)} open
        </div>
      </div>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: titleColor,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#C7C7CC",
            marginTop: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Add button */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          background: "#EEF3FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Plus size={11} color={DSM_BLUE} strokeWidth={2.2} />
      </div>
    </button>
  );
});

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
      <div style={{ fontSize: 14, color: TEXT_TERTIARY, marginTop: 4 }}>
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
              fontSize: 14,
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
              fontSize: 14,
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
function combineDateAndTime(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m || 0, 0, 0);
  return d;
}

function LessonList({
  day,
  eolSet,
  standardRate,
  standardLessonMinutes,
  showRevenuePotential,
  onLessonClick,
  onLessonEOL,
  onSlotBook,
  onAddLesson,
  onBlockDay,
  stackedMeta,
}: {
  day: ScheduleDay;
  eolSet: Set<string> | undefined;
  standardRate: number;
  standardLessonMinutes: number;
  showRevenuePotential: boolean;
  onLessonClick: (id: string) => void;
  onLessonEOL: (lesson: ScheduleLesson) => void;
  onSlotBook: (start: string, end: string) => void;
  onAddLesson: () => void;
  onBlockDay: () => void;
  stackedMeta?: boolean;
}) {
  const now = new Date();

  type Item =
    | { kind: "lesson"; lesson: ScheduleLesson; sortKey: number }
    | {
        kind: "slot";
        startDate: Date;
        endDate: Date;
        startTime: string;
        endTime: string;
        durationMinutes: number;
        isAllDay: boolean;
        sortKey: number;
      };

  // Empty + non-working day → keep simple empty state
  if (day.lessons.length === 0 && !day.isWorkingDay) {
    return (
      <EmptyDayState
        isWorkingDay={day.isWorkingDay}
        onAddLesson={onAddLesson}
        onBlockDay={onBlockDay}
      />
    );
  }

  const items: Item[] = [];

  // Lessons
  day.lessons.forEach((lesson) => {
    items.push({
      kind: "lesson",
      lesson,
      sortKey: lesson.startDate.getTime(),
    });
  });

  // Open slot tiles removed — duplicated by the day summary card

  items.sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div>
      {items.map((item) => {
        if (item.kind === "lesson") {
          const l = item.lesson;
          const eolDone = eolSet?.has(eolKey(l.pupilId, l.startTimeFull)) ?? false;
          return (
            <LessonRow
              key={l.id}
              lesson={l}
              now={now}
              eolDone={eolDone}
              onClick={() => onLessonClick(l.id)}
              onEOLClick={(e) => {
                e.stopPropagation();
                onLessonEOL(l);
              }}
              stackedMeta={stackedMeta}
            />
          );
        }
        const isPast = item.endDate.getTime() <= now.getTime();
        return (
          <OpenSlotCard
            key={`slot-${item.startDate.getTime()}`}
            startDate={item.startDate}
            endDate={item.endDate}
            startTime={item.startTime}
            endTime={item.endTime}
            durationMinutes={item.durationMinutes}
            isAllDay={item.isAllDay}
            isPast={isPast}
            standardRate={standardRate}
            standardLessonMinutes={standardLessonMinutes}
            showRevenuePotential={showRevenuePotential}
            onBook={() => onSlotBook(item.startTime, item.endTime)}
          />
        );
      })}
    </div>
  );
}

/* ============================================================ */
/* Public Schedule                                              */
/* ============================================================ */
export default function Schedule({
  instructorId,
  showRevenuePotential = true,
  stackedMeta = false,
}: {
  instructorId: string;
  showRevenuePotential?: boolean;
  stackedMeta?: boolean;
}) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [weekStart, setWeekStart] = useState<Date>(() => startOfDay(new Date()));
  const [addOpen, setAddOpen] = useState(false);
  const [wizardLesson, setWizardLesson] = useState<ScheduleLesson | null>(null);
  const [wizardBalance, setWizardBalance] = useState(0);
  const queryClient = useQueryClient();

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
  const { data: eolSet } = useDayLessonHistory(instructorId, selectedDate);

  const selectedDay: ScheduleDay | undefined = useMemo(() => {
    if (!days) return undefined;
    return days.find((d) => isSameDay(d.date, selectedDate)) || days[0];
  }, [days, selectedDate]);

  const openAddLesson = () => setAddOpen(true);
  const handleLessonClick = (id: string) => {
    const lesson = selectedDay?.lessons.find((l) => l.id === id);
    if (lesson?.pupilId) navigate(`/instructor/pupils/${lesson.pupilId}`);
  };
  const handleLessonEOL = async (lesson: ScheduleLesson) => {
    let balance = 0;
    try {
      const { data } = await supabase
        .from("pupils")
        .select("account_balance")
        .eq("id", lesson.pupilId)
        .single();
      balance = Number(data?.account_balance ?? 0);
    } catch {
      balance = 0;
    }
    setWizardBalance(balance);
    setWizardLesson(lesson);
  };
  const openGapFiller = (start?: string, end?: string) => {
    const params = new URLSearchParams();
    params.set("date", format(selectedDate, "yyyy-MM-dd"));
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    navigate(`/instructor/gaps?${params.toString()}`);
  };
  const handleGapClick = (start: string, end: string) => openGapFiller(start, end);
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
      <DayStripCard
        days={days}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onPrevWeek={() => {
          const newStart = addDays(weekStart, -7);
          setWeekStart(newStart);
          setSelectedDate(newStart);
        }}
        onNextWeek={() => {
          const newStart = addDays(weekStart, 7);
          setWeekStart(newStart);
          setSelectedDate(newStart);
        }}
      />
      {selectedDay && (
        <>
          <DaySummaryCard
            day={selectedDay}
            standardRate={settings.standardRate}
            showRevenuePotential={showRevenuePotential}
            onFillGaps={() => openGapFiller()}
          />
          <LessonList
            day={selectedDay}
            eolSet={eolSet}
            standardRate={settings.standardRate}
            standardLessonMinutes={60}
            showRevenuePotential={showRevenuePotential}
            onLessonClick={handleLessonClick}
            onLessonEOL={handleLessonEOL}
            onSlotBook={handleGapClick}
            onAddLesson={openAddLesson}
            onBlockDay={handleBlockDay}
            stackedMeta={stackedMeta}
          />
        </>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={openAddLesson}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 14,
            background: "#6B93C0",
            color: "#FFF",
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Plus size={13} color="#FFF" strokeWidth={2.2} />
          Add lesson
        </button>
        <button
          type="button"
          onClick={() => openGapFiller()}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 14,
            background: "#6B93C0",
            color: "#FFF",
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Plus size={13} color="#FFF" strokeWidth={2.2} />
          Fill gaps
        </button>
      </div>

      <AddLessonSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        instructorId={instructorId}
        defaultDate={selectedDate}
        onSuccess={() => {
          setAddOpen(false);
          queryClient.invalidateQueries({ queryKey: ["schedule-week"] });
          queryClient.invalidateQueries({ queryKey: ["day-lessons"] });
          queryClient.invalidateQueries({ queryKey: ["today-overview"] });
          queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
          queryClient.invalidateQueries({ queryKey: ["day-lesson-history"] });
        }}
      />

      {wizardLesson && (
        <EndLessonWizard
          open={!!wizardLesson}
          onOpenChange={(open) => {
            if (!open) setWizardLesson(null);
          }}
          lessonId={wizardLesson.id}
          pupilId={wizardLesson.pupilId}
          pupilName={wizardLesson.pupilName}
          instructorId={instructorId}
          durationMinutes={wizardLesson.durationMinutes}
          lessonDate={format(selectedDate, "yyyy-MM-dd")}
          startTime={wizardLesson.startTime}
          currentBalance={wizardBalance}
          onCompleted={() => {
            setWizardLesson(null);
            queryClient.invalidateQueries({ queryKey: ["schedule-week"] });
            queryClient.invalidateQueries({ queryKey: ["day-lesson-history"] });
            queryClient.invalidateQueries({ queryKey: ["day-lessons"] });
            queryClient.invalidateQueries({ queryKey: ["today-overview"] });
            queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
          }}
        />
      )}
    </div>
  );
}
