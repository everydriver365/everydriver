import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TrackingProvider = "radius" | null;

const PROVIDER_PRIORITY: TrackingProvider[] = ["radius"];

export function useActiveTrackingProvider(instructorId: string | null | undefined) {
  const [activeProvider, setActiveProvider] = useState<TrackingProvider>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    const fetchProvider = async () => {
      // Fetch devices and instructor preference in parallel
      const [devicesRes, instRes] = await Promise.all([
        supabase
          .from("gps_devices")
          .select("tracking_provider")
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
        supabase
          .from("instructors")
          .select("preferred_tracking_provider")
          .eq("id", instructorId)
          .single(),
      ]);

      const devices = devicesRes.data ?? [];
      const providers = [...new Set(devices.map((d) => d.tracking_provider).filter((p): p is string => !!p && p !== "geotab"))] as TrackingProvider[];
      const preference = (instRes.data?.preferred_tracking_provider as TrackingProvider) ?? null;

      if (preference && providers.includes(preference)) {
        setActiveProvider(preference);
      } else if (providers.length > 0) {
        const best = PROVIDER_PRIORITY.find((p) => providers.includes(p)) || null;
        setActiveProvider(best);
      } else {
        setActiveProvider(null);
      }

      setIsLoading(false);
    };

    fetchProvider();
  }, [instructorId]);

  return { activeProvider, isLoading };
}
