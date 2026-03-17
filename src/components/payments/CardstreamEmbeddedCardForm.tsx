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
  onInitError?: () => void;
  disabled?: boolean;
};

declare global {
  interface Window {
    jQuery?: any;
    $?: any;
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
  onInitError,
  disabled,
}: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tokenising, setTokenising] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const instanceRef = useRef<any>(null);
  const initAttemptedRef = useRef(false);
  const amountLabel = `£${amount.toFixed(2)}`;

  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    let cancelled = false;
    const jqueryUrl = "https://code.jquery.com/jquery-3.7.1.min.js";
    const sdkUrl = "https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js";

    (async () => {
      try {
        // Step 1: load jQuery
        await loadScript(jqueryUrl);
        if (cancelled) return;
        if (!window.jQuery) {
          throw new Error("jQuery failed to load");
        }
        console.log("[CardForm] jQuery loaded");

        // Step 2: load Hosted Fields SDK
        await loadScript(sdkUrl);
        if (cancelled) return;
        console.log("[CardForm] SDK script loaded");

        // Step 3: verify the jQuery plugin exists
        if (!window.jQuery.fn.hostedForm) {
          throw new Error("Hosted Fields plugin missing — $.fn.hostedForm not found");
        }
        console.log("[CardForm] $.fn.hostedForm plugin found");

        // Step 4: initialise plugin on the form element
        const $form = window.jQuery(formRef.current);
        $form.hostedForm({
          autoSetup: true,
          autoSubmit: false,
          merchantID: merchantId,
        });
        console.log("[CardForm] hostedForm() called");

        // Step 5: obtain instance
        const inst = $form.hostedForm("instance");
        if (!inst) {
          throw new Error("Hosted form instance not created");
        }
        instanceRef.current = inst;
        console.log("[CardForm] instance obtained");

        // Step 6: listen for ready/error events
        $form.on("hostedform:ready", () => {
          if (!cancelled) {
            console.log("[CardForm] hostedform:ready fired");
            setSdkReady(true);
          }
        });

        $form.on("hostedform:error", (_e: any, err: any) => {
          console.error("[CardForm] hostedform:error:", err);
        });

        $form.on("hostedform:invalid", (_e: any, details: any) => {
          console.warn("[CardForm] hostedform:invalid:", details);
        });

        // Fallback: if ready event doesn't fire within 6s, assume ready
        setTimeout(() => {
          if (!cancelled && !sdkReady) {
            console.log("[CardForm] fallback: assuming ready after timeout");
            setSdkReady(true);
          }
        }, 6000);

      } catch (e: any) {
        console.error("[CardForm] init error:", e);
        if (!cancelled) {
          setSdkError(e?.message || "Failed to load payment SDK");
          onInitError?.();
        }
      }
    })();

    return () => { cancelled = true; };
  }, [merchantId, onInitError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceRef.current || submitting) return;

    setSubmitting(true);
    setTokenising(true);

    try {
      // getPaymentDetails returns a promise with {success, paymentToken, message}
      const result = await instanceRef.current.getPaymentDetails();
      setTokenising(false);

      if (!result?.success || !result?.paymentToken) {
        throw new Error(result?.message || "Card tokenisation failed — please check your details");
      }

      console.log("[CardForm] token obtained, calling direct sale");

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
      console.error("[CardForm] payment error:", msg);
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

      {/* Hosted card fields — SDK scans for INPUT elements with data-hostedfield */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Card number</label>
          <input
            type="hostedfield:cardNumber"
            data-hostedfield="cardNumber"
            placeholder="4929 4212 3460 0821"
            className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Expiry date</label>
            <input
              type="hostedfield:cardExpiryDate"
              data-hostedfield="cardExpiryDate"
              placeholder="12/25"
              className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">CVV</label>
            <input
              type="hostedfield:cardCVV"
              data-hostedfield="cardCVV"
              placeholder="356"
              className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none"
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
