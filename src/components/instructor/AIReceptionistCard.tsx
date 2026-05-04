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
}

const SEGMENTS: { value: AICallDivertMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "on_now", label: "On now" },
  { value: "auto", label: "Auto" },
];

export function AIReceptionistCard({ state, onOpenSheet }: AIReceptionistCardProps) {
  const { settings, toggleOn, active, statusLine, setMode } = state;
  const setupIssue = !settings.numberConnected;

  return (
    <div style={{ padding: "0 14px 14px" }}>
      <div
        role="group"
        aria-label="AI call divert"
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: setupIssue ? "0.5px solid rgba(180,83,9,0.35)" : `0.5px solid ${BORDER}`,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
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
            gap: 10,
            background: "transparent",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
            width: "100%",
          }}
        >
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: setupIssue ? AMBER : BLUE,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              AI Receptionist
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: CHARCOAL,
                marginTop: 2,
                lineHeight: 1.2,
                letterSpacing: "-0.2px",
              }}
            >
              Auto-divert during lessons
            </div>
            <div
              style={{
                fontSize: 11,
                color: setupIssue ? AMBER : active ? GREEN : MUTED,
                marginTop: 3,
                fontWeight: active ? 600 : 500,
                fontVariantNumeric: "tabular-nums",
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
              width: 38,
              height: 22,
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
                left: toggleOn ? 18 : 2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
                transition: "left 180ms ease",
              }}
            />
          </span>
        </button>

        {/* Segmented control */}
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
                  : BLUE;
            const activeColor = seg.value === "off" ? CHARCOAL : "#FFFFFF";
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
                  boxShadow: isActive && seg.value === "off" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {seg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
