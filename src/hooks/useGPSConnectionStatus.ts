import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // Calculate status based on last_gpsgate_track_time (real GPS data) not last_seen_at (poller artifact)
  const getStatus = useCallback((trackTime: string | null, heartbeat: string | null): "active" | "recent" | "stationary" | "offline" => {
    const now = new Date();
    
    // Primary indicator: last_gpsgate_track_time — when the device actually sent GPS data
    if (trackTime) {
      const trackDate = new Date(trackTime);
      const trackDiffSeconds = (now.getTime() - trackDate.getTime()) / 1000;
      
      // Device sent real GPS data within 60 seconds — actively tracking
      if (trackDiffSeconds < 60) return "active";
      // Within 5 minutes — recently active
      if (trackDiffSeconds < 300) return "recent";
    }

    // If heartbeat is fresh but no recent track data, device is responding to polls
    // but NOT sending GPS data — this is NOT a real connection
    // The poller updates heartbeat even when the device has no new position
    // So heartbeat alone does NOT mean connected
    
    // Check heartbeat only for "stationary" — device is online but parked
    // Only if track time exists and is within 30 minutes (device was recently active)
    if (heartbeat && trackTime) {
      const heartbeatDate = new Date(heartbeat);
      const heartbeatDiffSeconds = (now.getTime() - heartbeatDate.getTime()) / 1000;
      const trackDate = new Date(trackTime);
      const trackDiffSeconds = (now.getTime() - trackDate.getTime()) / 1000;
      
      // Heartbeat fresh AND device had GPS data within last 30 minutes = stationary
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
        .select("last_seen_at, last_heartbeat_at, last_gpsgate_track_time, device_name, device_identifier")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDeviceName(data.device_name || data.device_identifier || null);
      }
      return {
        lastSeenAt: data?.last_seen_at || null,
        lastHeartbeatAt: data?.last_heartbeat_at || null,
        lastTrackTime: data?.last_gpsgate_track_time || null,
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

    if (!instructorId) return;

    // Subscribe to realtime updates for instant connection status
    const channel = supabase
      .channel(`gps-connection-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gps_devices",
          filter: `instructor_id=eq.${instructorId}`,
        },
        (payload) => {
          const newData = payload.new as { 
            last_seen_at?: string; 
            last_heartbeat_at?: string;
            last_gpsgate_track_time?: string;
            device_name?: string; 
            device_identifier?: string 
          };
          if (newData.last_seen_at) {
            setLastSeenAt(newData.last_seen_at);
          }
          if (newData.last_heartbeat_at) {
            setLastHeartbeatAt(newData.last_heartbeat_at);
          }
          if (newData.last_gpsgate_track_time) {
            setLastTrackTime(newData.last_gpsgate_track_time);
          }
          if (newData.device_name || newData.device_identifier) {
            setDeviceName(newData.device_name || newData.device_identifier || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId, checkConnection]);

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

// Re-export for backwards compatibility
export { useGPSConnectionStatus as useTraccarConnectionStatus };
