import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Klarna Live Client Identifier
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

interface KlarnaPaymentsButtons {
  init: (config: { client_id: string }) => {
    load: (
      options: {
        container: string | HTMLElement;
        theme?: string;
        shape?: string;
        locale?: string;
        on_click: (authorize: (
          params: { auto_finalize: boolean; collect_shipping_address?: boolean },
          payload: any,
          callback: (result: { approved?: boolean; authorization_token?: string; error?: any }) => void
        ) => void) => void;
      },
      callback: (loadResult: { show_button: boolean }) => void
    ) => void;
  };
}

const getKlarnaPaymentsButtons = (): KlarnaPaymentsButtons | undefined => {
  const klarna = (window as any).Klarna;
  return klarna?.Payments?.Buttons as KlarnaPaymentsButtons | undefined;
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
  
  const orderPayload = {
    purchase_country: "GB",
    purchase_currency: currency,
    locale: "en-GB",
    order_amount: amountInMinorUnits,
    order_tax_amount: 0, // VAT-inclusive or exempt services
    order_lines: [
      {
        type: "digital", // Driving lessons are services
        reference: merchantReference,
        name: orderDescription.substring(0, 255), // Max 255 chars
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
      console.log("Container not ready, waiting...");
      return false;
    }

    const klarnaButtons = getKlarnaPaymentsButtons();
    if (!klarnaButtons) {
      console.error("Klarna Payments Buttons not available");
      setErrorMessage("Klarna Payments not available");
      setStatus('error');
      return false;
    }

    console.log("Initializing Klarna button with container element...");

    try {
      klarnaButtons.init({
        client_id: KLARNA_CLIENT_ID,
      }).load(
        {
          container: containerRef.current, // Pass the actual element, not selector
          theme: "default",
          shape: "default",
          locale: "en-GB",
          on_click: (authorize) => {
            console.log("Klarna button clicked, authorizing...");
            setStatus('processing');
            
            authorize(
              { auto_finalize: true, collect_shipping_address: false },
              orderPayload,
              (result) => {
                console.log("Klarna authorization result:", result);
                
                if (result.approved && result.authorization_token) {
                  onSuccess(result.authorization_token, merchantReference);
                } else if (result.error) {
                  setStatus('visible');
                  onError(result.error?.message || "Payment authorization failed");
                } else {
                  setStatus('visible');
                  onCancel();
                }
              }
            );
          },
        },
        (loadResult) => {
          console.log("Klarna button load result:", loadResult);
          const anyResult = loadResult as any;
          const shouldShow = Boolean(anyResult?.show_button ?? anyResult?.show_form);
          if (shouldShow) {
            setStatus('visible');
          } else {
            setErrorMessage("Klarna is not available for this purchase");
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
  }, [amount, currency, merchantReference, orderDescription, onSuccess, onError, onCancel]);

  // Load SDK
  useEffect(() => {
    if (sdkLoadedRef.current) return;
    sdkLoadedRef.current = true;

    // Check if SDK is already loaded
    if (getKlarnaPaymentsButtons()) {
      console.log("Klarna SDK already available");
      setStatus('ready');
      return;
    }

    // Set up async callback
    (window as any).klarnaAsyncCallback = () => {
      console.log("Klarna SDK loaded via async callback");
      setStatus('ready');
    };

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
      console.log("Klarna script onload fired");
      setTimeout(() => {
        if (getKlarnaPaymentsButtons()) {
          setStatus('ready');
        }
      }, 300);
    };

    script.onerror = () => {
      console.error("Failed to load Klarna SDK");
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
      // Small delay to ensure DOM is fully ready
      requestAnimationFrame(() => {
        initializeKlarnaButton();
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
      <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black opacity-50">
        <img 
          src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" 
          alt="Klarna" 
          className="h-6 mr-2"
        />
        Klarna unavailable
      </Button>
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
      
      {/* Always render container for Klarna to mount into */}
      <div 
        ref={containerRef}
        className="w-full min-h-[56px]"
        style={{ display: status === 'visible' ? 'block' : 'none' }}
      />
      
      {/* Show loading state while SDK loads or initializes */}
      {(status === 'loading' || status === 'ready') && (
        <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading Klarna...
        </Button>
      )}
    </div>
  );
}