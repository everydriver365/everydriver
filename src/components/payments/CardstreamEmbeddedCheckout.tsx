import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, CreditCard } from "lucide-react";

// jQuery URL (must load BEFORE hostedfields)
const JQUERY_URL = "https://code.jquery.com/jquery-3.7.1.min.js";

// If Cardstream gave you a different gateway hostname, set env:
// VITE_CARDSTREAM_GATEWAY_BASE_URL="https://YOUR-GATEWAY-HOSTNAME"
const GATEWAY_BASE_URL =
  (import.meta.env.VITE_CARDSTREAM_GATEWAY_BASE_URL as string) || "https://gateway.cardstream.com";

const HOSTEDFIELDS_URL = `${String(GATEWAY_BASE_URL).replace(/\/$/, "")}/sdk/web/v1/js/hostedfields.min.js`;

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

/** Strict script loader with timeout + clear errors */
function loadScriptStrict(url: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already present?
    const existing = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement | null;
    if (existing) return resolve();

    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.defer = true;
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
      reject(
        new Error(
          `Failed to load script: ${url}\n` +
            `Common causes:\n` +
            `• CSP blocking scripts from ${new URL(url).origin}\n` +
            `• Adblock/Brave shields blocking the gateway\n` +
            `• Wrong gateway hostname (white-label)\n` +
            `• 403/404 from gateway\n`
        )
      );
    };

    document.head.appendChild(s);
  });
}

/**
 * Fetch-based diagnostics BEFORE script injection.
 * This prints status code + content-type so you know WHY script injection fails.
 */
async function diagnoseUrl(url: string): Promise<void> {
  console.log("[HPF] Diagnosing:", url);
  
  // Try HEAD
  try {
    const head = await fetch(url, { method: "HEAD", mode: "cors" });
    console.log("[HPF] HEAD:", head.status, head.statusText, "content-type:", head.headers.get("content-type"));
  } catch (e) {
    console.warn("[HPF] HEAD failed (CSP/CORS/adblock/network). Will try GET.", e);
  }

  // Try GET for more detail
  try {
    const res = await fetch(url, { method: "GET", mode: "cors" });
    const ct = res.headers.get("content-type") || "";
    console.log("[HPF] GET:", res.status, res.statusText, "content-type:", ct);

    // If response isn't JS, log the first part (often HTML error page)
    if (!ct.toLowerCase().includes("javascript")) {
      const text = await res.text();
      console.warn("[HPF] Non-JS response body (first 400 chars):\n", text.slice(0, 400));
    }

    if (!res.ok) {
      throw new Error(`[HPF] GET failed: ${res.status} ${res.statusText}`);
    }
  } catch (e: any) {
    throw new Error(
      `Hosted Fields SDK is not reachable.\n` +
        `URL: ${url}\n` +
        `Likely causes:\n` +
        `• CSP blocks scripts/requests to ${new URL(url).origin}\n` +
        `• Adblock/Brave shields blocks the gateway\n` +
        `• Wrong gateway hostname (Cardstream may provide a different host)\n` +
        `• 403/404 from gateway\n` +
        `Details: ${e?.message || String(e)}`
    );
  }
}

/**
 * Main entry:
 * - loads jQuery first
 * - diagnoses hostedfields URL (prints status/content-type)
 * - injects hostedfields script
 * - verifies SDK namespace exists
 */
async function loadHostedFieldsSDK(): Promise<any> {
  // 1) Load jQuery first
  await loadScriptStrict(JQUERY_URL);

  if (!(window as any).jQuery) {
    throw new Error("jQuery failed to load. Likely CSP/adblock/network blocking code.jquery.com.");
  }
  (window as any).$ = (window as any).jQuery;

  // 2) Diagnose hostedfields URL (gives real reason: 403/404/CSP/html)
  await diagnoseUrl(HOSTEDFIELDS_URL);

  // 3) Load hostedfields script
  await loadScriptStrict(HOSTEDFIELDS_URL);

  // 4) Verify SDK presence (don't rely on $.fn.hostedForm plugin)
  const hf = (window as any).hostedFields;
  if (!hf?.classes?.Form) {
    throw new Error(
      "Hosted Fields script loaded but window.hostedFields.classes.Form is missing.\n" +
        "This usually means the gateway returned HTML (WAF/error page) or script execution was blocked.\n" +
        "Check DevTools → Network → hostedfields.min.js → Response."
    );
  }

  return hf;
}

function getHostedFieldsFormClass(): (new (el: HTMLFormElement, options: any) => any) | null {
  const hf = (window as any).hostedFields;
  return hf?.classes?.Form ?? null;
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
  const formRef = useRef<HTMLFormElement>(null);
  const formId = "cs-form-embed";

  const amountLabel = `£${amount.toFixed(2)}`;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setInitError(null);

        console.log("[CardstreamEmbeddedCheckout] Initializing...");
        console.log("[CardstreamEmbeddedCheckout] Gateway base URL:", GATEWAY_BASE_URL);
        console.log("[CardstreamEmbeddedCheckout] Hosted Fields URL:", HOSTEDFIELDS_URL);

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

        // 2) Load jQuery + diagnose + load Hosted Fields SDK
        await loadHostedFieldsSDK();

        if (!mounted) return;

        // 3) Initialize via window.hostedFields.classes.Form (no plugin dependency)
        const FormClass = getHostedFieldsFormClass();
        const formEl = formRef.current;
        if (!FormClass) throw new Error("Hosted Fields Form class missing after SDK load");
        if (!formEl) throw new Error("Payment form not mounted");

        // Ensure merchantID input exists & is set (tokeniser reads this)
        const merchantInput = formEl.querySelector('input[name="merchantID"]') as HTMLInputElement | null;
        if (merchantInput) merchantInput.value = mId;

        hostedInstanceRef.current = new FormClass(formEl, {
          autoSetup: true,
          autoSubmit: false,
          nativeEvents: true,
        });

        console.log("[CardstreamEmbeddedCheckout] ✅ Hosted Fields ready!");
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setLoading(false);
        const message = e instanceof Error ? e.message : "Failed to initialize payment";
        setInitError(message);
        console.error("[CardstreamEmbeddedCheckout] ❌ Init error:", e);
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
      const details = await hostedInstanceRef.current.getPaymentDetails(
        { orderRef },
        true
      );

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
            <p className="text-destructive whitespace-pre-wrap text-sm">{initError}</p>
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
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading secure payment...</span>
          </div>
        )}

        {/* Keep the form mounted (required for SDK init). When loading, it stays invisible. */}
        <form
          ref={formRef}
          id={formId}
          className={`space-y-4 ${loading ? "invisible h-0 overflow-hidden" : ""}`}
        >
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
      </CardContent>
    </Card>
  );
}
