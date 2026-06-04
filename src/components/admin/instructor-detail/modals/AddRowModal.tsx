import { useState } from "react";
import { ModalShell, ModalField, modalInputStyle } from "./ModalShell";

export function AddRowModal({
  onClose, onSave,
}: { onClose: () => void; onSave: (label: string, value: string) => void }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  return (
    <ModalShell
      title="Add row"
      onClose={onClose}
      onSave={() => onSave(label.trim(), value.trim())}
      saveDisabled={!label.trim()}
    >
      <ModalField label="Label">
        <input style={modalInputStyle} value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
      </ModalField>
      <ModalField label="Value">
        <input style={modalInputStyle} value={value} onChange={(e) => setValue(e.target.value)} />
      </ModalField>
    </ModalShell>
  );
}

export function EditRowModal({
  initialLabel, initialValue, fieldType, lockLabel, onClose, onSave,
}: {
  initialLabel: string;
  initialValue: string;
  fieldType?: "text" | "textarea" | "number" | "money" | "date" | "bool" | "csv";
  lockLabel?: boolean;
  onClose: () => void;
  onSave: (label: string, value: string) => void | Promise<void>;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [value, setValue] = useState(initialValue === "—" ? "" : initialValue);
  const [saving, setSaving] = useState(false);

  const inputEl = (() => {
    if (fieldType === "textarea") {
      return (
        <textarea
          style={{ ...modalInputStyle, minHeight: 80, fontFamily: "inherit" }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
      );
    }
    if (fieldType === "bool") {
      return (
        <select style={modalInputStyle} value={value} onChange={(e) => setValue(e.target.value)} autoFocus>
          <option value="">—</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }
    const inputType =
      fieldType === "date" ? "date" :
      fieldType === "number" || fieldType === "money" ? "number" :
      "text";
    // Strip non-numeric prefix for money so the date/number input is valid
    const cleaned = fieldType === "money" ? value.replace(/[^\d.\-]/g, "") : value;
    return (
      <input
        type={inputType}
        step={fieldType === "money" ? "0.01" : undefined}
        style={modalInputStyle}
        value={cleaned}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
    );
  })();

  return (
    <ModalShell
      title="Edit row"
      onClose={onClose}
      onSave={async () => {
        setSaving(true);
        try {
          await onSave(label.trim(), value.trim());
        } finally {
          setSaving(false);
        }
      }}
      saveDisabled={!label.trim() || saving}
    >
      <ModalField label="Label">
        <input
          style={{ ...modalInputStyle, opacity: lockLabel ? 0.6 : 1 }}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={lockLabel}
        />
      </ModalField>
      <ModalField label="Value">{inputEl}</ModalField>
    </ModalShell>
  );
}


export function AddSectionModal({
  onClose, onSave,
}: { onClose: () => void; onSave: (name: string, icon: string) => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  return (
    <ModalShell
      title="Add section"
      onClose={onClose}
      onSave={() => onSave(name.trim(), icon.trim().slice(0, 2))}
      saveDisabled={!name.trim()}
    >
      <ModalField label="Section name">
        <input style={modalInputStyle} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </ModalField>
      <ModalField label="Icon (optional, max 2 chars)">
        <input style={modalInputStyle} value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} />
      </ModalField>
    </ModalShell>
  );
}
