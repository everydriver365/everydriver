import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Subscribes to realtime INSERT events on payment_history
 * for the given instructor and shows an in-app toast.
 */
export function usePaymentReceivedAlert(instructorId?: string) {
  useEffect(() => {
    if (!instructorId) return;

    const channel = supabase
      .channel(`payment-alerts-${instructorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "payment_history",
          filter: `instructor_id=eq.${instructorId}`,
        },
        async (payload) => {
          const row = payload.new as {
            amount?: number;
            pupil_id?: string;
            payment_method?: string;
          };

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instructorId]);
}
