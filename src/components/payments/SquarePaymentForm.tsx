import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";

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

type Props = {
  amount: number;
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  onPaid?: () => void;
  onCancel?: () => void;
};

interface SquareConfig {
  appId: string;
  locationId: string;
  environment: string;
}

export function SquarePaymentForm({
  amount,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  customerPhone,
  description,
  onPaid,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [config, setConfig] = useState<SquareConfig | null>(null);

  const cardContainerRef = useRef<HTMLDivElement>(null);
  const applePayContainerRef = useRef<HTMLDivElement>(null);
  const googlePayContainerRef = useRef<HTMLDivElement>(null);
  const cardInstanceRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const [cardReady, setCardReady] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const applePayRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);

  const orderRef = useRef(`SQ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const teardownPaymentMethods = useCallback(async () => {
    await Promise.allSettled([
      cardInstanceRef.current?.destroy?.(),
      applePayRef.current?.destroy?.(),
      googlePayRef.current?.destroy?.(),
    ]);

    cardInstanceRef.current = null;
    applePayRef.current = null;
    googlePayRef.current = null;
    paymentsRef.current = null;

    if (cardContainerRef.current) cardContainerRef.current.innerHTML = "";
    if (applePayContainerRef.current) applePayContainerRef.current.innerHTML = "";
    if (googlePayContainerRef.current) googlePayContainerRef.current.innerHTML = "";

    if (mountedRef.current) {
      setCardReady(false);
      setApplePayAvailable(false);
      setGooglePayAvailable(false);
    }
  }, []);

  // Fetch Square config
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("square-wallet-config");
        if (error || !data?.appId) {
          if (mountedRef.current) setLoadError("Payment system unavailable");
          return;
        }
        if (mountedRef.current) setConfig(data);
      } catch {
        if (mountedRef.current) setLoadError("Failed to load payment config");
      }
    })();
    return () => { mountedRef.current = false; };
  }, []);

  // Initialize Square Web Payments SDK
  useEffect(() => {
    if (!config) return;

    let cancelled = false;

    (async () => {
      try {
        await teardownPaymentMethods();
        if (cancelled) return;

        // Load Square SDK
        const env = (config.environment || "").toLowerCase();
        const isProduction = env === "production" || env === "prod" || env === "live";
        const sdkUrl = isProduction
          ? "https://web.squarecdn.com/v1/square.js"
          : "https://sandbox.web.squarecdn.com/v1/square.js";

        await loadScript(sdkUrl);
        if (cancelled) return;

        const Square = (window as any).Square;
        if (!Square) throw new Error("Square SDK not loaded");

        const payments = await Square.payments(config.appId, config.locationId);
        if (cancelled) return;
        paymentsRef.current = payments;

        // Initialize Card
        if (cardContainerRef.current) {
          const card = await payments.card();
          if (cancelled) {
            await card.destroy?.();
            return;
          }
          await card.attach(cardContainerRef.current);
          cardInstanceRef.current = card;
          if (!cancelled) setCardReady(true);
        }

        // Initialize Apple Pay
        try {
          const paymentRequest = payments.paymentRequest({
            countryCode: "GB",
            currencyCode: "GBP",
            total: { amount: amount.toFixed(2), label: "EveryDriver" },
          });
          const applePay = await payments.applePay(paymentRequest);
          if (!cancelled && applePay) {
            applePayRef.current = applePay;
            setApplePayAvailable(true);
          }
        } catch (e) {
          console.log("[SquarePayment] Apple Pay not available:", e);
        }

        // Initialize Google Pay
        try {
          const paymentRequest = payments.paymentRequest({
            countryCode: "GB",
            currencyCode: "GBP",
            total: { amount: amount.toFixed(2), label: "EveryDriver" },
          });
          const googlePay = await payments.googlePay(paymentRequest);
          if (!cancelled && googlePay && googlePayContainerRef.current) {
            await googlePay.attach(googlePayContainerRef.current, {
              buttonColor: "black",
              buttonType: "long",
              buttonSizeMode: "fill",
            });
            googlePayRef.current = googlePay;
            setGooglePayAvailable(true);
          }
        } catch (e) {
          console.log("[SquarePayment] Google Pay not available:", e);
        }

        if (!cancelled) setLoading(false);
      } catch (e: any) {
        console.error("[SquarePayment] Init error:", e);
        if (!cancelled) {
          setLoadError(e?.message || "Failed to initialize payment form");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      void teardownPaymentMethods();
    };
  }, [config, amount, teardownPaymentMethods]);

  const processPayment = useCallback(async (sourceId: string) => {
    setPaying(true);
    try {
      const idempotencyKey = `${orderRef.current}-${Date.now()}`;
      const { data, error } = await supabase.functions.invoke("square-payment", {
        body: {
          sourceId,
          amount,
          orderReference: orderRef.current,
          customerEmail,
          customerName,
          customerPhone,
          pupilId,
          instructorId,
          idempotencyKey,
          description: description || "Payment via EveryDriver",
        },
      });

      if (error) {
        // The edge function returned a non-2xx - parse the body for a friendly message
        const bodyText = typeof error === "object" && error.context?.body ? error.context.body : null;
        let friendlyMsg = "Payment failed. Please try again.";
        if (bodyText) {
          try {
            const parsed = JSON.parse(bodyText);
            if (parsed?.error) friendlyMsg = parsed.error;
          } catch { /* use default */ }
        }
        throw new Error(friendlyMsg);
      }
      if (!data?.success) throw new Error(data?.error || "Payment was not completed");

      toast.success("Payment successful!");
      onPaid?.();
    } catch (e: any) {
      console.error("[SquarePayment] Payment error:", e);
      const msg = e?.message || "Payment failed. Please try again.";
      const isDecline = msg.toLowerCase().includes("declined") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid card");
      toast.error(msg, {
        duration: isDecline ? 8000 : 5000,
        icon: isDecline ? "🚫" : undefined,
        style: isDecline ? { border: "2px solid hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" } : undefined,
      });
    } finally {
      setPaying(false);
    }
  }, [amount, customerEmail, customerName, pupilId, instructorId, description, onPaid]);

  const handleCardPay = useCallback(async () => {
    if (!cardInstanceRef.current) return;
    setPaying(true);
    try {
      const result = await cardInstanceRef.current.tokenize();
      if (result.status !== "OK") {
        const errors = result.errors?.map((e: any) => e.message).join(". ") || "Card validation failed";
        toast.error(errors);
        setPaying(false);
        return;
      }
      await processPayment(result.token);
    } catch (e: any) {
      console.error("[SquarePayment] Card tokenize error:", e);
      toast.error("Failed to process card. Please try again.");
      setPaying(false);
    }
  }, [processPayment]);

  const handleApplePay = useCallback(async () => {
    if (!applePayRef.current) return;
    setPaying(true);
    try {
      const result = await applePayRef.current.tokenize();
      if (result.status !== "OK") {
        toast.error("Apple Pay was cancelled or failed");
        setPaying(false);
        return;
      }
      await processPayment(result.token);
    } catch (e: any) {
      if (!e?.message?.includes("cancel")) {
        toast.error("Apple Pay failed. Please try another method.");
      }
      setPaying(false);
    }
  }, [processPayment]);

  const handleGooglePay = useCallback(async () => {
    if (!googlePayRef.current) return;
    setPaying(true);
    try {
      const result = await googlePayRef.current.tokenize();
      if (result.status !== "OK") {
        toast.error("Google Pay was cancelled or failed");
        setPaying(false);
        return;
      }
      await processPayment(result.token);
    } catch (e: any) {
      if (!e?.message?.includes("cancel") && !e?.message?.includes("CANCELED")) {
        toast.error("Google Pay failed. Please try another method.");
      }
      setPaying(false);
    }
  }, [processPayment]);

  if (loadError) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <CreditCard className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  const amountLabel = `£${amount.toFixed(2)}`;
  const hasWalletButtons = applePayAvailable || googlePayAvailable;

  return (
    <div className="w-full space-y-3">
      {/* Apple Pay */}
      {applePayAvailable && (
        paying ? (
          <div className="w-full h-12 bg-black rounded-lg flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        ) : (
          <button
            onClick={handleApplePay}
            disabled={paying}
            className="w-full h-12 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            style={{
              WebkitAppearance: '-apple-pay-button',
              appearance: '-apple-pay-button' as any,
              '--apple-pay-button-type': 'pay',
              '--apple-pay-button-style': 'black',
            } as React.CSSProperties}
          />
        )
      )}

      {/* Google Pay container — always mounted so ref is available during init */}
      <div
        ref={googlePayContainerRef}
        className={`${googlePayAvailable ? "min-h-[48px]" : "hidden"} [&>div]:!w-full ${paying ? "opacity-50 pointer-events-none" : ""}`}
      />

      {/* Divider */}
      {hasWalletButtons && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or pay with card</span>
          </div>
        </div>
      )}

      {/* Square Card Form — container always mounted so ref is available during init */}
      {loading && (
        <div className="w-full h-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={cardContainerRef} className={loading ? "hidden" : "min-h-[44px]"} />
      {!loading && (
        <Button
          onClick={handleCardPay}
          disabled={paying || !cardReady}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {paying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {amountLabel}
            </>
          )}
        </Button>
      )}

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 text-emerald-600" />
        <span>Secured by Square — card details never touch our servers</span>
      </div>

      {/* Cancel */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
