import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";

interface ProviderSelectorTileProps {
  instructorId: string;
  currentProvider: string | null;
  onProviderChange: (provider: string) => void;
}

export function ProviderSelectorTile({
  instructorId,
  currentProvider,
  onProviderChange,
}: ProviderSelectorTileProps) {
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    if (!instructorId) return;

    const fetchProviders = async () => {
      const { data } = await supabase
        .from("gps_devices")
        .select("tracking_provider")
        .eq("instructor_id", instructorId)
        .eq("is_active", true);

      if (data) {
        const providers = [
          ...new Set(
            data
              .map((d) => d.tracking_provider)
              .filter((p): p is string => !!p)
          ),
        ];
        // Sort consistently: geotab first, then radius
        const order = ["geotab", "radius"];
        providers.sort(
          (a, b) =>
            (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) -
            (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
        );
        setAvailableProviders(providers);
      }
    };

    fetchProviders();
  }, [instructorId]);

  // Don't render if only one provider
  if (availableProviders.length <= 1) return null;

  const segments = availableProviders.map((p) => ({
    value: p,
    label: p === "geotab" ? "Geotab" : p === "radius" ? "Radius" : p,
  }));

  const handleChange = async (value: string) => {
    onProviderChange(value);
    // Persist preference
    await supabase
      .from("instructors")
      .update({ preferred_tracking_provider: value })
      .eq("id", instructorId);
  };

  return (
    <IOSSegmentedControl
      segments={segments}
      value={currentProvider || availableProviders[0]}
      onChange={handleChange}
    />
  );
}
