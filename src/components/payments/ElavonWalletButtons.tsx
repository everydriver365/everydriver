import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

import type { GooglePayClient } from "@/types/payment-types";

interface ElavonWalletButtonsProps {
  amount: number;
  pupilId: string;
  instructorId: string;
  instructorSlug: string;
  pupilName: string;
  pupilEmail: string | null;
  onProcessing: (processing: boolean) => void;
  onPaid?: () => void;
  disabled?: boolean;
}

export function ElavonWalletButtons({
  amount,
  pupilId,
  instructorId,
  instructorSlug,
  pupilName,
  pupilEmail,
  onProcessing,
  onPaid,
  disabled = false,
}: ElavonWalletButtonsProps) {
  const [loading, setLoading] = useState(true);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [processingWallet, setProcessingWallet] = useState<"apple" | "google" | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  const googlePayClientRef = useRef<GooglePayClient | null>(null);
  const googlePayButtonRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);

  // Check Apple Pay availability
  useEffect(() => {
    if (window.ApplePaySession?.canMakePayments?.()) {
      setApplePayAvailable(true);
    }
  }, []);

  // Fetch merchant ID from payment-intent-create config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("payment-intent-create", {
          body: { amount: 1, currency: "GBP" }, // minimal call to get merchantId
        });
        if (!error && data?.merchantId) {
          setMerchantId(data.merchantId);
        }
      } catch (err) {
        console.error("Failed to fetch merchant config:", err);
      }
    };
    fetchConfig();
  }, []);

  // Load Google Pay SDK and initialize
  useEffect(() => {
    if (!merchantId) return;
    mountedRef.current = true;

    const initGooglePay = async () => {
      // Load Google Pay SDK if not already loaded
      if (!window.google?.payments?.api) {
        const script = document.createElement("script");
        script.src = "https://pay.google.com/gp/p/js/pay.js";
        script.async = true;
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google Pay SDK"));
          document.head.appendChild(script);
        });
      }

      if (!mountedRef.current || !window.google?.payments?.api) return;

      const client = new window.google.payments.api.PaymentsClient({
        environment: "PRODUCTION",
      });

      const baseRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
          },
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY",
            parameters: {
              gateway: "cardstream",
              gatewayMerchantId: merchantId,
            },
          },
        }],
      };

      try {
        const { result } = await client.isReadyToPay(baseRequest);
        if (result && mountedRef.current) {
          googlePayClientRef.current = client;
          setGooglePayAvailable(true);

          // Create and attach Google Pay button
          if (googlePayButtonRef.current) {
            const button = client.createButton({
              onClick: () => handleGooglePay(),
              buttonColor: "black",
              buttonType: "pay",
              buttonSizeMode: "fill",
            });
            googlePayButtonRef.current.innerHTML = "";
            googlePayButtonRef.current.appendChild(button);
          }
        }
      } catch (err) {
        console.log("Google Pay not available:", err);
      }

      if (mountedRef.current) setLoading(false);
    };

    initGooglePay();

    return () => {
      mountedRef.current = false;
    };
  }, [merchantId]);

  // Also finish loading if no merchant ID after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  const createPaymentIntent = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("payment-intent-create", {
      body: {
        pupilId,
        instructorId,
        amount,
        currency: "GBP",
        customerName: pupilName,
        customerEmail: pupilEmail || undefined,
      },
    });
    if (error) throw error;
    return data;
  }, [amount, pupilId, instructorId, pupilName, pupilEmail]);

  const processDirectSale = useCallback(async (
    orderRef: string,
    method: "apple_pay" | "google_pay",
    token: string
  ) => {
    const body: Record<string, unknown> = {
      orderRef,
      method,
      customerName: pupilName,
      customerEmail: pupilEmail || undefined,
    };

    if (method === "apple_pay") {
      body.applePayPaymentToken = token;
    } else {
      body.googlePayPaymentToken = token;
    }

    const { data, error } = await supabase.functions.invoke("payment-direct-sale", { body });
    if (error) throw error;
    return data;
  }, [pupilName, pupilEmail]);

  const handleGooglePay = useCallback(async () => {
    if (!googlePayClientRef.current || !merchantId || amount <= 0) return;
    
    setProcessingWallet("google");
    onProcessing(true);

    try {
      const intent = await createPaymentIntent();

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
          },
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
        merchantInfo: {
          merchantName: "EveryDriver",
        },
      };

      const paymentData = await googlePayClientRef.current.loadPaymentData(paymentDataRequest);
      const token = paymentData.paymentMethodData.tokenizationData.token;

      const result = await processDirectSale(intent.orderRef, "google_pay", token);

      if (result?.success) {
        if (onPaid) {
          onPaid();
        } else {
          const baseUrl = window.location.origin;
          window.location.href = `${baseUrl}/i/${instructorSlug}?payment=success&amount=${amount}`;
        }
      } else {
        throw new Error(result?.responseMessage || "Payment failed");
      }
    } catch (err) {
      console.error("Google Pay error:", err);
      const message = err instanceof Error ? err.message : "Payment failed";
      if (!message.includes("cancel") && !message.includes("CANCELED")) {
        toast({ title: "Payment failed", description: message, variant: "destructive" });
      }
      setProcessingWallet(null);
      onProcessing(false);
    }
  }, [amount, merchantId, createPaymentIntent, processDirectSale, onPaid, instructorSlug, onProcessing]);

  const handleApplePay = useCallback(async () => {
    if (!window.ApplePaySession || amount <= 0) return;

    setProcessingWallet("apple");
    onProcessing(true);

    try {
      const intent = await createPaymentIntent();

      const session = new window.ApplePaySession!(6, {
        countryCode: "GB",
        currencyCode: "GBP",
        supportedNetworks: ["visa", "masterCard", "amex"],
        merchantCapabilities: ["supports3DS"],
        total: { label: "EveryDriver", amount: amount.toFixed(2) },
      });

      session.onvalidatemerchant = async (event) => {
        try {
          const { data, error } = await supabase.functions.invoke("applepay-validate-merchant", {
            body: { validationURL: event.validationURL },
          });
          if (error) throw error;
          session.completeMerchantValidation(data);
        } catch (err) {
          console.error("Apple Pay merchant validation error:", err);
          session.completePayment(1); // STATUS_FAILURE
          setProcessingWallet(null);
          onProcessing(false);
        }
      };

      session.onpaymentauthorized = async (event) => {
        try {
          const tokenStr = JSON.stringify(event.payment.token);
          const result = await processDirectSale(intent.orderRef, "apple_pay", tokenStr);

          if (result?.success) {
            session.completePayment(0); // STATUS_SUCCESS
            if (onPaid) {
              onPaid();
            } else {
              const baseUrl = window.location.origin;
              window.location.href = `${baseUrl}/i/${instructorSlug}?payment=success&amount=${amount}`;
            }
          } else {
            session.completePayment(1);
            throw new Error(result?.responseMessage || "Payment failed");
          }
        } catch (err) {
          console.error("Apple Pay authorization error:", err);
          session.completePayment(1);
          const message = err instanceof Error ? err.message : "Payment failed";
          toast({ title: "Payment failed", description: message, variant: "destructive" });
          setProcessingWallet(null);
          onProcessing(false);
        }
      };

      session.oncancel = () => {
        setProcessingWallet(null);
        onProcessing(false);
      };

      session.begin();
    } catch (err) {
      console.error("Apple Pay error:", err);
      toast({ title: "Payment failed", description: err instanceof Error ? err.message : "Apple Pay failed", variant: "destructive" });
      setProcessingWallet(null);
      onProcessing(false);
    }
  }, [amount, createPaymentIntent, processDirectSale, onPaid, instructorSlug, onProcessing]);

  // Don't render if loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Checking wallet availability...</span>
      </div>
    );
  }

  // Don't render if neither wallet is available
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
              onClick={handleApplePay}
              disabled={disabled || !!processingWallet || amount <= 0}
              className="w-full h-[44px] rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
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

        {googlePayAvailable && (
          <div
            ref={googlePayButtonRef}
            className={`min-h-[44px] [&>button]:!w-full [&>button]:!h-[44px] ${disabled || processingWallet ? "opacity-50 pointer-events-none" : ""}`}
          />
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
