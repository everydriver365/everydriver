import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, CreditCard } from "lucide-react";

// Types for Cardstream Hosted Fields SDK (non-jQuery API)
interface HostedFieldsConfig {
  merchantID: string;
  stylesheet?: string;
  fields: {
    cardNumber: { selector: string; placeholder?: string };
    cardExpiryDate: { selector: string; placeholder?: string };
    cardCVV: { selector: string; placeholder?: string };
  };
}

interface HostedFieldsInstance {
  getPaymentDetails(options?: { customerName?: string }): Promise<{
    success: boolean;
    paymentToken?: string;
    error?: string;
  }>;
  destroy(): void;
}

declare global {
  interface Window {
    hostedFields?: {
      classes: {
        HostedFields: new (config: HostedFieldsConfig) => HostedFieldsInstance;
      };
    };
  }
}

type Props = {
  amount: number; // pounds
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: () => void;
  merchantId?: string; // optional - will be fetched from payment-intent-create if not provided
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function CardstreamEmbeddedCheckout({
  amount,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  onSuccess,
  merchantId,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [resolvedMerchantId, setResolvedMerchantId] = useState<string>(merchantId || "");

  const hostedInstanceRef = useRef<HostedFieldsInstance | null>(null);

  const amountLabel = `£${amount.toFixed(2)}`;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setInitError(null);

        // 1) Create payment intent
        const { data, error } = await supabase.functions.invoke("payment-intent-create", {
          body: { amount, currency: "GBP", pupilId, instructorId, customerName, customerEmail },
        });

        if (!mounted) return;

        if (error || !data?.success) {
          throw new Error(error?.message || "Failed to create payment intent");
        }

        setOrderRef(data.orderRef);
        
        // Use merchant ID from response or prop
        const mId = data.merchantId || merchantId || "";
        if (!mId) {
          throw new Error("Merchant ID not configured");
        }
        setResolvedMerchantId(mId);

        // 2) Load hosted fields script
        await loadScript(data.hostedFieldsScriptUrl);

        if (!mounted) return;

        // 3) Initialize hosted fields using non-jQuery API
        if (!window.hostedFields?.classes?.HostedFields) {
          throw new Error("Hosted Fields SDK failed to load properly");
        }

        // Create hosted fields instance
        hostedInstanceRef.current = new window.hostedFields.classes.HostedFields({
          merchantID: mId,
          fields: {
            cardNumber: { 
              selector: "#cs-card-number-embed",
              placeholder: "Card number"
            },
            cardExpiryDate: { 
              selector: "#cs-card-expiry-embed",
              placeholder: "MM/YY"
            },
            cardCVV: { 
              selector: "#cs-card-cvv-embed",
              placeholder: "CVV"
            },
          },
        });

        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setLoading(false);
        const message = e instanceof Error ? e.message : "Failed to initialize payment";
        setInitError(message);
        console.error("CardstreamEmbeddedCheckout init error:", e);
      }
    })();

    return () => {
      mounted = false;
      if (hostedInstanceRef.current) {
        try {
          hostedInstanceRef.current.destroy();
        } catch (e) {
          console.warn("Error destroying hosted fields:", e);
        }
      }
    };
  }, [amount, pupilId, instructorId, customerName, customerEmail, merchantId]);

  const payNow = useCallback(async () => {
    if (!orderRef) {
      toast.error("Payment not initialized");
      return;
    }

    if (!hostedInstanceRef.current) {
      toast.error("Payment fields not ready");
      return;
    }

    try {
      setPaying(true);

      // Tokenize card details
      const details = await hostedInstanceRef.current.getPaymentDetails({
        customerName: customerName ?? "",
      });

      if (!details?.success || !details?.paymentToken) {
        throw new Error(details?.error || "Card validation failed");
      }

      // Server-to-server Direct SALE
      const { data, error } = await supabase.functions.invoke("payment-direct-sale", {
        body: {
          orderRef,
          paymentToken: details.paymentToken,
          customerName,
          customerEmail,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.responseMessage || "Payment declined");

      toast.success("Payment successful!");
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }, [orderRef, customerName, customerEmail, onSuccess]);

  if (initError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">{initError}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pay {amountLabel}
        </CardTitle>
        <CardDescription>Secure card payment</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading secure payment...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <input type="hidden" name="merchantID" value={resolvedMerchantId} />

              <div className="space-y-2">
                <label htmlFor="cs-card-number-embed" className="text-sm font-medium">
                  Card Number
                </label>
                <div
                  id="cs-card-number-embed"
                  className="h-10 border rounded-md px-3 bg-background flex items-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cs-card-expiry-embed" className="text-sm font-medium">
                    Expiry
                  </label>
                  <div
                    id="cs-card-expiry-embed"
                    className="h-10 border rounded-md px-3 bg-background flex items-center"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cs-card-cvv-embed" className="text-sm font-medium">
                    CVV
                  </label>
                  <div
                    id="cs-card-cvv-embed"
                    className="h-10 border rounded-md px-3 bg-background flex items-center"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={payNow}
              disabled={paying}
              className="w-full"
              size="lg"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ${amountLabel}`
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Card details are tokenized securely. We never see your full card number.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
