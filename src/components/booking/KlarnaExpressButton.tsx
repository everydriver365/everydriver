import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Klarna Live Client Identifier (client-side only, no server session needed)
const KLARNA_CLIENT_ID = "klarna_live_client_YyNvRz94c2R5ZVBBTktrdi16by9CZ3NjNzVqelI4UzYsMzY4NDE1Y2ItMzE2ZS00OWJkLWExZjgtNDQyMmM1OTBmNGIxLDEsU1poL1djaHR1ZllHRFZuT1ZsemZlYVNXNDNXU2NpK1JZTlhoMVpzMGFubz0";

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

// Access Klarna from window without global type declaration to avoid conflicts
const getKlarnaButtons = () => {
  const klarna = (window as any).Klarna;
  return klarna?.Payments?.Buttons;
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
  const [status, setStatus] = useState<'loading' | 'ready' | 'visible' | 'error' | 'processing'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initAttemptedRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  const amountInMinorUnits = Math.round(amount * 100);

  // Order payload for Klarna - fully client-side
  const orderPayload = {
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
    merchant_reference1: merchantReference,
  };

  const initializeKlarnaButton = useCallback(() => {
    if (!containerRef.current) {
      console.log("Klarna: Container not ready");
      return false;
    }

    const klarnaButtons = getKlarnaButtons();
    if (!klarnaButtons) {
      console.error("Klarna Payments Buttons not available on window. Klarna object:", (window as any).Klarna);
      setErrorMessage("Klarna SDK not loaded");
      setStatus('error');
      return false;
    }

    console.log("Klarna: Initializing with client_id, amount:", amount, "minor units:", amountInMinorUnits);

    try {
      const instance = klarnaButtons.init({
        client_id: KLARNA_CLIENT_ID,
      });

      console.log("Klarna: Instance created, calling load...");

      instance.load(
        {
          container: containerRef.current,
          theme: "default",
          shape: "default",
          locale: "en-GB",
          on_click: (authorize: any) => {
            console.log("Klarna: Button clicked, authorizing with payload:", orderPayload);
            setStatus('processing');
            
            authorize(
              { 
                auto_finalize: true, 
                collect_shipping_address: false 
              },
              orderPayload,
              (result: any) => {
                console.log("Klarna authorization result:", JSON.stringify(result, null, 2));
                
                if (result.approved && result.authorization_token) {
                  console.log("Klarna: Payment approved with token:", result.authorization_token.substring(0, 20) + "...");
                  onSuccess(result.authorization_token, merchantReference);
                } else if (result.error) {
                  console.error("Klarna authorization error:", result.error);
                  setStatus('visible');
                  const errorMsg = typeof result.error === 'object' 
                    ? result.error.message || JSON.stringify(result.error)
                    : String(result.error);
                  onError(errorMsg);
                } else {
                  console.log("Klarna: Payment cancelled or declined, result:", result);
                  setStatus('visible');
                  onCancel();
                }
              }
            );
          },
        },
        (loadResult: any) => {
          console.log("Klarna button load result:", JSON.stringify(loadResult, null, 2));
          if (loadResult?.show_button) {
            console.log("Klarna: Button ready to display");
            setStatus('visible');
          } else {
            // Check if amount is within Klarna's limits (£35 - £1000 for Pay in 3)
            const amountGBP = amount;
            let reason = "Order not eligible for Klarna";
            if (amountGBP < 35) {
              reason = `Minimum £35 required (current: £${amountGBP.toFixed(2)})`;
            } else if (amountGBP > 1000) {
              reason = `Maximum £1,000 allowed (current: £${amountGBP.toFixed(2)})`;
            }
            console.warn("Klarna: Button not shown.", reason, "Load result:", loadResult);
            setErrorMessage(reason);
            setStatus('error');
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
  }, [amount, amountInMinorUnits, merchantReference, onSuccess, onError, onCancel, orderPayload]);

  // Load SDK
  useEffect(() => {
    if (sdkLoadedRef.current) return;
    sdkLoadedRef.current = true;

    // Check if SDK is already loaded
    if (getKlarnaButtons()) {
      console.log("Klarna SDK already available");
      setStatus('ready');
      return;
    }

    // Set up async callback
    (window as any).klarnaAsyncCallback = () => {
      console.log("Klarna SDK loaded via async callback");
      setStatus('ready');
    };

    // Remove existing script if any
    const existingScript = document.querySelector('script[src*="klarnacdn.net/kp/lib"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = "https://x.klarnacdn.net/kp/lib/v1/api.js";
    script.defer = true;
    script.async = true;

    script.onload = () => {
      console.log("Klarna script onload fired");
      // Give SDK time to initialize
      setTimeout(() => {
        if (getKlarnaButtons()) {
          console.log("Klarna Payments Buttons now available");
          setStatus('ready');
        } else {
          console.error("Klarna SDK loaded but Payments.Buttons not available");
          setErrorMessage("Klarna initialization failed");
          setStatus('error');
        }
      }, 500);
    };

    script.onerror = () => {
      console.error("Failed to load Klarna SDK script");
      setErrorMessage("Failed to load Klarna");
      setStatus('error');
    };

    document.head.appendChild(script);

    return () => {
      delete (window as any).klarnaAsyncCallback;
    };
  }, []);

  // Initialize button when SDK is ready AND container exists
  useEffect(() => {
    if (status === 'ready' && containerRef.current && !initAttemptedRef.current) {
      initAttemptedRef.current = true;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          initializeKlarnaButton();
        }, 100);
      });
    }
  }, [status, initializeKlarnaButton]);

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
      
      {/* Klarna button container - SDK renders button here */}
      <div 
        ref={containerRef}
        className="w-full min-h-[56px]"
        style={{ display: status === 'visible' ? 'block' : 'none' }}
      />
      
      {/* Loading state while SDK loads or initializes */}
      {(status === 'loading' || status === 'ready') && (
        <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading Klarna...
        </Button>
      )}
    </div>
  );
}
