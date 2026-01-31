import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Car, MapPin, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { DeviceStatusCard } from "@/components/instructor/vehicle-health/DeviceStatusCard";
import { VehicleFleetCard } from "@/components/instructor/vehicle-health/VehicleFleetCard";
import { MileageLogList } from "@/components/instructor/vehicle-health/MileageLogList";
import { LinkDeviceDialog } from "@/components/instructor/vehicle-health/LinkDeviceDialog";
import { useVehicleHealth, TraccarDeviceHealth } from "@/hooks/useVehicleHealth";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorVehicleHealth() {
  const navigate = useNavigate();
  const { devices, vehicles, mileageLog, isLoading, linkDeviceToVehicle, refetch } = useVehicleHealth();
  const [activeTab, setActiveTab] = useState("live");
  const [linkingDevice, setLinkingDevice] = useState<TraccarDeviceHealth | null>(null);

  const handleLinkDevice = async (deviceId: string, vehicleId: string | null) => {
    await linkDeviceToVehicle(deviceId, vehicleId);
  };

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Vehicle Health</h1>
              <p className="text-sm text-muted-foreground">
                Monitor devices & fleet
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="text-xs sm:text-sm">
              <Radio className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Live Status
            </TabsTrigger>
            <TabsTrigger value="fleet" className="text-xs sm:text-sm">
              <Car className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Fleet
            </TabsTrigger>
            <TabsTrigger value="mileage" className="text-xs sm:text-sm">
              <MapPin className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Mileage
            </TabsTrigger>
          </TabsList>

          {/* Live Status Tab */}
          <TabsContent value="live" className="mt-4 space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Radio className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No GPS devices registered</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Set up a GPS tracker in Settings → Traccar
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/instructor/settings/traccar")}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Device
                </Button>
              </div>
            ) : (
              devices.map(device => (
                <DeviceStatusCard
                  key={device.id}
                  device={device}
                  onLinkClick={() => setLinkingDevice(device)}
                />
              ))
            )}
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet" className="mt-4 space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-36 w-full rounded-lg" />
                <Skeleton className="h-36 w-full rounded-lg" />
              </>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Car className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No vehicles registered</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Add your vehicles in Settings
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/instructor/settings")}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Vehicle
                </Button>
              </div>
            ) : (
              vehicles.map(vehicle => (
                <VehicleFleetCard key={vehicle.id} vehicle={vehicle} />
              ))
            )}
          </TabsContent>

          {/* Mileage Tab */}
          <TabsContent value="mileage" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ) : (
              <MileageLogList entries={mileageLog} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Link Device Dialog */}
      <LinkDeviceDialog
        open={!!linkingDevice}
        onOpenChange={(open) => !open && setLinkingDevice(null)}
        device={linkingDevice}
        vehicles={vehicles}
        onLink={handleLinkDevice}
      />
    </InstructorPortalLayout>
  );
}
