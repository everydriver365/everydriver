import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseTraccarPollerOptions {
  enabled: boolean;
  intervalMs?: number;
  onData?: (data: TraccarPollerResult) => void;
  onError?: (error: Error) => void;
}

interface TraccarPollerResult {
  success: boolean;
  processed: number;
  skipped: number;
  total_positions: number;
  registered_devices: number;
}

export function useTraccarPoller({
  enabled,
  intervalMs = 10000, // 10 seconds default
  onData,
  onError,
}: UseTraccarPollerOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const poll = useCallback(async () => {
    if (isPollingRef.current) {
      console.log("[TraccarPoller] Skipping - previous poll still running");
      return;
    }

    isPollingRef.current = true;
    
    try {
      const { data, error } = await supabase.functions.invoke<TraccarPollerResult>(
        "traccar-poller"
      );

      if (error) {
        console.error("[TraccarPoller] Error:", error);
        onError?.(new Error(error.message));
        return;
      }

      if (data) {
        console.log(`[TraccarPoller] Processed: ${data.processed}, Skipped: ${data.skipped}`);
        onData?.(data);
      }
    } catch (err) {
      console.error("[TraccarPoller] Fetch error:", err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      isPollingRef.current = false;
    }
  }, [onData, onError]);

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
