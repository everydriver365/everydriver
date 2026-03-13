import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CreditCard, Shield, Apple } from "lucide-react";
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
        HostedFields: new (config: HostedFieldsConfig) => HostedFieldsInstance;
      };
    };
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

interface HostedFieldsConfig {
  merchantID: string;
  stylesheet?: string;
  fields: {
    cardNumber: { selector: string; placeholder?: string };
    cardExpiryDate: { selector: string; placeholder?: string };
    cardCVV: { selector: string; placeholder?: string };
  };
}

interface HostedFieldsInstance {
  getPaymentDetails(options?: { customerName?: string }): Promise<{
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

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize Hosted Fields using their SDK
        if (window.hostedFields?.classes?.HostedFields) {
          const instance = new window.hostedFields.classes.HostedFields({
            merchantID: merchantIdForHPF,
            stylesheet: "https://gateway.cardstream.com/sdk/web/v1/css/hostedfields.min.css",
            fields: {
              cardNumber: { selector: "#cs-card-number", placeholder: "•••• •••• •••• ••••" },
              cardExpiryDate: { selector: "#cs-card-expiry", placeholder: "MM/YY" },
              cardCVV: { selector: "#cs-card-cvv", placeholder: "•••" },
            },
          });

          hostedFieldsRef.current = instance;
          setFieldsReady(true);
        }

        setLoading(false);
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
              <Button
                onClick={payWithApplePay}
                disabled={paying || !orderRef}
                className="w-full bg-black hover:bg-gray-800 text-white h-12"
              >
                {paying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Apple className="h-5 w-5 mr-2" />
                    Pay with Apple Pay
                  </>
                )}
              </Button>
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
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Card number</label>
                <div 
                  id="cs-card-number" 
                  className="h-10 border rounded-md bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Expiry</label>
                  <div 
                    id="cs-card-expiry" 
                    className="h-10 border rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">CVV</label>
                  <div 
                    id="cs-card-cvv" 
                    className="h-10 border rounded-md bg-background"
                  />
                </div>
              </div>
            </div>

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
