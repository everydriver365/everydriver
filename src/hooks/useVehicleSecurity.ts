import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useEffect } from "react";

export interface VehicleSecuritySettings {
  id: string;
  vehicle_id: string;
  instructor_id: string;
  security_enabled: boolean;
  movement_threshold_kmh: number;
  alert_cooldown_minutes: number;
  notify_on_ignition: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleSecurityAlert {
  id: string;
  vehicle_id: string;
  instructor_id: string;
  device_id: string | null;
  alert_type: "unexpected_movement" | "ignition_on" | "geofence_exit";
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number | null;
  triggered_at: string;
  notification_sent: boolean;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
  vehicle?: {
    registration: string;
    make: string | null;
    model: string | null;
  };
}

export function useVehicleSecurity() {
  const { instructor } = useInstructorAuth();
  const queryClient = useQueryClient();

  // Fetch security settings for all vehicles
  const settingsQuery = useQuery({
    queryKey: ["vehicle-security-settings", instructor?.id],
    queryFn: async (): Promise<VehicleSecuritySettings[]> => {
      if (!instructor?.id) return [];

      const { data, error } = await supabase
        .from("vehicle_security_settings")
        .select("*")
        .eq("instructor_id", instructor.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!instructor?.id,
  });

  // Fetch recent security alerts
  const alertsQuery = useQuery({
    queryKey: ["vehicle-security-alerts", instructor?.id],
    queryFn: async (): Promise<VehicleSecurityAlert[]> => {
      if (!instructor?.id) return [];

      const { data, error } = await supabase
        .from("vehicle_security_alerts")
        .select(`
          *,
          vehicle:vehicle_id (
            registration,
            make,
            model
          )
        `)
        .eq("instructor_id", instructor.id)
        .order("triggered_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as VehicleSecurityAlert[];
    },
    enabled: !!instructor?.id,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!instructor?.id) return;

    const channel = supabase
      .channel("security-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vehicle_security_alerts",
          filter: `instructor_id=eq.${instructor.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["vehicle-security-alerts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructor?.id, queryClient]);

  // Toggle security for a vehicle
  const toggleSecurityMutation = useMutation({
    mutationFn: async ({
      vehicleId,
      enabled,
    }: {
      vehicleId: string;
      enabled: boolean;
    }) => {
      if (!instructor?.id) throw new Error("Not authenticated");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("vehicle_security_settings")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("vehicle_security_settings")
          .update({ security_enabled: enabled })
          .eq("vehicle_id", vehicleId);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("vehicle_security_settings")
          .insert({
            vehicle_id: vehicleId,
            instructor_id: instructor.id,
            security_enabled: enabled,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-security-settings"] });
    },
  });

  // Update security settings for a vehicle
  const updateSettingsMutation = useMutation({
    mutationFn: async ({
      vehicleId,
      settings,
    }: {
      vehicleId: string;
      settings: Partial<VehicleSecuritySettings>;
    }) => {
      if (!instructor?.id) throw new Error("Not authenticated");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("vehicle_security_settings")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("vehicle_security_settings")
          .update(settings)
          .eq("vehicle_id", vehicleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vehicle_security_settings")
          .insert({
            vehicle_id: vehicleId,
            instructor_id: instructor.id,
            ...settings,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-security-settings"] });
    },
  });

  // Acknowledge an alert
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("vehicle_security_alerts")
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-security-alerts"] });
    },
  });

  // Get settings for a specific vehicle
  const getVehicleSettings = (vehicleId: string): VehicleSecuritySettings | null => {
    return settingsQuery.data?.find((s) => s.vehicle_id === vehicleId) || null;
  };

  // Get unacknowledged alert count
  const unacknowledgedCount = alertsQuery.data?.filter((a) => !a.acknowledged).length || 0;

  return {
    settings: settingsQuery.data || [],
    alerts: alertsQuery.data || [],
    isLoading: settingsQuery.isLoading || alertsQuery.isLoading,
    isError: settingsQuery.isError || alertsQuery.isError,
    unacknowledgedCount,
    getVehicleSettings,
    toggleSecurity: toggleSecurityMutation.mutateAsync,
    updateSettings: updateSettingsMutation.mutateAsync,
    acknowledgeAlert: acknowledgeAlertMutation.mutateAsync,
    refetch: () => {
      settingsQuery.refetch();
      alertsQuery.refetch();
    },
  };
}
