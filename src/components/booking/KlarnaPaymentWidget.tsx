import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KlarnaPaymentWidgetProps {
  clientToken: string;
  sessionId: string;
  paymentMethodCategories: Array<{ identifier: string; name: string }>;
  orderDetails: {
    amount: number;
    currency: string;
    merchantReference: string;
    confirmUrl: string;
    cancelUrl: string;
  };
  onAuthorized: (authorizationToken: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    Klarna?: {
      init: (config: {
        clientToken: string;
        urlParams?: { [key: string]: string };
      }) => Promise<{
        Payment: {
          button: (config: {
            id: string;
            shape?: string;
            theme?: string;
            locale?: string;
          }) => {
            on: (
              eventName: string,
              callback: (authorization?: { paymentMethodType: string; authorizationToken?: string }) => void
            ) => void;
            mount: (container: HTMLElement) => Promise<void>;
          };
        };
      }>;
    };
  }
}

export function KlarnaPaymentWidget({
  clientToken,
  sessionId,
  paymentMethodCategories,
  orderDetails,
  onAuthorized,
  onError,
  onCancel,
}: KlarnaPaymentWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const loadKlarnaSDK = async () => {
      try {
        // Load Klarna Web SDK v2
        const script = document.createElement("script");
        script.src = "https://js.klarna.com/web-sdk/v2/klarna.mjs";
        script.type = "module";
        script.async = true;

        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Klarna SDK"));
        });

        document.head.appendChild(script);
        await loadPromise;

        // Wait for Klarna to be available
        let retries = 0;
        while (!window.Klarna && retries < 50) {
          await new Promise((r) => setTimeout(r, 100));
          retries++;
        }

        if (!window.Klarna) {
          throw new Error("Klarna SDK not available");
        }

        // Initialize Klarna
        const klarna = await window.Klarna.init({
          clientToken,
          urlParams: {
            initiationMode: "DEVICE_BEST", // Mobile: redirect, Desktop: popup/redirect
          },
        });

        if (!containerRef.current) return;

        // Create Klarna payment button
        const paymentButton = klarna.Payment.button({
          id: "klarna-pay-button",
          shape: "default",
          theme: "default",
          locale: "en-GB",
        });

        // Handle authorization events
        paymentButton.on("click", () => {
          setIsAuthorizing(true);
        });

        paymentButton.on("redirect-initiated", () => {
          // User is being redirected to complete payment
          console.log("Klarna redirect initiated");
        });

        paymentButton.on("authorization", (authorization) => {
          setIsAuthorizing(false);
          if (authorization?.authorizationToken) {
            onAuthorized(authorization.authorizationToken);
          } else {
            onError("Payment was not authorized");
          }
        });

        paymentButton.on("error", () => {
          setIsAuthorizing(false);
          onError("An error occurred with Klarna. Please try again.");
        });

        // Mount the button
        await paymentButton.mount(containerRef.current);
        setIsLoading(false);
      } catch (error) {
        console.error("Klarna SDK error:", error);
        setSdkError(error instanceof Error ? error.message : "Failed to load Klarna");
        setIsLoading(false);
        
        // Fallback to legacy popup approach if SDK v2 fails
        fallbackToLegacyKlarna();
      }
    };

    const fallbackToLegacyKlarna = () => {
      // If SDK v2 fails, show a button that opens the legacy popup
      setSdkError(null);
      setIsLoading(false);
    };

    loadKlarnaSDK();

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src*="klarna.mjs"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [clientToken, onAuthorized, onError]);

  const handleLegacyKlarna = () => {
    // Open legacy Klarna in popup as fallback
    const category = paymentMethodCategories[0]?.identifier || "pay_later";
    const confirmUrl = orderDetails.confirmUrl;
    const cancelUrl = orderDetails.cancelUrl;
    const amount = (orderDetails.amount / 100).toFixed(2);

    const klarnaWindow = window.open("", "_blank", "width=500,height=700,scrollbars=yes");
    if (klarnaWindow) {
      klarnaWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Klarna Payment</title>
          <script src="https://x.klarnacdn.net/kp/lib/v1/api.js" async></script>
          <style>
            body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
            .container { max-width: 450px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 1.5rem; color: #333; margin: 0 0 8px 0; }
            .header p { color: #666; margin: 0; }
            .amount { font-size: 1.25rem; font-weight: 600; color: #17120F; }
            #klarna-container { background: white; border-radius: 8px; padding: 20px; min-height: 200px; }
            .loading { text-align: center; padding: 40px; color: #666; }
            .error { text-align: center; padding: 40px; color: #dc2626; }
            .btn { display: block; width: 100%; padding: 14px; margin-top: 16px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
            .btn-primary { background: #FFB3C7; color: #17120F; }
            .btn-primary:hover { background: #ffa0b8; }
            .btn-secondary { background: #e5e5e5; color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Complete Your Payment</h1>
              <p>Amount: <span class="amount">£${amount}</span></p>
            </div>
            <div id="klarna-container">
              <div class="loading">Loading Klarna payment options...</div>
            </div>
            <button id="pay-btn" class="btn btn-primary" style="display:none;">Pay with Klarna</button>
            <button class="btn btn-secondary" onclick="window.location.href='${cancelUrl}'">Cancel</button>
          </div>
          <script>
            const clientToken = "${clientToken}";
            const confirmUrl = "${confirmUrl}";
            const category = "${category}";
            
            window.Klarna.Payments.init({ client_token: clientToken });
            
            window.Klarna.Payments.load({
              container: "#klarna-container",
              payment_method_category: category
            }, function(res) {
              if (res.show_form) {
                document.getElementById("pay-btn").style.display = "block";
              } else {
                document.getElementById("klarna-container").innerHTML = '<div class="error">Klarna is not available for this purchase. Please try another payment method.</div>';
              }
            });
            
            document.getElementById("pay-btn").addEventListener("click", function() {
              this.disabled = true;
              this.textContent = "Processing...";
              
              window.Klarna.Payments.authorize({
                payment_method_category: category
              }, {}, function(res) {
                if (res.approved) {
                  window.location.href = confirmUrl + "&authorization_token=" + res.authorization_token;
                } else if (res.show_form) {
                  document.getElementById("pay-btn").disabled = false;
                  document.getElementById("pay-btn").textContent = "Pay with Klarna";
                } else {
                  document.getElementById("klarna-container").innerHTML = '<div class="error">Payment was not approved. Please try again or use another payment method.</div>';
                  document.getElementById("pay-btn").style.display = "none";
                }
              });
            });
          </script>
        </body>
        </html>
      `);
      klarnaWindow.document.close();
    } else {
      onError("Please allow popups for Klarna checkout");
    }
  };

  if (sdkError) {
    return (
      <div className="p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground mb-3">
          Using alternative Klarna checkout
        </p>
        <Button
          onClick={handleLegacyKlarna}
          className="w-full bg-[#FFB3C7] hover:bg-[#ffa0b8] text-[#17120F]"
        >
          Continue to Klarna
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#FFB3C7]" />
          <span className="ml-2 text-sm text-muted-foreground">Loading Klarna...</span>
        </div>
      )}
      
      <div
        ref={containerRef}
        className={`klarna-payment-container min-h-[60px] ${isLoading ? "hidden" : ""}`}
      />
      
      {isAuthorizing && (
        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm">Completing payment...</span>
        </div>
      )}
      
      <Button
        variant="outline"
        onClick={onCancel}
        className="w-full"
        disabled={isAuthorizing}
      >
        Cancel
      </Button>
    </div>
  );
}
