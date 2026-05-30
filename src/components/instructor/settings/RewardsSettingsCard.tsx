import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prefs {
  show_on_leaderboard: boolean;
  notify_tier_change: boolean;
  notify_badge_earned: boolean;
}

const DEFAULTS: Prefs = {
  show_on_leaderboard: true,
  notify_tier_change: true,
  notify_badge_earned: true,
};

/**
 * Rewards-specific preferences card. Writes to `instructors` table.
 * Drop-in for the Notifications settings page.
 */
export function RewardsSettingsCard({ instructorId }: { instructorId: string }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("show_on_leaderboard, notify_tier_change, notify_badge_earned")
        .eq("id", instructorId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPrefs({
          show_on_leaderboard: data.show_on_leaderboard ?? true,
          notify_tier_change: data.notify_tier_change ?? true,
          notify_badge_earned: data.notify_badge_earned ?? true,
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  async function toggle(key: keyof Prefs) {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setSaving(key);
    const { error } = await supabase
      .from("instructors")
      .update({ [key]: next })
      .eq("id", instructorId);
    setSaving(null);
    if (error) {
      setPrefs((p) => ({ ...p, [key]: !next }));
      toast.error("Could not save preference");
    }
  }

  const rows: { key: keyof Prefs; label: string; meta: string }[] = [
    { key: "show_on_leaderboard", label: "Show me on the leaderboard", meta: "Your name and rank are visible to other instructors" },
    { key: "notify_tier_change", label: "Notify on tier changes", meta: "Get a push when you move up or down a tier" },
    { key: "notify_badge_earned", label: "Notify on new badges", meta: "Get a push when you earn a badge" },
  ];

  return (
    <section className="sv2-card">
      <div style={{ marginBottom: 12 }}>
        <div className="sv2-section-title">DSM Pro Rewards</div>
        <div className="sv2-section-sub">Privacy and notification preferences for the rewards programme.</div>
      </div>
      {loading ? (
        <div style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => (
            <label key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{r.meta}</div>
              </div>
              <input
                type="checkbox"
                checked={prefs[r.key]}
                disabled={saving === r.key}
                onChange={() => toggle(r.key)}
                style={{ width: 36, height: 22 }}
              />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
