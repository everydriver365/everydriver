import { useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useNextBestAction, snoozeNextBestAction } from "@/hooks/useNextBestAction";
import { haptics } from "@/lib/haptics";

interface Props {
  instructorId: string | undefined;
}

// Inject the one-shot pulse keyframes once per app load.
let pulseStyleInjected = false;
function ensurePulseStyle() {
  if (pulseStyleInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.setAttribute("data-dtn-pulse", "true");
  style.textContent = `
@keyframes dtn-pulse-ring {
  0%   { transform: scale(0.85); opacity: 0.45; }
  100% { transform: scale(1.6);  opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .dtn-pulse-ring { animation: none !important; opacity: 0 !important; }
}
`;
  document.head.appendChild(style);
  pulseStyleInjected = true;
}

/**
 * "Do this next" — single contextual hero CTA. Tone-tinted gradient, solid
 * icon tile and verb pill make it visually dominant on the home screen.
 */
export function DoThisNextCard({ instructorId }: Props) {
  const action = useNextBestAction(instructorId);
  const [dismissed, setDismissed] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    ensurePulseStyle();
  }, []);

  // Reset the one-shot pulse flag whenever the action identity changes.
  useEffect(() => {
    mountedRef.current = false;
    const t = setTimeout(() => {
      mountedRef.current = true;
    }, 1700);
    return () => clearTimeout(t);
  }, [action?.snoozeKey]);

  if (!action || dismissed) return null;

  const Icon = action.icon;

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.selection();
    snoozeNextBestAction(action.snoozeKey);
    setDismissed(true);
  };

  const handlePress = () => {
    haptics.selection();
    action.onPress();
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-label={action.title}
      style={{
        position: "relative",
        width: "100%",
        background: `linear-gradient(135deg, ${action.cardBg} 0%, #FFFFFF 70%)`,
        borderRadius: 12,
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.04), 0 8px 28px -12px rgba(16,24,40,0.10)",
        border: `1px solid ${action.cardBorder}`,
        padding: "16px 14px 16px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {/* Icon tile with one-shot pulse ring */}
      <div
        style={{
          position: "relative",
          width: 44,
          height: 44,
          flexShrink: 0,
        }}
      >
        <span
          aria-hidden
          className="dtn-pulse-ring"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            background: action.iconFg,
            animation: "dtn-pulse-ring 1.6s ease-out 1 forwards",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            width: 44,
            height: 44,
            borderRadius: 12,
            background: action.iconFg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 12px -4px ${action.iconFg}66`,
          }}
        >
          <Icon size={22} strokeWidth={2} color="#FFFFFF" />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16.5,
            fontWeight: 700,
            color: "#1C1C1E",
            letterSpacing: "-0.2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
          }}
        >
          {action.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6E6E73",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {action.subtitle}
        </div>
      </div>

      {/* Verb pill */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
          color: action.iconFg,
          background: action.cardBorder, // ~22% tone
          padding: "4px 9px",
          borderRadius: 999,
          flexShrink: 0,
        }}
      >
        {action.verb}
      </span>

      <ChevronRight size={18} strokeWidth={2} color={action.iconFg} style={{ flexShrink: 0, opacity: 0.7 }} />

      {/* Snooze — tiny, top-right, low-contrast so it doesn't compete */}
      <button
        type="button"
        onClick={handleSnooze}
        aria-label="Snooze for 24 hours"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "transparent",
          border: 0,
          padding: 4,
          color: "#C7C7CC",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
        }}
      >
        <X size={13} strokeWidth={2} />
      </button>
    </button>
  );
}
