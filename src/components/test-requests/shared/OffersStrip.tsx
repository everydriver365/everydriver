import { MessageCircle, Hourglass, ChevronRight, PauseCircle, CheckCircle2, XCircle } from "lucide-react";

export type OffersStripState = "with-offers" | "waiting" | "paused" | "matched" | "expired" | "visible";

interface OffersStripProps {
  state: OffersStripState;
  count?: number;
  subtitle?: string;
  matchedWith?: string | null;
  onPress?: () => void;
}

const STATE_STYLES: Record<OffersStripState, { bg: string; iconBg: string; chevronColor?: string }> = {
  "with-offers": { bg: "#E6F1FB", iconBg: "#2B7BC8", chevronColor: "#2B7BC8" },
  waiting: { bg: "#F2F2F4", iconBg: "#C7C7CC" },
  paused: { bg: "#FBF1DE", iconBg: "#B8801F", chevronColor: "#B8801F" },
  matched: { bg: "#E8F3E8", iconBg: "#3B8B3B", chevronColor: "#3B8B3B" },
  expired: { bg: "#F2F2F4", iconBg: "#6E6E73" },
  visible: { bg: "#E6F1FB", iconBg: "#2B7BC8" },
};

export function OffersStrip({ state, count = 0, subtitle, matchedWith, onPress }: OffersStripProps) {
  const styles = STATE_STYLES[state];
  const tappable = !!onPress && state !== "waiting" && state !== "expired" && state !== "visible";

  let title = "";
  let sub = subtitle ?? "";
  let Icon = MessageCircle;

  switch (state) {
    case "with-offers":
      title = count === 1 ? "1 instructor has offered a swap" : `${count} instructors have offered swaps`;
      sub = subtitle ?? "Tap to review and accept";
      Icon = MessageCircle;
      break;
    case "waiting":
      title = "Waiting for offers";
      Icon = Hourglass;
      break;
    case "paused":
      title = "Request paused · Tap to resume";
      Icon = PauseCircle;
      break;
    case "matched":
      title = matchedWith ? `Swap matched with ${matchedWith}` : "Swap matched";
      Icon = CheckCircle2;
      break;
    case "expired":
      title = "Request expired · Test date passed";
      Icon = XCircle;
      break;
    case "visible":
      title = "Visible on swap board";
      Icon = MessageCircle;
      break;
  }

  return (
    <div
      role={tappable ? "button" : undefined}
      tabIndex={tappable ? 0 : undefined}
      onClick={tappable ? onPress : undefined}
      onKeyDown={(e) => {
        if (tappable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPress?.();
        }
      }}
      style={{
        background: styles.bg,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: tappable ? "pointer" : "default",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: styles.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} strokeWidth={2} color="#FFFFFF" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#000000", margin: 0 }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 11, color: "#6E6E73", margin: "1px 0 0" }}>{sub}</div>
        )}
      </div>
      {tappable && styles.chevronColor && (
        <ChevronRight size={12} strokeWidth={1.8} color={styles.chevronColor} style={{ flexShrink: 0 }} />
      )}
    </div>
  );
}
