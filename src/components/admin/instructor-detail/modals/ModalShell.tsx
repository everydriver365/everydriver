import React from "react";

export function ModalShell({
  title,
  onClose,
  onSave,
  children,
  saveLabel = "Save",
  saveDisabled,
}: {
  title: string;
  onClose: () => void;
  onSave?: () => void;
  children: React.ReactNode;
  saveLabel?: string;
  saveDisabled?: boolean;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, padding: 22, width: 400,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0A0E27", marginBottom: 16 }}>{title}</div>
        {children}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px", borderRadius: 6, border: "1px solid #E5E7EB",
              background: "#F3F4F6", color: "#6B7280", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          {onSave && (
            <button
              onClick={onSave}
              disabled={saveDisabled}
              style={{
                padding: "8px 14px", borderRadius: 6, border: "none",
                background: saveDisabled ? "#9CA3AF" : "#0070C0", color: "#fff",
                fontSize: 11, fontWeight: 600, cursor: saveDisabled ? "not-allowed" : "pointer",
              }}
            >
              {saveLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalField({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export const modalInputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 11px", border: "1px solid #E5E7EB",
  borderRadius: 6, fontSize: 12, color: "#0A0E27", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};
