import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GPSAutoReconnectOptions {
  instructorId: string | null;
  enabled?: boolean;
  maxRetries?: number;
  onReconnected?: () => void;
  onMaxRetriesReached?: () => void;
}

interface GPSAutoReconnectReturn {
  isReconnecting: boolean;
  retryCount: number;
  lastSuccessfulConnection: Date | null;
  manualReconnect: () => void;
  cancelReconnect: () => void;
}

// Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
const getBackoffDelay = (retryCount: number): number => {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay;
};

export function useGPSAutoReconnect(options: GPSAutoReconnectOptions): GPSAutoReconnectReturn {
  const {
    instructorId,
    enabled = true,
    maxRetries = 5,
    onReconnected,
    onMaxRetriesReached,
  } = options;

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Request wake lock to prevent device sleep during reconnection
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('[GPS Auto-Reconnect] Wake lock acquired');
      } catch (err) {
        console.log('[GPS Auto-Reconnect] Wake lock not available:', err);
      }
    }
  };

  // Release wake lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('[GPS Auto-Reconnect] Wake lock released');
    }
  };

  // Check GPS connection status
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!instructorId) return false;

    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .select("last_seen_at")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data?.last_seen_at) {
        const lastSeen = new Date(data.last_seen_at);
        const now = new Date();
        const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
        
        // Connected if last seen within 5 minutes
        return diffSeconds < 300;
      }
      return false;
    } catch (err) {
      console.error('[GPS Auto-Reconnect] Connection check failed:', err);
      return false;
    }
  }, [instructorId]);

  // Attempt reconnection with exponential backoff
  const attemptReconnect = useCallback(async () => {
    if (!enabled || !instructorId) return;

    setIsReconnecting(true);
    await requestWakeLock();

    const isConnected = await checkConnection();

    if (isConnected) {
      // Successfully reconnected
      setIsReconnecting(false);
      setRetryCount(0);
      setLastSuccessfulConnection(new Date());
      setWasOffline(false);
      releaseWakeLock();
      onReconnected?.();
      console.log('[GPS Auto-Reconnect] Connection restored');
      return;
    }

    // Failed to reconnect, schedule retry
    if (retryCount < maxRetries) {
      const delay = getBackoffDelay(retryCount);
      console.log(`[GPS Auto-Reconnect] Retry ${retryCount + 1}/${maxRetries} in ${delay}ms`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        attemptReconnect();
      }, delay);
    } else {
      // Max retries reached
      setIsReconnecting(false);
      releaseWakeLock();
      onMaxRetriesReached?.();
      console.log('[GPS Auto-Reconnect] Max retries reached');
    }
  }, [enabled, instructorId, retryCount, maxRetries, checkConnection, onReconnected, onMaxRetriesReached]);

  // Monitor connection status
  useEffect(() => {
    if (!enabled || !instructorId) return;

    const monitorConnection = async () => {
      const isConnected = await checkConnection();
      
      if (isConnected) {
        if (wasOffline) {
          setLastSuccessfulConnection(new Date());
          setWasOffline(false);
        } else if (!lastSuccessfulConnection) {
          setLastSuccessfulConnection(new Date());
        }
      } else if (!wasOffline && !isReconnecting) {
        // Just went offline, start reconnection
        setWasOffline(true);
        attemptReconnect();
      }
    };

    // Check every 10 seconds
    const interval = setInterval(monitorConnection, 10000);
    monitorConnection(); // Initial check

    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      releaseWakeLock();
    };
  }, [enabled, instructorId, checkConnection, wasOffline, isReconnecting, attemptReconnect, lastSuccessfulConnection]);

  // Manual reconnect trigger
  const manualReconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setRetryCount(0);
    attemptReconnect();
  }, [attemptReconnect]);

  // Cancel reconnection attempts
  const cancelReconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setIsReconnecting(false);
    setRetryCount(0);
    releaseWakeLock();
  }, []);

  return {
    isReconnecting,
    retryCount,
    lastSuccessfulConnection,
    manualReconnect,
    cancelReconnect,
  };
}
