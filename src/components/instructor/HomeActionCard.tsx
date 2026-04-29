import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  AlertTriangle,
  PoundSterling,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import type { PriorityAction } from "@/lib/composeStatusSubtitle";

interface HomeActionCardProps {
  action: PriorityAction;
  totalActions: number;
  onPress?: () => void;
  onViewAll?: () => void;
}

const RED = "#C8434F";
const RED_TINT = "#FBEAEC";
const TXT_PRIMARY = "#000000";
const TXT_SECONDARY = "#6E6E73";

function ActionIcon({ kind }: { kind: PriorityAction["kind"] }) {
  const common = { size: 18, strokeWidth: 2, color: RED } as const;
  switch (kind) {
    case "job_offer":
      return <Briefcase {...common} />;
    case "conflict":
      return <AlertTriangle {...common} />;
    case "payment":
      return <PoundSterling {...common} />;
    case "test_swap":
    case "message":
    case "visitor_chat":
    case "generic":
    default:
      return <AlertCircle {...common} />;
  }
}

export function HomeActionCard({
  action,
  totalActions,
  onPress,
  onViewAll,
}: HomeActionCardProps) {
  const navigate = useNavigate();
  const handlePress = () => {
    if (onPress) onPress();
    else navigate(action.route);
  };
  const handleViewAll = () => {
    if (onViewAll) onViewAll();
    else navigate("/instructor/notifications");
  };

  const moreCount = Math.max(0, totalActions - 1);
  const subtitleWithMore = moreCount > 0 ? `${action.subtitle} · +${moreCount} more` : action.subtitle;

  return (
    <div style={{ padding: "0 14px", marginBottom: 8 }}>
      <button
        type="button"
        onClick={handlePress}
        className="w-full text-left"
        style={{
          background: "#FFFFFF",
          border: "none",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 9,
            background: RED_TINT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActionIcon kind={action.kind} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: RED,
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              margin: "0 0 1px",
            }}
          >
            {action.eyebrow}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: TXT_PRIMARY,
              letterSpacing: "-0.1px",
              margin: "0 0 1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {action.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: TXT_SECONDARY,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitleWithMore}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          <ChevronRight size={14} strokeWidth={1.6} color={TXT_SECONDARY} />
        </div>
      </button>

      {totalActions > 1 && (
        <button
          type="button"
          onClick={handleViewAll}
          style={{
            marginTop: 6,
            background: "transparent",
            border: "none",
            padding: "4px 2px",
            fontSize: 12,
            fontWeight: 500,
            color: "#2B7BC8",
            cursor: "pointer",
          }}
        >
          View all ({totalActions})
        </button>
      )}
    </div>
  );
}
