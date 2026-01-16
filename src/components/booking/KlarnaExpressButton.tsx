import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

// Klarna Live Client Identifier (publishable key)
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

// Local type for Klarna Express SDK (avoid global conflicts)
interface KlarnaExpressSDK {
  ExpressButton?: {
    init: (config: {
      client_id: string;
      locale?: string;
      environment?: "playground" | "production";
    }) => {
      on: (event: string, callback: (data: any) => void) => void;
      render: (selector: string, options: {
        amount: number;
        currency: string;
        merchant_reference?: string;
        merchant_data?: string;
        theme?: "default" | "dark";
        shape?: "default" | "rect" | "pill";
      }) => void;
    };
  };
}

// Access Klarna SDK without conflicting with other declarations
const getKlarnaExpress = (): KlarnaExpressSDK | undefined => {
  return (window as any).Klarna as KlarnaExpressSDK | undefined;
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
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    
    const loadKlarnaSDK = async () => {
      try {
        // Load Klarna Web SDK
        const script = document.createElement("script");
        script.src = "https://x.klarnacdn.net/kp/lib/v1/api.js";
        script.async = true;
        script.dataset.clientId = KLARNA_CLIENT_ID;
        
        script.onload = () => {
          console.log("Klarna SDK loaded");
          scriptLoadedRef.current = true;
          setIsLoading(false);
          initializeExpressButton();
        };

        script.onerror = () => {
          console.error("Failed to load Klarna SDK");
          setSdkError("Failed to load Klarna");
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Klarna SDK:", error);
        setSdkError("Failed to initialize Klarna");
        setIsLoading(false);
      }
    };

    loadKlarnaSDK();

    return () => {
      // Cleanup script on unmount
      const scripts = document.querySelectorAll('script[data-client-id]');
      scripts.forEach(s => s.remove());
    };
  }, []);

  const initializeExpressButton = () => {
    const klarnaSDK = getKlarnaExpress();
    if (!klarnaSDK?.ExpressButton) {
      console.log("Klarna ExpressButton not available, using fallback");
      return;
    }

    try {
      const expressButton = klarnaSDK.ExpressButton.init({
        client_id: KLARNA_CLIENT_ID,
        locale: "en-GB",
        environment: "production",
      });

      expressButton.on("user-authenticated", (data: any) => {
        console.log("Klarna user authenticated:", data);
        setIsProcessing(true);
      });

      expressButton.on("redirect", (data: any) => {
        console.log("Klarna redirect:", data);
        if (data.authorization_token) {
          onSuccess(data.authorization_token, data.order_id || merchantReference);
        }
      });

      expressButton.on("error", (data: any) => {
        console.error("Klarna error:", data);
        setIsProcessing(false);
        onError(data.message || "Payment failed");
      });

      if (containerRef.current) {
        expressButton.render("#klarna-express-container", {
          amount: Math.round(amount * 100), // Convert to minor units
          currency: currency,
          merchant_reference: merchantReference,
          merchant_data: JSON.stringify({ description: orderDescription }),
          theme: "default",
          shape: "rect",
        });
      }
    } catch (error) {
      console.error("Error initializing Klarna Express:", error);
      setSdkError("Could not initialize Klarna Express");
    }
  };

  const handleFallbackClick = () => {
    // Fallback: Open Klarna in redirect mode
    setIsProcessing(true);
    
    // Create a simple redirect to Klarna
    const klarnaUrl = `https://www.klarna.com/uk/pay-later/`;
    window.open(klarnaUrl, "_blank");
    
    // Show message that this is a fallback
    onError("Please use the standard payment option. Klarna Express requires additional setup.");
    setIsProcessing(false);
  };

  if (disabled) {
    return (
      <Button disabled className="w-full h-14 bg-[#FFB3C7] text-black opacity-50">
        <img 
          src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" 
          alt="Klarna" 
          className="h-6 mr-2"
        />
        Klarna Express Checkout
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

  const klarnaSDK = getKlarnaExpress();
  if (sdkError || !klarnaSDK?.ExpressButton) {
    // Fallback button when SDK fails
    return (
      <Button 
        onClick={handleFallbackClick}
        disabled={isProcessing}
        className="w-full h-14 bg-[#FFB3C7] hover:bg-[#FFA0B8] text-black font-semibold"
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <img 
            src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" 
            alt="Klarna" 
            className="h-6 mr-2"
          />
        )}
        Pay with Klarna
        <ExternalLink className="h-4 w-4 ml-2" />
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
        id="klarna-express-container" 
        ref={containerRef}
        className="w-full min-h-[56px]"
      />
    </div>
  );
}
