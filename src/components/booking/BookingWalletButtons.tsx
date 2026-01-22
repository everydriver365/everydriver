import { useEffect, useRef, useState } from "react";
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

interface BookingWalletButtonsProps {
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
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<SquarePayments>;
    };
  }
}

interface SquarePayments {
  applePay: (paymentRequest: PaymentRequest) => Promise<ApplePayButton | null>;
  googlePay: (paymentRequest: PaymentRequest) => Promise<GooglePayButton | null>;
  paymentRequest: (options: PaymentRequestOptions) => PaymentRequest;
}

interface PaymentRequest {
  update: (options: PaymentRequestOptions) => void;
}

interface PaymentRequestOptions {
  countryCode: string;
  currencyCode: string;
  total: {
    amount: string;
    label: string;
  };
}

interface WalletButton {
  attach: (selector: string) => Promise<void>;
  destroy: () => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
  addEventListener: (event: string, callback: () => void) => void;
}

type ApplePayButton = WalletButton;
type GooglePayButton = WalletButton;

export function BookingWalletButtons({
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
}: BookingWalletButtonsProps) {
  const [loading, setLoading] = useState(true);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [squareConfig, setSquareConfig] = useState<{ appId: string; locationId: string; environment: string } | null>(null);
  const [processingWallet, setProcessingWallet] = useState<"apple" | "google" | null>(null);
  
  const applePayRef = useRef<ApplePayButton | null>(null);
  const googlePayRef = useRef<GooglePayButton | null>(null);
  const paymentsRef = useRef<SquarePayments | null>(null);
  const paymentRequestRef = useRef<PaymentRequest | null>(null);
  const mountedRef = useRef(true);

  // Fetch Square config from edge function
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("square-wallet-config");
        if (error) throw error;
        if (data?.appId && data?.locationId) {
          setSquareConfig(data);
        }
      } catch (err) {
        console.error("Failed to fetch Square config:", err);
      }
    };
    fetchConfig();
  }, []);

  // Load Square SDK and initialize wallet buttons
  useEffect(() => {
    if (!squareConfig) return;

    mountedRef.current = true;

    const loadSquareSDK = async () => {
      // Check if SDK already loaded
        if (!window.Square) {
        const script = document.createElement("script");
          const env = (squareConfig.environment || "").toLowerCase();
          const isProduction = env === "production" || env === "prod";
          script.src = isProduction
            ? "https://web.squarecdn.com/v1/square.js"
            : "https://sandbox.web.squarecdn.com/v1/square.js";
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Square SDK"));
          document.head.appendChild(script);
        });
      }

      if (!mountedRef.current) return;

      try {
        const payments = await window.Square!.payments(squareConfig.appId, squareConfig.locationId);
        paymentsRef.current = payments;

        const paymentRequest = payments.paymentRequest({
          countryCode: "GB",
          currencyCode: "GBP",
          total: {
            amount: amount.toFixed(2),
            label: "Course Booking",
          },
        });
        paymentRequestRef.current = paymentRequest;

        // Try to initialize Apple Pay
        try {
          const applePay = await payments.applePay(paymentRequest);
          if (applePay && mountedRef.current) {
            applePayRef.current = applePay;
            await applePay.attach("#booking-apple-pay-button");
            setApplePayAvailable(true);
            
            applePay.addEventListener("click", async () => {
              if (processingWallet) return;
              await handleWalletPayment("apple", applePay);
            });
          }
        } catch (e) {
          console.log("Apple Pay not available:", e);
        }

        // Try to initialize Google Pay
        try {
          const googlePay = await payments.googlePay(paymentRequest);
          if (googlePay && mountedRef.current) {
            googlePayRef.current = googlePay;
            await googlePay.attach("#booking-google-pay-button");
            setGooglePayAvailable(true);
            
            googlePay.addEventListener("click", async () => {
              if (processingWallet) return;
              await handleWalletPayment("google", googlePay);
            });
          }
        } catch (e) {
          console.log("Google Pay not available:", e);
        }

        if (mountedRef.current) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Square SDK initialization error:", err);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadSquareSDK();

    return () => {
      mountedRef.current = false;
      applePayRef.current?.destroy().catch(() => {});
      googlePayRef.current?.destroy().catch(() => {});
    };
  }, [squareConfig]);

  // Update payment request when amount changes
  useEffect(() => {
    if (paymentRequestRef.current && amount > 0) {
      paymentRequestRef.current.update({
        countryCode: "GB",
        currencyCode: "GBP",
        total: {
          amount: amount.toFixed(2),
          label: "Course Booking",
        },
      });
    }
  }, [amount]);

  const handleWalletPayment = async (walletType: "apple" | "google", button: WalletButton) => {
    if (amount <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setProcessingWallet(walletType);
    onProcessing(true);

    try {
      const result = await button.tokenize();
      
      if (result.status !== "OK" || !result.token) {
        throw new Error(result.errors?.[0]?.message || "Payment cancelled");
      }

      // Send token to backend for processing + booking creation
      const { data, error } = await supabase.functions.invoke("square-booking-wallet-payment", {
        body: {
          token: result.token,
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
          slots: slots.map((slot) => ({
            date: format(slot.date, "yyyy-MM-dd"),
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration,
          })),
          walletType,
          upsells,
        },
      });

      if (error) throw error;

      if (data?.success && data?.pupilId) {
        toast.success("Payment successful!");
        onSuccess(data.pupilId);
      } else {
        throw new Error(data?.error || "Payment failed");
      }
    } catch (err) {
      console.error("Wallet payment error:", err);
      const message = err instanceof Error ? err.message : "Payment failed";
      if (!message.includes("cancelled")) {
        toast.error(message);
      }
      setProcessingWallet(null);
      onProcessing(false);
    }
  };

  // Don't render if Square config not available
  if (!squareConfig) return null;

  // Show loading state while SDK initializes
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

  // Always render the container divs so SDK can attach to them
  // The divs are hidden until wallet availability is confirmed
  return (
    <div className="space-y-2">
      {(applePayAvailable || googlePayAvailable) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <div className="h-px flex-1 bg-border" />
          <span>Express Checkout</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      <div className="grid gap-2">
        {/* Always render the button containers so SDK can attach - hide until available */}
        <div 
          id="booking-apple-pay-button" 
          className={`min-h-[44px] ${!applePayAvailable ? "hidden" : ""} ${disabled || processingWallet ? "opacity-50 pointer-events-none" : ""}`}
        />
        <div 
          id="booking-google-pay-button" 
          className={`min-h-[44px] ${!googlePayAvailable ? "hidden" : ""} ${disabled || processingWallet ? "opacity-50 pointer-events-none" : ""}`}
        />
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
