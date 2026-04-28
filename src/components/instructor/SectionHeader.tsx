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
  /** Optional override for the title text colour (default #2C2C2A). */
  titleColor?: string;
  /** Optional override for the meta text colour (default #888780). */
  metaColor?: string;
  /**
   * Visual variant.
   * - "bar" (default): coloured accent bar + sentence-case title.
   * - "eyebrow": iOS Settings-style uppercase tracked label, no bar.
   */
  variant?: "bar" | "eyebrow";
}

export function SectionHeader({
  title,
  category = "neutral",
  meta,
  rightSlot,
  metaLoading = false,
  className,
  paddingX = 16,
  titleColor = "#2C2C2A",
  metaColor = "#888780",
  variant = "bar",
}: SectionHeaderProps) {
  const accent = ACCENT_BY_CATEGORY[category];

  if (variant === "eyebrow") {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: `0 ${paddingX + 4}px`,
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#6E6E73",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            margin: 0,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
          }}
        >
          {title}
        </h2>
        {(rightSlot || meta) && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: metaColor,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {rightSlot ?? meta}
          </span>
        )}
      </div>
    );
  }

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
          color: titleColor,
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
            color: metaColor,
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
            color: metaColor,
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
