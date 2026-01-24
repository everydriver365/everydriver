import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Access window properties via type assertion to avoid global declaration conflicts
const getWindow = () => window as any;

const JQUERY_URL = "https://code.jquery.com/jquery-3.7.1.min.js";

// Configure this if Cardstream/NPI gave a custom gateway host:
// VITE_CARDSTREAM_GATEWAY_BASE_URL="https://<your-gateway>"
const GATEWAY_BASE_URL =
  (import.meta as any).env?.VITE_CARDSTREAM_GATEWAY_BASE_URL || "https://gateway.cardstream.com";

function loadScriptViaTag(url: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement | null;
    if (existing) return resolve();

    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";

    const t = window.setTimeout(() => {
      reject(new Error(`Timed out loading: ${url}`));
    }, timeoutMs);

    s.onload = () => {
      window.clearTimeout(t);
      resolve();
    };

    s.onerror = () => {
      window.clearTimeout(t);
      const origin = (() => {
        try {
          return new URL(url).origin;
        } catch {
          return url;
        }
      })();

      reject(
        new Error(
          [
            `Hosted Fields SDK failed to load.`,
            `URL: ${url}`,
            ``,
            `Fix checklist:`,
            `1) CSP must allow this origin: ${origin}`,
            `   - script-src ${origin} https://code.jquery.com`,
            `   - frame-src  ${origin}   (Hosted Fields uses iframes)`,
            `   - connect-src ${origin}  (often required)`,
            `2) Disable adblock/Brave Shields for ${origin} and retry.`,
            `3) Confirm gateway hostname (white-label possible). Set VITE_CARDSTREAM_GATEWAY_BASE_URL.`,
            ``,
            `DevTools: Network → hostedfields.min.js will show (blocked:csp) or (blocked) if CSP/extensions caused it.`,
          ].join("\n")
        )
      );
    };

    document.head.appendChild(s);
  });
}

async function loadHostedFieldsSDK(): Promise<any> {
  const win = getWindow();
  
  // 1) jQuery first (required by many HPF builds)
  await loadScriptViaTag(JQUERY_URL);
  const jq = win.jQuery;
  if (!jq) {
    throw new Error(
      `jQuery failed to load. If CSP is active, allow: script-src https://code.jquery.com`
    );
  }
  win.$ = jq;

  // 2) hosted fields SDK
  const hostedFieldsUrl = `${String(GATEWAY_BASE_URL).replace(/\/$/, "")}/sdk/web/v1/js/hostedfields.min.js`;
  await loadScriptViaTag(hostedFieldsUrl);

  // 3) verify namespace (do NOT rely on $.fn.hostedForm)
  if (!win.hostedFields?.classes?.Form) {
    throw new Error(
      `Hosted Fields script loaded but window.hostedFields.classes.Form is missing.\n` +
        `This often means the gateway returned HTML (WAF/error page) instead of JS.\n` +
        `Check DevTools → Network → hostedfields.min.js → Response.`
    );
  }

  return win.hostedFields;
}

type Props = {
  amount: number; // pounds
  orderRef: string;
  customerName?: string;
  customerEmail?: string;
  pupilId?: string;
  instructorId?: string;
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
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const hostedFormRef = useRef<any>(null);

  const amountLabel = useMemo(() => `£${amount.toFixed(2)}`, [amount]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        await loadHostedFieldsSDK();

        const formEl = formRef.current;
        if (!formEl) throw new Error("Form element not mounted");

        // Create HPF Form instance: reads our field containers and injects iframes
        const win = getWindow();
        hostedFormRef.current = new win.hostedFields.classes.Form(formEl, {
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
  }, [onError]);

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

      // Ensure hidden merchantID input exists and is set
      const formEl = formRef.current!;
      let mid = formEl.querySelector('input[name="merchantID"]') as HTMLInputElement | null;
      if (!mid) {
        mid = document.createElement("input");
        mid.type = "hidden";
        mid.name = "merchantID";
        formEl.appendChild(mid);
      }
      mid.value = initData.merchantID;

      // Tokenise: get paymentToken (no redirect)
      const tokenResult = await hostedFormRef.current.getPaymentDetails({ orderRef }, true);

      if (!tokenResult?.success) {
        throw new Error(tokenResult?.message || "Card details invalid");
      }
      const paymentToken = tokenResult.paymentToken as string;
      if (!paymentToken) throw new Error("No paymentToken returned from Hosted Fields");

      // Direct SALE server-to-server
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
      <div className="bg-card rounded-xl shadow-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Secure card payment</h3>
          <span className="text-xl font-bold text-primary">{amountLabel}</span>
        </div>

        {loading && <p className="text-muted-foreground text-center py-4">Loading secure card fields…</p>}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={(e) => e.preventDefault()}
          style={{ display: loading ? "none" : "block" }}
        >
          {/* merchantID is filled at pay time */}
          <input type="hidden" name="merchantID" />
          <input type="hidden" name="action" value="SALE" />

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">Card number</label>
            <div
              data-hostedfield="cardNumber"
              className="h-11 border border-input rounded-lg bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Expiry</label>
              <div
                data-hostedfield="cardExpiryDate"
                className="h-11 border border-input rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">CVV</label>
              <div
                data-hostedfield="cardCVV"
                className="h-11 border border-input rounded-lg bg-background"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={payNow}
            disabled={!ready || submitting}
            className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
