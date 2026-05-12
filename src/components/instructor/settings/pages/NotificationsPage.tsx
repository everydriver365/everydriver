import { useEffect } from "react";
import { useInstructorNotificationSettings, type CategoryKey, type DeliveryCadence, type MessageSoundChoice } from "@/hooks/useInstructorNotificationSettings";
import { playNotificationSound } from "@/hooks/useMessageSound";
import { useSettingsDirty } from "../SettingsDirtyContext";
import { useState } from "react";

const CADENCE_OPTIONS: { value: DeliveryCadence; label: string }[] = [
  { value: "real_time",      label: "Real time" },
  { value: "hourly",         label: "Hourly digest" },
  { value: "daily",          label: "Daily digest" },
  { value: "important_only", label: "Important only" },
];

const CATEGORIES: { key: CategoryKey; label: string; meta: string }[] = [
  { key: "test_swap", label: "Test swap matches",     meta: "When a swap matches your saved filters" },
  { key: "message",   label: "Pupil messages",        meta: "New messages from pupils" },
  { key: "job",       label: "Job offers",            meta: "Lessons sent to you for acceptance" },
  { key: "system",    label: "System & account",      meta: "Account changes, billing and outages" },
];

export function NotificationsPage({ instructorId }: { instructorId: string }) {
  const { settings, loading, update } = useInstructorNotificationSettings(instructorId);
  const { register, setDirty } = useSettingsDirty();

  const [draft, setDraft] = useState(settings);
  useEffect(() => { setDraft(settings); }, [settings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  useEffect(() => { setDirty("notifications", dirty); }, [dirty, setDirty]);

  useEffect(() => {
    register("notifications", {
      save: async () => { await update(draft); },
      reset: () => setDraft(settings),
    });
    return () => register("notifications", null);
  }, [draft, settings, register, update]);

  if (loading) return <div className="sv2-card" style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading…</div>;

  return (
    <>
      <section className="sv2-card">
        <div style={{ marginBottom: 12 }}>
          <div className="sv2-section-title">Delivery</div>
          <div className="sv2-section-sub">How often you want to be interrupted.</div>
        </div>
        <div className="sv2-grid-2">
          <div>
            <label className="sv2-label">Cadence</label>
            <select
              className="sv2-select"
              value={draft.delivery_cadence}
              onChange={e => setDraft(p => ({ ...p, delivery_cadence: e.target.value as DeliveryCadence }))}
            >
              {CADENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="sv2-label">Quiet hours</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                className={`sv2-toggle ${draft.quiet_hours_enabled ? "on" : ""}`}
                role="switch"
                aria-checked={draft.quiet_hours_enabled}
                onClick={() => setDraft(p => ({ ...p, quiet_hours_enabled: !p.quiet_hours_enabled }))}
              />
              <input
                className="sv2-input"
                type="time"
                value={draft.quiet_hours_start}
                disabled={!draft.quiet_hours_enabled}
                onChange={e => setDraft(p => ({ ...p, quiet_hours_start: e.target.value }))}
                style={{ width: 110 }}
              />
              <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>to</span>
              <input
                className="sv2-input"
                type="time"
                value={draft.quiet_hours_end}
                disabled={!draft.quiet_hours_enabled}
                onChange={e => setDraft(p => ({ ...p, quiet_hours_end: e.target.value }))}
                style={{ width: 110 }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sv2-card">
        <div style={{ marginBottom: 4 }}>
          <div className="sv2-section-title">Categories</div>
          <div className="sv2-section-sub">Mute the things you don't need.</div>
        </div>
        <div>
          {CATEGORIES.map(cat => {
            const muted = !!draft.category_mutes[cat.key];
            return (
              <div className="sv2-row" key={cat.key}>
                <span className="flex-1 min-w-0">
                  <span className="sv2-row-name block">{cat.label}</span>
                  <span className="sv2-row-meta block">{cat.meta}</span>
                </span>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{muted ? "Muted" : "On"}</span>
                <span
                  className={`sv2-toggle ${!muted ? "on" : ""}`}
                  role="switch"
                  aria-checked={!muted}
                  onClick={() => setDraft(p => ({
                    ...p,
                    category_mutes: { ...p.category_mutes, [cat.key]: !muted ? true : false },
                  }))}
                />
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
