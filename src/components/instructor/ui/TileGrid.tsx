import React from "react";

export interface TileGridProps {
  variant?: "quick-access" | "info" | "list";
  label?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const FONT_STACK = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';

const TileGrid: React.FC<TileGridProps> = ({
  variant = "info",
  label,
  headerRight,
  children,
  className,
}) => {
  const isQuick = variant === "quick-access";
  const isList = variant === "list";

  const gridStyle: React.CSSProperties = isList
    ? { display: "flex", flexDirection: "column", gap: 8, width: "100%" }
    : { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 8, width: "100%" };

  const header = (label || headerRight) ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: isQuick ? 10 : 8,
        fontFamily: FONT_STACK,
      }}
    >
      {label && (
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: "#888888" }}>
          {label}
        </span>
      )}
      {headerRight && <div>{headerRight}</div>}
    </div>
  ) : null;

  if (isQuick) {
    return (
      <div className={className} style={{ fontFamily: FONT_STACK }}>
        {header}
        <div style={{ background: "#ececec", borderRadius: 16, padding: 14 }}>
          <div style={gridStyle}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ fontFamily: FONT_STACK }}>
      {header}
      <div style={gridStyle}>{children}</div>
    </div>
  );
};

export default TileGrid;
