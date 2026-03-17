import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { CardstreamEmbeddedCardForm } from "./CardstreamEmbeddedCardForm";

import type { GooglePayClient } from "@/types/payment-types";

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
  amount: number; // pounds
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostcode?: string;
  onPaid?: () => void;
  onCancel?: () => void;
};

export function CardstreamCheckout({
  amount,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  customerPostcode,
  onPaid,
  onCancel,
}: Props) {
  const [paying, setPaying] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string>("");
  const [signedFormFields, setSignedFormFields] = useState<Record<string, string> | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string>("");
  const [canGooglePay, setCanGooglePay] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const googlePayClientRef = useRef<GooglePayClient | null>(null);

  const canApplePay = useMemo(() => {
    return typeof window !== 'undefined' && 
           !!window.ApplePaySession && 
           window.ApplePaySession.canMakePayments?.();
  }, []);

  const baseCardPaymentMethod = useMemo(() => ({
    type: "CARD",
    parameters: {
      allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
      allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
    },
  }), []);

  // Detect Google Pay availability
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript("https://pay.google.com/gp/p/js/pay.js");
        const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
        if (!PaymentsClient) return;

        const env = window.location.hostname.includes("lovable.app") ? "TEST" : "PRODUCTION";
        const client = new PaymentsClient({ environment: env });
        const ready = await client.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [baseCardPaymentMethod],
        });
        if (!cancelled && ready.result) {
          googlePayClientRef.current = client;
          setCanGooglePay(true);
        }
      } catch (e) {
        console.warn("Google Pay not available:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [baseCardPaymentMethod]);

  // Create payment intent — now returns signedFormFields for card form submission
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("payment-intent-create", {
          body: {
            amount, pupilId, instructorId, customerName, customerEmail, currency: "GBP",
            customerAddress: customerAddress || undefined,
            customerPostcode: customerPostcode || undefined,
          },
        });
        if (cancelled) return;
        if (error || !data?.success) return;
        setOrderRef(data.orderRef);
        if (data.merchantId) setMerchantId(data.merchantId);
        if (data.signedFormFields) setSignedFormFields(data.signedFormFields);
        if (data.gatewayUrl) setGatewayUrl(data.gatewayUrl);
      } catch (e) {
        console.error("Payment intent creation error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [amount, pupilId, instructorId, customerName, customerEmail]);

  // Apple Pay
  const payWithApplePay = useCallback(async () => {
    if (!orderRef || !window.ApplePaySession) return;

    try {
      setPaying(true);

      const session = new window.ApplePaySession(3, {
        countryCode: "GB",
        currencyCode: "GBP",
        supportedNetworks: ["visa", "masterCard", "amex"],
        merchantCapabilities: ["supports3DS"],
        total: { label: "EveryDriver", amount: amount.toFixed(2) },
      });

      session.onvalidatemerchant = async (event) => {
        try {
          const { data, error } = await supabase.functions.invoke("applepay-validate-merchant", {
            body: { validationURL: event.validationURL, domainName: window.location.hostname },
          });
          if (error || !data) {
            session.abort();
            toast.error("Apple Pay validation failed");
            setPaying(false);
            return;
          }
          session.completeMerchantValidation(data);
        } catch {
          session.abort();
          toast.error("Apple Pay validation failed");
          setPaying(false);
        }
      };

      session.onpaymentauthorized = async (event) => {
        try {
          const tokenStr = JSON.stringify(event.payment.token);
          const { data, error } = await supabase.functions.invoke("payment-direct-sale", {
            body: {
              orderRef,
              method: "apple_pay",
              applePayPaymentToken: tokenStr,
              customerName,
              customerEmail,
            },
          });
          if (error || !data?.success) {
            session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
            toast.error(data?.responseMessage || "Apple Pay payment failed");
            return;
          }
          session.completePayment(window.ApplePaySession!.STATUS_SUCCESS);
          toast.success("Apple Pay payment successful!");
          onPaid?.();
        } catch {
          session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
          toast.error("Apple Pay payment failed");
        }
      };

      session.oncancel = () => setPaying(false);
      session.begin();
    } catch {
      toast.error("Failed to start Apple Pay");
      setPaying(false);
    }
  }, [orderRef, amount, customerName, customerEmail, onPaid]);

  // Google Pay
  const payWithGooglePay = useCallback(async () => {
    if (!orderRef || !googlePayClientRef.current) return;

    try {
      setPaying(true);

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          ...baseCardPaymentMethod,
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY",
            parameters: {
              gateway: "cardstream",
              gatewayMerchantId: merchantId,
            },
          },
        }],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: amount.toFixed(2),
          currencyCode: "GBP",
          countryCode: "GB",
        },
        merchantInfo: { merchantName: "EveryDriver" },
      };

      const paymentData = await googlePayClientRef.current.loadPaymentData(paymentDataRequest);
      const token = paymentData.paymentMethodData.tokenizationData.token;

      const { data, error } = await supabase.functions.invoke("payment-direct-sale", {
        body: {
          orderRef,
          method: "google_pay",
          googlePayPaymentToken: token,
          customerName,
          customerEmail,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.responseMessage || "Google Pay payment failed");

      toast.success("Google Pay payment successful!");
      onPaid?.();
    } catch (e: any) {
      if (e?.statusCode !== "CANCELED") {
        console.error("Google Pay error:", e);
        toast.error(e instanceof Error ? e.message : "Google Pay payment failed");
      }
    } finally {
      setPaying(false);
    }
  }, [orderRef, amount, merchantId, baseCardPaymentMethod, customerName, customerEmail, onPaid]);

  const hasWalletButtons = canApplePay || canGooglePay;

  return (
    <div className="w-full space-y-3">
      {/* Apple Pay Button */}
      {canApplePay && (
        paying ? (
          <div className="w-full h-12 bg-black rounded-lg flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        ) : (
          <button
            onClick={payWithApplePay}
            disabled={paying || !orderRef}
            className="w-full h-12 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            style={{
              // @ts-ignore — Apple Pay native button styling
              WebkitAppearance: '-apple-pay-button',
              appearance: '-apple-pay-button' as any,
              '--apple-pay-button-type': 'pay',
              '--apple-pay-button-style': 'black',
            } as React.CSSProperties}
          />
        )
      )}

      {/* Google Pay Button */}
      {canGooglePay && (
        paying ? (
          <div className="w-full h-12 bg-black rounded-lg flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        ) : (
          <button
            onClick={payWithGooglePay}
            disabled={paying || !orderRef}
            className="w-full h-12 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none border-0 overflow-hidden"
            style={{ background: '#000', padding: 0 }}
          >
            <div className="flex items-center justify-center gap-2 h-full text-white font-medium text-base">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.24 10.28V14.06H18.72C18.43 15.6 17.56 16.9 16.22 17.78L19.4 20.28C21.2 18.62 22.24 16.16 22.24 13.12C22.24 12.36 22.17 11.64 22.04 10.96H12.24V10.28Z" fill="#4285F4"/>
                <path d="M5.33 14.27L4.44 14.95L1.84 16.95C3.72 20.68 7.56 23.24 12 23.24C14.88 23.24 17.32 22.32 19.16 20.72L15.98 18.22C15.04 18.86 13.84 19.24 12 19.24C9.2 19.24 6.84 17.56 5.92 15.22L5.33 14.27Z" fill="#34A853"/>
                <path d="M1.84 7.05C0.96 8.78 0.48 10.74 0.48 12.84C0.48 14.94 0.96 16.9 1.84 18.63L5.92 15.22C5.64 14.38 5.48 13.5 5.48 12.56C5.48 11.62 5.64 10.74 5.92 9.9L1.84 7.05Z" fill="#FBBC05"/>
                <path d="M12 4.76C13.76 4.76 15.34 5.36 16.58 6.52L19.24 3.86C17.3 2.06 14.86 0.96 12 0.96C7.56 0.96 3.72 3.52 1.84 7.25L5.92 10.1C6.84 7.76 9.2 6.08 12 4.76Z" fill="#EA4335"/>
              </svg>
              <span>Pay</span>
            </div>
          </button>
        )
      )}

      {/* Divider between wallet buttons and card form */}
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

      {/* Embedded Card Payment Form */}
      {orderRef && merchantId && signedFormFields && gatewayUrl && !embedFailed ? (
        <CardstreamEmbeddedCardForm
          amount={amount}
          orderRef={orderRef}
          merchantId={merchantId}
          signedFormFields={signedFormFields}
          gatewayUrl={gatewayUrl}
          pupilId={pupilId}
          instructorId={instructorId}
          customerName={customerName}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          customerPostcode={customerPostcode}
          onPaid={() => onPaid?.()}
          onError={(msg) => toast.error(msg)}
          onInitError={() => setEmbedFailed(true)}
          disabled={paying}
        />
      ) : orderRef && embedFailed ? (
        <div className="text-center space-y-3 py-4">
          <p className="text-sm text-destructive">The secure card form could not load.</p>
          <Button
            variant="outline"
            className="w-full h-12 text-base font-semibold"
            onClick={() => setEmbedFailed(false)}
          >
            <CreditCard className="mr-2 h-4 w-4" />Retry card form
          </Button>
        </div>
      ) : (
        <div className="w-full h-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 text-emerald-600" />
        <span>Secured by Elavon — card details never touch our servers</span>
      </div>

      {/* Cancel button */}
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
