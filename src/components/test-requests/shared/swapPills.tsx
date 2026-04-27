import { ReactNode } from "react";

export type RequestType = "have_test" | "want_test";
export type RequestStatus = "active" | "paused" | "matched" | "expired" | "cancelled";

const TYPE_STYLES: Record<RequestType, { bg: string; fg: string; label: string }> = {
  want_test: { bg: "#F1ECFA", fg: "#8A5BC9", label: "Want test" },
  have_test: { bg: "#FBF1DE", fg: "#B8801F", label: "Offering" },
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  active: "#3B8B3B",
  paused: "#B8801F",
  matched: "#2B7BC8",
  expired: "#6E6E73",
  cancelled: "#C8434F",
};

export function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[(type as RequestType)] ?? TYPE_STYLES.want_test;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.3px",
        padding: "3px 8px",
        borderRadius: 4,
        textTransform: "uppercase",
        background: style.bg,
        color: style.fg,
      }}
    >
      {style.label}
    </span>
  );
}

export function StatusIndicator({ status }: { status: string }) {
  const color = STATUS_COLORS[(status as RequestStatus)] ?? STATUS_COLORS.expired;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
          color,
        }}
      >
        {status}
      </span>
    </span>
  );
}

export function IconActionButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: (e: React.MouseEvent) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      style={{
        background: "#F2F2F4",
        border: "none",
        width: 30,
        height: 30,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function MetaRow({ icon, label }: { icon: ReactNode; label: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ flexShrink: 0, color: "#6E6E73", display: "inline-flex" }}>{icon}</span>
      <span style={{ fontSize: 13, color: "#000000" }}>{label}</span>
    </div>
  );
}
