import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, CreditCard } from "lucide-react";

// jQuery + Cardstream SDK URLs
const JQUERY_URL = "https://code.jquery.com/jquery-3.6.4.min.js";
const HOSTEDFIELDS_URL = "https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js";

declare global {
  interface Window {
    jQuery?: any;
  }
}

type Props = {
  amount: number; // pounds
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: () => void;
  merchantId?: string;
};

/** Load a script with timeout + hard errors */
function loadScriptStrict(url: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement | null;
    if (existing) {
      return resolve();
    }
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.crossOrigin = "anonymous";
    const t = window.setTimeout(() => {
      reject(new Error(`Timed out loading script: ${url}`));
    }, timeoutMs);
    s.onload = () => {
      window.clearTimeout(t);
      resolve();
    };
    s.onerror = () => {
      window.clearTimeout(t);
      reject(new Error(`Failed to load script: ${url}. Check DevTools → Network.`));
    };
    document.head.appendChild(s);
  });
}

/** Ensures jQuery loads before hostedfields, then verifies plugin */
async function loadCardstreamHostedFieldsSDK(): Promise<any> {
  if (!window.jQuery) {
    await loadScriptStrict(JQUERY_URL);
  }
  await loadScriptStrict(HOSTEDFIELDS_URL);
  
  const $ = window.jQuery;
  if (!$) {
    throw new Error("jQuery missing after load.");
  }
  if (!$.fn || !$.fn.hostedForm) {
    throw new Error("Hosted Fields SDK loaded but $.fn.hostedForm is missing.");
  }
  return $;
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

  const hostedInstanceRef = useRef<any>(null);
  const formId = "cs-form-embed";

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
        
        const mId = data.merchantId || merchantId || "";
        if (!mId) {
          throw new Error("Merchant ID not configured");
        }
        setResolvedMerchantId(mId);

        // 2) Load jQuery + Hosted Fields SDK
        const $ = await loadCardstreamHostedFieldsSDK();

        if (!mounted) return;

        // 3) Initialize hosted fields with jQuery plugin
        const $form = $(`#${formId}`);
        $form.find('input[name="merchantID"]').val(mId);

        $form.hostedForm({
          autoSetup: true,
          autoSubmit: false,
          fields: { any: { nativeEvents: true } },
        });

        hostedInstanceRef.current = $form.hostedForm("instance");
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
          <form id={formId} className="space-y-4">
            <input type="hidden" name="merchantID" value={resolvedMerchantId} />

            <div className="space-y-2">
              <label htmlFor="card-number" className="text-sm font-medium">
                Card Number
              </label>
              <input
                type="hostedfield:cardNumber"
                id="card-number"
                name="cardNumber"
                placeholder="Card number"
                className="w-full h-10 border rounded-md px-3 bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="card-expiry" className="text-sm font-medium">
                  Expiry
                </label>
                <input
                  type="hostedfield:cardExpiryDate"
                  id="card-expiry"
                  name="cardExpiryDate"
                  placeholder="MM/YY"
                  className="w-full h-10 border rounded-md px-3 bg-background"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="card-cvv" className="text-sm font-medium">
                  CVV
                </label>
                <input
                  type="hostedfield:cardCVV"
                  id="card-cvv"
                  name="cardCVV"
                  placeholder="CVV"
                  className="w-full h-10 border rounded-md px-3 bg-background"
                />
              </div>
            </div>

            <Button
              type="button"
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
          </form>
        )}
      </CardContent>
    </Card>
  );
}
