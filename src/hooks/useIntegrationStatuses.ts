import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IntegrationStatusKind } from "@/components/instructor/integrations/IntegrationStatusBadge";

interface IntegrationStatuses {
  googleCalendar: IntegrationStatusKind;
  square: IntegrationStatusKind;
  xero: IntegrationStatusKind;
  googleLastSync: string | null;
  squareMerchantId: string | null;
  refresh: () => void;
}

export function useIntegrationStatuses(
  instructorId: string | undefined,
  instructor: any,
): IntegrationStatuses {
  const [googleCalendar, setGoogleCalendar] = useState<IntegrationStatusKind>("loading");
  const [googleLastSync, setGoogleLastSync] = useState<string | null>(null);

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

  useEffect(() => {
    checkGoogle();
  }, [checkGoogle]);

  const squareMerchantId = (instructor as any)?.square_merchant_id ?? null;
  const square: IntegrationStatusKind = squareMerchantId ? "connected" : "disconnected";
  const xero: IntegrationStatusKind = "available";

  return {
    googleCalendar,
    square,
    xero,
    googleLastSync,
    squareMerchantId,
    refresh: checkGoogle,
  };
}
