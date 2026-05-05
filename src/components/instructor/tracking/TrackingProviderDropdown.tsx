import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smartphone, Radio } from "lucide-react";

export type TrackingProviderChoice = "phone" | "radius";

interface TrackingProviderDropdownProps {
  instructorId: string;
  value: TrackingProviderChoice;
  onChange: (value: TrackingProviderChoice) => void;
}

/**
 * Dropdown allowing the instructor to choose between phone GPS tracking
 * and the Radius hardware tracker. Persists the choice to
 * `instructors.preferred_tracking_provider` so the rest of the app can
 * honour the preference.
 */
export function TrackingProviderDropdown({
  instructorId,
  value,
  onChange,
}: TrackingProviderDropdownProps) {
  const [hasRadiusDevice, setHasRadiusDevice] = useState(false);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("gps_devices")
        .select("id")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", "radius")
        .limit(1);
      if (!cancelled) setHasRadiusDevice((data?.length ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  const handleChange = async (next: string) => {
    const choice = (next === "radius" ? "radius" : "phone") as TrackingProviderChoice;
    onChange(choice);
    await supabase
      .from("instructors")
      .update({ preferred_tracking_provider: choice } as any)
      .eq("id", instructorId);
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-full bg-card border-border/50">
        <SelectValue placeholder="Choose tracker" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="phone">
          <span className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Phone tracking
          </span>
        </SelectItem>
        <SelectItem value="radius" disabled={!hasRadiusDevice}>
          <span className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Radius tracker{!hasRadiusDevice ? " (no device linked)" : ""}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
