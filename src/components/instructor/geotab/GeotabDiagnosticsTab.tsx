import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { LiveTelemetryTab } from "@/components/instructor/vehicle-health/LiveTelemetryTab";
import { GeotabDiagnosticCharts } from "./GeotabDiagnosticCharts";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function GeotabDiagnosticsTab() {
  const { devices, isLoading } = useVehicleHealth();
  const { instructor } = useInstructorAuth();

  return (
    <Tabs defaultValue="live" className="space-y-4">
      <TabsList>
        <TabsTrigger value="live">Live Status</TabsTrigger>
        <TabsTrigger value="history">Sensor History</TabsTrigger>
      </TabsList>

      <TabsContent value="live">
        <LiveTelemetryTab devices={devices} isLoading={isLoading} onLinkClick={() => {}} onNavigateToSettings={() => {}} />
      </TabsContent>

      <TabsContent value="history">
        {instructor?.id ? (
          <GeotabDiagnosticCharts instructorId={instructor.id} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Loading instructor profile…</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
