import React from "react";

export type BadgeTone = "green" | "red" | "blue" | "amber" | "purple" | "grey";

const STYLES: Record<BadgeTone, { bg: string; fg: string }> = {
  green:  { bg: "#D1FAE5", fg: "#059669" },
  red:    { bg: "#FEE2E2", fg: "#DC2626" },
  blue:   { bg: "#DBEAFE", fg: "#2563EB" },
  amber:  { bg: "#FEF3C7", fg: "#D97706" },
  purple: { bg: "#EDE9FE", fg: "#7C3AED" },
  grey:   { bg: "#F3F4F6", fg: "#6B7280" },
};

export function Badge({ tone = "grey", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  const s = STYLES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        borderRadius: 20,
        fontSize: 9,
        fontWeight: 600,
        background: s.bg,
        color: s.fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
