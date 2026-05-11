import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureToggles {
  ai_day_briefing_enabled: boolean;
  auto_rebook_nudges_enabled: boolean;
  test_day_mode_enabled: boolean;
  waitlist_auto_offer_enabled: boolean;
  fuel_cost_tracker_enabled: boolean;
  tax_pot_suggest_enabled: boolean;
  harsh_event_heatmap_enabled: boolean;
  weekly_pnl_widget_enabled: boolean;
  badges_enabled: boolean;
}

export const FEATURE_TOGGLE_DEFAULTS: FeatureToggles = {
  ai_day_briefing_enabled: false,
  auto_rebook_nudges_enabled: false,
  test_day_mode_enabled: false,
  waitlist_auto_offer_enabled: false,
  fuel_cost_tracker_enabled: false,
  tax_pot_suggest_enabled: false,
  harsh_event_heatmap_enabled: false,
  weekly_pnl_widget_enabled: false,
  badges_enabled: false,
};

export function useInstructorFeatureToggles(instructorId: string | undefined) {
  const [toggles, setToggles] = useState<FeatureToggles>(FEATURE_TOGGLE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    const { data } = await supabase
      .from("instructor_feature_toggles" as never)
      .select("*")
      .eq("instructor_id", instructorId)
      .maybeSingle();
    if (data) {
      const r = data as Record<string, unknown>;
      setToggles({
        ai_day_briefing_enabled: Boolean(r.ai_day_briefing_enabled),
        auto_rebook_nudges_enabled: Boolean(r.auto_rebook_nudges_enabled),
        test_day_mode_enabled: Boolean(r.test_day_mode_enabled),
        waitlist_auto_offer_enabled: Boolean(r.waitlist_auto_offer_enabled),
        fuel_cost_tracker_enabled: Boolean(r.fuel_cost_tracker_enabled),
        tax_pot_suggest_enabled: Boolean(r.tax_pot_suggest_enabled),
        harsh_event_heatmap_enabled: Boolean(r.harsh_event_heatmap_enabled),
        weekly_pnl_widget_enabled: Boolean(r.weekly_pnl_widget_enabled),
        badges_enabled: Boolean(r.badges_enabled),
      });
    }
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { void load(); }, [load]);

  const update = useCallback(async (patch: Partial<FeatureToggles>) => {
    if (!instructorId) return;
    setSaving(true);
    const next = { ...toggles, ...patch };
    setToggles(next);
    const { error } = await supabase
      .from("instructor_feature_toggles" as never)
      .upsert({ instructor_id: instructorId, ...next } as never, { onConflict: "instructor_id" });
    if (error) console.error("Failed to save feature toggles", error);
    setSaving(false);
  }, [instructorId, toggles]);

  return { toggles, loading, saving, update, refetch: load };
}
