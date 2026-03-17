import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CreditCard, AlertCircle } from "lucide-react";

type Props = {
  amount: number;
  orderRef: string;
  merchantId: string;
  signedFormFields: Record<string, string>;
  gatewayUrl: string;
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
  signedFormFields,
  gatewayUrl,
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
  const formRef = useRef<HTMLFormElement>(null);
  const instanceRef = useRef<any>(null);
  const initAttemptedRef = useRef(false);
  const cancelledRef = useRef(false);
  const onInitErrorRef = useRef(onInitError);
  const sdkReadyRef = useRef(false);
  const amountLabel = `£${amount.toFixed(2)}`;

  onInitErrorRef.current = onInitError;

  useEffect(() => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;
    cancelledRef.current = false;

    const jqueryUrl = "https://code.jquery.com/jquery-3.7.1.min.js";
    const sdkUrl = "https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js";

    (async () => {
      try {
        await loadScript(jqueryUrl);
        if (cancelledRef.current) return;
        if (!window.jQuery) throw new Error("jQuery failed to load");
        console.log("[CardForm] jQuery loaded");

        await loadScript(sdkUrl);
        if (cancelledRef.current) return;
        console.log("[CardForm] SDK script loaded");

        if (!window.jQuery.fn.hostedForm) {
          throw new Error("Hosted Fields plugin missing — $.fn.hostedForm not found");
        }
        console.log("[CardForm] $.fn.hostedForm plugin found");

        const $form = window.jQuery(formRef.current);

        // Form submission mode: set the form action to the gateway URL
        // The SDK will POST the form (including hidden fields + card data) directly to the gateway
        $form.attr("action", gatewayUrl);
        $form.attr("method", "POST");

        $form.hostedForm({
          autoSetup: true,
          autoSubmit: false,
          merchantID: merchantId,
        });
        console.log("[CardForm] hostedForm() called");

        const inst = $form.hostedForm("instance");
        if (!inst) throw new Error("Hosted form instance not created");
        instanceRef.current = inst;
        console.log("[CardForm] instance obtained");

        $form.on("hostedform:ready", () => {
          if (!cancelledRef.current && !sdkReadyRef.current) {
            console.log("[CardForm] hostedform:ready fired");
            sdkReadyRef.current = true;
            setSdkReady(true);
          }
        });

        $form.on("hostedform:error", (_e: any, err: any) => {
          console.error("[CardForm] hostedform:error:", err);
        });

        $form.on("hostedform:invalid", (_e: any, details: any) => {
          console.warn("[CardForm] hostedform:invalid:", details);
        });

        setTimeout(() => {
          if (!cancelledRef.current && !sdkReadyRef.current) {
            console.log("[CardForm] fallback: assuming ready after timeout");
            sdkReadyRef.current = true;
            setSdkReady(true);
          }
        }, 6000);

      } catch (e: any) {
        console.error("[CardForm] init error:", e);
        if (!cancelledRef.current) {
          setSdkError(e?.message || "Failed to load payment SDK");
          onInitErrorRef.current?.();
        }
      }
    })();

    return () => { cancelledRef.current = true; };
  }, [gatewayUrl, merchantId]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceRef.current || submitting || !formRef.current) return;

    setSubmitting(true);

    try {
      // In form submission mode, the SDK submits the form directly to the gateway.
      // The gateway handles 3DS and then redirects to the redirectURL (payment-callback).
      console.log("[CardForm] submitting form to gateway for 3DS flow");
      instanceRef.current.submit();
    } catch (err: any) {
      const msg = err?.message || "Payment submission failed";
      console.error("[CardForm] submit error:", msg);
      onError?.(msg);
      setSubmitting(false);
    }
  }, [onError, submitting]);

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
      {/* All signed hidden fields from payment-intent-create */}
      {Object.entries(signedFormFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

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
            Redirecting to 3D Secure…
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
