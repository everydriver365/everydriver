import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export interface GPSDeviceHealth {
  id: string;
  device_identifier: string;
  device_name: string | null;
  vehicle_id: string | null;
  last_battery_percent: number | null;
  last_ignition_status: boolean | null;
  last_speed_kmh: number | null;
  last_speed_limit_kmh: number | null;
  last_road_name: string | null;
  last_heading: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_seen_at: string | null;
  is_connected: boolean;
  daily_start_odometer_m: number | null;
  daily_start_date: string | null;
  daily_start_ecu_odometer_km: number | null;
  session_start_ecu_odometer_km: number | null;
  tracking_provider: string | null;
  // Engine diagnostics from Geotab
  last_fuel_percent: number | null;
  last_battery_voltage: number | null;
  last_coolant_temp_c: number | null;
  last_engine_hours: number | null;
  last_ecu_odometer_km: number | null;
  last_tire_pressure_json: Record<string, number> | null;
  last_fault_codes: Array<{ code: string; description: string; severity: string; source: string }> | null;
  last_diagnostics_at: string | null;
  vehicle?: {
    id: string;
    registration: string;
    make: string | null;
    model: string | null;
    year: number | null;
    current_odometer_km: number | null;
    mot_expiry: string | null;
    insurance_expiry: string | null;
    tax_expiry: string | null;
    next_service_due_km: number | null;
  } | null;
}


export interface InstructorVehicle {
  id: string;
  instructor_id: string;
  registration: string;
  make: string | null;
  model: string | null;
  year: number | null;
  transmission: string | null;
  current_odometer_km: number | null;
  mot_expiry: string | null;
  insurance_expiry: string | null;
  tax_expiry: string | null;
  next_service_due_km: number | null;
  last_service_date: string | null;
  is_primary: boolean;
  linked_device_id?: string | null;
  image_url?: string | null;
}

export interface MileageLogEntry {
  id: string;
  session_date: string;
  pupil_name: string | null;
  distance_km: number;
  vehicle_registration: string | null;
}

export function useVehicleHealth() {
  const { instructor } = useInstructorAuth();
  const pollerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const movingRef = useRef(false);

  // Adaptive poller: trigger GPS backend function faster when moving
  const triggerPoller = useCallback(async () => {
    try {
      await Promise.allSettled([
        supabase.functions.invoke("geotab-poller", { method: "POST" }),
        supabase.functions.invoke("radius-poller", { method: "POST" }),
      ]);
    } catch (err) {
      console.error("Failed to trigger pollers:", err);
    }
  }, []);

  // Fetch devices with vehicle info
  const devicesQuery = useQuery({
    queryKey: ["vehicle-health-devices", instructor?.id],
    queryFn: async (): Promise<GPSDeviceHealth[]> => {
      if (!instructor?.id) return [];

      // Fetch preferred provider in parallel
      const [devicesRes, prefRes] = await Promise.all([
        supabase
          .from("gps_devices")
          .select(`
            id,
            device_identifier,
            device_name,
            vehicle_id,
            tracking_provider,
          last_battery_percent,
          last_ignition_status,
          last_speed_kmh,
          last_speed_limit_kmh,
          last_road_name,
          last_heading,
          last_latitude,
          last_longitude,
          last_seen_at,
          last_heartbeat_at,
          daily_start_odometer_m,
          daily_start_date,
          daily_start_ecu_odometer_km,
          session_start_ecu_odometer_km,
          last_fuel_percent,
          last_battery_voltage,
          last_coolant_temp_c,
          last_engine_hours,
          last_ecu_odometer_km,
          last_tire_pressure_json,
          last_fault_codes,
          last_diagnostics_at
          `)
          .eq("instructor_id", instructor.id),
        supabase
          .from("instructors")
          .select("preferred_tracking_provider")
          .eq("id", instructor.id)
          .single(),
      ]);

      const { data: devices, error } = devicesRes;
      const preferredProvider = (prefRes.data?.preferred_tracking_provider as string) ?? null;

      if (error) throw error;

      // Filter out ghost devices that have never reported telemetry
      const activeDevices = (devices || []).filter(
        d => d.last_seen_at !== null || (d as any).last_heartbeat_at !== null
      );

      // Fetch linked vehicles separately
      const vehicleIds = activeDevices
        .map(d => d.vehicle_id)
        .filter((id): id is string => id !== null);

      let vehiclesMap: Record<string, GPSDeviceHealth["vehicle"]> = {};

      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("instructor_vehicles")
          .select("id, registration, make, model, year, current_odometer_km, mot_expiry, insurance_expiry, tax_expiry, next_service_due_km")
          .in("id", vehicleIds);

        vehicles?.forEach(v => {
          vehiclesMap[v.id] = v;
        });
      }

      // Sort so preferred provider devices come first
      if (preferredProvider) {
        activeDevices.sort((a, b) => {
          const aMatch = (a as any).tracking_provider === preferredProvider ? 0 : 1;
          const bMatch = (b as any).tracking_provider === preferredProvider ? 0 : 1;
          return aMatch - bMatch;
        });
      }

      return activeDevices.map(d => {
        const lastSeen = d.last_seen_at ? new Date(d.last_seen_at) : null;
        const heartbeat = (d as any).last_heartbeat_at ? new Date((d as any).last_heartbeat_at) : null;
        const now = Date.now();
        const seenAgoMs = lastSeen ? now - lastSeen.getTime() : Infinity;
        const heartbeatAgoMs = heartbeat ? now - heartbeat.getTime() : Infinity;
        
        // Connected if: device reported recently (<60s) OR poller heartbeat is fresh (<120s) and device seen within 30min
        const isConnected = seenAgoMs < 60000 || (heartbeatAgoMs < 120000 && seenAgoMs < 1800000);

        return {
          ...d,
          is_connected: isConnected,
          tracking_provider: (d as any).tracking_provider ?? null,
          last_tire_pressure_json: d.last_tire_pressure_json as Record<string, number> | null,
          last_fault_codes: d.last_fault_codes as Array<{ code: string; description: string; severity: string; source: string }> | null,
          vehicle: d.vehicle_id ? vehiclesMap[d.vehicle_id] || null : null,
        };
      });
    },
    enabled: !!instructor?.id,
    // Poll every 10s when moving, 30s when idle
    refetchInterval: movingRef.current ? 10000 : 30000,
  });

  // Update moving state and adaptive poller interval
  const devices = devicesQuery.data || [];
  const isMoving = devices.some(d => 
    d.is_connected && (
      (d.last_speed_kmh != null && d.last_speed_kmh > 0) || 
      d.last_ignition_status === true
    )
  );

  useEffect(() => {
    movingRef.current = isMoving;
    if (!instructor?.id) return;

    const intervalMs = isMoving ? 30000 : 60000; // 30s moving, 60s idle

    // Clear previous interval
    if (pollerIntervalRef.current) {
      clearInterval(pollerIntervalRef.current);
    }

    triggerPoller();
    pollerIntervalRef.current = setInterval(triggerPoller, intervalMs);

    return () => {
      if (pollerIntervalRef.current) {
        clearInterval(pollerIntervalRef.current);
      }
    };
  }, [instructor?.id, isMoving, triggerPoller]);


  const vehiclesQuery = useQuery({
    queryKey: ["vehicle-health-fleet", instructor?.id],
    queryFn: async (): Promise<InstructorVehicle[]> => {
      if (!instructor?.id) return [];

      const { data: vehicles, error } = await supabase
        .from("instructor_vehicles")
        .select("id, instructor_id, registration, make, model, year, transmission, current_odometer_km, mot_expiry, insurance_expiry, tax_expiry, next_service_due_km, last_service_date, is_primary, image_url")
        .eq("instructor_id", instructor.id)
        .order("is_primary", { ascending: false });

      if (error) throw error;

      // Find which devices are linked to which vehicles
      const { data: devices } = await supabase
        .from("gps_devices")
        .select("id, vehicle_id")
        .eq("instructor_id", instructor.id);

      const vehicleToDevice: Record<string, string> = {};
      devices?.forEach(d => {
        if (d.vehicle_id) {
          vehicleToDevice[d.vehicle_id] = d.id;
        }
      });

      return (vehicles || []).map(v => ({
        ...v,
        linked_device_id: vehicleToDevice[v.id] || null,
      }));
    },
    enabled: !!instructor?.id,
    refetchInterval: 30000, // Less frequent for fleet data
  });

  // Fetch mileage log (recent sessions)
  const mileageQuery = useQuery({
    queryKey: ["vehicle-health-mileage", instructor?.id],
    queryFn: async (): Promise<MileageLogEntry[]> => {
      if (!instructor?.id) return [];

      const { data: sessions, error } = await supabase
        .from("lesson_telematics")
        .select("id, created_at, total_distance_km, pupil_id")
        .eq("instructor_id", instructor.id)
        .not("total_distance_km", "is", null)
        .gt("total_distance_km", 0)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch pupil names separately
      const pupilIds = [...new Set((sessions || []).map((s: any) => s.pupil_id).filter(Boolean))];
      let pupilMap: Record<string, string> = {};
      if (pupilIds.length > 0) {
        const { data: pupils } = await supabase.from("pupils").select("id, name").in("id", pupilIds);
        if (pupils) pupilMap = Object.fromEntries(pupils.map(p => [p.id, p.name]));
      }

      return (sessions || []).map((s: any) => ({
        id: s.id,
        session_date: s.created_at,
        pupil_name: s.pupil_id ? (pupilMap[s.pupil_id] || null) : null,
        distance_km: s.total_distance_km || 0,
        vehicle_registration: null,
      }));
    },
    enabled: !!instructor?.id,
  });

  // Function to link device to vehicle
  async function linkDeviceToVehicle(deviceId: string, vehicleId: string | null) {
    const { error } = await supabase
      .from("gps_devices")
      .update({ vehicle_id: vehicleId })
      .eq("id", deviceId);

    if (error) throw error;

    // Refetch data
    devicesQuery.refetch();
    vehiclesQuery.refetch();
  }

  return {
    devices: devicesQuery.data || [],
    vehicles: vehiclesQuery.data || [],
    mileageLog: mileageQuery.data || [],
    isLoading: devicesQuery.isLoading || vehiclesQuery.isLoading,
    isError: devicesQuery.isError || vehiclesQuery.isError,
    linkDeviceToVehicle,
    refetch: () => {
      devicesQuery.refetch();
      vehiclesQuery.refetch();
      mileageQuery.refetch();
    },
  };
}
