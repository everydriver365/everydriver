import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
  gpsgate_odometer_m: number | null;
  gpsgate_engine_hours_s: number | null;
  daily_start_odometer_m: number | null;
  daily_start_date: string | null;
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

// Backwards compatibility alias
export type TraccarDeviceHealth = GPSDeviceHealth;

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

  // Trigger the GPSgate poller edge function to fetch fresh data from GPSgate
  useEffect(() => {
    if (!instructor?.id) return;

    const triggerPoller = async () => {
      try {
        await supabase.functions.invoke("gpsgate-poller", {
          method: "POST",
        });
      } catch (err) {
        console.error("Failed to trigger GPSgate poller:", err);
      }
    };

    // Trigger immediately when hook mounts
    triggerPoller();

    // Then poll every 30 seconds while the page is open
    pollerIntervalRef.current = setInterval(triggerPoller, 30000);

    return () => {
      if (pollerIntervalRef.current) {
        clearInterval(pollerIntervalRef.current);
      }
    };
  }, [instructor?.id]);

  // Fetch devices with vehicle info
  const devicesQuery = useQuery({
    queryKey: ["vehicle-health-devices", instructor?.id],
    queryFn: async (): Promise<GPSDeviceHealth[]> => {
      if (!instructor?.id) return [];

      const { data: devices, error } = await supabase
        .from("gps_devices")
        .select(`
          id,
          device_identifier,
          device_name,
          vehicle_id,
          last_battery_percent,
          last_ignition_status,
          last_speed_kmh,
          last_speed_limit_kmh,
          last_road_name,
          last_heading,
          last_latitude,
          last_longitude,
          last_seen_at,
          gpsgate_odometer_m,
          gpsgate_engine_hours_s,
          daily_start_odometer_m,
          daily_start_date
        `)
        .eq("instructor_id", instructor.id);

      if (error) throw error;

      // Fetch linked vehicles separately
      const vehicleIds = devices
        ?.map(d => d.vehicle_id)
        .filter((id): id is string => id !== null) || [];

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

      return (devices || []).map(d => {
        const lastSeen = d.last_seen_at ? new Date(d.last_seen_at) : null;
        const isConnected = lastSeen 
          ? (Date.now() - lastSeen.getTime()) < 30000 
          : false;

        return {
          ...d,
          is_connected: isConnected,
          vehicle: d.vehicle_id ? vehiclesMap[d.vehicle_id] || null : null,
        };
      });
    },
    enabled: !!instructor?.id,
    refetchInterval: 5000, // Poll every 5 seconds for near real-time
  });

  // Fetch all vehicles
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
        .select(`
          id,
          created_at,
          total_distance_km,
          pupils:pupil_id (name)
        `)
        .eq("instructor_id", instructor.id)
        .not("total_distance_km", "is", null)
        .gt("total_distance_km", 0)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (sessions || []).map(s => ({
        id: s.id,
        session_date: s.created_at,
        pupil_name: (s.pupils as any)?.name || null,
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
