import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Window = { start: string; end: string };
export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type DayCfg = { enabled: boolean; windows: Window[] };
export type WeeklyHours = Record<DayKey, DayCfg>;
export type Category = "holiday" | "training" | "bank-holiday" | "personal" | "sick" | "other";
export type TimeOff = {
  id: string;
  title: string;
  category: Category;
  start: string;
  end: string;
  auto?: boolean;
  recurring?: { freq: "yearly" };
  notes?: string;
};
export type BookingRules = {
  travelBufferMin: number;
  minLeadHours: number;
  horizonWeeks: number;
  slotIncrementMin: number;
  allowSameDay: boolean;
  autoBlockBankHolidays: boolean;
  availableFrom: string | null; // ISO date (yyyy-MM-dd) or null
};

const DAY_KEYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// DB stores ISO day-of-week: 1=Mon..7=Sun
export const dayKeyToDow = (k: DayKey) => DAY_KEYS.indexOf(k) + 1;
export const dowToDayKey = (n: number): DayKey => DAY_KEYS[(n - 1 + 7) % 7];

const emptyWeekly = (): WeeklyHours =>
  DAY_KEYS.reduce((acc, d) => ({ ...acc, [d]: { enabled: false, windows: [] } }), {} as WeeklyHours);

export const DEFAULT_RULES: BookingRules = {
  travelBufferMin: 15,
  minLeadHours: 24,
  horizonWeeks: 8,
  slotIncrementMin: 30,
  allowSameDay: false,
  autoBlockBankHolidays: true,
  availableFrom: null,
};

/**
 * Effective buffer between two adjacent lessons.
 * If either lesson's pupil has a `travel_time_minutes` override, take the larger
 * of (override, default) so neither pupil's travel requirement is violated.
 */
export function effectiveBufferMinutes(
  defaultBuffer: number,
  a?: { travel_time_minutes?: number | null } | null,
  b?: { travel_time_minutes?: number | null } | null,
): number {
  const av = a?.travel_time_minutes ?? defaultBuffer;
  const bv = b?.travel_time_minutes ?? defaultBuffer;
  return Math.max(av, bv);
}

export function useAvailabilityData(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["availability-page", instructorId],
    enabled: !!instructorId,
    queryFn: async () => {
      const [winRes, ruleRes, instRes] = await Promise.all([
        supabase
          .from("availability_windows")
          .select("id, day_of_week, start_time, end_time, is_active")
          .eq("instructor_id", instructorId!)
          .order("day_of_week")
          .order("start_time"),
        supabase
          .from("availability_rules")
          .select("id, start_date, end_date, title, category, notes, is_recurring, is_auto")
          .eq("instructor_id", instructorId!)
          .eq("rule_type", "holiday_block"),
        supabase
          .from("instructors")
          .select(
            "buffer_minutes, booking_advance_days, min_lead_hours, slot_increment_minutes, allow_same_day_booking, auto_block_bank_holidays, available_from"
          )
          .eq("id", instructorId!)
          .maybeSingle(),
      ]);

      if (winRes.error) throw winRes.error;
      if (ruleRes.error) throw ruleRes.error;
      if (instRes.error) throw instRes.error;

      const weekly = emptyWeekly();
      (winRes.data || []).forEach((row: any) => {
        if (!row.is_active) return;
        const k = dowToDayKey(row.day_of_week);
        weekly[k].enabled = true;
        weekly[k].windows.push({
          start: String(row.start_time).slice(0, 5),
          end: String(row.end_time).slice(0, 5),
        });
      });

      const timeOff: TimeOff[] = (ruleRes.data || []).map((r: any) => ({
        id: r.id,
        title: r.title || "Time off",
        category: (r.category || "other") as Category,
        start: r.start_date,
        end: r.end_date,
        auto: !!r.is_auto,
        notes: r.notes || undefined,
        recurring: r.is_recurring ? { freq: "yearly" as const } : undefined,
      }));

      const inst: any = instRes.data || {};
      const rules: BookingRules = {
        travelBufferMin: inst.buffer_minutes ?? DEFAULT_RULES.travelBufferMin,
        minLeadHours: inst.min_lead_hours ?? DEFAULT_RULES.minLeadHours,
        horizonWeeks: inst.booking_advance_days
          ? Math.max(1, Math.round(inst.booking_advance_days / 7))
          : DEFAULT_RULES.horizonWeeks,
        slotIncrementMin: inst.slot_increment_minutes ?? DEFAULT_RULES.slotIncrementMin,
        allowSameDay: inst.allow_same_day_booking ?? DEFAULT_RULES.allowSameDay,
        autoBlockBankHolidays: inst.auto_block_bank_holidays ?? DEFAULT_RULES.autoBlockBankHolidays,
        availableFrom: inst.available_from ?? null,
      };

      return { weekly, timeOff, rules };
    },
  });
}

// ---- Save helpers ----

export async function saveWeeklyDay(
  instructorId: string,
  day: DayKey,
  cfg: DayCfg
) {
  const dow = dayKeyToDow(day);
  // Replace all rows for this day
  const del = await supabase
    .from("availability_windows")
    .delete()
    .eq("instructor_id", instructorId)
    .eq("day_of_week", dow);
  if (del.error) throw del.error;

  if (cfg.enabled && cfg.windows.length > 0) {
    const rows = cfg.windows.map((w) => ({
      instructor_id: instructorId,
      day_of_week: dow,
      start_time: w.start.length === 5 ? `${w.start}:00` : w.start,
      end_time: w.end.length === 5 ? `${w.end}:00` : w.end,
      is_active: true,
    }));
    const ins = await supabase.from("availability_windows").insert(rows);
    if (ins.error) throw ins.error;
  }

  // Mirror to instructor_working_hours so both tables stay in sync.
  try {
    const { mirrorAwToIwh } = await import("@/lib/syncWeeklyHours");
    await mirrorAwToIwh(instructorId);
  } catch (e) {
    console.error("saveWeeklyDay: mirror failed", e);
  }
}

export async function insertTimeOff(
  instructorId: string,
  t: Omit<TimeOff, "id">
): Promise<TimeOff> {
  const { data, error } = await supabase
    .from("availability_rules")
    .insert({
      instructor_id: instructorId,
      rule_type: "holiday_block",
      is_available: false,
      title: t.title,
      category: t.category,
      notes: t.notes ?? null,
      start_date: t.start,
      end_date: t.end,
      is_recurring: !!t.recurring,
      is_auto: !!t.auto,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { ...t, id: data.id };
}

export async function updateTimeOffRow(id: string, patch: Partial<TimeOff>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes;
  if (patch.start !== undefined) dbPatch.start_date = patch.start;
  if (patch.end !== undefined) dbPatch.end_date = patch.end;
  if (patch.recurring !== undefined) dbPatch.is_recurring = !!patch.recurring;
  if (patch.auto !== undefined) dbPatch.is_auto = !!patch.auto;
  const { error } = await supabase.from("availability_rules").update(dbPatch).eq("id", id);
  if (error) throw error;
}

export async function deleteTimeOffRow(id: string) {
  const { error } = await supabase.from("availability_rules").delete().eq("id", id);
  if (error) throw error;
}

export async function saveBookingRules(instructorId: string, r: BookingRules) {
  const { error } = await supabase
    .from("instructors")
    .update({
      buffer_minutes: r.travelBufferMin,
      booking_advance_days: r.horizonWeeks * 7,
      min_lead_hours: r.minLeadHours,
      slot_increment_minutes: r.slotIncrementMin,
      allow_same_day_booking: r.allowSameDay,
      auto_block_bank_holidays: r.autoBlockBankHolidays,
      available_from: r.availableFrom,
    } as any)
    .eq("id", instructorId);
  if (error) throw error;
}
