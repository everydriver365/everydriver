import { useState } from "react";
import { ModalShell, ModalField, modalInputStyle } from "./ModalShell";

export interface EditProfileValues {
  name: string;
  email: string;
  phone: string;
  adi_badge_number: string;
  is_active: boolean;
  instructor_grade: string;
}

export function EditProfileModal({
  initial, onClose, onSave,
}: { initial: EditProfileValues; onClose: () => void; onSave: (v: EditProfileValues) => Promise<void> | void }) {
  const [v, setV] = useState<EditProfileValues>(initial);
  const [saving, setSaving] = useState(false);
  const update = (k: keyof EditProfileValues, val: any) => setV((p) => ({ ...p, [k]: val }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(v); } finally { setSaving(false); }
  };

  return (
    <ModalShell title="Edit profile" onClose={onClose} onSave={handleSave} saveDisabled={saving || !v.name.trim()}>
      <ModalField label="Full name">
        <input style={modalInputStyle} value={v.name} onChange={(e) => update("name", e.target.value)} />
      </ModalField>
      <ModalField label="Email">
        <input style={modalInputStyle} type="email" value={v.email} onChange={(e) => update("email", e.target.value)} />
      </ModalField>
      <ModalField label="Phone">
        <input style={modalInputStyle} value={v.phone} onChange={(e) => update("phone", e.target.value)} />
      </ModalField>
      <ModalField label="ADI badge number">
        <input style={modalInputStyle} value={v.adi_badge_number} onChange={(e) => update("adi_badge_number", e.target.value)} />
      </ModalField>
      <ModalField label="Status">
        <select style={modalInputStyle} value={v.is_active ? "active" : "suspended"} onChange={(e) => update("is_active", e.target.value === "active")}>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </ModalField>
      <ModalField label="Grade / Tier">
        <select style={modalInputStyle} value={v.instructor_grade ?? ""} onChange={(e) => update("instructor_grade", e.target.value)}>
          <option value="">—</option>
          <option value="Grade A">Grade A</option>
          <option value="Grade B">Grade B</option>
          <option value="Trainee">Trainee</option>
        </select>
      </ModalField>
    </ModalShell>
  );
}
