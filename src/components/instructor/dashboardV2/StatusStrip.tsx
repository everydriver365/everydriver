import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const KEY = "dsm.dashboard.squareStrip.dismissed";

export function StatusStrip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(KEY) !== "1");
  }, []);

  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-2"
      style={{
        height: 32, padding: "0 12px",
        background: "var(--d2-emerald-bg)",
        color: "var(--d2-emerald-fg)",
        borderRadius: 8,
        border: "0.5px solid rgba(16,185,129,0.25)",
      }}
    >
      <CheckCircle2 size={14} />
      <span style={{ fontSize: 12, fontWeight: 500 }}>
        Square Connected — Auto-Payouts Active
      </span>
      <div className="flex-1" />
      <button
        onClick={() => { localStorage.setItem(KEY, "1"); setVisible(false); }}
        className="opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
