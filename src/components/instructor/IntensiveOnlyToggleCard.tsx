import { useEffect, useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mirrorAwToIwh } from "@/lib/syncWeeklyHours";
import { toast } from "sonner";

/**
 * "Intensive only" mode toggle.
 *
 * When enabled:
 *   - Flips `instructors.intensive_only = true`
 *   - Auto-upserts the 14 standard intensive cells
 *     (Mon–Sun × 08:00–12:00 and 13:00–17:00) into `availability_windows`
 *   - Mirrors to `instructor_working_hours` via `mirrorAwToIwh`
 *
 * When disabled:
 *   - Flips the flag back to false
 *   - Leaves existing windows untouched (instructor keeps their schedule)
 */

const SLOTS = [
  { start: "08:00:00", end: "12:00:00" },
  { start: "13:00:00", end: "17:00:00" },
];
const DOWS = [1, 2, 3, 4, 5, 6, 7];

interface Props {
  instructorId: string;
  onChanged?: () => void;
}

export function IntensiveOnlyToggleCard({ instructorId, onChanged }: Props) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("intensive_only")
        .eq("id", instructorId)
        .single();
      if (!alive) return;
      if (error) {
        console.error("IntensiveOnly: load failed", error);
        return;
      }
      setEnabled(Boolean((data as any)?.intensive_only));
    })();
    return () => {
      alive = false;
    };
  }, [instructorId]);

  const apply = async (next: boolean) => {
    setBusy(true);
    try {
      const { error: upErr } = await supabase
        .from("instructors")
        .update({ intensive_only: next } as any)
        .eq("id", instructorId);
      if (upErr) throw upErr;

      if (next) {
        // Load existing windows to avoid duplicate inserts
        const { data: existing, error: exErr } = await supabase
          .from("availability_windows")
          .select("day_of_week, start_time, end_time, is_active")
          .eq("instructor_id", instructorId);
        if (exErr) throw exErr;

        const has = (dow: number, start: string, end: string) =>
          (existing ?? []).some(
            (r: any) =>
              r.day_of_week === dow &&
              (r.start_time?.length === 5 ? `${r.start_time}:00` : r.start_time) === start &&
              (r.end_time?.length === 5 ? `${r.end_time}:00` : r.end_time) === end &&
              r.is_active,
          );

        const toInsert: any[] = [];
        for (const dow of DOWS) {
          for (const s of SLOTS) {
            if (!has(dow, s.start, s.end)) {
              toInsert.push({
                instructor_id: instructorId,
                day_of_week: dow,
                start_time: s.start,
                end_time: s.end,
                is_active: true,
              });
            }
          }
        }
        if (toInsert.length > 0) {
          const { error: insErr } = await supabase
            .from("availability_windows")
            .insert(toInsert);
          if (insErr) throw insErr;
        }
        await mirrorAwToIwh(instructorId);
      }

      setEnabled(next);
      onChanged?.();
      toast.success(next ? "Intensive only mode on" : "Intensive only mode off");
    } catch (e) {
      console.error("IntensiveOnly: toggle failed", e);
      toast.error("Couldn't update intensive only mode");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid rgba(26,82,160,0.08)",
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#EDF2FE",
            color: "#3D55A1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Zap size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
            Intensive only mode
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>
            Only accept intensive / semi-intensive bookings. Turning this on
            auto-fills Mon–Sun with 08:00–12:00 and 13:00–17:00 working blocks.
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled === true}
          disabled={busy || enabled === null}
          onClick={() => enabled !== null && apply(!enabled)}
          style={{
            width: 44,
            height: 26,
            borderRadius: 999,
            border: "none",
            background: enabled ? "#3D55A1" : "#C4C9D4",
            position: "relative",
            cursor: busy || enabled === null ? "not-allowed" : "pointer",
            transition: "background 0.18s",
            opacity: busy ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: enabled ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: 999,
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "left 0.18s",
            }}
          />
        </button>
      </div>
      {busy && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#64748B",
            fontSize: 11,
            marginTop: 10,
          }}
        >
          <Loader2 size={12} className="animate-spin" /> Updating…
        </div>
      )}
    </div>
  );
}
