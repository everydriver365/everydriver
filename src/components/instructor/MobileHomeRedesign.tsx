import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parse, parseISO, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import {
  Phone,
  MessageSquare,
  Navigation as NavIcon,
  Clock,
  MapPin,
  ChevronDown,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";

import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useTomorrowLessons } from "@/hooks/useTomorrowLessons";
import { useDayLessons } from "@/hooks/useDayLessons";
import { UpNextExpanded } from "@/components/instructor/UpNextExpanded";

/* ---------- Brand palette ---------- */
const RED = "#C8242C";
const BLUE = "#1E6FB8";
const TEXT_DARK = "#3A3A3A";
const TEXT_MUTED = "#6B6B6B";
const TEXT_TERTIARY = "#9A9A9A";
const PAGE_BG = "#F5F4F1";
const CARD_BG = "#FFFFFF";
const BLUE_TINT = "#E8F2FA";
const GREEN = "#1D9E75";

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", "Helvetica Neue", sans-serif';

/* ---------- Helpers ---------- */
function toSentence(name: string) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
function initialsOf(name: string) {
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
function dayChip(dateStr: string, time: string) {
  let label = "";
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) label = "TODAY";
    else if (isTomorrow(d)) label = "TOMORROW";
    else label = format(d, "EEE d MMM").toUpperCase();
  } catch {
    label = dateStr;
  }
  return `${label} · ${fmtTime(time)}`;
}
function hoursLong(min: number) {
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

/* ---------- Section label ---------- */
function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 4px 8px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: TEXT_MUTED,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
      {action}
    </div>
  );
}

/* ---------- Stylised map illustration ---------- */
function StylisedMap() {
  return (
    <svg
      viewBox="0 0 380 160"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: "block", position: "absolute", inset: 0 }}
      aria-hidden
    >
      <rect width="380" height="160" fill="#F2EDE3" />
      {/* Soft beige road blocks */}
      <rect x="0" y="0" width="120" height="60" fill="#EAE2D2" />
      <rect x="170" y="0" width="210" height="60" fill="#EAE2D2" />
      <rect x="0" y="100" width="80" height="60" fill="#EAE2D2" />
      <rect x="130" y="100" width="110" height="60" fill="#EAE2D2" />
      <rect x="290" y="100" width="90" height="60" fill="#EAE2D2" />
      {/* Roads (lighter cream) */}
      <rect x="120" y="0" width="50" height="160" fill="#F8F2E6" />
      <rect x="80" y="60" width="210" height="40" fill="#F8F2E6" />
      <rect x="240" y="0" width="50" height="160" fill="#F8F2E6" />
      {/* Dashed red route */}
      <path
        d="M 50 130 L 100 130 L 100 80 L 200 80 L 200 30 L 265 30"
        fill="none"
        stroke={RED}
        strokeWidth="2"
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
      {/* Current location: green dot with white center */}
      <g transform="translate(50 130)">
        <circle r="9" fill={GREEN} fillOpacity="0.2" />
        <circle r="6" fill={GREEN} />
        <circle r="2.5" fill="#FFFFFF" />
      </g>
      {/* Destination pin: red */}
      <g transform="translate(265 30)">
        <path
          d="M0 -12 C6 -12 11 -7 11 -1 C11 8 0 20 0 20 C0 20 -11 8 -11 -1 C-11 -7 -6 -12 0 -12 Z"
          fill={RED}
        />
        <circle cx="0" cy="-1" r="3.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/* ---------- Map pill ---------- */
function MapPill({
  children,
  position,
}: {
  children: React.ReactNode;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...position,
        background: "#FFFFFF",
        padding: "5px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 500,
        color: TEXT_DARK,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Up Next Card ---------- */
function UpNextCard({
  pupilName,
  lessonDate,
  startTime,
  durationMinutes,
  pickupPostcode,
  pickupLocation,
  minutesUntil,
  pupilId,
  pupilPhone,
  expanded,
  onToggle,
  onCall,
  onText,
  onGo,
  aiDivertLine,
}: {
  pupilName: string;
  lessonDate: string;
  startTime: string;
  durationMinutes: number;
  pickupPostcode?: string | null;
  pickupLocation?: string | null;
  minutesUntil: number;
  pupilId: string;
  pupilPhone?: string | null;
  expanded: boolean;
  onToggle: () => void;
  onCall: () => void;
  onText: () => void;
  onGo: () => void;
  aiDivertLine?: string | null;
}) {
  const sentenceName = toSentence(pupilName);
  const inits = initialsOf(sentenceName);

  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      {/* Map area */}
      <div style={{ position: "relative", height: 160, width: "100%", overflow: "hidden" }}>
        <StylisedMap />

        <MapPill position={{ top: 10, left: 10 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: RED,
              display: "inline-block",
            }}
          />
          In {fmtCountdown(minutesUntil)}
        </MapPill>

        <MapPill position={{ top: 10, right: 10 }}>25m drive</MapPill>

        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "#FFFFFF",
            padding: "5px 10px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
            color: TEXT_DARK,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            minHeight: 32,
          }}
          aria-label={expanded ? "Hide details" : "Show details"}
        >
          Details
          <ChevronDown
            size={14}
            strokeWidth={2}
            color={TEXT_MUTED}
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 200ms",
            }}
          />
        </button>

        {/* Pupil avatar */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            width: 38,
            height: 38,
            borderRadius: 19,
            background: BLUE,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            border: "2px solid #FFFFFF",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          {inits}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 14 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: BLUE_TINT,
            color: BLUE,
            padding: "5px 11px",
            borderRadius: 14,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          <CalendarIcon size={11} strokeWidth={2.2} aria-hidden />
          {dayChip(lessonDate, startTime).toUpperCase()}
        </div>

        <button
          type="button"
          onClick={onToggle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            marginBottom: 10,
          }}
          aria-label={expanded ? "Collapse lesson details" : "Expand lesson details"}
        >
          <span
            style={{
              fontSize: 19,
              fontWeight: 500,
              color: TEXT_DARK,
              letterSpacing: -0.2,
              lineHeight: 1.2,
              textAlign: "left",
            }}
          >
            {sentenceName}
          </span>
          <ChevronDown
            size={18}
            strokeWidth={1.8}
            color={TEXT_MUTED}
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 200ms",
            }}
          />
        </button>

        {/* Detail row 1 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: BLUE_TINT,
              color: BLUE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <Clock size={16} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: 13, color: TEXT_DARK, fontWeight: 400 }}>
            Standard lesson ·{" "}
            <span style={{ color: BLUE, fontWeight: 500 }}>{hoursLong(durationMinutes)}</span>
          </span>
        </div>

        {/* Detail row 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: BLUE_TINT,
              color: BLUE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-hidden
          >
            <MapPin size={16} strokeWidth={1.8} />
          </div>
          <span
            style={{
              fontSize: 13,
              color: TEXT_DARK,
              fontWeight: 400,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {pickupPostcode && (
              <span style={{ fontWeight: 600 }}>{pickupPostcode}</span>
            )}
            {pickupPostcode && pickupLocation && " · "}
            {pickupLocation || (!pickupPostcode && "Pickup TBC")}
          </span>
        </div>

        {aiDivertLine && (
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>
            {aiDivertLine}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <ActionButton
            label="Call"
            icon={Phone}
            primary
            onClick={onCall}
            disabled={!pupilPhone}
          />
          <ActionButton label="Text" icon={MessageSquare} onClick={onText} disabled={!pupilPhone} />
          <ActionButton label="Go" icon={NavIcon} onClick={onGo} />
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <UpNextExpandedWrapper
            pupilId={pupilId}
            pupilName={sentenceName}
            pupilPhone={pupilPhone ?? null}
            pickupLocation={pickupLocation ?? null}
            pickupPostcode={pickupPostcode ?? null}
            startTime={startTime}
            durationMinutes={durationMinutes}
          />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  primary,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof Phone;
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "11px 0",
        borderRadius: 22,
        background: primary ? BLUE : BLUE_TINT,
        color: primary ? "#FFFFFF" : BLUE,
        fontSize: 13,
        fontWeight: 500,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        minHeight: 44,
      }}
      aria-label={label}
    >
      <Icon size={15} strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}

/* Wrapper for the existing expanded panel — keeps logic intact */
function UpNextExpandedWrapper(props: {
  pupilId: string;
  pupilName: string;
  pupilPhone: string | null;
  pickupLocation: string | null;
  pickupPostcode: string | null;
  startTime: string;
  durationMinutes: number;
}) {
  // Best-effort import of legacy expanded panel; falls back to nothing.
  try {
    return (
      <UpNextExpanded
        lessonId=""
        pupilId={props.pupilId}
        pupilName={props.pupilName}
        pupilPhone={props.pupilPhone}
        pickupLocation={props.pickupLocation}
        pickupPostcode={props.pickupPostcode}
        pickupWhat3words={null}
        pickupNotes={null}
        startTime={props.startTime}
        durationMinutes={props.durationMinutes}
        accountBalance={0}
        prepaidHours={0}
        checkInStatus={null}
        lessonStatus={null}
        lastLessonPlan={null}
        instructorId=""
      />
    );
  } catch {
    return null;
  }
}

/* ---------- Schedule toggle + list ---------- */
function ScheduleSection({
  instructorId,
  onAddLesson,
}: {
  instructorId: string;
  onAddLesson: () => void;
}) {
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const today = new Date();
  const { data: todayLessons = [] } = useDayLessons(instructorId, today);
  const { data: tomorrowLessons = [] } = useTomorrowLessons(instructorId);
  const lessons = tab === "today" ? todayLessons : tomorrowLessons;

  return (
    <>
      {/* Toggle card */}
      <div
        style={{
          background: CARD_BG,
          borderRadius: 14,
          padding: 6,
          marginBottom: 8,
          display: "flex",
          gap: 4,
        }}
      >
        {(["today", "tomorrow"] as const).map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                background: active ? RED : "transparent",
                color: active ? "#FFFFFF" : TEXT_MUTED,
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                minHeight: 40,
                textTransform: "capitalize",
              }}
              aria-pressed={active}
            >
              {key === "today" ? "Today" : "Tomorrow"}
            </button>
          );
        })}
      </div>

      {/* Empty state / list */}
      {lessons.length === 0 ? (
        <div
          style={{
            background: CARD_BG,
            borderRadius: 12,
            padding: "24px 16px",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 10 }}>
            No lessons {tab}
          </div>
          <button
            type="button"
            onClick={onAddLesson}
            style={{
              background: "transparent",
              color: BLUE,
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              minHeight: 44,
            }}
          >
            <Plus size={16} strokeWidth={2} aria-hidden /> Add lesson
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {lessons.slice(0, 4).map((l: any) => (
            <div
              key={l.id || `${l.start_time}-${l.pupil_name}`}
              style={{
                background: CARD_BG,
                borderRadius: 12,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: TEXT_DARK,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {toSentence(l.pupil_name || l.pupilName || "Pupil")}
                </div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                  {hoursLong(l.duration_minutes || l.durationMinutes || 60)}
                  {l.pickup_postcode ? ` · ${l.pickup_postcode}` : ""}
                </div>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: TEXT_DARK,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtTime(l.start_time || l.startTime)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Greeting block ---------- */
function GreetingBlock({ firstName }: { firstName: string }) {
  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const dateLine = format(now, "EEE · d MMM yyyy").toUpperCase();
  return (
    <div style={{ padding: 4, marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: TEXT_MUTED,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {dateLine}
      </div>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 500,
          color: TEXT_DARK,
          letterSpacing: -0.4,
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        {greet}, {firstName}.
      </h1>
    </div>
  );
}

/* ---------- Main component ---------- */
interface MobileHomeRedesignProps {
  instructorId: string;
  instructorName?: string | null;
}

export function MobileHomeRedesign({ instructorId, instructorName }: MobileHomeRedesignProps) {
  const navigate = useNavigate();
  const firstName = (instructorName || "there").split(" ")[0];
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const [expanded, setExpanded] = useState(false);

  const liveMinutes = useMemo(() => {
    if (!nextLesson) return 0;
    try {
      const start = new Date(`${nextLesson.lessonDate}T${nextLesson.startTime}`);
      return Math.max(0, differenceInMinutes(start, new Date()));
    } catch {
      return nextLesson.minutesUntil;
    }
  }, [nextLesson]);

  const aiDivertLine =
    nextLesson && liveMinutes <= 60
      ? `AI divert starts at ${fmtTime(nextLesson.startTime)}`
      : null;

  const handleCall = () => {
    if (nextLesson?.pupilPhone) window.location.href = `tel:${nextLesson.pupilPhone}`;
  };
  const handleText = () => {
    if (nextLesson?.pupilPhone) window.location.href = `sms:${nextLesson.pupilPhone}`;
  };
  const handleGo = () => {
    if (!nextLesson) return;
    const dest = encodeURIComponent(
      `${nextLesson.pickupLocation || ""} ${nextLesson.pickupPostcode || ""}`.trim(),
    );
    if (dest) {
      window.open(`https://maps.google.com/?daddr=${dest}`, "_blank");
    }
  };

  return (
    <div
      style={{
        background: PAGE_BG,
        minHeight: "100vh",
        fontFamily: FONT,
        WebkitFontSmoothing: "antialiased",
        color: TEXT_DARK,
        padding: "8px 16px 110px",
      }}
    >
      <GreetingBlock firstName={firstName} />

      {nextLesson ? (
        <>
          <SectionLabel>Up next</SectionLabel>
          <UpNextCard
            pupilName={nextLesson.pupilName}
            lessonDate={nextLesson.lessonDate}
            startTime={nextLesson.startTime}
            durationMinutes={nextLesson.durationMinutes}
            pickupPostcode={nextLesson.pickupPostcode}
            pickupLocation={nextLesson.pickupLocation}
            minutesUntil={liveMinutes}
            pupilId={nextLesson.pupilId}
            pupilPhone={nextLesson.pupilPhone}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            onCall={handleCall}
            onText={handleText}
            onGo={handleGo}
            aiDivertLine={aiDivertLine}
          />
        </>
      ) : (
        <>
          <SectionLabel>Up next</SectionLabel>
          <div
            style={{
              background: CARD_BG,
              borderRadius: 12,
              padding: "24px 16px",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, color: TEXT_MUTED }}>No upcoming lessons</div>
          </div>
        </>
      )}

      <SectionLabel
        action={
          <button
            type="button"
            onClick={() => navigate("/instructor/schedule")}
            style={{
              background: "transparent",
              border: "none",
              color: BLUE,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            View all →
          </button>
        }
      >
        Schedule
      </SectionLabel>
      <ScheduleSection
        instructorId={instructorId}
        onAddLesson={() => navigate("/instructor/schedule?action=add")}
      />
    </div>
  );
}
