import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SelectedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ElavonBookingWalletButtonsProps {
  amount: number;
  instructorId: string;
  pupilName: string;
  pupilEmail: string;
  pupilPhone: string;
  pupilAddress: string;
  pupilPostcode: string;
  courseType: string;
  courseHours: number;
  totalPrice: number;
  slots: SelectedSlot[];
  upsells?: { id: string; price: number }[];
  onSuccess: (pupilId: string) => void;
  onProcessing: (processing: boolean) => void;
  disabled?: boolean;
  // Optional: if booking is already created, pass pupilId to skip re-creation
  existingPupilId?: string | null;
  // Optional: for deposit support
  paymentOption?: 'full' | 'deposit';
  depositAmount?: number;
  depositEnabled?: boolean;
  // Booking creation function (from parent)
  ensureBookingCreated?: (paymentType?: 'full' | 'deposit', amountPaid?: number) => Promise<string | null>;
  // Additional booking props
  differentPickup?: boolean;
  pickupAddress?: string;
  pickupPostcode?: string;
  pickupWhat3words?: string;
  hasSpecialNeeds?: boolean;
  specialNeeds?: string;
}

declare global {
  interface Window {
    google?: {
      payments: {
        api: {
          PaymentsClient: new (config: { environment: string }) => GooglePayClient;
        };
      };
    };
  }
}

interface GooglePayClient {
  isReadyToPay: (request: object) => Promise<{ result: boolean }>;
  createButton: (options: object) => HTMLElement;
  loadPaymentData: (request: object) => Promise<{ paymentMethodData: { tokenizationData: { token: string } } }>;
}

export function ElavonBookingWalletButtons({
  amount,
  instructorId,
  pupilName,
  pupilEmail,
  pupilPhone,
  pupilAddress,
  pupilPostcode,
  courseType,
  courseHours,
  totalPrice,
  slots,
  upsells = [],
  onSuccess,
  onProcessing,
  disabled = false,
  existingPupilId,
  ensureBookingCreated,
}: ElavonBookingWalletButtonsProps) {
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

  // Fetch merchant ID
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("payment-intent-create", {
          body: { amount: 1, currency: "GBP" },
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

  // Load Google Pay SDK
  useEffect(() => {
    if (!merchantId) return;
    mountedRef.current = true;

    const initGooglePay = async () => {
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
            parameters: { gateway: "cardstream", gatewayMerchantId: merchantId },
          },
        }],
      };

      try {
        const { result } = await client.isReadyToPay(baseRequest);
        if (result && mountedRef.current) {
          googlePayClientRef.current = client;
          setGooglePayAvailable(true);

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
    return () => { mountedRef.current = false; };
  }, [merchantId]);

  useEffect(() => {
    const timer = setTimeout(() => { if (loading) setLoading(false); }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  const getOrCreateBooking = useCallback(async (): Promise<string | null> => {
    if (existingPupilId) return existingPupilId;
    if (ensureBookingCreated) return ensureBookingCreated();

    // Fallback: create booking via edge function
    try {
      const { data, error } = await supabase.functions.invoke("create-booking", {
        body: {
          instructorId,
          pupilName: pupilName.trim(),
          pupilEmail: pupilEmail.trim(),
          pupilPhone: pupilPhone.trim(),
          pupilAddress: pupilAddress.trim(),
          pupilPostcode: pupilPostcode.trim().toUpperCase(),
          courseType,
          courseHours,
          totalPrice,
          slots: slots.map((slot) => ({
            date: format(slot.date, "yyyy-MM-dd"),
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
          })),
          paymentType: "full",
          amountPaid: totalPrice,
          upsells: upsells.map((u) => ({ id: u.id, price: u.price })),
        },
      });
      if (error) throw error;
      return data?.pupilId || null;
    } catch (err) {
      console.error("Booking creation error:", err);
      toast.error("Failed to create booking. Please try again.");
      return null;
    }
  }, [existingPupilId, ensureBookingCreated, instructorId, pupilName, pupilEmail, pupilPhone, pupilAddress, pupilPostcode, courseType, courseHours, totalPrice, slots, upsells]);

  const createPaymentIntent = useCallback(async (pupilId: string) => {
    const { data, error } = await supabase.functions.invoke("payment-intent-create", {
      body: {
        pupilId,
        instructorId,
        amount,
        currency: "GBP",
        customerName: pupilName.trim(),
        customerEmail: pupilEmail.trim() || undefined,
      },
    });
    if (error) throw error;
    return data;
  }, [amount, instructorId, pupilName, pupilEmail]);

  const processDirectSale = useCallback(async (
    orderRef: string,
    method: "apple_pay" | "google_pay",
    token: string
  ) => {
    const body: Record<string, unknown> = {
      orderRef,
      method,
      customerName: pupilName.trim(),
      customerEmail: pupilEmail.trim() || undefined,
    };
    if (method === "apple_pay") body.applePayPaymentToken = token;
    else body.googlePayPaymentToken = token;

    const { data, error } = await supabase.functions.invoke("payment-direct-sale", { body });
    if (error) throw error;
    return data;
  }, [pupilName, pupilEmail]);

  const handleGooglePay = useCallback(async () => {
    if (!googlePayClientRef.current || !merchantId || amount <= 0) return;

    setProcessingWallet("google");
    onProcessing(true);

    try {
      const pupilId = await getOrCreateBooking();
      if (!pupilId) { setProcessingWallet(null); onProcessing(false); return; }

      const intent = await createPaymentIntent(pupilId);

      const paymentData = await googlePayClientRef.current.loadPaymentData({
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
            parameters: { gateway: "cardstream", gatewayMerchantId: merchantId },
          },
        }],
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: amount.toFixed(2),
          currencyCode: "GBP",
          countryCode: "GB",
        },
        merchantInfo: { merchantName: "EveryDriver" },
      });

      const token = paymentData.paymentMethodData.tokenizationData.token;
      const result = await processDirectSale(intent.orderRef, "google_pay", token);

      if (result?.success) {
        toast.success("Payment successful!");
        onSuccess(pupilId);
      } else {
        throw new Error(result?.responseMessage || "Payment failed");
      }
    } catch (err) {
      console.error("Google Pay error:", err);
      const message = err instanceof Error ? err.message : "Payment failed";
      if (!message.includes("cancel") && !message.includes("CANCELED")) {
        toast.error(message);
      }
      setProcessingWallet(null);
      onProcessing(false);
    }
  }, [amount, merchantId, getOrCreateBooking, createPaymentIntent, processDirectSale, onSuccess, onProcessing]);

  const handleApplePay = useCallback(async () => {
    if (!window.ApplePaySession || amount <= 0) return;

    setProcessingWallet("apple");
    onProcessing(true);

    try {
      const pupilId = await getOrCreateBooking();
      if (!pupilId) { setProcessingWallet(null); onProcessing(false); return; }

      const intent = await createPaymentIntent(pupilId);

      const session = new window.ApplePaySession!(6, {
        countryCode: "GB",
        currencyCode: "GBP",
        supportedNetworks: ["visa", "masterCard", "amex"],
        merchantCapabilities: ["supports3DS"],
        total: { label: "EveryDriver", amount: amount.toFixed(2) },
      });

      session.onvalidatemerchant = async (event: { validationURL: string }) => {
        try {
          const { data, error } = await supabase.functions.invoke("applepay-validate-merchant", {
            body: { validationURL: event.validationURL },
          });
          if (error) throw error;
          session.completeMerchantValidation(data);
        } catch {
          session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
          setProcessingWallet(null);
          onProcessing(false);
        }
      };

      session.onpaymentauthorized = async (event: { payment: { token: unknown } }) => {
        try {
          const tokenStr = JSON.stringify(event.payment.token);
          const result = await processDirectSale(intent.orderRef, "apple_pay", tokenStr);

          if (result?.success) {
            session.completePayment(window.ApplePaySession!.STATUS_SUCCESS);
            toast.success("Payment successful!");
            onSuccess(pupilId);
          } else {
            session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
            throw new Error(result?.responseMessage || "Payment failed");
          }
        } catch (err) {
          session.completePayment(window.ApplePaySession!.STATUS_FAILURE);
          toast.error(err instanceof Error ? err.message : "Payment failed");
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
      toast.error(err instanceof Error ? err.message : "Apple Pay failed");
      setProcessingWallet(null);
      onProcessing(false);
    }
  }, [amount, getOrCreateBooking, createPaymentIntent, processDirectSale, onSuccess, onProcessing]);

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
