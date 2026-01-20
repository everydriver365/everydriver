import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConnectionStatus {
  connected: boolean;
  email?: string;
  isExpired?: boolean;
  lastSync?: string;
}

export function useGoogleOAuth(instructorId: string) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });

  const checkConnection = useCallback(async () => {
    if (!instructorId) return;
    
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-oauth", {
        body: { action: "checkConnection", instructorId },
      });

      if (error) throw error;
      setStatus(data);
    } catch (err) {
      console.error("Error checking connection:", err);
      setStatus({ connected: false });
    } finally {
      setIsChecking(false);
    }
  }, [instructorId]);

  const connect = useCallback(async () => {
    if (!instructorId) {
      toast.error("Instructor ID not found");
      return;
    }

    setIsConnecting(true);
    try {
      // Pass current origin so backend can redirect back after OAuth
      const returnTo = `${window.location.origin}/instructor/settings`;
      
      const { data, error } = await supabase.functions.invoke("google-oauth", {
        body: { action: "getAuthUrl", instructorId, returnTo },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Failed to get auth URL");
      }

      // Redirect to Google OAuth (callback goes to stable backend URL)
      window.location.href = data.authUrl;
    } catch (err: any) {
      console.error("Error starting OAuth:", err);
      toast.error(err.message || "Failed to start Google connection");
      setIsConnecting(false);
    }
  }, [instructorId]);

  const disconnect = useCallback(async () => {
    if (!instructorId) return false;

    setIsDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-oauth", {
        body: { action: "disconnect", instructorId },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      setStatus({ connected: false });
      toast.success("Google Calendar disconnected");
      return true;
    } catch (err: any) {
      console.error("Error disconnecting:", err);
      toast.error(err.message || "Failed to disconnect");
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, [instructorId]);

  const refreshToken = useCallback(async () => {
    if (!instructorId) return null;

    try {
      const { data, error } = await supabase.functions.invoke("google-oauth", {
        body: { action: "refreshToken", instructorId },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message);
      }

      return data.access_token;
    } catch (err) {
      console.error("Error refreshing token:", err);
      return null;
    }
  }, [instructorId]);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    status,
    isConnecting,
    isChecking,
    isDisconnecting,
    connect,
    disconnect,
    checkConnection,
    refreshToken,
  };
}
