import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalendarStatus {
  connected: boolean;
  email?: string;
  provider?: string;
  lastSync?: string | null;
  externalEventCount?: number;
}

export function useCalendarSync(instructorId: string) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!instructorId) return;
    
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("nylas-auth", {
        body: { action: "checkConnection", instructorId },
      });

      if (error) {
        console.error("Error checking calendar connection:", error);
        setCalendarStatus({ connected: false });
      } else {
        setCalendarStatus(data);
      }
    } catch (err) {
      console.error("Error checking calendar:", err);
      setCalendarStatus({ connected: false });
    } finally {
      setIsChecking(false);
    }
  }, [instructorId]);

  const getAuthUrl = useCallback(async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/instructor/settings?calendar_callback=true`;
      
      const { data, error } = await supabase.functions.invoke("nylas-auth", {
        body: { action: "getAuthUrl", instructorId, redirectUri },
      });

      if (error) {
        if (error.message?.includes("503") || data?.error?.includes("not configured")) {
          toast.error("Calendar integration not yet configured. Please add your Nylas credentials.");
        } else {
          toast.error("Failed to start calendar connection");
        }
        return null;
      }

      return data.authUrl;
    } catch (err) {
      console.error("Error getting auth URL:", err);
      toast.error("Failed to connect calendar");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [instructorId]);

  const handleAuthCallback = useCallback(async (code: string) => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/instructor/settings?calendar_callback=true`;
      
      const { data, error } = await supabase.functions.invoke("nylas-auth", {
        body: { action: "exchangeCode", code, instructorId, redirectUri },
      });

      if (error || data?.error) {
        toast.error("Failed to connect calendar: " + (data?.error || error?.message));
        return false;
      }

      toast.success(`Calendar connected successfully! (${data.email})`);
      
      // Trigger initial sync
      await syncExternalEvents();
      
      await checkConnection();
      return true;
    } catch (err) {
      console.error("Error exchanging code:", err);
      toast.error("Failed to complete calendar connection");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [instructorId, checkConnection]);

  const disconnect = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke("nylas-auth", {
        body: { action: "disconnect", instructorId },
      });

      if (error) {
        toast.error("Failed to disconnect calendar");
        return false;
      }

      toast.success("Calendar disconnected");
      setCalendarStatus({ connected: false });
      return true;
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error("Failed to disconnect calendar");
      return false;
    }
  }, [instructorId]);

  const syncExternalEvents = useCallback(async () => {
    if (!instructorId) return null;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("nylas-calendar-sync", {
        body: { action: "fetchExternalEvents", instructorId },
      });

      if (error) {
        console.error("Error syncing external events:", error);
        toast.error("Failed to sync calendar events");
        return null;
      }

      toast.success(`Synced ${data.synced} events from your calendar`);
      
      // Refresh connection status to get updated count
      await checkConnection();
      
      return data;
    } catch (err) {
      console.error("Error syncing external events:", err);
      toast.error("Failed to sync calendar events");
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [instructorId, checkConnection]);

  return {
    isConnecting,
    isChecking,
    isSyncing,
    calendarStatus,
    checkConnection,
    getAuthUrl,
    handleAuthCallback,
    disconnect,
    syncExternalEvents,
  };
}
