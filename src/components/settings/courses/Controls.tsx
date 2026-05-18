import { Sparkles } from "lucide-react";
import { tokens } from "./tokens";

export function OfferButton({
  active, disabled, onPress,
}: { active: boolean; disabled: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onPress}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        border: `1.5px solid ${active ? "#F5B400" : tokens.border}`,
        background: active ? "#FFF8E1" : tokens.white,
        color: active ? "#8A6500" : tokens.mid,
        fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, fontFamily: "inherit",
      }}
    >
      <Sparkles size={13} />
      {active ? "Offer active" : "Add offer"}
    </button>
  );
}

export function CourseToggle({
  value, onChange,
}: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: value ? tokens.blue : tokens.disabled,
        position: "relative", cursor: "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute", top: 3, left: value ? 21 : 3,
          width: 18, height: 18, borderRadius: 9,
          background: tokens.white, boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}
