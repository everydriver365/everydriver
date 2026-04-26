import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceCalendarStatus {
  connected: boolean;
  calendarId?: string;
  lastSync?: string | null;
  externalEventCount?: number;
  provider?: string;
}

interface ServiceConfig {
  configured: boolean;
  serviceAccountEmail?: string;
  error?: string;
}

export function useGoogleServiceCalendar(instructorId: string) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<ServiceCalendarStatus | null>(null);
  const [config, setConfig] = useState<ServiceConfig | null>(null);

  // Fetch service account config
  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "getConfig" },
      });

      if (error) {
        console.error("Error fetching config:", error);
        setConfig({ configured: false, error: "Failed to fetch configuration" });
        return;
      }

      setConfig(data);
    } catch (err) {
      console.error("Error fetching config:", err);
      setConfig({ configured: false, error: "Failed to fetch configuration" });
    }
  }, []);

  // Check connection status
  const checkConnection = useCallback(async () => {
    if (!instructorId) return;

    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "checkConnection", instructorId },
      });

      if (error) {
        console.error("Error checking connection:", error);
        setStatus({ connected: false });
      } else {
        setStatus(data);
      }
    } catch (err) {
      console.error("Error checking connection:", err);
      setStatus({ connected: false });
    } finally {
      setIsChecking(false);
    }
  }, [instructorId]);

  // Test calendar access
  const testConnection = useCallback(async (calendarId: string) => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "testConnection", calendarId },
      });

      if (error) {
        toast.error("Failed to test connection");
        return { success: false, error: "Failed to test connection" };
      }

      if (data.success) {
        toast.success("Calendar access verified!");
      } else {
        toast.error(data.error || "Access denied");
      }

      return data;
    } catch (err) {
      console.error("Error testing connection:", err);
      toast.error("Failed to test connection");
      return { success: false, error: "Failed to test connection" };
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Save connection
  const saveConnection = useCallback(async (calendarId: string) => {
    if (!instructorId) {
      toast.error("Instructor ID required");
      return false;
    }

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "saveConnection", instructorId, calendarId },
      });

      if (error || !data.success) {
        toast.error(data?.error || "Failed to save connection");
        return false;
      }

      toast.success("Google Calendar connected successfully!");
      await checkConnection();
      
      // Trigger initial sync
      await syncExternalEvents();
      
      return true;
    } catch (err) {
      console.error("Error saving connection:", err);
      toast.error("Failed to connect calendar");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [instructorId, checkConnection]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (!instructorId) return false;

    try {
      const { error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "disconnect", instructorId },
      });

      if (error) {
        toast.error("Failed to disconnect calendar");
        return false;
      }

      toast.success("Google Calendar disconnected");
      setStatus({ connected: false });
      return true;
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error("Failed to disconnect calendar");
      return false;
    }
  }, [instructorId]);

  // Sync external events
  const syncExternalEvents = useCallback(async () => {
    if (!instructorId) return null;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "fetchExternalEvents", instructorId },
      });

      if (error) {
        console.error("Error syncing events:", error);
        toast.error("Failed to sync calendar events");
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      toast.success(`Synced ${data.synced} events from Google Calendar`);
      await checkConnection();
      return data;
    } catch (err) {
      console.error("Error syncing events:", err);
      toast.error("Failed to sync calendar events");
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [instructorId, checkConnection]);

  // Re-sync a date range and return diff (added/removed events)
  const resyncRange = useCallback(
    async (from: Date, to: Date) => {
      if (!instructorId) return null;
      setIsSyncing(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-calendar-service", {
          body: {
            action: "resyncRange",
            instructorId,
            fromDate: from.toISOString(),
            toDate: to.toISOString(),
          },
        });
        if (error) {
          toast.error("Failed to re-sync range");
          return null;
        }
        if (data?.error) {
          toast.error(data.error);
          return null;
        }
        const a = data?.counts?.added ?? 0;
        const r = data?.counts?.removed ?? 0;
        toast.success(`Re-sync complete · +${a} added · −${r} removed`);
        await checkConnection();
        return data as {
          success: boolean;
          range: { from: string; to: string };
          counts: { added: number; removed: number; unchanged: number };
          added: Array<{ id: string; title: string; start: string; end: string; location: string | null }>;
          removed: Array<{ id: string; title: string; start: string; end: string; location: string | null }>;
        };
      } catch (err) {
        console.error("Error re-syncing range:", err);
        toast.error("Failed to re-sync range");
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [instructorId, checkConnection]
  );

  return {
    isConnecting,
    isTesting,
    isChecking,
    isSyncing,
    status,
    config,
    fetchConfig,
    checkConnection,
    testConnection,
    saveConnection,
    disconnect,
    syncExternalEvents,
    resyncRange,
  };
}