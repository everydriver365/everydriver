import { ChevronDown, User } from "lucide-react";
import { pupilAvatarColor, pupilAvatarInitial } from "@/lib/pupilAvatarColor";

/**
 * Two-state pupil selector row used on the Tracking screen.
 *
 *  - State A (no pupil): tinted #E6F1FB icon block + line-style person icon.
 *  - State B (selected): deterministic-coloured round avatar with white initial,
 *    using the shared `pupilAvatarColor` helper so the same pupil renders the
 *    same colour as the Pupils list.
 *
 * Tap behaviour is owned by the parent — this row only renders the affordance.
 */

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export interface PupilSelectorRowProps {
  pupilId: string | null;
  pupilName: string | null;
  /** Subtitle shown when a pupil is selected (e.g. "Manual · 1h lesson"). */
  selectedSubtitle?: string | null;
  /** Subtitle shown when no pupil is selected. Defaults to "Test route mode". */
  emptySubtitle?: string;
  onPress: () => void;
  expanded?: boolean;
  ariaLabel?: string;
}

export function PupilSelectorRow({
  pupilId,
  pupilName,
  selectedSubtitle,
  emptySubtitle = "Test route mode",
  onPress,
  expanded,
  ariaLabel,
}: PupilSelectorRowProps) {
  const hasPupil = !!pupilId;
  const avatarBg = pupilAvatarColor(pupilId || pupilName);
  const initial = pupilAvatarInitial(pupilName);

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel ?? (hasPupil ? `Change pupil (${pupilName})` : "Select pupil")}
      aria-expanded={expanded}
      style={{
        width: "100%",
        background: "#F2F2F4",
        border: "none",
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: FONT_STACK,
      }}
    >
      {hasPupil ? (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: avatarBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0,
          }}
        >
          {initial}
        </div>
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#E6F1FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={18} strokeWidth={2} color="#2B7BC8" />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#000000",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hasPupil ? pupilName || "Selected pupil" : "No pupil selected"}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#6E6E73",
            marginTop: 2,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hasPupil ? (selectedSubtitle || "Live lesson") : emptySubtitle}
        </div>
      </div>

      <ChevronDown
        size={12}
        strokeWidth={1.6}
        color="#6E6E73"
        style={{
          flexShrink: 0,
          transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
  );
}
