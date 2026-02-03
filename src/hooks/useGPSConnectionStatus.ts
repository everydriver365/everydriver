import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GPSConnectionStatus {
  isConnected: boolean;
  lastSeenAt: string | null;
  status: "active" | "recent" | "offline" | "reconnecting";
  isLoading: boolean;
  isReconnecting: boolean;
  retryCount: number;
  manualReconnect: () => void;
}

export function useGPSConnectionStatus(instructorId: string | null): GPSConnectionStatus {
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
  const getBackoffDelay = (count: number): number => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    return Math.min(baseDelay * Math.pow(2, count), maxDelay);
  };

  const checkConnection = useCallback(async () => {
    if (!instructorId) {
      setIsLoading(false);
      return null;
    }

    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("last_seen_at")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data?.last_seen_at || null;
    } catch (err) {
      console.error("Error checking GPS connection:", err);
      return null;
    }
  }, [instructorId]);

  const attemptReconnect = useCallback(async () => {
    if (!instructorId) return;
    
    setIsReconnecting(true);
    const result = await checkConnection();
    
    if (result) {
      const lastSeen = new Date(result);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
      
      // Connected if within 5 minutes
      if (diffSeconds < 300) {
        setLastSeenAt(result);
        setIsReconnecting(false);
        setRetryCount(0);
        return;
      }
    }

    // Still offline, schedule retry
    if (retryCount < maxRetries) {
      const delay = getBackoffDelay(retryCount);
      console.log(`[GPS] Reconnect attempt ${retryCount + 1}/${maxRetries} in ${delay}ms`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, delay);
    } else {
      setIsReconnecting(false);
      console.log('[GPS] Max reconnection attempts reached');
    }
  }, [instructorId, retryCount, checkConnection]);

  // Trigger reconnect when retry count changes
  useEffect(() => {
    if (retryCount > 0 && isReconnecting) {
      attemptReconnect();
    }
  }, [retryCount, isReconnecting, attemptReconnect]);

  // Manual reconnect function
  const manualReconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setRetryCount(0);
    setIsReconnecting(true);
    attemptReconnect();
  }, [attemptReconnect]);

  useEffect(() => {
    const doCheck = async () => {
      const result = await checkConnection();
      setLastSeenAt(result);
      setIsLoading(false);
      
      // Start auto-reconnect if offline
      if (result) {
        const lastSeen = new Date(result);
        const now = new Date();
        const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
        
        if (diffSeconds >= 300 && !isReconnecting) {
          attemptReconnect();
        }
      }
    };
    
    doCheck();
    // Poll every 30 seconds
    const interval = setInterval(doCheck, 30000);
    
    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [checkConnection, isReconnecting, attemptReconnect]);

  // Calculate status based on last_seen_at
  const getStatus = (): "active" | "recent" | "offline" | "reconnecting" => {
    if (isReconnecting) return "reconnecting";
    if (!lastSeenAt) return "offline";
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;

    if (diffSeconds < 30) return "active";
    if (diffSeconds < 300) return "recent";
    return "offline";
  };

  const status = getStatus();
  const isConnected = status === "active" || status === "recent";

  return { 
    isConnected, 
    lastSeenAt, 
    status, 
    isLoading, 
    isReconnecting, 
    retryCount,
    manualReconnect 
  };
}

// Re-export for backwards compatibility
export { useGPSConnectionStatus as useTraccarConnectionStatus };
