import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";

/**
 * AppointmentTile
 * ---------------
 * Single source of truth for the lesson-row visual used on both the
 * Schedule page (Schedule.tsx) and the Home Today Schedule
 * (HomeTodaySchedule.tsx). Keeping this in one place guarantees the two
 * surfaces stay perfectly consistent for live, upcoming, completed,
 * conflict, cancelled and EOL/payment states.
 */

/* ---------- Tokens (kept in sync with Schedule.tsx + HomeTodaySchedule.tsx) ---------- */
export const APPT = {
  red: "#C8242C",            // live (in-progress)
  success: "#1D9E75",        // completed accent
  warning: "#BA7517",        // test variants accent
  blue: "#1A52A0",           // default accent
  tertiary: "#8E8E93",       // cancelled accent / chevron
  textPrimary: "#1A1A1A",
  textSecondary: "#5B6B8A",
  cardBg: "#FFFFFF",
  border: "rgba(26,82,160,0.08)",
  tintGrey: "#F1EFE8",
  tintGreyFg: "#8E8E93",
  tintAmber: "#FAEEDA",
  tintAmberFg: "#854F0B",
  tintAmberSoft: "#FBF1DE",
  tintRedSoft: "#FBEAEC",
  paidBg: "#E8F8ED",
  paidFg: "#1A7A3C",
  unpaidBg: "#FFECEC",
  unpaidFg: "#D33B3B",
  eolBg: "#EEF3FF",
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

/* ---------- Helpers ---------- */
function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}`;
}

function shortLine(addr: string | null | undefined, postcode: string | null | undefined): string {
  if (addr) {
    const first = addr.split(",")[0]?.trim();
    if (first) return first;
  }
  return postcode || "Pickup";
}

/** Mirrors Schedule.tsx `lessonAccentColor`. */
function accentFor(opts: {
  status: string;
  startDate: Date;
  endDate: Date;
  now: Date;
  lessonType: string;
}): string {
  const { status, startDate, endDate, now, lessonType } = opts;
  if (status === "cancelled") return APPT.tertiary;
  if (status === "completed") return APPT.success;
  if (now >= startDate && now <= endDate) return APPT.red;
  const t = (lessonType || "").toLowerCase();
  if (t.includes("test")) return APPT.warning;
  return APPT.blue;
}

/* ---------- Inline pill primitives ---------- */
function Pill({
  label,
  bg,
  color,
  ariaLabel,
  weight = 500,
}: {
  label: string;
  bg: string;
  color: string;
  ariaLabel?: string;
  weight?: number;
}) {
  return (
    <span
      aria-label={ariaLabel || label}
      style={{
        background: bg,
        color,
        fontSize: 14,
        fontWeight: weight,
        padding: "1px 6px",
        borderRadius: 8,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function PaymentPill({ isPaid }: { isPaid: boolean }) {
  return (
    <span
      aria-label={isPaid ? "Paid" : "Not paid"}
      style={{
        background: isPaid ? APPT.paidBg : APPT.unpaidBg,
        color: isPaid ? APPT.paidFg : APPT.unpaidFg,
        fontSize: 14,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          background: isPaid ? APPT.paidFg : APPT.unpaidFg,
          display: "inline-block",
        }}
      />
      {isPaid ? "Paid" : "Not paid"}
    </span>
  );
}

function EOLPill({
  done,
  onClick,
}: {
  done: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? "End of lesson complete — review" : "Complete end of lesson"}
      style={{
        background: APPT.eolBg,
        border: "none",
        borderRadius: 8,
        padding: "1px 6px",
        cursor: "pointer",
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: APPT.blue,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          textDecoration: done ? "line-through" : "none",
          opacity: done ? 0.6 : 1,
        }}
      >
        EOL
      </span>
    </button>
  );
}

/* ---------- Public props ---------- */
export interface AppointmentTileProps {
  /** Display name to show as the tile heading (e.g. "John D" or "John Doe"). */
  pupilDisplayName: string;
  /** "HH:MM" — already formatted by the caller. */
  startTimeLabel: string;
  durationMinutes: number;
  pickupLocation: string | null;
  pickupPostcode: string | null;
  lessonType: string;
  /** Raw lesson status: 'scheduled' | 'completed' | 'cancelled' | ... */
  status: string;
  /** 'paid' | 'cash' | 'unpaid' | ... */
  paymentStatus: string;
  /** Absolute lesson start/end used for live-window detection. */
  startDate: Date;
  endDate: Date;
  /** Current time, passed in so callers control re-render cadence. */
  now: Date;
  /** Whether the EOL flow has been completed for this lesson. */
  eolDone: boolean;

  /** Optional pills/secondary signals — used by Home today schedule. */
  showConflictPill?: boolean;
  showReviewPill?: boolean;
  /** Show a small "In progress · X min remaining" line under the subtitle when live. */
  showInProgressLine?: boolean;
  /**
   * When true, secondary chips (test type, EOL, payment, cancelled) move to
   * their own row beneath the location so the name line stays uncluttered.
   * The name row keeps only top-level state pills (Live, Conflict, Review).
   * Used by the Home page Today schedule on mobile to avoid squashed text.
   */
  stackedMeta?: boolean;

  /** Activation handlers. Provide either onClick (button) or href (Link). */
  onClick?: () => void;
  href?: string;
  onEOLClick: (e: React.MouseEvent) => void;

  /** Optional aria override; defaults to a sensible composed label. */
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AppointmentTile(props: AppointmentTileProps) {
  const {
    pupilDisplayName,
    startTimeLabel,
    durationMinutes,
    pickupLocation,
    pickupPostcode,
    lessonType,
    status,
    paymentStatus,
    startDate,
    endDate,
    now,
    eolDone,
    showConflictPill,
    showReviewPill,
    showInProgressLine,
    stackedMeta,
    onClick,
    href,
    onEOLClick,
    ariaLabel,
    className,
    style,
  } = props;

  const isCancelled = status === "cancelled";
  const isCompleted = status === "completed";
  const isLive = !isCancelled && now >= startDate && now <= endDate;
  const isPast = !isCancelled && endDate <= now;
  const isUpcoming = !isCancelled && !isCompleted && !isLive && !isPast;

  const accent = accentFor({ status, startDate, endDate, now, lessonType });
  const t = (lessonType || "").toLowerCase();
  const isMockTest = t === "mock_test" || t.includes("mock");
  const isTestPrep = !isMockTest && (t === "test_prep" || t.includes("test prep"));
  const isTestDay = !isMockTest && !isTestPrep && t.includes("test");

  const isPaid = paymentStatus === "paid" || paymentStatus === "cash";
  const showPayPill = !isCancelled;
  const showEOLPill = isPast || isCompleted || eolDone;
  const minutesRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / 60_000),
  );

  const subtitle = shortLine(pickupLocation, pickupPostcode);

  const composedAria =
    ariaLabel ||
    `Lesson with ${pupilDisplayName}, ${startTimeLabel} for ${fmtDuration(
      durationMinutes,
    )}, at ${subtitle}`;

  /* ---------- Shared visual body ---------- */
  const body = (
    <>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 10,
          bottom: 10,
          width: 3,
          borderRadius: "0 2px 2px 0",
          background: accent,
        }}
      />
      <div style={{ paddingLeft: 6, flexShrink: 0, minWidth: 50 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: accent,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {startTimeLabel}
        </div>
        <div style={{ fontSize: 14, color: APPT.textSecondary, marginTop: 3 }}>
          {fmtDuration(durationMinutes)}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginBottom: 2,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: APPT.textPrimary,
              letterSpacing: -0.1,
            }}
          >
            {pupilDisplayName}
          </span>

          {/* Top-level state pills — always live next to the name. */}
          {showReviewPill && (
            <Pill label="Review" bg={APPT.tintAmberSoft} color={APPT.warning} />
          )}
          {isLive && (
            <Pill label="Live" bg={APPT.tintRedSoft} color={APPT.red} weight={600} />
          )}
          {showConflictPill && isUpcoming && (
            <Pill label="Conflict" bg={APPT.tintAmberSoft} color={APPT.warning} />
          )}
          {/* Cancelled stays on name row when not stacked, otherwise drops to meta row. */}
          {isCancelled && !stackedMeta && (
            <Pill label="Cancelled" bg={APPT.tintGrey} color={APPT.tintGreyFg} />
          )}

          {/* Inline (non-stacked) layout shows all secondary chips on the name row. */}
          {!stackedMeta && (
            <>
              {isMockTest && (
                <Pill label="Mock test" bg={APPT.tintAmber} color={APPT.tintAmberFg} />
              )}
              {isTestPrep && (
                <Pill label="test prep" bg={APPT.tintAmber} color={APPT.tintAmberFg} ariaLabel="Test preparation" />
              )}
              {isTestDay && (
                <Pill label="test day" bg={APPT.tintAmber} color={APPT.tintAmberFg} ariaLabel="Test day" />
              )}
              {showEOLPill && <EOLPill done={eolDone} onClick={onEOLClick} />}
              {showPayPill && <PaymentPill isPaid={isPaid} />}
            </>
          )}
        </div>

        <div
          style={{
            fontSize: 14,
            color: APPT.textSecondary,
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          <MapPin size={12} strokeWidth={2} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</span>
        </div>

        {/* Stacked meta row — secondary chips on their own line so the name + location stay readable. */}
        {stackedMeta && (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            {isCancelled && (
              <Pill label="Cancelled" bg={APPT.tintGrey} color={APPT.tintGreyFg} />
            )}
            {isMockTest && (
              <Pill label="Mock test" bg={APPT.tintAmber} color={APPT.tintAmberFg} />
            )}
            {isTestPrep && (
              <Pill label="test prep" bg={APPT.tintAmber} color={APPT.tintAmberFg} ariaLabel="Test preparation" />
            )}
            {isTestDay && (
              <Pill label="test day" bg={APPT.tintAmber} color={APPT.tintAmberFg} ariaLabel="Test day" />
            )}
            {showEOLPill && <EOLPill done={eolDone} onClick={onEOLClick} />}
            {showPayPill && <PaymentPill isPaid={isPaid} />}
          </div>
        )}

        {showInProgressLine && isLive && (
          <div
            style={{
              fontSize: 11,
              color: APPT.red,
              fontWeight: 500,
              margin: "6px 0 0",
            }}
          >
            In progress · {minutesRemaining} min remaining
          </div>
        )}
      </div>

      <ChevronRight size={16} color={APPT.tertiary} />
    </>
  );

  /* ---------- Shell: Link or button ---------- */
  const shellStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    background: APPT.cardBg,
    borderRadius: 16,
    padding: "12px 14px",
    width: "100%",
    textAlign: "left",
    border: `0.5px solid ${APPT.border}`,
    display: "flex",
    gap: 12,
    alignItems: "center",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    color: "inherit",
    textDecoration: "none",
    fontFamily: FONT,
    ...style,
  };

  if (href) {
    return (
      <Link to={href} aria-label={composedAria} className={className} style={shellStyle}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={composedAria}
      className={className}
      style={shellStyle}
    >
      {body}
    </button>
  );
}
