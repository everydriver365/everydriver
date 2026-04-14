import { useState, useEffect } from "react";
import { Radio, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GPSDeviceHealth } from "@/hooks/useVehicleHealth";
import { useDeviceBatteryHistory, useAllIgnitionEvents } from "@/hooks/useDeviceTelemetryHistory";
import { EnhancedDeviceStatusCard } from "./EnhancedDeviceStatusCard";
import { BatteryHistoryChart } from "./BatteryHistoryChart";
import { IgnitionEventsLog } from "./IgnitionEventsLog";
import { MiniLiveMap } from "@/components/instructor/tracking/MiniLiveMap";
import { GeotabExtendedDiagnosticsTab } from "@/components/instructor/geotab/GeotabExtendedDiagnosticsTab";
import { GeotabFaultCodesTab } from "@/components/instructor/geotab/GeotabFaultCodesTab";
import { GeotabContextualSpeedTab } from "@/components/instructor/geotab/GeotabContextualSpeedTab";
import { Card, CardContent } from "@/components/ui/card";

interface LiveTelemetryTabProps {
  devices: GPSDeviceHealth[];
  isLoading: boolean;
  onLinkClick: (device: GPSDeviceHealth) => void;
  onNavigateToSettings: () => void;
  preferredDeviceId?: string | null;
}

export function LiveTelemetryTab({ 
  devices, 
  isLoading, 
  onLinkClick, 
  onNavigateToSettings,
  preferredDeviceId,
}: LiveTelemetryTabProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
    preferredDeviceId || devices[0]?.id || null
  );
  const [activeSubTab, setActiveSubTab] = useState<"devices" | "battery" | "ignition" | "gps" | "sensors" | "faults" | "speeding">("devices");

  useEffect(() => {
    if (devices.length > 0 && (!selectedDeviceId || !devices.find(d => d.id === selectedDeviceId))) {
      setSelectedDeviceId(preferredDeviceId || devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const { data: batteryHistory, isLoading: batteryLoading } = useDeviceBatteryHistory(selectedDeviceId);
  const { data: ignitionEvents, isLoading: ignitionLoading } = useAllIgnitionEvents();

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const hasGeotab = true;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Radio className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">No GPS devices registered</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Set up a GPS tracker in Settings → GPS Tracking
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

  const DeviceSelector = () => (
    devices.length > 1 ? (
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
    ) : null
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}>
        <TabsList className="w-full overflow-x-auto no-scrollbar flex">
          <TabsTrigger value="devices" className="text-xs flex-1">Devices</TabsTrigger>
          <TabsTrigger value="gps" className="text-xs flex-1">GPS</TabsTrigger>
          <TabsTrigger value="battery" className="text-xs flex-1">Battery</TabsTrigger>
          <TabsTrigger value="ignition" className="text-xs flex-1">Ignition</TabsTrigger>
          {hasGeotab && <TabsTrigger value="sensors" className="text-xs flex-1">Sensors</TabsTrigger>}
          {hasGeotab && <TabsTrigger value="faults" className="text-xs flex-1">Faults</TabsTrigger>}
          {hasGeotab && <TabsTrigger value="speeding" className="text-xs flex-1">Speeding</TabsTrigger>}
        </TabsList>

        <TabsContent value="devices" className="mt-4 space-y-3">
          {devices.map(device => (
            <EnhancedDeviceStatusCard
              key={device.id}
              device={device}
              onLinkClick={() => onLinkClick(device)}
            />
          ))}
        </TabsContent>

        <TabsContent value="gps" className="mt-4 space-y-4">
          <DeviceSelector />
          {selectedDevice ? (
            <MiniLiveMap
              latitude={selectedDevice.last_latitude ?? null}
              longitude={selectedDevice.last_longitude ?? null}
              heading={selectedDevice.last_heading ?? null}
              speedKmh={selectedDevice.last_speed_kmh ?? null}
              lastSeenAt={selectedDevice.last_seen_at}
              isActive={!!selectedDevice.last_seen_at && (Date.now() - new Date(selectedDevice.last_seen_at).getTime() < 30000)}
              sessionId={(selectedDevice as any).current_session_id ?? null}
            />
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Select a device</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="battery" className="mt-4 space-y-4">
          <DeviceSelector />
          <BatteryHistoryChart 
            data={batteryHistory || []} 
            isLoading={batteryLoading} 
          />
        </TabsContent>

        <TabsContent value="ignition" className="mt-4">
          <IgnitionEventsLog 
            events={ignitionEvents || []} 
            isLoading={ignitionLoading}
            showDeviceName={devices.length > 1}
          />
        </TabsContent>

        {hasGeotab && (
          <TabsContent value="sensors" className="mt-4">
            <GeotabExtendedDiagnosticsTab />
          </TabsContent>
        )}

        {hasGeotab && (
          <TabsContent value="faults" className="mt-4">
            <GeotabFaultCodesTab />
          </TabsContent>
        )}

        {hasGeotab && (
          <TabsContent value="speeding" className="mt-4">
            <GeotabContextualSpeedTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
