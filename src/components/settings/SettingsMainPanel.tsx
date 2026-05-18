import { useState } from "react";
import { SECTION_TITLES, SECTION_SUBTITLES } from "@/config/settingsTitles";
import { useSettingsStatus } from "@/hooks/useSettingsStatus";
import { AttentionBanner } from "./AttentionBanner";
import { SettingsSectionContent } from "./SettingsSectionContent";
import { toast } from "@/hooks/use-toast";

interface Props {
  section: string;
}

export function SettingsMainPanel({ section }: Props) {
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { completionFlags } = useSettingsStatus();

  const handleSave = async () => {
    setSaving(true);
    // Save handlers are wired per-section as content is migrated in.
    await new Promise(r => setTimeout(r, 350));
    setSaving(false);
    setIsDirty(false);
    toast({ title: "Settings saved" });
  };

  const showBanner =
    section === "profile" &&
    completionFlags != null &&
    (!completionFlags.vehicle || !completionFlags.hours);

  return (
    <main
      style={{
        flex: 1,
        backgroundColor: "#F2F4F8",
        padding: "32px 36px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 22,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24, fontWeight: 700, color: "#0F2044",
              letterSpacing: -0.5, marginBottom: 3, margin: 0,
            }}
          >
            {SECTION_TITLES[section] ?? "Settings"}
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: "#9CA3AF", margin: "3px 0 0" }}>
            {SECTION_SUBTITLES[section] ?? ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isDirty || saving}
          style={{
            backgroundColor: isDirty ? "#CC2229" : "#DDE3ED",
            border: "none", borderRadius: 8,
            padding: "10px 22px", fontSize: 13, fontWeight: 600,
            color: isDirty ? "#FFF" : "#9CA3AF",
            cursor: isDirty ? "pointer" : "default",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
            transition: "background 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {showBanner && <AttentionBanner completionFlags={completionFlags} />}

      <SettingsSectionContent section={section} onChange={() => setIsDirty(true)} />
    </main>
  );
}
