import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalendarStatus {
  connected: boolean;
  calendarName?: string;
  calendarId?: string;
  lastExternalSync?: string | null;
  externalEventCount?: number;
  webhookActive?: boolean;
  webhookExpiration?: string | null;
}

export function useGoogleCalendar(instructorId: string) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingUpWebhook, setIsSettingUpWebhook] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!instructorId) return;
    
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
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
      
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "getAuthUrl", instructorId, redirectUri },
      });

      if (error) {
        if (error.message?.includes("503") || data?.error?.includes("not configured")) {
          toast.error("Google Calendar integration not yet configured. Please add your API credentials.");
        } else {
          toast.error("Failed to start calendar connection");
        }
        return null;
      }

      return data.authUrl;
    } catch (err) {
      console.error("Error getting auth URL:", err);
      toast.error("Failed to connect to Google Calendar");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [instructorId]);

  const handleAuthCallback = useCallback(async (code: string) => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/instructor/settings?calendar_callback=true`;
      
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "exchangeCode", code, instructorId, redirectUri },
      });

      if (error || data?.error) {
        toast.error("Failed to connect calendar: " + (data?.error || error?.message));
        return false;
      }

      toast.success("Google Calendar connected successfully!");
      
      // Auto-setup webhook for real-time sync
      await setupWebhook();
      
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
      // Stop webhook first
      await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "stopWebhook", instructorId },
      });

      const { error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "disconnect", instructorId },
      });

      if (error) {
        toast.error("Failed to disconnect calendar");
        return false;
      }

      toast.success("Google Calendar disconnected");
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
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "fetchExternalEvents", instructorId },
      });

      if (error) {
        console.error("Error syncing external events:", error);
        toast.error("Failed to sync calendar events");
        return null;
      }

      toast.success(`Synced ${data.synced} events from Google Calendar`);
      
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

  const setupWebhook = useCallback(async () => {
    if (!instructorId) return null;

    setIsSettingUpWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "setupWebhook", instructorId },
      });

      if (error) {
        console.error("Error setting up webhook:", error);
        toast.error("Failed to enable real-time sync");
        return null;
      }

      if (data.success) {
        toast.success("Real-time sync enabled!");
        await checkConnection();
      } else {
        toast.error("Failed to enable real-time sync");
      }

      return data;
    } catch (err) {
      console.error("Error setting up webhook:", err);
      toast.error("Failed to enable real-time sync");
      return null;
    } finally {
      setIsSettingUpWebhook(false);
    }
  }, [instructorId, checkConnection]);

  const stopWebhook = useCallback(async () => {
    if (!instructorId) return false;

    try {
      const { error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { action: "stopWebhook", instructorId },
      });

      if (error) {
        toast.error("Failed to disable real-time sync");
        return false;
      }

      toast.success("Real-time sync disabled");
      await checkConnection();
      return true;
    } catch (err) {
      console.error("Error stopping webhook:", err);
      toast.error("Failed to disable real-time sync");
      return false;
    }
  }, [instructorId, checkConnection]);

  return {
    isConnecting,
    isChecking,
    isSyncing,
    isSettingUpWebhook,
    calendarStatus,
    checkConnection,
    getAuthUrl,
    handleAuthCallback,
    disconnect,
    syncExternalEvents,
    setupWebhook,
    stopWebhook,
  };
}
