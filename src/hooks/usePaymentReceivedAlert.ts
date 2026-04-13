import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";

/**
 * Subscribes to realtime INSERT events on payment_history
 * for the given instructor, shows an in-app toast, and
 * invalidates payment-related queries so dashboards update.
 */
export function usePaymentReceivedAlert(instructorId?: string) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    "payment_history",
    "INSERT",
    async (payload) => {
      const row = payload.new as {
        amount?: number;
        pupil_id?: string;
        payment_method?: string;
        instructor_id?: string;
      };

      // Only process if this payment is for our instructor
      if (row.instructor_id && row.instructor_id !== instructorId) return;

      // Invalidate all payment/earnings queries so figures refresh
      queryClient.invalidateQueries({ queryKey: ["daily-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["recent-payments"] });
      queryClient.invalidateQueries({ queryKey: ["pupil-balance"] });

      let pupilName = "a pupil";
      if (row.pupil_id) {
        // @ts-ignore - deep type workaround
        const { data } = await supabase
          .from("pupils")
          .select("name")
          .eq("id", row.pupil_id)
          .maybeSingle();
        if (data?.name) pupilName = data.name;
      }

      const amount = row.amount ? `£${Number(row.amount).toFixed(2)}` : "Payment";
      toast.success(`💰 ${amount} received from ${pupilName}`, {
        duration: 8000,
        description: row.payment_method
          ? `Via ${row.payment_method.replace(/_/g, " ")}`
          : undefined,
      });
    },
    {
      filter: instructorId ? `instructor_id=eq.${instructorId}` : undefined,
      enabled: !!instructorId,
    }
  );
}
