import { useState } from "react";
import { Badge, BadgeTone } from "./Badge";
import { EditRowModal, AddRowModal } from "./modals/AddRowModal";

export interface SectionRow {
  id: string;
  label: string;
  value: string;
  badge?: { tone: BadgeTone; text: string };
}

export interface Section {
  id: string;
  title: string;
  icon?: string;
  headerBadge?: string;
  rows: SectionRow[];
}

export function SectionCard({
  section, onChange, onRemove,
}: {
  section: Section;
  onChange: (next: Section) => void;
  onRemove: () => void;
}) {
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<SectionRow | null>(null);
  const [addingRow, setAddingRow] = useState(false);

  const removeRow = (id: string) => {
    if (!confirm("Remove this row?")) return;
    onChange({ ...section, rows: section.rows.filter((r) => r.id !== id) });
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #E5E7EB",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0A2B6B",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700 }}>
          {section.icon && <span>{section.icon}</span>}
          <span>{section.title}</span>
          {section.headerBadge && (
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "2px 7px", borderRadius: 20, fontSize: 9, fontWeight: 600,
              }}
            >
              {section.headerBadge}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setAddingRow(true)}
            style={ghostBtn}
            title="Add row"
          >
            + Row
          </button>
          <button onClick={onRemove} style={ghostBtn} title="Remove section">✕</button>
        </div>
      </div>

      {/* Rows */}
      {section.rows.length === 0 && (
        <div style={{ padding: "10px 12px", fontSize: 10, color: "#9CA3AF" }}>No data</div>
      )}
      {section.rows.map((row) => (
        <div
          key={row.id}
          onMouseEnter={() => setHoverRow(row.id)}
          onMouseLeave={() => setHoverRow(null)}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "7px 12px",
            borderBottom: "1px solid #F3F4F6",
            position: "relative",
          }}
        >
          <div style={{ width: 110, fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{row.label}</div>
          <div
            style={{
              flex: 1, fontSize: 11, color: "#0A0E27", fontWeight: 500,
              paddingRight: 50, display: "flex", alignItems: "center", gap: 6,
              wordBreak: "break-word",
            }}
          >
            <span>{row.value || "—"}</span>
            {row.badge && <Badge tone={row.badge.tone}>{row.badge.text}</Badge>}
          </div>
          {hoverRow === row.id && (
            <div style={{ position: "absolute", right: 8, display: "flex", gap: 4 }}>
              <button onClick={() => setEditingRow(row)} style={iconBtn} title="Edit">✏</button>
              <button onClick={() => removeRow(row.id)} style={iconBtn} title="Remove">✕</button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => setAddingRow(true)}
        style={{
          width: "100%", background: "#F8FAFF", color: "#0070C0",
          fontSize: 10, fontWeight: 600, padding: "7px 12px",
          border: "none", borderTop: "1px solid #F3F4F6",
          textAlign: "left", cursor: "pointer",
        }}
      >
        + Add row
      </button>

      {editingRow && (
        <EditRowModal
          initialLabel={editingRow.label}
          initialValue={editingRow.value}
          onClose={() => setEditingRow(null)}
          onSave={(label, value) => {
            onChange({
              ...section,
              rows: section.rows.map((r) => (r.id === editingRow.id ? { ...r, label, value } : r)),
            });
            setEditingRow(null);
          }}
        />
      )}
      {addingRow && (
        <AddRowModal
          onClose={() => setAddingRow(false)}
          onSave={(label, value) => {
            onChange({
              ...section,
              rows: [...section.rows, { id: crypto.randomUUID(), label, value }],
            });
            setAddingRow(false);
          }}
        />
      )}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 4, padding: "2px 7px", fontSize: 9, fontWeight: 600, cursor: "pointer",
};
const iconBtn: React.CSSProperties = {
  background: "#fff", border: "1px solid #E5E7EB", borderRadius: 4,
  padding: "2px 6px", fontSize: 10, cursor: "pointer", color: "#6B7280",
};
