import { useEffect, useState } from "react";
import { Mic, Plus } from "lucide-react";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";
import { UserAvatar } from "@/components/instructor/UserAvatar";
import { titleCaseName } from "@/lib/titleCase";
import { RecordPaymentModal } from "@/components/instructor/RecordPaymentModal";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const C = {
  bg: "#FFFFFF",
  surface: "#F8FAFB",
  notesSurface: "#F2F2F4",
  hairline: "#E5E5EA",
  text: "#000000",
  muted: "#6E6E73",
  link: "#2B7BC8",
  red: "#C8434F",
  redTint: "#FBEAEC",
  green: "#3B8B3B",
  greenTint: "#E8F3E8",
  amber: "#B8801F",
  amberTint: "#FBF1DE",
  optional: "#C7C7CC",
};

interface StepSummaryProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
  durationMinutes: number;
  balanceBefore: number;
  lessonCost: number;
  lessonDate: string;
  startTime: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onVoiceNoteRecorded?: (blob: Blob) => void;
  /** Optional captured distance (km). Renders em-dash when undefined. */
  distanceKm?: number | null;
  /** "mi" for UK locale, "km" otherwise. Defaults to "mi". */
  unit?: "mi" | "km";
  /** Lesson type label, e.g. "Standard lesson". Defaults to "Standard lesson". */
  lessonType?: string;
  /** Called after Record Payment is recorded, so parent can refresh balance. */
  onPaymentRecorded?: () => void;
}

function needsNameReview(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/^(unknown|n\/a|none)$/i.test(trimmed)) return true;
  if (/[<>{}\\]/.test(trimmed)) return true;
  return false;
}

function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDistance(km: number | null | undefined, unit: "mi" | "km"): string {
  if (km == null || !isFinite(km)) return "—";
  if (unit === "km") return `${km.toFixed(1)} km`;
  const mi = km * 0.621371;
  return `${mi.toFixed(1)} mi`;
}

function formatCurrencyWhole(amount: number): string {
  const rounded = Math.round(amount);
  return `£${Math.abs(rounded)}`;
}

function endTimeLabel(startTime: string, durationMinutes: number): string {
  // startTime is "HH:MM" or "HH:MM:SS"
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return "—";
  const total = h * 60 + m + durationMinutes;
  const eh = Math.floor((total / 60) % 24);
  const em = total % 60;
  return `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`;
}

/* ---------- Icons ---------- */

function ClockIcon({ color = C.muted, size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function PaperPlaneIcon({ color = C.muted, size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function PoundIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 7c0-2-1.5-4-4.5-4S9 5 9 8c0 4 1 5 1 8 0 1-.5 2-2 2h10" />
      <path d="M7 13h8" />
    </svg>
  );
}

/* ---------- Stat tiles ---------- */

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  variant?: "default" | "warning" | "positive";
  onPress?: () => void;
}

function StatTile({ icon, label, value, variant = "default", onPress }: StatTileProps) {
  const palette =
    variant === "warning"
      ? { bg: C.redTint, fg: C.red, border: "transparent" }
      : variant === "positive"
      ? { bg: C.greenTint, fg: C.green, border: "transparent" }
      : { bg: C.surface, fg: C.text, border: C.hairline };

  const labelColor = variant === "default" ? C.muted : palette.fg;

  const Tag = onPress ? "button" : "div";

  return (
    <Tag
      onClick={onPress}
      type={onPress ? "button" : undefined}
      style={{
        flex: 1,
        background: palette.bg,
        border: variant === "default" ? `0.5px solid ${palette.border}` : "none",
        borderRadius: 10,
        padding: 10,
        textAlign: "left",
        cursor: onPress ? "pointer" : "default",
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        appearance: "none",
        WebkitAppearance: "none",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: labelColor,
            letterSpacing: 0.2,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: palette.fg,
          letterSpacing: -0.3,
          margin: 0,
        }}
      >
        {value}
      </div>
    </Tag>
  );
}

/* ---------- Component ---------- */

export function StepSummary({
  pupilId,
  pupilName,
  instructorId,
  durationMinutes,
  balanceBefore,
  lessonCost,
  lessonDate,
  startTime,
  notes,
  onNotesChange,
  onVoiceNoteRecorded,
  distanceKm,
  unit = "mi",
  lessonType = "Standard lesson",
  onPaymentRecorded,
}: StepSummaryProps) {
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceToText();
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  // Sync voice transcript into notes (additive)
  useEffect(() => {
    if (transcript) onNotesChange(transcript);
  }, [transcript]);

  const balanceAfter = balanceBefore - lessonCost;
  const dueNow = balanceAfter < 0 ? Math.abs(balanceAfter) : 0;
  const dueVariant: "warning" | "positive" =
    dueNow > 0 ? "warning" : "positive";
  const dueValue = dueNow > 0 ? formatCurrencyWhole(dueNow) : "Paid";
  const dueLabel = dueNow > 0 ? "Due now" : "Paid";

  const displayName = titleCaseName(pupilName) || pupilName;
  const showReview = needsNameReview(pupilName);

  const handleDictate = () => {
    if (!isSupported) return;
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <div style={{ fontFamily: FONT_STACK, color: C.text }}>
      {/* Pupil identity bar */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `0.5px solid ${C.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "-8px -24px 0",
          // Negative margin nullifies the SheetContent's p-6 horizontal padding,
          // so this row spans the full sheet width like a true header row.
        }}
      >
        <UserAvatar name={displayName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: C.text,
                letterSpacing: -0.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </span>
            {showReview && (
              <span
                style={{
                  background: C.amberTint,
                  color: C.amber,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  padding: "2px 5px",
                  borderRadius: 3,
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                Review
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            {lessonType} · ended {endTimeLabel(startTime, durationMinutes)}
          </div>
        </div>
      </div>

      {/* Form content */}
      <div style={{ padding: "16px 0 4px" }}>
        {/* Section: Lesson summary */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.muted,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Lesson summary
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <StatTile
            icon={<ClockIcon />}
            label="Duration"
            value={formatDuration(durationMinutes)}
          />
          <StatTile
            icon={<PaperPlaneIcon />}
            label="Distance"
            value={formatDistance(distanceKm, unit)}
          />
          <StatTile
            icon={<PoundIcon color={dueVariant === "warning" ? C.red : C.green} />}
            label={dueLabel}
            value={dueValue}
            variant={dueVariant}
            onPress={dueNow > 0 ? () => setRecordPaymentOpen(true) : undefined}
          />
        </div>

        {/* Section: Lesson notes */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.muted,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Lesson notes
        </div>

        <div
          style={{
            background: C.notesSurface,
            borderRadius: 10,
            padding: 12,
            marginBottom: 8,
          }}
        >
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="How did the lesson go? Add notes or tap the mic to dictate."
            rows={3}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "vertical",
              fontFamily: FONT_STACK,
              fontSize: 13,
              color: C.text,
              minHeight: 60,
              maxHeight: 220,
              padding: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 12,
            }}
          >
            {isSupported ? (
              <button
                type="button"
                onClick={handleDictate}
                style={{
                  background: "#FFFFFF",
                  border: `0.5px solid ${C.hairline}`,
                  borderRadius: 8,
                  padding: "7px 14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: FONT_STACK,
                  fontSize: 13,
                  fontWeight: 500,
                  color: isListening ? C.red : C.link,
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              >
                <Mic size={14} strokeWidth={1.5} />
                {isListening ? "Listening…" : "Dictate"}
              </button>
            ) : (
              <span />
            )}
            <span style={{ fontSize: 12, color: C.optional }}>or type above</span>
          </div>
        </div>

        {/* Attach voice note */}
        {onVoiceNoteRecorded && (
          <>
            {!showAttach ? (
              <button
                type="button"
                onClick={() => setShowAttach(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: FONT_STACK,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.link,
                }}
              >
                <Plus size={12} strokeWidth={1.6} />
                Attach voice note
              </button>
            ) : (
              <div style={{ marginTop: 4 }}>
                <VoiceNoteRecorder onRecorded={onVoiceNoteRecorded} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Record Payment modal — pre-filled with this lesson's pupil and amount */}
      <RecordPaymentModal
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        pupilId={pupilId}
        pupilName={pupilName}
        instructorId={instructorId}
        currentBalance={balanceAfter}
        onPaymentRecorded={onPaymentRecorded}
      />
    </div>
  );
}
