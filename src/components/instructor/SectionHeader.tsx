import { ReactNode } from "react";

/**
 * SectionHeader — DSM warm-paper section anchor.
 *
 * Sits directly on the warm paper background (no card, no shadow) above each
 * top-level dashboard section. A 3×16px coloured accent bar signals the section
 * type, followed by a sentence-case title and optional live meta text on the
 * right.
 *
 * Accent bar colours map to the DSM logo palette:
 *   schedule | money  → #185FA5 (navy-blue)
 *   navigation        → #042C53 (deep navy)
 *   people | messages → #2C2C2A (near-black)
 *   urgent            → #A32D2D (red)
 *   neutral (default) → #5F5E5A (grey)
 */

export type SectionHeaderCategory =
  | "schedule"
  | "navigation"
  | "money"
  | "people"
  | "messages"
  | "urgent"
  | "neutral";

const ACCENT_BY_CATEGORY: Record<SectionHeaderCategory, string> = {
  schedule: "#185FA5",
  navigation: "#042C53",
  money: "#185FA5",
  people: "#2C2C2A",
  messages: "#2C2C2A",
  urgent: "#A32D2D",
  neutral: "#5F5E5A",
};

export interface SectionHeaderProps {
  title: string;
  category?: SectionHeaderCategory;
  /** Live meta text shown right-aligned (e.g. "Sun 19 Apr · 1 lesson"). */
  meta?: ReactNode;
  /** Replace meta with a custom right-side node (e.g. day toggle). */
  rightSlot?: ReactNode;
  /** Show muted skeleton in place of meta while loading. */
  metaLoading?: boolean;
  className?: string;
  /** Extra horizontal padding for the row (defaults to 16px to match grids). */
  paddingX?: number;
}

export function SectionHeader({
  title,
  category = "neutral",
  meta,
  rightSlot,
  metaLoading = false,
  className,
  paddingX = 16,
}: SectionHeaderProps) {
  const accent = ACCENT_BY_CATEGORY[category];

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: `0 ${paddingX}px`,
        marginBottom: 10,
        paddingLeft: paddingX + 4,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 3,
          height: 16,
          borderRadius: 2,
          background: accent,
          flexShrink: 0,
        }}
      />
      <h2
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#2C2C2A",
          lineHeight: 1.2,
          margin: 0,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {title}
      </h2>
      {rightSlot ? (
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
          {rightSlot}
        </div>
      ) : metaLoading ? (
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "#888780",
            opacity: 0.5,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Loading…
        </span>
      ) : meta ? (
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "#888780",
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {meta}
        </span>
      ) : null}
    </div>
  );
}
