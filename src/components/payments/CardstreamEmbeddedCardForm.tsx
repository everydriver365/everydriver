import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CreditCard, AlertCircle } from "lucide-react";

type Props = {
  amount: number;
  orderRef: string;
  merchantId: string;
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostcode?: string;
  onPaid?: () => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
};

declare global {
  interface Window {
    jQuery?: any;
    $?: any;
    hostedFields?: {
      classes: {
        Forms: new (...args: any[]) => any;
      };
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = "true"; resolve(); };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function CardstreamEmbeddedCardForm({
  amount,
  orderRef,
  merchantId,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerPostcode,
  onPaid,
  onError,
  disabled,
}: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tokenising, setTokenising] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const hostedFormRef = useRef<any>(null);
  const amountLabel = `£${amount.toFixed(2)}`;

  // Load jQuery + Hosted Fields SDK
  useEffect(() => {
    let cancelled = false;
    const jqueryUrl = "https://code.jquery.com/jquery-3.7.1.min.js";
    const sdkUrl = "https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js";

    (async () => {
      try {
        // jQuery must load first — SDK is a jQuery plugin
        await loadScript(jqueryUrl);
        if (cancelled) return;

        await loadScript(sdkUrl);
        if (cancelled) return;

        if (!window.hostedFields) {
          setSdkError("Payment SDK failed to initialise");
          return;
        }

        if (formRef.current && !hostedFormRef.current) {
          const hf = new window.hostedFields.classes.Forms(formRef.current, {
            autoSetup: true,
            autoSubmit: false,
            merchantID: merchantId,
          });

          // SDK fires jQuery events on the form element
          const $form = window.jQuery(formRef.current);

          $form.on("hostedform:ready", () => {
            if (!cancelled) {
              console.log("Hosted Fields: ready");
              setSdkReady(true);
            }
          });

          $form.on("hostedform:error", (_e: any, err: any) => {
            console.error("Hosted Fields error:", err);
            if (!cancelled) setSdkError("Card form error — please refresh");
          });

          $form.on("hostedform:invalid", (_e: any, details: any) => {
            console.warn("Hosted Fields validation:", details);
          });

          hostedFormRef.current = hf;

          // Fallback: if ready event doesn't fire within 5s but SDK loaded, assume ready
          setTimeout(() => {
            if (!cancelled && !sdkReady) {
              console.log("Hosted Fields: fallback ready");
              setSdkReady(true);
            }
          }, 5000);
        }
      } catch (e) {
        console.error("SDK load error:", e);
        if (!cancelled) setSdkError("Failed to load payment SDK");
      }
    })();

    return () => { cancelled = true; };
  }, [merchantId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostedFormRef.current || submitting) return;

    setSubmitting(true);
    setTokenising(true);

    try {
      // getPaymentDetails() returns a promise with {success, paymentToken, message}
      const result = await hostedFormRef.current.getPaymentDetails();

      setTokenising(false);

      if (!result?.success || !result?.paymentToken) {
        throw new Error(result?.message || "Card tokenisation failed — please check your details");
      }

      // Send token + address to direct sale
      const { data, error } = await supabase.functions.invoke("payment-direct-sale", {
        body: {
          orderRef,
          method: "card_token" as const,
          cardPaymentToken: result.paymentToken,
          customerName,
          customerEmail,
          customerPostcode,
          customerAddress1: customerAddress,
          customerCountryCode: "826",
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.responseMessage || "Payment declined");

      onPaid?.();
    } catch (err: any) {
      const msg = err?.message || "Payment failed";
      console.error("Card payment error:", msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
      setTokenising(false);
    }
  }, [orderRef, customerName, customerEmail, customerAddress, customerPostcode, onPaid, onError, submitting]);

  if (sdkError) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{sdkError}</span>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      {/* Hidden fields for Cardstream SDK */}
      <input type="hidden" name="merchantID" value={merchantId} />
      <input type="hidden" name="action" value="SALE" />
      <input type="hidden" name="type" value="1" />
      <input type="hidden" name="currencyCode" value="826" />
      <input type="hidden" name="countryCode" value="826" />
      <input type="hidden" name="amount" value={Math.round(amount * 100)} />

      {/* Hosted card fields — iframes injected here by the SDK */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Card number</label>
          <div
            data-hostedfield="cardNumber"
            className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            style={{ minHeight: 44 }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Expiry date</label>
            <div
              data-hostedfield="cardExpiryDate"
              className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              style={{ minHeight: 44 }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">CVV</label>
            <div
              data-hostedfield="cardCVV"
              className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              style={{ minHeight: 44 }}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={disabled || !sdkReady || submitting}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tokenising ? "Securing card…" : "Processing payment…"}
          </>
        ) : !sdkReady ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading secure form…
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {amountLabel}
          </>
        )}
      </Button>
    </form>
  );
}
