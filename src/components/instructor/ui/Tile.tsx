import React, { useRef } from "react";

type ColorKey = "blue" | "red" | "green" | "purple" | "amber" | "grey";
type BadgeColorKey = "blue" | "green" | "amber" | "red" | "grey";
type ValueColorKey = "dark" | "blue" | "green" | "amber" | "red";
type AccentColorKey = "amber" | "red";
type VariantKey = "navigation" | "info" | "slot";

export interface TileProps {
  icon?: string;
  iconNode?: React.ReactNode;
  iconColor?: ColorKey;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: string;
  badgeColor?: BadgeColorKey;
  badgeCount?: number;
  badgeVisible?: boolean;
  value?: string;
  valueColor?: ValueColorKey;
  progressPercent?: number;
  accentColor?: AccentColorKey;
  variant?: VariantKey;
  dateDay?: string;
  dateNum?: string | number;
  dateMon?: string;
  dateBg?: string;
  selected?: boolean;
  trailing?: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  iconOptional?: boolean;
  /** When true, render iconNode without the coloured 36×36 background wrapper. Use for 3D PNG icons. */
  iconBare?: boolean;
  disabled?: boolean;
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
  iconNode,
  iconColor = "blue",
  title,
  subtitle,
  eyebrow,
  badge,
  badgeColor = "blue",
  badgeCount,
  badgeVisible = true,
  value,
  valueColor = "dark",
  progressPercent,
  accentColor,
  variant = "info",
  dateDay,
  dateNum,
  dateMon,
  dateBg,
  selected = false,
  trailing,
  onClick,
  onLongPress,
  onSecondaryAction,
  children,
  className,
  ariaLabel,
  iconOptional = false,
  iconBare = false,
  disabled = false,
}) => {
  const iconPal = ICON_PALETTE[iconColor];
  const badgePal = BADGE_PALETTE[badgeColor];
  const valueCol = VALUE_PALETTE[valueColor];
  const progressFill = PROGRESS_FILL[valueColor];

  const isNav = variant === "navigation";
  const isSlot = variant === "slot";

  // Long-press handling (cancels on scroll/drag movement)
  const pressTimer = useRef<number | null>(null);
  const longFired = useRef(false);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const MOVE_THRESHOLD = 8;
  const handlePressStart = (e: React.PointerEvent) => {
    if (!onLongPress) return;
    longFired.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = window.setTimeout(() => {
      longFired.current = true;
      onLongPress();
    }, 500);
  };
  const handlePressEnd = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    pressStart.current = null;
  };
  const handlePressMove = (e: React.PointerEvent) => {
    if (!pressStart.current || pressTimer.current === null) return;
    const dx = e.clientX - pressStart.current.x;
    const dy = e.clientY - pressStart.current.y;
    if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const handleClick = () => {
    if (longFired.current) return;
    onClick?.();
  };

  // Selection overrides
  const selectionBorder = selected ? "1px solid #2952b3" : undefined;
  const selectionBg = selected ? "#f8fbff" : undefined;

  const baseStyle: React.CSSProperties = {
    position: "relative",
    background: selectionBg ?? "#ffffff",
    borderRadius: isNav ? 12 : 14,
    border: selectionBorder ?? (isNav ? "none" : "0.5px solid #e0e3ea"),
    overflow: "hidden",
    fontFamily: FONT_STACK,
    textAlign: "left",
    cursor: onClick || onLongPress ? "pointer" : "default",
    width: "100%",
    display: "block",
    padding: 0,
    WebkitTapHighlightColor: "transparent",
  };

  let accentStyle: React.CSSProperties = {};
  if (accentColor && !selected) {
    const a = ACCENT_BG[accentColor];
    accentStyle = {
      background: a.bg,
      borderLeft: `3px solid ${a.border}`,
      borderRadius: "0 14px 14px 0",
    };
  }

  const merged: React.CSSProperties = {
    ...baseStyle,
    ...accentStyle,
    ...(isSlot && !selected ? { border: "1px solid #e0e3ea" } : {}),
    ...(disabled ? { opacity: 0.6, pointerEvents: "none" as const } : {}),
  };

  const innerPadding = 14;

  const interactiveProps = {
    onClick: handleClick,
    onPointerDown: handlePressStart,
    onPointerMove: handlePressMove,
    onPointerUp: handlePressEnd,
    onPointerLeave: handlePressEnd,
    onPointerCancel: handlePressEnd,
    onContextMenu: onSecondaryAction
      ? (e: React.MouseEvent) => {
          e.preventDefault();
          onSecondaryAction();
        }
      : undefined,
    role: onClick || onLongPress ? "button" : undefined,
    "aria-label": ariaLabel,
  };

  if (isSlot) {
    return (
      <div style={merged} className={className} {...interactiveProps}>
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
              {dateDay && <span style={dateLabelStyle}>{dateDay}</span>}
              {dateNum !== undefined && <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{dateNum}</span>}
              {dateMon && <span style={dateLabelStyle}>{dateMon}</span>}
            </div>
          )}
          <div style={{ flex: 1, padding: innerPadding, minWidth: 0, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>{renderBody()}</div>
            {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
          </div>
        </div>
        {children && <div style={{ borderTop: "1px solid #f0f1f4" }}>{children}</div>}
        {renderProgress()}
        {renderBadge()}
      </div>
    );
  }

  return (
    <div style={merged} className={className} {...interactiveProps}>
      <div style={{ padding: innerPadding, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderBody()}
          {children}
        </div>
        {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
      </div>
      {renderProgress()}
      {renderBadge()}
    </div>
  );

  function renderBody() {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
        {!iconOptional && (
          iconBare ? (
            <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {iconNode}
            </div>
          ) : (
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
              {iconNode ?? (icon ? <i className={`ti ${icon}`} style={{ fontSize: 18, lineHeight: 1, color: iconPal.fg }} aria-hidden /> : null)}
            </div>
          )
        )}
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
    if (!badgeVisible) return null;
    // Numeric count badge takes precedence
    if (typeof badgeCount === "number" && badgeCount > 0) {
      const label = badgeCount > 99 ? "99+" : String(badgeCount);
      return (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 999,
            background: "#c9302c",
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_STACK,
          }}
        >
          {label}
        </span>
      );
    }
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

const dateLabelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  opacity: 0.85,
};

// ─── Pill ──────────────────────────────────────────────────────────────────
type PillColor = "blue" | "green" | "amber" | "red" | "grey";

const PILL_PALETTE: Record<PillColor, { bg: string; fg: string; dot: string }> = {
  blue: { bg: "#e8eefb", fg: "#2952b3", dot: "#2952b3" },
  green: { bg: "#e8f5ee", fg: "#2d8a4e", dot: "#2d8a4e" },
  amber: { bg: "#fff3e0", fg: "#d97706", dot: "#d97706" },
  red: { bg: "#fbe8e8", fg: "#c9302c", dot: "#c9302c" },
  grey: { bg: "#F2F4F8", fg: "#888888", dot: "#888888" },
};

export interface PillProps {
  color?: PillColor;
  label: string;
  dot?: boolean;
  animated?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export const Pill: React.FC<PillProps> = ({
  color = "grey",
  label,
  dot = false,
  animated = false,
  onClick,
  ariaLabel,
  className,
}) => {
  const pal = PILL_PALETTE[color];
  const styleId = "ui-pill-pulse-keyframes";
  // Inject keyframes once
  if (typeof document !== "undefined" && animated && !document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `@keyframes ui-pill-pulse { from { opacity: 0.4; } to { opacity: 1; } }`;
    document.head.appendChild(style);
  }
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick as any}
      aria-label={ariaLabel ?? label}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: pal.bg,
        color: pal.fg,
        borderRadius: 999,
        padding: "4px 10px",
        border: "none",
        fontFamily: FONT_STACK,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        cursor: onClick ? "pointer" : "default",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {dot && (
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: pal.dot,
            animation: animated ? "ui-pill-pulse 1.5s ease-in-out infinite alternate" : undefined,
            display: "inline-block",
          }}
        />
      )}
      {label}
    </Tag>
  );
};

export default Tile;
