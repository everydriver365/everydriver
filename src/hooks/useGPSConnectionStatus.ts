import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";
import { getDeviceStatus } from "@/lib/gpsDeviceStatus";

interface GPSConnectionStatus {
  isConnected: boolean;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  lastTrackTime: string | null;
  status: "active" | "recent" | "stationary" | "offline";
  isLoading: boolean;
  deviceName: string | null;
  isStationary: boolean;
  manualReconnect: () => void;
}

export function useGPSConnectionStatus(instructorId: string | null): GPSConnectionStatus {
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);
  const [lastTrackTime, setLastTrackTime] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getStatus = useCallback((trackTime: string | null, heartbeat: string | null): "active" | "recent" | "stationary" | "offline" => {
    if (!trackTime) return "offline";
    
    const now = new Date();
    const trackDate = new Date(trackTime);
    const trackDiffSeconds = (now.getTime() - trackDate.getTime()) / 1000;
    
    if (trackDiffSeconds < 60) return "active";
    if (trackDiffSeconds < 300) return "recent";

    if (heartbeat) {
      const heartbeatDiffSeconds = (now.getTime() - new Date(heartbeat).getTime()) / 1000;
      if (heartbeatDiffSeconds < 120 && trackDiffSeconds < 1800) {
        return "stationary";
      }
    }
    
    return "offline";
  }, []);

  const checkConnection = useCallback(async () => {
    if (!instructorId) {
      setIsLoading(false);
      return { lastSeenAt: null, lastHeartbeatAt: null, lastTrackTime: null };
    }

    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("last_seen_at, last_heartbeat_at, device_name, device_identifier, is_active")
        .eq("instructor_id", instructorId)
        .eq("tracking_provider", "radius")
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDeviceName(data.device_name || data.device_identifier || null);
      }
      return {
        lastSeenAt: data?.last_seen_at || null,
        lastHeartbeatAt: data?.last_heartbeat_at || null,
        lastTrackTime: data?.last_seen_at || null,
      };
    } catch (err) {
      console.error("Error checking GPS connection:", err);
      return { lastSeenAt: null, lastHeartbeatAt: null, lastTrackTime: null };
    }
  }, [instructorId]);

  const manualReconnect = useCallback(async () => {
    const result = await checkConnection();
    setLastSeenAt(result.lastSeenAt);
    setLastHeartbeatAt(result.lastHeartbeatAt);
    setLastTrackTime(result.lastTrackTime);
  }, [checkConnection]);

  useEffect(() => {
    const doCheck = async () => {
      const result = await checkConnection();
      setLastSeenAt(result.lastSeenAt);
      setLastHeartbeatAt(result.lastHeartbeatAt);
      setLastTrackTime(result.lastTrackTime);
      setIsLoading(false);
    };
    
    doCheck();
  }, [checkConnection]);

  useRealtimeSubscription(
    "gps_devices",
    "UPDATE",
    (payload) => {
      const newData = payload.new as { 
        last_seen_at?: string; 
        last_heartbeat_at?: string;
        device_name?: string; 
        device_identifier?: string;
        is_active?: boolean;
      };
      if (newData.last_seen_at) {
        setLastSeenAt(newData.last_seen_at);
        setLastTrackTime(newData.last_seen_at);
      }
      if (newData.last_heartbeat_at) {
        setLastHeartbeatAt(newData.last_heartbeat_at);
      }
      if (newData.device_name || newData.device_identifier) {
        setDeviceName(newData.device_name || newData.device_identifier || null);
      }
    },
    {
      filter: instructorId ? `instructor_id=eq.${instructorId}` : undefined,
      enabled: !!instructorId,
    }
  );

  const status = getStatus(lastTrackTime, lastHeartbeatAt);
  const isConnected = status === "active" || status === "recent" || status === "stationary";
  const isStationary = status === "stationary";

  return { 
    isConnected, 
    lastSeenAt, 
    lastHeartbeatAt,
    lastTrackTime,
    status, 
    isLoading,
    deviceName,
    isStationary,
    manualReconnect 
  };
}
