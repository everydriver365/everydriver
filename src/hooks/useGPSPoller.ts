import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseGPSPollerOptions {
  enabled: boolean;
  intervalMs?: number;
  onData?: (data: GPSPollerResult) => void;
  onError?: (error: Error) => void;
}

interface GPSPollerResult {
  success: boolean;
  processed: number;
  skipped: number;
  total_users?: number;
  total_positions?: number;
  registered_devices: number;
}

export function useGPSPoller({
  enabled,
  intervalMs = 5000, // 5 seconds default for faster map updates
  onData,
  onError,
}: UseGPSPollerOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  
  // Store callbacks in refs to prevent effect restarts when they change
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);
  
  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onDataRef.current = onData;
    onErrorRef.current = onError;
  }, [onData, onError]);

  // Stable poll function that doesn't depend on callback identity
  const poll = useCallback(async () => {
    if (isPollingRef.current) {
      console.log("[GPSPoller] Skipping - previous poll still running");
      return;
    }

    isPollingRef.current = true;
    
    try {
      // Use GPSgate poller only
      const { data, error } = await supabase.functions.invoke<GPSPollerResult>(
        "gpsgate-poller"
      );

      if (error) {
        console.error("[GPSPoller] Error:", error);
        onErrorRef.current?.(new Error(typeof error === 'string' ? error : error.message || 'Unknown error'));
        return;
      }

      if (data) {
        console.log(`[GPSPoller] Processed: ${data.processed}, Skipped: ${data.skipped}`);
        onDataRef.current?.(data);
      }
    } catch (err) {
      console.error("[GPSPoller] Fetch error:", err);
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      isPollingRef.current = false;
    }
  }, []); // No dependencies - uses refs for callbacks

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll immediately on enable
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, poll]);

  return { poll };
}
