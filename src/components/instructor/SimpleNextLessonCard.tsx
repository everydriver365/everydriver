import { useNavigate } from "react-router-dom";
import { format, parse, parseISO, isToday, isTomorrow } from "date-fns";
import { ChevronRight } from "lucide-react";
import { a11yPx } from "@/lib/a11yScale";

interface SimpleNextLessonCardProps {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  lessonDate: string;
  startTime: string;
  durationMinutes?: number;
  pickupLocation?: string | null;
  minutesUntil: number;
}

function toSentenceName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(w => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatHoursLong(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

function formatTime24(time: string) {
  try { return format(parse(time, "HH:mm:ss", new Date()), "HH:mm"); }
  catch { return time.slice(0, 5); }
}

function formatDateLabel(dateStr: string) {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE d MMM");
  } catch { return dateStr; }
}

function getCountdownText(minutesUntil: number) {
  if (minutesUntil <= 0) return "now";
  if (minutesUntil >= 60 * 24) {
    const days = Math.round(minutesUntil / (60 * 24));
    return days === 1 ? "1 day" : `${days} days`;
  }
  if (minutesUntil >= 60) {
    const hours = Math.round(minutesUntil / 60);
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${Math.max(1, Math.round(minutesUntil))} min`;
}

/**
 * Lightweight read-only card for upcoming lessons more than 4 hours away.
 * Avoids rendering the full live workspace (map, travel-time, Start track) for
 * lessons that are not yet imminent.
 */
export function SimpleNextLessonCard({
  lessonId, pupilId, pupilName, lessonDate, startTime,
  durationMinutes = 60, pickupLocation, minutesUntil,
}: SimpleNextLessonCardProps) {
  const navigate = useNavigate();
  const iosFont = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

  return (
    <div style={{ padding: "0 16px", fontFamily: iosFont, WebkitFontSmoothing: "antialiased" }}>
      <button
        type="button"
        onClick={() => navigate(`/instructor/pupils/${pupilId}?lesson=${lessonId}`)}
        className="active:opacity-80"
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          background: "#FFFFFF", border: "0.5px solid #E5E5EA",
          borderRadius: 12, padding: 16,
          display: "flex", alignItems: "flex-start", gap: 12,
          maxWidth: 440, margin: "0 auto",
          transition: "opacity 150ms cubic-bezier(0.2,0.7,0.2,1)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: a11yPx(11), fontWeight: 500, color: "#6E6E73", letterSpacing: 0.2, textTransform: "uppercase", marginBottom: 6 }}>
            Up next · in {getCountdownText(minutesUntil)}
          </div>
          <div style={{ fontSize: a11yPx(16), fontWeight: 500, letterSpacing: -0.2, color: "#000000", lineHeight: 1.2 }}>
            {toSentenceName(pupilName)}
          </div>
          <div style={{ fontSize: a11yPx(12), color: "#6E6E73", marginTop: 2 }}>
            {`Standard lesson · ${formatHoursLong(durationMinutes)} · ${formatTime24(startTime)}`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: a11yPx(18), fontWeight: 500, letterSpacing: -0.4, color: "#000000", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {formatTime24(startTime)}
            </div>
            <div style={{ fontSize: a11yPx(11), fontWeight: 400, color: "#6E6E73", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
              {formatDateLabel(lessonDate)}
            </div>
          </div>
          <ChevronRight aria-hidden style={{ width: 18, height: 18, color: "#6E6E73" }} strokeWidth={1.5} />
        </div>
      </button>
    </div>
  );
}
