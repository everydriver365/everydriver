import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  instructorId: string;
}

/**
 * Tiny sync-status dot shown next to the instructor's name on the mobile
 * home header. Green when synced, red when there are failures, grey when
 * the calendar isn't connected. Hidden while loading.
 *
 * The detail tile (CalendarSyncStatusTile) only renders in the error case,
 * so the dot is the at-a-glance signal for the happy path.
 */
export function CalendarSyncDot({ instructorId }: Props) {
  const [color, setColor] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!instructorId) return;

    (async () => {
      const [{ data: conn }, { count: fCount }] = await Promise.all([
        supabase
          .from("instructor_google_service_calendar")
          .select("is_active")
          .eq("instructor_id", instructorId)
          .maybeSingle(),
        supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .eq("calendar_sync_status", "failed")
          .is("deleted_at", null)
          .neq("status", "cancelled"),
      ]);

      if (cancelled) return;

      if (!conn?.is_active) {
        setColor("#9aa3b2");
        setTitle("Google Calendar not connected");
      } else if ((fCount ?? 0) > 0) {
        setColor("#ef4444");
        setTitle(`${fCount} lesson${fCount === 1 ? "" : "s"} failed to sync`);
      } else {
        setColor("#22c55e");
        setTitle("Calendar synced");
      }
    })();

    return () => { cancelled = true; };
  }, [instructorId]);

  if (!color) return null;

  return (
    <span
      aria-label={title}
      title={title}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        boxShadow: `0 0 0 2px rgba(255,255,255,0.18)`,
        flexShrink: 0,
      }}
    />
  );
}

export default CalendarSyncDot;
