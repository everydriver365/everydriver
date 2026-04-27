/**
 * Premium colour-shifting mode banner with a two-segment toggle.
 * The whole banner background changes based on mode, making the state
 * unmistakable. Reusable wherever a binary mode needs visual reinforcement.
 */
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export type ModeBannerMode = "real" | "mock";

interface ModeBannerProps {
  mode: ModeBannerMode;
  onChange: (mode: ModeBannerMode) => void;
  realLabel?: string;
  mockLabel?: string;
}

export function ModeBanner({
  mode,
  onChange,
  realLabel = "Real test",
  mockLabel = "Mock test",
}: ModeBannerProps) {
  const isMock = mode === "mock";
  const bg = isMock ? "#FBF1DE" : "#E6F1FB";
  const accent = isMock ? "#B8801F" : "#2B7BC8";
  const contextLabel = isMock ? "Practice mode" : "Official record";

  const segmentBase: React.CSSProperties = {
    borderRadius: 6,
    padding: "6px 0",
    border: 0,
    cursor: "pointer",
    fontFamily: FONT_STACK,
    fontSize: 12,
    transition: "background 0.15s ease, color 0.15s ease",
  };

  const renderSegment = (
    value: ModeBannerMode,
    label: string,
    activeBg: string,
  ) => {
    const active = mode === value;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => {
          if (!active) onChange(value);
        }}
        style={{
          ...segmentBase,
          background: active ? activeBg : "transparent",
          color: active ? "#FFFFFF" : "#6E6E73",
          fontWeight: active ? 500 : 400,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "0.5px solid #E5E5EA",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: bg,
        transition: "background 0.2s ease",
      }}
    >
      <div
        role="tablist"
        aria-label="Test mode"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 4,
          background: "#FFFFFF",
          borderRadius: 8,
          padding: 3,
        }}
      >
        {renderSegment("real", realLabel, "#2B7BC8")}
        {renderSegment("mock", mockLabel, "#B8801F")}
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: 11,
          fontWeight: 500,
          color: accent,
          fontFamily: FONT_STACK,
          margin: 0,
        }}
      >
        {contextLabel}
      </span>
    </div>
  );
}
