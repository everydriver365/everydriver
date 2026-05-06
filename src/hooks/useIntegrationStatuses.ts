import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IntegrationStatusKind } from "@/components/instructor/integrations/IntegrationStatusBadge";

export interface TrackerDevice {
  id: string;
  device_name: string | null;
  tracking_provider: string | null;
  is_active: boolean | null;
  last_seen_at: string | null;
}

interface IntegrationStatuses {
  googleCalendar: IntegrationStatusKind;
  square: IntegrationStatusKind;
  xero: IntegrationStatusKind;
  trackers: IntegrationStatusKind;
  googleLastSync: string | null;
  squareMerchantId: string | null;
  trackerDevices: TrackerDevice[];
  refresh: () => void;
}

export function useIntegrationStatuses(
  instructorId: string | undefined,
  instructor: any,
): IntegrationStatuses {
  const [googleCalendar, setGoogleCalendar] = useState<IntegrationStatusKind>("loading");
  const [googleLastSync, setGoogleLastSync] = useState<string | null>(null);
  const [trackers, setTrackers] = useState<IntegrationStatusKind>("loading");
  const [trackerDevices, setTrackerDevices] = useState<TrackerDevice[]>([]);

  const checkGoogle = useCallback(async () => {
    if (!instructorId) return;
    setGoogleCalendar("loading");
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-service", {
        body: { action: "checkConnection", instructorId },
      });
      if (error || !data?.connected) {
        setGoogleCalendar("disconnected");
        setGoogleLastSync(null);
      } else {
        setGoogleCalendar("connected");
        setGoogleLastSync(data?.lastSync ?? null);
      }
    } catch {
      setGoogleCalendar("disconnected");
      setGoogleLastSync(null);
    }
  }, [instructorId]);

  const checkTrackers = useCallback(async () => {
    if (!instructorId) return;
    setTrackers("loading");
    try {
      const { data } = await supabase
        .from("gps_devices")
        .select("id, device_name, tracking_provider, is_active, last_seen_at")
        .eq("instructor_id", instructorId);
      const devices = (data ?? []) as TrackerDevice[];
      setTrackerDevices(devices);
      setTrackers(devices.some((d) => d.is_active !== false) ? "connected" : "disconnected");
    } catch {
      setTrackerDevices([]);
      setTrackers("disconnected");
    }
  }, [instructorId]);

  useEffect(() => {
    checkGoogle();
    checkTrackers();
  }, [checkGoogle, checkTrackers]);

  const squareMerchantId = (instructor as any)?.square_merchant_id ?? null;
  const square: IntegrationStatusKind = squareMerchantId ? "connected" : "disconnected";
  const xero: IntegrationStatusKind = "available";

  return {
    googleCalendar,
    square,
    xero,
    trackers,
    googleLastSync,
    squareMerchantId,
    trackerDevices,
    refresh: () => {
      checkGoogle();
      checkTrackers();
    },
  };
}
