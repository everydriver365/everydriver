import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Shield, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    jQuery?: any;
    hostedFields?: {
      classes: {
        Form: new (element: HTMLElement, options?: Record<string, unknown>) => any;
        Field: any;
      };
    };
    ApplePaySession?: {
      canMakePayments(): boolean;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
      new (version: number, request: ApplePayPaymentRequest): ApplePaySessionInstance;
    };
    google?: {
      payments?: {
        api?: {
          PaymentsClient: new (config: { environment: string }) => GooglePayClient;
        };
      };
    };
  }
}

interface GooglePayClient {
  isReadyToPay(request: Record<string, unknown>): Promise<{ result: boolean }>;
  loadPaymentData(request: Record<string, unknown>): Promise<{
    paymentMethodData: {
      tokenizationData: { token: string };
    };
  }>;
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

/** Poll for a condition to become true */
function waitFor(fn: () => boolean, timeoutMs = 5000, intervalMs = 100): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fn()) return resolve();
    const start = Date.now();
    const timer = setInterval(() => {
      if (fn()) { clearInterval(timer); resolve(); }
      else if (Date.now() - start > timeoutMs) { clearInterval(timer); reject(new Error("Timed out waiting")); }
    }, intervalMs);
  });
}

type Props = {
  amount: number; // pounds
  pupilId?: string;
  instructorId?: string;
  customerName?: string;
  customerEmail?: string;
  onPaid?: () => void;
};

export function CardstreamCheckout({
  amount,
  pupilId,
  instructorId,
  customerName,
  customerEmail,
  onPaid,
}: Props) {
  const [paying, setPaying] = useState(false);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string>("");
  const [canGooglePay, setCanGooglePay] = useState(false);
  const googlePayClientRef = useRef<GooglePayClient | null>(null);

  // Hosted Fields state
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [gatewayUrl, setGatewayUrl] = useState<string>("");
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [cardFormReady, setCardFormReady] = useState(false);
  const cardFormRef = useRef<HTMLFormElement>(null);
  const hostedFormInstanceRef = useRef<any>(null);

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

  // Create payment intent for wallet payments
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("payment-intent-create", {
          body: { amount, pupilId, instructorId, customerName, customerEmail, currency: "GBP" },
        });
        if (cancelled) return;
        if (error || !data?.success) return;
        setOrderRef(data.orderRef);
        if (data.merchantId) setMerchantId(data.merchantId);
      } catch (e) {
        console.error("Payment intent creation error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [amount, pupilId, instructorId, customerName, customerEmail]);

  // Load jQuery + Hosted Fields SDK
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Load jQuery first
        await loadScript("https://code.jquery.com/jquery-3.7.1.min.js");
        await waitFor(() => !!window.jQuery, 5000);

        // Load Hosted Fields SDK
        await loadScript("https://gateway.cardstream.com/sdk/web/v1/js/hostedfields.min.js");
        await waitFor(() => !!window.hostedFields?.classes?.Form, 5000);

        if (!cancelled) setSdkReady(true);
      } catch (e: any) {
        console.error("Hosted Fields SDK load error:", e);
        if (!cancelled) setSdkError(e?.message || "Failed to load payment SDK");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Get signed form data from edge function
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ref = `ED-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback?provider=elavon&pupilId=${pupilId || ""}&ref=${ref}`;

        const { data, error } = await supabase.functions.invoke("elavon-checkout", {
          body: {
            amount,
            currency: "GBP",
            orderReference: ref,
            customerEmail: customerEmail || "",
            customerName: customerName || "",
            description: "Payment",
            returnUrl: `${window.location.origin}/booking-confirmation?pupilId=${pupilId || ""}&npi=success`,
            instructorId,
            pupilId,
            formResponsive: true,
            merchantName: "EveryDriver",
          },
        });

        if (cancelled) return;
        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Failed to prepare payment");

        setFormData(data.formData);
        setGatewayUrl(data.gatewayUrl);
      } catch (e: any) {
        console.error("Form data fetch error:", e);
        if (!cancelled) setSdkError(e?.message || "Failed to prepare payment form");
      }
    })();
    return () => { cancelled = true; };
  }, [amount, pupilId, instructorId, customerName, customerEmail]);

  // Initialize the SDK on the form once both SDK and form data are ready
  useEffect(() => {
    if (!sdkReady || !formData || !cardFormRef.current || cardFormReady) return;

    try {
      const Form = window.hostedFields?.classes?.Form;
      if (!Form) {
        setSdkError("Payment SDK not available");
        return;
      }

      // Create the hosted form instance — SDK auto-detects hostedfield: inputs
      // autoSetup: true  → auto-replaces hostedfield inputs with iframes
      // autoSubmit: false → we handle submission manually via payment-direct-sale
      const instance = new Form(cardFormRef.current, {
        autoSetup: true,
        autoSubmit: false,
        stylesheet: cardFormRef.current.querySelector('style.hostedfield'),
      });

      hostedFormInstanceRef.current = instance;
      setCardFormReady(true);
      console.log("Hosted Fields SDK initialized successfully");
    } catch (e: any) {
      console.error("Hosted Fields init error:", e);
      setSdkError(e?.message || "Failed to initialize card form");
    }
  }, [sdkReady, formData, cardFormReady]);

  // Retry initialization
  const handleRetry = useCallback(() => {
    setSdkError(null);
    setCardFormReady(false);
    setFormData(null);
    hostedFormInstanceRef.current = null;

    // Re-trigger form data fetch
    (async () => {
      try {
        const ref = `ED-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const { data, error } = await supabase.functions.invoke("elavon-checkout", {
          body: {
            amount,
            currency: "GBP",
            orderReference: ref,
            customerEmail: customerEmail || "",
            customerName: customerName || "",
            description: "Payment",
            returnUrl: `${window.location.origin}/booking-confirmation?pupilId=${pupilId || ""}&npi=success`,
            instructorId,
            pupilId,
            formResponsive: true,
            merchantName: "EveryDriver",
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || "Failed to prepare payment");
        setFormData(data.formData);
        setGatewayUrl(data.gatewayUrl);
      } catch (e: any) {
        setSdkError(e?.message || "Failed to prepare payment form");
      }
    })();
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
  const isLoading = !sdkReady || !formData;

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

      {/* Error state with retry */}
      {sdkError && (
        <div className="text-center space-y-2 py-4">
          <p className="text-sm text-destructive">{sdkError}</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {!sdkError && isLoading && (
        <div className="flex items-center justify-center py-6 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading secure card form…</span>
        </div>
      )}

      {/* Hosted Fields Card Form */}
      {!sdkError && formData && (
        <form
          ref={cardFormRef}
          action={gatewayUrl}
          method="POST"
          className="space-y-4"
        >
          {/* Hosted field styling — SDK reads <style class="hostedfield"> for iframe CSS */}
          <style className="hostedfield">{`
            body { margin: 0; padding: 0; }
            input {
              width: 100%;
              height: 44px;
              padding: 0 12px;
              border: 1px solid hsl(0 0% 80%);
              border-radius: 6px;
              font-size: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              color: hsl(0 0% 10%);
              background: hsl(0 0% 100%);
              box-sizing: border-box;
              outline: none;
              transition: border-color 0.15s ease;
            }
            input:focus {
              border-color: hsl(222.2 47.4% 51.2%);
              box-shadow: 0 0 0 2px hsla(222.2, 47.4%, 51.2%, 0.2);
            }
            input.hosted-field-invalid {
              border-color: hsl(0 84.2% 60.2%);
            }
          `}</style>

          {/* Hidden signed fields from the edge function */}
          {Object.entries(formData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

          {/* Card Number */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Card number
            </label>
            <div
              className="rounded-md border border-input bg-background overflow-hidden"
              style={{ minHeight: '48px' }}
            >
              <input
                type="hostedfield:cardNumber"
                className="w-full"
                placeholder="Card number"
                data-hostedfield-placeholder="Card number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Expiry Date */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Expiry date
              </label>
              <div
                className="rounded-md border border-input bg-background overflow-hidden"
                style={{ minHeight: '48px' }}
              >
                <input
                  type="hostedfield:cardExpiryDate"
                  className="w-full"
                  placeholder="MM / YY"
                  data-hostedfield-placeholder="MM / YY"
                />
              </div>
            </div>

            {/* CVV */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                CVV
              </label>
              <div
                className="rounded-md border border-input bg-background overflow-hidden"
                style={{ minHeight: '48px' }}
              >
                <input
                  type="hostedfield:cardCVV"
                  className="w-full"
                  placeholder="123"
                  data-hostedfield-placeholder="123"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={paying || !cardFormReady}
            className="w-full h-12"
          >
            {paying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing payment…
              </>
            ) : !cardFormReady ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Preparing…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                <CreditCard className="h-5 w-5 mr-2" />
                Pay £{amount.toFixed(2)}
              </>
            )}
          </Button>
        </form>
      )}

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4 text-emerald-600" />
        <span>Secured by Elavon — card details never touch our servers</span>
      </div>
    </div>
  );
}
