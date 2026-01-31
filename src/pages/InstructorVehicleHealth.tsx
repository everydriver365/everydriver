import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Radio, Car, MapPin, RefreshCw, Plus, Shield, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { DeviceStatusCard } from "@/components/instructor/vehicle-health/DeviceStatusCard";
import { VehicleFleetCard } from "@/components/instructor/vehicle-health/VehicleFleetCard";
import { MileageLogList } from "@/components/instructor/vehicle-health/MileageLogList";
import { MileageSummary } from "@/components/instructor/vehicle-health/MileageSummary";
import { LinkDeviceDialog } from "@/components/instructor/vehicle-health/LinkDeviceDialog";
import { AddVehicleDialog } from "@/components/instructor/vehicle-health/AddVehicleDialog";
import { ComplianceOverview } from "@/components/instructor/vehicle-health/ComplianceOverview";
import { SecurityAlertsTab } from "@/components/instructor/vehicle-health/SecurityAlertsTab";
import { useVehicleHealth, TraccarDeviceHealth } from "@/hooks/useVehicleHealth";
import { useVehicleSecurity } from "@/hooks/useVehicleSecurity";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorVehicleHealth() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const { devices, vehicles, mileageLog, isLoading, linkDeviceToVehicle, refetch } = useVehicleHealth();
  const { unacknowledgedCount, refetch: refetchSecurity } = useVehicleSecurity();
  const [activeTab, setActiveTab] = useState("compliance");
  const [linkingDevice, setLinkingDevice] = useState<TraccarDeviceHealth | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const handleRefresh = () => {
    refetch();
    refetchSecurity();
  };

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
                Compliance & mileage tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-9 w-9"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setShowAddVehicle(true)}
              className="h-9 w-9"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="compliance" className="text-xs sm:text-sm">
              <Shield className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              DVSA
            </TabsTrigger>
            <TabsTrigger value="fleet" className="text-xs sm:text-sm">
              <Car className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Fleet
            </TabsTrigger>
            <TabsTrigger value="mileage" className="text-xs sm:text-sm">
              <MapPin className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Mileage
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm relative">
              <ShieldAlert className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Security
              {unacknowledgedCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {unacknowledgedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs sm:text-sm">
              <Radio className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Live
            </TabsTrigger>
          </TabsList>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="mt-4 space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </>
            ) : (
              <ComplianceOverview 
                vehicles={vehicles}
                adiExpiry={instructor?.adi_badge_expiry}
                dbsExpiry={instructor?.dbs_certificate_expiry}
                carInsuranceExpiry={instructor?.car_insurance_expiry}
                carMotExpiry={instructor?.car_mot_expiry}
                carTaxExpiry={instructor?.car_tax_expiry}
                cpdHoursLogged={instructor?.cpd_hours_logged}
                cpdYearTarget={instructor?.cpd_year_target}
                cpdCertified={instructor?.cpd_certified}
              />
            )}
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet" className="mt-4 space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Car className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No vehicles registered</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Add your teaching car to track compliance
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAddVehicle(true)}
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
          <TabsContent value="mileage" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ) : (
              <>
                <MileageSummary entries={mileageLog} vehicles={vehicles} />
                <MileageLogList entries={mileageLog} />
              </>
            )}
          </TabsContent>

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

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <SecurityAlertsTab vehicles={vehicles} />
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

      {/* Add Vehicle Dialog */}
      <AddVehicleDialog
        open={showAddVehicle}
        onOpenChange={setShowAddVehicle}
        onSuccess={() => refetch()}
      />
    </InstructorPortalLayout>
  );
}
