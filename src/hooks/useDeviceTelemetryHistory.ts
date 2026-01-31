import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export interface BatteryHistoryEntry {
  id: string;
  device_id: string;
  battery_percent: number;
  recorded_at: string;
}

export interface IgnitionEvent {
  id: string;
  device_id: string;
  vehicle_id: string | null;
  event_type: "on" | "off";
  latitude: number | null;
  longitude: number | null;
  road_name: string | null;
  recorded_at: string;
}

export function useDeviceBatteryHistory(deviceId: string | null, hoursBack: number = 24) {
  const { instructor } = useInstructorAuth();

  return useQuery({
    queryKey: ["device-battery-history", deviceId, hoursBack],
    queryFn: async (): Promise<BatteryHistoryEntry[]> => {
      if (!deviceId || !instructor?.id) return [];

      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("traccar_battery_history")
        .select("id, device_id, battery_percent, recorded_at")
        .eq("device_id", deviceId)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!deviceId && !!instructor?.id,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useDeviceIgnitionEvents(deviceId: string | null, limit: number = 20) {
  const { instructor } = useInstructorAuth();

  return useQuery({
    queryKey: ["device-ignition-events", deviceId, limit],
    queryFn: async (): Promise<IgnitionEvent[]> => {
      if (!deviceId || !instructor?.id) return [];

      const { data, error } = await supabase
        .from("traccar_ignition_events")
        .select("id, device_id, vehicle_id, event_type, latitude, longitude, road_name, recorded_at")
        .eq("device_id", deviceId)
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as IgnitionEvent[];
    },
    enabled: !!deviceId && !!instructor?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAllIgnitionEvents(limit: number = 50) {
  const { instructor } = useInstructorAuth();

  return useQuery({
    queryKey: ["all-ignition-events", instructor?.id, limit],
    queryFn: async (): Promise<(IgnitionEvent & { device_name?: string; vehicle_registration?: string })[]> => {
      if (!instructor?.id) return [];

      const { data, error } = await supabase
        .from("traccar_ignition_events")
        .select(`
          id, device_id, vehicle_id, event_type, latitude, longitude, road_name, recorded_at,
          device:traccar_devices(device_name, device_identifier),
          vehicle:instructor_vehicles(registration)
        `)
        .eq("instructor_id", instructor.id)
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(e => ({
        ...e,
        device_name: (e.device as any)?.device_name || (e.device as any)?.device_identifier,
        vehicle_registration: (e.vehicle as any)?.registration,
      })) as (IgnitionEvent & { device_name?: string; vehicle_registration?: string })[];
    },
    enabled: !!instructor?.id,
    refetchInterval: 30000,
  });
}
