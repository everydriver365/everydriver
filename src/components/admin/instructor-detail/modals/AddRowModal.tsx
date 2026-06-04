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
  initialLabel, initialValue, onClose, onSave,
}: { initialLabel: string; initialValue: string; onClose: () => void; onSave: (label: string, value: string) => void }) {
  const [label, setLabel] = useState(initialLabel);
  const [value, setValue] = useState(initialValue);
  return (
    <ModalShell
      title="Edit row"
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
