import { useSettingsDirty } from "./SettingsDirtyContext";

export function SettingsSaveBar() {
  const { dirty, saving, saveAll, resetAll } = useSettingsDirty();
  if (!dirty) return null;
  return (
    <div
      className="fixed z-40 bottom-4 right-4 sm:right-6 flex items-center gap-3 sv2-card"
      style={{ padding: "10px 14px", boxShadow: "none" }}
    >
      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
        Unsaved changes
      </span>
      <button type="button" className="sv2-btn" onClick={resetAll} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="sv2-btn primary" onClick={() => void saveAll()} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
