import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DeliveryCadence = "real_time" | "hourly" | "daily" | "important_only";

export interface NotificationRules {
  test_horizon_enabled?: boolean;
  test_horizon_weeks?: number;
  test_distance_enabled?: boolean;
  test_distance_miles?: number;
  job_min_value_enabled?: boolean;
  job_min_value_pounds?: number;
  dedupe_repeat_sender?: boolean;
}

export type CategoryKey = "test_swap" | "message" | "job" | "system";

export interface DailySummaryInclude {
  tomorrow_lessons: boolean;
  payments_due: boolean;
  pupil_messages: boolean;
  job_offers: boolean;
  test_swaps: boolean;
}

export interface NotificationSettings {
  delivery_cadence: DeliveryCadence;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string;   // "07:00"
  category_mutes: Partial<Record<CategoryKey, boolean>>;
  notification_rules: NotificationRules;
  end_of_lesson_enabled: boolean;
  end_of_lesson_lead_minutes: number;
  daily_summary_enabled: boolean;
  daily_summary_time: string; // "07:00"
  daily_summary_include: DailySummaryInclude;
}

const DEFAULT_INCLUDE: DailySummaryInclude = {
  tomorrow_lessons: true,
  payments_due: true,
  pupil_messages: true,
  job_offers: true,
  test_swaps: true,
};

const DEFAULTS: NotificationSettings = {
  delivery_cadence: "real_time",
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  category_mutes: {},
  notification_rules: {
    test_horizon_enabled: false,
    test_horizon_weeks: 6,
    test_distance_enabled: false,
    test_distance_miles: 25,
    job_min_value_enabled: false,
    job_min_value_pounds: 0,
    dedupe_repeat_sender: true,
  },
  end_of_lesson_enabled: true,
  end_of_lesson_lead_minutes: 0,
  daily_summary_enabled: true,
  daily_summary_time: "07:00",
  daily_summary_include: DEFAULT_INCLUDE,
};

export function useInstructorNotificationSettings(instructorId: string | undefined) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!instructorId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("instructor_notification_settings" as never)
      .select("*")
      .eq("instructor_id", instructorId)
      .maybeSingle();
    if (!error && data) {
      const row = data as Record<string, unknown>;
      setSettings({
        delivery_cadence: (row.delivery_cadence as DeliveryCadence) ?? DEFAULTS.delivery_cadence,
        quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
        quiet_hours_start: ((row.quiet_hours_start as string) ?? DEFAULTS.quiet_hours_start).slice(0, 5),
        quiet_hours_end: ((row.quiet_hours_end as string) ?? DEFAULTS.quiet_hours_end).slice(0, 5),
        category_mutes: (row.category_mutes as Partial<Record<CategoryKey, boolean>>) ?? {},
        notification_rules: { ...DEFAULTS.notification_rules, ...(row.notification_rules as NotificationRules ?? {}) },
      });
    }
    setLoading(false);
  }, [instructorId]);

  useEffect(() => { void load(); }, [load]);

  const update = useCallback(
    async (patch: Partial<NotificationSettings>) => {
      if (!instructorId) return;
      setSaving(true);
      const next = { ...settings, ...patch };
      setSettings(next);
      const { error } = await supabase
        .from("instructor_notification_settings" as never)
        .upsert(
          {
            instructor_id: instructorId,
            delivery_cadence: next.delivery_cadence,
            quiet_hours_enabled: next.quiet_hours_enabled,
            quiet_hours_start: next.quiet_hours_start,
            quiet_hours_end: next.quiet_hours_end,
            category_mutes: next.category_mutes,
            notification_rules: next.notification_rules,
          } as never,
          { onConflict: "instructor_id" },
        );
      if (error) console.error("Failed to save notification settings", error);
      setSaving(false);
    },
    [instructorId, settings],
  );

  return { settings, loading, saving, update, refetch: load };
}
