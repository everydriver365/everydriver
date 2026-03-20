import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Radio, Car, MapPin, RefreshCw, Plus, Shield, ShieldAlert, Wrench, Fuel, Flame } from "lucide-react";
import { InstructorPageHeader } from "@/components/instructor/InstructorPageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { EnhancedDeviceStatusCard } from "@/components/instructor/vehicle-health/EnhancedDeviceStatusCard";
import { BatteryHistoryChart } from "@/components/instructor/vehicle-health/BatteryHistoryChart";
import { IgnitionEventsLog } from "@/components/instructor/vehicle-health/IgnitionEventsLog";
import { VehicleFleetCard, InstructorVehicleExtended } from "@/components/instructor/vehicle-health/VehicleFleetCard";
import { AutoMileageLog } from "@/components/instructor/vehicle-health/AutoMileageLog";
import { LinkDeviceDialog } from "@/components/instructor/vehicle-health/LinkDeviceDialog";
import { AddVehicleDialog } from "@/components/instructor/vehicle-health/AddVehicleDialog";
import { EditVehicleDialog, VehicleToEdit } from "@/components/instructor/vehicle-health/EditVehicleDialog";
import { ComplianceOverview } from "@/components/instructor/vehicle-health/ComplianceOverview";
import { SecurityAlertsTab } from "@/components/instructor/vehicle-health/SecurityAlertsTab";
import { ServiceRemindersTab } from "@/components/instructor/vehicle-health/ServiceRemindersTab";
import { LiveTelemetryTab } from "@/components/instructor/vehicle-health/LiveTelemetryTab";
import { RunningCostsTab } from "@/components/instructor/vehicle-health/RunningCostsTab";
import { MaintenanceAlertsBanner } from "@/components/instructor/vehicle-health/MaintenanceAlertsBanner";
import { SpeedHeatmapTab } from "@/components/instructor/vehicle-health/SpeedHeatmapTab";
import { PersonalDrivingStatsCard } from "@/components/instructor/vehicle-health/PersonalDrivingStatsCard";
import { useVehicleHealth, GPSDeviceHealth } from "@/hooks/useVehicleHealth";
import { useVehicleSecurity } from "@/hooks/useVehicleSecurity";
import { useVehicleService } from "@/hooks/useVehicleService";
import { useAutoMaintenanceSetup } from "@/hooks/useAutoMaintenanceSetup";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Skeleton } from "@/components/ui/skeleton";


export default function InstructorVehicleHealth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { instructor } = useInstructorAuth();
  const { devices, vehicles, mileageLog, isLoading, linkDeviceToVehicle, refetch } = useVehicleHealth();
  const { unacknowledgedCount, refetch: refetchSecurity } = useVehicleSecurity();
  const { upcomingReminders } = useVehicleService();
  useAutoMaintenanceSetup();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.hash === "#faults") return "live";
    if (location.hash === "#compliance") return "compliance";
    return "fleet";
  });
  
  const [linkingDevice, setLinkingDevice] = useState<GPSDeviceHealth | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleToEdit | null>(null);

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
        <InstructorPageHeader
          lucideIcon={Car}
          title="Vehicle Health"
          action={
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={() => setShowAddVehicle(true)} className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        {/* Maintenance alerts banner */}
        <MaintenanceAlertsBanner />

        {/* Tabs - Horizontally scrollable on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-8 gap-1">
              <TabsTrigger value="compliance" className="text-xs px-2 sm:px-3 gap-1 whitespace-nowrap">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">DVSA</span>
              </TabsTrigger>
              <TabsTrigger value="fleet" className="text-xs px-2 sm:px-3 gap-1 whitespace-nowrap">
                <Car className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Fleet</span>
              </TabsTrigger>
              <TabsTrigger value="service" className="text-xs px-2 sm:px-3 gap-1 relative whitespace-nowrap">
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Service</span>
                {upcomingReminders.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {upcomingReminders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mileage" className="text-xs px-2 sm:px-3 gap-1 whitespace-nowrap">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Mileage</span>
              </TabsTrigger>
              <TabsTrigger value="costs" className="text-xs px-2 sm:px-3 gap-1 whitespace-nowrap">
                <Fuel className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Costs</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs px-2 sm:px-3 gap-1 relative whitespace-nowrap">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Security</span>
                {unacknowledgedCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {unacknowledgedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="live" className="text-xs px-2 sm:px-3 gap-1 whitespace-nowrap">
                <Radio className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Live</span>
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="text-xs px-2 sm:px-3 gap-1 whitespace-nowrap">
                <Flame className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Speed</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Personal driving stats */}
          <PersonalDrivingStatsCard className="mt-4" />

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
                <VehicleFleetCard 
                  key={vehicle.id} 
                  vehicle={vehicle} 
                  onEdit={(v) => setEditingVehicle(v)}
                />
              ))
            )}
          </TabsContent>

          {/* Service Reminders Tab */}
          <TabsContent value="service" className="mt-4">
            <ServiceRemindersTab />
          </TabsContent>

          {/* Mileage Tab - Auto-logged with business/personal tagging */}
          <TabsContent value="mileage" className="mt-4">
            <AutoMileageLog />
          </TabsContent>

          {/* Running Costs Tab */}
          <TabsContent value="costs" className="mt-4">
            <RunningCostsTab />
          </TabsContent>

          {/* Live Status Tab */}
          <TabsContent value="live" className="mt-4 space-y-4">
            <LiveTelemetryTab 
              devices={devices}
              isLoading={isLoading}
              onLinkClick={(device) => setLinkingDevice(device)}
              onNavigateToSettings={() => navigate("/instructor/settings/tracking")}
            />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <SecurityAlertsTab vehicles={vehicles} />
          </TabsContent>

          {/* Speed Heatmap Tab */}
          <TabsContent value="heatmap" className="mt-4">
            <SpeedHeatmapTab />
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

      {/* Edit Vehicle Dialog */}
      <EditVehicleDialog
        vehicle={editingVehicle}
        open={!!editingVehicle}
        onOpenChange={(open) => !open && setEditingVehicle(null)}
        onSuccess={() => refetch()}
      />
    </InstructorPortalLayout>
  );
}
