import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useNextBestAction, snoozeNextBestAction } from "@/hooks/useNextBestAction";
import { haptics } from "@/lib/haptics";

interface Props {
  instructorId: string | undefined;
}

/**
 * "Do this next" — a single contextual action card composed from the
 * highest-priority signal across debt, swap offers, gaps and churn risk.
 * Renders nothing when there's no actionable item.
 */
export function DoThisNextCard({ instructorId }: Props) {
  const action = useNextBestAction(instructorId);
  const [dismissed, setDismissed] = useState(false);

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
    <section className="mt-4">
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#8E8E93",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          margin: "0 2px 8px",
        }}
      >
        Do this next
      </div>
      <button
        type="button"
        onClick={handlePress}
        aria-label={action.title}
        style={{
          width: "100%",
          background: "#FFFFFF",
          borderRadius: 22,
          boxShadow:
            "0 1px 2px rgba(16,24,40,0.04), 0 8px 28px -12px rgba(16,24,40,0.08)",
          border: 0,
          padding: "14px 14px 14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: action.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} strokeWidth={1.8} color={action.iconFg} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1C1C1E",
              letterSpacing: "-0.2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {action.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6E6E73",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {action.subtitle}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSnooze}
          aria-label="Snooze for 24 hours"
          style={{
            background: "transparent",
            border: 0,
            padding: 6,
            color: "#C7C7CC",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>

        <ChevronRight size={18} strokeWidth={1.8} color="#C7C7CC" />
      </button>
    </section>
  );
}
