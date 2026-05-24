import React from "react";

type AccentColorKey = "amber" | "red";

const ACCENT: Record<AccentColorKey, { border: string; bg: string }> = {
  amber: { border: "#f59e0b", bg: "#fffdf5" },
  red: { border: "#c9302c", bg: "#fbe8e8" },
};

export interface TileCardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: AccentColorKey;
  onClick?: () => void;
  ariaLabel?: string;
}

const TileCard: React.FC<TileCardProps> = ({ children, className, accentColor, onClick, ariaLabel }) => {
  const accent = accentColor ? ACCENT[accentColor] : null;
  const style: React.CSSProperties = {
    background: accent ? accent.bg : "#ffffff",
    border: accent ? undefined : "0.5px solid #e0e3ea",
    borderLeft: accent ? `3px solid ${accent.border}` : undefined,
    borderRadius: accent ? "0 14px 14px 0" : 14,
    overflow: "hidden",
    width: "100%",
    textAlign: "left",
    display: "block",
    cursor: onClick ? "pointer" : "default",
    padding: 0,
    fontFamily: '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif',
    WebkitTapHighlightColor: "transparent",
  };
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} style={style} className={className}>
        {children}
      </button>
    );
  }
  return (
    <div className={className} style={style} aria-label={ariaLabel}>
      {children}
    </div>
  );
};

export default TileCard;
