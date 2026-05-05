import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LivePupilPosition {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed_kmh: number | null;
  speed_limit_kmh: number | null;
  updated_at: string | null;
  is_active: boolean;
}

/**
 * Subscribes to the active row in live_pupil_positions for a pupil.
 * Used to feed the live map from phone-streamed GPS when the instructor's
 * preferred_tracking_provider is set to 'phone'.
 */
export function useLivePupilPosition(pupilId: string | null, enabled: boolean) {
  const [position, setPosition] = useState<LivePupilPosition | null>(null);

  useEffect(() => {
    if (!enabled || !pupilId) {
      setPosition(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("live_pupil_positions")
        .select("latitude, longitude, heading, speed_kmh, speed_limit_kmh, updated_at, is_active")
        .eq("pupil_id", pupilId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setPosition(data as LivePupilPosition);
    };
    load();

    const channel = supabase
      .channel(`phone-pos-${pupilId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_pupil_positions",
          filter: `pupil_id=eq.${pupilId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as LivePupilPosition | undefined;
          if (row) setPosition(row);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [pupilId, enabled]);

  return position;
}
