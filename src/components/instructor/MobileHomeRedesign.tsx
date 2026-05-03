import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { UpNextExpanded } from "@/components/instructor/UpNextExpanded";
import { useNavigate } from "react-router-dom";
import { format, parse, parseISO, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import {
  Phone,
  MessageSquare,
  Navigation as NavIcon,
  Clock,
  MapPin,
  ChevronRight,
  Briefcase,
  CalendarPlus,
  Calendar,
  PoundSterling,
  type LucideIcon,
} from "lucide-react";

import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { MapHeroStatic } from "@/components/instructor/MapHeroStatic";
import { MapHeroLive } from "@/components/instructor/upNext/MapHeroLive";

/* Restored sections from legacy home */
import { MobileHomeBottomSections } from "@/components/instructor/MobileHomeBottomSections";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { UpcomingEventsTile } from "@/components/instructor/UpcomingEventsTile";
import { useDormantPupilsCount } from "@/hooks/useDormantPupilsCount";
import { Wrench, Users as UsersIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, isPast } from "date-fns";

/* ---------- Brand tokens ---------- */
const RED = "#B23A3F";
const BLUE = "#3D55A1";
const CHARCOAL = "#2B2B2B";
const BG = "#F2F4F8";
const MUTED = "#5B6B8A";
const BORDER = "rgba(26,82,160,0.10)";
const ROW_BORDER = "#F0F3F8";
const BLUE_TINT = "#EDF2FE";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

/* ---------- Helpers ---------- */
function toSentence(name: string) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
function fmtTime(t: string) {
  try {
    return format(parse(t, "HH:mm:ss", new Date()), "HH:mm");
  } catch {
    return t.slice(0, 5);
  }
}
function fmtCountdown(min: number) {
  if (min <= 0) return "now";
  if (min >= 60 * 24) {
    const d = Math.round(min / (60 * 24));
    return d === 1 ? "1 day" : `${d} days`;
  }
  if (min >= 60) {
    const h = Math.round(min / 60);
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  return `${Math.max(1, Math.round(min))} min`;
}
function dayLabel(dateStr: string) {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE d MMM");
  } catch {
    return dateStr;
  }
}
function hoursLong(min: number) {
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

/* ---------- Section label ---------- */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#6B7A90",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "0 20px 10px",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Greeting block ---------- */
function GreetingBlock({
  firstName,
  lessonsToday,
  earningsToday,
  pendingJobs,
}: {
  firstName: string;
  lessonsToday: number;
  earningsToday: number;
  pendingJobs: number;
}) {
  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const dateLine = format(now, "EEEE, d MMMM");

  const Chip = ({
    value,
    label,
    tone = "blue",
    Icon,
  }: {
    value: string;
    label: string;
    tone?: "blue" | "green" | "amber";
    Icon: LucideIcon;
  }) => {
    const accent =
      tone === "amber" ? "#E29A2B" : tone === "green" ? "#2F9E6E" : "#315FAE";
    const tint =
      tone === "amber" ? "#FFF3DC" : tone === "green" ? "#E4F5EC" : "#E6EEFB";
    return (
      <div
        className="home-v2-tile"
        style={{
          flex: 1,
          minWidth: 0,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: tint,
            color: accent,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#0B1220",
              letterSpacing: "-0.3px",
              lineHeight: 1.05,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#64748B",
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px 20px 16px" }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#64748B",
          marginBottom: 6,
        }}
      >
        {dateLine}
      </div>
      <h1
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: "#0B1220",
          letterSpacing: "-0.6px",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {greet}, {firstName}.
      </h1>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Chip
          value={String(lessonsToday)}
          label={`Lesson${lessonsToday === 1 ? "" : "s"}`}
          tone="blue"
          Icon={Calendar}
        />
        <Chip
          value={`£${Math.round(earningsToday)}`}
          label="Today"
          tone="green"
          Icon={PoundSterling}
        />
        <Chip
          value={String(pendingJobs)}
          label="Waiting"
          tone={pendingJobs > 0 ? "amber" : "blue"}
          Icon={Clock}
        />
      </div>
    </div>
  );
}

/* ---------- Stats row ---------- */
function StatsRow({
  todaySessions,
  todayEarnings,
  weekHours,
  weekSessions,
}: {
  todaySessions: number;
  todayEarnings: number;
  weekHours: number;
  weekSessions: number;
}) {
  const Card = ({
    label,
    value,
    sub,
    accent,
    Icon,
  }: {
    label: string;
    value: string;
    sub: string;
    accent: string;
    Icon: LucideIcon;
  }) => (
    <div
      className="home-v2-card"
      style={{
        flex: 1,
        padding: "14px 14px",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6B7A90",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#0B1220",
            letterSpacing: "-0.5px",
            lineHeight: 1.05,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
          {sub}
        </div>
      </div>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: `${accent}1A`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={1.8} color={accent} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 10, padding: "0 20px 16px" }}>
      <Card
        label="TODAY"
        value={`£${Math.round(todayEarnings)}`}
        sub={`${todaySessions} lesson${todaySessions === 1 ? "" : "s"}`}
        accent="#2F9E6E"
        Icon={PoundSterling}
      />
      <Card
        label="THIS WEEK"
        value={`${weekHours}h`}
        sub={`${weekSessions} lesson${weekSessions === 1 ? "" : "s"}`}
        accent="#315FAE"
        Icon={Calendar}
      />
    </div>
  );
}

/* ---------- Map hero (illustrated SVG) ---------- */
function MapHero({
  countdown,
  startTime,
  whenLabel,
}: {
  countdown: string;
  startTime: string;
  whenLabel: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 126,
        width: "100%",
        background: "#E9EEF5",
        overflow: "hidden",
      }}
    >
      {/* Map illustration */}
      <svg
        viewBox="0 0 360 126"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: "block" }}
        aria-hidden
      >
        <rect width="360" height="126" fill="#E9EEF5" />
        {/* Block shapes */}
        <rect x="0" y="0" width="120" height="46" fill="#DCE3EE" />
        <rect x="170" y="0" width="190" height="46" fill="#DCE3EE" />
        <rect x="0" y="80" width="80" height="46" fill="#DCE3EE" />
        <rect x="130" y="80" width="100" height="46" fill="#DCE3EE" />
        <rect x="280" y="80" width="80" height="46" fill="#DCE3EE" />
        {/* Roads */}
        <rect x="120" y="0" width="50" height="126" fill="#F2F4F8" />
        <rect x="80" y="46" width="200" height="34" fill="#F2F4F8" />
        <rect x="230" y="0" width="2" height="126" fill="none" />
        {/* Dashed centre lines */}
        <line
          x1="145"
          y1="0"
          x2="145"
          y2="126"
          stroke="rgba(26,82,160,0.18)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <line
          x1="80"
          y1="63"
          x2="280"
          y2="63"
          stroke="rgba(26,82,160,0.18)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        {/* Pin */}
        <g transform="translate(145 63)">
          <circle r="14" fill={RED} fillOpacity="0.12" />
          <path
            d="M0 -10 C5.5 -10 10 -5.5 10 0 C10 7 0 16 0 16 C0 16 -10 7 -10 0 C-10 -5.5 -5.5 -10 0 -10 Z"
            fill={RED}
          />
          <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Frosted countdown pill */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "5px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          color: "#000000",
          border: `0.5px solid ${BORDER}`,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: RED,
            boxShadow: `0 0 0 0 ${RED}`,
            animation: "dsm-pulse 1.6s ease-out infinite",
          }}
        />
        In {countdown}
      </div>

      {/* Frosted time card */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "6px 10px",
          borderRadius: 12,
          textAlign: "right",
          border: `0.5px solid ${BORDER}`,
          minWidth: 64,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#000",
            letterSpacing: "-0.4px",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {startTime}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: MUTED,
            marginTop: 3,
            letterSpacing: "0.04em",
          }}
        >
          {whenLabel}
        </div>
      </div>

      <style>{`
        @keyframes dsm-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(204,34,41,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(204,34,41,0); }
          100% { box-shadow: 0 0 0 0 rgba(204,34,41,0); }
        }
      `}</style>
    </div>
  );
}

/* ---------- Up next tile ---------- */
function UpNextTile({
  pupilId,
  lessonId,
  pupilName,
  pupilPhone,
  pupilProfileImage,
  lessonDate,
  startTime,
  durationMinutes,
  pickupLocation,
  pickupPostcode,
  minutesUntil,
  expanded,
  onToggleExpanded,
  instructorId,
}: {
  pupilId: string;
  lessonId: string;
  pupilName: string;
  pupilPhone: string | null;
  pupilProfileImage: string | null;
  lessonDate: string;
  startTime: string;
  durationMinutes: number;
  pickupLocation: string | null;
  pickupPostcode: string | null;
  minutesUntil: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  instructorId: string;
}) {
  const navigate = useNavigate();
  const date = (() => {
    try {
      return parseISO(lessonDate);
    } catch {
      return new Date();
    }
  })();
  const dayNum = format(date, "d");
  const monthName = format(date, "MMM");
  const start = fmtTime(startTime);
  const whenLabel = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "EEE");
  const countdown = fmtCountdown(minutesUntil);

  const open = () => onToggleExpanded();
  const call = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pupilPhone) window.location.href = `tel:${pupilPhone}`;
  };
  const message = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/instructor/messages?pupilId=${pupilId}`);
  };
  const navTo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const q = encodeURIComponent(pickupLocation || pickupPostcode || "");
    if (q) window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, "_blank");
  };

  const IconTile = ({ children }: { children: React.ReactNode }) => (
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        background: BLUE_TINT,
        color: BLUE,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );

  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div
        role="button"
        onClick={open}
        className="home-v2-card"
        style={{
          overflow: "hidden",
          cursor: "pointer",
          padding: "14px 14px 14px 16px",
        }}
      >
        {/* Top split: details (left) + map (right) */}
        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          {/* LEFT: details */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* eyebrow */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#6B7A90",
                letterSpacing: "0.02em",
              }}
            >
              Next lesson
            </div>

            {/* avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span
                aria-hidden
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: BLUE_TINT,
                  color: BLUE,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <UserRound size={15} strokeWidth={2} />
              </span>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0B1220",
                  letterSpacing: "-0.4px",
                  lineHeight: 1.1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {toSentence(pupilName)}
              </div>
            </div>

            {/* date + time row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#64748B", fontSize: 12.5 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Calendar size={13} strokeWidth={2} />
                {`${whenLabel}, ${dayNum} ${monthName}`}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontVariantNumeric: "tabular-nums" }}>
                <Clock size={13} strokeWidth={2} />
                {start}{durationMinutes ? ` (${hoursLong(durationMinutes)})` : ""}
              </span>
            </div>

            {/* type pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#E6EEFB",
                  color: "#315FAE",
                  fontSize: 11.5,
                  fontWeight: 600,
                }}
              >
                Standard Lesson
              </span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#E4F5EC",
                  color: "#1F8A4D",
                  fontSize: 11.5,
                  fontWeight: 600,
                }}
              >
                Manual
              </span>
            </div>
          </div>

          {/* RIGHT: map */}
          <div
            style={{
              width: 132,
              flexShrink: 0,
              borderRadius: 14,
              overflow: "hidden",
              border: "0.5px solid rgba(15,35,65,0.08)",
            }}
          >
            <MapHeroLive
              lessonId={lessonId}
              pickupPostcode={pickupPostcode}
              pickupLocation={pickupLocation}
              countdown={countdown}
              minutesUntil={minutesUntil}
              startTime={start}
              whenLabel={whenLabel}
              expanded={expanded}
              onToggleExpanded={onToggleExpanded}
              pupilName={pupilName}
              pupilPhone={pupilPhone}
              pupilProfileImage={pupilProfileImage}
              instructorId={instructorId}
            />
          </div>
        </div>

        {/* Postcode + distance row (under split) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 12,
            paddingTop: 12,
            borderTop: "0.5px solid rgba(15,35,65,0.06)",
            color: "#0B1220",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <MapPin size={14} strokeWidth={2} style={{ color: "#94A3B8", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pickupPostcode || "Pick-up TBC"}
              {pickupLocation && (
                <span style={{ color: "#64748B", fontWeight: 400 }}> · {pickupLocation}</span>
              )}
            </span>
          </span>
        </div>

        {/* Action row — Call / Text / Navigate */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={call}
            disabled={!pupilPhone}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#1F8A4D",
              border: "1px solid rgba(15,35,65,0.10)",
              fontSize: 13.5,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: pupilPhone ? 1 : 0.5,
              cursor: pupilPhone ? "pointer" : "not-allowed",
            }}
          >
            <Phone size={14} strokeWidth={2.2} /> Call
          </button>
          <button
            type="button"
            onClick={message}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#315FAE",
              border: "1px solid rgba(15,35,65,0.10)",
              fontSize: 13.5,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <MessageSquare size={14} strokeWidth={2.2} /> Text
          </button>
          <button
            type="button"
            onClick={navTo}
            disabled={!(pickupPostcode || pickupLocation)}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 12,
              background: "#FFFFFF",
              color: "#315FAE",
              border: "1px solid rgba(15,35,65,0.10)",
              fontSize: 13.5,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: (pickupPostcode || pickupLocation) ? 1 : 0.5,
              cursor: (pickupPostcode || pickupLocation) ? "pointer" : "not-allowed",
            }}
          >
            <NavIcon size={14} strokeWidth={2.2} /> Navigate
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Attention items ---------- */
type AttentionGroup = "urgent" | "todo";
interface AttentionRow {
  key: string;
  group: AttentionGroup;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  badge?: { label: string; bg: string };
  onClick: () => void;
}

function AttentionGroupCard({
  rows,
  groupLabel,
  groupColor,
  groupBorder,
}: {
  rows: AttentionRow[];
  groupLabel: string;
  groupColor: string;
  groupBorder: string;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 20px", marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: groupColor,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {groupLabel}
        </span>
        <span style={{ flex: 1, height: 0.5, background: groupBorder }} />
      </div>
      <div style={{ padding: "0 20px", marginBottom: 10 }}>
        <div className="home-v2-card" style={{ overflow: "hidden", padding: 0 }}>
          {rows.map((r, i) => (
            <button
              key={r.key}
              type="button"
              onClick={r.onClick}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                background: "transparent",
                border: "none",
                borderTop: i === 0 ? "none" : "0.5px solid rgba(15,35,65,0.06)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: r.iconBg,
                  color: r.iconColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <r.Icon size={15} strokeWidth={2} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0B1220",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#64748B",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.subtitle}
                </div>
              </div>
              {r.badge && (
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    padding: "0 7px",
                    borderRadius: 11,
                    background: r.badge.bg,
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.badge.label}
                </span>
              )}
              <ChevronRight size={15} color="#C7D2DE" strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function AttentionCard({ rows }: { rows: AttentionRow[] }) {
  const urgent = rows.filter((r) => r.group === "urgent");
  const todo = rows.filter((r) => r.group === "todo");

  if (rows.length === 0) {
    return (
      <div style={{ padding: "0 20px 14px" }}>
        <div className="home-v2-card" style={{ padding: 18, textAlign: "center" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#0B1220",
              marginBottom: 4,
              letterSpacing: "-0.2px",
            }}
          >
            All clear
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B" }}>
            Nothing needs your attention right now
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 14 }}>
      <AttentionGroupCard rows={urgent} groupLabel="Urgent" groupColor="#B23A3F" groupBorder="rgba(178,58,63,0.18)" />
      <AttentionGroupCard rows={todo} groupLabel="To do" groupColor="#B45309" groupBorder="rgba(180,83,9,0.18)" />
    </div>
  );
}

/* ---------- Main ---------- */
interface MobileHomeRedesignProps {
  instructorId: string;
  instructorName?: string | null;
}

export function MobileHomeRedesign({
  instructorId,
  instructorName,
}: MobileHomeRedesignProps) {
  const navigate = useNavigate();
  const firstName = (instructorName || "there").split(" ")[0];

  const { data: today } = useTodayOverview(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { hoursThisWeek, lessonsThisWeek } = useInstructorLiveStats(instructorId);
  const pendingJobs = usePendingJobsCount();
  const { data: unread = 0 } = useUnreadMessagesCount(instructorId);
  const { data: paymentsSummary } = useInstructorPupilsPaymentSummary(instructorId);
  const { data: gapData } = useRealGapSlots(instructorId);
  const [expanded, setExpanded] = useState(false);

  const lessonsToday = today?.lessonCount ?? 0;
  const earningsToday = today?.expectedEarnings ?? 0;
  const todaySessions = lessonsToday;

  // Re-derive minutesUntil so it stays accurate without re-fetch
  const liveMinutes = useMemo(() => {
    if (!nextLesson) return 0;
    try {
      const start = new Date(`${nextLesson.lessonDate}T${nextLesson.startTime}`);
      return Math.max(0, differenceInMinutes(start, new Date()));
    } catch {
      return nextLesson.minutesUntil;
    }
  }, [nextLesson]);

  // Vehicle fault detection (replaces standalone VehicleHealthCard rendering)
  const { data: vehicle } = useQuery({
    queryKey: ["vehicle-health-attention", instructorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_vehicles")
        .select("registration, make, model, mot_expiry, insurance_expiry, tax_expiry, current_odometer_km, next_service_due_km")
        .eq("instructor_id", instructorId)
        .eq("is_primary", true)
        .maybeSingle();
      return data as any;
    },
  });
  const { data: dormantCount = 0 } = useDormantPupilsCount(instructorId);

  const vehicleFault = useMemo(() => {
    if (!vehicle) return null;
    const checks: Array<{ label: string; date: string | null; expired: boolean; soon: boolean }> = [
      { label: "MOT", date: vehicle.mot_expiry, expired: false, soon: false },
      { label: "Tax", date: vehicle.tax_expiry, expired: false, soon: false },
      { label: "Insurance", date: vehicle.insurance_expiry, expired: false, soon: false },
    ].map((c) => {
      if (!c.date) return c;
      const d = new Date(c.date);
      return { ...c, expired: isPast(d), soon: !isPast(d) && differenceInDays(d, new Date()) <= 30 };
    });
    const expired = checks.find((c) => c.expired);
    const soon = checks.find((c) => c.soon);
    const serviceDue =
      vehicle.next_service_due_km && vehicle.current_odometer_km && vehicle.current_odometer_km >= vehicle.next_service_due_km;
    if (expired) return { label: `${expired.label} expired`, urgent: true };
    if (serviceDue) return { label: "Service due", urgent: true };
    if (soon) return { label: `${soon.label} due soon`, urgent: false };
    return null;
  }, [vehicle]);

  const attentionRows: AttentionRow[] = [];

  if (pendingJobs > 0) {
    attentionRows.push({
      key: "jobs",
      group: "urgent",
      Icon: Briefcase,
      iconBg: "#FFF0F0",
      iconColor: RED,
      title: "Job offers waiting",
      subtitle: "Review new course enquiries",
      badge: { label: String(pendingJobs), bg: RED },
      onClick: () => navigate("/instructor/jobs"),
    });
  }

  if (vehicleFault) {
    attentionRows.push({
      key: "vehicle",
      group: vehicleFault.urgent ? "urgent" : "todo",
      Icon: Wrench,
      iconBg: vehicleFault.urgent ? "#FFF0F0" : "#FFF6E6",
      iconColor: vehicleFault.urgent ? RED : "#B45309",
      title: vehicleFault.urgent ? "Vehicle fault detected" : "Vehicle attention",
      subtitle: `${vehicleFault.label}${vehicle?.registration ? " · " + vehicle.registration : ""}`,
      onClick: () => navigate("/instructor/vehicle-health"),
    });
  }

  const openSlots = (gapData ?? []).reduce((sum, g) => sum + (g.slots?.length ?? 0), 0);
  if (openSlots > 0) {
    attentionRows.push({
      key: "gaps",
      group: "todo",
      Icon: CalendarPlus,
      iconBg: BLUE_TINT,
      iconColor: BLUE,
      title: "Open slots this week",
      subtitle: "Fill gaps in your schedule",
      badge: { label: String(openSlots), bg: BLUE },
      onClick: () => navigate("/instructor/schedule"),
    });
  }

  if (dormantCount > 0) {
    attentionRows.push({
      key: "dormant",
      group: "todo",
      Icon: UsersIcon,
      iconBg: "#FFF6E6",
      iconColor: "#B45309",
      title: `${dormantCount} dormant pupil${dormantCount === 1 ? "" : "s"}`,
      subtitle: "No lesson in 2+ weeks",
      badge: { label: String(dormantCount), bg: "#B45309" },
      onClick: () => navigate("/instructor/pupils?filter=dormant"),
    });
  }

  if (unread > 0) {
    attentionRows.push({
      key: "messages",
      group: "todo",
      Icon: MessageSquare,
      iconBg: BLUE_TINT,
      iconColor: BLUE,
      title: "Unread messages",
      subtitle: "Pupils waiting for a reply",
      badge: { label: String(unread), bg: BLUE },
      onClick: () => navigate("/instructor/messages"),
    });
  }

  const debt = paymentsSummary?.totalDebt ?? 0;
  if (debt > 0) {
    attentionRows.push({
      key: "balance",
      group: "todo",
      Icon: PoundSterling,
      iconBg: "#F1F4F8",
      iconColor: CHARCOAL,
      title: "Outstanding balance",
      subtitle: `£${Math.round(debt)} across ${paymentsSummary?.debtors ?? 0} pupil${
        (paymentsSummary?.debtors ?? 0) === 1 ? "" : "s"
      }`,
      onClick: () => navigate("/instructor/pay"),
    });
  }

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: FONT,
        WebkitFontSmoothing: "antialiased",
        color: CHARCOAL,
        paddingBottom: 96,
      }}
    >
      <GreetingBlock
        firstName={firstName}
        lessonsToday={lessonsToday}
        earningsToday={earningsToday}
        pendingJobs={pendingJobs}
      />

      <StatsRow
        todaySessions={todaySessions}
        todayEarnings={earningsToday}
        weekHours={hoursThisWeek || 0}
        weekSessions={lessonsThisWeek}
      />

      {nextLesson && (
        <>
          <SectionLabel>Up next</SectionLabel>
          <UpNextTile
            pupilId={nextLesson.pupilId}
            instructorId={instructorId}
            lessonId={nextLesson.lessonId}
            pupilName={nextLesson.pupilName}
            pupilPhone={nextLesson.pupilPhone}
            pupilProfileImage={nextLesson.pupilProfileImage}
            lessonDate={nextLesson.lessonDate}
            startTime={nextLesson.startTime}
            durationMinutes={nextLesson.durationMinutes}
            pickupLocation={nextLesson.pickupLocation}
            pickupPostcode={nextLesson.pickupPostcode}
            minutesUntil={liveMinutes}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((v) => !v)}
          />
          {expanded && (
            <UpNextExpanded
              lessonId={nextLesson.lessonId}
              pupilId={nextLesson.pupilId}
              pupilName={nextLesson.pupilName}
              pupilPhone={nextLesson.pupilPhone}
              pickupLocation={nextLesson.pickupLocation}
              pickupPostcode={nextLesson.pickupPostcode}
              pickupWhat3words={nextLesson.pickupWhat3words}
              pickupNotes={nextLesson.pickupNotes}
              startTime={nextLesson.startTime}
              durationMinutes={nextLesson.durationMinutes}
              accountBalance={(nextLesson as any).accountBalance ?? 0}
              prepaidHours={(nextLesson as any).prepaidHours ?? 0}
              checkInStatus={(nextLesson as any).checkInStatus}
              lessonStatus={(nextLesson as any).lessonStatus}
              lastLessonPlan={(nextLesson as any).lastLessonPlan}
              instructorId={instructorId}
            />
          )}
        </>
      )}

      {/* Schedule + Quick Access */}
      <div style={{ marginTop: 14 }}>
        <MobileHomeBottomSections instructorId={instructorId} />
      </div>

      {/* Needs attention (merged) */}
      <div style={{ marginTop: 6 }}>
        <SectionLabel>Needs attention</SectionLabel>
        <AttentionCard rows={attentionRows} />
      </div>

      {/* Upcoming events */}
      <UpcomingEventsTile instructorId={instructorId} />

      {/* Floating session bar */}
      <FloatingSessionBar instructorId={instructorId} />
    </div>
  );
}
