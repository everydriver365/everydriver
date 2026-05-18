import { t } from "./tokens";

type TabId = "vehicle" | "qualifications" | "social" | "cpd";

const TABS: { id: TabId; label: string }[] = [
  { id: "vehicle", label: "Vehicle" },
  { id: "qualifications", label: "Qualifications" },
  { id: "social", label: "Social" },
  { id: "cpd", label: "CPD" },
];

export function ProfileTabBar({
  activeTab, onSelect,
}: { activeTab: TabId; onSelect: (id: TabId) => void }) {
  return (
    <div style={{
      display: "flex", gap: 2, backgroundColor: t.white, borderRadius: 12,
      border: `1px solid ${t.border}`, padding: 4, marginBottom: 16,
      boxShadow: "0 1px 4px rgba(15,32,68,0.04)",
    }}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            style={{
              flex: 1, padding: "9px 8px", borderRadius: 9, border: "none",
              fontSize: 13, fontWeight: active ? 600 : 500,
              color: active ? t.white : t.muted,
              backgroundColor: active ? t.navy : "transparent",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export type { TabId };
