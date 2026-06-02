import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smartphone, Radio, Car } from "lucide-react";

export type TrackingProviderChoice = "phone" | "radius" | "geotab";

interface TrackingProviderDropdownProps {
  instructorId: string;
  value: TrackingProviderChoice;
  onChange: (value: TrackingProviderChoice) => void;
  /** Optional: hydrated Radius device info from the parent. When provided, the
   *  dropdown skips its own query and shows the device immediately. */
  radiusDevice?: { id: string; name: string | null } | null;
}

/**
 * Dropdown allowing the instructor to choose between phone GPS tracking,
 * a Radius hardware tracker, or a Geotab telematics device. Persists the
 * choice to `instructors.preferred_tracking_provider`.
 */
export function TrackingProviderDropdown({
  instructorId,
  value,
  onChange,
  radiusDevice,
}: TrackingProviderDropdownProps) {
  const [hasRadiusDevice, setHasRadiusDevice] = useState(!!radiusDevice);
  const [radiusDeviceName, setRadiusDeviceName] = useState<string | null>(radiusDevice?.name ?? null);
  const [hasGeotabDevice, setHasGeotabDevice] = useState(false);
  const [geotabDeviceName, setGeotabDeviceName] = useState<string | null>(null);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      // Pull all of this instructor's devices and classify client-side.
      let { data } = await supabase
        .from("gps_devices")
        .select("id, device_name, device_identifier, tracking_provider, is_active, last_seen_at")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      if (!data || data.length === 0) {
        const { data: idRow } = await supabase
          .rpc("get_instructor_id_for_user", { p_user_id: (await supabase.auth.getUser()).data.user?.id });
        const fallbackId = (idRow as unknown as string) || null;
        if (fallbackId) {
          const res = await supabase
            .from("gps_devices")
            .select("id, device_name, device_identifier, tracking_provider, is_active, last_seen_at")
            .eq("instructor_id", fallbackId)
            .order("last_seen_at", { ascending: false, nullsFirst: false });
          data = res.data ?? [];
        }
      }

      const radiusDevices = (data ?? []).filter(
        (d: any) => d.tracking_provider === "radius" && d.is_active !== false,
      );
      const geotabDevices = (data ?? []).filter(
        (d: any) => d.tracking_provider === "geotab" && d.is_active !== false,
      );

      if (cancelled) return;

      if (!radiusDevice) {
        setHasRadiusDevice(radiusDevices.length > 0);
        const first = radiusDevices[0] as any;
        setRadiusDeviceName(first ? (first.device_name || first.device_identifier || null) : null);
      } else {
        setHasRadiusDevice(true);
        setRadiusDeviceName(radiusDevice.name);
      }

      setHasGeotabDevice(geotabDevices.length > 0);
      const firstGeotab = geotabDevices[0] as any;
      setGeotabDeviceName(firstGeotab ? (firstGeotab.device_name || firstGeotab.device_identifier || null) : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId, radiusDevice?.id, radiusDevice?.name]);

  const handleChange = async (next: string) => {
    const choice = (next === "radius" || next === "geotab" ? next : "phone") as TrackingProviderChoice;
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
            {hasRadiusDevice
              ? `Radius tracker${radiusDeviceName ? ` · ${radiusDeviceName}` : ""}`
              : "Radius tracker (no device linked)"}
          </span>
        </SelectItem>
        <SelectItem value="geotab" disabled={!hasGeotabDevice}>
          <span className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            {hasGeotabDevice
              ? `Geotab${geotabDeviceName ? ` · ${geotabDeviceName}` : ""}`
              : "Geotab (no device linked)"}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

