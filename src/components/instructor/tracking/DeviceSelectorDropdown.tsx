import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radio } from "lucide-react";

interface DeviceOption {
  id: string;
  device_identifier: string;
  device_name: string | null;
  tracking_provider: string | null;
  is_active: boolean;
  last_seen_at: string | null;
}

interface DeviceSelectorDropdownProps {
  instructorId: string;
  currentDeviceId: string | null;
  onDeviceChange: (deviceId: string, provider: string | null) => void;
}

function formatProvider(provider: string | null): string {
  if (!provider) return "";
  if (provider === "geotab") return "Geotab";
  if (provider === "radius") return "Radius";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function DeviceSelectorDropdown({
  instructorId,
  currentDeviceId,
  onDeviceChange,
}: DeviceSelectorDropdownProps) {
  const [devices, setDevices] = useState<DeviceOption[]>([]);

  useEffect(() => {
    if (!instructorId) return;

    const fetchDevices = async () => {
      const { data } = await supabase
        .from("gps_devices")
        .select("id, device_identifier, device_name, tracking_provider, is_active, last_seen_at")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      if (data) setDevices(data);
    };

    fetchDevices();
  }, [instructorId]);

  // Don't render if 0 or 1 device
  if (devices.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Radio className="h-4 w-4 text-primary" />
      </div>
      <Select
        value={currentDeviceId || undefined}
        onValueChange={(value) => {
          const selected = devices.find((d) => d.id === value);
          onDeviceChange(value, selected?.tracking_provider || null);
        }}
      >
        <SelectTrigger className="flex-1 bg-card border-border/50">
          <SelectValue placeholder="Select tracker" />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id}>
              <span className="flex items-center gap-2">
                <span>{device.device_name || device.device_identifier}</span>
                {device.tracking_provider && (
                  <span className="text-xs text-muted-foreground">
                    ({formatProvider(device.tracking_provider)})
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
