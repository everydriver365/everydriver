import { ChevronRight } from "lucide-react";
import { pupilAvatarColor } from "@/lib/pupilAvatarColor";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export interface RecipientAvatarSeed {
  id: string;
  name: string;
}

export interface RecipientSummaryCardProps {
  /** Total number of recipients currently selected. */
  recipientCount: number;
  /** Seeds for the visible avatar stack — order matters; only first 4 are used. */
  avatars: RecipientAvatarSeed[];
  onPress: () => void;
  /** Optional override subtitle. */
  subtitle?: string;
}

/**
 * "Sending to N pupils" tile — opens the recipient picker sheet.
 */
export function RecipientSummaryCard({
  recipientCount,
  avatars,
  onPress,
  subtitle = "Tap to customise recipients",
}: RecipientSummaryCardProps) {
  const visible = avatars.slice(0, recipientCount > 4 ? 3 : 4);
  const overflow = Math.max(0, recipientCount - visible.length);

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: "100%",
        background: "#F2F2F4",
        borderRadius: 10,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        border: "none",
        textAlign: "left",
        fontFamily: FONT_STACK,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Avatar stack */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        {visible.map((a, i) => {
          const initial = (a.name || "?").trim().charAt(0).toUpperCase() || "?";
          return (
            <span
              key={a.id}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: pupilAvatarColor(a.id || a.name),
                border: "1.5px solid #F2F2F4",
                color: "#FFFFFF",
                fontSize: 9,
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: i === 0 ? 0 : -8,
                flexShrink: 0,
              }}
            >
              {initial}
            </span>
          );
        })}
        {overflow > 0 && (
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#6E6E73",
              border: "1.5px solid #F2F2F4",
              color: "#FFFFFF",
              fontSize: 9,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -8,
              flexShrink: 0,
            }}
          >
            +{overflow}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#000000",
            lineHeight: 1.25,
          }}
        >
          Sending to {recipientCount} pupil{recipientCount === 1 ? "" : "s"}
        </div>
        <div style={{ fontSize: 11, color: "#6E6E73", marginTop: 2 }}>
          {subtitle}
        </div>
      </div>

      <ChevronRight
        size={12}
        strokeWidth={1.6}
        color="#6E6E73"
        style={{ flexShrink: 0 }}
      />
    </button>
  );
}
