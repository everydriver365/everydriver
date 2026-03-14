import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    ApplePaySession?: {
      canMakePayments(): boolean;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
      new (version: number, request: ApplePayPaymentRequest): ApplePaySessionInstance;
    };
    hostedFields?: {
      classes: {
        Form: unknown;
        Field: unknown;
      };
    };
    jQuery?: {
      fn?: {
        hostedForm?: (...args: unknown[]) => unknown;
      };
      (selector: string): {
        hostedForm: (...args: unknown[]) => unknown;
      };
    };
    $?: Window["jQuery"];
  }
}

interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: { label: string; amount: string };
}

interface ApplePaySessionInstance {
  onvalidatemerchant: (event: { validationURL: string }) => void;
  onpaymentauthorized: (event: { payment: { token: unknown } }) => void;
  oncancel: () => void;
  begin(): void;
  abort(): void;
  completeMerchantValidation(session: unknown): void;
  completePayment(status: number): void;
}

interface HostedFieldsInstance {
  getPaymentDetails(options?: { customerName?: string; customerEmail?: string }): Promise<{
    success: boolean;
    paymentToken?: string;
    error?: string;
  }>;
  destroy(): void;
}

type Props = {
  amount: number; // pounds
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  onPaid?: () => void;
  merchantIdForHPF: string;
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function toPromise<T>(value: T | PromiseLike<T>): Promise<T> {
  if (value && typeof (value as PromiseLike<T>).then === "function") {
    return new Promise<T>((resolve, reject) => {
      (value as PromiseLike<T>).then(resolve, reject);
    });
  }
  return Promise.resolve(value);
}

export function CardstreamCheckout({
  amount,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  onPaid,
  merchantIdForHPF,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const hostedFieldsRef = useRef<HostedFieldsInstance | null>(null);
  const [fieldsReady, setFieldsReady] = useState(false);

  const canApplePay = useMemo(() => {
    return typeof window !== 'undefined' && 
           !!window.ApplePaySession && 
           window.ApplePaySession.canMakePayments?.();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setFieldsReady(false);

        // Create intent
        const { data, error } = await supabase.functions.invoke("payment-intent-create", {
          body: { amount, pupilId, instructorId, customerName, customerEmail, currency: "GBP" },
        });
        
        if (cancelled) return;
        if (error || !data?.success) throw new Error(error?.message || "Failed to create payment intent");

        setOrderRef(data.orderRef);

        // Load Hosted Fields script
        await loadScript(data.hostedFieldsScriptUrl);
        
        if (cancelled) return;

        // Render field containers first, then initialize SDK
        setLoading(false);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => setTimeout(resolve, 50));

        if (cancelled) return;

        const $ = window.jQuery || window.$;
        if (!$?.fn?.hostedForm) {
          throw new Error("Secure card fields SDK unavailable");
        }

        const formSelection = $("#cs-payment-form") as {
          hostedForm: (...args: unknown[]) => unknown;
        };

        formSelection.hostedForm({
          merchantID: merchantIdForHPF || data.merchantId,
          stylesheet: "https://gateway.cardstream.com/sdk/web/v1/css/hostedfields.min.css",
          autoSetup: true,
          autoSubmit: false,
          fields: {
            cardNumber: { selector: "#cs-card-number", placeholder: "•••• •••• •••• ••••" },
            cardExpiryDate: { selector: "#cs-card-expiry", placeholder: "MM/YY" },
            cardCVV: { selector: "#cs-card-cvv", placeholder: "•••" },
          },
        });

        const instance = formSelection.hostedForm("instance") as {
          getPaymentDetails: (options?: { customerName?: string; customerEmail?: string }) => PromiseLike<{
            success: boolean;
            paymentToken?: string;
            error?: string;
          }>;
          destroy?: () => void;
        } | null;

        if (!instance) {
          throw new Error("Failed to initialize secure card fields");
        }

        hostedFieldsRef.current = {
          getPaymentDetails: (options) =>
            toPromise(
              instance.getPaymentDetails({
                customerName: options?.customerName,
                customerEmail: options?.customerEmail,
              }),
            ),
          destroy: () => instance.destroy?.(),
        };

        setFieldsReady(true);
      } catch (e) {
        if (!cancelled) {
          setLoading(false);
          console.error("CardstreamCheckout init error:", e);
          toast.error(e instanceof Error ? e.message : "Failed to initialize payment");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (hostedFieldsRef.current) {
        hostedFieldsRef.current.destroy?.();
      }
    };
  }, [amount, pupilId, instructorId, customerName, customerEmail, merchantIdForHPF]);

  const payWithCard = useCallback(async () => {
    if (!orderRef || !hostedFieldsRef.current) return;

    try {
      setPaying(true);

      const details = await hostedFieldsRef.current.getPaymentDetails({
        customerName: customerName ?? "",
        customerEmail: customerEmail ?? "",
      });

      if (!details?.success || !details?.paymentToken) {
        throw new Error(details?.error || "Card details invalid or tokenization failed");
      }

      const { data, error } = await supabase.functions.invoke("payment-direct-sale", {
        body: {
          orderRef,
          method: "card_token",
          cardPaymentToken: details.paymentToken,
          customerName,
          customerEmail,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.responseMessage || "Payment failed");

      toast.success("Payment successful!");
      onPaid?.();
    } catch (e) {
      console.error("Card payment error:", e);
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }, [orderRef, customerName, customerEmail, onPaid]);

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
        } catch (err) {
          console.error("Apple Pay merchant validation error:", err);
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
        } catch (err) {
          console.error("Apple Pay authorization error:", err);
          session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
          toast.error("Apple Pay payment failed");
        }
      };

      session.oncancel = () => {
        setPaying(false);
      };

      session.begin();
    } catch (e) {
      console.error("Apple Pay error:", e);
      toast.error("Failed to start Apple Pay");
      setPaying(false);
    }
  }, [orderRef, amount, customerName, customerEmail, onPaid]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold">Pay £{amount.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-1">Secure payment</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading secure payment fields…</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
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

            {canApplePay && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or pay with card</span>
                </div>
              </div>
            )}

            {/* Card Fields */}
            <form id="cs-payment-form" className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="text-sm font-medium mb-1 block">Card number</label>
                <input
                  id="cs-card-number"
                  type="hostedfield:cardNumber"
                  className="h-10 w-full border rounded-md bg-background px-3"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Expiry</label>
                  <input
                    id="cs-card-expiry"
                    type="hostedfield:cardExpiryDate"
                    className="h-10 w-full border rounded-md bg-background px-3"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">CVV</label>
                  <input
                    id="cs-card-cvv"
                    type="hostedfield:cardCVV"
                    className="h-10 w-full border rounded-md bg-background px-3"
                    autoComplete="off"
                  />
                </div>
              </div>
            </form>

            {/* Pay Button */}
            <Button
              onClick={payWithCard}
              disabled={paying || !orderRef || !fieldsReady}
              className="w-full h-12"
            >
              {paying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay £{amount.toFixed(2)}
                </>
              )}
            </Button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Card details are collected securely via hosted fields</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
