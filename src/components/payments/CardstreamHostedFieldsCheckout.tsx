import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Access hostedFields from window without conflicting with other type declarations
const getHostedFieldsFormClass = (): (new (el: HTMLFormElement, options: any) => any) | null => {
  const hf = (window as any).hostedFields;
  return hf?.classes?.Form || null;
};

const getJQuery = (): any => (window as any).jQuery;
const setJQuery = (jq: any) => { (window as any).$ = jq; };

function loadScript(src: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) return resolve();

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";

    const t = window.setTimeout(() => reject(new Error(`Timed out loading script: ${src}`)), timeoutMs);
    s.onload = () => {
      window.clearTimeout(t);
      resolve();
    };
    s.onerror = () => {
      window.clearTimeout(t);
      reject(new Error(`Failed to load script: ${src} (CSP/adblock/network)`));
    };

    document.head.appendChild(s);
  });
}

type CardstreamHostedFieldsCheckoutProps = {
  amount: number; // pounds
  orderRef: string;
  customerName?: string;
  customerEmail?: string;
  pupilId?: string;
  instructorId?: string;
  gatewayBaseUrl?: string;
  onSuccess?: (data: any) => void;
  onError?: (msg: string) => void;
};

export function CardstreamHostedFieldsCheckout({
  amount,
  orderRef,
  customerName,
  customerEmail,
  pupilId,
  instructorId,
  gatewayBaseUrl = "https://gateway.cardstream.com",
  onSuccess,
  onError,
}: CardstreamHostedFieldsCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const hostedFormRef = useRef<any>(null);

  const hostedFieldsUrl = useMemo(() => {
    const base = gatewayBaseUrl.replace(/\/$/, "");
    return `${base}/sdk/web/v1/js/hostedfields.min.js`;
  }, [gatewayBaseUrl]);

  const amountLabel = useMemo(() => `£${amount.toFixed(2)}`, [amount]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Load jQuery FIRST (Hosted Fields needs it reliably in many integrations)
        await loadScript("https://code.jquery.com/jquery-3.7.1.min.js");

        // force globals
        const jq = getJQuery();
        if (!jq) throw new Error("jQuery loaded but window.jQuery is missing (blocked or overridden)");
        setJQuery(jq);

        // 2) Load hosted fields SDK
        await loadScript(hostedFieldsUrl);

        // 3) DO NOT depend on $.fn.hostedForm (plugin may not exist).
        // Instead, use the Hosted Fields namespace:
        const FormClass = getHostedFieldsFormClass();
        if (!FormClass) {
          throw new Error(
            "Hosted Fields SDK loaded but window.hostedFields.classes.Form is missing. " +
              "Check CSP/adblock + confirm gateway hostname is correct."
          );
        }

        const formEl = formRef.current;
        if (!formEl) throw new Error("Form element not mounted");

        // 4) Create hosted fields form instance (autoSetup reads our field containers)
        hostedFormRef.current = new FormClass(formEl, {
          autoSetup: true,
          autoSubmit: false,
          nativeEvents: true,
        });

        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || "Failed to init Hosted Fields";
          setError(msg);
          setLoading(false);
          onError?.(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        hostedFormRef.current?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [hostedFieldsUrl, onError]);

  async function payNow() {
    try {
      setSubmitting(true);
      setError(null);

      if (!ready || !hostedFormRef.current) throw new Error("Hosted Fields not ready");

      // Ask backend for merchantID (safe to expose; secret stays server-side)
      const { data: initData, error: initErr } = await supabase.functions.invoke(
        "cardstream-hostedfields-init",
        {
          body: { orderRef, amount, customerName, customerEmail, pupilId, instructorId },
        }
      );

      if (initErr) throw new Error(initErr.message);
      if (!initData?.success) throw new Error(initData?.error || "Failed to init payment");
      if (!initData?.merchantID) throw new Error("Init did not return merchantID");

      // Insert/update merchantID hidden input used by Hosted Fields tokeniser
      const formEl = formRef.current!;
      let mid = formEl.querySelector('input[name="merchantID"]') as HTMLInputElement | null;
      if (!mid) {
        mid = document.createElement("input");
        mid.type = "hidden";
        mid.name = "merchantID";
        formEl.appendChild(mid);
      }
      mid.value = initData.merchantID;

      // Tokenise card data -> get paymentToken
      const tokenResult = await hostedFormRef.current.getPaymentDetails({ orderRef }, true);

      if (!tokenResult?.success) {
        throw new Error(tokenResult?.message || "Card details invalid");
      }
      const paymentToken = tokenResult.paymentToken as string;
      if (!paymentToken) throw new Error("No paymentToken returned from Hosted Fields");

      // Server-to-server Direct SALE
      const { data: saleData, error: saleErr } = await supabase.functions.invoke(
        "cardstream-direct-sale",
        {
          body: {
            orderRef,
            amount,
            paymentToken,
            customerName,
            customerEmail,
            pupilId,
            instructorId,
          },
        }
      );

      if (saleErr) throw new Error(saleErr.message);
      if (!saleData?.success) throw new Error(saleData?.responseMessage || saleData?.error || "Payment failed");

      onSuccess?.(saleData);
    } catch (e: any) {
      const msg = e?.message || "Payment failed";
      setError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-xl border border-border shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Secure card payment</h3>
          <span className="text-xl font-bold text-primary">{amountLabel}</span>
        </div>

        {loading && <p className="text-muted-foreground text-center py-4">Loading secure card fields…</p>}

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Hosted Fields uses these container DIVs; SDK injects iframes */}
        <form ref={formRef} onSubmit={(e) => e.preventDefault()} style={{ display: loading ? "none" : "block" }}>
          <input type="hidden" name="merchantID" />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Card number</label>
              <div
                data-hostedfield="cardNumber"
                className="h-11 border border-input rounded-lg bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Expiry</label>
                <div
                  data-hostedfield="cardExpiryDate"
                  className="h-11 border border-input rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">CVV</label>
                <div
                  data-hostedfield="cardCVV"
                  className="h-11 border border-input rounded-lg bg-background"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={payNow}
            disabled={!ready || submitting}
            className="w-full mt-6 h-12 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Processing…" : `Pay ${amountLabel}`}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Card details are hosted securely by the payment gateway; only a token is sent to our server.
          </p>
        </form>
      </div>
    </div>
  );
}
