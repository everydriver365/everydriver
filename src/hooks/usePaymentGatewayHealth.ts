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
}

const defaultHealth: PaymentHealthResponse = {
  clearpay: { available: true, configured: true }, // Confirmed working
  klarna: { available: false, configured: true, error: "Credentials issue" },
  npi: { available: true, configured: true }, // Confirmed working
  square: { available: false, configured: true, error: "Credentials issue" },
};

export function usePaymentGatewayHealth() {
  const [health, setHealth] = useState<PaymentHealthResponse>(defaultHealth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("payment-health");
        
        if (error) {
          console.warn("Payment health check failed:", error);
          setHealth(defaultHealth);
        } else if (data) {
          setHealth(data as PaymentHealthResponse);
        }
      } catch (err) {
        console.warn("Payment health check error:", err);
        setHealth(defaultHealth);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return { health, loading };
}
