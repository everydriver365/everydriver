import { tokens, type CourseType } from "./tokens";

export function HoursBadge({ hours, disabled }: { hours: number | null; disabled?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px",
        borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
        background: disabled ? tokens.surface : tokens.blueLight,
        color: disabled ? tokens.muted : tokens.blue,
      }}
    >
      {hours ? `${hours}h` : "—"}
    </span>
  );
}

export function TransmissionBadge({ type }: { type: "manual" | "automatic" | null }) {
  if (!type) return null;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px",
        borderRadius: 6, fontSize: 11, fontWeight: 600,
        background: tokens.surface, color: tokens.mid,
      }}
    >
      {type === "automatic" ? "Automatic" : "Manual"}
    </span>
  );
}

export function TypeBadge({ type }: { type: CourseType }) {
  if (type === "weekly") return null;
  const label = type === "intensive" ? "Intensive" : "Semi-intensive";
  const intensive = type === "intensive";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px",
        borderRadius: 6, fontSize: 11, fontWeight: 600,
        background: intensive ? tokens.redLight : tokens.blueLight,
        color: intensive ? tokens.red : tokens.blue,
      }}
    >
      {label}
    </span>
  );
}
