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
const RED = "#CC2229";
const BLUE = "#0A0F29";
const CHARCOAL = "#2B2B2B";
const BG = "#F2F4F8";
const MUTED = "#5B6B8A";
const BORDER = "rgba(26,82,160,0.10)";
const ROW_BORDER = "#F0F3F8";
const BLUE_TINT = "#EEF3FF";
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
        fontSize: 10,
        fontWeight: 700,
        color: MUTED,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "0 18px 8px",
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
  const dateLine = format(now, "EEE · d MMM yyyy").toUpperCase();

  const Pill = ({
    label,
    tone,
  }: {
    label: string;
    tone: "blue" | "red";
  }) => {
    const isRed = tone === "red";
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 26,
          padding: "0 11px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: isRed ? RED : "#FFFFFF",
          color: isRed ? "#FFFFFF" : BLUE,
          border: isRed ? "0.5px solid transparent" : `0.5px solid ${BLUE}`,
          letterSpacing: "-0.1px",
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div style={{ padding: "20px 18px 12px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: MUTED,
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {dateLine}
      </div>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: "#1A1A1A",
          letterSpacing: "-0.4px",
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        {greet}, {firstName}.
      </h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        <Pill
          label={`${lessonsToday} lesson${lessonsToday === 1 ? "" : "s"}`}
          tone="blue"
        />
        <Pill label={`£${Math.round(earningsToday)} today`} tone="blue" />
        {pendingJobs > 0 && (
          <Pill label={`${pendingJobs} waiting`} tone="red" />
        )}
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
    valueColor,
    sub,
  }: {
    label: string;
    value: string;
    valueColor: string;
    sub: string;
  }) => (
    <div
      style={{
        flex: 1,
        background: "#FFFFFF",
        border: `0.5px solid ${BORDER}`,
        borderRadius: 12,
        padding: "8px 10px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: MUTED,
          letterSpacing: "0.08em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: valueColor,
          letterSpacing: "-0.3px",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
      <Card
        label="TODAY"
        value={`£${Math.round(todayEarnings)}`}
        valueColor={RED}
        sub={`${todaySessions} lesson${todaySessions === 1 ? "" : "s"}`}
      />
      <Card
        label="THIS WEEK"
        value={`${weekHours}h`}
        valueColor={BLUE}
        sub={`${weekSessions} lesson${weekSessions === 1 ? "" : "s"}`}
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
    <div style={{ padding: "0 14px 14px" }}>
      <div
        role="button"
        onClick={open}
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          overflow: "hidden",
          border: `0.5px solid ${BORDER}`,
          cursor: "pointer",
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

        <div style={{ display: "flex", minHeight: 130 }}>
          {/* Left blue rail */}
          <div
            style={{
              width: 68,
              background: BLUE,
              padding: "16px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              color: "#FFFFFF",
            }}
          >
            <div style={{ textAlign: "center", lineHeight: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>
                {dayNum}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 2,
                }}
              >
                {monthName}
              </div>
            </div>
            <div
              style={{
                width: 36,
                height: 1,
                background: "rgba(255,255,255,0.25)",
              }}
            />
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.3px",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {start}
            </div>
          </div>

          {/* Right column */}
          <div style={{ flex: 1, padding: "12px 13px", minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: CHARCOAL,
                letterSpacing: "-0.2px",
                marginBottom: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {toSentence(pupilName)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconTile>
                <Clock size={14} strokeWidth={2.2} />
              </IconTile>
              <div style={{ fontSize: 13, color: CHARCOAL, minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 700 }}>{hoursLong(durationMinutes)}</span>{" "}
                <span style={{ color: MUTED }}>· Standard lesson</span>
              </div>
              <ChevronDown
                size={16}
                strokeWidth={2.2}
                style={{
                  color: BLUE,
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 180ms ease",
                  flexShrink: 0,
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <IconTile>
                <MapPin size={14} strokeWidth={2.2} />
              </IconTile>
              <div
                style={{
                  fontSize: 13,
                  color: CHARCOAL,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  {pickupPostcode || "Pick-up"}
                </span>{" "}
                <span style={{ color: BLUE }}>
                  · {pickupLocation ? "pick-up" : "TBC"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={call}
                disabled={!pupilPhone}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 9,
                  background: RED,
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: pupilPhone ? 1 : 0.5,
                  cursor: pupilPhone ? "pointer" : "not-allowed",
                }}
              >
                <Phone size={14} strokeWidth={2.4} /> Call
              </button>
              <button
                type="button"
                onClick={message}
                aria-label="Message"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: BLUE_TINT,
                  color: BLUE,
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <MessageSquare size={15} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={navTo}
                aria-label="Navigate"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: BLUE_TINT,
                  color: BLUE,
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <NavIcon size={15} strokeWidth={2.2} />
              </button>
            </div>
          </div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: groupColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {groupLabel}
        </span>
        <span style={{ flex: 1, height: 0.5, background: groupBorder }} />
      </div>
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            overflow: "hidden",
            border: `0.5px solid ${groupLabel === "Urgent" ? "rgba(204,34,41,0.12)" : BORDER}`,
          }}
        >
          {rows.map((r, i) => (
            <button
              key={r.key}
              type="button"
              onClick={r.onClick}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                borderTop: i === 0 ? "none" : `0.5px solid ${ROW_BORDER}`,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: r.iconBg,
                  color: r.iconColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <r.Icon size={13} strokeWidth={1.8} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{r.title}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: MUTED,
                    marginTop: 1,
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
                    minWidth: 20,
                    height: 20,
                    padding: "0 6px",
                    borderRadius: 10,
                    background: r.badge.bg,
                    color: "#FFFFFF",
                    fontSize: 10,
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
              <ChevronRight size={14} color="#C7C7CC" strokeWidth={1.8} />
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
      <div style={{ padding: "0 14px 14px" }}>
        <div
          style={{
            background: "#FFF",
            borderRadius: 13,
            padding: 16,
            textAlign: "center",
            border: `0.5px solid ${BORDER}`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginBottom: 3 }}>All clear</div>
          <div style={{ fontSize: 10, color: MUTED }}>Nothing needs your attention right now</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 14 }}>
      <AttentionGroupCard rows={urgent} groupLabel="Urgent" groupColor="#CC2229" groupBorder="#F0CCCC" />
      <AttentionGroupCard rows={todo} groupLabel="To do" groupColor="#B45309" groupBorder="#E8D5B0" />
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
