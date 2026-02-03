import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GPSConnectionStatus {
  isConnected: boolean;
  lastSeenAt: string | null;
  status: "active" | "recent" | "offline";
  isLoading: boolean;
  deviceName: string | null;
  manualReconnect: () => void;
}

export function useGPSConnectionStatus(instructorId: string | null): GPSConnectionStatus {
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate status based on last_seen_at
  const getStatus = useCallback((lastSeen: string | null): "active" | "recent" | "offline" => {
    if (!lastSeen) return "offline";
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;

    if (diffSeconds < 30) return "active";
    if (diffSeconds < 300) return "recent";
    return "offline";
  }, []);

  const checkConnection = useCallback(async () => {
    if (!instructorId) {
      setIsLoading(false);
      return null;
    }

    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("last_seen_at, device_name, device_identifier")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setDeviceName(data.device_name || data.device_identifier || null);
      }
      return data?.last_seen_at || null;
    } catch (err) {
      console.error("Error checking GPS connection:", err);
      return null;
    }
  }, [instructorId]);

  const manualReconnect = useCallback(async () => {
    const result = await checkConnection();
    setLastSeenAt(result);
  }, [checkConnection]);

  useEffect(() => {
    const doCheck = async () => {
      const result = await checkConnection();
      setLastSeenAt(result);
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
          const newData = payload.new as { last_seen_at?: string; device_name?: string; device_identifier?: string };
          if (newData.last_seen_at) {
            setLastSeenAt(newData.last_seen_at);
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

  const status = getStatus(lastSeenAt);
  const isConnected = status === "active" || status === "recent";

  return { 
    isConnected, 
    lastSeenAt, 
    status, 
    isLoading,
    deviceName,
    manualReconnect 
  };
}

// Re-export for backwards compatibility
export { useGPSConnectionStatus as useTraccarConnectionStatus };
