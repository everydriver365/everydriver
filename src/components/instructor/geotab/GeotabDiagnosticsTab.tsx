import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { LiveTelemetryTab } from "@/components/instructor/vehicle-health/LiveTelemetryTab";

export function GeotabDiagnosticsTab() {
  const { devices, isLoading } = useVehicleHealth();
  return <LiveTelemetryTab devices={devices} isLoading={isLoading} onLinkClick={() => {}} onNavigateToSettings={() => {}} />;
}
