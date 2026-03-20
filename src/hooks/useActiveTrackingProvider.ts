import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TrackingProvider = "geotab" | "quartix" | "radius" | "gpsgate" | null;

const PROVIDER_PRIORITY: TrackingProvider[] = ["geotab", "quartix", "radius", "gpsgate"];

export function useActiveTrackingProvider(instructorId: string | null | undefined) {
  const [activeProvider, setActiveProvider] = useState<TrackingProvider>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("gps_devices")
        .select("tracking_provider")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      if (data && data.length > 0) {
        const providers = data.map((d) => d.tracking_provider as TrackingProvider);
        const best = PROVIDER_PRIORITY.find((p) => providers.includes(p)) || null;
        setActiveProvider(best);
      } else {
        // Check if instructor has gpsgate link
        const { data: inst } = await supabase
          .from("instructors")
          .select("gpsgate_user_id")
          .eq("id", instructorId)
          .single();
        setActiveProvider(inst?.gpsgate_user_id ? "gpsgate" : null);
      }
      setIsLoading(false);
    };

    fetch();
  }, [instructorId]);

  return { activeProvider, isLoading };
}
