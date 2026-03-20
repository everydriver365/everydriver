import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Radio, Shield, Wrench, Flame, RefreshCw, Plus } from "lucide-react";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleHeroCard } from "@/components/instructor/vehicle-health/VehicleHeroCard";
import { QuickMetricsPair } from "@/components/instructor/vehicle-health/QuickMetricsPair";
import { SpeedHeatmapPreview } from "@/components/instructor/vehicle-health/SpeedHeatmapPreview";
import { ComplianceOverview } from "@/components/instructor/vehicle-health/ComplianceOverview";
import { ServiceRemindersTab } from "@/components/instructor/vehicle-health/ServiceRemindersTab";
import { SpeedHeatmapTab } from "@/components/instructor/vehicle-health/SpeedHeatmapTab";
import { LiveTelemetryTab } from "@/components/instructor/vehicle-health/LiveTelemetryTab";
import { LinkDeviceDialog } from "@/components/instructor/vehicle-health/LinkDeviceDialog";
import { AddVehicleDialog } from "@/components/instructor/vehicle-health/AddVehicleDialog";
import { EditVehicleDialog, VehicleToEdit } from "@/components/instructor/vehicle-health/EditVehicleDialog";
import { MaintenanceAlertsBanner } from "@/components/instructor/vehicle-health/MaintenanceAlertsBanner";
import { useVehicleHealth, GPSDeviceHealth } from "@/hooks/useVehicleHealth";
import { useVehicleSecurity } from "@/hooks/useVehicleSecurity";
import { useVehicleService } from "@/hooks/useVehicleService";
import { useAutoMaintenanceSetup } from "@/hooks/useAutoMaintenanceSetup";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { motion } from "framer-motion";

export default function InstructorVehicleHealth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { instructor } = useInstructorAuth();
  const { devices, vehicles, isLoading, linkDeviceToVehicle, refetch } = useVehicleHealth();
  const { unacknowledgedCount, refetch: refetchSecurity } = useVehicleSecurity();
  const { upcomingReminders } = useVehicleService();
  useAutoMaintenanceSetup();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.hash === "#faults") return "live";
    if (location.hash === "#compliance") return "dvsa";
    return "live";
  });

  const [linkingDevice, setLinkingDevice] = useState<GPSDeviceHealth | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleToEdit | null>(null);

  const handleRefresh = () => {
    refetch();
    refetchSecurity();
  };

  // Primary vehicle & device
  const primaryVehicle = vehicles.find(v => v.is_primary) || vehicles[0] || null;
  const primaryDevice = primaryVehicle?.linked_device_id
    ? devices.find(d => d.id === primaryVehicle.linked_device_id) || devices[0]
    : devices[0] || null;

  // Get compliance data for quick metrics
  const motExpiry = primaryVehicle?.mot_expiry || instructor?.car_mot_expiry;
  const nextServiceKm = primaryVehicle?.next_service_due_km || null;
  const currentOdometerKm = primaryVehicle?.current_odometer_km || primaryDevice?.last_ecu_odometer_km || null;

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        {/* Slim header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-lg font-bold text-foreground">Vehicle Health</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={() => setShowAddVehicle(true)} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Maintenance alerts */}
        <MaintenanceAlertsBanner />

        {/* Hero Card — live vehicle status */}
        <VehicleHeroCard
          device={primaryDevice}
          vehicle={primaryVehicle}
          isLoading={isLoading}
        />

        {/* Quick Metrics — MOT + Service */}
        <QuickMetricsPair
          motExpiry={motExpiry}
          nextServiceKm={nextServiceKm}
          currentOdometerKm={currentOdometerKm}
          onMotClick={() => setActiveTab("dvsa")}
          onServiceClick={() => setActiveTab("service")}
        />

        {/* Speed Heatmap Preview */}
        <SpeedHeatmapPreview onExpand={() => setActiveTab("speed")} />

        {/* 4-Tab Segmented Control */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-10">
            <TabsTrigger value="live" className="text-xs gap-1.5 data-[state=active]:shadow-sm">
              <Radio className="h-3.5 w-3.5" />
              Live
            </TabsTrigger>
            <TabsTrigger value="dvsa" className="text-xs gap-1.5 data-[state=active]:shadow-sm">
              <Shield className="h-3.5 w-3.5" />
              DVSA
            </TabsTrigger>
            <TabsTrigger value="service" className="text-xs gap-1.5 relative data-[state=active]:shadow-sm">
              <Wrench className="h-3.5 w-3.5" />
              Service
              {upcomingReminders.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {upcomingReminders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="speed" className="text-xs gap-1.5 data-[state=active]:shadow-sm">
              <Flame className="h-3.5 w-3.5" />
              Speed
            </TabsTrigger>
          </TabsList>

          {/* Live Tab */}
          <TabsContent value="live" className="mt-4">
            <LiveTelemetryTab
              devices={devices}
              isLoading={isLoading}
              onLinkClick={(device) => setLinkingDevice(device)}
              onNavigateToSettings={() => navigate("/instructor/settings/tracking")}
            />
          </TabsContent>

          {/* DVSA Compliance Tab */}
          <TabsContent value="dvsa" className="mt-4 space-y-4">
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

          {/* Service Tab */}
          <TabsContent value="service" className="mt-4">
            <ServiceRemindersTab />
          </TabsContent>

          {/* Speed Heatmap Tab */}
          <TabsContent value="speed" className="mt-4">
            <SpeedHeatmapTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <LinkDeviceDialog
        open={!!linkingDevice}
        onOpenChange={(open) => !open && setLinkingDevice(null)}
        device={linkingDevice}
        vehicles={vehicles}
        onLink={async (deviceId, vehicleId) => await linkDeviceToVehicle(deviceId, vehicleId)}
      />
      <AddVehicleDialog
        open={showAddVehicle}
        onOpenChange={setShowAddVehicle}
        onSuccess={() => refetch()}
      />
      <EditVehicleDialog
        vehicle={editingVehicle}
        open={!!editingVehicle}
        onOpenChange={(open) => !open && setEditingVehicle(null)}
        onSuccess={() => refetch()}
      />
    </InstructorPortalLayout>
  );
}
