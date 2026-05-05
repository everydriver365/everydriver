import { ReactNode, useState } from "react";
import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  status?: ReactNode;
  children: ReactNode;
  open?: boolean;
  onToggle?: () => void;
}

export function EditorSection({ title, defaultOpen, status, children, open: controlledOpen, onToggle }: Props) {
  const [uncontrolled, setUncontrolled] = useState(!!defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolled;

  return (
    <div style={{ borderBottom: "0.5px solid var(--d2-border)" }}>
      <button
        onClick={() => (isControlled ? onToggle?.() : setUncontrolled(o => !o))}
        className="flex items-center w-full text-left transition-colors"
        style={{ padding: "10px 0", gap: 8 }}
      >
        <ChevronRight
          size={12}
          style={{
            color: "var(--d2-text-3)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 150ms ease-out",
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--d2-text-1)", flex: 1 }}>{title}</span>
        {status}
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  );
}

export function SavedPill() {
  return (
    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "#ECFDF5", color: "#047857", fontWeight: 500 }}>
      Saved
    </span>
  );
}

export function CountPill({ n }: { n: number }) {
  return (
    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "#F1F5F9", color: "#64748B", fontWeight: 500 }}>
      {n} item{n === 1 ? "" : "s"}
    </span>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, color: "var(--d2-text-3)", textTransform: "uppercase", marginBottom: 5 }}>
      {children}
    </div>
  );
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%", height: 30, padding: "0 10px",
        border: "0.5px solid var(--d2-border)", borderRadius: 8,
        background: "var(--d2-surface)", color: "var(--d2-text-1)",
        fontSize: 12, outline: "none",
        ...props.style,
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 2px var(--d2-indigo), 0 0 0 3px var(--d2-surface)"; props.onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; props.onBlur?.(e); }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%", padding: "8px 10px", minHeight: 64,
        border: "0.5px solid var(--d2-border)", borderRadius: 8,
        background: "var(--d2-surface)", color: "var(--d2-text-1)",
        fontSize: 12, outline: "none", resize: "vertical",
        ...props.style,
      }}
    />
  );
}
