import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalendarStatus {
  connected: boolean;
  calendarName?: string;
  calendarId?: string;
}

export function useGoogleCalendar(instructorId: string) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

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

  return {
    isConnecting,
    isChecking,
    calendarStatus,
    checkConnection,
    getAuthUrl,
    handleAuthCallback,
    disconnect,
  };
}
