import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GPSConnectionStatus {
  isConnected: boolean;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  status: "active" | "recent" | "stationary" | "offline";
  isLoading: boolean;
  deviceName: string | null;
  isStationary: boolean;
  manualReconnect: () => void;
}

export function useGPSConnectionStatus(instructorId: string | null): GPSConnectionStatus {
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate status based on heartbeat (connectivity) and last_seen_at (position freshness)
  const getStatus = useCallback((heartbeat: string | null, lastSeen: string | null): "active" | "recent" | "stationary" | "offline" => {
    const now = new Date();
    
    // Check heartbeat first for connectivity (2 min threshold)
    if (heartbeat) {
      const heartbeatDate = new Date(heartbeat);
      const heartbeatDiffSeconds = (now.getTime() - heartbeatDate.getTime()) / 1000;
      
      // If heartbeat is within 2 minutes, device is responding
      if (heartbeatDiffSeconds < 120) {
        // Now check position freshness
        if (lastSeen) {
          const lastSeenDate = new Date(lastSeen);
          const positionDiffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
          
          // Position is fresh (within 60 seconds) - actively moving
          if (positionDiffSeconds < 60) return "active";
          // Position is somewhat fresh (within 5 minutes)
          if (positionDiffSeconds < 300) return "recent";
          // Heartbeat is fresh but position is stale - stationary/parked
          return "stationary";
        }
        // Have heartbeat but no position yet
        return "stationary";
      }
    }
    
    // Fallback to last_seen_at if no heartbeat (backwards compatibility)
    if (lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;

      if (diffSeconds < 60) return "active";
      if (diffSeconds < 300) return "recent";
    }
    
    return "offline";
  }, []);

  const checkConnection = useCallback(async () => {
    if (!instructorId) {
      setIsLoading(false);
      return { lastSeenAt: null, lastHeartbeatAt: null };
    }

    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("last_seen_at, last_heartbeat_at, device_name, device_identifier")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDeviceName(data.device_name || data.device_identifier || null);
      }
      return {
        lastSeenAt: data?.last_seen_at || null,
        lastHeartbeatAt: (data as any)?.last_heartbeat_at || null,
      };
    } catch (err) {
      console.error("Error checking GPS connection:", err);
      return { lastSeenAt: null, lastHeartbeatAt: null };
    }
  }, [instructorId]);

  const manualReconnect = useCallback(async () => {
    const result = await checkConnection();
    setLastSeenAt(result.lastSeenAt);
    setLastHeartbeatAt(result.lastHeartbeatAt);
  }, [checkConnection]);

  useEffect(() => {
    const doCheck = async () => {
      const result = await checkConnection();
      setLastSeenAt(result.lastSeenAt);
      setLastHeartbeatAt(result.lastHeartbeatAt);
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
            device_name?: string; 
            device_identifier?: string 
          };
          if (newData.last_seen_at) {
            setLastSeenAt(newData.last_seen_at);
          }
          if (newData.last_heartbeat_at) {
            setLastHeartbeatAt(newData.last_heartbeat_at);
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

  const status = getStatus(lastHeartbeatAt, lastSeenAt);
  const isConnected = status === "active" || status === "recent" || status === "stationary";
  const isStationary = status === "stationary";

  return { 
    isConnected, 
    lastSeenAt, 
    lastHeartbeatAt,
    status, 
    isLoading,
    deviceName,
    isStationary,
    manualReconnect 
  };
}

// Re-export for backwards compatibility
export { useGPSConnectionStatus as useTraccarConnectionStatus };
