import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Klarna Live Client Identifier
const KLARNA_CLIENT_ID = "klarna_live_client_YyNvRz94c2R5ZVBBTktrdi16by9CZ3NjNzVqelI4UzYsMzY4NDE1Y2ItMzE2ZS00OWJkLWExZjgtNDQyMmM1OTBmNGIxLDEsU1poL1djaHR1ZllHRFZuT1ZsemZlYVNXNDNXU2NpK1JZTlhoMVpzMGFubz0";

interface KlarnaExpressButtonProps {
  amount: number; // in pounds
  currency?: string;
  merchantReference: string;
  orderDescription: string;
  onSuccess: (authorizationToken: string, orderId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

// Local Klarna type to avoid conflicts with other Klarna declarations
interface KlarnaPaymentsButtons {
  init: (config: { client_id: string }) => {
    load: (
      options: {
        container: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const orderPayload = {
      purchase_country: "GB",
      purchase_currency: currency,
      locale: "en-GB",
      order_amount: Math.round(amount * 100),
      order_lines: [
        {
          type: "physical",
          reference: merchantReference,
          name: orderDescription,
          quantity: 1,
          unit_price: Math.round(amount * 100),
          total_amount: Math.round(amount * 100),
        },
      ],
      merchant_reference1: merchantReference,
    };

    // Define the async callback before loading the script
    (window as any).klarnaAsyncCallback = () => {
      console.log("Klarna SDK loaded, initializing buttons...");
      
      const klarnaButtons = getKlarnaPaymentsButtons();
      if (!klarnaButtons) {
        console.error("Klarna Payments Buttons not available");
        setSdkError("Klarna Payments not available");
        setIsLoading(false);
        return;
      }

      try {
        klarnaButtons.init({
          client_id: KLARNA_CLIENT_ID,
        }).load(
          {
            container: "#klarna-payments-container",
            theme: "default",
            shape: "default",
            locale: "en-GB",
            on_click: (authorize) => {
              console.log("Klarna button clicked, authorizing...");
              setIsProcessing(true);
              
              authorize(
                { auto_finalize: true, collect_shipping_address: false },
                orderPayload,
                (result) => {
                  console.log("Klarna authorization result:", result);
                  setIsProcessing(false);
                  
                  if (result.approved && result.authorization_token) {
                    onSuccess(result.authorization_token, merchantReference);
                  } else if (result.error) {
                    onError(result.error?.message || "Payment authorization failed");
                  } else {
                    onCancel();
                  }
                }
              );
            },
          },
          (loadResult) => {
            console.log("Klarna button load result:", loadResult);
            setIsLoading(false);
            setButtonVisible(loadResult.show_button);
            if (!loadResult.show_button) {
              setSdkError("Klarna is not available for this purchase");
            }
          }
        );
      } catch (error) {
        console.error("Error initializing Klarna:", error);
        setSdkError("Failed to initialize Klarna");
        setIsLoading(false);
      }
    };

    // Load the Klarna script
    const existingScript = document.querySelector('script[src*="klarnacdn.net/kp/lib"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = "https://x.klarnacdn.net/kp/lib/v1/api.js";
    script.defer = true;
    script.async = true;

    script.onerror = () => {
      console.error("Failed to load Klarna SDK");
      setSdkError("Failed to load Klarna");
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      delete (window as any).klarnaAsyncCallback;
    };
  }, [amount, currency, merchantReference, orderDescription, onSuccess, onError, onCancel]);

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

  if (isLoading) {
    return (
      <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading Klarna...
      </Button>
    );
  }

  if (sdkError) {
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
      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-[#FFB3C7]/20 rounded-lg mb-2">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#FFB3C7]" />
          <span className="text-sm">Processing with Klarna...</span>
        </div>
      )}
      <div 
        id="klarna-payments-container" 
        ref={containerRef}
        className="w-full min-h-[56px]"
        style={{ display: buttonVisible ? 'block' : 'none' }}
      />
      {!buttonVisible && !isLoading && !sdkError && (
        <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black opacity-50">
          <img 
            src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" 
            alt="Klarna" 
            className="h-6 mr-2"
          />
          Klarna loading...
        </Button>
      )}
    </div>
  );
}
