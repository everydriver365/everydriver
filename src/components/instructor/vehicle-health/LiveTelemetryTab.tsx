import { useState } from "react";
import { Radio, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TraccarDeviceHealth } from "@/hooks/useVehicleHealth";
import { useDeviceBatteryHistory, useAllIgnitionEvents } from "@/hooks/useDeviceTelemetryHistory";
import { EnhancedDeviceStatusCard } from "./EnhancedDeviceStatusCard";
import { BatteryHistoryChart } from "./BatteryHistoryChart";
import { IgnitionEventsLog } from "./IgnitionEventsLog";

interface LiveTelemetryTabProps {
  devices: TraccarDeviceHealth[];
  isLoading: boolean;
  onLinkClick: (device: TraccarDeviceHealth) => void;
  onNavigateToSettings: () => void;
}

export function LiveTelemetryTab({ 
  devices, 
  isLoading, 
  onLinkClick, 
  onNavigateToSettings 
}: LiveTelemetryTabProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
    devices[0]?.id || null
  );
  const [activeSubTab, setActiveSubTab] = useState<"devices" | "battery" | "ignition">("devices");

  // Fetch battery history for selected device
  const { data: batteryHistory, isLoading: batteryLoading } = useDeviceBatteryHistory(selectedDeviceId);
  
  // Fetch all ignition events
  const { data: ignitionEvents, isLoading: ignitionLoading } = useAllIgnitionEvents();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Radio className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">No GPS devices registered</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Set up a GPS tracker in Settings → Traccar
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onNavigateToSettings}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Device
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs for different views */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices" className="text-xs">Devices</TabsTrigger>
          <TabsTrigger value="battery" className="text-xs">Battery</TabsTrigger>
          <TabsTrigger value="ignition" className="text-xs">Ignition</TabsTrigger>
        </TabsList>

        {/* Devices View - Live status cards */}
        <TabsContent value="devices" className="mt-4 space-y-3">
          {devices.map(device => (
            <EnhancedDeviceStatusCard
              key={device.id}
              device={device}
              onLinkClick={() => onLinkClick(device)}
            />
          ))}
        </TabsContent>

        {/* Battery History View */}
        <TabsContent value="battery" className="mt-4 space-y-4">
          {/* Device selector if multiple devices */}
          {devices.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {devices.map(device => (
                <Button
                  key={device.id}
                  variant={selectedDeviceId === device.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs whitespace-nowrap shrink-0"
                  onClick={() => setSelectedDeviceId(device.id)}
                >
                  {device.device_name || device.device_identifier}
                </Button>
              ))}
            </div>
          )}
          <BatteryHistoryChart 
            data={batteryHistory || []} 
            isLoading={batteryLoading} 
          />
        </TabsContent>

        {/* Ignition Events View */}
        <TabsContent value="ignition" className="mt-4">
          <IgnitionEventsLog 
            events={ignitionEvents || []} 
            isLoading={ignitionLoading}
            showDeviceName={devices.length > 1}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
