import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { EnhancedDeviceStatusCard } from "@/components/instructor/vehicle-health/EnhancedDeviceStatusCard";

import { Skeleton } from "@/components/ui/skeleton";
import { InstructorCard } from "@/components/instructor/InstructorCard";
import { AlertTriangle } from "lucide-react";

export function GeotabOverviewTab() {
  const { devices, isLoading } = useVehicleHealth();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <InstructorCard>
        <div className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
          <p>No GPS devices found. Contact your admin to have a device assigned.</p>
        </div>
      </InstructorCard>
    );
  }

  const devicesWithFaults = devices.filter(
    (d) => d.last_fault_codes && (d.last_fault_codes as any[]).length > 0
  );

  return (
    <div className="space-y-4">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => (
          <EnhancedDeviceStatusCard
            key={device.id}
            device={device}
            onLinkClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
