import React from "react";

type ColorKey = "blue" | "red" | "green" | "purple" | "amber" | "grey";
type BadgeColorKey = "blue" | "green" | "amber" | "red" | "grey";
type ValueColorKey = "dark" | "blue" | "green" | "amber" | "red";
type AccentColorKey = "amber" | "red";
type VariantKey = "navigation" | "info" | "slot";

export interface TileProps {
  icon: string;
  iconColor?: ColorKey;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  badgeColor?: BadgeColorKey;
  value?: string;
  valueColor?: ValueColorKey;
  progressPercent?: number;
  accentColor?: AccentColorKey;
  variant?: VariantKey;
  dateDay?: string;
  dateNum?: string | number;
  dateMon?: string;
  dateBg?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const ICON_PALETTE: Record<ColorKey, { bg: string; fg: string }> = {
  blue: { bg: "#e8eefb", fg: "#2952b3" },
  red: { bg: "#fbe8e8", fg: "#c9302c" },
  green: { bg: "#e8f5ee", fg: "#2d8a4e" },
  purple: { bg: "#f0edfb", fg: "#6b4fc4" },
  amber: { bg: "#fff3e0", fg: "#d97706" },
  grey: { bg: "#f0f1f4", fg: "#888888" },
};

const BADGE_PALETTE: Record<BadgeColorKey, { bg: string; fg: string }> = {
  blue: { bg: "#e8eefb", fg: "#2952b3" },
  green: { bg: "#e8f5ee", fg: "#2d8a4e" },
  amber: { bg: "#fff3e0", fg: "#d97706" },
  red: { bg: "#fbe8e8", fg: "#c9302c" },
  grey: { bg: "#F2F4F8", fg: "#888888" },
};

const VALUE_PALETTE: Record<ValueColorKey, string> = {
  dark: "#1a1a1f",
  blue: "#2952b3",
  green: "#2d8a4e",
  amber: "#d97706",
  red: "#c9302c",
};

const PROGRESS_FILL: Record<ValueColorKey, string> = {
  dark: "#1a1a1f",
  blue: "#2952b3",
  green: "#2d8a4e",
  amber: "#f59e0b",
  red: "#c9302c",
};

const ACCENT_BG: Record<AccentColorKey, { border: string; bg: string }> = {
  amber: { border: "#f59e0b", bg: "#fffdf5" },
  red: { border: "#c9302c", bg: "#fbe8e8" },
};

const FONT_STACK = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';

const Tile: React.FC<TileProps> = ({
  icon,
  iconColor = "blue",
  title,
  subtitle,
  eyebrow,
  badge,
  badgeColor = "blue",
  value,
  valueColor = "dark",
  progressPercent,
  accentColor,
  variant = "info",
  dateDay,
  dateNum,
  dateMon,
  dateBg,
  onClick,
  children,
  className,
}) => {
  const iconPal = ICON_PALETTE[iconColor];
  const badgePal = BADGE_PALETTE[badgeColor];
  const valueCol = VALUE_PALETTE[valueColor];
  const progressFill = PROGRESS_FILL[valueColor];

  // Base styling per variant
  const isNav = variant === "navigation";
  const isSlot = variant === "slot";

  const baseStyle: React.CSSProperties = {
    position: "relative",
    background: "#ffffff",
    borderRadius: isNav ? 12 : 14,
    border: isNav ? "none" : "0.5px solid #e0e3ea",
    overflow: "hidden",
    fontFamily: FONT_STACK,
    textAlign: "left",
    cursor: onClick ? "pointer" : "default",
    width: "100%",
    display: "block",
    padding: 0,
  };

  // Accent override
  let accentStyle: React.CSSProperties = {};
  if (accentColor) {
    const a = ACCENT_BG[accentColor];
    accentStyle = {
      background: a.bg,
      borderLeft: `3px solid ${a.border}`,
      borderRadius: "0 14px 14px 0",
    };
  }

  const merged: React.CSSProperties = { ...baseStyle, ...accentStyle, ...(isSlot ? { border: "1px solid #e0e3ea" } : {}) };

  const innerPadding = 14;

  // Slot variant: date column + body
  if (isSlot) {
    return (
      <div style={merged} className={className} onClick={onClick} role={onClick ? "button" : undefined}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {(dateDay || dateNum || dateMon) && (
            <div
              style={{
                background: dateBg || ICON_PALETTE[iconColor].bg,
                color: ICON_PALETTE[iconColor].fg,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 56,
                fontFamily: FONT_STACK,
              }}
            >
              {dateDay && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.85 }}>{dateDay}</span>}
              {dateNum !== undefined && <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{dateNum}</span>}
              {dateMon && <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.85 }}>{dateMon}</span>}
            </div>
          )}
          <div style={{ flex: 1, padding: innerPadding, minWidth: 0 }}>
            {renderBody()}
          </div>
        </div>
        {children && <div style={{ borderTop: "1px solid #f0f1f4" }}>{children}</div>}
        {renderProgress()}
        {renderBadge()}
      </div>
    );
  }

  return (
    <div style={merged} className={className} onClick={onClick} role={onClick ? "button" : undefined}>
      <div style={{ padding: innerPadding }}>
        {renderBody()}
        {children}
      </div>
      {renderProgress()}
      {renderBadge()}
    </div>
  );

  function renderBody() {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: iconPal.bg,
            color: iconPal.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: 18, lineHeight: 1, color: iconPal.fg }} aria-hidden />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {eyebrow && (
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: "#999999", marginBottom: 2 }}>
              {eyebrow}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1f", lineHeight: 1.3, wordBreak: "break-word" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "#bbbbbb", lineHeight: 1.3, marginTop: 2 }}>
              {subtitle}
            </div>
          )}
          {value && (
            <div style={{ fontSize: 17, fontWeight: 600, color: valueCol, marginTop: 4, lineHeight: 1.2 }}>
              {value}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderBadge() {
    if (!badge) return null;
    return (
      <span
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          fontSize: 9,
          fontWeight: 600,
          padding: "3px 7px",
          borderRadius: 10,
          background: badgePal.bg,
          color: badgePal.fg,
          fontFamily: FONT_STACK,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {badge}
      </span>
    );
  }

  function renderProgress() {
    if (typeof progressPercent !== "number") return null;
    const pct = Math.max(0, Math.min(100, progressPercent));
    return (
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "#eef1f8" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: progressFill }} />
      </div>
    );
  }
};

export default Tile;
