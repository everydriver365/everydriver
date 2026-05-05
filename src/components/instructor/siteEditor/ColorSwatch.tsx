import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

const PRESETS = [
  "#E24B4A", "#378ADD", "#4F46E5", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#0F172A", "#64748B", "#0EA5E9", "#22C55E",
];

export function ColorSwatch({ label, value, onChange }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 w-full"
          style={{
            padding: 8, border: "0.5px solid var(--d2-border)", borderRadius: 8,
            background: "var(--d2-surface)",
          }}
        >
          <span
            style={{
              width: 18, height: 18, borderRadius: 4,
              background: value, border: "0.5px solid rgba(0,0,0,0.08)",
            }}
          />
          <div className="flex flex-col items-start min-w-0">
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--d2-text-1)" }}>{label}</span>
            <span className="d2-mono" style={{ fontSize: 10, color: "var(--d2-text-3)" }}>{value.toUpperCase()}</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="grid grid-cols-6 gap-1.5">
          {PRESETS.map(c => (
            <button
              key={c}
              onClick={() => onChange(c)}
              style={{
                width: 24, height: 24, borderRadius: 6, background: c,
                border: c.toLowerCase() === value.toLowerCase() ? "2px solid var(--d2-indigo)" : "0.5px solid rgba(0,0,0,0.1)",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: 28, height: 28, border: "none", background: "transparent", padding: 0 }}
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="d2-mono"
            style={{
              flex: 1, height: 28, padding: "0 8px", fontSize: 11,
              border: "0.5px solid var(--d2-border)", borderRadius: 6, outline: "none",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
