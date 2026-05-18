import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export interface CompletionFlags {
  vehicle: boolean;
  hours: boolean;
}

/**
 * Live status for the settings sidebar:
 * - `completionFlags.vehicle` — instructor has a vehicle make/model + ADI badge number on file.
 * - `completionFlags.hours`   — instructor has at least one weekly availability window saved.
 * - `waitingCount` — pupils currently on the waiting list.
 *
 * Per project rule: live data only — no hard-coded fallbacks. `null` means
 * "not loaded yet"; the UI treats `null` as "no badge" rather than fabricating
 * a completion state.
 */
export function useSettingsStatus() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const [completionFlags, setCompletionFlags] = useState<CompletionFlags | null>(null);
  const [waitingCount, setWaitingCount] = useState<number>(0);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;

    (async () => {
      const [vehicleRes, hoursRes, waitRes] = await Promise.all([
        supabase
          .from("instructors")
          .select("vehicle_make, vehicle_model, adi_badge_number")
          .eq("id", instructorId)
          .maybeSingle(),
        supabase
          .from("instructor_working_hours")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId),
        supabase
          .from("waiting_list")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructorId)
          .is("removed_at", null),
      ]);

      if (cancelled) return;

      const v = vehicleRes.data;
      const vehicleOk = Boolean(v?.vehicle_make && v?.vehicle_model && v?.adi_badge_number);
      const hoursOk = (hoursRes.count ?? 0) > 0;

      setCompletionFlags({ vehicle: vehicleOk, hours: hoursOk });
      setWaitingCount(waitRes.count ?? 0);
    })();

    return () => { cancelled = true; };
  }, [instructorId]);

  return { completionFlags, waitingCount };
}
