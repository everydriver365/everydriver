import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  name: string;
  meta?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function QuickToggleRow({ icon, name, meta, checked, onChange, disabled }: Props) {
  return (
    <div className="sv2-row" style={{ opacity: disabled ? 0.55 : 1 }}>
      <span className="sv2-row-icon">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="sv2-row-name block">{name}</span>
        {meta && <span className="sv2-row-meta block">{meta}</span>}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        onClick={() => { if (!disabled) onChange(!checked); }}
        className={`sv2-toggle ${checked ? "on" : ""}`}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      />
    </div>
  );
}
