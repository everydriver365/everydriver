import { Switch } from "@/components/ui/switch";

interface Props {
  greeting: string;
  name: string;
  subtitle: string;
  isActive: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}

export function GreetingBlock({ greeting, name, subtitle, isActive, onToggle, disabled }: Props) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
      <div>
        <h1
          style={{
            fontSize: 22, fontWeight: 500,
            color: "var(--d2-text-1)",
            letterSpacing: "-0.4px",
            margin: 0,
          }}
        >
          {greeting}, {name}
        </h1>
        <p style={{ fontSize: 13, color: "var(--d2-text-2)", margin: "4px 0 0" }}>
          {subtitle}
        </p>
      </div>
      <div
        className="flex items-center gap-2"
        style={{
          padding: "4px 10px 4px 12px",
          borderRadius: 999,
          background: isActive ? "var(--d2-emerald-bg)" : "var(--d2-surface-soft)",
          border: "0.5px solid var(--d2-border)",
        }}
      >
        <span
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isActive ? "#10B981" : "var(--d2-text-3)",
          }}
        />
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: isActive ? "var(--d2-emerald-fg)" : "var(--d2-text-2)",
        }}>
          {isActive ? "Online" : "Offline"}
        </span>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="data-[state=checked]:bg-emerald-500 scale-75"
        />
      </div>
    </div>
  );
}
