import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Configurable gateway base URL - defaults to standard Cardstream gateway
const DEFAULT_GATEWAY_BASE_URL = 
  import.meta.env.VITE_CARDSTREAM_GATEWAY_BASE_URL || "https://gateway.cardstream.com";

// Access hostedFields from window without conflicting with other type declarations
const getHostedFieldsFormClass = (): (new (el: HTMLFormElement, options: any) => any) | null => {
  const hf = (window as any).hostedFields;
  return hf?.classes?.Form || null;
};

const getJQuery = (): any => (window as any).jQuery;
const setJQuery = (jq: any) => { (window as any).$ = jq; };

/**
 * Strict script loader with timeout and detailed diagnostics
 */
function loadScript(src: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      console.log(`[CardstreamLoader] Script already loaded: ${src}`);
      return resolve();
    }

    console.log(`[CardstreamLoader] Loading script: ${src}`);

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";

    const t = window.setTimeout(() => {
      console.error(`[CardstreamLoader] TIMEOUT loading script after ${timeoutMs}ms: ${src}`);
      console.error(`[CardstreamLoader] Check: Network tab for status, CSP violations, ad-blockers`);
      reject(new Error(`Timed out loading script: ${src}`));
    }, timeoutMs);

    s.onload = () => {
      window.clearTimeout(t);
      console.log(`[CardstreamLoader] Successfully loaded: ${src}`);
      resolve();
    };

    s.onerror = (event) => {
      window.clearTimeout(t);
      console.error(`[CardstreamLoader] FAILED to load script: ${src}`);
      console.error(`[CardstreamLoader] Possible causes:`);
      console.error(`  1. CSP blocking the script - check Console for CSP violations`);
      console.error(`  2. Ad-blocker blocking the request`);
      console.error(`  3. Network error - check Network tab for HTTP status`);
      console.error(`  4. Wrong gateway hostname - verify VITE_CARDSTREAM_GATEWAY_BASE_URL`);
      console.error(`[CardstreamLoader] Event:`, event);
      reject(new Error(
        `Failed to load script: ${src}. Check DevTools Console/Network for CSP violations or blocked requests.`
      ));
    };

    document.head.appendChild(s);
  });
}

/**
 * Run diagnostics on SDK state and log to console
 */
function runDiagnostics(gatewayBaseUrl: string): void {
  console.log(`[CardstreamLoader] ========== DIAGNOSTICS ==========`);
  console.log(`[CardstreamLoader] Gateway Base URL: ${gatewayBaseUrl}`);
  console.log(`[CardstreamLoader] SDK URL: ${gatewayBaseUrl}/sdk/web/v1/js/hostedfields.min.js`);
  console.log(`[CardstreamLoader] jQuery loaded: ${!!getJQuery()}`);
  console.log(`[CardstreamLoader] window.jQuery: ${!!(window as any).jQuery}`);
  console.log(`[CardstreamLoader] window.$: ${!!(window as any).$}`);
  console.log(`[CardstreamLoader] window.hostedFields: ${!!(window as any).hostedFields}`);
  console.log(`[CardstreamLoader] window.hostedFields.classes: ${!!(window as any).hostedFields?.classes}`);
  console.log(`[CardstreamLoader] window.hostedFields.classes.Form: ${!!getHostedFieldsFormClass()}`);
  console.log(`[CardstreamLoader] ================================`);
}

type CardstreamHostedFieldsCheckoutProps = {
  amount: number; // pounds
  orderRef: string;
  customerName?: string;
  customerEmail?: string;
  pupilId?: string;
  instructorId?: string;
  gatewayBaseUrl?: string; // Override env var if needed
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
  gatewayBaseUrl,
  onSuccess,
  onError,
}: CardstreamHostedFieldsCheckoutProps) {
  // Use prop override, then env var, then default
  const resolvedGatewayBaseUrl = useMemo(() => {
    const url = (gatewayBaseUrl || DEFAULT_GATEWAY_BASE_URL).replace(/\/$/, "");
    console.log(`[CardstreamLoader] Using gateway base URL: ${url}`);
    return url;
  }, [gatewayBaseUrl]);

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const hostedFormRef = useRef<any>(null);

  const hostedFieldsUrl = useMemo(() => {
    return `${resolvedGatewayBaseUrl}/sdk/web/v1/js/hostedfields.min.js`;
  }, [resolvedGatewayBaseUrl]);

  const amountLabel = useMemo(() => `£${amount.toFixed(2)}`, [amount]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[CardstreamLoader] Initializing Hosted Fields...`);
        console.log(`[CardstreamLoader] Env VITE_CARDSTREAM_GATEWAY_BASE_URL: ${import.meta.env.VITE_CARDSTREAM_GATEWAY_BASE_URL || '(not set)'}`);

        // 1) Load jQuery FIRST (Hosted Fields needs it)
        console.log(`[CardstreamLoader] Step 1: Loading jQuery...`);
        await loadScript("https://code.jquery.com/jquery-3.7.1.min.js");

        // Force globals
        const jq = getJQuery();
        if (!jq) {
          console.error(`[CardstreamLoader] jQuery script loaded but window.jQuery is undefined!`);
          console.error(`[CardstreamLoader] This can happen if another script overwrites jQuery or CSP blocks evaluation.`);
          throw new Error("jQuery loaded but window.jQuery is missing (blocked or overridden)");
        }
        setJQuery(jq);
        console.log(`[CardstreamLoader] jQuery ready: v${jq.fn?.jquery || 'unknown'}`);

        // 2) Load hosted fields SDK from configurable gateway
        console.log(`[CardstreamLoader] Step 2: Loading Hosted Fields SDK from ${hostedFieldsUrl}...`);
        await loadScript(hostedFieldsUrl);

        // 3) Verify SDK is available
        console.log(`[CardstreamLoader] Step 3: Verifying SDK...`);
        runDiagnostics(resolvedGatewayBaseUrl);

        const FormClass = getHostedFieldsFormClass();
        if (!FormClass) {
          console.error(`[CardstreamLoader] SDK loaded but Form class not found!`);
          console.error(`[CardstreamLoader] The script may have loaded an empty/error response.`);
          console.error(`[CardstreamLoader] Check Network tab: is hostedfields.min.js returning valid JS?`);
          throw new Error(
            "Hosted Fields SDK loaded but window.hostedFields.classes.Form is missing. " +
            "Check CSP/adblock and verify gateway hostname is correct."
          );
        }

        const formEl = formRef.current;
        if (!formEl) throw new Error("Form element not mounted");

        // 4) Create hosted fields form instance
        console.log(`[CardstreamLoader] Step 4: Creating HostedFields Form instance...`);
        hostedFormRef.current = new FormClass(formEl, {
          autoSetup: true,
          autoSubmit: false,
          nativeEvents: true,
        });

        if (!cancelled) {
          console.log(`[CardstreamLoader] ✓ Hosted Fields ready!`);
          setReady(true);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || "Failed to init Hosted Fields";
          console.error(`[CardstreamLoader] Initialization failed:`, msg);
          runDiagnostics(resolvedGatewayBaseUrl);
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
  }, [hostedFieldsUrl, resolvedGatewayBaseUrl, onError]);

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
      console.log(`[CardstreamLoader] Tokenising card data...`);
      const tokenResult = await hostedFormRef.current.getPaymentDetails({ orderRef }, true);

      if (!tokenResult?.success) {
        throw new Error(tokenResult?.message || "Card details invalid");
      }
      const paymentToken = tokenResult.paymentToken as string;
      if (!paymentToken) throw new Error("No paymentToken returned from Hosted Fields");

      console.log(`[CardstreamLoader] Token received, processing payment...`);

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

      console.log(`[CardstreamLoader] ✓ Payment successful!`);
      onSuccess?.(saleData);
    } catch (e: any) {
      const msg = e?.message || "Payment failed";
      console.error(`[CardstreamLoader] Payment error:`, msg);
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
            <p className="font-medium mb-1">Payment Error</p>
            <p>{error}</p>
            <p className="mt-2 text-xs opacity-75">Check browser DevTools Console for diagnostics.</p>
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
