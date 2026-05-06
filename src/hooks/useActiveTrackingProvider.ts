import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TrackingProvider = "radius" | "phone" | null;

// Hardware providers (phone is always available — it's the device itself).
const HARDWARE_PROVIDERS: Exclude<TrackingProvider, null>[] = ["radius"];

export function useActiveTrackingProvider(instructorId: string | null | undefined) {
  const [activeProvider, setActiveProvider] = useState<TrackingProvider>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    const fetchProvider = async () => {
      const [devicesRes, instRes] = await Promise.all([
        supabase
          .from("gps_devices")
          .select("tracking_provider, is_active")
          .eq("instructor_id", instructorId),
        supabase
          .from("instructors")
          .select("preferred_tracking_provider")
          .eq("id", instructorId)
          .single(),
      ]);

      const devices = (devicesRes.data ?? []).filter((d: any) => d.is_active !== false);
      const hardwareProviders = [
        ...new Set(
          devices
            .map((d) => d.tracking_provider as string | null)
            .filter((p): p is string => !!p && HARDWARE_PROVIDERS.includes(p as any)),
        ),
      ];

      // Phone is always an option (the instructor's device itself).
      const allProviders: TrackingProvider[] = ["phone", ...(hardwareProviders as TrackingProvider[])];
      const preference = (instRes.data?.preferred_tracking_provider as TrackingProvider) ?? null;

      if (preference && allProviders.includes(preference)) {
        setActiveProvider(preference);
      } else if (hardwareProviders.length > 0) {
        const best = HARDWARE_PROVIDERS.find((p) => hardwareProviders.includes(p)) ?? null;
        setActiveProvider((best as TrackingProvider) ?? "phone");
      } else {
        setActiveProvider("phone");
      }

      setIsLoading(false);
    };

    fetchProvider();
  }, [instructorId]);

  return { activeProvider, isLoading };
}
