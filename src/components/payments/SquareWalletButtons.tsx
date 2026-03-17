import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface SquareWalletButtonsProps {
  amount: number;
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  onPaid?: () => void;
  onProcessing?: (processing: boolean) => void;
  disabled?: boolean;
  /** Called before payment to ensure booking exists — returns pupilId or null */
  ensureBookingCreated?: () => Promise<string | null>;
}

export function SquareWalletButtons({
  amount,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  onPaid,
  onProcessing,
  disabled = false,
  ensureBookingCreated,
}: SquareWalletButtonsProps) {
  const [loading, setLoading] = useState(true);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [processingWallet, setProcessingWallet] = useState<"apple" | "google" | null>(null);

  const googlePayContainerRef = useRef<HTMLDivElement>(null);
  const applePayRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Initialize Square SDK and wallet buttons
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        // Fetch Square config
        const { data: config, error } = await supabase.functions.invoke("square-wallet-config");
        if (error || !config?.appId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const sdkUrl = config.environment === "production"
          ? "https://web.squarecdn.com/v1/square.js"
          : "https://sandbox.web.squarecdn.com/v1/square.js";

        await loadScript(sdkUrl);
        if (cancelled) return;

        const Square = (window as any).Square;
        if (!Square) { setLoading(false); return; }

        const payments = await Square.payments(config.appId, config.locationId);
        if (cancelled) return;
        paymentsRef.current = payments;

        // Apple Pay
        try {
          const req = payments.paymentRequest({
            countryCode: "GB",
            currencyCode: "GBP",
            total: { amount: amount.toFixed(2), label: "EveryDriver" },
          });
          const applePay = await payments.applePay(req);
          if (!cancelled && applePay) {
            applePayRef.current = applePay;
            setApplePayAvailable(true);
          }
        } catch { /* not available */ }

        // Google Pay
        try {
          const req = payments.paymentRequest({
            countryCode: "GB",
            currencyCode: "GBP",
            total: { amount: amount.toFixed(2), label: "EveryDriver" },
          });
          const googlePay = await payments.googlePay(req);
          if (!cancelled && googlePay && googlePayContainerRef.current) {
            await googlePay.attach(googlePayContainerRef.current, {
              buttonColor: "black",
              buttonType: "long",
              buttonSizeMode: "fill",
            });
            googlePayRef.current = googlePay;
            setGooglePayAvailable(true);
          }
        } catch { /* not available */ }

        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error("[SquareWallet] Init error:", e);
        if (!cancelled) setLoading(false);
      }
    })();

    // Fallback timeout
    const timer = setTimeout(() => { if (loading) setLoading(false); }, 6000);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [amount]);

  const processPayment = useCallback(async (sourceId: string, resolvedPupilId?: string) => {
    try {
      const orderRef = `SQ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { data, error } = await supabase.functions.invoke("square-payment", {
        body: {
          sourceId,
          amount,
          orderReference: orderRef,
          customerEmail,
          customerName,
          pupilId: resolvedPupilId || pupilId,
          instructorId,
          idempotencyKey: `${orderRef}-${Date.now()}`,
          description: "Payment via EveryDriver",
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Payment failed");
      toast.success("Payment successful!");
      onPaid?.();
    } catch (e: any) {
      throw e;
    }
  }, [amount, customerEmail, customerName, pupilId, instructorId, onPaid]);

  const handleWalletPay = useCallback(async (type: "apple" | "google") => {
    const ref = type === "apple" ? applePayRef : googlePayRef;
    if (!ref.current) return;

    setProcessingWallet(type);
    onProcessing?.(true);

    try {
      // Ensure booking exists if needed
      let resolvedPupilId = pupilId;
      if (ensureBookingCreated) {
        const id = await ensureBookingCreated();
        if (!id) { setProcessingWallet(null); onProcessing?.(false); return; }
        resolvedPupilId = id;
      }

      const result = await ref.current.tokenize();
      if (result.status !== "OK") {
        toast.error(`${type === "apple" ? "Apple" : "Google"} Pay was cancelled`);
        setProcessingWallet(null);
        onProcessing?.(false);
        return;
      }
      await processPayment(result.token, resolvedPupilId);
    } catch (e: any) {
      const msg = e?.message || "";
      if (!msg.includes("cancel") && !msg.includes("CANCELED")) {
        toast.error(e?.message || `${type === "apple" ? "Apple" : "Google"} Pay failed`);
      }
      setProcessingWallet(null);
      onProcessing?.(false);
    }
  }, [pupilId, ensureBookingCreated, processPayment, onProcessing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Checking wallet availability...</span>
      </div>
    );
  }

  if (!applePayAvailable && !googlePayAvailable) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <div className="h-px flex-1 bg-border" />
        <span>Express Checkout</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-2">
        {applePayAvailable && (
          processingWallet === "apple" ? (
            <div className="w-full h-[44px] bg-black rounded-lg flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            </div>
          ) : (
            <button
              onClick={() => handleWalletPay("apple")}
              disabled={disabled || !!processingWallet || amount <= 0}
              className="w-full h-[44px] rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              style={{
                WebkitAppearance: '-apple-pay-button',
                appearance: '-apple-pay-button' as any,
                '--apple-pay-button-type': 'pay',
                '--apple-pay-button-style': 'black',
              } as React.CSSProperties}
            />
          )
        )}

        {googlePayAvailable && (
          processingWallet === "google" ? (
            <div className="w-full h-[44px] bg-black rounded-lg flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            </div>
          ) : (
            <div
              ref={googlePayContainerRef}
              className={`min-h-[44px] [&>div]:!w-full [&>div]:!h-[44px] ${disabled || processingWallet ? "opacity-50 pointer-events-none" : ""}`}
            />
          )
        )}
      </div>

      {processingWallet && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm">Processing {processingWallet === "apple" ? "Apple" : "Google"} Pay...</span>
        </div>
      )}
    </div>
  );
}
