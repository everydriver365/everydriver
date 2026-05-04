import { Sparkles, Phone } from "lucide-react";
import type { AICallDivertMode, AICallDivertState } from "@/hooks/useAICallDivert";

const BLUE = "#3D55A1";
const BLUE_TINT = "#EDF2FE";
const BORDER = "rgba(26,82,160,0.10)";
const MUTED = "#5B6B8A";
const CHARCOAL = "#2B2B2B";
const AMBER = "#B45309";
const AMBER_TINT = "#FFF6E6";
const GREEN = "#10A37F";

interface AIReceptionistCardProps {
  state: AICallDivertState;
  onOpenSheet: () => void;
  /** When true, drops outer page padding so it can sit inside a parent grid row. */
  compact?: boolean;
}

const SEGMENTS: { value: AICallDivertMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "on_now", label: "On now" },
  { value: "auto", label: "Auto" },
];

export function AIReceptionistCard({ state, onOpenSheet, compact = false }: AIReceptionistCardProps) {
  const { settings, toggleOn, active, statusLine, setMode } = state;
  const setupIssue = !settings.numberConnected;

  const inner = (
      <div
        role="group"
        aria-label="AI call divert"
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: setupIssue ? "0.5px solid rgba(180,83,9,0.35)" : `0.5px solid ${BORDER}`,
          padding: compact ? "8px 9px" : "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: compact ? 6 : 10,
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          height: "100%",
        }}
      >
        {/* Top row: icon + title + toggle */}
        <button
          type="button"
          onClick={onOpenSheet}
          aria-label="Open AI call divert settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: compact ? 8 : 10,
            background: "transparent",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {!compact && (
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: setupIssue ? AMBER_TINT : BLUE_TINT,
                color: setupIssue ? AMBER : BLUE,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <Phone size={14} strokeWidth={2.2} />
              <Sparkles
                size={9}
                strokeWidth={2.4}
                style={{ position: "absolute", top: 4, right: 4 }}
              />
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: compact ? 9 : 10,
                fontWeight: 700,
                color: setupIssue ? AMBER : BLUE,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {compact ? "AI RECEPTION" : "AI Receptionist"}
            </div>
            <div
              style={{
                fontSize: compact ? 12 : 14,
                fontWeight: 600,
                color: CHARCOAL,
                marginTop: 2,
                lineHeight: 1.2,
                letterSpacing: "-0.2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {compact ? "Auto-divert" : "Auto-divert during lessons"}
            </div>
            <div
              style={{
                fontSize: compact ? 10 : 11,
                color: setupIssue ? AMBER : active ? GREEN : MUTED,
                marginTop: 3,
                fontWeight: active ? 600 : 500,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {statusLine}
            </div>
          </div>

          {/* iOS-style toggle (visual only — segmented below is the real control) */}
          <span
            role="switch"
            aria-checked={toggleOn}
            aria-label="Turn AI receptionist on or off"
            style={{
              width: compact ? 30 : 38,
              height: compact ? 18 : 22,
              borderRadius: 999,
              background: toggleOn ? (active ? GREEN : BLUE) : "#E5E7EB",
              position: "relative",
              flexShrink: 0,
              transition: "background 180ms ease",
              boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.04)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: toggleOn ? (compact ? 14 : 18) : 2,
                width: compact ? 14 : 18,
                height: compact ? 14 : 18,
                borderRadius: "50%",
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
                transition: "left 180ms ease",
              }}
            />
          </span>
        </button>

        {/* Segmented control — hidden in compact mode (toggle + tap-to-open sheet) */}
        {!compact && (
          <div
            role="tablist"
            aria-label="AI call divert mode"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              background: "#F2F4F8",
              borderRadius: 9,
              padding: 3,
            }}
          >
            {SEGMENTS.map((seg) => {
              const isActive = settings.mode === seg.value;
              const activeBg =
                seg.value === "off"
                  ? "#FFFFFF"
                  : seg.value === "on_now"
                    ? GREEN
                    : "#FFFFFF";
              const activeColor =
                seg.value === "on_now" ? "#FFFFFF" : seg.value === "auto" ? BLUE : CHARCOAL;
              return (
                <button
                  key={seg.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={
                    seg.value === "auto"
                      ? "Set call divert mode to Auto during lessons"
                      : seg.value === "on_now"
                        ? "Turn AI receptionist on now"
                        : "Turn AI receptionist off"
                  }
                  onClick={() => {
                    void setMode(seg.value);
                  }}
                  style={{
                    height: 30,
                    border: "none",
                    borderRadius: 7,
                    background: isActive ? activeBg : "transparent",
                    color: isActive ? activeColor : MUTED,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "-0.1px",
                    cursor: "pointer",
                    transition: "background 160ms ease, color 160ms ease",
                    boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {seg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
  );

  if (compact) return inner;
  return <div style={{ padding: "0 14px 14px" }}>{inner}</div>;
}
