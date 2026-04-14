import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Radio, ChevronRight, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useActiveTrackingProvider } from "@/hooks/useActiveTrackingProvider";
import type { TrackingProvider } from "@/hooks/useActiveTrackingProvider";

interface TrackerDevice {
  id: string;
  device_identifier: string;
  device_name: string | null;
  is_active: boolean;
  last_seen_at: string | null;
}

interface TrackerSelectorTileProps {
  instructorId: string;
  currentDeviceId: string | null;
  currentDeviceName: string | null;
  onDeviceChange: (device: TrackerDevice) => void;
}

export function TrackerSelectorTile({
  instructorId,
  currentDeviceId,
  currentDeviceName,
  onDeviceChange,
}: TrackerSelectorTileProps) {
  const [devices, setDevices] = useState<TrackerDevice[]>([]);
  const [open, setOpen] = useState(false);
  const { activeProvider } = useActiveTrackingProvider(instructorId);

  useEffect(() => {
    if (!instructorId) return;

    const fetchDevices = async () => {
      let query = supabase
        .from("gps_devices")
        .select("id, device_identifier, device_name, is_active, last_seen_at")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      // Only show devices from the active provider
      if (activeProvider) {
        query = query.eq("tracking_provider", activeProvider);
      }

      const { data } = await query;
      if (data) setDevices(data);
    };

    fetchDevices();
  }, [instructorId, activeProvider]);

  const handleSelect = (device: TrackerDevice) => {
    onDeviceChange(device);
    setOpen(false);
  };

  // Don't show if only one device
  if (devices.length <= 1) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Card className="bg-white dark:bg-card border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active Tracker</p>
                  <p className="text-xs text-muted-foreground">
                    {currentDeviceName || "Unknown device"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-2xl">
        <SheetHeader>
          <SheetTitle>Select Tracker</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 pb-6">
          {devices.map((device) => {
            const isSelected = device.id === currentDeviceId;
            return (
              <button
                key={device.id}
                onClick={() => handleSelect(device)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/50 hover:bg-muted border border-transparent"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Radio className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {device.device_name || device.device_identifier}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {device.device_identifier}
                  </p>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
