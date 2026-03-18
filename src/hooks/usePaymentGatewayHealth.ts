import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GatewayStatus {
  available: boolean;
  configured: boolean;
  error?: string;
}

interface PaymentHealthResponse {
  clearpay: GatewayStatus;
  klarna: GatewayStatus;
  npi: GatewayStatus;
  square: GatewayStatus;
  elavon: GatewayStatus;
  gocardless: GatewayStatus;
}

const defaultHealth: PaymentHealthResponse = {
  clearpay: { available: false, configured: false },
  klarna: { available: false, configured: false },
  npi: { available: false, configured: false },
  square: { available: false, configured: false },
  elavon: { available: false, configured: false },
  gocardless: { available: false, configured: false },
};

export function usePaymentGatewayHealth() {
  const [health, setHealth] = useState<PaymentHealthResponse>(defaultHealth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const { data, error } = await supabase.functions.invoke("payment-health");
        
        if (error) {
          console.error("Payment health check failed:", error);
          setLoading(false);
          return;
        }

        if (data) {
          setHealth({
            clearpay: data.clearpay || defaultHealth.clearpay,
            klarna: data.klarna || defaultHealth.klarna,
            npi: data.npi || defaultHealth.npi,
            square: data.square || defaultHealth.square,
            elavon: data.elavon || defaultHealth.elavon,
            gocardless: data.gocardless || defaultHealth.gocardless,
          });
        }
      } catch (err) {
        console.error("Payment health check error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();
  }, []);

  return { health, loading };
}
