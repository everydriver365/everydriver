import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GPSConnectionStatus {
  isConnected: boolean;
  lastSeenAt: string | null;
  status: "active" | "recent" | "offline";
  isLoading: boolean;
}

export function useGPSConnectionStatus(instructorId: string | null): GPSConnectionStatus {
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkConnection = useCallback(async () => {
    if (!instructorId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("traccar_devices")
        .select("last_seen_at")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLastSeenAt(data?.last_seen_at || null);
    } catch (err) {
      console.error("Error checking GPS connection:", err);
    } finally {
      setIsLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    checkConnection();
    // Poll every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Calculate status based on last_seen_at
  const getStatus = (): "active" | "recent" | "offline" => {
    if (!lastSeenAt) return "offline";
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;

    if (diffSeconds < 30) return "active";   // Green pulsing - actively receiving
    if (diffSeconds < 120) return "recent";  // Yellow - recently active
    return "offline";                         // Red - offline
  };

  const status = getStatus();
  const isConnected = status !== "offline";

  return { isConnected, lastSeenAt, status, isLoading };
}

// Re-export for backwards compatibility
export { useGPSConnectionStatus as useTraccarConnectionStatus };
