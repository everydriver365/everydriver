import { useState } from "react";
import { SectionCard, Section } from "./SectionCard";
import { AddSectionModal } from "./modals/AddRowModal";

export function SectionColumn({
  sections, onChange,
}: { sections: Section[]; onChange: (next: Section[]) => void }) {
  const [adding, setAdding] = useState(false);

  return (
    <div>
      {sections.map((s) => (
        <SectionCard
          key={s.id}
          section={s}
          onChange={(next) => onChange(sections.map((x) => (x.id === s.id ? next : x)))}
          onRemove={() => {
            if (confirm(`Remove section "${s.title}"?`)) {
              onChange(sections.filter((x) => x.id !== s.id));
            }
          }}
        />
      ))}
      <button
        onClick={() => setAdding(true)}
        style={{
          width: "100%",
          border: "2px dashed #E5E7EB",
          borderRadius: 10,
          color: "#9CA3AF",
          background: "transparent",
          padding: "14px",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#0070C0";
          e.currentTarget.style.color = "#0070C0";
          e.currentTarget.style.background = "#F8FAFF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E5E7EB";
          e.currentTarget.style.color = "#9CA3AF";
          e.currentTarget.style.background = "transparent";
        }}
      >
        + Add section
      </button>
      {adding && (
        <AddSectionModal
          onClose={() => setAdding(false)}
          onSave={(name, icon) => {
            onChange([...sections, { id: crypto.randomUUID(), title: name, icon, rows: [] }]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
