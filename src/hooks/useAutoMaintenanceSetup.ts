import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useVehicleHealth, GPSDeviceHealth } from "@/hooks/useVehicleHealth";
import { useVehicleService } from "@/hooks/useVehicleService";

// Default maintenance intervals for driving school vehicles
const DEFAULT_REMINDERS = [
  { service_type: "oil_change", interval_months: 6, interval_km: 16000 },
  { service_type: "full_service", interval_months: 12, interval_km: 19000 },
  { service_type: "brake_check", interval_months: 12, interval_km: 32000 },
  { service_type: "tire_rotation", interval_months: 6, interval_km: 16000 },
] as const;

/**
 * Auto-creates default service reminders when a tracker device is linked
 * to a vehicle that doesn't have any reminders yet.
 */
export function useAutoMaintenanceSetup() {
  const { instructor } = useInstructorAuth();
  const { devices, vehicles } = useVehicleHealth();
  const { reminders } = useVehicleService();
  const setupDoneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!instructor?.id || devices.length === 0 || vehicles.length === 0) return;

    // Find vehicles with linked devices but no service reminders
    const linkedVehicleIds = new Set(
      devices
        .filter((d: GPSDeviceHealth) => d.vehicle?.id)
        .map((d: GPSDeviceHealth) => d.vehicle!.id)
    );

    const vehiclesWithReminders = new Set(reminders.map((r) => r.vehicle_id));

    for (const vehicleId of linkedVehicleIds) {
      if (vehiclesWithReminders.has(vehicleId)) continue;
      if (setupDoneRef.current.has(vehicleId)) continue;

      setupDoneRef.current.add(vehicleId);

      // Find the device for this vehicle to get current readings
      const device = devices.find((d) => d.vehicle?.id === vehicleId);
      const currentKm = device?.last_ecu_odometer_km != null ? Math.round(device.last_ecu_odometer_km) : null;
      const currentEngineHours = device?.last_engine_hours ?? null;

      // Auto-create default reminders
      const inserts = DEFAULT_REMINDERS.map((preset) => ({
        instructor_id: instructor.id,
        vehicle_id: vehicleId,
        service_type: preset.service_type,
        interval_months: preset.interval_months,
        interval_km: preset.interval_km,
        reminder_days_before: 14,
        last_service_km: currentKm,
        last_service_date: new Date().toISOString().split("T")[0],
        next_due_km: currentKm != null ? Math.round(currentKm + preset.interval_km) : null,
        next_due_date: null, // Will be set by interval_months from last_service_date
        auto_created: true,
      }));

      // Calculate next_due_date for each
      const finalInserts = inserts.map((ins) => {
        if (ins.last_service_date && ins.interval_months) {
          const d = new Date(ins.last_service_date);
          d.setMonth(d.getMonth() + ins.interval_months);
          ins.next_due_date = d.toISOString().split("T")[0];
        }
        return ins;
      });

      supabase
        .from("vehicle_service_reminders")
        .insert(finalInserts)
        .then(({ error }) => {
          if (error) {
            console.error("[AutoMaintenance] Failed to create default reminders:", error.message);
            setupDoneRef.current.delete(vehicleId);
          }
        });
    }
  }, [instructor?.id, devices, vehicles, reminders]);
}
