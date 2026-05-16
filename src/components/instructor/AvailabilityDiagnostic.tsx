import { useEffect, useState } from "react";
import { format, parseISO, addDays } from "date-fns";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Instructor-side diagnostic: runs the same checks the booking engine runs and
 * reports the FIRST reason pupils might not see any slots. Pure read-only.
 *
 * Checks (in order):
 *   1. available_from is in the future
 *   2. No working hours in either instructor_working_hours or availability_windows
 *   3. The two weekly-hours tables disagree (drift)
 *   4. Time-off blocks every day in the next 14 days
 *   5. All good
 */
type Status = "ok" | "warn" | "error";
type Result = { status: Status; title: string; detail: string };

export function AvailabilityDiagnostic({ instructorId }: { instructorId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const horizonStr = format(addDays(today, 14), "yyyy-MM-dd");

      const [instRes, iwhRes, awRes, blocksRes] = await Promise.all([
        supabase
          .from("instructors")
          .select("available_from")
          .eq("id", instructorId)
          .maybeSingle(),
        supabase
          .from("instructor_working_hours")
          .select("day_of_week, is_active")
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
        supabase
          .from("availability_windows")
          .select("day_of_week, is_active")
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
        supabase
          .from("availability_rules")
          .select("start_date, end_date")
          .eq("instructor_id", instructorId)
          .eq("rule_type", "holiday_block")
          .gte("end_date", todayStr)
          .lte("start_date", horizonStr),
      ]);

      if (cancelled) return;

      const availableFrom = (instRes.data?.available_from as string | null) ?? null;
      const iwhCount = iwhRes.data?.length ?? 0;
      const awCount = awRes.data?.length ?? 0;

      // 1. Future available_from
      if (availableFrom && parseISO(availableFrom) > today) {
        const days = Math.round(
          (parseISO(availableFrom).getTime() - today.setHours(0, 0, 0, 0)) / 86400000,
        );
        setResult({
          status: "warn",
          title: `Hidden until ${format(parseISO(availableFrom), "d MMM yyyy")}`,
          detail: `Pupils won't see any slots until ${format(parseISO(availableFrom), "d MMM yyyy")} (${days} day${days === 1 ? "" : "s"} away). This is fine if you're on a long break — clear the date above if you didn't mean to set it.`,
        });
        setLoading(false);
        return;
      }

      // 2. No working hours at all
      if (iwhCount === 0 && awCount === 0) {
        setResult({
          status: "error",
          title: "No working hours set",
          detail: "Add your weekly working hours above so pupils can book.",
        });
        setLoading(false);
        return;
      }

      // 3. Drift between the two tables
      if (iwhCount === 0 || awCount === 0) {
        setResult({
          status: "warn",
          title: "Working hours partially set",
          detail: "Some booking surfaces may not see your full availability. Re-save your weekly hours to sync everything.",
        });
        setLoading(false);
        return;
      }

      // 4. Every day in the next 14 covered by time-off
      const blocks = blocksRes.data ?? [];
      let blockedDays = 0;
      for (let i = 0; i < 14; i++) {
        const d = format(addDays(today, i), "yyyy-MM-dd");
        if (blocks.some((b: any) => d >= b.start_date && d <= b.end_date)) blockedDays++;
      }
      if (blockedDays >= 14) {
        setResult({
          status: "warn",
          title: "Fully blocked for 2 weeks",
          detail: "Your time-off covers the next 14 days. Remove a block to free up bookable dates.",
        });
        setLoading(false);
        return;
      }

      setResult({
        status: "ok",
        title: "You're visible to pupils",
        detail: `Working hours saved on both sides${blockedDays > 0 ? `, ${blockedDays} of the next 14 days blocked by time-off.` : "."}`,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  if (loading || !result) return null;

  const colors: Record<Status, { bg: string; fg: string; icon: JSX.Element }> = {
    ok: {
      bg: "rgba(34,197,94,0.08)",
      fg: "#15803D",
      icon: <CheckCircle2 size={16} color="#15803D" strokeWidth={2} />,
    },
    warn: {
      bg: "rgba(234,179,8,0.10)",
      fg: "#92400E",
      icon: <Info size={16} color="#92400E" strokeWidth={2} />,
    },
    error: {
      bg: "rgba(220,38,38,0.10)",
      fg: "#991B1B",
      icon: <AlertTriangle size={16} color="#991B1B" strokeWidth={2} />,
    },
  };
  const c = colors[result.status];

  return (
    <section className="sv2-card" aria-live="polite">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: c.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {c.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.fg }}>{result.title}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2, lineHeight: 1.45 }}>
            {result.detail}
          </div>
        </div>
      </div>
    </section>
  );
}
