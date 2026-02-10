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

  const retryCountRef = useRef(0);
  const wasConnectedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onReconnectedRef = useRef(onReconnected);
  const onMaxRetriesRef = useRef(onMaxRetriesReached);

  useEffect(() => { onReconnectedRef.current = onReconnected; }, [onReconnected]);
  useEffect(() => { onMaxRetriesRef.current = onMaxRetriesReached; }, [onMaxRetriesReached]);

  // Check if device has recent data (within 60s = active, within 30min = idle but linked)
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!instructorId) return false;
    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("last_seen_at")
        .eq("instructor_id", instructorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.last_seen_at) {
        const diffSeconds = (Date.now() - new Date(data.last_seen_at).getTime()) / 1000;
        // Consider "connected" if data received within 2 minutes
        return diffSeconds < 120;
      }
      return false;
    } catch {
      return false;
    }
  }, [instructorId]);

  // Monitor connection — only reconnect if we WERE connected and lost it
  useEffect(() => {
    if (!enabled || !instructorId) return;

    const monitor = async () => {
      const connected = await checkConnection();

      if (connected) {
        // If we were reconnecting, we've recovered
        if (isReconnecting) {
          setIsReconnecting(false);
          retryCountRef.current = 0;
          setRetryCount(0);
          onReconnectedRef.current?.();
        }
        wasConnectedRef.current = true;
        setLastSuccessfulConnection(new Date());
        return;
      }

      // Only trigger reconnection if we previously HAD a connection
      // Don't reconnect if the tracker has simply never been online this session
      if (!wasConnectedRef.current) return;
      if (isReconnecting) return; // Already reconnecting

      // Connection was lost — start reconnecting
      setIsReconnecting(true);
      retryCountRef.current = 0;
      setRetryCount(0);
    };

    monitor();
    const interval = setInterval(monitor, 15000); // Check every 15s

    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [enabled, instructorId, checkConnection, isReconnecting]);

  // Reconnection loop — separate from monitoring
  useEffect(() => {
    if (!isReconnecting) return;

    const tryReconnect = async () => {
      const connected = await checkConnection();
      if (connected) {
        setIsReconnecting(false);
        retryCountRef.current = 0;
        setRetryCount(0);
        setLastSuccessfulConnection(new Date());
        onReconnectedRef.current?.();
        return;
      }

      if (retryCountRef.current >= maxRetries) {
        setIsReconnecting(false);
        onMaxRetriesRef.current?.();
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      console.log(`[GPS Auto-Reconnect] Retry ${retryCountRef.current + 1}/${maxRetries} in ${delay}ms`);

      retryTimeoutRef.current = setTimeout(() => {
        retryCountRef.current++;
        setRetryCount(retryCountRef.current);
        tryReconnect();
      }, delay);
    };

    tryReconnect();

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [isReconnecting, maxRetries, checkConnection]);

  const manualReconnect = useCallback(() => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    wasConnectedRef.current = true; // Force reconnection attempt
    retryCountRef.current = 0;
    setRetryCount(0);
    setIsReconnecting(true);
  }, []);

  const cancelReconnect = useCallback(() => {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    setIsReconnecting(false);
    retryCountRef.current = 0;
    setRetryCount(0);
  }, []);

  return {
    isReconnecting,
    retryCount,
    lastSuccessfulConnection,
    manualReconnect,
    cancelReconnect,
  };
}
