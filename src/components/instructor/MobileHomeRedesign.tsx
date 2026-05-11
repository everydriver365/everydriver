import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { pupilAvatarColor } from "@/lib/pupilAvatarColor";
import { GoogleMap, OverlayViewF, OVERLAY_MOUSE_TARGET, PolylineF } from "@react-google-maps/api";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { useTrafficETA } from "@/hooks/useTrafficETA";
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
  Wallet,
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
import Schedule from "@/components/instructor/Schedule";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { UpcomingEventsTile } from "@/components/instructor/UpcomingEventsTile";
import { useDormantPupilsCount } from "@/hooks/useDormantPupilsCount";
import { Wrench, Users as UsersIcon, Crown, ShieldPlus, Inbox, Check, Star, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, isPast } from "date-fns";
import { useAICallDivert } from "@/hooks/useAICallDivert";
import { AIReceptionistCard } from "@/components/instructor/AIReceptionistCard";
import { AICallDivertSheet } from "@/components/instructor/AICallDivertSheet";
import { TopStatsRow } from "@/components/instructor/TopStatsRow";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";

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
  divertActive,
  onDivertClick,
}: {
  firstName: string;
  lessonsToday: number;
  earningsToday: number;
  pendingJobs: number;
  divertActive?: boolean;
  onDivertClick?: () => void;
}) {
  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const dateLine = format(now, "EEE · d MMM yyyy").toUpperCase();

  const divertColor = divertActive ? "#1A7A3C" : "#CC2229";
  const divertBg = divertActive ? "#E8F8ED" : "#FFE9EA";

  return (
    <div style={{ padding: "20px 18px 12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
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
        </div>
        {onDivertClick && (
          <button
            type="button"
            onClick={onDivertClick}
            aria-label={divertActive ? "AI call divert active" : "AI call divert off"}
            title={divertActive ? "AI call divert active" : "AI call divert off"}
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: divertBg,
              color: divertColor,
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              marginTop: 4,
            }}
          >
            <Phone size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Stats row ---------- */
function SummaryStatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `0.5px solid ${BORDER}`,
        borderRadius: 14,
        padding: "10px 11px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 4,
        boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: MUTED,
            letterSpacing: "0.08em",
            lineHeight: 1.1,
            paddingTop: 2,
          }}
        >
          {label}
        </div>
        <span
          aria-hidden
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: iconBg,
            color: iconColor,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={12} strokeWidth={2.2} />
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: "#1A1A1A",
            letterSpacing: "-0.4px",
            lineHeight: 1.05,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3 }}>{sub}</div>
      </div>
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
  aiStatusLine,
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
  aiStatusLine?: string;
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

  const fullName = toSentence(pupilName);
  const initialsText = initials(pupilName);
  const avatarColor = pupilAvatarColor(pupilId || pupilName) || "#CC2229";
  const dayText = (() => {
    try { return format(date, "EEE d MMM"); } catch { return ""; }
  })();
  const relativeDay = isToday(date)
    ? "Today"
    : isTomorrow(date)
      ? "Tomorrow"
      : (() => {
          const days = Math.max(1, Math.round(minutesUntil / (60 * 24)));
          return `In ${days} days`;
        })();
  const countdownLine = (() => {
    if (minutesUntil <= 0) return "Now";
    if (minutesUntil < 60) return `In ${Math.max(1, Math.round(minutesUntil))} min`;
    if (isToday(date)) {
      const h = Math.round(minutesUntil / 60);
      return h === 1 ? "In 1 hour" : `In ${h} hours`;
    }
    return relativeDay;
  })();
  const hasDestination = !!(pickupPostcode || pickupLocation);
  const destQuery = pickupLocation || pickupPostcode || "";

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
          boxShadow: "0 2px 18px rgba(26,82,160,0.13)",
        }}
      >
        {/* ── HEADER BAND ── */}
        <div
          style={{
            backgroundColor: "#F0F5FF",
            padding: "12px 14px",
            borderBottom: "0.5px solid rgba(26,82,160,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/instructor/pupils/${pupilId}`); }}
            aria-label={`View ${fullName}'s profile`}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: avatarColor,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 2px 6px ${avatarColor}38`,
              border: "2px solid rgba(255,255,255,0.6)",
              padding: 0, cursor: "pointer", overflow: "hidden",
            }}
          >
            {pupilProfileImage ? (
              <img
                src={pupilProfileImage}
                alt=""
                style={{ width: 40, height: 40, borderRadius: 20, objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>{initialsText}</span>
            )}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {fullName}
            </div>
            <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 2, fontWeight: 500 }}>
              {dayText}{dayText && relativeDay ? " · " : ""}{relativeDay}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1A52A0", letterSpacing: -0.6, lineHeight: "24px" }}>
              {start}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#CC2229" }} />
              <span style={{ fontSize: 10, color: "#8E8E93", fontWeight: 500 }}>{countdownLine}</span>
            </div>
          </div>
        </div>

        {/* ── MAP STRIP (72px) ── */}
        <UpNextMapStrip
          pickupPostcode={pickupPostcode}
          pickupLocation={pickupLocation}
          instructorId={instructorId}
          hasDestination={hasDestination}
          onNavigate={navTo}
        />

        {/* ── DETAILS ── */}
        <div style={{ padding: "12px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconTile><Clock size={13} strokeWidth={2.2} /></IconTile>
            <div style={{ fontSize: 14, color: CHARCOAL, fontWeight: 600 }}>
              Standard lesson · <span style={{ color: MUTED, fontWeight: 500 }}>{hoursLong(durationMinutes)}</span>
            </div>
          </div>

          {hasDestination && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
              <IconTile><MapPin size={13} strokeWidth={2.2} /></IconTile>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: CHARCOAL,
                    fontWeight: 600,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pickupPostcode || ""}
                  {pickupPostcode && pickupLocation ? " · " : ""}
                  {pickupLocation || ""}
                </div>
                <div style={{ fontSize: 10, color: "#1A52A0", marginTop: 1, fontWeight: 600 }}>Pick-up</div>
              </div>
            </div>
          )}

          {aiStatusLine && (
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: 5,
                background: "#F0EEFF",
                borderRadius: 8,
                padding: "4px 9px",
                marginTop: 2,
              }}
            >
              <Sparkles size={10} strokeWidth={2} style={{ color: "#6B21A8" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#6B21A8" }}>{aiStatusLine}</span>
            </div>
          )}

          {/* Action row — Call / Text / Go */}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button
              type="button"
              onClick={call}
              disabled={!pupilPhone}
              style={{
                flex: 1.3,
                height: 44,
                borderRadius: 12,
                background: pupilPhone ? "#CC2229" : "#E8B5B7",
                color: "#FFFFFF",
                border: "none",
                fontSize: 15,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: pupilPhone ? "pointer" : "not-allowed",
                boxShadow: pupilPhone ? "0 2px 8px rgba(204,34,41,0.3)" : "none",
              }}
            >
              <Phone size={15} strokeWidth={2.2} /> Call
            </button>
            <button
              type="button"
              onClick={message}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: BLUE_TINT,
                color: BLUE,
                border: `0.5px solid ${BORDER}`,
                fontSize: 15,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <MessageSquare size={15} strokeWidth={2.2} /> Text
            </button>
            <button
              type="button"
              onClick={navTo}
              disabled={!hasDestination}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                background: BLUE_TINT,
                color: BLUE,
                border: `0.5px solid ${BORDER}`,
                fontSize: 15,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: hasDestination ? 1 : 0.5,
                cursor: hasDestination ? "pointer" : "not-allowed",
              }}
            >
              <NavIcon size={15} strokeWidth={2.2} /> Go
            </button>
          </div>
        </div>

        {/* Expand handle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleExpanded(); }}
          aria-expanded={expanded}
          style={{
            width: "100%",
            border: "none",
            borderTop: "0.5px solid rgba(0,0,0,0.05)",
            padding: "8px 0",
            backgroundColor: "#FAFBFD",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93" }}>
            {expanded ? "Hide details" : "Details"}
          </span>
          <ChevronDown
            size={11}
            strokeWidth={2.5}
            style={{
              color: "#C7C7CC",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
          />
        </button>
      </div>
    </div>
  );
}

/* ---------- Up next live map strip (72px) ---------- */
function UpNextMapStrip({
  pickupPostcode,
  pickupLocation,
  instructorId,
  hasDestination,
  onNavigate,
}: {
  pickupPostcode: string | null;
  pickupLocation: string | null;
  instructorId: string;
  hasDestination: boolean;
  onNavigate: (e: React.MouseEvent) => void;
}) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null | undefined>(undefined);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const lastPos = useInstructorLastPosition(instructorId || null);
  const eta = useTrafficETA(pickupPostcode);
  const etaMin = eta.durationMinutes || 0;

  // Load SDK once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key) return;
        await loadGoogleMaps(key);
        if (!cancelled) setSdkLoaded(true);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Geocode destination
  useEffect(() => {
    let cancelled = false;
    if (!pickupPostcode) { setDestCoords(null); return; }
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("geocode-postcode", {
          body: { postcodes: [pickupPostcode] },
        });
        const r = data?.results?.[0];
        const coords = r?.latitude && r?.longitude ? { lat: r.latitude, lng: r.longitude } : null;
        if (!cancelled) setDestCoords(coords);
      } catch {
        if (!cancelled) setDestCoords(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pickupPostcode]);

  const origin = useMemo<google.maps.LatLngLiteral | null>(() => {
    if (lastPos.latitude != null && lastPos.longitude != null) {
      return { lat: lastPos.latitude, lng: lastPos.longitude };
    }
    return null;
  }, [lastPos.latitude, lastPos.longitude]);

  // Fetch route polyline
  useEffect(() => {
    if (!sdkLoaded || !destCoords || !origin) return;
    let cancelled = false;
    (async () => {
      try {
        const ds = new google.maps.DirectionsService();
        const res = await ds.route({
          origin, destination: destCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        const path = res.routes?.[0]?.overview_path?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || null;
        if (!cancelled) setRoutePath(path);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [sdkLoaded, destCoords?.lat, destCoords?.lng, origin?.lat, origin?.lng]);

  // Fit bounds when route or coords change
  useEffect(() => {
    if (!mapRef.current || !destCoords) return;
    if (routePath && routePath.length > 1) {
      const b = new google.maps.LatLngBounds();
      routePath.forEach((p) => b.extend(p));
      mapRef.current.fitBounds(b, { top: 14, right: 14, bottom: 14, left: 14 });
    } else if (origin) {
      const b = new google.maps.LatLngBounds();
      b.extend(origin); b.extend(destCoords);
      mapRef.current.fitBounds(b, { top: 14, right: 14, bottom: 14, left: 14 });
    } else {
      mapRef.current.setCenter(destCoords);
      mapRef.current.setZoom(14);
    }
  }, [routePath, destCoords?.lat, destCoords?.lng, origin?.lat, origin?.lng]);

  return (
    <div
      role={hasDestination ? "button" : undefined}
      tabIndex={hasDestination ? 0 : undefined}
      onClick={hasDestination ? onNavigate : undefined}
      style={{ position: "relative", height: 72, overflow: "hidden", background: "#E9EEF5", cursor: hasDestination ? "pointer" : "default" }}
    >
      {sdkLoaded && destCoords ? (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={destCoords}
          zoom={13}
          onLoad={(m) => { mapRef.current = m; }}
          options={{
            disableDefaultUI: true,
            gestureHandling: "none",
            clickableIcons: false,
            keyboardShortcuts: false,
            draggable: false,
            scrollwheel: false,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { featureType: "poi", stylers: [{ visibility: "off" }] },
              { featureType: "transit", stylers: [{ visibility: "off" }] },
              { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
              { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#eef1f6" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#dfe7f0" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
              { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f2f4f8" }] },
              { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e6ecf5" }] },
            ],
          }}
        >
          {routePath && routePath.length > 1 && (
            <PolylineF
              path={routePath}
              options={{ strokeColor: "#CC2229", strokeOpacity: 0.9, strokeWeight: 3 }}
            />
          )}
          {origin && (
            <OverlayViewF position={origin} mapPaneName={OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#1D9E75", border: "2px solid #FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
            </OverlayViewF>
          )}
          <OverlayViewF position={destCoords} mapPaneName={OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}>
            <svg width={18} height={24} viewBox="0 0 26 34">
              <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.82 20.18 0 13 0z" fill="#CC2229" />
              <circle cx="13" cy="13" r="5" fill="#FFFFFF" />
            </svg>
          </OverlayViewF>
        </GoogleMap>
      ) : (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: MUTED }}>
          {hasDestination ? "Loading live map…" : "No pick-up set"}
        </div>
      )}

      {/* ETA pill — top left */}
      {hasDestination && (
        <div style={{
          position: "absolute", top: 8, left: 10,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderRadius: 999, padding: "4px 9px",
          display: "inline-flex", alignItems: "center", gap: 5,
          boxShadow: "0 1px 5px rgba(0,0,0,0.15)",
          pointerEvents: "none",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: etaMin > 0 ? "#1D9E75" : "#C7C7CC" }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1A1A1A", fontVariantNumeric: "tabular-nums" }}>
            {etaMin > 0 ? `ETA ${etaMin}m` : "Live ETA…"}
          </span>
        </div>
      )}

      {/* Navigate button — bottom right */}
      <button
        type="button"
        onClick={onNavigate}
        disabled={!hasDestination}
        style={{
          position: "absolute", bottom: 8, right: 10,
          backgroundColor: "rgba(26,82,160,0.92)",
          borderRadius: 12, padding: "5px 10px",
          border: "none", cursor: hasDestination ? "pointer" : "default",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}
      >
        <NavIcon size={11} strokeWidth={2.4} style={{ color: "#FFF" }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: "#FFF" }}>Navigate</span>
      </button>
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
  badge?: { label: string; bg: string; fg?: string; variant?: "circle" | "pill" };
  isClear?: boolean;
  onClick: () => void;
}

interface UpgradeRowSpec {
  key: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  tierLabel: string;
  tierBg: string;
  tierColor: string;
  subtitle: string;
  upgradeBg: string;
  onClick: () => void;
}

function AttentionGroupCard({
  rows,
  groupLabel,
  groupColor,
  groupBorder,
  cardBorder,
  marginBottom,
}: {
  rows: AttentionRow[];
  groupLabel: string;
  groupColor: string;
  groupBorder: string;
  cardBorder: string;
  marginBottom: number;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: groupColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {groupLabel}
        </span>
        <span style={{ flex: 1, height: 0.5, background: groupBorder }} />
      </div>
      <div style={{ marginBottom }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            overflow: "hidden",
            border: `0.5px solid ${cardBorder}`,
          }}
        >
          {rows.map((r, i) => (
            <div key={r.key}>
              {i > 0 && (
                <div style={{ height: 0.5, background: "#F0F3F8", marginLeft: 14, marginRight: 14 }} />
              )}
              <button
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
                  cursor: "pointer",
                  textAlign: "left",
                  opacity: r.isClear ? 0.45 : 1,
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: r.isClear ? "#F2F4F8" : r.iconBg,
                    color: r.isClear ? "#5B6B8A" : r.iconColor,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <r.Icon size={18} strokeWidth={2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", letterSpacing: -0.1 }}>{r.title}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: MUTED,
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.subtitle}
                  </div>
                </div>
                {r.isClear ? (
                  <span
                    style={{
                      background: "#E8F8ED",
                      color: "#1A7A3C",
                      borderRadius: 999,
                      padding: "3px 9px",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    Clear
                  </span>
                ) : r.badge ? (
                  r.badge.variant === "pill" ? (
                    <span
                      style={{
                        background: r.badge.bg,
                        color: r.badge.fg ?? "#FFFFFF",
                        borderRadius: 999,
                        padding: "3px 9px",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {r.badge.label}
                    </span>
                  ) : (
                    <span
                      style={{
                        minWidth: 22,
                        height: 22,
                        padding: "0 7px",
                        borderRadius: 999,
                        background: r.badge.bg,
                        color: r.badge.fg ?? "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                      }}
                    >
                      {r.badge.label}
                    </span>
                  )
                ) : null}
                <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
              </button>
            </div>
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
      <div>
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
    <div>
      <AttentionGroupCard
        rows={urgent}
        groupLabel="Urgent"
        groupColor="#CC2229"
        groupBorder="#F0CCCC"
        cardBorder="rgba(204,34,41,0.12)"
        marginBottom={8}
      />
      <AttentionGroupCard
        rows={todo}
        groupLabel="To do"
        groupColor="#B45309"
        groupBorder="#E8D5B0"
        cardBorder="rgba(26,82,160,0.08)"
        marginBottom={12}
      />
    </div>
  );
}

function UpgradeCard({ rows }: { rows: UpgradeRowSpec[] }) {
  if (rows.length === 0) return null;
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        overflow: "hidden",
        border: "0.5px solid rgba(26,82,160,0.08)",
      }}
    >
      {rows.map((r, i) => (
        <div key={r.key}>
          {i > 0 && (
            <div style={{ height: 0.5, background: "#F0F3F8", marginLeft: 14, marginRight: 14 }} />
          )}
          <button
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
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: r.iconBg,
                color: r.iconColor,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <r.Icon size={18} strokeWidth={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", letterSpacing: -0.1 }}>{r.label}</span>
                <span
                  style={{
                    background: r.tierBg,
                    color: r.tierColor,
                    borderRadius: 999,
                    padding: "1px 7px",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {r.tierLabel}
                </span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.subtitle}
              </div>
            </div>
            <span
              style={{
                background: r.upgradeBg,
                color: "#FFFFFF",
                borderRadius: 999,
                padding: "4px 11px",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Upgrade
            </span>
            <ChevronRight size={16} color="#C7C7CC" strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}
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
  const { data: weekly } = useWeeklyGoals(instructorId);
  const [expanded, setExpanded] = useState(false);
  const [divertSheetOpen, setDivertSheetOpen] = useState(false);

  const aiDivert = useAICallDivert(
    instructorId,
    nextLesson
      ? {
          startTime: nextLesson.startTime,
          durationMinutes: nextLesson.durationMinutes,
          lessonDate: nextLesson.lessonDate,
        }
      : null,
  );

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

  // Calls (counter to be wired later)
  const missedCallsCount: number = 0;
  attentionRows.push({
    key: "calls",
    group: "urgent",
    Icon: Phone,
    iconBg: "#FFF0F0",
    iconColor: RED,
    title: "Calls",
    subtitle: missedCallsCount > 0 ? `${missedCallsCount} missed call${missedCallsCount !== 1 ? "s" : ""}` : "No missed calls",
    badge: missedCallsCount > 0 ? { label: String(missedCallsCount), bg: "#CC2229" } : undefined,
    isClear: missedCallsCount === 0,
    onClick: () => navigate("/instructor/calls"),
  });

  // Enquiries (counter to be wired later)
  const enquiriesCount: number = 0;
  attentionRows.push({
    key: "enquiries",
    group: "urgent",
    Icon: Inbox,
    iconBg: "#FFF0F0",
    iconColor: RED,
    title: "Enquiries",
    subtitle: enquiriesCount > 0 ? `${enquiriesCount} new enquir${enquiriesCount !== 1 ? "ies" : "y"}` : "No new enquiries",
    badge: enquiriesCount > 0 ? { label: String(enquiriesCount), bg: "#CC2229" } : undefined,
    isClear: enquiriesCount === 0,
    onClick: () => navigate("/instructor/enquiries"),
  });

  attentionRows.push({
    key: "jobs",
    group: "urgent",
    Icon: Briefcase,
    iconBg: "#FFF0F0",
    iconColor: RED,
    title: "Job offers waiting",
    subtitle: "Review new course enquiries",
    badge: pendingJobs > 0 ? { label: String(pendingJobs), bg: "#CC2229" } : undefined,
    isClear: pendingJobs === 0,
    onClick: () => navigate("/instructor/jobs"),
  });

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
  attentionRows.push({
    key: "gaps",
    group: "todo",
    Icon: CalendarPlus,
    iconBg: "#F2F4F8",
    iconColor: "#5B6B8A",
    title: "Open slots this week",
    subtitle: "Fill gaps in your schedule",
    badge: openSlots > 0 ? { label: String(openSlots), bg: "#EEF3FF", fg: "#1A52A0", variant: "pill" } : undefined,
    isClear: openSlots === 0,
    onClick: () => navigate("/instructor/schedule"),
  });

  attentionRows.push({
    key: "dormant",
    group: "todo",
    Icon: UsersIcon,
    iconBg: "#F2F4F8",
    iconColor: "#5B6B8A",
    title: `${dormantCount} dormant pupil${dormantCount === 1 ? "" : "s"}`,
    subtitle: "No lesson in 2+ weeks",
    badge: dormantCount > 0 ? { label: String(dormantCount), bg: "#FFF6E6", fg: "#B45309", variant: "pill" } : undefined,
    isClear: dormantCount === 0,
    onClick: () => navigate("/instructor/pupils?filter=dormant"),
  });

  if (unread > 0) {
    attentionRows.push({
      key: "messages",
      group: "todo",
      Icon: MessageSquare,
      iconBg: BLUE_TINT,
      iconColor: BLUE,
      title: "Unread messages",
      subtitle: "Pupils waiting for a reply",
      badge: { label: String(unread), bg: "#EEF3FF", fg: "#1A52A0", variant: "pill" },
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

  // Total active attention count (for the section header pill).
  // Sums real counts plus a +1 for boolean rows that don't carry a number.
  const totalAttentionCount =
    missedCallsCount +
    enquiriesCount +
    pendingJobs +
    openSlots +
    dormantCount +
    unread +
    (debt > 0 ? 1 : 0) +
    (vehicleFault ? 1 : 0);

  // Upgrade section (placeholders — to be wired later)
  const membershipLevel = "Starter" as "Free" | "Starter" | "Pro" | "Premium";
  const healthCover = "Basic" as "None" | "Basic" | "Full";

  const upgradeRows: UpgradeRowSpec[] = [
    {
      key: "membership",
      Icon: Crown,
      iconBg: "#FFF6E6",
      iconColor: "#B45309",
      label: "Membership",
      tierLabel: membershipLevel,
      tierBg: "#FFF6E6",
      tierColor: "#B45309",
      subtitle: "Unlock more features · lower fees",
      upgradeBg: "#B45309",
      onClick: () => navigate("/instructor/subscription"),
    },
    {
      key: "health-cover",
      Icon: ShieldPlus,
      iconBg: "#EEF3FF",
      iconColor: "#1A52A0",
      label: "Health cover",
      tierLabel: healthCover,
      tierBg: "#EEF3FF",
      tierColor: "#1A52A0",
      subtitle: "Full income protection available",
      upgradeBg: "#1A52A0",
      onClick: () => navigate("/instructor/health"),
    },
  ];

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
            aiStatusLine={aiDivert.upNextLine}
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

      {/* New DSM Schedule section (day strip + capacity ring + lesson list) */}
      <div style={{ marginTop: 18 }}>
        <Schedule instructorId={instructorId} />
      </div>

      {/* Schedule + Quick Access */}
      <div style={{ marginTop: 14 }}>
        <MobileHomeBottomSections instructorId={instructorId} />
      </div>

      {/* Needs attention + Upgrade */}
      <div style={{ padding: "14px 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#8E8E93",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            Needs attention
          </span>
          {totalAttentionCount > 0 && (
            <span
              style={{
                background: "#CC2229",
                color: "#FFFFFF",
                borderRadius: 10,
                padding: "1px 7px",
                fontSize: 9,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {totalAttentionCount}
            </span>
          )}
        </div>
        <AttentionCard rows={attentionRows} />

        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#8E8E93",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginTop: 4,
            marginBottom: 8,
            paddingLeft: 2,
          }}
        >
          Upgrade
        </div>
        <UpgradeCard rows={upgradeRows} />
      </div>

      {/* Upcoming events */}
      <UpcomingEventsTile instructorId={instructorId} />

      {/* Top summary row moved to bottom: AI Receptionist | Today | This Week */}
      <div style={{ marginTop: 14 }}>
        <TopStatsRow
          ai={aiDivert}
          onOpenAISheet={() => setDivertSheetOpen(true)}
          earningsToday={earningsToday}
          todayLessons={todaySessions}
          earningsDelta={null}
          hoursThisWeek={weekly?.hoursThisWeek ?? hoursThisWeek ?? 0}
          hoursGoal={weekly?.hoursGoal ?? 30}
          lessonsThisWeek={weekly?.lessonsThisWeek ?? lessonsThisWeek ?? 0}
          lessonsGoal={Math.max(weekly?.lessonsThisWeek ?? 0, 8)}
        />
      </div>

      {/* Floating session bar */}
      <FloatingSessionBar instructorId={instructorId} />

      <AICallDivertSheet
        open={divertSheetOpen}
        onOpenChange={setDivertSheetOpen}
        state={aiDivert}
      />
    </div>
  );
}
