import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Klarna SDK types (local, not global to avoid conflicts with other Klarna components)
interface KlarnaPaymentsSDK {
  init: (options: { client_token: string }) => void;
  load: (
    options: { container: string; payment_method_category: string },
    callback: (res: { show_form: boolean; error?: { invalid_fields?: string[] } }) => void
  ) => void;
  authorize: (
    options: { payment_method_category: string },
    data: Record<string, unknown>,
    callback: (res: { approved: boolean; authorization_token?: string; show_form?: boolean; error?: { invalid_fields?: string[] } }) => void
  ) => void;
}

// Helper to get Klarna Payments SDK (avoids global type conflicts)
const getKlarnaPayments = (): KlarnaPaymentsSDK | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const klarna = (window as any).Klarna;
  return klarna?.Payments || null;
};

interface KlarnaPaymentProps {
  amount: number;
  currency?: string;
  merchantReference: string;
  orderDescription: string;
  instructorId?: string | null;
  consumer: {
    givenName: string;
    familyName: string;
    email: string;
    phone?: string;
  };
  billing?: {
    streetAddress: string;
    postalCode: string;
    city: string;
    country: string;
  };
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

type PaymentState = "idle" | "loading_session" | "loading_widget" | "ready" | "authorizing" | "capturing" | "error";

export function KlarnaPayment({
  amount,
  currency = "GBP",
  merchantReference,
  orderDescription,
  instructorId,
  consumer,
  billing,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: KlarnaPaymentProps) {
  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{
    clientToken: string;
    sessionId: string;
  } | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkLoadedRef = useRef(false);

  // Load Klarna SDK script
  const loadKlarnaSDK = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (getKlarnaPayments()) {
        resolve();
        return;
      }

      if (sdkLoadedRef.current) {
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (getKlarnaPayments()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Klarna SDK load timeout"));
        }, 10000);
        return;
      }

      sdkLoadedRef.current = true;
      const script = document.createElement("script");
      script.src = "https://x.klarnacdn.net/kp/lib/v1/api.js";
      script.async = true;
      script.onload = () => {
        // Wait for Klarna to be available
        const checkInterval = setInterval(() => {
          if (getKlarnaPayments()) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Klarna SDK not available after load"));
        }, 5000);
      };
      script.onerror = () => reject(new Error("Failed to load Klarna SDK"));
      document.head.appendChild(script);
    });
  }, []);

  // Step 1: Create Klarna session via backend
  const createSession = useCallback(async () => {
    setState("loading_session");
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("klarna-session", {
        body: {
          amount,
          currency,
          merchantReference,
          orderDescription,
          instructorId: instructorId ?? undefined,
          consumer: {
            givenName: consumer.givenName,
            familyName: consumer.familyName,
            email: consumer.email,
            phone: consumer.phone,
          },
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to create Klarna session");
      }

      if (!data?.success || !data?.client_token) {
        throw new Error(data?.error || "Invalid session response");
      }

      console.log("Klarna session created:", data.session_id);
      setSessionData({
        clientToken: data.client_token,
        sessionId: data.session_id,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Session creation failed";
      setError(message);
      setState("error");
      throw err;
    }
  }, [amount, currency, merchantReference, orderDescription, consumer]);

  // Step 2: Initialize SDK and load widget
  const initializeWidget = useCallback(async (clientToken: string) => {
    setState("loading_widget");

    try {
      await loadKlarnaSDK();

      const klarnaPayments = getKlarnaPayments();
      if (!klarnaPayments) {
        throw new Error("Klarna SDK not available");
      }

      // Initialize with client token
      klarnaPayments.init({ client_token: clientToken });

      // Load the payment widget
      klarnaPayments.load(
        {
          container: "#klarna-payment-container",
          payment_method_category: "pay_later", // or "pay_over_time" for Pay in 3
        },
        (res) => {
          if (res.show_form) {
            console.log("Klarna widget loaded successfully");
            setWidgetReady(true);
            setState("ready");
          } else {
            console.error("Klarna widget load error:", res.error);
            setError("Payment option not available for this order");
            setState("error");
          }
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Widget initialization failed";
      setError(message);
      setState("error");
    }
  }, [loadKlarnaSDK]);

  // Step 4: Capture order via backend
  const captureOrder = useCallback(async (authorizationToken: string) => {
    setState("capturing");

    try {
      const amountInMinorUnits = Math.round(amount * 100);

      const { data, error: fnError } = await supabase.functions.invoke("klarna-order", {
        body: {
          authorization_token: authorizationToken,
          order_amount: amountInMinorUnits,
          order_lines: [
            {
              type: "digital",
              reference: merchantReference,
              name: orderDescription.substring(0, 255),
              quantity: 1,
              unit_price: amountInMinorUnits,
              total_amount: amountInMinorUnits,
              tax_rate: 0,
              total_tax_amount: 0,
            },
          ],
          merchant_reference: merchantReference,
          purchase_country: billing?.country || "GB",
          purchase_currency: currency,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to capture order");
      }

      if (!data?.success || !data?.order_id) {
        throw new Error(data?.error || "Order capture failed");
      }

      console.log("Klarna order captured:", data.order_id);
      onSuccess(data.order_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order capture failed";
      setError(message);
      setState("error");
      onError(message);
    }
  }, [amount, currency, merchantReference, orderDescription, billing, onSuccess, onError]);

  // Step 3: Authorize payment (user interaction)
  const authorizePayment = useCallback(() => {
    const klarnaPayments = getKlarnaPayments();
    if (!klarnaPayments || !widgetReady) {
      setError("Klarna not ready");
      return;
    }

    setState("authorizing");

    const billingAddress = billing ? {
      given_name: consumer.givenName,
      family_name: consumer.familyName,
      email: consumer.email,
      phone: consumer.phone || "",
      street_address: billing.streetAddress,
      postal_code: billing.postalCode,
      city: billing.city,
      country: billing.country,
    } : undefined;

    klarnaPayments.authorize(
      { payment_method_category: "pay_later" },
      { billing_address: billingAddress },
      async (res) => {
        if (res.approved && res.authorization_token) {
          console.log("Klarna authorization approved");
          await captureOrder(res.authorization_token);
        } else if (res.show_form === false) {
          // User cancelled or closed the Klarna popup
          console.log("Klarna authorization cancelled by user");
          setState("ready");
          onCancel();
        } else {
          console.error("Klarna authorization failed:", res.error);
          setError("Payment not approved. Please try again.");
          setState("ready");
        }
      }
    );
  }, [widgetReady, consumer, billing, captureOrder, onCancel]);

  // Start the payment flow
  const startPayment = useCallback(async () => {
    try {
      const session = await createSession();
      await initializeWidget(session.client_token);
    } catch (err) {
      console.error("Klarna payment flow error:", err);
    }
  }, [createSession, initializeWidget]);

  // Render based on state
  if (state === "idle") {
    return (
      <Button
        onClick={startPayment}
        disabled={disabled}
        className="w-full bg-[#FFB3C7] hover:bg-[#FF9AB2] text-black font-semibold py-3"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        Pay with Klarna
      </Button>
    );
  }

  if (state === "loading_session" || state === "loading_widget") {
    return (
      <div className="border rounded-lg p-6 bg-muted/30">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#FFB3C7]" />
          <span className="text-sm text-muted-foreground">
            {state === "loading_session" ? "Creating payment session..." : "Loading payment options..."}
          </span>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="border rounded-lg p-6 bg-destructive/10">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setState("idle");
              setError(null);
              setSessionData(null);
              setWidgetReady(false);
            }}
            className="flex-1"
          >
            Try Again
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (state === "authorizing" || state === "capturing") {
    return (
      <div className="border rounded-lg p-6 bg-muted/30">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#FFB3C7]" />
          <span className="text-sm text-muted-foreground">
            {state === "authorizing" ? "Authorizing payment..." : "Completing payment..."}
          </span>
        </div>
      </div>
    );
  }

  // State is "ready" - show widget and authorize button
  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span>Klarna payment ready</span>
      </div>

      {/* Klarna widget container */}
      <div
        id="klarna-payment-container"
        ref={containerRef}
        className="min-h-[100px] bg-white rounded border"
      />

      <div className="flex gap-2">
        <Button
          onClick={authorizePayment}
          disabled={!widgetReady}
          className="flex-1 bg-[#FFB3C7] hover:bg-[#FF9AB2] text-black font-semibold"
        >
          Complete Payment
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="px-4"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
