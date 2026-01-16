import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KlarnaExpressButtonProps {
  amount: number;
  currency?: string;
  merchantReference: string;
  orderDescription: string;
  onSuccess: (authorizationToken: string, orderId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

interface KlarnaPayments {
  init: (config: { client_token: string }) => void;
  load: (
    options: { container: string; payment_method_category?: string },
    data: any,
    callback: (result: { show_form: boolean; error?: any }) => void
  ) => void;
  authorize: (
    options: { payment_method_category?: string },
    data: any,
    callback: (result: { approved?: boolean; authorization_token?: string; show_form?: boolean; error?: any }) => void
  ) => void;
}

const getKlarnaPayments = (): KlarnaPayments | undefined => {
  return (window as any).Klarna?.Payments as KlarnaPayments | undefined;
};

export function KlarnaExpressButton({
  amount,
  currency = "GBP",
  merchantReference,
  orderDescription,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: KlarnaExpressButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'initializing' | 'ready' | 'visible' | 'error' | 'processing'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const initAttemptedRef = useRef(false);
  const sdkLoadedRef = useRef(false);
  const sessionCreatedRef = useRef(false);

  const amountInMinorUnits = Math.round(amount * 100);

  // Create server-side session to get client_token
  const createSession = useCallback(async () => {
    if (sessionCreatedRef.current) return;
    sessionCreatedRef.current = true;

    console.log("Creating Klarna session via edge function...");
    setStatus('initializing');

    try {
      const { data, error } = await supabase.functions.invoke('klarna-session', {
        body: {
          amount,
          currency,
          merchantReference,
          orderDescription,
        },
      });

      if (error) {
        console.error("Session creation failed:", error);
        setErrorMessage("Failed to initialize Klarna");
        setStatus('error');
        return;
      }

      if (data?.client_token) {
        console.log("Got client token, initializing Klarna SDK...");
        setClientToken(data.client_token);
        setStatus('ready');
      } else {
        console.error("No client token in response:", data);
        setErrorMessage(data?.error || "Klarna not available");
        setStatus('error');
      }
    } catch (err) {
      console.error("Session error:", err);
      setErrorMessage("Failed to connect to Klarna");
      setStatus('error');
    }
  }, [amount, currency, merchantReference, orderDescription]);

  // Initialize Klarna widget with client_token
  const initializeKlarnaWidget = useCallback(() => {
    if (!containerRef.current || !clientToken) {
      console.log("Container or token not ready");
      return false;
    }

    const klarnaPayments = getKlarnaPayments();
    if (!klarnaPayments) {
      console.error("Klarna Payments not available");
      setErrorMessage("Klarna not available");
      setStatus('error');
      return false;
    }

    console.log("Initializing Klarna with client token...");

    try {
      // Initialize with client token from session
      klarnaPayments.init({ client_token: clientToken });

      // Load the payment widget
      klarnaPayments.load(
        {
          container: "#klarna-payments-container",
          payment_method_category: "pay_later",
        },
        {},
        (result) => {
          console.log("Klarna load result:", result);
          if (result.show_form) {
            setStatus('visible');
          } else if (result.error) {
            console.error("Klarna load error:", result.error);
            setErrorMessage("Klarna not available for this purchase");
            setStatus('error');
          } else {
            // Try pay_over_time as fallback
            klarnaPayments.load(
              {
                container: "#klarna-payments-container",
                payment_method_category: "pay_over_time",
              },
              {},
              (result2) => {
                if (result2.show_form) {
                  setStatus('visible');
                } else {
                  setErrorMessage("Klarna not available");
                  setStatus('error');
                }
              }
            );
          }
        }
      );
      return true;
    } catch (error) {
      console.error("Error initializing Klarna:", error);
      setErrorMessage("Failed to initialize Klarna");
      setStatus('error');
      return false;
    }
  }, [clientToken]);

  // Handle authorize button click
  const handleAuthorize = useCallback(() => {
    const klarnaPayments = getKlarnaPayments();
    if (!klarnaPayments) {
      onError("Klarna not available");
      return;
    }

    setStatus('processing');
    console.log("Authorizing Klarna payment...");

    const orderData = {
      purchase_country: "GB",
      purchase_currency: currency,
      locale: "en-GB",
      order_amount: amountInMinorUnits,
      order_tax_amount: 0,
      order_lines: [
        {
          type: "digital",
          reference: merchantReference,
          name: orderDescription.substring(0, 255),
          quantity: 1,
          unit_price: amountInMinorUnits,
          tax_rate: 0,
          total_amount: amountInMinorUnits,
          total_tax_amount: 0,
        },
      ],
    };

    klarnaPayments.authorize(
      {},
      orderData,
      (result) => {
        console.log("Klarna authorize result:", result);
        if (result.approved && result.authorization_token) {
          onSuccess(result.authorization_token, merchantReference);
        } else if (result.show_form) {
          // User needs to complete something in the form
          setStatus('visible');
        } else if (result.error) {
          setStatus('visible');
          onError(result.error?.message || "Payment authorization failed");
        } else {
          setStatus('visible');
          onCancel();
        }
      }
    );
  }, [currency, amountInMinorUnits, merchantReference, orderDescription, onSuccess, onError, onCancel]);

  // Load SDK
  useEffect(() => {
    if (sdkLoadedRef.current) return;
    sdkLoadedRef.current = true;

    // Check if SDK is already loaded
    if (getKlarnaPayments()) {
      console.log("Klarna Payments SDK already available");
      createSession();
      return;
    }

    // Remove existing script
    const existingScript = document.querySelector('script[src*="klarnacdn.net/kp/lib"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = "https://x.klarnacdn.net/kp/lib/v1/api.js";
    script.defer = true;
    script.async = true;

    script.onload = () => {
      console.log("Klarna SDK loaded");
      setTimeout(() => {
        if (getKlarnaPayments()) {
          createSession();
        } else {
          setErrorMessage("Klarna SDK failed to initialize");
          setStatus('error');
        }
      }, 300);
    };

    script.onerror = () => {
      console.error("Failed to load Klarna SDK");
      setErrorMessage("Failed to load Klarna");
      setStatus('error');
    };

    document.head.appendChild(script);
  }, [createSession]);

  // Initialize widget when SDK is ready AND we have client token
  useEffect(() => {
    if (status === 'ready' && clientToken && containerRef.current && !initAttemptedRef.current) {
      initAttemptedRef.current = true;
      requestAnimationFrame(() => {
        initializeKlarnaWidget();
      });
    }
  }, [status, clientToken, initializeKlarnaWidget]);

  if (disabled) {
    return (
      <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black opacity-50">
        <img 
          src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" 
          alt="Klarna" 
          className="h-6 mr-2"
        />
        Pay with Klarna
      </Button>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full text-center">
        <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black opacity-50">
          <img 
            src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" 
            alt="Klarna" 
            className="h-6 mr-2"
          />
          Klarna unavailable
        </Button>
        {errorMessage && (
          <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {status === 'processing' && (
        <div className="flex items-center justify-center p-4 bg-[#FFB3C7]/20 rounded-lg mb-2">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#FFB3C7]" />
          <span className="text-sm">Processing with Klarna...</span>
        </div>
      )}
      
      {/* Klarna widget container */}
      <div 
        id="klarna-payments-container"
        ref={containerRef}
        className="w-full min-h-[100px]"
        style={{ display: status === 'visible' ? 'block' : 'none' }}
      />
      
      {/* Authorize button when widget is visible */}
      {status === 'visible' && (
        <Button 
          onClick={handleAuthorize}
          className="w-full h-14 bg-[#FFB3C7] hover:bg-[#FF9AB3] text-black mt-2"
        >
          <img 
            src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" 
            alt="Klarna" 
            className="h-6 mr-2"
          />
          Complete with Klarna
        </Button>
      )}
      
      {/* Loading states */}
      {(status === 'loading' || status === 'initializing' || status === 'ready') && (
        <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {status === 'initializing' ? 'Connecting to Klarna...' : 'Loading Klarna...'}
        </Button>
      )}
    </div>
  );
}